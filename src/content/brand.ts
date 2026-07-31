/**
 * Brand constants. Deliberately dependency-free: src/lib/seo.ts imports this,
 * and seo.ts is consumed by the OG image route, robots, sitemap and the
 * Google Shopping feed. Never add an import to this file — importing site.ts
 * instead would drag lucide-react into all of them.
 */

export const BRAND_NAME = "Mirox Shop";

/** Long form — hero subtitle, footer. */
export const BRAND_TAGLINE = "Сучасний одяг для тих, хто цінує якість і мінімалізм.";

// BRAND_HERO_SUBTITLE is the same sentence as BRAND_TAGLINE, just prefixed
// with the brand name for the hero's context — keep both in sync.
export const BRAND_HERO_SUBTITLE =
  "Mirox Shop — сучасний одяг для тих, хто цінує якість і мінімалізм.";

export const BRAND_META_SUFFIX = "Сучасний одяг";

export const BRAND_DESCRIPTION =
  "Mirox Shop — сучасний одяг для тих, хто цінує якість і мінімалізм. Перевіряємо кожну річ перед відправкою, швидка доставка по всій Україні.";
