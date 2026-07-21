import { Check } from "lucide-react";
import { FadeIn } from "@/components/common/FadeIn";
import { home } from "@/content/home";
import { site } from "@/content/site";

/**
 * "Why choose us" — client brief list #1, a 10-item list whose items are not
 * all the same kind of statement.
 *
 * Seven are policy claims true by construction, or unfalsifiable brand voice;
 * they ship as static copy. Three are checkable claims about the client's own
 * sales history and reputation; those live in site.claims and render only when
 * the client has supplied a figure. None of them may feed aggregateRating
 * structured data — see site.ts.
 */
export function WhyChooseUs() {
  const { title, items } = home.whyChooseUs;
  const { olxSales, instagramOrders, customerRating } = site.claims;

  const clientClaims = [
    olxSales && `${olxSales} successful sales on OLX`,
    instagramOrders && `${instagramOrders} orders through Instagram`,
    customerRating && `${customerRating} average customer rating`,
  ].filter((claim): claim is string => Boolean(claim));

  return (
    <section className="bg-muted/40 py-16">
      <div className="container">
        <FadeIn>
          <h2 className="font-heading text-center text-2xl font-bold tracking-tight sm:text-3xl">
            {title}
          </h2>

          <ul className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2">
            {[...clientClaims, ...items].map((claim) => (
              <li key={claim} className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="text-sm">{claim}</span>
              </li>
            ))}
          </ul>
        </FadeIn>
      </div>
    </section>
  );
}
