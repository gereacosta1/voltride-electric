import React, { useMemo } from "react";
import { useCart } from "../context/CartContext";
import PayWithAffirm from "./PayWithAffirm";
import PayWithCard from "./PayWithCard";

function money(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n) || 0);
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function MinusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M5 12h14" />
    </svg>
  );
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export default function CartDrawer() {
  const { items, totalUSD, isOpen, close, removeItem, setQty, clear } = useCart();
  if (!isOpen) return null;

  const subtotal = totalUSD;
  const shipping = 0;
  const tax = 0;

  const total = useMemo(() => subtotal + shipping + tax, [subtotal, shipping, tax]);

  return (
    <div className="fixed inset-0 z-[9990]">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" onClick={close} />

      <aside
        className="absolute right-0 top-0 h-full w-full max-w-[440px]
                   bg-[var(--panel)] border-l border-white/10 shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <div className="text-lg font-black">Cart</div>
              <div className="text-xs text-[var(--muted)]">{items.length ? `${items.length} item(s)` : "Empty"}</div>
            </div>

            <button
              className="rounded-xl px-3 py-2 bg-white/5 border border-white/10 hover:bg-white/10 transition"
              onClick={close}
              aria-label="Close cart"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-auto p-5">
            {items.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="text-sm text-[var(--muted)]">Your cart is empty.</div>
                <div className="mt-2 text-sm">
                  Add products from the catalog and come back here to checkout.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((it) => (
                  <div key={it.id} className="rounded-2xl border border-white/10 bg-white/5 p-3 flex gap-3">
                    <div className="h-16 w-16 rounded-xl overflow-hidden bg-black/25 border border-white/10 flex-shrink-0">
                      {it.image ? (
                        <img src={encodeURI(it.image)} alt={it.name} className="h-full w-full object-cover" loading="lazy" />
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="font-extrabold leading-tight truncate">{it.name}</div>
                      <div className="text-xs text-[var(--muted)] mt-0.5">{money(it.price)} each</div>

                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <div className="inline-flex items-center rounded-xl border border-white/10 bg-black/25 overflow-hidden">
                          <button
                            className="px-3 py-2 hover:bg-white/10 transition"
                            onClick={() => setQty(it.id, Math.max(1, it.qty - 1))}
                            aria-label="Decrease quantity"
                            type="button"
                          >
                            <MinusIcon className="h-4 w-4" />
                          </button>

                          <input
                            type="number"
                            min={1}
                            value={it.qty}
                            onChange={(e) => setQty(it.id, Number(e.target.value))}
                            className="w-16 text-center bg-transparent text-sm font-extrabold outline-none"
                          />

                          <button
                            className="px-3 py-2 hover:bg-white/10 transition"
                            onClick={() => setQty(it.id, it.qty + 1)}
                            aria-label="Increase quantity"
                            type="button"
                          >
                            <PlusIcon className="h-4 w-4" />
                          </button>
                        </div>

                        <button
                          className="text-xs font-extrabold px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
                          onClick={() => removeItem(it.id)}
                          type="button"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="font-black whitespace-nowrap">{money(it.price * it.qty)}</div>
                  </div>
                ))}

                <button
                  className="w-full rounded-2xl px-4 py-3 bg-white/5 border border-white/10 hover:bg-white/10 transition font-extrabold text-sm"
                  onClick={clear}
                  type="button"
                >
                  Clear cart
                </button>
              </div>
            )}
          </div>

          {/* Sticky Summary */}
          <div className="border-t border-white/10 p-5 bg-black/20">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--muted)]">Subtotal</span>
                <span className="font-extrabold">{money(subtotal)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-[var(--muted)]">Shipping</span>
                <span className="font-extrabold">{money(shipping)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-[var(--muted)]">Tax</span>
                <span className="font-extrabold">{money(tax)}</span>
              </div>

              <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-sm text-[var(--muted)]">Total</span>
                <span className="text-xl font-black">{money(total)}</span>
              </div>
            </div>

            <div className="mt-3 grid gap-2">
              <PayWithAffirm />
              <PayWithCard />
            </div>

            <div className="mt-3 text-[11px] text-[var(--muted)] leading-relaxed">
              By checking out you agree to our policies (placeholders). Connect real policies when ready.
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
