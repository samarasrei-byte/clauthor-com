import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logger } from "@/lib/logger";

describe("logger", () => {
  const spies = {
    debug: vi.spyOn(console, "debug").mockImplementation(() => {}),
    info: vi.spyOn(console, "info").mockImplementation(() => {}),
    warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
    error: vi.spyOn(console, "error").mockImplementation(() => {}),
  };

  beforeEach(() => {
    Object.values(spies).forEach((s) => s.mockClear());
  });

  afterEach(() => {
    Object.values(spies).forEach((s) => s.mockClear());
  });

  it("error always logs (production observability)", () => {
    logger.error("boom", { code: 500 });
    expect(spies.error).toHaveBeenCalledWith("[error]", "boom", { code: 500 });
  });

  it("info/debug/warn respect DEV flag", () => {
    // In vitest env, import.meta.env.DEV is true, so all should log.
    logger.info("hello");
    logger.debug("d");
    logger.warn("w");
    expect(spies.info).toHaveBeenCalled();
    expect(spies.debug).toHaveBeenCalled();
    expect(spies.warn).toHaveBeenCalled();
  });

  it("prefixes messages with severity tag", () => {
    logger.info("x");
    expect(spies.info).toHaveBeenCalledWith("[info]", "x");
  });
});
