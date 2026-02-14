//src/components/ProductCard.tsx
import React from "react";
import { Product } from "../data/products";
import { useCart } from "../context/CartContext";

function safeSrc(src: string) {
  return encodeURI(src);
}

export default function ProductCard({ p }: { p: Product }) {
  const { addItem } = useCart();

  return (
    <div className="glass card overflow-hidden">
      <div className="relative">
        <img
          className="h-56 w-full object-cover"
          src={safeSrc(p.image)}
          alt={p.name}
          loading="lazy"
        />

        <div className="absolute left-4 top-4 flex gap-2">
          <span className="badge">
            {p.category === "scooters" ? "Scooter" : p.category === "ebikes" ? "E-Bike" : "Audio"}
          </span>
          {p.featured ? <span className="badge" style={{ borderColor: "rgba(163,230,53,.35)" }}>Featured</span> : null}
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="font-extrabold truncate">{p.name}</div>
            <div className="text-sm text-[var(--muted)] truncate">
              {p.brand} • {p.model} • {p.year}
            </div>
          </div>

          <div className="text-right">
            <div className="font-black">
              {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(p.price)}
            </div>
            <div className="text-xs text-[var(--muted)]">{p.condition}</div>
          </div>
        </div>

        {p.description ? (
          <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
            {p.description}
          </p>
        ) : null}

        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            className="btn btn-primary w-full"
            onClick={() =>
              addItem({
                id: String(p.id),
                name: p.name,
                price: p.price,
                qty: 1,
                sku: String(p.id),
                image: p.image,
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
