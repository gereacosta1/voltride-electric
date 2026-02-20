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

      const unit_amount = Math.round(price * 100);

      return {
        quantity: qty,
        price_data: {
          currency: "usd",
          unit_amount,
          product_data: {
            name: String(it.name || "Item"),
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

      // Dejá que Stripe muestre Klarna/Afterpay según tu dashboard + elegibilidad
      billing_address_collection: "auto",
      customer_creation: "if_required",

      success_url: `${origin}/?paid=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?canceled=1`,

      metadata: { source: "voltride" },
    });

    if (!session?.url) {
      return json(500, { error: "Stripe session missing url" });
    }

    return json(200, { url: session.url });
  } catch (err) {
    console.error("[card-checkout] error:", err);
    return json(500, { error: "Failed to create checkout session" });
  }
}