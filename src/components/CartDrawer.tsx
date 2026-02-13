// src/components/CartDrawer.tsx
import React from "react";
import { useCart } from "../context/CartContext";
import PayWithAffirm from "./PayWithAffirm";
import PayWithCard from "./PayWithCard";

export default function CartDrawer() {
  const { items, totalUSD, isOpen, close, removeItem, setQty, clear } = useCart();

  if (!isOpen) return null;

  const styles = {
    overlay: {
      position: "fixed",
      inset: 0,
      zIndex: 9990,
    } as React.CSSProperties,
    backdrop: {
      position: "absolute",
      inset: 0,
      background: "rgba(0,0,0,.60)",
    } as React.CSSProperties,
    panel: {
      position: "absolute",
      top: 0,
      right: 0,
      height: "100%",
      width: "100%",
      maxWidth: 420,
      background: "var(--panel)",
      borderLeft: "1px solid rgba(255,255,255,.10)",
      padding: 16,
      overflow: "auto",
    } as React.CSSProperties,
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      marginBottom: 14,
    } as React.CSSProperties,
    title: {
      fontSize: 20,
      fontWeight: 900,
      margin: 0,
    } as React.CSSProperties,
    closeBtn: {
      borderRadius: 12,
      padding: "10px 12px",
      background: "rgba(255,255,255,.10)",
      border: "1px solid rgba(255,255,255,.10)",
      color: "var(--text)",
      cursor: "pointer",
      fontWeight: 800,
    } as React.CSSProperties,
    empty: {
      fontSize: 13,
      color: "var(--muted)",
    } as React.CSSProperties,
    list: {
      display: "flex",
      flexDirection: "column",
      gap: 10,
    } as React.CSSProperties,
    item: {
      display: "flex",
      gap: 12,
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,.10)",
      padding: 12,
    } as React.CSSProperties,
    thumb: {
      width: 64,
      height: 64,
      borderRadius: 12,
      overflow: "hidden",
      background: "rgba(255,255,255,.06)",
      flex: "0 0 auto",
    } as React.CSSProperties,
    thumbImg: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block",
    } as React.CSSProperties,
    info: {
      flex: 1,
      minWidth: 0,
    } as React.CSSProperties,
    name: {
      fontWeight: 800,
      marginBottom: 4,
      lineHeight: 1.2,
    } as React.CSSProperties,
    each: {
      fontSize: 12,
      color: "var(--muted)",
    } as React.CSSProperties,
    controls: {
      marginTop: 10,
      display: "flex",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap",
    } as React.CSSProperties,
    qty: {
      width: 84,
      borderRadius: 12,
      background: "rgba(0,0,0,.25)",
      border: "1px solid rgba(255,255,255,.12)",
      padding: "8px 10px",
      color: "var(--text)",
      fontSize: 13,
    } as React.CSSProperties,
    smallBtn: {
      borderRadius: 12,
      padding: "8px 10px",
      background: "rgba(255,255,255,.10)",
      border: "1px solid rgba(255,255,255,.10)",
      color: "var(--text)",
      cursor: "pointer",
      fontSize: 12,
      fontWeight: 800,
    } as React.CSSProperties,
    lineTotal: {
      fontWeight: 900,
      whiteSpace: "nowrap",
      alignSelf: "flex-start",
    } as React.CSSProperties,
    totalRow: {
      marginTop: 16,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    } as React.CSSProperties,
    totalLabel: {
      fontSize: 13,
      color: "var(--muted)",
    } as React.CSSProperties,
    totalValue: {
      fontSize: 20,
      fontWeight: 900,
    } as React.CSSProperties,
    clearBtn: {
      marginTop: 10,
      width: "100%",
      borderRadius: 14,
      padding: "12px 14px",
      background: "rgba(255,255,255,.10)",
      border: "1px solid rgba(255,255,255,.10)",
      color: "var(--text)",
      cursor: "pointer",
      fontWeight: 900,
      fontSize: 13,
    } as React.CSSProperties,
    payWrap: {
      marginTop: 14,
      display: "flex",
      flexDirection: "column",
      gap: 10,
    } as React.CSSProperties,
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.backdrop} onClick={close} />

      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.title}>Cart</div>
          <button style={styles.closeBtn} onClick={close}>
            Close
          </button>
        </div>

        {items.length === 0 ? (
          <div style={styles.empty}>Your cart is empty.</div>
        ) : (
          <>
            <div style={styles.list}>
              {items.map((it) => (
                <div key={it.id} style={styles.item}>
                  <div style={styles.thumb}>
                    {it.image ? (
                      <img
                        src={it.image}
                        alt={it.name}
                        style={styles.thumbImg}
                        loading="lazy"
                      />
                    ) : null}
                  </div>

                  <div style={styles.info}>
                    <div style={styles.name}>{it.name}</div>
                    <div style={styles.each}>${it.price.toFixed(2)} each</div>

                    <div style={styles.controls}>
                      <input
                        type="number"
                        min={1}
                        value={it.qty}
                        onChange={(e) => setQty(it.id, Number(e.target.value))}
                        style={styles.qty}
                      />
                      <button
                        style={styles.smallBtn}
                        onClick={() => removeItem(it.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div style={styles.lineTotal}>
                    ${(it.price * it.qty).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.totalRow}>
              <div style={styles.totalLabel}>Total</div>
              <div style={styles.totalValue}>${totalUSD.toFixed(2)}</div>
            </div>

            <button style={styles.clearBtn} onClick={clear}>
              Clear cart
            </button>

            <div style={styles.payWrap}>
              <PayWithAffirm />
              <PayWithCard />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
