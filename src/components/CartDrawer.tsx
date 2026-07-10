// src/components/CartDrawer.tsx
import { useEffect } from "react";
import { useCart } from "../context/CartContext";
import { site } from "../config/site";
import PayWithAffirm from "./PayWithAffirm";
import PayWithCard from "./PayWithCard";
import PayWithAcima from "./PayWithAcima";
import { IconMinus, IconPlus, IconX } from "./icons";

function safeSrc(src?: string) {
  const value = String(src || "").trim();
  return value ? encodeURI(value) : "/fallback.png";
}

function money(n: number) {
  const value = Number.isFinite(Number(n)) ? Number(n) : 0;
  return `$${value.toFixed(2)}`;
}

export default function CartDrawer() {
  const { items, totalUSD, isOpen, close, removeItem, setQty, clear } = useCart();

  useEffect(() => {
    if (!isOpen || typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

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

  const safeItems = Array.isArray(items) ? items : [];
  const count = safeItems.reduce(
    (acc, it) => acc + Math.max(0, Number(it?.qty) || 0),
    0
  );
  const hasItems = safeItems.length > 0;
  const safeTotal = Math.max(0, Number(totalUSD) || 0);

  return (
    <div className="fixed inset-0 z-[9990]" aria-modal="true" role="dialog">
      <button
        className="absolute inset-0 bg-black/60"
        onClick={close}
        aria-label="Close cart overlay"
        type="button"
      />

      <aside className="absolute right-0 top-0 h-[100dvh] w-full max-w-md">
        <div
          className="glass card flex h-full flex-col overflow-hidden rounded-none border-l border-white/10 md:rounded-l-3xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-white/10 p-5">
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

          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {!hasItems ? (
              <div className="glass card p-5">
                <div className="h-serif text-2xl">Your cart is empty</div>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Add a scooter, e-bike or accessory from the catalog and come back here
                  to checkout.
                </p>

                <button
                  className="btn btn-primary mt-4 w-full"
                  onClick={() => {
                    close();
                    window.setTimeout(() => {
                      document
                        .getElementById("catalog")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }, 50);
                  }}
                  type="button"
                >
                  Browse catalog
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {safeItems.map((it) => {
                  const qty = Math.max(1, Number(it.qty) || 1);
                  const price = Number(it.price) || 0;
                  const lineTotal = price * qty;

                  return (
                    <div key={String(it.id)} className="glass card flex items-start gap-3 p-4">
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                        <img
                          src={safeSrc(it.image)}
                          alt={String(it.name || "Cart item")}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            if (target.src.endsWith("/fallback.png")) return;
                            target.src = "/fallback.png";
                          }}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="truncate font-extrabold">{String(it.name || "Item")}</div>
                        <div className="text-xs text-[var(--muted)]">{money(price)} each</div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <button
                            className="btn btn-dark !rounded-xl px-3"
                            onClick={() => setQty(it.id, Math.max(1, qty - 1))}
                            type="button"
                            aria-label="Decrease quantity"
                          >
                            <IconMinus className="h-4 w-4" />
                          </button>

                          <input
                            type="number"
                            min={1}
                            step={1}
                            inputMode="numeric"
                            value={qty}
                            onChange={(e) => {
                              const raw = e.target.value;
                              if (raw.trim() === "") return;

                              const next = Number(raw);
                              if (!Number.isFinite(next)) return;

                              setQty(it.id, Math.max(1, Math.floor(next)));
                            }}
                            onBlur={(e) => {
                              const next = Number(e.target.value);
                              setQty(
                                it.id,
                                Math.max(1, Number.isFinite(next) ? Math.floor(next) : 1)
                              );
                            }}
                            className="w-20 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-center text-sm font-black text-white"
                            aria-label={`Quantity for ${it.name}`}
                          />

                          <button
                            className="btn btn-dark !rounded-xl px-3"
                            onClick={() => setQty(it.id, qty + 1)}
                            type="button"
                            aria-label="Increase quantity"
                          >
                            <IconPlus className="h-4 w-4" />
                          </button>

                          <button
                            className="btn !rounded-xl"
                            onClick={() => removeItem(it.id)}
                            type="button"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      <div className="whitespace-nowrap font-black">{money(lineTotal)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div
            className="shrink-0 border-t border-white/10 p-5"
            style={{
              paddingBottom: "calc(20px + env(safe-area-inset-bottom))",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm text-[var(--muted)]">Total</div>
              <div className="text-2xl font-black">{money(safeTotal)}</div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button className="btn" onClick={clear} type="button" disabled={!hasItems}>
                Clear
              </button>

              <a
                className="btn"
                href={`mailto:${site.email}?subject=Question about my Voltride order`}
              >
                Need help?
              </a>
            </div>

            <div className="mt-3 space-y-2">
              <PayWithAcima />
              <PayWithAffirm />
              <PayWithCard />
            </div>

            <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-xs leading-relaxed text-[var(--muted)]">
              Checkout is secure. For pickup, availability or product questions, contact us at{" "}
              <a
                className="font-bold text-white underline decoration-white/20 hover:decoration-white/60"
                href={`mailto:${site.email}`}
              >
                {site.email}
              </a>
              .
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}