/**
 * Shared product-display constants and helpers (TASK-037): single source for
 * the size ranking and colorway swatch classes that ProductCard,
 * QuickViewDialog, and the PDP all render.
 */

/** Canonical display order; any other Size value (e.g. «Один розмір») is appended after, in first-seen order. */
export const SIZE_ORDER = ["S", "M", "L", "XL", "XXL"] as const;

export const COLOR_SWATCH_CLASSES: Record<string, string> = {
  Чорний: "bg-black border-border-strong",
  Білий: "bg-[#f5f5f5] border-border",
};

/** Dedupes size values and orders them S · M · L · XL · XXL, extras appended in first-seen order. */
export function rankSizeValues(values: string[]): string[] {
  const unique = Array.from(new Set(values));
  const ranked = SIZE_ORDER.filter((s) => unique.includes(s));
  const extras = unique.filter((v) => !(SIZE_ORDER as readonly string[]).includes(v));
  return [...ranked, ...extras];
}
