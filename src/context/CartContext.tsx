import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  id: string;
  name: string;
  price: number; // USD
  qty: number;
  sku?: string;
  image?: string;
  url?: string;
};

type CartCtx = {
  items: CartItem[];
  totalUSD: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;

  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  setQty: (id: string, qty: number) => void;

  countItems: () => number; // total qty
};

const Ctx = createContext<CartCtx | null>(null);

const STORAGE_KEY = "voltride_cart_v1";

function clampQty(qty: any) {
  const n = Number(qty);
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.floor(n));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((x) => ({
          id: String(x.id),
          name: String(x.name || ""),
          price: Number(x.price) || 0,
          qty: clampQty(x.qty),
          sku: x.sku ? String(x.sku) : undefined,
          image: x.image ? String(x.image) : undefined,
          url: x.url ? String(x.url) : undefined,
        }))
        .filter((x) => x.id && x.name);
    } catch {
      return [];
    }
  });

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  const totalUSD = useMemo(() => {
    return items.reduce((acc, it) => acc + it.price * it.qty, 0);
  }, [items]);

  const api: CartCtx = {
    items,
    totalUSD,
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),

    addItem: (next) => {
      setItems((prev) => {
        const qtyToAdd = clampQty(next.qty || 1);
        const idx = prev.findIndex((p) => p.id === next.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], qty: clampQty(copy[idx].qty + qtyToAdd) };
          return copy;
        }
        return [
          ...prev,
          {
            ...next,
            id: String(next.id),
            qty: qtyToAdd,
          },
        ];
      });
      setIsOpen(true);
    },

    removeItem: (id) => setItems((prev) => prev.filter((p) => p.id !== id)),
    clear: () => setItems([]),

    setQty: (id, qty) => {
      const q = clampQty(qty);
      setItems((prev) => prev.map((p) => (p.id === id ? { ...p, qty: q } : p)));
    },

    countItems: () => items.reduce((acc, it) => acc + clampQty(it.qty), 0),
  };

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useCart() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCart must be used within CartProvider");
  return v;
}
