// src/components/Navbar.tsx

import { site } from "../config/site";
import { useCart } from "../context/CartContext";
import { IconCart } from "./icons";

const NAV_OFFSET = 110;

function scrollToId(id: string) {
  if (
    typeof window === "undefined" ||
    typeof document === "undefined"
  ) {
    return;
  }

  const element = document.getElementById(id);

  if (!element) {
    return;
  }

  const top =
    element.getBoundingClientRect().top +
    window.scrollY -
    NAV_OFFSET;

  window.scrollTo({
    top: Math.max(0, top),
    behavior: "smooth",
  });
}

function normalizeQuantity(value: unknown) {
  const quantity = Number(value);

  if (!Number.isFinite(quantity)) {
    return 0;
  }

  return Math.max(0, Math.floor(quantity));
}

function NavButton({
  children,
  target,
}: {
  children: string;
  target: string;
}) {
  return (
    <button
      className="rounded-xl px-3 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/[0.07] hover:text-white"
      onClick={() => scrollToId(target)}
      type="button"
    >
      {children}
    </button>
  );
}

export default function Navbar() {
  const {
    open,
    items,
  } = useCart();

  const count = Array.isArray(items)
    ? items.reduce(
        (total, item) =>
          total +
          normalizeQuantity(item?.qty),
        0
      )
    : 0;

  return (
    <header className="sticky top-0 z-50">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/70 to-transparent"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl px-4 pt-4">
        <div className="group flex items-center justify-between gap-3 rounded-[28px] border border-white/10 bg-[#0d1320]/75 px-4 py-3 shadow-[0_18px_70px_rgba(0,0,0,.35)] backdrop-blur-2xl transition hover:border-white/15 hover:bg-[#0d1320]/85">
          <button
            className="flex min-w-0 items-center gap-3 text-left"
            onClick={() =>
              scrollToId("home")
            }
            type="button"
            aria-label={`Go to ${site.name} home`}
          >
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/30 shadow-inner">
              <div
                className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(217,70,239,.35),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(163,230,53,.28),transparent_60%)]"
                aria-hidden="true"
              />

              <img
                src={`${site.logo}?v=2`}
                alt={`${site.name} logo`}
                className="relative h-9 w-9 object-contain"
                loading="eager"
                onError={(event) => {
                  event.currentTarget.style.display =
                    "none";
                }}
              />
            </div>

            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-black tracking-tight text-white sm:text-base">
                {site.name}
              </div>

              <div className="truncate text-[11px] font-medium text-white/45 sm:text-xs">
                {site.brandTagline}
              </div>
            </div>
          </button>

          <nav
            className="hidden items-center gap-1 rounded-2xl border border-white/5 bg-white/[0.025] p-1 md:flex"
            aria-label="Primary navigation"
          >
            <NavButton target="catalog">
              Catalog
            </NavButton>

            <NavButton target="store">
              Store
            </NavButton>

            <NavButton target="about">
              About
            </NavButton>

            <NavButton target="contact">
              Contact
            </NavButton>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <a
              className="hidden rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm font-black text-white/85 transition hover:bg-white/[0.1] hover:text-white sm:inline-flex"
              href={site.socials.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Chat with ${site.name} on WhatsApp`}
            >
              WhatsApp
            </a>

            <button
              className="hidden rounded-2xl bg-gradient-to-r from-fuchsia-500 to-lime-300 px-5 py-2.5 text-sm font-black text-black shadow-[0_10px_35px_rgba(217,70,239,.18)] transition hover:brightness-110 active:scale-[.98] sm:inline-flex"
              onClick={() =>
                scrollToId("catalog")
              }
              type="button"
            >
              Shop now
            </button>

            <button
              className="relative inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2.5 font-black text-white/90 transition hover:bg-white/[0.1] hover:text-white active:scale-[.98]"
              onClick={open}
              type="button"
              aria-label={
                count > 0
                  ? `Open cart with ${count} ${
                      count === 1
                        ? "item"
                        : "items"
                    }`
                  : "Open cart"
              }
              title="Open cart"
            >
              <IconCart
                className="h-5 w-5"
                aria-hidden="true"
              />

              <span className="hidden sm:inline">
                Cart
              </span>

              {count > 0 ? (
                <span
                  className="absolute -right-2 -top-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-white/25 bg-gradient-to-r from-fuchsia-500 to-lime-300 px-2 text-xs font-black text-black shadow-lg"
                  aria-hidden="true"
                >
                  {count}
                </span>
              ) : null}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}