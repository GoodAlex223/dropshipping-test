/** Window inside which a product earns the НОВИНКА badge (spec §5). */
export const NEW_BADGE_WINDOW_DAYS = 30;

/**
 * True iff the product was created strictly within the last
 * NEW_BADGE_WINDOW_DAYS. Accepts serialized (string) dates because catalog
 * cards receive JSON API responses. Invalid dates are simply not "new".
 */
export function isNewProduct(createdAt: string | Date, now: Date = new Date()): boolean {
  const created = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const age = now.getTime() - created.getTime();
  if (Number.isNaN(age)) return false;
  return age >= 0 && age < NEW_BADGE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}
