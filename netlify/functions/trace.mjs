// netlify/functions/trace.mjs
function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
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

// sanitiza por si alguien manda algo grande
function clampObject(obj, maxLen = 500) {
  try {
    const s = JSON.stringify(obj);
    if (s.length <= maxLen) return obj;
    return { _truncated: true, preview: s.slice(0, maxLen) };
  } catch {
    return { _unserializable: true };
  }
}

export async function handler(event) {
  const reqId =
    event.headers?.["x-nf-request-id"] ||
    event.headers?.["x-request-id"] ||
    null;

  try {
    if (event.httpMethod === "OPTIONS") {
      return json(204, { ok: true });
    }

    if (event.httpMethod !== "POST") {
      return json(405, { error: "Method not allowed" });
    }

    const body = parseJsonSafe(event.body);
    if (!body) return json(400, { error: "Invalid JSON body" });

    const debugId = body.debugId ? String(body.debugId).trim() : null;
    const step = body.step ? String(body.step).trim() : "trace";
    const ts = body.ts ? String(body.ts).trim() : null;

    // data es opcional, pero lo acotamos
    const data = clampObject(body.data || {}, 900);

    // Este log es el “registro” que querés tener aunque no estés mirando.
    console.log("[trace]", {
      reqId,
      debugId,
      step,
      ts,
      data,
      href: body.href ? String(body.href).slice(0, 180) : null,
      ua: body.ua ? String(body.ua).slice(0, 180) : null,
    });

    // 204 para no generar ruido en cliente (pero JSON igual por simplicidad)
    return json(204, { ok: true });
  } catch (err) {
    console.error("[trace] fatal", {
      reqId,
      error: String(err?.message || err),
    });
    return json(500, { error: "Server error" });
  }
}