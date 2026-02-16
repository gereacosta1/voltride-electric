// src/components/CartDrawer.tsx
import React, { useEffect } from "react";
import { useCart } from "../context/CartContext";
import PayWithAffirm from "./PayWithAffirm";
import PayWithCard from "./PayWithCard";
import { IconMinus, IconPlus, IconX } from "./icons";

function safeSrc(src?: string) {
  if (!src) return "";
  return encodeURI(src);
}

export default function CartDrawer() {
  const { items, totalUSD, isOpen, close, removeItem, setQty, clear } = useCart();

  // ESC to close + body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, close]);

  if (!isOpen) return null;

  const count = items.reduce((a, b) => a + (b.qty || 0), 0);

  return (
    <div className="fixed inset-0 z-[9990]">
      {/* Overlay */}
      <button
        className="absolute inset-0 bg-black/60"
        onClick={close}
        aria-label="Close cart overlay"
        type="button"
      />

      {/* Drawer */}
      <aside className="absolute right-0 top-0 h-[100dvh] w-full max-w-md">
        <div className="h-full glass card rounded-none md:rounded-l-3xl border-l border-white/10 overflow-hidden flex flex-col">
          {/* Header (fixed height, never scrolls) */}
          <div className="shrink-0 p-5 border-b border-white/10 flex items-center justify-between">
            <div>
              <div className="text-lg font-black tracking-tight">Cart</div>
              <div className="text-xs text-[var(--muted)]">{count} item(s)</div>
            </div>

            <button className="btn" onClick={close} type="button" aria-label="Close cart">
              <span className="inline-flex items-center gap-2">
                <IconX className="h-5 w-5" />
                Close
              </span>
            </button>
          </div>

          {/* Body (scroll area) */}
          <div className="flex-1 min-h-0 overflow-y-auto p-5">
            {items.length === 0 ? (
              <div className="glass card p-5">
                <div className="h-serif text-2xl">Your cart is empty</div>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Add something from the catalog and come back here to checkout.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((it) => (
                  <div key={it.id} className="glass card p-4 flex gap-3 items-start">
                    <div className="h-16 w-16 rounded-2xl overflow-hidden bg-black/20 border border-white/10 flex-shrink-0">
                      {it.image ? (
                        <img
                          src={safeSrc(it.image)}
                          alt={it.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : null}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-extrabold truncate">{it.name}</div>
                      <div className="text-xs text-[var(--muted)]">${it.price.toFixed(2)} each</div>

                      {/* qty stepper */}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          className="btn btn-dark !rounded-xl px-3"
                          onClick={() => setQty(it.id, Math.max(1, it.qty - 1))}
                          type="button"
                          aria-label="Decrease quantity"
                        >
                          <IconMinus className="h-4 w-4" />
                        </button>

                        <input
                          type="number"
                          min={1}
                          value={it.qty}
                          onChange={(e) => setQty(it.id, Number(e.target.value))}
                          className="w-20 rounded-xl bg-black/25 border border-white/10 px-3 py-2 text-sm font-black text-center text-white"
                        />

                        <button
                          className="btn btn-dark !rounded-xl px-3"
                          onClick={() => setQty(it.id, it.qty + 1)}
                          type="button"
                          aria-label="Increase quantity"
                        >
                          <IconPlus className="h-4 w-4" />
                        </button>

                        <button className="btn !rounded-xl" onClick={() => removeItem(it.id)} type="button">
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="font-black whitespace-nowrap">${(it.price * it.qty).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer (fixed, never scrolls) */}
          <div
            className="shrink-0 p-5 border-t border-white/10"
            style={{
              paddingBottom: "calc(20px + env(safe-area-inset-bottom))",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm text-[var(--muted)]">Total</div>
              <div className="text-2xl font-black">${totalUSD.toFixed(2)}</div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button className="btn" onClick={clear} type="button" disabled={items.length === 0}>
                Clear
              </button>

              <button
                className="btn"
                onClick={() => {
                  const el = document.getElementById("contact");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                type="button"
              >
                Need help?
              </button>
            </div>

            <div className="mt-3 space-y-2">
              <PayWithAffirm />
              <PayWithCard />
            </div>

            <div className="mt-3 text-xs text-[var(--muted)]">
              Checkout is secure. Taxes/shipping can be calculated at confirmation if needed.
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
