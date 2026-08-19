import { describe, expect, it } from "vitest";
import { matchesApiKey } from "../src/server.js";

describe("matchesApiKey", () => {
  const key = "a".repeat(32);

  it("accepts the configured key", () => {
    expect(matchesApiKey(key, key)).toBe(true);
  });

  it("rejects incorrect keys of any length", () => {
    expect(matchesApiKey("b".repeat(32), key)).toBe(false);
    expect(matchesApiKey("short", key)).toBe(false);
  });
});
