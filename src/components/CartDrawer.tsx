// src/components/CartDrawer.tsx

import { useEffect } from "react";

import { site } from "../config/site";
import { useCart } from "../context/CartContext";
import PayWithAcima from "./PayWithAcima";
import PayWithAffirm from "./PayWithAffirm";
import PayWithCard from "./PayWithCard";
import {
  IconMinus,
  IconPlus,
  IconX,
} from "./icons";

const FALLBACK_IMAGE = "/fallback.png";

function safeSrc(src?: string) {
  const value = String(src || "").trim();

  if (!value) {
    return FALLBACK_IMAGE;
  }

  try {
    return encodeURI(value);
  } catch {
    return FALLBACK_IMAGE;
  }
}

function money(value: number) {
  const numericValue = Number(value);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(
    Number.isFinite(numericValue)
      ? numericValue
      : 0
  );
}

function normalizeQuantity(value: unknown) {
  const quantity = Number(value);

  if (!Number.isFinite(quantity)) {
    return 1;
  }

  return Math.max(
    1,
    Math.floor(quantity)
  );
}

export default function CartDrawer() {
  const {
    items,
    totalUSD,
    isOpen,
    close,
    removeItem,
    setQty,
    clear,
  } = useCart();

  useEffect(() => {
    if (
      !isOpen ||
      typeof window === "undefined" ||
      typeof document === "undefined"
    ) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        close();
      }
    };

    document.body.style.overflow =
      "hidden";

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );

      document.body.style.overflow =
        previousOverflow;
    };
  }, [isOpen, close]);

  if (!isOpen) {
    return null;
  }

  const safeItems =
    Array.isArray(items)
      ? items
      : [];

  const count = safeItems.reduce(
    (total, item) =>
      total +
      normalizeQuantity(item?.qty),
    0
  );

  const hasItems =
    safeItems.length > 0;

  const safeTotal = Math.max(
    0,
    Number(totalUSD) || 0
  );

  const helpSubject =
    encodeURIComponent(
      "Question about my Voltride order"
    );

  function browseCatalog() {
    close();

    window.setTimeout(() => {
      document
        .getElementById("catalog")
        ?.scrollIntoView({
          behavior: "smooth",
        });
    }, 100);
  }

  return (
    <div
      className="fixed inset-0 z-[9990]"
      aria-modal="true"
      role="dialog"
      aria-labelledby="cart-title"
    >
      <button
        className="absolute inset-0 cursor-default bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={close}
        aria-label="Close cart overlay"
        type="button"
      />

      <aside className="absolute right-0 top-0 h-[100dvh] w-full max-w-[460px]">
        <div className="flex h-full flex-col overflow-hidden border-l border-white/10 bg-[#0d1422]/95 shadow-[-24px_0_90px_rgba(0,0,0,.55)] backdrop-blur-2xl md:rounded-l-[30px]">
          <header className="relative shrink-0 overflow-hidden border-b border-white/10 px-5 py-5">
            <div
              className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-fuchsia-500/15 blur-3xl"
              aria-hidden="true"
            />

            <div
              className="pointer-events-none absolute -bottom-24 left-10 h-44 w-44 rounded-full bg-lime-300/10 blur-3xl"
              aria-hidden="true"
            />

            <div className="relative flex items-center justify-between gap-4">
              <div>
                <h2
                  id="cart-title"
                  className="text-xl font-black tracking-tight text-white"
                >
                  Your cart
                </h2>

                <div
                  className="mt-1 text-xs font-medium text-white/45"
                  aria-live="polite"
                >
                  {count === 1
                    ? "1 item selected"
                    : `${count} items selected`}
                </div>
              </div>

              <button
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm font-black text-white/80 transition hover:bg-white/[0.1] hover:text-white active:scale-[.98]"
                onClick={close}
                type="button"
                aria-label="Close cart"
              >
                <IconX
                  className="h-4 w-4"
                  aria-hidden="true"
                />

                Close
              </button>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            {!hasItems ? (
              <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.045] p-6 text-center">
                <div
                  className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-fuchsia-500/15 blur-3xl"
                  aria-hidden="true"
                />

                <div
                  className="pointer-events-none absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-lime-300/10 blur-3xl"
                  aria-hidden="true"
                />

                <div className="relative">
                  <div className="h-serif text-3xl text-white">
                    Your cart is empty
                  </div>

                  <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-white/50">
                    Add a scooter, e-bike,
                    or accessory from the
                    catalog to start your
                    order.
                  </p>

                  <button
                    className="mt-5 w-full rounded-2xl bg-gradient-to-r from-fuchsia-500 to-lime-300 px-5 py-3 text-sm font-black text-black transition hover:brightness-110 active:scale-[.98]"
                    onClick={browseCatalog}
                    type="button"
                  >
                    Browse catalog
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {safeItems.map(
                  (item) => {
                    const qty =
                      normalizeQuantity(
                        item.qty
                      );

                    const price =
                      Math.max(
                        0,
                        Number(
                          item.price
                        ) || 0
                      );

                    const lineTotal =
                      price * qty;

                    const name =
                      String(
                        item.name ||
                          "Item"
                      ).trim() ||
                      "Item";

                    return (
                      <article
                        key={String(
                          item.id
                        )}
                        className="group rounded-[24px] border border-white/10 bg-white/[0.045] p-4 transition hover:border-white/15 hover:bg-white/[0.065]"
                      >
                        <div className="flex items-start gap-4">
                          <div className="h-[76px] w-[76px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/25">
                            <img
                              src={safeSrc(
                                item.image
                              )}
                              alt={name}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                              loading="lazy"
                              onError={(
                                event
                              ) => {
                                const target =
                                  event.currentTarget;

                                if (
                                  target
                                    .getAttribute(
                                      "src"
                                    )
                                    ?.endsWith(
                                      FALLBACK_IMAGE
                                    )
                                ) {
                                  return;
                                }

                                target.onerror =
                                  null;

                                target.src =
                                  FALLBACK_IMAGE;
                              }}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="truncate font-black text-white">
                                  {name}
                                </div>

                                <div className="mt-1 text-xs font-medium text-white/40">
                                  {money(
                                    price
                                  )}{" "}
                                  each
                                </div>
                              </div>

                              <div className="shrink-0 text-right font-black text-white">
                                {money(
                                  lineTotal
                                )}
                              </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between gap-3">
                              <div className="inline-flex items-center rounded-2xl border border-white/10 bg-black/20 p-1">
                                <button
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-white/65 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                                  onClick={() =>
                                    setQty(
                                      item.id,
                                      Math.max(
                                        1,
                                        qty -
                                          1
                                      )
                                    )
                                  }
                                  type="button"
                                  aria-label={`Decrease quantity for ${name}`}
                                  disabled={
                                    qty <= 1
                                  }
                                >
                                  <IconMinus
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                  />
                                </button>

                                <input
                                  type="number"
                                  min={1}
                                  step={1}
                                  inputMode="numeric"
                                  value={qty}
                                  onChange={(
                                    event
                                  ) => {
                                    const rawValue =
                                      event
                                        .target
                                        .value;

                                    if (
                                      rawValue.trim() ===
                                      ""
                                    ) {
                                      return;
                                    }

                                    const nextQuantity =
                                      Number(
                                        rawValue
                                      );

                                    if (
                                      !Number.isFinite(
                                        nextQuantity
                                      )
                                    ) {
                                      return;
                                    }

                                    setQty(
                                      item.id,
                                      Math.max(
                                        1,
                                        Math.floor(
                                          nextQuantity
                                        )
                                      )
                                    );
                                  }}
                                  onBlur={(
                                    event
                                  ) => {
                                    setQty(
                                      item.id,
                                      normalizeQuantity(
                                        event
                                          .target
                                          .value
                                      )
                                    );
                                  }}
                                  className="h-9 w-12 border-0 bg-transparent text-center text-sm font-black text-white outline-none"
                                  aria-label={`Quantity for ${name}`}
                                />

                                <button
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-white/65 transition hover:bg-white/10 hover:text-white"
                                  onClick={() =>
                                    setQty(
                                      item.id,
                                      qty + 1
                                    )
                                  }
                                  type="button"
                                  aria-label={`Increase quantity for ${name}`}
                                >
                                  <IconPlus
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                  />
                                </button>
                              </div>

                              <button
                                className="rounded-xl px-3 py-2 text-xs font-bold text-red-300/70 transition hover:bg-red-400/10 hover:text-red-200"
                                onClick={() =>
                                  removeItem(
                                    item.id
                                  )
                                }
                                type="button"
                                aria-label={`Remove ${name} from cart`}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  }
                )}
              </div>
            )}
          </div>

          <footer
            className="shrink-0 border-t border-white/10 bg-[#0b111d]/95 px-5 pt-5 backdrop-blur-xl"
            style={{
              paddingBottom:
                "calc(20px + env(safe-area-inset-bottom))",
            }}
          >
            <div className="rounded-[24px] border border-white/10 bg-white/[0.045] p-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[.16em] text-white/40">
                    Order total
                  </div>

                  <div className="mt-1 text-xs text-white/35">
                    Taxes and pickup
                    details confirmed
                    separately
                  </div>
                </div>

                <div
                  className="shrink-0 text-2xl font-black text-white"
                  aria-live="polite"
                >
                  {money(safeTotal)}
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-black text-white/70 transition hover:bg-white/[0.09] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                onClick={clear}
                type="button"
                disabled={!hasItems}
              >
                Clear cart
              </button>

              <a
                className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-center text-sm font-black text-white/70 transition hover:bg-white/[0.09] hover:text-white"
                href={`mailto:${site.email}?subject=${helpSubject}`}
              >
                Need help?
              </a>
            </div>

            <div className="mt-4 space-y-2">
              <PayWithAcima />
              <PayWithAffirm />
              <PayWithCard />
            </div>

            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
              <div
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-lime-300/25 bg-lime-300/10 text-xs text-lime-200"
                aria-hidden="true"
              >
                ✓
              </div>

              <div className="text-[11px] leading-relaxed text-white/40">
                Secure checkout. For
                availability, pickup
                details, or product
                questions, contact{" "}
                <a
                  className="font-bold text-white/75 underline decoration-white/20 transition hover:text-white hover:decoration-white/60"
                  href={`mailto:${site.email}`}
                >
                  {site.email}
                </a>
                .
              </div>
            </div>
          </footer>
        </div>
      </aside>
    </div>
  );
}