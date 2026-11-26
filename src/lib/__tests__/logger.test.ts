import { afterEach, describe, expect, it, vi } from "vitest";
import { logger } from "@/lib/logger";

describe("structured logger", () => {
  afterEach(() => {
    delete process.env.LOG_LEVEL;
    vi.restoreAllMocks();
  });

  it("writes JSON logs to stdout/stderr according to LOG_LEVEL", () => {
    process.env.LOG_LEVEL = "debug";
    const stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    logger.debug("debug msg", { a: 1 });
    logger.info("info msg");
    logger.warn("warn msg");
    logger.error("error msg", { code: 500 });

    expect(stdoutSpy).toHaveBeenCalledTimes(2);
    expect(stderrSpy).toHaveBeenCalledTimes(2);

    delete process.env.LOG_LEVEL;
    vi.stubEnv("NODE_ENV", "production");
    logger.info("prod info msg");
    expect(stdoutSpy).toHaveBeenCalledTimes(3);
    vi.unstubAllEnvs();
  });
});
