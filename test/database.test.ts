import { describe, expect, it } from "vitest";
import { ParcelDatabase } from "../src/database.js";

describe("ParcelDatabase", () => {
  it("deduplicates a package across Gmail accounts", () => {
    const database = new ParcelDatabase(":memory:");
    const shipment = {
      trackingNumber: "1Z999",
      carrier: "ups" as const,
      product: "Keyboard",
      merchant: "Example Store",
      estimatedDelivery: "2026-08-21",
      confidence: 0.99,
    };

    database.upsertShipment(shipment, "first@example.com", "message-1");
    database.upsertShipment({ ...shipment, product: "Package" }, "second@example.com", "message-2");

    const packages = database.listPackages();
    expect(packages).toHaveLength(1);
    expect(packages[0]?.product).toBe("Keyboard");
    expect(packages[0]?.sourceAccount).toBe("first@example.com");
    database.close();
  });
});
