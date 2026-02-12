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

export function buildAffirmCheckout(
  items: CartItem[],
  totals: Totals,
  customer: Customer,
  merchantBase = window.location.origin
) {
  const mapped = items.map((p, idx) => ({
    display_name: (p.title || `Item ${idx + 1}`).toString().slice(0, 120),
    sku: String(p.id),
    unit_price: toCents(p.price),
    qty: Math.max(1, Number(p.qty) || 1),
    item_url: p.url?.startsWith("http") ? p.url : merchantBase + (p.url || "/"),
    image_url: p.image
      ? p.image.startsWith("http")
        ? p.image
        : merchantBase + p.image
      : undefined,
  }));

  const shippingC = toCents(totals.shippingUSD ?? 0);
  const taxC = toCents(totals.taxUSD ?? 0);
  const subtotalC = mapped.reduce((acc, it) => acc + it.unit_price * it.qty, 0);
  const totalC = subtotalC + shippingC + taxC;

  const name = {
    first: String(customer.firstName || "").trim(),
    last: String(customer.lastName || "").trim(),
  };

  const address = {
    line1: String(customer.address.line1 || "").trim(),
    city: String(customer.address.city || "").trim(),
    state: String(customer.address.state || "").trim().toUpperCase(),
    zipcode: String(customer.address.zip || "").trim(),
    country: String(customer.address.country || "US").trim().toUpperCase(),
  };

  return {
    merchant: {
      user_confirmation_url: merchantBase + "/affirm/confirm.html",
      user_cancel_url: merchantBase + "/affirm/cancel.html",
      user_confirmation_url_action: "GET",
      name: "VOLTRIDE ELECTRIC LLC",
    },
    items: mapped,
    currency: "USD",
    shipping_amount: shippingC,
    tax_amount: taxC,
    total: totalC,
    metadata: { mode: "modal" },
    billing: { name, address, email: String(customer.email || "").trim() },
    shipping: { name, address },
  };
}
