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

export type AffirmCheckoutPayload = {
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

const DEFAULT_BASE_URL =
  "https://voltride.agency";

const DEFAULT_ADDRESS = {
  line1: "11510 Biscayne Blvd",
  city: "Miami",
  state: "FL",
  zip: "33181",
} as const;

const DEFAULT_EMAIL =
  "Voltrideelectric1@gmail.com";

const MERCHANT_NAME =
  "Voltride Electric LLC";

function toCents(
  usd: number = 0
): number {
  const value = Number(usd);

  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(
    0,
    Math.round(value * 100)
  );
}

function normalizeQuantity(
  value: unknown
): number {
  const quantity = Number(value);

  if (!Number.isFinite(quantity)) {
    return 1;
  }

  return Math.max(
    1,
    Math.floor(quantity)
  );
}

function nonEmptyOrFallback(
  value: unknown,
  fallback: string
): string {
  const normalized =
    String(value ?? "").trim();

  return normalized || fallback;
}

function safeBase(
  origin?: string
): string {
  const candidate =
    String(origin || "").trim() ||
    (typeof window !== "undefined"
      ? window.location.origin
      : "");

  if (!candidate) {
    return DEFAULT_BASE_URL;
  }

  try {
    const url = new URL(candidate);

    return url.origin.replace(
      /\/+$/,
      ""
    );
  } catch {
    return DEFAULT_BASE_URL;
  }
}

function toAbsoluteUrl(
  base: string,
  value?: string,
  fallbackPath = "/"
): string {
  const safeBaseUrl =
    safeBase(base);

  const raw =
    String(value || "").trim();

  try {
    return new URL(
      raw || fallbackPath,
      safeBaseUrl
    ).toString();
  } catch {
    return new URL(
      fallbackPath,
      DEFAULT_BASE_URL
    ).toString();
  }
}

function normalizeState(
  state: string
): string {
  return String(state || "")
    .trim()
    .toUpperCase()
    .slice(0, 2);
}

function normalizeZip(
  zip: string
): string {
  const normalized =
    String(zip || "").trim();

  const match =
    normalized.match(
      /^(\d{5})(-\d{4})?$/
    );

  return match
    ? match[0]
    : normalized;
}

function normalizeCity(
  city: string
): string {
  return String(city || "").trim();
}

function normalizePhone(
  phone?: string
): string | undefined {
  const raw =
    String(phone || "").trim();

  if (!raw) {
    return undefined;
  }

  const digits =
    raw.replace(/\D/g, "");

  if (!digits) {
    return undefined;
  }

  if (digits.length === 10) {
    return digits;
  }

  if (
    digits.length === 11 &&
    digits.startsWith("1")
  ) {
    return digits;
  }

  return digits;
}

function looksLikeImageUrl(
  url: string
): boolean {
  try {
    const parsed =
      new URL(url);

    const pathname =
      parsed.pathname.toLowerCase();

    return (
      pathname.endsWith(".png") ||
      pathname.endsWith(".jpg") ||
      pathname.endsWith(".jpeg") ||
      pathname.endsWith(".webp") ||
      pathname.endsWith(".gif")
    );
  } catch {
    return false;
  }
}

function buildName(
  customer: Customer
): AffirmName {
  return {
    first: nonEmptyOrFallback(
      customer.firstName,
      "Customer"
    ),

    last: nonEmptyOrFallback(
      customer.lastName,
      "Buyer"
    ),
  };
}

function buildAddress(
  customer: Customer
): AffirmAddress {
  const line1 =
    nonEmptyOrFallback(
      customer.address?.line1,
      DEFAULT_ADDRESS.line1
    );

  const line2 =
    String(
      customer.address?.line2 ||
        ""
    ).trim();

  const city =
    nonEmptyOrFallback(
      normalizeCity(
        customer.address?.city ||
          ""
      ),
      DEFAULT_ADDRESS.city
    );

  const state =
    nonEmptyOrFallback(
      normalizeState(
        customer.address?.state ||
          ""
      ),
      DEFAULT_ADDRESS.state
    );

  const zipcode =
    nonEmptyOrFallback(
      normalizeZip(
        customer.address?.zip ||
          ""
      ),
      DEFAULT_ADDRESS.zip
    );

  return {
    line1,

    ...(line2
      ? {
          line2,
        }
      : {}),

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
  merchantBase =
    typeof window !== "undefined"
      ? window.location.origin
      : DEFAULT_BASE_URL
): AffirmCheckoutPayload {
  const base =
    safeBase(merchantBase);

  const sourceItems =
    Array.isArray(items)
      ? items
      : [];

  const mapped: AffirmItem[] =
    sourceItems
      .map(
        (
          product,
          index
        ): AffirmItem => {
          const unitPrice =
            toCents(
              product.price
            );

          const qty =
            normalizeQuantity(
              product.qty
            );

          const rawTitle =
            String(
              product.title ||
                ""
            ).trim();

          const displayName =
            nonEmptyOrFallback(
              rawTitle,
              `Item ${index + 1}`
            ).slice(0, 120);

          const rawId =
            product.id;

          const sku =
            rawId !== undefined &&
            rawId !== null &&
            String(rawId).trim()
              ? String(rawId).trim()
              : `ITEM-${index + 1}`;

          const item: AffirmItem = {
            display_name:
              displayName,

            sku,

            unit_price:
              unitPrice,

            qty,

            item_url:
              toAbsoluteUrl(
                base,
                product.url,
                "/"
              ),
          };

          if (product.image) {
            const imageUrl =
              toAbsoluteUrl(
                base,
                product.image,
                "/"
              );

            if (
              looksLikeImageUrl(
                imageUrl
              )
            ) {
              item.item_image_url =
                imageUrl;
            }
          }

          return item;
        }
      )
      .filter(
        (item) =>
          item.unit_price > 0 &&
          item.qty > 0
      );

  const shippingC =
    toCents(
      totals.shippingUSD ?? 0
    );

  const taxC =
    toCents(
      totals.taxUSD ?? 0
    );

  /*
   * The checkout subtotal is derived from the exact items
   * sent to Affirm so that the item breakdown and total
   * always remain consistent.
   *
   * totals.subtotalUSD remains part of the public contract
   * because callers already provide it.
   */
  const subtotalC =
    mapped.reduce(
      (total, item) =>
        total +
        item.unit_price *
          item.qty,
      0
    );

  const totalC =
    subtotalC +
    shippingC +
    taxC;

  const name =
    buildName(customer);

  const address =
    buildAddress(customer);

  const email =
    nonEmptyOrFallback(
      customer.email,
      DEFAULT_EMAIL
    );

  const phone =
    normalizePhone(
      customer.phone
    );

  return {
    merchant: {
      user_confirmation_url:
        toAbsoluteUrl(
          base,
          "/checkout/affirm/confirm",
          "/"
        ),

      user_cancel_url:
        toAbsoluteUrl(
          base,
          "/checkout/affirm/cancel",
          "/"
        ),

      user_confirmation_url_action:
        "GET",

      name: MERCHANT_NAME,
    },

    items: mapped,

    currency: "USD",

    shipping_amount:
      shippingC,

    tax_amount:
      taxC,

    total: totalC,

    metadata: {
      mode: "modal",
    },

    billing: {
      name,
      address,
      email,

      ...(phone
        ? {
            phone_number:
              phone,
          }
        : {}),
    },

    shipping: {
      name,
      address,

      ...(phone
        ? {
            phone_number:
              phone,
          }
        : {}),
    },
  };
}