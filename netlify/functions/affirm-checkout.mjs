// netlify/functions/affirm-checkout.mjs
function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
    body: JSON.stringify(body),
  };
}

function getBasicAuthHeader() {
  const priv = process.env.AFFIRM_PRIVATE_KEY || process.env.AFFIRM_PRIVATE_API_KEY;
  if (!priv) return null;

  // Lo más común: private key como user y password vacío
  return "Basic " + Buffer.from(`${priv}:`).toString("base64");
}

function parseJsonSafe(raw) {
  try {
    return JSON.parse(raw || "{}");
  } catch {
    return null;
  }
}

export async function handler(event) {
  const startedAt = Date.now();

  try {
    if (event.httpMethod !== "POST") {
      return json(405, { error: "Method not allowed" });
    }

    const auth = getBasicAuthHeader();
    if (!auth) {
      return json(500, { error: "Missing AFFIRM_PRIVATE_KEY" });
    }

    const base = String(process.env.AFFIRM_BASE_URL || "https://api.affirm.com/api/v2")
      .trim()
      .replace(/\/+$/, "");

    const payload = parseJsonSafe(event.body);
    if (!payload) {
      return json(400, { error: "Invalid JSON body" });
    }

    const checkout = payload.checkout;

    if (!checkout || typeof checkout !== "object" || Array.isArray(checkout)) {
      return json(400, { error: "Missing checkout" });
    }

    // Validaciones mínimas (sin ser restrictivo de más)
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

    console.log("[affirm-checkout] request", {
      base,
      items_count: checkout.items.length,
      total,
      currency,
      has_billing: Boolean(checkout.billing),
      has_shipping: Boolean(checkout.shipping),
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let res;
    try {
      // Endpoint típico de v2 para crear checkout
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

    const data = await res.json().catch(() => ({}));

    console.log("[affirm-checkout] response", {
      status: res.status,
      ok: res.ok,
      duration_ms: Date.now() - startedAt,
      has_checkout_token: Boolean(data?.checkout_token),
      has_redirect_url: Boolean(data?.redirect_url),
    });

    if (!res.ok) {
      console.error("[affirm-checkout] error", {
        status: res.status,
        details: data,
        duration_ms: Date.now() - startedAt,
      });

      return json(res.status, {
        error: "Affirm checkout failed",
        status: res.status,
        details: data,
      });
    }

    // Normalmente devuelve checkout_token (y a veces redirect_url)
    return json(200, {
      ok: true,
      status: res.status,
      data,
    });
  } catch (err) {
    const isAbort = err && (err.name === "AbortError" || String(err).includes("AbortError"));

    console.error("[affirm-checkout] fatal", {
      error: isAbort ? "Request timeout" : String(err?.message || err),
      duration_ms: Date.now() - startedAt,
    });

    return json(isAbort ? 504 : 500, {
      error: isAbort ? "Affirm request timeout" : "Server error",
    });
  }
}