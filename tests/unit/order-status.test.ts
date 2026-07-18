import { describe, it, expect } from "vitest";
import { OrderStatus } from "@prisma/client";
import { getOrderStatusStyle, getOrderStatusLabel, ORDER_STATUS_STYLES } from "@/lib/order-status";

describe("order-status", () => {
  // Iterates the real Prisma enum rather than a hardcoded local list, so that
  // adding a status to the schema (e.g. upcoming Ukraine COD work) fails this
  // test instead of silently falling through to ORDER_STATUS_STYLES' default.
  it("defines a style for every OrderStatus value", () => {
    for (const s of Object.values(OrderStatus)) {
      expect(ORDER_STATUS_STYLES[s]).toBeTruthy();
    }
  });

  it("uses the destructive token only for negative terminal states", () => {
    expect(getOrderStatusStyle("CANCELLED")).toContain("destructive");
    expect(getOrderStatusStyle("REFUNDED")).toContain("destructive");
    expect(getOrderStatusStyle("DELIVERED")).not.toContain("destructive");
    expect(getOrderStatusStyle("PENDING")).not.toContain("destructive");
  });

  it("contains no bright color utilities", () => {
    const bright = /-(red|blue|green|yellow|amber|orange|purple|indigo|pink|emerald|teal|gray)-\d/;
    for (const cls of Object.values(ORDER_STATUS_STYLES)) {
      expect(cls).not.toMatch(bright);
    }
  });

  it("labels known statuses and falls back to the raw value", () => {
    expect(getOrderStatusLabel("SHIPPED")).toBe("Shipped");
    expect(getOrderStatusLabel("WEIRD")).toBe("WEIRD");
  });
});
