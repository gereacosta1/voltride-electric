import React, { createContext, useContext, useMemo, useState, useEffect } from "react";

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
  open: () => void;
  close: () => void;
  isOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  setQty: (id: string, qty: number) => void;
};

const Ctx = createContext<CartCtx | null>(null);

const STORAGE_KEY = "voltride_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load cart
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setItems(parsed);
    } catch {
      // ignore
    }
  }, []);

  // Save cart
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
        const idx = prev.findIndex((p) => p.id === next.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], qty: copy[idx].qty + (next.qty || 1) };
          return copy;
        }
        return [...prev, { ...next, qty: Math.max(1, next.qty || 1) }];
      });
      setIsOpen(true);
    },

    removeItem: (id) => setItems((prev) => prev.filter((p) => p.id !== id)),
    clear: () => setItems([]),

    setQty: (id, qty) => {
      const q = Math.max(1, Number(qty) || 1);
      setItems((prev) => prev.map((p) => (p.id === id ? { ...p, qty: q } : p)));
    },
  };

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useCart() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCart must be used within CartProvider");
  return v;
}
