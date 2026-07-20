import { Truck, RefreshCw, Award, Headphones } from "lucide-react";
import type { BenefitItem } from "./site";
import { BRAND_HERO_SUBTITLE } from "./brand";

export interface HeroImage {
  src: string;
  alt: string;
}

/**
 * Homepage copy. Single extraction point for TASK-039 i18n — these are plain
 * typed objects with no logic, the shape any i18n library can consume.
 */
export const home = {
  hero: {
    eyebrow: "NEW COLLECTION",
    /** Brief list #1: three separate lines, rendered as three lines. */
    headline: ["STYLE.", "QUALITY.", "CONFIDENCE."],
    subtitle: BRAND_HERO_SUBTITLE,
    primaryCta: { label: "Shop the Catalog", href: "/products" },
    secondaryCta: { label: "New Arrivals", href: "/products?sort=newest" },
    /**
     * CLIENT-SUPPLIED. null renders the centred typographic hero; the Hero
     * component's two layouts are both fully designed, so this is a one-line
     * content change, never a redesign.
     *
     * TASK-7 deviation: this was meant to hold an AI-generated placeholder
     * (`/hero-placeholder-ai.jpg`, unbranded clothing only, never a
     * fabricated Mirox logo) once one existed, but no image-generation tool
     * was available in that session to produce one. Left null rather than
     * referencing a file that doesn't exist. Pending client-supplied
     * photography (or a regenerated AI placeholder) before this is set.
     */
    image: null as HeroImage | null,
  },

  benefits: [
    { icon: Truck, title: "Fast delivery", description: "1–3 days across Ukraine" },
    { icon: RefreshCw, title: "Size exchange", description: "Wrong fit? Swap it" },
    { icon: Award, title: "Premium quality", description: "Only the best fabrics" },
    { icon: Headphones, title: "Support 24/7", description: "We're always in touch" },
  ] as BenefitItem[],

  whyChooseUs: {
    title: "Why choose us",
    /**
     * Seven statements true by construction, or unfalsifiable brand voice.
     * The brief's three checkable claims live in site.claims and are rendered
     * separately, gated on being configured.
     */
    items: [
      "Fast delivery across Ukraine",
      "Every item checked before shipping",
      "Size exchange",
      "Support seven days a week",
      "Quality clothing only",
      "Secure payment",
      "Trusted by returning customers",
    ],
  },

  rails: {
    featured: {
      title: "Featured",
      viewAllHref: "/products?featured=true",
      viewAllLabel: "View all",
    },
    bestsellers: {
      title: "Bestsellers",
      // Interim target: no "popular" sort exists until TASK-036 adds one.
      // (Coincidentally the exact right link for `newArrivals` below, which
      // shares this href for a real reason, not as a stand-in.)
      viewAllHref: "/products?sort=newest",
      viewAllLabel: "View all",
    },
    // Swapped in at the bestsellers call site instead of the entry above when
    // getBestsellers() reports source: "backfilled" — i.e. zero items came
    // from real sales, so every product in the rail is actually unsold new
    // stock. See src/app/(shop)/page.tsx for why that swap must happen.
    newArrivals: {
      title: "New Arrivals",
      viewAllHref: "/products?sort=newest",
      viewAllLabel: "View all",
    },
  },

  testimonials: { title: "What our customers say" },

  social: {
    title: "Follow us",
    subtitle: "Follow along to hear about new arrivals first.",
  },
};
