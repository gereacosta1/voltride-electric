import React, { useState } from "react";
import { CreditCard } from "lucide-react";
import { useCart } from "../context/CartContext";
import { startCardCheckout } from "../lib/cardCheckouts";

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
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl
                 bg-white text-black px-4 py-3 text-sm font-semibold
                 hover:brightness-95 transition
                 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <CreditCard className="h-4 w-4" />
      {loading ? "Redirecting…" : "Pay by card"}
    </button>
  );
}
