// src/components/PayWithAffirm.tsx
import { useMemo } from "react";
import { useCart } from "../context/CartContext";
import AffirmButton from "./AffirmButton";

export default function PayWithAffirm() {
  const { items, totalUSD } = useCart();

  const cartItems = useMemo(() => {
    return (items || []).map((it, idx) => {
      const id = (it as any).id ?? (it as any).sku ?? String(idx + 1);

      const rawName =
        (it as any).name ??
        (it as any).title ??
        (it as any).productName ??
        `Item ${idx + 1}`;

      const name = String(rawName || "").trim() || `Item ${idx + 1}`;

      const sku = ((it as any).sku ?? id) as string | number;

      return {
        name,
        sku,
        id,
        price: Number((it as any).price) || 0,
        qty: Math.max(1, Number((it as any).qty) || 1),
        url: (it as any).url || "/",
        image: (it as any).image,
      };
    });
  }, [items]);

  return (
    <AffirmButton
      cartItems={cartItems}
      totalUSD={Number(totalUSD) || 0}
      shippingUSD={0}
      taxUSD={0}
    />
  );
}