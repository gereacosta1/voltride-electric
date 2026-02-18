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

export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

    const auth = getBasicAuthHeader();
    if (!auth) return json(500, { error: "Missing AFFIRM_PRIVATE_KEY" });

    const base = String(process.env.AFFIRM_BASE_URL || "https://api.affirm.com/api/v2")
      .trim()
      .replace(/\/+$/, "");

    const payload = JSON.parse(event.body || "{}");
    const checkout = payload.checkout;

    if (!checkout || typeof checkout !== "object") {
      return json(400, { error: "Missing checkout" });
    }

    // Endpoint típico de v2 para crear checkout
    const res = await fetch(`${base}/checkout`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: auth,
      },
      body: JSON.stringify(checkout),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("[affirm-checkout] error:", res.status, data);
      return json(400, { error: "Affirm checkout failed", details: data });
    }

    // Normalmente te devuelve checkout_token (y a veces redirect_url)
    return json(200, data);
  } catch (err) {
    console.error("[affirm-checkout] fatal:", err);
    return json(500, { error: "Server error" });
  }
}
