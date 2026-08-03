import { describe, it, expect } from "vitest";
import { SIZE_ORDER, COLOR_SWATCH_CLASSES, rankSizeValues } from "@/lib/product-display";

describe("product-display", () => {
  it("SIZE_ORDER is the canonical S→XXL ranking", () => {
    expect([...SIZE_ORDER]).toEqual(["S", "M", "L", "XL", "XXL"]);
  });

  it("rankSizeValues dedupes and ranks known sizes, appends extras in first-seen order", () => {
    expect(rankSizeValues(["XL", "S", "XL", "One size", "M"])).toEqual([
      "S",
      "M",
      "XL",
      "One size",
    ]);
  });

  it("rankSizeValues returns [] for empty input", () => {
    expect(rankSizeValues([])).toEqual([]);
  });

  it("swatch classes cover the seed colorways", () => {
    expect(Object.keys(COLOR_SWATCH_CLASSES)).toEqual(expect.arrayContaining(["Чорний", "Білий"]));
  });
});
