// src/components/Navbar.tsx
import React from "react";
import { site } from "../config/site";
import { useCart } from "../context/CartContext";
import { IconCart } from "./icons";

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Navbar() {
  const { open, items } = useCart();
  const count = items.reduce((a, b) => a + (b.qty || 0), 0);

  return (
    <div className="sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-4 pt-4">
        <div className="glass card px-4 py-3 flex items-center justify-between">
          {/* BRAND */}
          <button
            className="flex items-center gap-3 text-left group"
            onClick={() => scrollToId("home")}
            type="button"
            aria-label="Go to top"
          >
            <div
              className="h-11 w-11 rounded-2xl overflow-hidden border border-white/10 bg-black/20
                         flex items-center justify-center relative"
            >
              {/* soft glow */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(60% 60% at 30% 20%, rgba(217,70,239,.35), transparent 60%)," +
                    "radial-gradient(60% 60% at 80% 60%, rgba(163,230,53,.25), transparent 65%)",
                }}
              />

              {/* ✅ usa el logo del config (y fuerza refresh si cachea) */}
              <img
                src={`${site.logo}?v=1`}
                alt={site.name}
                className="relative h-9 w-9 object-contain"
                loading="eager"
                onError={(e) => {
                  // si no encuentra el archivo, lo ocultamos para que no rompa el layout
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            </div>

            <div className="leading-tight">
              <div className="font-extrabold tracking-tight group-hover:opacity-95">
                {site.name}
              </div>
              <div className="text-xs text-[var(--muted)]">{site.brandTagline}</div>
            </div>
          </button>

          {/* NAV */}
          <div className="hidden md:flex items-center gap-1">
            <button
              className="px-3 py-2 rounded-xl text-sm font-semibold text-white/80 hover:text-white hover:bg-white/5 transition"
              onClick={() => scrollToId("catalog")}
              type="button"
            >
              Catalog
            </button>
            <button
              className="px-3 py-2 rounded-xl text-sm font-semibold text-white/80 hover:text-white hover:bg-white/5 transition"
              onClick={() => scrollToId("about")}
              type="button"
            >
              About
            </button>
            <button
              className="px-3 py-2 rounded-xl text-sm font-semibold text-white/80 hover:text-white hover:bg-white/5 transition"
              onClick={() => scrollToId("contact")}
              type="button"
            >
              Contact
            </button>
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-2">
            <button
              className="btn btn-primary px-5 py-2.5 rounded-xl font-extrabold"
              style={{
                background: "linear-gradient(90deg, rgba(217,70,239,1), rgba(163,230,53,1))",
                color: "#0B0F14",
              }}
              onClick={() => scrollToId("catalog")}
              type="button"
            >
              Shop now
            </button>

            <button
              className="relative rounded-xl px-4 py-2.5 font-extrabold border border-white/10
                         bg-white/5 hover:bg-white/10 transition
                         inline-flex items-center gap-2"
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
                  className="absolute -top-2 -right-2 h-6 min-w-6 px-2 rounded-full
                             text-xs font-black inline-flex items-center justify-center"
                  style={{
                    background: "linear-gradient(90deg, rgba(217,70,239,1), rgba(163,230,53,1))",
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
