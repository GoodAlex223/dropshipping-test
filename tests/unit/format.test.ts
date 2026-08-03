import { describe, expect, it } from "vitest";
import { formatPrice, pluralizeUk } from "@/lib/format";

//   = non-breaking space (uk-UA group separator AND the amount–грн joiner).
// Decision doc §7.4: currency word AFTER the amount, Intl-based, never hand-rolled.
describe("formatPrice", () => {
  it("formats integer UAH amounts without decimals, nbsp-grouped", () => {
    expect(formatPrice(1290)).toBe("1 290 грн");
    expect(formatPrice(590)).toBe("590 грн");
    expect(formatPrice(0)).toBe("0 грн");
  });

  it("formats fractional amounts with exactly two comma decimals", () => {
    expect(formatPrice(1290.5)).toBe("1 290,50 грн");
    expect(formatPrice(2150.75)).toBe("2 150,75 грн");
  });

  it("accepts Prisma Decimal strings (integer-valued strings drop decimals)", () => {
    expect(formatPrice("1290.00")).toBe("1 290 грн");
    expect(formatPrice("589.99")).toBe("589,99 грн");
  });

  it("renders negative amounts (discount lines) with a leading minus", () => {
    expect(formatPrice(-50)).toBe("-50 грн");
  });

  it("degrades non-finite input to zero instead of rendering NaN", () => {
    expect(formatPrice(Number.NaN)).toBe("0 грн");
    expect(formatPrice("not-a-price")).toBe("0 грн");
  });
});

describe("pluralizeUk", () => {
  const forms = ["відгук", "відгуки", "відгуків"] as const;
  it.each([
    [1, "відгук"],
    [21, "відгук"],
    [101, "відгук"],
    [2, "відгуки"],
    [3, "відгуки"],
    [4, "відгуки"],
    [22, "відгуки"],
    [5, "відгуків"],
    [11, "відгуків"],
    [12, "відгуків"],
    [14, "відгуків"],
    [111, "відгуків"],
    [0, "відгуків"],
  ])("%i → %s", (n, expected) => {
    expect(pluralizeUk(n, forms[0], forms[1], forms[2])).toBe(expected);
  });
});
