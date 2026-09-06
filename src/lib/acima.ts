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

export type AcimaApplicationResponse = {
  ok: boolean;
  contract_guid: string | null;
  status_code: string | null;
  amount_approved: number | null;

  /*
   * Kept intentionally flexible because Acima may return
   * additional fields that are not consumed by the UI.
   */
  data: unknown;
};

export type AcimaCustomerOrderResponse = {
  ok: boolean;
  contract_guid: string;
  lease_number: string | null;
  initial_payment: unknown;
  data: unknown;
};

type ApiErrorPayload = {
  ok?: boolean;
  error?: unknown;
  message?: unknown;
};

function getErrorMessage(
  payload: ApiErrorPayload,
  status: number
) {
  if (
    typeof payload.error === "string" &&
    payload.error.trim()
  ) {
    return payload.error.trim();
  }

  if (
    typeof payload.message === "string" &&
    payload.message.trim()
  ) {
    return payload.message.trim();
  }

  return `Request failed: ${status}`;
}

async function parseJsonResponse(
  response: Response
): Promise<unknown> {
  const text = await response.text();

  if (!text.trim()) {
    return {};
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(
      `Invalid server response: ${response.status}`
    );
  }
}

async function postJson<T>(
  url: string,
  body: unknown
): Promise<T> {
  const response = await fetch(url, {
    method: "POST",

    headers: {
      "content-type": "application/json",
      accept: "application/json",
    },

    body: JSON.stringify(body),
  });

  const data =
    await parseJsonResponse(response);

  const payload =
    typeof data === "object" &&
    data !== null
      ? (data as ApiErrorPayload)
      : {};

  if (
    !response.ok ||
    payload.ok === false
  ) {
    throw new Error(
      getErrorMessage(
        payload,
        response.status
      )
    );
  }

  return data as T;
}

export async function createAcimaApplication(
  params: {
    applicant: AcimaApplicant;
    digital_verification_session_id?: string;
  }
): Promise<AcimaApplicationResponse> {
  return postJson<AcimaApplicationResponse>(
    "/.netlify/functions/acima-application",
    params
  );
}

export async function createAcimaCustomerOrder(
  params: {
    contract_guid: string;
    items: AcimaOrderItem[];
  }
): Promise<AcimaCustomerOrderResponse> {
  return postJson<AcimaCustomerOrderResponse>(
    "/.netlify/functions/acima-order",
    params
  );
}

export function buildAcimaOrderItems(
  items: Array<{
    title: string;
    price: number;
    qty: number;
  }>,
  expectedDeliveryDate: string
): AcimaOrderItem[] {
  return items.map((item) => {
    const rawDescription =
      String(
        item.title || ""
      ).trim();

    const numericPrice =
      Number(item.price);

    const numericQuantity =
      Number(item.qty);

    const price =
      Number.isFinite(numericPrice)
        ? Math.max(
            0,
            numericPrice
          )
        : 0;

    const quantity =
      Number.isFinite(
        numericQuantity
      )
        ? Math.max(
            1,
            Math.floor(
              numericQuantity
            )
          )
        : 1;

    return {
      expected_delivery_date:
        expectedDeliveryDate,

      description: (
        rawDescription ||
        "Product"
      ).slice(0, 120),

      price: price.toFixed(2),

      quantity,
    };
  });
}