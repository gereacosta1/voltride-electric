// src/lib/cardCheckouts.ts
import type { CartItem } from "../context/CartContext";

const API_URL = "/api/card-checkout";

export async function startCardCheckout(items: CartItem[]): Promise<void> {
  if (!items.length) throw new Error("The shopping cart is empty.");

  const origin = window.location.origin;

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ items, origin }),
  });

  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    // se queda como {}
  }

  if (!res.ok) {
    console.error("[card-checkout] status:", res.status, "body:", data || text);
    throw new Error(data?.error || "The card payment could not be initiated.");
  }

  if (!data?.url) throw new Error("Stripe response did not include a URL.");
  window.location.href = String(data.url);
}