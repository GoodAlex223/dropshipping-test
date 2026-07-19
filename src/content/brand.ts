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
 * Hero subtitle. Written out rather than composed from BRAND_NAME +
 * BRAND_TAGLINE because the hero continues the sentence after an em dash
 * (lowercase "modern", per design §5.2) while the footer renders the tagline
 * as its own sentence (capital "Modern"). A runtime capitalize() would be
 * locale-fragile for the Ukrainian and Russian locales TASK-039 adds, to save
 * one character of duplication. These two strings are the same sentence —
 * keep them in sync.
 */
export const BRAND_HERO_SUBTITLE =
  "Mirox Shop — modern clothing for those who value quality and minimalism.";

/**
 * Short form for <title>. The long tagline pushes the homepage title past 70
 * characters, which search results truncate.
 */
export const BRAND_META_SUFFIX = "Modern Clothing";
