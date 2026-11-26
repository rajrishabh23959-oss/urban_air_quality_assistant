import { describe, expect, it } from "vitest";
import { TtlLruCache } from "@/lib/cache";

describe("TtlLruCache", () => {
  it("stores and retrieves entries before TTL expires", () => {
    const cache = new TtlLruCache<string>(3, 1000);
    cache.set("a", "alpha", 1000, 100);
    expect(cache.get("a", 500)).toBe("alpha");
  });

  it("expires entries after TTL elapses", () => {
    const cache = new TtlLruCache<string>(3, 1000);
    cache.set("a", "alpha", 1000, 100);
    expect(cache.get("a", 1100)).toBeUndefined();
    expect(cache.size).toBe(0);
  });

  it("evicts least recently used entry when capacity is exceeded", () => {
    const cache = new TtlLruCache<string>(2, 1000);
    cache.set("a", "1", 1000, 0);
    cache.set("b", "2", 1000, 10);
    // Access "a" so "b" becomes LRU
    expect(cache.get("a", 20)).toBe("1");
    cache.set("c", "3", 1000, 30);

    expect(cache.get("b", 40)).toBeUndefined();
    expect(cache.get("a", 40)).toBe("1");
    expect(cache.get("c", 40)).toBe("3");

    expect(cache.delete("a")).toBe(true);
    cache.clear();
    expect(cache.size).toBe(0);
    expect(() => new TtlLruCache(0, 1000)).toThrow();
    expect(() => new TtlLruCache(1, 0)).toThrow();
  });
});
