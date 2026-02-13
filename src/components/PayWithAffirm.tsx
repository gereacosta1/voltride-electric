import React from "react";
import { useCart } from "../context/CartContext";
import AffirmButton from "./AffirmButton";

export default function PayWithAffirm() {
  const { items, totalUSD } = useCart();

  return (
    <AffirmButton
      cartItems={items.map((it) => ({
        name: it.name,
        sku: it.sku || it.id,
        id: it.id,
        price: it.price,
        qty: it.qty,
        url: it.url || "/",
        image: it.image,
      }))}
      totalUSD={totalUSD}
      shippingUSD={0}
      taxUSD={0}
    />
  );
}
