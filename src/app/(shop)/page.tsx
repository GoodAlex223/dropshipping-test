import type { Metadata } from "next";
import { getHomeMetadata } from "@/lib/seo";
import { getNewArrivals, type ProductCardData } from "@/lib/product-queries";
import { getTestimonials, type Testimonial } from "@/lib/review-queries";
import { BenefitStrip } from "@/components/common";
import { Hero, ProductRail, Testimonials, WhyChooseUs } from "@/components/home";
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
  const [newArrivals, testimonials] = await Promise.all([
    safeSection<ProductCardData[]>(getNewArrivals(4), [], "new-arrivals"),
    safeSection<Testimonial[]>(getTestimonials(6), [], "testimonials"),
  ]);

  return (
    <div className="flex flex-col">
      <Hero />
      <section aria-label="Переваги" className="border-border border-b">
        <BenefitStrip items={home.benefits} />
      </section>
      <ProductRail
        title={home.rails.newArrivals.title}
        products={newArrivals}
        viewAllHref={home.rails.newArrivals.viewAllHref}
        viewAllLabel={home.rails.newArrivals.viewAllLabel}
      />
      <WhyChooseUs />
      <Testimonials testimonials={testimonials} />
    </div>
  );
}
