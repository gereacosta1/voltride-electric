//src/components/ProductCard.tsx
import React from "react";
import { Product } from "../data/products";
import { useCart } from "../context/CartContext";

function safeSrc(src?: string) {
  return encodeURI(String(src || "").trim() || "/fallback.png");
}

function safeText(value: unknown, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value) || 0);
}

export default function ProductCard({ p }: { p: Product }) {
  const { addItem } = useCart();

  const categoryLabel =
    p.category === "scooters"
      ? "Scooter"
      : p.category === "ebikes"
      ? "E-Bike"
      : "Audio";

  return (
    <div className="glass card overflow-hidden">
      <div className="relative">
        <img
          className="h-56 w-full object-cover"
          src={safeSrc(p.image)}
          alt={safeText(p.name, "Product image")}
          loading="lazy"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            if (target.src.endsWith("/fallback.png")) return;
            target.src = "/fallback.png";
          }}
        />

        <div className="absolute left-4 top-4 flex gap-2">
          <span className="badge">{categoryLabel}</span>
          {p.featured ? (
            <span
              className="badge"
              style={{ borderColor: "rgba(163,230,53,.35)" }}
            >
              Featured
            </span>
          ) : null}
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="truncate font-extrabold">
              {safeText(p.name, "Unnamed product")}
            </div>
            <div className="truncate text-sm text-[var(--muted)]">
              {safeText(p.brand, "Brand")} • {safeText(p.model, "Model")} • {safeText(p.year, "-")}
            </div>
          </div>

          <div className="text-right">
            <div className="font-black">{formatUsd(p.price)}</div>
            <div className="text-xs text-[var(--muted)]">
              {safeText(p.condition, "Available")}
            </div>
          </div>
        </div>

        {safeText(p.description) ? (
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            {safeText(p.description)}
          </p>
        ) : null}

        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            className="btn btn-primary w-full"
            onClick={() =>
              addItem({
                id: String(p.id),
                name: safeText(p.name, "Product"),
                price: Number(p.price) || 0,
                qty: 1,
                sku: String(p.id),
                image: safeText(p.image),
                url: "#catalog",
              })
            }
            type="button"
          >
            Add to cart
          </button>

          <button
            className="btn w-full"
            onClick={() => {
              const el = document.getElementById("contact");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
            type="button"
          >
            Ask about it
          </button>
        </div>
      </div>
    </div>
  );
}