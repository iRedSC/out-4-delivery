import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.js";

const requiredEnvironment = {
  API_KEY: "a".repeat(32),
  GMAIL_ACCOUNTS: JSON.stringify([
    { email: "first@example.com", appPassword: "abcd efgh ijkl mnop" },
    { email: "second@example.com", appPassword: "qrstuvwxyzabcdef" },
  ]),
  OPENAI_API_KEY: "openai-key",
  SHIPPO_API_TOKEN: "shippo-token",
};

describe("loadConfig", () => {
  it("parses multiple Gmail accounts and normalizes app passwords", () => {
    const config = loadConfig(requiredEnvironment);
    expect(config.GMAIL_ACCOUNTS).toEqual([
      { email: "first@example.com", appPassword: "abcdefghijklmnop" },
      { email: "second@example.com", appPassword: "qrstuvwxyzabcdef" },
    ]);
  });

  it("rejects weak API keys", () => {
    expect(() => loadConfig({ ...requiredEnvironment, API_KEY: "short" })).toThrow();
  });
});
