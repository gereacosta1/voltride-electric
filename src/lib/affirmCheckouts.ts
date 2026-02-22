//src/lib/affirmCheckouts.ts
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
  address: {
    line1: string;
    city: string;
    state: string;
    zip: string;
    country?: string;
  };
};

const toCents = (usd = 0) => Math.round((Number(usd) || 0) * 100);

function safeBase(origin?: string) {
  const raw =
    String(origin || "").trim() ||
    (typeof window !== "undefined" ? window.location.origin : "");
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

    if (p.image) {
      item.image_url = toAbsoluteUrl(base, p.image, "/");
    }

    return item;
  });

  const shippingC = Math.max(0, toCents(totals.shippingUSD ?? 0));
  const taxC = Math.max(0, toCents(totals.taxUSD ?? 0));

  // Subtotal se calcula desde items ya normalizados para que coincida con unit_price * qty
  const subtotalC = mapped.reduce((acc, it) => acc + it.unit_price * it.qty, 0);
  const totalC = subtotalC + shippingC + taxC;

  const name = {
    first: String(customer.firstName || "").trim(),
    last: String(customer.lastName || "").trim(),
  };

  const address = {
    line1: String(customer.address.line1 || "").trim(),
    city: String(customer.address.city || "").trim(),
    state: String(customer.address.state || "")
      .trim()
      .toUpperCase(),
    zipcode: String(customer.address.zip || "").trim(),
    country: String(customer.address.country || "US")
      .trim()
      .toUpperCase(),
  };

  return {
    merchant: {
      // Rutas SPA seguras por defecto (evitan 404 si no existen archivos .html en /public/affirm/)
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
      email: String(customer.email || "").trim(),
    },
    shipping: {
      name,
      address,
    },
  };
}