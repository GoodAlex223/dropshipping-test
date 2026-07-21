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
   * RETRACTED, not merely unconfirmed — was "Free delivery on orders over
   * 1000 UAH", read off the AI-generated concept mockup
   * (docs/reference/mirox-concept-screenshot.jpg). Set to null because no
   * free-shipping threshold exists anywhere in the order path, at any
   * subtotal or currency: calculateOrderTotals() (src/lib/stripe.ts) and the
   * checkout confirm-order route both always charge
   * `shippingMethod?.price ?? 0`, never 0 for a real method. That made this a
   * false claim today, not an unverified one, so "pending client
   * confirmation" was the wrong framing regardless of what the client says.
   *
   * TODO.md's TASK-035 AC requires this banner's *slot* to exist, not any
   * specific promised text — AnnouncementBar already renders nothing when
   * this is null (see its test), which satisfies that AC. Only restore real
   * copy once a threshold is both implemented in code and confirmed with the
   * client; tracked by the client content inventory task (docs/planning/
   * TODO.md Spawned section).
   */
  announcement: null as string | null,

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
   *
   * "Free delivery" and "Secure payment" had their descriptions RETRACTED,
   * not merely flagged unconfirmed. "On orders over 1000 UAH" has no
   * implementing logic anywhere in the order path — calculateOrderTotals()
   * (src/lib/stripe.ts) and the checkout confirm-order route always charge
   * `shippingMethod?.price ?? 0`, at any subtotal. "Online or on delivery"
   * names a payment method — cash on delivery — that does not exist; it is
   * TASK-049, per the TASK-038b payments decision doc. Both descriptions were
   * rewritten to claim nothing the checkout contradicts. The four titles are
   * unchanged: TODO.md's TASK-035 AC only requires the benefit cards to be
   * present, not these specific promises.
   *
   * "Easy returns" / "14 days" is a different kind of gap and was left as-is:
   * it isn't contradicted by any code path, just unconfirmed with the client
   * and missing its /returns destination page (see the content & legal pages
   * spawned task). Confirm with the client before production.
   *
   * Tracked by the client content inventory task (docs/planning/TODO.md
   * Spawned section).
   */
  footerBenefits: [
    { icon: Truck, title: "Free delivery", description: "Calculated at checkout" },
    { icon: RefreshCw, title: "Easy returns", description: "14 days to change your mind" },
    { icon: ShieldCheck, title: "Secure payment", description: "Encrypted checkout" },
    { icon: MessageCircle, title: "Support 24/7", description: "We're always here" },
  ] as BenefitItem[],
};
