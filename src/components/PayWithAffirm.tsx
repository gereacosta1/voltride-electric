// src/components/PayWithAffirm.tsx
import { useMemo } from "react";
import { useCart } from "../context/CartContext";
import AffirmButton from "./AffirmButton";

type NormalizedCartItem = {
  id: string | number;
  sku: string | number;
  name: string;
  price: number;
  qty: number;
  url: string;
  image?: string;
};

function normalizeCartItem(item: any, index: number): NormalizedCartItem {
  const id = item?.id ?? item?.sku ?? String(index + 1);

  const rawName =
    item?.name ??
    item?.title ??
    item?.productName ??
    item?.display_name ??
    `Item ${index + 1}`;

  const name = String(rawName || "").trim() || `Item ${index + 1}`;
  const sku = item?.sku ?? id;

  return {
    id,
    sku,
    name,
    price: Math.max(0, Number(item?.price) || 0),
    qty: Math.max(1, Number(item?.qty) || 1),
    url: typeof item?.url === "string" && item.url.trim() ? item.url : "/",
    image:
      typeof item?.image === "string" && item.image.trim()
        ? item.image
        : undefined,
  };
}

function DisabledAffirmButton() {
  return (
    <button
      type="button"
      disabled
      className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm font-black text-white/35"
      title="Add products to cart first"
    >
      Pay with Affirm
    </button>
  );
}

export default function PayWithAffirm() {
  const { items, totalUSD } = useCart();

  const cartItems = useMemo<NormalizedCartItem[]>(() => {
    return (Array.isArray(items) ? items : [])
      .map(normalizeCartItem)
      .filter((item) => item.price > 0 && item.qty > 0);
  }, [items]);

  const safeTotal = Math.max(0, Number(totalUSD) || 0);
  const canCheckout = cartItems.length > 0 && safeTotal > 0;

  if (!canCheckout) {
    return <DisabledAffirmButton />;
  }

  return (
    <AffirmButton
      cartItems={cartItems}
      totalUSD={safeTotal}
      shippingUSD={0}
      taxUSD={0}
    />
  );
}