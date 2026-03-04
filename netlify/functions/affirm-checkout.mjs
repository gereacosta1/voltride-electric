// netlify/functions/affirm-checkout.mjs

function json(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      // CORS
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST,OPTIONS",
      "access-control-allow-headers":
        "content-type,authorization,x-request-id,x-nf-request-id",
      "access-control-expose-headers": "x-request-id,x-nf-request-id",
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  };
}

function normalizeAffirmBase(raw) {
  // Normalize to "https://api.affirm.com/api/v2" (no trailing slash)
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

function parseJsonSafe(raw) {
  try {
    return JSON.parse(raw || "{}");
  } catch {
    return null;
  }
}

async function readJsonOrText(res) {
  const ct = String(res.headers.get("content-type") || "").toLowerCase();
  if (ct.includes("application/json")) return await res.json().catch(() => ({}));
  const text = await res.text().catch(() => "");
  return { _non_json: true, text };
}

// Force server public key (don’t trust browser)
function forceMerchantPublicKey(checkout, pubKey) {
  if (!checkout || typeof checkout !== "object" || Array.isArray(checkout)) return checkout;

  const merchant =
    checkout.merchant && typeof checkout.merchant === "object" && !Array.isArray(checkout.merchant)
      ? checkout.merchant
      : {};

  // remove alternative fields to avoid conflicts
  const { publicApiKey, public_api_key, public_key, ...merchantRest } = merchant;

  return {
    ...checkout,
    merchant: {
      ...merchantRest,
      // Affirm error field is "merchant.public_api_key"
      public_api_key: pubKey,
    },
  };
}

function pickTokenAndRedirect(data) {
  const checkout_token =
    (data && typeof data === "object" && (data.checkout_token || data?.data?.checkout_token)) || "";
  const redirect_url =
    (data && typeof data === "object" && (data.redirect_url || data?.data?.redirect_url)) || "";

  return {
    checkout_token: String(checkout_token || "").trim(),
    redirect_url: String(redirect_url || "").trim(),
  };
}

export async function handler(event) {
  const startedAt = Date.now();
  const reqId =
    event.headers?.["x-nf-request-id"] || event.headers?.["x-request-id"] || null;

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
          "access-control-expose-headers": "x-request-id,x-nf-request-id",
        },
        body: "",
      };
    }

    if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

    const auth = getBasicAuthHeader();
    const { pub } = getKeys();

    if (!auth || !pub) {
      return json(500, { error: "Missing AFFIRM_PUBLIC_KEY or AFFIRM_PRIVATE_KEY" });
    }

    const base = normalizeAffirmBase(process.env.AFFIRM_BASE_URL);
    const endpoint = `${base}/checkout/direct`; // ✅ use direct consistently

    const payload = parseJsonSafe(event.body);
    if (!payload) return json(400, { error: "Invalid JSON body" });

    const debug_id = payload.debug_id ? String(payload.debug_id).trim() : null;

    let checkout = payload.checkout;

    if (!checkout || typeof checkout !== "object" || Array.isArray(checkout)) {
      return json(400, { error: "Missing checkout" });
    }

    if (!Array.isArray(checkout.items) || checkout.items.length === 0) {
      return json(400, { error: "Invalid checkout.items" });
    }

    const total = Number(checkout.total);
    if (!Number.isFinite(total) || total <= 0) {
      return json(400, { error: "Invalid checkout.total" });
    }

    const currency = String(checkout.currency || "USD").trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) {
      return json(400, { error: "Invalid checkout.currency" });
    }

    // ✅ always force correct public_api_key from server env
    checkout = forceMerchantPublicKey(checkout, pub);

    console.log("[affirm-checkout] request", {
      reqId,
      debug_id,
      endpoint,
      items_count: checkout.items.length,
      total,
      currency,
      has_billing: Boolean(checkout.billing),
      has_shipping: Boolean(checkout.shipping),
      has_merchant_public_api_key: Boolean(checkout?.merchant?.public_api_key),
      has_user_confirmation_url: Boolean(checkout?.merchant?.user_confirmation_url),
      has_user_cancel_url: Boolean(checkout?.merchant?.user_cancel_url),
      user_confirmation_url_action: checkout?.merchant?.user_confirmation_url_action || null,
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
        // send checkout as a plain object (no wrapper)
        body: JSON.stringify(checkout),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const data = await readJsonOrText(res);
    const { checkout_token, redirect_url } = pickTokenAndRedirect(data);

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
    });

    if (!res.ok) {
      console.error("[affirm-checkout] error", {
        reqId,
        debug_id,
        status: res.status,
        details: data,
        duration_ms: Date.now() - startedAt,
      });

      return json(res.status, {
        ok: false,
        error: "Affirm checkout failed",
        status: res.status,
        reqId,
        debug_id,
        details: data,
      });
    }

    return json(200, { ok: true, status: res.status, reqId, debug_id, data });
  } catch (err) {
    const isAbort = err && (err.name === "AbortError" || String(err).includes("AbortError"));

    console.error("[affirm-checkout] fatal", {
      reqId: event.headers?.["x-nf-request-id"] || null,
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