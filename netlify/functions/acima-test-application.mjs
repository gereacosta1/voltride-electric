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

  const res = await fetch(`${baseUrl}/.netlify/functions/acima-application`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      applicant: {
        first_name: "John",
        last_name: "Smith",
        email: "johnsmith@test.com",
        ssn: String(Date.now()).slice(-9),
        dob: "1980-03-15",
        address_1: "11510 Biscayne Blvd",
        city: "Miami",
        state: "FL",
        zip: "33181",
        mobile_phone: "3055551234",
        language: "en",
        id_document: {
          type: "drivers_license",
          number: `D${Date.now()}`,
          state: "FL",
          expiration: "2040-03-31",
        },
        bank_account: {
          routing_number: "123456789",
          account_number: String(Date.now()).slice(-10),
        },
        employment: {
          income_type: "full_time_job",
          payment_method: "direct_deposit",
          pay_frequency: "bi_weekly",
          last_payday_on: "2026-07-01",
          next_payday_on: "2026-07-15",
          monthly_income: 4000,
        },
      },
      digital_verification_session_id: "sandbox-session-id",
    }),
  });

  const data = await res.json().catch(() => ({}));

  return json(res.status, {
    ok: res.ok,
    status: res.status,
    data,
  });
}