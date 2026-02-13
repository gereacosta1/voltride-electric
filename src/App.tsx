// src/App.tsx
import React from "react";
import { CartProvider, useCart } from "./context/CartContext";
import CartDrawer from "./components/CartDrawer";
import { I18nProvider } from "./i18n/I18nProvider";
import { products } from "./data/products";

const styles = {
  page: {
    minHeight: "100vh",
    padding: "40px 24px",
  } as React.CSSProperties,
  container: {
    maxWidth: 1100,
    margin: "0 auto",
  } as React.CSSProperties,
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 28,
  } as React.CSSProperties,
  title: {
    fontSize: 32,
    fontWeight: 900,
    letterSpacing: "-0.02em",
    margin: 0,
  } as React.CSSProperties,
  openCartBtn: {
    border: "1px solid rgba(255,255,255,.12)",
    background: "rgba(255,255,255,.92)",
    color: "#000",
    padding: "10px 14px",
    borderRadius: 14,
    fontWeight: 800,
    cursor: "pointer",
  } as React.CSSProperties,
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 18,
  } as React.CSSProperties,
  card: {
    borderRadius: 18,
    overflow: "hidden",
    background: "var(--panel)",
    border: "1px solid rgba(255,255,255,.10)",
  } as React.CSSProperties,
  imgWrap: {
    width: "100%",
    height: 192, // <- tamaño fijo (h-48)
    overflow: "hidden",
    background: "rgba(255,255,255,.03)",
  } as React.CSSProperties,
  img: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  } as React.CSSProperties,
  cardBody: {
    padding: 14,
  } as React.CSSProperties,
  name: {
    fontWeight: 900,
    marginBottom: 4,
  } as React.CSSProperties,
  meta: {
    fontSize: 13,
    color: "var(--muted)",
  } as React.CSSProperties,
  row: {
    marginTop: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  } as React.CSSProperties,
  price: {
    fontWeight: 900,
  } as React.CSSProperties,
  addBtn: {
    border: "none",
    borderRadius: 14,
    padding: "10px 12px",
    cursor: "pointer",
    fontWeight: 900,
    color: "#000",
    background:
      "linear-gradient(90deg, rgba(217,70,239,1) 0%, rgba(163,230,53,1) 100%)",
  } as React.CSSProperties,
};

function Home() {
  const { addItem, open } = useCart();

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Voltride</h1>

          <button style={styles.openCartBtn} onClick={open}>
            Open cart
          </button>
        </div>

        <div style={styles.grid}>
          {products.slice(0, 9).map((p) => (
            <div key={p.id} style={styles.card}>
              <div style={styles.imgWrap}>
                <img style={styles.img} src={p.image} alt={p.name} loading="lazy" />
              </div>

              <div style={styles.cardBody}>
                <div style={styles.name}>{p.name}</div>
                <div style={styles.meta}>
                  {p.brand} • {p.model}
                </div>

                <div style={styles.row}>
                  <div style={styles.price}>
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(p.price)}
                  </div>

                  <button
                    style={styles.addBtn}
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
