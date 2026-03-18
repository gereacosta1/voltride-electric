// src/context/CartContext.tsx
import {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from "react";

export type CartItem = {
  id: string | number;
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
  removeItem: (id: string | number) => void;
  clear: () => void;
  setQty: (id: string | number, qty: number) => void;
};

const Ctx = createContext<CartCtx | null>(null);

const STORAGE_KEY = "voltride_cart_v1";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalizeItem(it: any): CartItem | null {
  if (!it || typeof it !== "object") return null;

  const id = it.id;
  if (id === undefined || id === null) return null;

  const name = String(it.name ?? "").trim();
  if (!name) return null;

  const price = Number(it.price);
  const qty = Number(it.qty);

  return {
    id,
    name,
    price: Number.isFinite(price) ? price : 0,
    qty: Math.max(1, Number.isFinite(qty) ? qty : 1),
    sku: it.sku ? String(it.sku) : undefined,
    image: it.image ? String(it.image) : undefined,
    url: it.url ? String(it.url) : undefined,
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!canUseStorage()) return;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;

      const normalized = parsed
        .map(normalizeItem)
        .filter(Boolean) as CartItem[];

      setItems(normalized);
    } catch {
      // ignore corrupted storage
    }
  }, []);

  useEffect(() => {
    if (!canUseStorage()) return;

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore storage write errors
    }
  }, [items]);

  const totalUSD = useMemo(() => {
    return items.reduce(
      (acc, it) => acc + (Number(it.price) || 0) * (Number(it.qty) || 0),
      0
    );
  }, [items]);

  const api = useMemo<CartCtx>(
    () => ({
      items,
      totalUSD,
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),

      addItem: (next) => {
        const normalized = normalizeItem(next);
        if (!normalized) return;

        const nextQty = Math.max(1, Number(normalized.qty) || 1);
        const nextPrice = Number(normalized.price) || 0;

        setItems((prev) => {
          const idx = prev.findIndex((p) => p.id === normalized.id);

          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = {
              ...copy[idx],
              qty: Math.max(1, Number(copy[idx].qty) || 1) + nextQty,
              price: nextPrice,
            };
            return copy;
          }

          return [...prev, { ...normalized, price: nextPrice, qty: nextQty }];
        });

        setIsOpen(true);
      },

      removeItem: (id) => {
        setItems((prev) => prev.filter((p) => p.id !== id));
      },

      clear: () => {
        setItems([]);
      },

      setQty: (id, qty) => {
        const q = Math.max(1, Number(qty) || 1);
        setItems((prev) => prev.map((p) => (p.id === id ? { ...p, qty: q } : p)));
      },
    }),
    [items, totalUSD, isOpen]
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useCart() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCart must be used within CartProvider");
  return v;
}