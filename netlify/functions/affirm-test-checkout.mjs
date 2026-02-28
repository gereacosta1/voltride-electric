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

function getBasicAuthHeader(pub, priv) {
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

function hintFromStatus(status) {
  return status === 401 || status === 403 ? "AUTH_FAIL" : "AUTH_OK_OR_VALIDATION_FAIL";
}

export async function handler(event) {
  const startedAt = Date.now();
  const reqId =
    event.headers?.["x-nf-request-id"] ||
    event.headers?.["x-request-id"] ||
    null;

  try {
    if (event.httpMethod === "OPTIONS") return json(204, { ok: true });
    if (event.httpMethod !== "GET") return json(405, { error: "Method not allowed" });

    const base = normalizeAffirmBase(process.env.AFFIRM_BASE_URL);
    const { pub, priv } = getKeys();
    const auth = getBasicAuthHeader(pub, priv);

    const envCheck = {
      has_AFFIRM_BASE_URL: Boolean(String(process.env.AFFIRM_BASE_URL || "").trim()),
      has_AFFIRM_PUBLIC_KEY: Boolean(pub),
      has_AFFIRM_PRIVATE_KEY: Boolean(priv),
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

    const origin = "https://voltride.agency";

    const TEST_ADDRESS = {
      line1: "11510 Biscayne Blvd",
      city: "North Miami",
      state: "FL",
      zipcode: "33181",
      country_code: "US",
    };

    // Checkout payload (Direct)
    const checkoutDirect = {
      merchant: {
        name: "VOLTRIDE ELECTRIC LLC",
        user_confirmation_url: `${origin}/checkout/affirm/confirm`,
        user_cancel_url: `${origin}/checkout/affirm/cancel`,
        user_confirmation_url_action: "GET",
      },
      items: [
        {
          display_name: "Test Checkout Item",
          sku: "TEST-1",
          unit_price: 5000,
          qty: 1,
          item_url: `${origin}/`,
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
      metadata: { mode: "modal" },
    };

    // Defensivo por si alguien lo envuelve (no debería pasar acá, pero queda)
    const payload =
      checkoutDirect && typeof checkoutDirect === "object" && checkoutDirect.checkout
        ? checkoutDirect.checkout
        : checkoutDirect;

    const payloadTopKeys = Object.keys(payload || {});

    console.log("[affirm-test-checkout] request", {
      reqId,
      base,
      endpoint: `${base}/checkout/direct`,
      payloadTopKeys,
      total: payload?.total,
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let res;
    try {
      // ✅ ENDPOINT CORRECTO
      res = await fetch(`${base}/checkout/direct`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: auth,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const data = await readJsonOrText(res);

    console.log("[affirm-test-checkout] response", {
      reqId,
      status: res.status,
      ok: res.ok,
      has_checkout_token: Boolean(data?.checkout_token),
      has_redirect_url: Boolean(data?.redirect_url),
      affirm_code: data?.code || data?.details?.code || null,
      affirm_field: data?.field || data?.details?.field || null,
      duration_ms: Date.now() - startedAt,
    });

    return json(res.ok ? 200 : res.status, {
      ok: res.ok,
      envCheck,
      sent_payload_top_keys: payloadTopKeys,
      status: res.status,
      hint: hintFromStatus(res.status),
      data,
      duration_ms: Date.now() - startedAt,
    });
  } catch (err) {
    const isAbort =
      err && (err.name === "AbortError" || String(err).includes("AbortError"));

    console.error("[affirm-test-checkout] fatal", {
      reqId,
      error: isAbort ? "Request timeout" : String(err?.message || err),
      duration_ms: Date.now() - startedAt,
    });

    return json(isAbort ? 504 : 500, {
      ok: false,
      error: isAbort ? "Affirm request timeout" : String(err?.message || err),
    });
  }
}