// src/components/PayWithCard.tsx
import { useState } from "react";
import { useCart } from "../context/CartContext";
import { startCardCheckout } from "../lib/cardCheckouts";
import { IconCard } from "./icons";

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value) || 0);
}

export default function PayWithCard() {
  const { items, totalUSD } = useCart();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const safeItems = Array.isArray(items) ? items : [];
  const safeTotal = Math.max(0, Number(totalUSD) || 0);
  const disabled = loading || safeItems.length === 0 || safeTotal <= 0;

  async function handleCardCheckout() {
    if (disabled || typeof window === "undefined") return;

    setError("");

    try {
      setLoading(true);
      await startCardCheckout(safeItems);
    } catch (err) {
      console.error("[PayWithCard] checkout error:", err);

      const message =
        err instanceof Error && err.message
          ? err.message
          : "Card checkout could not be started. Please try again.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={disabled}
        onClick={handleCardCheckout}
        aria-busy={loading}
        className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-fuchsia-500 to-lime-300 px-4 py-3 text-sm font-black text-black shadow-[0_12px_35px_rgba(217,70,239,.16)] transition hover:brightness-110 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100"
        title={
          safeItems.length === 0
            ? "Add products to cart first"
            : safeTotal <= 0
            ? "Invalid order total"
            : "Pay by card"
        }
      >
        <span className="absolute inset-0 opacity-0 transition group-hover:opacity-100">
          <span className="absolute -left-16 top-0 h-full w-24 rotate-12 bg-white/25 blur-xl" />
        </span>

        <span className="relative inline-flex items-center justify-center gap-2">
          <IconCard className="h-5 w-5" />

          {loading ? (
            "Redirecting to checkout..."
          ) : (
            <>
              Pay by card
              {safeTotal > 0 ? (
                <span className="hidden text-black/55 sm:inline">
                  • {money(safeTotal)}
                </span>
              ) : null}
            </>
          )}
        </span>
      </button>

      {error ? (
        <div className="rounded-2xl border border-red-400/25 bg-red-400/10 px-3 py-2 text-xs leading-relaxed text-red-100">
          {error}
        </div>
      ) : null}
    </div>
  );
}