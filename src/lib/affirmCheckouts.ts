// src/lib/affirmCheckouts.ts

export type CartItem = {
  id: string | number;
  title: string;
  price: number;
  qty: number;
  image?: string;
  url?: string;
};

export type Totals = {
  subtotalUSD: number;
  shippingUSD?: number;
  taxUSD?: number;
};

export type Customer = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
    country?: string;
  };
};

type AffirmName = {
  first: string;
  last: string;
};

type AffirmAddress = {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zipcode: string;
  country_code: "US";
};

type AffirmItem = {
  display_name: string;
  sku: string;
  unit_price: number;
  qty: number;
  item_url: string;
  item_image_url?: string;
};

type AffirmCheckoutPayload = {
  merchant: {
    user_confirmation_url: string;
    user_cancel_url: string;
    user_confirmation_url_action: "GET";
    name: string;
  };
  items: AffirmItem[];
  currency: "USD";
  shipping_amount: number;
  tax_amount: number;
  total: number;
  metadata: {
    mode: "modal";
  };
  billing: {
    name: AffirmName;
    address: AffirmAddress;
    email: string;
    phone_number?: string;
  };
  shipping: {
    name: AffirmName;
    address: AffirmAddress;
    phone_number?: string;
  };
};

const toCents = (usd = 0): number =>
  Math.max(0, Math.round((Number(usd) || 0) * 100));

function safeBase(origin?: string): string {
  const raw =
    String(origin || "").trim() ||
    (typeof window !== "undefined" ? window.location.origin : "");

  return raw.replace(/\/+$/, "");
}

function toAbsoluteUrl(base: string, value?: string, fallbackPath = "/"): string {
  const raw = String(value || "").trim();

  try {
    if (!raw) return new URL(fallbackPath, base).toString();
    return new URL(raw, base).toString();
  } catch {
    return new URL(fallbackPath, base).toString();
  }
}

function normalizeState(state: string): string {
  return String(state || "").trim().toUpperCase().slice(0, 2);
}

function normalizeZip(zip: string): string {
  const z = String(zip || "").trim();
  const m = z.match(/^(\d{5})(-\d{4})?$/);
  return m ? m[0] : z;
}

function normalizeCity(city: string): string {
  return String(city || "").trim();
}

function normalizePhone(phone?: string): string | undefined {
  const p = String(phone || "").trim();
  if (!p) return undefined;

  const digits = p.replace(/\D/g, "");
  if (!digits) return undefined;

  if (digits.length === 10) return digits;
  if (digits.length === 11 && digits.startsWith("1")) return digits;

  return digits;
}

function nonEmptyOrFallback(value: string, fallback: string): string {
  const v = String(value || "").trim();
  return v.length ? v : fallback;
}

function looksLikeImageUrl(url: string): boolean {
  const clean = String(url || "").toLowerCase().split("?")[0];

  return (
    clean.endsWith(".png") ||
    clean.endsWith(".jpg") ||
    clean.endsWith(".jpeg") ||
    clean.endsWith(".webp") ||
    clean.endsWith(".gif")
  );
}

function buildName(customer: Customer): AffirmName {
  return {
    first: nonEmptyOrFallback(customer.firstName, "Customer"),
    last: nonEmptyOrFallback(customer.lastName, "Buyer"),
  };
}

function buildAddress(customer: Customer): AffirmAddress {
  const line1 = nonEmptyOrFallback(customer.address?.line1 || "", "11510 Biscayne Blvd");
  const line2 = String(customer.address?.line2 || "").trim();
  const city = nonEmptyOrFallback(normalizeCity(customer.address?.city || ""), "Miami");
  const state = nonEmptyOrFallback(normalizeState(customer.address?.state || ""), "FL");
  const zipcode = nonEmptyOrFallback(normalizeZip(customer.address?.zip || ""), "33181");

  return {
    line1,
    ...(line2 ? { line2 } : {}),
    city,
    state,
    zipcode,
    country_code: "US",
  };
}

export function buildAffirmCheckout(
  items: CartItem[],
  totals: Totals,
  customer: Customer,
  merchantBase = typeof window !== "undefined" ? window.location.origin : ""
): AffirmCheckoutPayload {
  const base = safeBase(merchantBase);

  const mapped: AffirmItem[] = (items || [])
    .map((p, idx) => {
      const unitPrice = toCents(Number(p.price) || 0);
      const qty = Math.max(1, Number(p.qty) || 1);

      const display_name = nonEmptyOrFallback(
        String(p.title || "").slice(0, 120),
        `Item ${idx + 1}`
      );

      const item: AffirmItem = {
        display_name,
        sku: nonEmptyOrFallback(String(p.id || ""), `ITEM-${idx + 1}`),
        unit_price: unitPrice,
        qty,
        item_url: toAbsoluteUrl(base, p.url, "/"),
      };

      if (p.image) {
        const abs = toAbsoluteUrl(base, p.image, "/");
        if (looksLikeImageUrl(abs)) {
          item.item_image_url = abs;
        }
      }

      return item;
    })
    .filter((item) => item.unit_price > 0 && item.qty > 0);

  const shippingC = toCents(totals.shippingUSD ?? 0);
  const taxC = toCents(totals.taxUSD ?? 0);
  const subtotalC = mapped.reduce((acc, it) => acc + it.unit_price * it.qty, 0);
  const totalC = subtotalC + shippingC + taxC;

  const name = buildName(customer);
  const address = buildAddress(customer);
  const email = nonEmptyOrFallback(customer.email || "", "Voltrideelectric1@gmail.com");
  const phone = normalizePhone(customer.phone);

  return {
    merchant: {
      user_confirmation_url: toAbsoluteUrl(base, "/checkout/affirm/confirm", "/"),
      user_cancel_url: toAbsoluteUrl(base, "/checkout/affirm/cancel", "/"),
      user_confirmation_url_action: "GET",
      name: "Voltride Electric LLC",
    },
    items: mapped,
    currency: "USD",
    shipping_amount: shippingC,
    tax_amount: taxC,
    total: totalC,
    metadata: {
      mode: "modal",
    },
    billing: {
      name,
      address,
      email,
      ...(phone ? { phone_number: phone } : {}),
    },
    shipping: {
      name,
      address,
      ...(phone ? { phone_number: phone } : {}),
    },
  };
}