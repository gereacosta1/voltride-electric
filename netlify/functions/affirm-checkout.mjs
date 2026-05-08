// netlify/functions/affirm-checkout.mjs

function json(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST,OPTIONS",
      "access-control-allow-headers":
        "content-type,authorization,x-request-id,x-nf-request-id",
      "access-control-expose-headers": "x-request-id,x-nf-request-id,x-affirm-request-id",
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  };
}

function normalizeAffirmBase(raw) {
  const env = String(process.env.AFFIRM_ENV || process.env.VITE_AFFIRM_ENV || "prod")
    .trim()
    .toLowerCase();

  const defaultBase =
    env === "sandbox" || env === "test"
      ? "https://sandbox.affirm.com"
      : "https://api.affirm.com";

  const base = String(raw || defaultBase).trim().replace(/\/+$/, "");

  if (base.endsWith("/api/v2")) return base;
  return `${base}/api/v2`;
}

function getKeys() {
  const pub = String(
    process.env.AFFIRM_PUBLIC_KEY ||
      process.env.AFFIRM_PUBLIC_API_KEY ||
      process.env.VITE_AFFIRM_PUBLIC_KEY ||
      ""
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

function parseJsonSafe(raw) {
  try {
    return JSON.parse(raw || "{}");
  } catch {
    return null;
  }
}

async function readJsonOrText(res) {
  const ct = String(res.headers.get("content-type") || "").toLowerCase();

  if (ct.includes("application/json")) {
    return await res.json().catch(() => ({}));
  }

  const text = await res.text().catch(() => "");
  return { _non_json: true, text };
}

function stripMerchantPublicKey(checkout) {
  if (!checkout || typeof checkout !== "object" || Array.isArray(checkout)) {
    return checkout;
  }

  const merchant =
    checkout.merchant &&
    typeof checkout.merchant === "object" &&
    !Array.isArray(checkout.merchant)
      ? checkout.merchant
      : {};

  const { publicApiKey, public_api_key, public_key, ...merchantRest } = merchant;

  return {
    ...checkout,
    merchant: merchantRest,
  };
}

function pickTokenAndRedirect(data) {
  const checkout_token =
    data?.checkout_token ||
    data?.data?.checkout_token ||
    data?.token ||
    data?.data?.token ||
    "";

  const redirect_url =
    data?.redirect_url ||
    data?.data?.redirect_url ||
    data?.redirect ||
    data?.data?.redirect ||
    "";

  return {
    checkout_token: String(checkout_token || "").trim(),
    redirect_url: String(redirect_url || "").trim(),
  };
}

function validateCheckout(checkout) {
  if (!checkout || typeof checkout !== "object" || Array.isArray(checkout)) {
    return "Missing checkout";
  }

  if (!checkout.merchant || typeof checkout.merchant !== "object") {
    return "Missing checkout.merchant";
  }

  if (!checkout.merchant.user_confirmation_url) {
    return "Missing merchant.user_confirmation_url";
  }

  if (!checkout.merchant.user_cancel_url) {
    return "Missing merchant.user_cancel_url";
  }

  if (!Array.isArray(checkout.items) || checkout.items.length === 0) {
    return "Invalid checkout.items";
  }

  const total = Number(checkout.total);
  if (!Number.isFinite(total) || total <= 0) {
    return "Invalid checkout.total";
  }

  const currency = String(checkout.currency || "USD").trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) {
    return "Invalid checkout.currency";
  }

  return null;
}

export async function handler(event) {
  const startedAt = Date.now();

  const reqId =
    event.headers?.["x-nf-request-id"] ||
    event.headers?.["x-request-id"] ||
    event.headers?.["X-Nf-Request-Id"] ||
    null;

  console.log("[affirm-checkout] incoming", {
    reqId,
    method: event.httpMethod,
    path: event.path,
    hasBody: Boolean(event.body),
  });

  try {
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 204,
        headers: {
          "cache-control": "no-store",
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "POST,OPTIONS",
          "access-control-allow-headers":
            "content-type,authorization,x-request-id,x-nf-request-id",
          "access-control-expose-headers":
            "x-request-id,x-nf-request-id,x-affirm-request-id",
        },
        body: "",
      };
    }

    if (event.httpMethod !== "POST") {
      return json(405, { ok: false, error: "Method not allowed" });
    }

    const auth = getBasicAuthHeader();
    const { pub, priv } = getKeys();

    if (!auth || !pub || !priv) {
      return json(500, {
        ok: false,
        error: "Missing AFFIRM_PUBLIC_KEY or AFFIRM_PRIVATE_KEY",
        has_public_key: Boolean(pub),
        has_private_key: Boolean(priv),
      });
    }

    const payload = parseJsonSafe(event.body);

    if (!payload) {
      return json(400, {
        ok: false,
        error: "Invalid JSON body",
      });
    }

    const debug_id = payload.debug_id ? String(payload.debug_id).trim() : null;

    let checkout = payload.checkout;
    const validationError = validateCheckout(checkout);

    if (validationError) {
      return json(400, {
        ok: false,
        error: validationError,
        debug_id,
      });
    }

    checkout = stripMerchantPublicKey(checkout);

    const base = normalizeAffirmBase(process.env.AFFIRM_BASE_URL);
    const endpoint = `${base}/checkout/direct`;
    const total = Number(checkout.total);
    const currency = String(checkout.currency || "USD").trim().toUpperCase();

    console.log("[affirm-checkout] request", {
      reqId,
      debug_id,
      endpoint,
      items_count: checkout.items.length,
      total,
      currency,
      has_public_key: Boolean(pub),
      has_private_key: Boolean(priv),
      public_key_prefix: pub ? `${pub.slice(0, 8)}...` : null,
      has_billing: Boolean(checkout.billing),
      has_shipping: Boolean(checkout.shipping),
      has_merchant_public_api_key: Boolean(checkout?.merchant?.public_api_key),
      has_user_confirmation_url: Boolean(checkout?.merchant?.user_confirmation_url),
      has_user_cancel_url: Boolean(checkout?.merchant?.user_cancel_url),
      user_confirmation_url_action:
        checkout?.merchant?.user_confirmation_url_action || null,
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let res;

    try {
      res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: auth,
        },
        body: JSON.stringify(checkout),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const data = await readJsonOrText(res);
    const { checkout_token, redirect_url } = pickTokenAndRedirect(data);

    const affirmRequestId =
      res.headers.get("x-request-id") ||
      res.headers.get("request-id") ||
      res.headers.get("x-affirm-request-id") ||
      null;

    console.log("[affirm-checkout] response", {
      reqId,
      debug_id,
      status: res.status,
      ok: res.ok,
      duration_ms: Date.now() - startedAt,
      has_checkout_token: Boolean(checkout_token),
      has_redirect_url: Boolean(redirect_url),
      non_json: Boolean(data?._non_json),
      affirm_code: data?.code || data?.details?.code || null,
      affirm_field: data?.field || data?.details?.field || null,
      affirm_request_id: affirmRequestId,
    });

    if (!res.ok) {
      console.error("[affirm-checkout] error", {
        reqId,
        debug_id,
        status: res.status,
        affirm_request_id: affirmRequestId,
        details: data,
        duration_ms: Date.now() - startedAt,
      });

      return json(
        res.status,
        {
          ok: false,
          error: "Affirm checkout failed",
          status: res.status,
          reqId,
          debug_id,
          affirm_request_id: affirmRequestId,
          details: data,
        },
        affirmRequestId ? { "x-affirm-request-id": affirmRequestId } : {}
      );
    }

    return json(
      200,
      {
        ok: true,
        status: res.status,
        reqId,
        debug_id,
        affirm_request_id: affirmRequestId,
        checkout_token,
        redirect_url,
        data,
      },
      affirmRequestId ? { "x-affirm-request-id": affirmRequestId } : {}
    );
  } catch (err) {
    const isAbort =
      err && (err.name === "AbortError" || String(err).includes("AbortError"));

    console.error("[affirm-checkout] fatal", {
      reqId,
      error: isAbort ? "Request timeout" : String(err?.message || err),
      duration_ms: Date.now() - startedAt,
    });

    return json(isAbort ? 504 : 500, {
      ok: false,
      error: isAbort ? "Affirm request timeout" : "Server error",
      reqId,
    });
  }
}