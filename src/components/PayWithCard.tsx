//src/components/PayWithCard.tsx
import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import { startCardCheckout } from "../lib/cardCheckouts";
import { IconCard } from "./icons";

export default function PayWithCard() {
  const { items } = useCart();
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={loading || items.length === 0}
      onClick={async () => {
        try {
          setLoading(true);
          await startCardCheckout(items);
        } finally {
          setLoading(false);
        }
      }}
      className="btn btn-primary w-full inline-flex items-center justify-center gap-2"
    >
      <IconCard className="h-5 w-5" />
      {loading ? "Redirecting…" : "Pay by card"}
    </button>
  );
}
