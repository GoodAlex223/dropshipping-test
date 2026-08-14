/**
 * UAH display formatting per the Ukraine payments decision doc §7.4:
 * uk-UA grouping (non-breaking spaces), comma decimals, "грн" AFTER the
 * amount joined by a non-breaking space. Integers render without decimals
 * («1 290 грн»), fractional amounts with exactly two («1 290,50 грн»).
 * The only sanctioned money formatter — do not hand-roll price strings.
 */
export function formatPrice(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return formatPrice(0);
  const digits = Number.isInteger(n) ? 0 : 2;
  const formatted = new Intl.NumberFormat("uk-UA", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
  return `${formatted} грн`;
}

/**
 * Ukrainian cardinal pluralization: 1 відгук / 2-4 відгуки / 5+ відгуків
 * (with the 11-14 exception). Kept for category-client.tsx (retired by G12);
 * catalog strings use ICU plurals.
 */
export function pluralizeUk(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(Math.trunc(n));
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
