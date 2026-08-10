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
