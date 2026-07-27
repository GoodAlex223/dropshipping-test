import { FadeIn } from "@/components/common/FadeIn";
import { home } from "@/content/home";
import { site } from "@/content/site";

/**
 * "Why choose us" — a dark "by the numbers" block. The three checkable claims
 * (site.claims) render as stat cards, each gated on a configured figure so no
 * number is fabricated. The six brand-voice items render as a quiet supporting
 * grid. None of these may feed aggregateRating structured data — see site.ts.
 *
 * 2-column layout per Mirox Home.dc.html:141-167: left column is
 * title/intro/stats, right column is the brand-voice item grid.
 */
export function WhyChooseUs() {
  const { title, intro, items } = home.whyChooseUs;
  const { olxSales, instagramOrders, customerRating } = site.claims;

  const stats = [
    // TASK-039: externalize these labels once i18n lands.
    olxSales && { value: olxSales, label: "успішних покупок на OLX" },
    instagramOrders && { value: instagramOrders, label: "замовлень через Instagram" },
    customerRating && { value: customerRating, label: "середня оцінка покупців" },
  ].filter((s): s is { value: string; label: string } => Boolean(s));

  return (
    <section className="border-border border-t py-16 lg:py-[72px]">
      <div className="container grid gap-12 lg:grid-cols-2 lg:gap-16">
        <FadeIn>
          <h2 className="font-heading text-2xl font-extrabold tracking-tight sm:text-[32px]">
            {title}
          </h2>
          <p className="text-muted-foreground mt-4 max-w-[420px] text-[15px] leading-relaxed">
            {intro}
          </p>

          {stats.length > 0 && (
            <dl className="mt-8 flex gap-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-card border-border flex-1 rounded-2xl border px-7 py-6"
                >
                  <dt className="sr-only">{stat.label}</dt>
                  <dd>
                    <span className="font-heading block text-[32px] font-extrabold">
                      {stat.value}
                    </span>
                    <span className="text-muted-foreground mt-1 block text-[13px]">
                      {stat.label}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </FadeIn>

        <FadeIn>
          <ul className="grid content-center gap-3 sm:grid-cols-2">
            {items.map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className="bg-foreground h-1.5 w-1.5 shrink-0 rounded-full"
                />
                <span className="text-foreground/85 text-sm font-semibold">{item}</span>
              </li>
            ))}
          </ul>
        </FadeIn>
      </div>
    </section>
  );
}
