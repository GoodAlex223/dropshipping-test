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

/**
 * Meta/OG/Twitter description. Opens with the client brief's own hero line
 * (list #1, "Главная страница — Первый экран": "Mirox Shop — современная
 * одежда для тех, кто ценит качество и минимализм.") and extends it with the
 * shipping/quality-check differentiators from the same brief's "Почему
 * выбирают нас" benefit list — see docs/reference/client-brief.md. Kept under
 * 155 characters so Google/social previews don't truncate it mid-sentence.
 */
export const BRAND_DESCRIPTION =
  "Mirox Shop — modern clothing for those who value quality and minimalism. Every item checked before shipping, with fast delivery across Ukraine.";
