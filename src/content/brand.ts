/**
 * Brand constants. Deliberately dependency-free: src/lib/seo.ts imports this,
 * and seo.ts is consumed by the OG image route, robots, sitemap and the
 * Google Shopping feed. Never add an import to this file — importing site.ts
 * instead would drag lucide-react into all of them.
 */

export const BRAND_NAME = "Mirox Shop";

/** Long form — hero subtitle, footer. */
export const BRAND_TAGLINE = "Modern clothing for those who value quality and minimalism.";

/**
 * Short form for <title>. The long tagline pushes the homepage title past 70
 * characters, which search results truncate.
 */
export const BRAND_META_SUFFIX = "Modern Clothing";
