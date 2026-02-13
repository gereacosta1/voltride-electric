// src/App.tsx
import React from "react";
import { CartProvider, useCart } from "./context/CartContext";
import CartDrawer from "./components/CartDrawer";
import { I18nProvider } from "./i18n/I18nProvider";
import { products } from "./data/products";

function safeSrc(src: string) {
  // Maneja espacios y caracteres raros en paths tipo "/IMG/ELECTRIC SCOOTER.jpeg"
  return encodeURI(src);
}

function Home() {
  const { addItem, open } = useCart();

  return (
    <div className="page min-h-screen px-6 py-10">
      <div className="container max-w-5xl mx-auto">
        <div className="topbar flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black">Voltride</h1>

          <button
            className="btn btn-primary rounded-xl px-4 py-2 bg-white text-black font-semibold"
            onClick={open}
          >
            Open cart
          </button>
        </div>

        <div className="product-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.slice(0, 6).map((p) => (
            <div
              key={p.id}
              className="product-card rounded-2xl bg-[var(--panel)] border border-white/10 overflow-hidden"
            >
              <img
                className="product-img h-48 w-full object-cover"
                src={safeSrc(p.image)}
                alt={p.name}
                loading="lazy"
              />

              <div className="p-4">
                <div className="font-bold">{p.name}</div>
                <div className="text-sm text-[var(--muted)]">
                  {p.brand} • {p.model}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="font-black">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(p.price)}
                  </div>

                  <button
                    className="btn rounded-xl px-3 py-2 bg-gradient-to-r from-fuchsia-500 to-lime-400 text-black font-extrabold"
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
