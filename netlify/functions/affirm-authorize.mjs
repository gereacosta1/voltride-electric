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

export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

    const auth = getBasicAuthHeader();
    if (!auth) return json(500, { error: "Missing AFFIRM_PRIVATE_KEY" });

    const base = String(process.env.AFFIRM_BASE_URL || "https://api.affirm.com/api/v2")
      .trim()
      .replace(/\/+$/, "");

    const body = JSON.parse(event.body || "{}");
    const checkout_token = String(body.checkout_token || "").trim();
    const order_id = String(body.order_id || "").trim();
    const amount_cents = Number(body.amount_cents);
    const currency = String(body.currency || "USD").toUpperCase();
    const capture = body.capture !== false; // default true

    if (!checkout_token) return json(400, { error: "Missing checkout_token" });
    if (!order_id) return json(400, { error: "Missing order_id" });
    if (!Number.isFinite(amount_cents) || amount_cents <= 0)
      return json(400, { error: "Invalid amount_cents" });

    // Endpoint típico v2 authorize
    const res = await fetch(`${base}/charges`, {
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
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("[affirm-authorize] error:", res.status, data);
      return json(400, { error: "Affirm authorize failed", details: data });
    }

    return json(200, data);
  } catch (err) {
    console.error("[affirm-authorize] fatal:", err);
    return json(500, { error: "Server error" });
  }
}
