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
  const baseUrl = process.env.URL || "http://localhost:8888";

  const res = await fetch(`${baseUrl}/.netlify/functions/acima-order`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      contract_guid: "leas-test-guid",
      items: [
        {
          expected_delivery_date: "2026-07-20",
          description: "Electric Scooter 2025",
          price: "1850.00",
          quantity: 1,
        },
      ],
    }),
  });

  const data = await res.json().catch(() => ({}));

  return json(res.status, {
    ok: res.ok,
    status: res.status,
    data,
  });
}