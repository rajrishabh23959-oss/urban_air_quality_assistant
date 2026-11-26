export type JsonReadResult =
  { ok: true; data: unknown } | { ok: false; status: 400 | 413 | 415; error: string };

/**
 * Verifies that the request declares an application/json Content-Type.
 */
export function requireJsonContentType(request: Request): boolean {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  return contentType.includes("application/json");
}

/**
 * Streams and parses a JSON request body while enforcing a strict maximum byte size
 * without buffering unbounded chunked payloads in memory.
 */
export async function readJsonWithLimit(
  request: Request,
  maxBytes = 65_536,
): Promise<JsonReadResult> {
  if (!requireJsonContentType(request)) {
    return {
      ok: false,
      status: 415,
      error: "Unsupported Media Type. Expected application/json.",
    };
  }

  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader !== null) {
    const declaredLength = Number(contentLengthHeader);
    if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
      return {
        ok: false,
        status: 413,
        error: "Request payload too large.",
      };
    }
  }

  let rawText = "";

  if (request.body) {
    const reader = request.body.getReader();
    const decoder = new TextDecoder();
    let totalBytes = 0;

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
            return {
              ok: false,
              status: 413,
              error: "Request payload too large.",
            };
          }
          rawText += decoder.decode(value, { stream: true });
        }
      }
      rawText += decoder.decode();
    } catch {
      return {
        ok: false,
        status: 400,
        error: "Unable to read request body.",
      };
    }
  } else {
    try {
      rawText = await request.text();
    } catch {
      return {
        ok: false,
        status: 400,
        error: "Unable to read request body.",
      };
    }
    if (Buffer.byteLength(rawText, "utf8") > maxBytes) {
      return {
        ok: false,
        status: 413,
        error: "Request payload too large.",
      };
    }
  }

  try {
    const data: unknown = JSON.parse(rawText);
    return { ok: true, data };
  } catch {
    return {
      ok: false,
      status: 400,
      error: "Malformed JSON request body.",
    };
  }
}
