// src/components/ProductCard.tsx
import React, { useMemo, useState } from "react";
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
  const [activeImage, setActiveImage] = useState(p.image);

  const images = useMemo(() => {
    const list = [p.image, ...(p.gallery || [])].filter(Boolean);
    return Array.from(new Set(list));
  }, [p.image, p.gallery]);

  const categoryLabel =
    p.category === "scooters"
      ? "Scooter"
      : p.category === "ebikes"
      ? "E-Bike"
      : "Audio";

  return (
    <div className="glass card overflow-hidden group">
      <div className="relative">
        <img
          className="h-56 w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          src={safeSrc(activeImage)}
          alt={safeText(p.name, "Product image")}
          loading="lazy"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            if (target.src.endsWith("/fallback.png")) return;
            target.src = "/fallback.png";
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/20 pointer-events-none" />

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

        {images.length > 1 ? (
          <div className="absolute bottom-3 left-3 right-3 flex gap-2 overflow-x-auto">
            {images.slice(0, 5).map((img) => (
              <button
                key={img}
                type="button"
                onClick={() => setActiveImage(img)}
                className={`h-12 w-12 shrink-0 overflow-hidden rounded-xl border bg-black/40 p-0.5 transition ${
                  activeImage === img
                    ? "border-white/70"
                    : "border-white/15 hover:border-white/40"
                }`}
              >
                <img
                  src={safeSrc(img)}
                  alt=""
                  className="h-full w-full rounded-lg object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="truncate font-extrabold">
              {safeText(p.name, "Unnamed product")}
            </div>
            <div className="truncate text-sm text-[var(--muted)]">
              {safeText(p.brand, "Brand")} • {safeText(p.model, "Model")} •{" "}
              {safeText(p.year, "-")}
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

        {p.features?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {p.features.slice(0, 3).map((feature) => (
              <span
                key={feature}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[var(--muted)]"
              >
                {feature}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-5 flex items-center justify-between gap-3">
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