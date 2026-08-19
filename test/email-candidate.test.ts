import { describe, expect, it } from "vitest";
import { isTrackingCandidate } from "../src/email-candidate.js";
import { normalizeTrackingNumber } from "../src/extractor.js";

describe("isTrackingCandidate", () => {
  it("accepts shipping subjects", () => {
    expect(isTrackingCandidate("Your order shipped", "It is moving" )).toBe(true);
  });

  it("accepts carrier links", () => {
    expect(isTrackingCandidate("Order update", "https://www.ups.com/track?tracknum=1Z999")).toBe(true);
  });

  it("rejects unrelated mail", () => {
    expect(isTrackingCandidate("Your receipt", "Thanks for your purchase")).toBe(false);
  });
});

describe("normalizeTrackingNumber", () => {
  it("removes display punctuation", () => {
    expect(normalizeTrackingNumber(" 1z 999-abc ")).toBe("1Z999-ABC");
  });
});
