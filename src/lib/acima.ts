export type AcimaApplicant = {
  first_name: string;
  last_name: string;
  email: string;
  ssn: string;
  dob: string;
  address_1: string;
  address_2?: string;
  city: string;
  state: string;
  zip: string;
  mobile_phone: string;
  language?: "en" | "es";
  id_document?: {
    type: "drivers_license" | "itin";
    number: string;
    state?: string;
    expiration?: string;
  };
  bank_account?: {
    routing_number: string;
    account_number: string;
  };
  employment?: {
    income_type?: string;
    payment_method?: string;
    pay_frequency?: string;
    last_payday_on?: string;
    next_payday_on?: string;
    monthly_income?: number | string;
    monthly_net?: number | string;
  };
};

export type AcimaOrderItem = {
  expected_delivery_date: string;
  description: string;
  price: string;
  quantity: number;
};

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data?.ok === false) {
    throw new Error(data?.error || `Request failed: ${res.status}`);
  }

  return data as T;
}

export async function createAcimaApplication(params: {
  applicant: AcimaApplicant;
  digital_verification_session_id?: string;
}) {
  return postJson<{
    ok: boolean;
    contract_guid: string | null;
    status_code: string | null;
    amount_approved: number | null;
    data: any;
  }>("/.netlify/functions/acima-application", params);
}

export async function createAcimaCustomerOrder(params: {
  contract_guid: string;
  items: AcimaOrderItem[];
}) {
  return postJson<{
    ok: boolean;
    contract_guid: string;
    lease_number: string | null;
    initial_payment: any;
    data: any;
  }>("/.netlify/functions/acima-order", params);
}

export function buildAcimaOrderItems(
  items: Array<{
    title: string;
    price: number;
    qty: number;
  }>,
  expectedDeliveryDate: string
): AcimaOrderItem[] {
  return items.map((item) => ({
    expected_delivery_date: expectedDeliveryDate,
    description: String(item.title || "Product").slice(0, 120),
    price: Number(item.price || 0).toFixed(2),
    quantity: Math.max(1, Number(item.qty || 1)),
  }));
}