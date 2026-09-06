// netlify/functions/acima-application.mjs

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

function json(
  statusCode,
  body,
  additionalHeaders = {}
) {
  return {
    statusCode,

    headers: {
      ...CORS_HEADERS,
      ...additionalHeaders,
    },

    body: JSON.stringify(body),
  };
}

function parseJsonSafe(raw) {
  try {
    return JSON.parse(
      raw || "{}"
    );
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
  if (
    typeof value !== "string"
  ) {
    return "";
  }

  return value.trim();
}

function normalizeBaseUrl(value) {
  const raw =
    String(value || "")
      .trim()
      .replace(/\/+$/, "");

  if (!raw) {
    return "";
  }

  try {
    const url =
      new URL(raw);

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
  const env =
    String(
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

function validateApplication(
  applicant
) {
  if (!isRecord(applicant)) {
    return "Missing applicant";
  }

  const requiredFields = [
    "first_name",
    "last_name",
    "email",
    "ssn",
    "dob",
    "address_1",
    "city",
    "state",
    "zip",
    "mobile_phone",
  ];

  for (
    const field of requiredFields
  ) {
    if (
      !nonEmptyString(
        applicant[field]
      )
    ) {
      return `Missing applicant.${field}`;
    }
  }

  return null;
}

function getErrorMessage(
  error
) {
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

    const token =
      String(
        process.env
          .ACIMA_ACCESS_TOKEN ||
          ""
      ).trim();

    const locationGuid =
      String(
        process.env
          .ACIMA_LOCATION_GUID ||
          ""
      ).trim();

    if (!token) {
      return json(500, {
        ok: false,
        error:
          "Missing ACIMA_ACCESS_TOKEN",
      });
    }

    if (!locationGuid) {
      return json(500, {
        ok: false,
        error:
          "Missing ACIMA_LOCATION_GUID",
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

    const applicant =
      body.applicant;

    const validationError =
      validateApplication(
        applicant
      );

    if (validationError) {
      return json(400, {
        ok: false,
        error:
          validationError,
      });
    }

    const verificationSessionId =
      nonEmptyString(
        body.digital_verification_session_id
      ) ||
      "sandbox-session-id";

    /*
     * location_guid intentionally comes only from
     * the server environment. The client must not
     * be able to override the merchant location.
     */
    const payload = {
      applicant,

      location_guid:
        locationGuid,

      digital_verification_session_id:
        verificationSessionId,
    };

    const baseUrl =
      getAcimaBase();

    const endpoint =
      `${baseUrl}/api/applications`;

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
            method: "POST",

            headers: {
              "content-type":
                "application/json",

              accept:
                "application/vnd.acima-v3+json",

              authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify(
                payload
              ),

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
            "Acima application failed",

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

    const contractGuid =
      typeof data?.guid ===
        "string" &&
      data.guid.trim()
        ? data.guid.trim()
        : null;

    const statusCode =
      typeof data?.status
        ?.code === "string" &&
      data.status.code.trim()
        ? data.status.code.trim()
        : null;

    const amountApproved =
      data?.amount_approved ??
      null;

    return json(200, {
      ok: true,

      status:
        response.status,

      duration_ms:
        Date.now() -
        startedAt,

      contract_guid:
        contractGuid,

      status_code:
        statusCode,

      amount_approved:
        amountApproved,

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