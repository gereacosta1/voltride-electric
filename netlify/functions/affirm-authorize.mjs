// netlify/functions/affirm-authorize.mjs

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
  // If someone set "https://api.affirm.com/api/v2/" or "https://api.affirm.com"
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

export async function handler(event) {
  const startedAt = Date.now();
  const reqId =
    event.headers?.["x-nf-request-id"] || event.headers?.["x-request-id"] || null;

  console.log("[affirm-authorize] incoming", {
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
    if (!auth) {
      return json(500, { error: "Missing AFFIRM_PUBLIC_KEY or AFFIRM_PRIVATE_KEY" });
    }

    const base = normalizeAffirmBase(process.env.AFFIRM_BASE_URL);

    const body = parseJsonSafe(event.body);
    if (!body) return json(400, { error: "Invalid JSON body" });

    const debug_id = body.debug_id ? String(body.debug_id).trim() : null;

    const checkout_token = String(body.checkout_token || "").trim();
    const order_id = String(body.order_id || "").trim();
    const amount_cents_raw = body.amount_cents;
    const currency = String(body.currency || "USD").trim().toUpperCase();
    const capture = body.capture !== false;

    if (!checkout_token) return json(400, { error: "Missing checkout_token" });
    if (!order_id) return json(400, { error: "Missing order_id" });

    const amount = Math.round(Number(amount_cents_raw));
    if (!Number.isFinite(amount) || amount <= 0) return json(400, { error: "Invalid amount_cents" });

    if (!/^[A-Z]{3}$/.test(currency)) return json(400, { error: "Invalid currency" });

    const endpoint = `${base}/charges`;

    console.log("[affirm-authorize] request", {
      reqId,
      debug_id,
      endpoint,
      order_id,
      amount_cents: amount,
      currency,
      capture,
      token_prefix: checkout_token ? checkout_token.slice(0, 8) + "…" : null,
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
        body: JSON.stringify({ checkout_token, order_id, amount, currency, capture }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const data = await readJsonOrText(res);

    const affirmId =
      (data && typeof data === "object" && (data.id || data.charge_id)) || null;

    console.log("[affirm-authorize] response", {
      reqId,
      debug_id,
      status: res.status,
      ok: res.ok,
      duration_ms: Date.now() - startedAt,
      affirm_id: affirmId,
      non_json: Boolean(data?._non_json),
    });

    if (!res.ok) {
      console.error("[affirm-authorize] error", {
        reqId,
        debug_id,
        status: res.status,
        details: data,
        duration_ms: Date.now() - startedAt,
      });

      return json(res.status, {
        ok: false,
        error: "Affirm authorize failed",
        status: res.status,
        reqId,
        debug_id,
        details: data,
      });
    }

    return json(200, { ok: true, status: res.status, reqId, debug_id, data });
  } catch (err) {
    const isAbort = err && (err.name === "AbortError" || String(err).includes("AbortError"));

    console.error("[affirm-authorize] fatal", {
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