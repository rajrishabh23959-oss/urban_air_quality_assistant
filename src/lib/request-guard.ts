export type JsonReadResult =
  { ok: true; data: unknown } | { ok: false; status: 400 | 413 | 415; error: string };

/**
 * Verifies that the request declares an application/json Content-Type.
 */
export function requireJsonContentType(request: Request): boolean {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  return contentType.includes("application/json");
}

async function readStreamWithLimit(
  body: ReadableStream<Uint8Array>,
  maxBytes: number,
): Promise<{ ok: true; text: string } | { ok: false; status: 400 | 413; error: string }> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let text = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      if (value) {
        totalBytes += value.byteLength;
        if (totalBytes > maxBytes) {
          await reader.cancel();
          return { ok: false, status: 413, error: "Request payload too large." };
        }
        text += decoder.decode(value, { stream: true });
      }
    }
    return { ok: true, text: text + decoder.decode() };
  } catch {
    return { ok: false, status: 400, error: "Unable to read request body." };
  }
}

/**
 * Streams and parses a JSON request body while enforcing a strict maximum byte size.
 */
export async function readJsonWithLimit(
  request: Request,
  maxBytes = 65_536,
): Promise<JsonReadResult> {
  if (!requireJsonContentType(request)) {
    return { ok: false, status: 415, error: "Unsupported Media Type. Expected application/json." };
  }

  const declared = Number(request.headers.get("content-length"));
  if (
    request.headers.get("content-length") !== null &&
    Number.isFinite(declared) &&
    declared > maxBytes
  ) {
    return { ok: false, status: 413, error: "Request payload too large." };
  }

  let rawText = "";
  if (request.body) {
    const streamed = await readStreamWithLimit(request.body, maxBytes);
    if (!streamed.ok) {
      return streamed;
    }
    rawText = streamed.text;
  } else {
    try {
      rawText = await request.text();
    } catch {
      return { ok: false, status: 400, error: "Unable to read request body." };
    }
    if (new TextEncoder().encode(rawText).byteLength > maxBytes) {
      return { ok: false, status: 413, error: "Request payload too large." };
    }
  }

  try {
    return { ok: true, data: JSON.parse(rawText) };
  } catch {
    return { ok: false, status: 400, error: "Malformed JSON request body." };
  }
}
