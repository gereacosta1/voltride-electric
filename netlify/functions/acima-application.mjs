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

function validateApplication(applicant) {
  if (!applicant) return "Missing applicant";
  if (!applicant.first_name) return "Missing applicant.first_name";
  if (!applicant.last_name) return "Missing applicant.last_name";
  if (!applicant.email) return "Missing applicant.email";
  if (!applicant.ssn) return "Missing applicant.ssn";
  if (!applicant.dob) return "Missing applicant.dob";
  if (!applicant.address_1) return "Missing applicant.address_1";
  if (!applicant.city) return "Missing applicant.city";
  if (!applicant.state) return "Missing applicant.state";
  if (!applicant.zip) return "Missing applicant.zip";
  if (!applicant.mobile_phone) return "Missing applicant.mobile_phone";
  return null;
}

export async function handler(event) {
  const startedAt = Date.now();

  try {
    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 204, headers: json(200, {}).headers, body: "" };
    }

    if (event.httpMethod !== "POST") {
      return json(405, { ok: false, error: "Method not allowed" });
    }

    const token = String(process.env.ACIMA_ACCESS_TOKEN || "").trim();
    const locationGuid = String(process.env.ACIMA_LOCATION_GUID || "").trim();

    if (!token) {
      return json(500, { ok: false, error: "Missing ACIMA_ACCESS_TOKEN" });
    }

    if (!locationGuid) {
      return json(500, { ok: false, error: "Missing ACIMA_LOCATION_GUID" });
    }

    const body = parseJsonSafe(event.body);

    if (!body) {
      return json(400, { ok: false, error: "Invalid JSON body" });
    }

    const applicant = body.applicant || {};
    const validationError = validateApplication(applicant);

    if (validationError) {
      return json(400, { ok: false, error: validationError });
    }

    const payload = {
      applicant,
      location_guid: body.location_guid || locationGuid,
      digital_verification_session_id:
        body.digital_verification_session_id || "sandbox-session-id",
    };

    const endpoint = `${getAcimaBase()}/api/applications`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    let res;

    try {
      res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/vnd.acima-v3+json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const data = await readJsonOrText(res);

    if (!res.ok) {
      return json(res.status, {
        ok: false,
        error: "Acima application failed",
        status: res.status,
        details: data,
      });
    }

    return json(200, {
      ok: true,
      status: res.status,
      duration_ms: Date.now() - startedAt,
      contract_guid: data?.guid || null,
      status_code: data?.status?.code || null,
      amount_approved: data?.amount_approved || null,
      data,
    });
  } catch (err) {
    const isAbort = err?.name === "AbortError";

    return json(isAbort ? 504 : 500, {
      ok: false,
      error: isAbort ? "Acima request timeout" : "Server error",
      details: String(err?.message || err),
    });
  }
}