import "@testing-library/jest-dom/vitest";
import * as matchers from "vitest-axe/matchers";
import { ReadableStream } from "node:stream/web";
import { expect } from "vitest";

if (typeof globalThis.ReadableStream === "undefined") {
  globalThis.ReadableStream = ReadableStream as unknown as typeof globalThis.ReadableStream;
}

expect.extend(matchers);
