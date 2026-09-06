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

type UnknownRecord = Record<string, unknown>;

function toRecord(value: unknown): UnknownRecord {
  if (typeof value === "object" && value !== null) {
    return value as UnknownRecord;
  }

  return {};
}

function normalizeIdentifier(
  value: unknown,
  fallback: string | number
): string | number {
  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return value;
  }

  return fallback;
}

function normalizePositiveInteger(value: unknown) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 1;
  }

  return Math.max(
    1,
    Math.floor(numericValue)
  );
}

function normalizePositiveNumber(value: unknown) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.max(0, numericValue);
}

function normalizeOptionalString(
  value: unknown
): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();

  return normalized || undefined;
}

function normalizeCartItem(
  item: unknown,
  index: number
): NormalizedCartItem {
  const source = toRecord(item);
  const fallbackId = String(index + 1);

  const id = normalizeIdentifier(
    source.id ?? source.sku,
    fallbackId
  );

  const sku = normalizeIdentifier(
    source.sku,
    id
  );

  const rawName =
    source.name ??
    source.title ??
    source.productName ??
    source.display_name ??
    `Item ${index + 1}`;

  const name =
    String(rawName || "").trim() ||
    `Item ${index + 1}`;

  const url =
    normalizeOptionalString(source.url) ??
    "/";

  const image =
    normalizeOptionalString(source.image);

  return {
    id,
    sku,
    name,
    price: normalizePositiveNumber(
      source.price
    ),
    qty: normalizePositiveInteger(
      source.qty
    ),
    url,
    image,
  };
}

function DisabledAffirmButton() {
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm font-black text-white/35"
      title="Add products to cart first"
    >
      Pay with Affirm
    </button>
  );
}

export default function PayWithAffirm() {
  const {
    items,
    totalUSD,
  } = useCart();

  const cartItems =
    useMemo<NormalizedCartItem[]>(() => {
      const sourceItems =
        Array.isArray(items)
          ? items
          : [];

      return sourceItems
        .map(normalizeCartItem)
        .filter(
          (item) =>
            item.price > 0 &&
            item.qty > 0
        );
    }, [items]);

  const numericTotal =
    Number(totalUSD);

  const safeTotal =
    Number.isFinite(numericTotal)
      ? Math.max(0, numericTotal)
      : 0;

  const canCheckout =
    cartItems.length > 0 &&
    safeTotal > 0;

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