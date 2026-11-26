import { describe, expect, it } from "vitest";
import { readJsonWithLimit, requireJsonContentType } from "@/lib/request-guard";

describe("request-guard", () => {
  it("validates application/json Content-Type", () => {
    expect(
      requireJsonContentType(
        new Request("http://localhost", {
          method: "POST",
          headers: { "content-type": "application/json; charset=utf-8" },
        }),
      ),
    ).toBe(true);
    expect(requireJsonContentType(new Request("http://localhost", { method: "POST" }))).toBe(false);
  });

  it("handles bodyless fallback, content-length 413, and stream read errors", async () => {
    const tooBigHeader = new Request("http://localhost", {
      method: "POST",
      headers: { "content-type": "application/json", "content-length": "999999" },
      body: "{}",
    });
    expect(await readJsonWithLimit(tooBigHeader, 100)).toMatchObject({ ok: false, status: 413 });

    const brokenStream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.error(new Error("Stream broken"));
      },
    });
    const brokenReq = new Request("http://localhost", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: brokenStream,
      // @ts-expect-error Node fetch supports duplex on Request with ReadableStream
      duplex: "half",
    });
    expect(await readJsonWithLimit(brokenReq, 100)).toMatchObject({ ok: false, status: 400 });

    const nullBodyReq = {
      headers: new Headers({ "content-type": "application/json" }),
      body: null,
      text: async () => '{"ok":true}',
    } as unknown as Request;
    expect(await readJsonWithLimit(nullBodyReq, 100)).toEqual({ ok: true, data: { ok: true } });

    const oversizedNullBody = {
      headers: new Headers({ "content-type": "application/json" }),
      body: null,
      text: async () => "x".repeat(200),
    } as unknown as Request;
    expect(await readJsonWithLimit(oversizedNullBody, 100)).toMatchObject({
      ok: false,
      status: 413,
    });
  });
});
