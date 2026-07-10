function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST,OPTIONS",
      "access-control-allow-headers": "content-type,authorization,x-request-id,x-nf-request-id",
    },
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

function getAcimaBase() {
  const env = String(process.env.ACIMA_ENV || "sandbox").trim().toLowerCase();
  const raw = process.env.ACIMA_BASE_URL;

  if (raw) return String(raw).replace(/\/+$/, "");

  return env === "prod" || env === "production"
    ? "https://api.acima.com"
    : "https://api.sandbox.acima.com";
}

async function readJsonOrText(res) {
  const ct = String(res.headers.get("content-type") || "").toLowerCase();

  if (ct.includes("application/json")) {
    return await res.json().catch(() => ({}));
  }

  return { _non_json: true, text: await res.text().catch(() => "") };
}

function validateItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return "Missing items";
  }

  for (const [index, item] of items.entries()) {
    if (!item.description) return `Missing items[${index}].description`;
    if (!item.price) return `Missing items[${index}].price`;
    if (!item.quantity) return `Missing items[${index}].quantity`;
    if (!item.expected_delivery_date) {
      return `Missing items[${index}].expected_delivery_date`;
    }
  }

  return null;
}

export async function handler(event) {
  try {
    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 204, headers: json(200, {}).headers, body: "" };
    }

    if (event.httpMethod !== "POST") {
      return json(405, { ok: false, error: "Method not allowed" });
    }

    const token = String(process.env.ACIMA_ACCESS_TOKEN || "").trim();

    if (!token) {
      return json(500, { ok: false, error: "Missing ACIMA_ACCESS_TOKEN" });
    }

    const body = parseJsonSafe(event.body);

    if (!body) {
      return json(400, { ok: false, error: "Invalid JSON body" });
    }

    const contractGuid = String(body.contract_guid || body.lease_guid || "").trim();

    if (!contractGuid) {
      return json(400, { ok: false, error: "Missing contract_guid" });
    }

    const items = body.items || [];
    const validationError = validateItems(items);

    if (validationError) {
      return json(400, { ok: false, error: validationError });
    }

    const endpoint = `${getAcimaBase()}/api/contracts/${contractGuid}/customer_order`;

    const res = await fetch(endpoint, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        accept: "application/vnd.acima-v3+json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ items }),
    });

    const data = await readJsonOrText(res);

    if (!res.ok) {
      return json(res.status, {
        ok: false,
        error: "Acima customer order failed",
        status: res.status,
        details: data,
      });
    }

    return json(200, {
      ok: true,
      status: res.status,
      contract_guid: data?.contract_guid || contractGuid,
      lease_number: data?.lease_number || null,
      initial_payment: data?.payments?.find?.((p) => p.type === "initial") || null,
      data,
    });
  } catch (err) {
    return json(500, {
      ok: false,
      error: "Server error",
      details: String(err?.message || err),
    });
  }
}