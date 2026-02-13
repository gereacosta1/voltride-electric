// src/components/PayWithCard.tsx
import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import { startCardCheckout } from "../lib/cardCheckouts";

function CardIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...props}
    >
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
      <path d="M6 15h4" />
    </svg>
  );
}

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
      className="btn btn-primary inline-flex w-full items-center justify-center gap-2 rounded-xl
                 bg-white text-black px-4 py-3 text-sm font-semibold
                 hover:brightness-95 transition
                 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <CardIcon className="h-4 w-4" />
      {loading ? "Redirecting…" : "Pay by card"}
    </button>
  );
}
