export type JsonReadResult =
  { ok: true; data: unknown } | { ok: false; status: 400 | 413; error: string };

/**
 * Reads and parses a JSON request body while enforcing a strict maximum byte size.
 */
export async function readJsonWithLimit(
  request: Request,
  maxBytes = 65_536,
): Promise<JsonReadResult> {
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

  let rawText: string;
  try {
    rawText = await request.text();
  } catch {
    return {
      ok: false,
      status: 400,
      error: "Unable to read request body.",
    };
  }

  const actualBytes = Buffer.byteLength(rawText, "utf8");
  if (actualBytes > maxBytes) {
    return {
      ok: false,
      status: 413,
      error: "Request payload too large.",
    };
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
