// netlify/functions/card-checkout.mjs
import Stripe from "stripe";

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

function isValidOrigin(origin) {
  // Solo permitimos http(s) y un host válido.
  // Evita que alguien te mande un "origin" trucho y use tu function como open-redirect.
  try {
    const u = new URL(origin);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    if (!u.hostname) return false;
    return true;
  } catch {
    return false;
  }
}

export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return json(405, { error: "Method not allowed" });
    }

    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return json(500, { error: "Missing STRIPE_SECRET_KEY" });

    // Stripe SDK
    const stripe = new Stripe(key, { apiVersion: "2024-06-20" });

    const payload = JSON.parse(event.body || "{}");
    const items = Array.isArray(payload.items) ? payload.items : [];
    const origin = typeof payload.origin === "string" ? payload.origin : "";

    if (!items.length) return json(400, { error: "Cart is empty" });
    if (!origin) return json(400, { error: "Missing origin" });
    if (!isValidOrigin(origin)) return json(400, { error: "Invalid origin" });

    const line_items = items.map((it) => {
      const qty = Math.max(1, Number(it.qty) || 1);
      const price = Number(it.price);

      if (!Number.isFinite(price) || price <= 0) {
        throw new Error("Invalid price");
      }

      // Stripe espera centavos (integer)
      const unit_amount = Math.round(price * 100);

      // (Opcional) imagen absoluta pública:
      // const image = it.image ? new URL(String(it.image), origin).toString() : undefined;

      return {
        quantity: qty,
        price_data: {
          currency: "usd",
          unit_amount,
          product_data: {
            name: String(it.name || "Item"),
            // images: image ? [image] : undefined,
            metadata: {
              id: String(it.id || ""),
              sku: String(it.sku || ""),
            },
          },
        },
      };
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,

      // URLs absolutas
      success_url: `${origin}/?paid=1`,
      cancel_url: `${origin}/?canceled=1`,

      // Metadata útil
      metadata: { source: "voltride" },
    });

    if (!session?.url) {
      // raro, pero mejor cubrirlo
      return json(500, { error: "Stripe session missing url" });
    }

    return json(200, { url: session.url });
  } catch (err) {
    console.error("[card-checkout] error:", err);

    // Devuelve mensaje simple al usuario
    // (si querés debug, lo vemos en Netlify logs)
    return json(500, { error: "Failed to create checkout session" });
  }
}
