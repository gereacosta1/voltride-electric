// src/lib/cardCheckouts.ts
import type { CartItem } from "../context/CartContext";

const API_URL = "/api/card-checkout";
const REQUEST_TIMEOUT_MS = 20000;

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export async function startCardCheckout(items: CartItem[]): Promise<void> {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("The shopping cart is empty.");
  }

  const origin = window.location.origin;

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ items, origin }),
      signal: controller.signal,
    });

    const rawText = await res.text();

    let data: any = {};
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch {
      data = {};
    }

    if (!res.ok) {
      console.error("[card-checkout] status:", res.status);
      console.error("[card-checkout] raw body:", rawText);
      console.error("[card-checkout] parsed body:", data);

      const serverMessage =
        (isNonEmptyString(data?.error) && data.error) ||
        (isNonEmptyString(data?.message) && data.message) ||
        "";

      throw new Error(serverMessage || "The card payment could not be initiated.");
    }

    const redirectUrl = data?.url;
    if (!isNonEmptyString(redirectUrl)) {
      console.error("[card-checkout] missing url. raw body:", rawText);
      throw new Error("Stripe response did not include a valid checkout URL.");
    }

    // Redirección a Stripe Checkout
    window.location.href = redirectUrl;
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("The card checkout request timed out. Please try again.");
    }

    throw err instanceof Error
      ? err
      : new Error("The card checkout could not be initiated.");
  } finally {
    window.clearTimeout(timeoutId);
  }
}