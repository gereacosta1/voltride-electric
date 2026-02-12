import React from "react";
import { useCart } from "../context/CartContext";
import PayWithAffirm from "./PayWithAffirm";
import PayWithCard from "./PayWithCard";

export default function CartDrawer() {
  const { items, totalUSD, isOpen, close, removeItem, setQty, clear } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9990]">
      <div className="absolute inset-0 bg-black/60" onClick={close} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-[var(--panel)] border-l border-white/10 p-5 overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xl font-black">Cart</div>
          <button
            className="rounded-lg px-3 py-2 bg-white/10 hover:bg-white/15"
            onClick={close}
          >
            Close
          </button>
        </div>

        {items.length === 0 ? (
          <div className="text-sm text-[var(--muted)]">Your cart is empty.</div>
        ) : (
          <>
            <div className="space-y-3">
              {items.map((it) => (
                <div
                  key={it.id}
                  className="flex gap-3 rounded-xl border border-white/10 p-3"
                >
                  <div className="h-16 w-16 rounded-lg overflow-hidden bg-white/5">
                    {it.image ? (
                      <img
                        src={it.image}
                        alt={it.name}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>

                  <div className="flex-1">
                    <div className="font-semibold">{it.name}</div>
                    <div className="text-xs text-[var(--muted)]">
                      ${it.price.toFixed(2)} each
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={it.qty}
                        onChange={(e) => setQty(it.id, Number(e.target.value))}
                        className="w-20 rounded-lg bg-black/20 border border-white/10 px-2 py-1 text-sm"
                      />
                      <button
                        className="text-xs px-2 py-1 rounded-lg bg-white/10 hover:bg-white/15"
                        onClick={() => removeItem(it.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="font-black">
                    ${(it.price * it.qty).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between">
              <div className="text-sm text-[var(--muted)]">Total</div>
              <div className="text-xl font-black">${totalUSD.toFixed(2)}</div>
            </div>

            <button
              className="mt-3 w-full rounded-xl px-4 py-3 bg-white/10 hover:bg-white/15 text-sm font-semibold"
              onClick={clear}
            >
              Clear cart
            </button>

            <div className="mt-4 space-y-3">
              <PayWithAffirm />
              <PayWithCard />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
