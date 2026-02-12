// src/App.tsx
import React, { useMemo } from "react";
import { CartProvider, useCart } from "./context/CartContext";
import CartDrawer from "./components/CartDrawer";
import { I18nProvider } from "./i18n/I18nProvider";
import { products } from "./data/products";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function Home() {
  const { addItem, open } = useCart();

  const featured = useMemo(() => products.slice(0, 6), []);

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black tracking-tight">Voltride</h1>

          <button
            className="rounded-xl px-4 py-2 bg-white text-black font-semibold hover:opacity-90 active:opacity-80 transition"
            onClick={open}
            type="button"
          >
            Open cart
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {featured.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl bg-[var(--panel)] border border-white/10 overflow-hidden flex flex-col"
            >
              <div className="w-full h-48 bg-black/20">
                <img
                  className="w-full h-full object-cover"
                  src={p.image}
                  alt={p.name}
                  loading="lazy"
                />
              </div>

              <div className="p-4 flex-1 flex flex-col">
                <div className="font-bold leading-tight">{p.name}</div>
                <div className="text-sm text-[var(--muted)] mt-1">
                  {p.brand} • {p.model}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="font-black">{usd.format(p.price)}</div>

                  <button
                    className="rounded-xl px-3 py-2 bg-gradient-to-r from-fuchsia-500 to-lime-400 text-black font-extrabold hover:opacity-90 active:opacity-80 transition"
                    type="button"
                    onClick={() =>
                      addItem({
                        id: String(p.id),
                        name: p.name,
                        price: p.price,
                        qty: 1,
                        sku: String(p.id),
                        image: p.image,
                        url: "/",
                      })
                    }
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <CartDrawer />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <CartProvider>
        <Home />
      </CartProvider>
    </I18nProvider>
  );
}
