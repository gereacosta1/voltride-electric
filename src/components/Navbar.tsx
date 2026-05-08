// src/components/Navbar.tsx
import React from "react";
import { site } from "../config/site";
import { useCart } from "../context/CartContext";
import { IconCart } from "./icons";

function scrollToId(id: string) {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const el = document.getElementById(id);
  if (!el) return;

  const NAV_OFFSET = 110;
  const top = el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;

  window.scrollTo({
    top: Math.max(0, top),
    behavior: "smooth",
  });
}

export default function Navbar() {
  const { open, items } = useCart();

  const count = Array.isArray(items)
    ? items.reduce((acc, item) => acc + (Number(item?.qty) || 0), 0)
    : 0;

  return (
    <div className="sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-4 pt-4">
        <div className="glass card flex items-center justify-between gap-3 px-4 py-3">
          <button
            className="group flex min-w-0 items-center gap-3 text-left"
            onClick={() => scrollToId("home")}
            type="button"
            aria-label="Go to top"
          >
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/20">
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(60% 60% at 30% 20%, rgba(217,70,239,.35), transparent 60%)," +
                    "radial-gradient(60% 60% at 80% 60%, rgba(163,230,53,.25), transparent 65%)",
                }}
              />

              <img
                src={`${site.logo}?v=2`}
                alt={site.name}
                className="relative h-9 w-9 object-contain"
                loading="eager"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
            </div>

            <div className="min-w-0 leading-tight">
              <div className="truncate font-extrabold tracking-tight group-hover:opacity-95">
                {site.name}
              </div>
              <div className="truncate text-xs text-[var(--muted)]">
                {site.brandTagline}
              </div>
            </div>
          </button>

          <div className="hidden items-center gap-1 md:flex">
            <button
              className="rounded-xl px-3 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/5 hover:text-white"
              onClick={() => scrollToId("catalog")}
              type="button"
            >
              Catalog
            </button>

            <button
              className="rounded-xl px-3 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/5 hover:text-white"
              onClick={() => scrollToId("store")}
              type="button"
            >
              Store
            </button>

            <button
              className="rounded-xl px-3 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/5 hover:text-white"
              onClick={() => scrollToId("about")}
              type="button"
            >
              About
            </button>

            <button
              className="rounded-xl px-3 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/5 hover:text-white"
              onClick={() => scrollToId("contact")}
              type="button"
            >
              Contact
            </button>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <a
              className="hidden rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-white/10 sm:inline-flex"
              href={site.socials.whatsapp}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>

            <button
              className="btn btn-primary rounded-xl px-5 py-2.5 font-extrabold"
              style={{
                background:
                  "linear-gradient(90deg, rgba(217,70,239,1), rgba(163,230,53,1))",
                color: "#0B0F14",
              }}
              onClick={() => scrollToId("catalog")}
              type="button"
            >
              Shop now
            </button>

            <button
              className="relative inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-extrabold transition hover:bg-white/10"
              onClick={open}
              type="button"
              aria-label="Open cart"
              title="Open cart"
              style={{ boxShadow: "0 0 0 4px rgba(217,70,239,.10)" }}
            >
              <IconCart className="h-5 w-5" />
              <span className="hidden sm:inline">Cart</span>

              {count > 0 ? (
                <span
                  className="absolute -right-2 -top-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-black"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(217,70,239,1), rgba(163,230,53,1))",
                    color: "#0B0F14",
                    border: "1px solid rgba(255,255,255,.25)",
                  }}
                >
                  {count}
                </span>
              ) : null}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}