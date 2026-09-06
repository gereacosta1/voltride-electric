// netlify/functions/acima-order.mjs

const REQUEST_TIMEOUT_MS = 20_000;

const CORS_HEADERS = {
  "content-type":
    "application/json; charset=utf-8",

  "cache-control":
    "no-store",

  "access-control-allow-origin":
    "*",

  "access-control-allow-methods":
    "POST,OPTIONS",

  "access-control-allow-headers":
    "content-type,authorization,x-request-id,x-nf-request-id",
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  };
}

function parseJsonSafe(raw) {
  try {
    return JSON.parse(raw || "{}");
  } catch {
    return null;
  }
}

function isRecord(value) {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function nonEmptyString(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function normalizeBaseUrl(value) {
  const raw = String(value || "")
    .trim()
    .replace(/\/+$/, "");

  if (!raw) {
    return "";
  }

  try {
    const url = new URL(raw);

    if (
      url.protocol !== "https:" &&
      url.protocol !== "http:"
    ) {
      return "";
    }

    return raw;
  } catch {
    return "";
  }
}

function getAcimaBase() {
  const env = String(
    process.env.ACIMA_ENV ||
      "sandbox"
  )
    .trim()
    .toLowerCase();

  const configuredBase =
    normalizeBaseUrl(
      process.env.ACIMA_BASE_URL
    );

  if (
    process.env.ACIMA_BASE_URL &&
    !configuredBase
  ) {
    throw new Error(
      "Invalid ACIMA_BASE_URL"
    );
  }

  if (configuredBase) {
    return configuredBase;
  }

  if (
    env === "prod" ||
    env === "production"
  ) {
    return "https://api.acima.com";
  }

  return "https://api.sandbox.acima.com";
}

async function readJsonOrText(
  response
) {
  const rawText =
    await response
      .text()
      .catch(() => "");

  if (!rawText) {
    return {};
  }

  try {
    return JSON.parse(rawText);
  } catch {
    return {
      _non_json: true,
      text: rawText,
    };
  }
}

function normalizeOrderItem(
  item,
  index
) {
  if (!isRecord(item)) {
    return {
      error:
        `Invalid items[${index}]`,
    };
  }

  const description =
    nonEmptyString(
      item.description
    );

  if (!description) {
    return {
      error:
        `Missing items[${index}].description`,
    };
  }

  const numericPrice =
    Number(item.price);

  if (
    !Number.isFinite(
      numericPrice
    ) ||
    numericPrice <= 0
  ) {
    return {
      error:
        `Invalid items[${index}].price`,
    };
  }

  const numericQuantity =
    Number(item.quantity);

  if (
    !Number.isFinite(
      numericQuantity
    ) ||
    numericQuantity < 1
  ) {
    return {
      error:
        `Invalid items[${index}].quantity`,
    };
  }

  const expectedDeliveryDate =
    nonEmptyString(
      item.expected_delivery_date
    );

  if (!expectedDeliveryDate) {
    return {
      error:
        `Missing items[${index}].expected_delivery_date`,
    };
  }

  return {
    item: {
      expected_delivery_date:
        expectedDeliveryDate,

      description:
        description.slice(
          0,
          120
        ),

      price:
        numericPrice.toFixed(
          2
        ),

      quantity:
        Math.max(
          1,
          Math.floor(
            numericQuantity
          )
        ),
    },
  };
}

function normalizeItems(items) {
  if (
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return {
      error: "Missing items",
      items: [],
    };
  }

  const normalizedItems = [];

  for (
    let index = 0;
    index < items.length;
    index += 1
  ) {
    const result =
      normalizeOrderItem(
        items[index],
        index
      );

    if (result.error) {
      return {
        error: result.error,
        items: [],
      };
    }

    normalizedItems.push(
      result.item
    );
  }

  return {
    error: null,
    items: normalizedItems,
  };
}

function findInitialPayment(
  data
) {
  if (
    !Array.isArray(
      data?.payments
    )
  ) {
    return null;
  }

  return (
    data.payments.find(
      (payment) =>
        isRecord(payment) &&
        payment.type ===
          "initial"
    ) || null
  );
}

function getErrorMessage(error) {
  if (
    error instanceof Error &&
    error.message
  ) {
    return error.message;
  }

  return String(
    error || "Unknown error"
  );
}

export async function handler(
  event
) {
  const startedAt =
    Date.now();

  try {
    if (
      event.httpMethod ===
      "OPTIONS"
    ) {
      return {
        statusCode: 204,
        headers: CORS_HEADERS,
        body: "",
      };
    }

    if (
      event.httpMethod !==
      "POST"
    ) {
      return json(405, {
        ok: false,
        error:
          "Method not allowed",
      });
    }

    const token = String(
      process.env
        .ACIMA_ACCESS_TOKEN ||
        ""
    ).trim();

    if (!token) {
      return json(500, {
        ok: false,
        error:
          "Missing ACIMA_ACCESS_TOKEN",
      });
    }

    const body =
      parseJsonSafe(
        event.body
      );

    if (
      !body ||
      !isRecord(body)
    ) {
      return json(400, {
        ok: false,
        error:
          "Invalid JSON body",
      });
    }

    /*
     * contract_guid is the canonical field used by
     * the frontend.
     *
     * lease_guid is kept as a backwards-compatible
     * fallback in case an older client still sends it.
     */
    const contractGuid =
      nonEmptyString(
        body.contract_guid
      ) ||
      nonEmptyString(
        body.lease_guid
      );

    if (!contractGuid) {
      return json(400, {
        ok: false,
        error:
          "Missing contract_guid",
      });
    }

    const normalized =
      normalizeItems(
        body.items
      );

    if (normalized.error) {
      return json(400, {
        ok: false,
        error:
          normalized.error,
      });
    }

    const baseUrl =
      getAcimaBase();

    const endpoint =
      `${baseUrl}/api/contracts/${encodeURIComponent(
        contractGuid
      )}/customer_order`;

    const controller =
      new AbortController();

    const timeoutId =
      setTimeout(() => {
        controller.abort();
      }, REQUEST_TIMEOUT_MS);

    let response;

    try {
      response =
        await fetch(
          endpoint,
          {
            method: "PUT",

            headers: {
              "content-type":
                "application/json",

              accept:
                "application/vnd.acima-v3+json",

              authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({
                items:
                  normalized.items,
              }),

            signal:
              controller.signal,
          }
        );
    } finally {
      clearTimeout(
        timeoutId
      );
    }

    const data =
      await readJsonOrText(
        response
      );

    if (!response.ok) {
      return json(
        response.status,
        {
          ok: false,

          error:
            "Acima customer order failed",

          status:
            response.status,

          duration_ms:
            Date.now() -
            startedAt,

          details:
            data,
        }
      );
    }

    const returnedContractGuid =
      typeof data
        ?.contract_guid ===
        "string" &&
      data.contract_guid.trim()
        ? data.contract_guid.trim()
        : contractGuid;

    const leaseNumber =
      typeof data
        ?.lease_number ===
        "string" &&
      data.lease_number.trim()
        ? data.lease_number.trim()
        : null;

    return json(200, {
      ok: true,

      status:
        response.status,

      duration_ms:
        Date.now() -
        startedAt,

      contract_guid:
        returnedContractGuid,

      lease_number:
        leaseNumber,

      initial_payment:
        findInitialPayment(
          data
        ),

      data,
    });
  } catch (error) {
    const isAbort =
      error?.name ===
      "AbortError";

    return json(
      isAbort ? 504 : 500,
      {
        ok: false,

        error: isAbort
          ? "Acima request timeout"
          : "Server error",

        details:
          getErrorMessage(
            error
          ),

        duration_ms:
          Date.now() -
          startedAt,
      }
    );
  }
}