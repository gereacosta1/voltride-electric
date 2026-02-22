// src/components/PayWithCard.tsx
import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import { startCardCheckout } from "../lib/cardCheckouts";
import { IconCard } from "./icons";

export default function PayWithCard() {
  const { items } = useCart();
  const [loading, setLoading] = useState(false);

  async function handleCardCheckout() {
    if (loading || items.length === 0) return;

    try {
      setLoading(true);
      await startCardCheckout(items);
      // Si todo sale bien, normalmente redirige y no llega acá.
    } catch (err) {
      console.error("[PayWithCard] checkout error:", err);

      const message =
        err instanceof Error && err.message
          ? err.message
          : "The card checkout could not be started. Please try again.";

      window.alert(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      disabled={loading || items.length === 0}
      onClick={handleCardCheckout}
      aria-busy={loading}
      className="btn btn-primary w-full inline-flex items-center justify-center gap-2"
      title={items.length === 0 ? "Add products to cart first" : "Pay by card"}
    >
      <IconCard className="h-5 w-5" />
      {loading ? "Redirecting…" : "Pay by card"}
    </button>
  );
}