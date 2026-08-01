import { describe, it, expect } from "vitest";
import { isNewProduct, NEW_BADGE_WINDOW_DAYS } from "@/lib/product-badges";

const DAY_MS = 24 * 60 * 60 * 1000;
const now = new Date("2026-07-31T12:00:00Z");

describe("isNewProduct", () => {
  it("is true for a product created 29 days ago", () => {
    expect(isNewProduct(new Date(now.getTime() - 29 * DAY_MS), now)).toBe(true);
  });

  it("is false for a product created 31 days ago", () => {
    expect(isNewProduct(new Date(now.getTime() - 31 * DAY_MS), now)).toBe(false);
  });

  it("is false at exactly the 30-day boundary", () => {
    expect(isNewProduct(new Date(now.getTime() - NEW_BADGE_WINDOW_DAYS * DAY_MS), now)).toBe(false);
  });

  it("accepts ISO-string dates (serialized API responses)", () => {
    expect(isNewProduct(new Date(now.getTime() - 2 * DAY_MS).toISOString(), now)).toBe(true);
  });

  it("is false for an invalid date string", () => {
    expect(isNewProduct("not-a-date", now)).toBe(false);
  });
});
