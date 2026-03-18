// netlify/functions/affirm-health.mjs

function json(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers":
        "content-type,authorization,x-request-id,x-nf-request-id",
      "access-control-expose-headers": "x-request-id,x-nf-request-id,x-affirm-request-id",
      ...extraHeaders,
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
  return `${s.slice(0, 6)}…${s.slice(-4)}`;
}

async function readJsonOrText(res) {
  const ct = String(res.headers.get("content-type") || "").toLowerCase();
  if (ct.includes("application/json")) return await res.json().catch(() => ({}));
  const text = await res.text().catch(() => "");
  return { _non_json: true, text };
}

function pickAffirmRequestId(res) {
  return (
    res.headers.get("x-request-id") ||
    res.headers.get("request-id") ||
    res.headers.get("x-affirm-request-id") ||
    null
  );
}

function probeHint(status) {
  return status === 401 || status === 403
    ? "AUTH_FAIL"
    : "AUTH_OK_OR_VALIDATION_FAIL";
}

export async function handler(event) {
  const reqId =
    event.headers?.["x-nf-request-id"] || event.headers?.["x-request-id"] || null;

  try {
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 204,
        headers: {
          "cache-control": "no-store",
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "GET,POST,OPTIONS",
          "access-control-allow-headers":
            "content-type,authorization,x-request-id,x-nf-request-id",
          "access-control-expose-headers": "x-request-id,x-nf-request-id,x-affirm-request-id",
        },
        body: "",
      };
    }

    if (event.httpMethod !== "GET") {
      return json(405, { ok: false, error: "Method not allowed" });
    }

    const base = normalizeAffirmBase(process.env.AFFIRM_BASE_URL);
    const { pub, priv } = getKeys();
    const auth = getBasicAuthHeader();

    const envCheck = {
      has_AFFIRM_BASE_URL: Boolean(String(process.env.AFFIRM_BASE_URL || "").trim()),
      has_AFFIRM_PUBLIC_KEY: Boolean(pub),
      has_AFFIRM_PRIVATE_KEY: Boolean(priv),
      affirm_public_key_preview: keyPreview(pub),
      affirm_private_key_preview: keyPreview(priv),
      affirm_base_url_effective: base,
    };

    if (!auth) {
      return json(500, {
        ok: false,
        step: "env",
        reqId,
        envCheck,
        message: "Missing AFFIRM_PUBLIC_KEY or AFFIRM_PRIVATE_KEY in Netlify env vars",
      });
    }

    const STORE_ADDRESS = {
      line1: "11510 Biscayne Blvd",
      city: "North Miami",
      state: "FL",
      zipcode: "33181",
      country_code: "US",
    };

    // Direct checkout probe: send checkout object directly, without wrapping in { checkout: ... }
    // Also do NOT include merchant.public_api_key in body.
    const checkoutProbe = {
      merchant: {
        name: "VOLTRIDE ELECTRIC LLC",
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

    const resCheckout = await fetch(`${base}/checkout/direct`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: auth,
      },
      body: JSON.stringify(checkoutProbe),
    });

    const checkoutData = await readJsonOrText(resCheckout);
    const checkoutAffirmRequestId = pickAffirmRequestId(resCheckout);

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
    const chargesAffirmRequestId = pickAffirmRequestId(resCharges);

    return json(200, {
      ok: true,
      reqId,
      envCheck,
      probes: {
        checkout: {
          status: resCheckout.status,
          ok: resCheckout.ok,
          hint: probeHint(resCheckout.status),
          affirm_request_id: checkoutAffirmRequestId,
          data: checkoutData,
        },
        charges: {
          status: resCharges.status,
          ok: resCharges.ok,
          hint: probeHint(resCharges.status),
          affirm_request_id: chargesAffirmRequestId,
          data: chargesData,
        },
      },
    });
  } catch (err) {
    return json(500, {
      ok: false,
      reqId,
      error: String(err?.message || err),
    });
  }
}