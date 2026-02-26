// src/components/PayWithAffirm.tsx
import { useCart } from "../context/CartContext";
import AffirmButton from "./AffirmButton";

export default function PayWithAffirm() {
  const { items, totalUSD } = useCart();

  return (
    <AffirmButton
      cartItems={items.map((it) => ({
        name: String(it.name ?? ""),
        sku: (it.sku ?? it.id) as string | number,
        id: it.id,
        price: Number(it.price) || 0,
        qty: Math.max(1, Number(it.qty) || 1),
        url: it.url || "/",
        image: it.image,
      }))}
      totalUSD={Number(totalUSD) || 0}
      shippingUSD={0}
      taxUSD={0}
    />
  );
}