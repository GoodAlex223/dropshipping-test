import { Truck, RefreshCw, ShieldCheck, MessageCircle, type LucideIcon } from "lucide-react";
import { BRAND_NAME, BRAND_TAGLINE } from "./brand";

/**
 * Site-wide content, consumed by the homepage and the Footer.
 *
 * CLIENT-SUPPLIED VALUES — the fields marked below come from the client and
 * cannot be invented by us. An unset value renders nothing rather than a
 * placeholder. Source: docs/reference/client-brief.md.
 */

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

export interface ClientClaims {
  /** CLIENT-SUPPLIED, UNAUDITED (as provided 2026-07-14). null hides the claim. */
  olxSales: string | null;
  instagramOrders: string | null;
  customerRating: string | null;
}

export interface BenefitItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const site = {
  name: BRAND_NAME,
  tagline: BRAND_TAGLINE,

  /**
   * PROVISIONAL — NOT CLIENT-CONFIRMED. This threshold is read off the
   * AI-generated concept mockup (docs/reference/mirox-concept-screenshot.jpg),
   * not the client brief, which states no shipping threshold. It also disagrees
   * with the admin settings default (freeShippingThreshold "50", USD). Confirm
   * with the client before production; tracked by the client-content inventory
   * task. null removes the bar entirely.
   */
  announcement: "Free delivery on orders over 1000 UAH" as string | null,

  /** CLIENT-SUPPLIED. Placeholder handles until the client confirms real URLs. */
  socials: [
    {
      platform: "instagram",
      label: "Instagram",
      href: "https://instagram.com/miroxshop",
      followers: null,
    },
    { platform: "tiktok", label: "TikTok", href: "https://tiktok.com/@miroxshop", followers: null },
    { platform: "telegram", label: "Telegram", href: "https://t.me/miroxshop", followers: null },
  ] as SocialLink[],

  /**
   * CLIENT-SUPPLIED, UNAUDITED. The client's own claims about their OLX and
   * Instagram sales history, recorded 2026-07-14. Rendered as their claims.
   *
   * These must NEVER feed aggregateRating structured data: the site emits real
   * review markup via seo.ts, and Google's structured-data policy prohibits
   * aggregate ratings that don't correspond to on-site reviews.
   */
  claims: {
    olxSales: "300+",
    instagramOrders: "100+",
    customerRating: null,
  } as ClientClaims,

  /**
   * Footer benefit strip — the concept screenshot's footer row.
   * PROVISIONAL — NOT CLIENT-CONFIRMED. The "1000 UAH" shipping threshold and
   * "14 days" return window are read off the AI-generated concept mockup
   * (docs/reference/mirox-concept-screenshot.jpg), not the client brief. The
   * 14-day claim implies a /returns page that does not yet exist. Confirm both
   * figures with the client before production; tracked by the client-content
   * inventory task.
   */
  footerBenefits: [
    { icon: Truck, title: "Free delivery", description: "On orders over 1000 UAH" },
    { icon: RefreshCw, title: "Easy returns", description: "14 days to change your mind" },
    { icon: ShieldCheck, title: "Secure payment", description: "Online or on delivery" },
    { icon: MessageCircle, title: "Support 24/7", description: "We're always here" },
  ] as BenefitItem[],
};
