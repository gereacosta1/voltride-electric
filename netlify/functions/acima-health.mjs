function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
    body: JSON.stringify(body),
  };
}

export async function handler() {
  const env = String(process.env.ACIMA_ENV || "sandbox").trim().toLowerCase();

  return json(200, {
    ok: true,
    service: "acima",
    env,
    has_access_token: Boolean(process.env.ACIMA_ACCESS_TOKEN),
    has_location_guid: Boolean(process.env.ACIMA_LOCATION_GUID),
    has_webhook_secret: Boolean(process.env.ACIMA_WEBHOOK_SECRET),
  });
}