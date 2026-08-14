/**
 * Brand constants. Deliberately dependency-free: src/lib/seo.ts imports this,
 * and seo.ts is consumed by the OG image route, robots, sitemap and the
 * Google Shopping feed. Never add an import to this file — importing site.ts
 * instead would drag lucide-react into all of them.
 */

export const BRAND_NAME = "Mirox Shop";

/**
 * Long form. TASK-039 G9 copied this value into the i18n catalog as
 * `brand.tagline` (Footer.tsx's copyright line reads it via t() now) — but
 * the CONSTANT itself is deliberately kept here, not deleted, because
 * src/app/opengraph-image.tsx (Satori/ImageResponse — an SEO-layer route
 * outside this task's scope, deferred to Task 8 alongside BRAND_DESCRIPTION/
 * BRAND_META_SUFFIX below) imports it directly and must keep compiling.
 * Same precedent, same reason, one file this plan's pre-flight scan missed.
 */
export const BRAND_TAGLINE = "Сучасний одяг для тих, хто цінує якість і мінімалізм.";

// BRAND_HERO_SUBTITLE removed (TASK-039 G9) — its one and only consumer
// (home.ts's hero.subtitle field) is gone; the same sentence now lives in
// the catalog twice by design (matching this constant's original
// relationship to BRAND_TAGLINE above): home.hero.subtitle (consumed by
// Hero.tsx) and brand.heroSubtitle (reserved, unconsumed until Task 8's SEO
// layer wants it — mirrors BRAND_DESCRIPTION/BRAND_META_SUFFIX's deferral).

export const BRAND_META_SUFFIX = "Сучасний одяг";

export const BRAND_DESCRIPTION =
  "Mirox Shop — сучасний одяг для тих, хто цінує якість і мінімалізм. Перевіряємо кожну річ перед відправкою, швидка доставка по всій Україні.";

/** Social link data. Icon components stay in the UI layer (SocialLinks.tsx). */
export interface SocialLink {
  platform: "instagram" | "tiktok" | "telegram";
  label: string;
  href: string;
  /**
   * CLIENT-SUPPLIED. Real follower count, or null for no counter.
   * Never fabricate this — TODO.md AC requires counters only when real numbers
   * are supplied, and invented social proof is out of scope per TASK-051.
   */
  followers: number | null;
}

/**
 * CLIENT-SUPPLIED. Placeholder handles until the client confirms real URLs.
 * Relocated from site.ts (G5) so email templates can consume the hrefs
 * without dragging lucide-react into API-route bundles.
 */
export const SOCIALS: SocialLink[] = [
  {
    platform: "instagram",
    label: "Instagram",
    href: "https://instagram.com/mirox_shop",
    followers: null,
  },
  {
    platform: "tiktok",
    label: "TikTok",
    href: "https://tiktok.com/@mirox_shop",
    followers: null,
  },
  { platform: "telegram", label: "Telegram", href: "https://t.me/mirox_shop", followers: null },
];

/**
 * CLIENT-SUPPLIED, PENDING (TASK-056 ask). Manager WhatsApp link (wa.me/…).
 * null hides the link everywhere it's consumed (checkout payment step, order
 * emails) — a zero-filled number would render as a clickable dead link
 * (PR #29 review ruling). Fill with the real number to light both up.
 */
export const WHATSAPP_HREF: string | null = null;
