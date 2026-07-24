import { Check } from "lucide-react";
import { FadeIn } from "@/components/common/FadeIn";
import { home } from "@/content/home";
import { site } from "@/content/site";

/**
 * "Why choose us" — a dark "by the numbers" block. The three checkable claims
 * (site.claims) render as large stats, each gated on a configured figure so no
 * number is fabricated. The seven brand-voice items render as a quiet supporting
 * grid. None of these may feed aggregateRating structured data — see site.ts.
 */
export function WhyChooseUs() {
  const { title, items } = home.whyChooseUs;
  const { olxSales, instagramOrders, customerRating } = site.claims;

  const stats = [
    olxSales && { value: olxSales, label: "successful sales on OLX" },
    instagramOrders && { value: instagramOrders, label: "orders through Instagram" },
    customerRating && { value: customerRating, label: "average customer rating" },
  ].filter((s): s is { value: string; label: string } => Boolean(s));

  return (
    <section data-surface="dark" className="bg-background text-foreground py-20">
      <div className="container">
        <FadeIn>
          <h2 className="font-heading text-center text-2xl font-bold tracking-tight sm:text-3xl">
            {title}
          </h2>

          {stats.length > 0 && (
            <dl className="mx-auto mt-12 flex max-w-3xl flex-wrap justify-center gap-12 sm:gap-20">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <dt className="sr-only">{stat.label}</dt>
                  <dd>
                    <span className="font-heading block text-4xl font-extrabold tracking-tight sm:text-5xl">
                      {stat.value}
                    </span>
                    <span className="text-muted-foreground mt-2 block text-sm">{stat.label}</span>
                  </dd>
                </div>
              ))}
            </dl>
          )}

          <ul className="border-border mx-auto mt-16 grid max-w-4xl gap-x-8 gap-y-4 border-t pt-12 sm:grid-cols-2">
            {items.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </FadeIn>
      </div>
    </section>
  );
}
