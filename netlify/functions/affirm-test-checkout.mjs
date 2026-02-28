// netlify/functions/affirm-test-checkout.mjs
function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,OPTIONS",
      "access-control-allow-headers": "content-type",
    },
    body: JSON.stringify(body),
  };
}

function normalizeAffirmBase(raw) {
  const base = String(raw || "https://api.affirm.com").trim().replace(/\/+$/, "");
  return base.endsWith("/api/v2") ? base : `${base}/api/v2`;
}

function getKeys() {
  const pub = String(
    process.env.AFFIRM_PUBLIC_KEY || process.env.AFFIRM_PUBLIC_API_KEY || ""
  ).trim();
  const priv = String(
    process.env.AFFIRM_PRIVATE_KEY || process.env.AFFIRM_PRIVATE_API_KEY || ""
  ).trim();
  return { pub, priv };
}

function getBasicAuthHeader() {
  const { pub, priv } = getKeys();
  if (!pub || !priv) return null;
  return "Basic " + Buffer.from(`${pub}:${priv}`).toString("base64");
}

function keyPreview(k) {
  const s = String(k || "").trim();
  if (!s) return "";
  return s.slice(0, 6) + "…" + s.slice(-4);
}

async function readJsonOrText(res) {
  const ct = String(res.headers.get("content-type") || "").toLowerCase();
  if (ct.includes("application/json")) return await res.json().catch(() => ({}));
  const text = await res.text().catch(() => "");
  return { _non_json: true, text };
}

export async function handler(event) {
  try {
    if (event.httpMethod === "OPTIONS") return json(204, { ok: true });
    if (event.httpMethod !== "GET") return json(405, { error: "Method not allowed" });

    const base = normalizeAffirmBase(process.env.AFFIRM_BASE_URL);
    const { pub } = getKeys();
    const auth = getBasicAuthHeader();

    const envCheck = {
      has_AFFIRM_BASE_URL: Boolean(String(process.env.AFFIRM_BASE_URL || "").trim()),
      has_AFFIRM_PUBLIC_KEY: Boolean(pub),
      has_AFFIRM_PRIVATE_KEY: Boolean(Boolean(getKeys().priv)),
      affirm_public_key_preview: keyPreview(pub),
      affirm_base_url_effective: base,
    };

    if (!auth) {
      return json(500, {
        ok: false,
        step: "env",
        envCheck,
        message: "Missing AFFIRM_PUBLIC_KEY or AFFIRM_PRIVATE_KEY in Netlify env vars",
      });
    }

    // Datos hardcode para prueba (no UI)
    const TEST_ADDRESS = {
      line1: "11510 Biscayne Blvd",
      city: "North Miami",
      state: "FL",
      zipcode: "33181",
      country_code: "US",
    };

    const checkout = {
      merchant: {
        name: "VOLTRIDE ELECTRIC LLC",
        user_confirmation_url: "https://voltride.agency/checkout/affirm/confirm",
        user_cancel_url: "https://voltride.agency/checkout/affirm/cancel",
        user_confirmation_url_action: "GET",
        // ✅ forzamos public_api_key siempre en server
        public_api_key: pub,
      },
      items: [
        {
          display_name: "Test Checkout Item",
          sku: "TEST-1",
          unit_price: 5000,
          qty: 1,
          item_url: "https://voltride.agency/",
        },
      ],
      currency: "USD",
      shipping_amount: 0,
      tax_amount: 0,
      total: 5000,
      billing: {
        name: { first: "Test", last: "Buyer" },
        address: TEST_ADDRESS,
        email: "test@example.com",
      },
      shipping: {
        name: { first: "Test", last: "Buyer" },
        address: TEST_ADDRESS,
      },
      metadata: { mode: "modal" },
    };

    const res = await fetch(`${base}/checkout`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: auth,
      },
      body: JSON.stringify(checkout),
    });

    const data = await readJsonOrText(res);

    return json(res.ok ? 200 : res.status, {
      ok: res.ok,
      envCheck,
      status: res.status,
      hint: res.status === 401 || res.status === 403 ? "AUTH_FAIL" : "AUTH_OK_OR_VALIDATION_FAIL",
      // Si está ok, acá debería venir checkout_token / redirect_url
      data,
    });
  } catch (err) {
    return json(500, { ok: false, error: String(err?.message || err) });
  }
}