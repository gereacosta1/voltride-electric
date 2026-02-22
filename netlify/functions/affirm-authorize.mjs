// netlify/functions/affirm-authorize.mjs
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

    const body = parseJsonSafe(event.body);
    if (!body) {
      return json(400, { error: "Invalid JSON body" });
    }

    const checkout_token = String(body.checkout_token || "").trim();
    const order_id = String(body.order_id || "").trim();
    const amount_cents = Number(body.amount_cents);
    const currency = String(body.currency || "USD").trim().toUpperCase();
    const capture = body.capture !== false; // default true

    if (!checkout_token) return json(400, { error: "Missing checkout_token" });
    if (!order_id) return json(400, { error: "Missing order_id" });
    if (!Number.isFinite(amount_cents) || amount_cents <= 0) {
      return json(400, { error: "Invalid amount_cents" });
    }
    if (!/^[A-Z]{3}$/.test(currency)) {
      return json(400, { error: "Invalid currency" });
    }

    // logs útiles (sin secretos)
    console.log("[affirm-authorize] request", {
      order_id,
      amount_cents,
      currency,
      capture,
      base,
      has_checkout_token: Boolean(checkout_token),
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let res;
    try {
      // Endpoint típico v2 authorize/capture
      res = await fetch(`${base}/charges`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: auth,
        },
        body: JSON.stringify({
          checkout_token,
          order_id,
          amount: amount_cents,
          currency,
          capture,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const data = await res.json().catch(() => ({}));

    console.log("[affirm-authorize] response", {
      status: res.status,
      ok: res.ok,
      duration_ms: Date.now() - startedAt,
      affirm_id: data?.id || data?.charge_id || null,
    });

    if (!res.ok) {
      console.error("[affirm-authorize] error", {
        status: res.status,
        details: data,
        duration_ms: Date.now() - startedAt,
      });

      return json(res.status, {
        error: "Affirm authorize failed",
        status: res.status,
        details: data,
      });
    }

    return json(200, {
      ok: true,
      status: res.status,
      data,
    });
  } catch (err) {
    const isAbort = err && (err.name === "AbortError" || String(err).includes("AbortError"));

    console.error("[affirm-authorize] fatal", {
      error: isAbort ? "Request timeout" : String(err?.message || err),
      duration_ms: Date.now() - startedAt,
    });

    return json(isAbort ? 504 : 500, {
      error: isAbort ? "Affirm request timeout" : "Server error",
    });
  }
}