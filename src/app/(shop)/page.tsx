import type { Metadata } from "next";
import { getHomeMetadata } from "@/lib/seo";
import {
  getBestsellers,
  getFeaturedProducts,
  type BestsellerResult,
  type ProductCardData,
} from "@/lib/product-queries";
import { getTestimonials, type Testimonial } from "@/lib/review-queries";
import { Hero, ProductRail, WhyChooseUs, Testimonials } from "@/components/home";
import { FadeIn, SocialLinks } from "@/components/common";
import { home } from "@/content/home";

export const metadata: Metadata = getHomeMetadata();

// Kept as force-dynamic, NOT switched to `revalidate = 300` ISR. Verified
// against a real `npm run build`: the root layout (src/app/layout.tsx) declares
// its own `export const dynamic = "force-dynamic"` because the app renders
// client-side auth context that doesn't survive static prerendering — that
// setting is inherited by every route and overrides any page-level revalidate,
// which is exactly what the build showed (`/` still listed as `ƒ (Dynamic)`
// with `revalidate = 300` set here). Confirmed the mechanism, not just the
// symptom: temporarily removing the root layout's force-dynamic and rebuilding
// made prerendering fail outright for "/" and 7 other routes with `TypeError:
// Cannot read properties of null (reading 'useContext')` — i.e. this is a
// real, load-bearing, pre-existing constraint (not a Prisma/Neon adapter
// issue, which is what motivated this check), and changing it is a site-wide
// decision well outside a homepage-composition task.
export const dynamic = "force-dynamic";

// One section's data query failing must not 500 the whole homepage: every
// rail and the testimonials block already render nothing when handed an empty
// result, so a failed query degrades to a missing section instead. This is
// exactly the failure that took the homepage down once a server-side review
// query landed here — the production `reviews` table had never been migrated,
// so getTestimonials() threw and Promise.all rejected the entire render. With
// `dynamic = "force-dynamic"` this runs per request, so a transient DB blip
// also self-heals on the next load rather than sticking.
async function safeSection<T>(query: Promise<T>, fallback: T, label: string): Promise<T> {
  try {
    return await query;
  } catch (error) {
    console.error(`[home] "${label}" section query failed; rendering without it:`, error);
    return fallback;
  }
}

export default async function HomePage() {
  const emptyBestsellers: BestsellerResult = { products: [], source: "backfilled" };
  const [featured, bestsellers, testimonials] = await Promise.all([
    safeSection<ProductCardData[]>(getFeaturedProducts(8), [], "featured"),
    safeSection<BestsellerResult>(getBestsellers(8), emptyBestsellers, "bestsellers"),
    safeSection<Testimonial[]>(getTestimonials(6), [], "testimonials"),
  ]);

  // getBestsellers() reports source: "backfilled" when zero items in the
  // rail came from real sales — a brand-new store's day-one state, not an
  // edge case. Labelling untested new stock "Bestsellers" would fabricate
  // social proof, the same category of problem SocialLinks (no invented
  // follower counts) and WhyChooseUs (gated, unverified claims) deliberately
  // avoid elsewhere on this page. "mixed" (real bestsellers topped up with
  // recent products) is normal, non-deceptive padding and keeps the
  // Bestsellers heading — do not extend this swap to "mixed", and do not
  // simplify this back into a constant.
  const bestsellersRail =
    bestsellers.source === "backfilled" ? home.rails.newArrivals : home.rails.bestsellers;

  return (
    <div className="flex flex-col">
      <Hero />

      <ProductRail
        title={home.rails.featured.title}
        products={featured}
        viewAllHref={home.rails.featured.viewAllHref}
        viewAllLabel={home.rails.featured.viewAllLabel}
      />

      <ProductRail
        title={bestsellersRail.title}
        products={bestsellers.products}
        viewAllHref={bestsellersRail.viewAllHref}
        viewAllLabel={bestsellersRail.viewAllLabel}
      />

      <WhyChooseUs />

      <Testimonials testimonials={testimonials} />

      <section data-surface="dark" className="bg-background text-foreground">
        <div className="container py-16 text-center">
          <FadeIn>
            <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              {home.social.title}
            </h2>
            <p className="text-muted-foreground mt-4 text-sm">{home.social.subtitle}</p>
            <SocialLinks variant="tiles" className="mt-8" />
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
