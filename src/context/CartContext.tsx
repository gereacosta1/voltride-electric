// src/context/CartContext.tsx

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  id: string | number;
  name: string;
  price: number;
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
  removeItem: (
    id: string | number
  ) => void;
  clear: () => void;
  setQty: (
    id: string | number,
    qty: number
  ) => void;
};

type UnknownRecord =
  Record<string, unknown>;

const Ctx =
  createContext<CartCtx | null>(
    null
  );

const STORAGE_KEY =
  "voltride_cart_v1";

function getStorage(): Storage | null {
  if (
    typeof window === "undefined"
  ) {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isRecord(
  value: unknown
): value is UnknownRecord {
  return (
    typeof value === "object" &&
    value !== null
  );
}

function normalizeId(
  value: unknown
): string | number | null {
  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return value;
  }

  return null;
}

function normalizePrice(
  value: unknown
) {
  const price = Number(value);

  if (!Number.isFinite(price)) {
    return 0;
  }

  return Math.max(0, price);
}

function normalizeQuantity(
  value: unknown
) {
  const quantity = Number(value);

  if (!Number.isFinite(quantity)) {
    return 1;
  }

  return Math.max(
    1,
    Math.floor(quantity)
  );
}

function normalizeOptionalString(
  value: unknown
): string | undefined {
  if (
    typeof value !== "string"
  ) {
    return undefined;
  }

  const normalized =
    value.trim();

  return normalized || undefined;
}

function normalizeItem(
  item: unknown
): CartItem | null {
  if (!isRecord(item)) {
    return null;
  }

  const id = normalizeId(
    item.id
  );

  if (id === null) {
    return null;
  }

  const name =
    typeof item.name === "string"
      ? item.name.trim()
      : "";

  if (!name) {
    return null;
  }

  return {
    id,
    name,

    price: normalizePrice(
      item.price
    ),

    qty: normalizeQuantity(
      item.qty
    ),

    sku: normalizeOptionalString(
      item.sku
    ),

    image:
      normalizeOptionalString(
        item.image
      ),

    url: normalizeOptionalString(
      item.url
    ),
  };
}

function normalizeStoredItems(
  value: unknown
): CartItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.reduce<CartItem[]>(
    (result, item) => {
      const normalized =
        normalizeItem(item);

      if (normalized) {
        result.push(normalized);
      }

      return result;
    },
    []
  );
}

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [items, setItems] =
    useState<CartItem[]>([]);

  const [isOpen, setIsOpen] =
    useState(false);

  const [hydrated, setHydrated] =
    useState(false);

  useEffect(() => {
    const storage = getStorage();

    if (!storage) {
      setHydrated(true);
      return;
    }

    try {
      const raw =
        storage.getItem(
          STORAGE_KEY
        );

      if (!raw) {
        return;
      }

      const parsed: unknown =
        JSON.parse(raw);

      setItems(
        normalizeStoredItems(
          parsed
        )
      );
    } catch {
      // Ignore corrupted or inaccessible storage.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const storage =
      getStorage();

    if (!storage) {
      return;
    }

    try {
      storage.setItem(
        STORAGE_KEY,
        JSON.stringify(items)
      );
    } catch {
      // Ignore storage write errors.
    }
  }, [items, hydrated]);

  const totalUSD =
    useMemo(() => {
      return items.reduce(
        (total, item) =>
          total +
          normalizePrice(
            item.price
          ) *
            normalizeQuantity(
              item.qty
            ),
        0
      );
    }, [items]);

  const open = useCallback(
    () => {
      setIsOpen(true);
    },
    []
  );

  const close = useCallback(
    () => {
      setIsOpen(false);
    },
    []
  );

  const addItem =
    useCallback(
      (item: CartItem) => {
        const normalized =
          normalizeItem(item);

        if (!normalized) {
          return;
        }

        setItems(
          (previousItems) => {
            const index =
              previousItems.findIndex(
                (existingItem) =>
                  existingItem.id ===
                  normalized.id
              );

            if (index < 0) {
              return [
                ...previousItems,
                normalized,
              ];
            }

            const nextItems = [
              ...previousItems,
            ];

            const existingItem =
              nextItems[index];

            nextItems[index] = {
              ...existingItem,
              ...normalized,

              qty:
                normalizeQuantity(
                  existingItem.qty
                ) +
                normalizeQuantity(
                  normalized.qty
                ),
            };

            return nextItems;
          }
        );

        setIsOpen(true);
      },
      []
    );

  const removeItem =
    useCallback(
      (
        id:
          | string
          | number
      ) => {
        setItems(
          (previousItems) =>
            previousItems.filter(
              (item) =>
                item.id !== id
            )
        );
      },
      []
    );

  const clear = useCallback(
    () => {
      setItems([]);
    },
    []
  );

  const setQty =
    useCallback(
      (
        id:
          | string
          | number,
        qty: number
      ) => {
        const nextQuantity =
          normalizeQuantity(qty);

        setItems(
          (previousItems) =>
            previousItems.map(
              (item) =>
                item.id === id
                  ? {
                      ...item,
                      qty: nextQuantity,
                    }
                  : item
            )
        );
      },
      []
    );

  const api =
    useMemo<CartCtx>(
      () => ({
        items,
        totalUSD,
        isOpen,
        open,
        close,
        addItem,
        removeItem,
        clear,
        setQty,
      }),
      [
        items,
        totalUSD,
        isOpen,
        open,
        close,
        addItem,
        removeItem,
        clear,
        setQty,
      ]
    );

  return (
    <Ctx.Provider value={api}>
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const context =
    useContext(Ctx);

  if (!context) {
    throw new Error(
      "useCart must be used within CartProvider"
    );
  }

  return context;
}