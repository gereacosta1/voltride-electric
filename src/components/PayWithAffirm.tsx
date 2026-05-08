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

export default function PayWithAffirm() {
  const { items, totalUSD } = useCart();

  const cartItems = useMemo<NormalizedCartItem[]>(() => {
    return (items || []).map((it: any, idx: number) => {
      const id = it?.id ?? it?.sku ?? String(idx + 1);

      const rawName =
        it?.name ??
        it?.title ??
        it?.productName ??
        `Item ${idx + 1}`;

      const name = String(rawName || "").trim() || `Item ${idx + 1}`;
      const sku = it?.sku ?? id;

      return {
        id,
        sku,
        name,
        price: Math.max(0, Number(it?.price) || 0),
        qty: Math.max(1, Number(it?.qty) || 1),
        url: typeof it?.url === "string" && it.url.trim() ? it.url : "/",
        image:
          typeof it?.image === "string" && it.image.trim()
            ? it.image
            : undefined,
      };
    });
  }, [items]);

  const safeTotal = Math.max(0, Number(totalUSD) || 0);
  const canCheckout = cartItems.length > 0 && safeTotal > 0;

  if (!canCheckout) {
    return (
      <button className="btn btn-primary w-full opacity-60" type="button" disabled>
        Pay with Affirm
      </button>
    );
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