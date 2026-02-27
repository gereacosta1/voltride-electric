// netlify/functions/affirm-health.mjs

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type",
    },
    body: JSON.stringify(body),
  };
}

function normalizeAffirmBase(raw) {
  const base = String(raw || "https://api.affirm.com").trim().replace(/\/+$/, "");
  if (base.endsWith("/api/v2")) return base;
  return `${base}/api/v2`;
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
    const { pub, priv } = getKeys();
    const auth = getBasicAuthHeader();

    const envCheck = {
      has_AFFIRM_BASE_URL: Boolean(String(process.env.AFFIRM_BASE_URL || "").trim()),
      has_AFFIRM_PUBLIC_KEY: Boolean(pub),
      has_AFFIRM_PRIVATE_KEY: Boolean(priv),
      affirm_public_key_preview: keyPreview(pub),
    };

    if (!auth) {
      return json(500, {
        ok: false,
        step: "env",
        envCheck,
        message: "Missing AFFIRM_PUBLIC_KEY or AFFIRM_PRIVATE_KEY in Netlify env vars",
      });
    }

    // ✅ Dirección real del negocio
    const STORE_ADDRESS = {
      line1: "11510 Biscayne Blvd",
      city: "North Miami",
      state: "FL",
      zipcode: "33181",
      country_code: "US",
    };

    // ✅ A Affirm se manda checkout DIRECTO (sin wrapper)
    const checkoutProbe = {
      merchant: {
        name: "VOLTRIDE ELECTRIC LLC",
        public_api_key: pub, // ayuda a detectar key incorrecta rápido
        user_confirmation_url: "https://voltride.agency/checkout/affirm/confirm",
        user_cancel_url: "https://voltride.agency/checkout/affirm/cancel",
        user_confirmation_url_action: "GET",
      },
      items: [
        {
          display_name: "Health Check Item",
          sku: "HEALTH-1",
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
        address: STORE_ADDRESS,
        email: "test@example.com",
      },
      shipping: {
        name: { first: "Test", last: "Buyer" },
        address: STORE_ADDRESS,
      },
      metadata: { mode: "modal" },
    };

    const resCheckout = await fetch(`${base}/checkout`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: auth,
      },
      body: JSON.stringify(checkoutProbe),
    });

    const checkoutData = await readJsonOrText(resCheckout);

    const resCharges = await fetch(`${base}/charges`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: auth,
      },
      body: JSON.stringify({
        checkout_token: "dummy",
        order_id: "ORDER-HEALTH",
        amount: 5000,
        currency: "USD",
        capture: false,
      }),
    });

    const chargesData = await readJsonOrText(resCharges);

    const hint = (status) =>
      status === 401 || status === 403 ? "AUTH_FAIL" : "AUTH_OK_OR_VALIDATION_FAIL";

    return json(200, {
      ok: true,
      envCheck,
      base,
      probes: {
        checkout: {
          status: resCheckout.status,
          ok: resCheckout.ok,
          hint: hint(resCheckout.status),
          data: checkoutData,
        },
        charges: {
          status: resCharges.status,
          ok: resCharges.ok,
          hint: hint(resCharges.status),
          data: chargesData,
        },
      },
    });
  } catch (err) {
    return json(500, { ok: false, error: String(err?.message || err) });
  }
}