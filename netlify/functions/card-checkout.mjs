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

// Opcional recomendado para producción:
// si querés bloquear cualquier origin que no sea tu dominio/netlify, activá esto.
function isAllowedOrigin(origin) {
  try {
    const u = new URL(origin);
    const host = u.hostname.toLowerCase();

    const allowedHosts = new Set([
      "voltride.agency",
      "www.voltride.agency",
      "volt-ride-electric.netlify.app",
      "localhost", // dev local
      "127.0.0.1", // dev local
    ]);

    return allowedHosts.has(host);
  } catch {
    return false;
  }
}

function cleanString(v, max = 200) {
  return String(v ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, max);
}

export async function handler(event) {
  try {
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 204,
        headers: {
          "cache-control": "no-store",
        },
        body: "",
      };
    }

    if (event.httpMethod !== "POST") {
      return json(405, { error: "Method not allowed" });
    }

    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      console.error("[card-checkout] Missing STRIPE_SECRET_KEY");
      return json(500, { error: "Missing STRIPE_SECRET_KEY" });
    }

    const stripe = new Stripe(key, { apiVersion: "2024-06-20" });

    let payload = {};
    try {
      payload = JSON.parse(event.body || "{}");
    } catch {
      return json(400, { error: "Invalid JSON body" });
    }

    const items = Array.isArray(payload.items) ? payload.items : [];
    const origin = typeof payload.origin === "string" ? payload.origin.trim() : "";

    if (!items.length) return json(400, { error: "Cart is empty" });
    if (!origin) return json(400, { error: "Missing origin" });
    if (!isValidOrigin(origin)) return json(400, { error: "Invalid origin" });

    // Activalo si querés cerrar el endpoint a tus dominios:
    if (!isAllowedOrigin(origin)) {
      console.warn("[card-checkout] Origin not allowed:", origin);
      return json(403, { error: "Origin not allowed" });
    }

    const line_items = items.map((it, index) => {
      const qty = Math.max(1, Math.min(50, Number(it?.qty) || 1)); // límite razonable
      const price = Number(it?.price);

      if (!Number.isFinite(price) || price <= 0) {
        throw new Error(`Invalid price at item ${index}`);
      }

      const unit_amount = Math.round(price * 100);

      // Stripe exige entero > 0 en centavos
      if (!Number.isInteger(unit_amount) || unit_amount <= 0) {
        throw new Error(`Invalid unit_amount at item ${index}`);
      }

      const name = cleanString(it?.name || "Item", 120) || "Item";

      return {
        quantity: qty,
        price_data: {
          currency: "usd",
          unit_amount,
          product_data: {
            name,
            metadata: {
              id: cleanString(it?.id, 80),
              sku: cleanString(it?.sku, 80),
            },
          },
        },
      };
    });

    const normalizedOrigin = origin.replace(/\/+$/, "");

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,

      // Stripe decide qué métodos mostrar (Klarna/Afterpay/Cards) según elegibilidad/dashboard
      billing_address_collection: "auto",
      customer_creation: "if_required",

      success_url: `${normalizedOrigin}/?paid=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${normalizedOrigin}/?canceled=1`,

      metadata: { source: "voltride" },
    });

    if (!session?.url) {
      console.error("[card-checkout] Stripe session created without url", {
        sessionId: session?.id,
      });
      return json(500, { error: "Stripe session missing url" });
    }

    return json(200, { url: session.url });
  } catch (err) {
    // Error específico de Stripe (sin exponer datos sensibles)
    if (err && typeof err === "object" && "type" in err) {
      console.error("[card-checkout] Stripe error:", {
        type: err.type,
        code: err.code,
        message: err.message,
      });

      return json(400, {
        error: "Stripe could not create the checkout session",
        details: err.message || "Unknown Stripe error",
      });
    }

    console.error("[card-checkout] error:", err);
    return json(500, { error: "Failed to create checkout session" });
  }
}