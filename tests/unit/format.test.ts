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

describe("formatPrice — §7.4 compliance axes (TASK-039 AC 3)", () => {
  it("groups thousands with NBSP U+00A0 (never comma or plain space)", () => {
    expect(formatPrice(1290)).toBe("1 290 грн");
    expect(formatPrice(1234567)).toBe("1 234 567 грн");
    expect(formatPrice(1290)).not.toMatch(/[,]| /);
  });
  it("does not group 3-digit amounts, groups from 4 digits", () => {
    expect(formatPrice(999)).toBe("999 грн");
    expect(formatPrice(1000)).toBe("1 000 грн");
  });
  it("uses comma decimals with exactly two kopiyka digits when fractional", () => {
    expect(formatPrice(1290.5)).toBe("1 290,50 грн");
    expect(formatPrice(0.05)).toBe("0,05 грн");
  });
  it("renders whole amounts without ,00 — documented ruling 1 (spec §5)", () => {
    expect(formatPrice(1290)).not.toContain(",");
  });
  it("places «грн» after the amount joined by NBSP, no trailing period (ДСТУ 3582:2013)", () => {
    expect(formatPrice(5)).toBe("5 грн");
    expect(formatPrice(5).endsWith(".")).toBe(false);
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
