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
    state: string; // 2 letters
    zip: string; // 5 digits or ZIP+4
    country?: string; // default US
  };
};

const toCents = (usd = 0) => Math.round((Number(usd) || 0) * 100);

function safeBase(origin?: string) {
  const raw =
    String(origin || "").trim() ||
    (typeof window !== "undefined" ? window.location.origin : "");
  // asegura sin trailing slash
  return raw.replace(/\/+$/, "");
}

function toAbsoluteUrl(base: string, value?: string, fallbackPath = "/") {
  const raw = String(value || "").trim();

  try {
    if (!raw) return new URL(fallbackPath, base).toString();
    return new URL(raw, base).toString();
  } catch {
    return new URL(fallbackPath, base).toString();
  }
}

function normalizeState(state: string) {
  return String(state || "").trim().toUpperCase().slice(0, 2);
}

function normalizeZip(zip: string) {
  const z = String(zip || "").trim();
  const m = z.match(/^(\d{5})(-\d{4})?$/);
  return m ? m[0] : z;
}

function normalizeCountry(country?: string) {
  const c = String(country || "US").trim().toUpperCase();
  return c || "US";
}

function normalizeCity(city: string) {
  return String(city || "").trim();
}

export function buildAffirmCheckout(
  items: CartItem[],
  totals: Totals,
  customer: Customer,
  merchantBase = typeof window !== "undefined" ? window.location.origin : ""
) {
  const base = safeBase(merchantBase);

  const mapped = items.map((p, idx) => {
    const unitPrice = Math.max(0, toCents(Number(p.price) || 0));
    const qty = Math.max(1, Number(p.qty) || 1);

    const item: {
      display_name: string;
      sku: string;
      unit_price: number;
      qty: number;
      item_url: string;
      image_url?: string;
    } = {
      display_name: String(p.title || `Item ${idx + 1}`)
        .trim()
        .slice(0, 120),
      sku: String(p.id),
      unit_price: unitPrice,
      qty,
      item_url: toAbsoluteUrl(base, p.url, "/"),
    };

    if (p.image) item.image_url = toAbsoluteUrl(base, p.image, "/");

    return item;
  });

  const shippingC = Math.max(0, toCents(totals.shippingUSD ?? 0));
  const taxC = Math.max(0, toCents(totals.taxUSD ?? 0));

  const subtotalC = mapped.reduce((acc, it) => acc + it.unit_price * it.qty, 0);
  const totalC = subtotalC + shippingC + taxC;

  const name = {
    first: String(customer.firstName || "").trim(),
    last: String(customer.lastName || "").trim(),
  };

  const country = normalizeCountry(customer.address.country);

  const address = {
    line1: String(customer.address.line1 || "").trim(),
    line2: String(customer.address.line2 || "").trim() || undefined,
    city: normalizeCity(customer.address.city),
    state: normalizeState(customer.address.state),
    zipcode: normalizeZip(customer.address.zip),
    country,
    country_code: country,
  };

  const email = String(customer.email || "").trim();
  const phone = String(customer.phone || "").trim() || undefined;

  // ✅ Si shipping es 0, evitamos mandar shipping address (reduce validaciones/errores innecesarios)
  const includeShipping = shippingC > 0;

  const payload: any = {
    merchant: {
      user_confirmation_url: toAbsoluteUrl(base, "/checkout/affirm/confirm", "/"),
      user_cancel_url: toAbsoluteUrl(base, "/checkout/affirm/cancel", "/"),
      user_confirmation_url_action: "GET",
      name: "VOLTRIDE ELECTRIC LLC",
    },
    items: mapped,
    currency: "USD",
    shipping_amount: shippingC,
    tax_amount: taxC,
    total: totalC,
    metadata: { mode: "modal" },

    billing: {
      name,
      address,
      email,
      ...(phone ? { phone_number: phone } : {}),
    },
  };

  if (includeShipping) {
    payload.shipping = {
      name,
      address,
      ...(phone ? { phone_number: phone } : {}),
    };
  }

  return payload;
}