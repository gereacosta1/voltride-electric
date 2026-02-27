// netlify/functions/affirm-checkout.mjs

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      // CORS (si querés probar desde browser)
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST,OPTIONS",
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

  // Affirm: PUBLIC:PRIVATE
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

function ensureMerchantPublicKey(checkout, pubKey) {
  if (!checkout || typeof checkout !== "object") return checkout;

  const merchant = checkout.merchant && typeof checkout.merchant === "object"
    ? checkout.merchant
    : null;

  if (!merchant) return checkout;

  const current = String(merchant.public_api_key || merchant.publicApiKey || "").trim();
  if (current) return checkout;

  return {
    ...checkout,
    merchant: {
      ...merchant,
      public_api_key: pubKey,
    },
  };
}

export async function handler(event) {
  const startedAt = Date.now();
  const reqId = event.headers?.["x-nf-request-id"] || event.headers?.["x-request-id"] || null;

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
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "POST,OPTIONS",
          "access-control-allow-headers": "content-type",
          "cache-control": "no-store",
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

    const payload = parseJsonSafe(event.body);
    if (!payload) return json(400, { error: "Invalid JSON body" });

    const debug_id = payload.debug_id ? String(payload.debug_id).trim() : null;

    // ✅ Tu API interna recibe { checkout: {...} }
    let checkout = payload.checkout;

    if (!checkout || typeof checkout !== "object" || Array.isArray(checkout)) {
      return json(400, { error: "Missing checkout" });
    }

    if (!Array.isArray(checkout.items) || checkout.items.length === 0) {
      return json(400, { error: "Invalid checkout.items" });
    }

    const total = Number(checkout.total);
    if (!Number.isFinite(total) || total <= 0) return json(400, { error: "Invalid checkout.total" });

    const currency = String(checkout.currency || "USD").trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) return json(400, { error: "Invalid checkout.currency" });

    // ✅ Asegura merchant.public_api_key (evita errores raros en /checkout)
    checkout = ensureMerchantPublicKey(checkout, pub);

    console.log("[affirm-checkout] request", {
      reqId,
      debug_id,
      base,
      items_count: checkout.items.length,
      total,
      currency,
      has_billing: Boolean(checkout.billing),
      has_shipping: Boolean(checkout.shipping),
      has_merchant_public_api_key: Boolean(checkout?.merchant?.public_api_key),
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let res;
    try {
      // ✅ CORRECTO: a Affirm se manda EL CHECKOUT DIRECTO (NO wrapper)
      res = await fetch(`${base}/checkout`, {
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

    console.log("[affirm-checkout] response", {
      reqId,
      debug_id,
      status: res.status,
      ok: res.ok,
      duration_ms: Date.now() - startedAt,
      has_checkout_token: Boolean(data?.checkout_token),
      has_redirect_url: Boolean(data?.redirect_url),
      non_json: Boolean(data?._non_json),
    });

    if (!res.ok) {
      console.error("[affirm-checkout] error", {
        reqId,
        debug_id,
        status: res.status,
        details: data,
        duration_ms: Date.now() - startedAt,
      });

      return json(res.status, { error: "Affirm checkout failed", status: res.status, details: data });
    }

    return json(200, { ok: true, status: res.status, data });
  } catch (err) {
    const isAbort = err && (err.name === "AbortError" || String(err).includes("AbortError"));

    console.error("[affirm-checkout] fatal", {
      reqId: event.headers?.["x-nf-request-id"] || null,
      error: isAbort ? "Request timeout" : String(err?.message || err),
      duration_ms: Date.now() - startedAt,
    });

    return json(isAbort ? 504 : 500, { error: isAbort ? "Affirm request timeout" : "Server error" });
  }
}