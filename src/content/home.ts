import { Truck, RefreshCw, Award, Headphones } from "lucide-react";
import type { BenefitItem } from "./site";
import { BRAND_NAME, BRAND_HERO_SUBTITLE } from "./brand";

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
     * CLIENT-SUPPLIED. Set to null to render the centred typographic hero.
     * Currently an AI-generated placeholder: unbranded clothing only, never a
     * fabricated Mirox logo, and subject to client sign-off before production.
     */
    image: {
      src: "/hero-placeholder-ai.jpg",
      alt: "Model wearing a black hoodie against a dark background",
    } as HeroImage | null,
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
