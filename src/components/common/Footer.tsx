import Link from "next/link";
import { BenefitStrip } from "@/components/common/BenefitStrip";
import { SocialLinks } from "@/components/common/SocialLinks";
import { NewsletterSignup } from "./NewsletterSignup";
import { site } from "@/content/site";

// Only routes that actually exist. The mockup's info links («Доставка та
// оплата», «Повернення», «Контакти») point at the TASK-055 pages and 404
// today — they join when those pages ship. Same rule as TASK-035.
const shopLinks = [
  { name: "Каталог", href: "/products" },
  { name: "Категорії", href: "/categories" },
  { name: "Новинки", href: "/products?sortBy=createdAt&sortOrder=desc" },
  { name: "Зворотний зв'язок", href: "/feedback" },
];

export function Footer() {
  return (
    <footer className="border-border bg-background text-foreground border-t">
      {/* Benefit row + socials (handoff footer, row 1) */}
      <div className="container flex flex-col gap-8 py-8 lg:flex-row lg:items-center lg:justify-between">
        <BenefitStrip
          items={site.footerBenefits}
          className="grow gap-6 bg-transparent lg:grid-cols-4 [&>li]:bg-transparent [&>li]:px-0 [&>li]:py-0"
        />
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground text-xs font-semibold">Слідкуйте за нами</span>
          <SocialLinks className="flex items-center gap-4" />
        </div>
      </div>

      {/* Newsletter — deviation from the mockup: the double-opt-in feature
          exists and keeps its entry point; slim row instead of a column. */}
      <div className="border-border border-t">
        <div className="container flex flex-col items-start justify-between gap-4 py-6 lg:flex-row lg:items-center">
          <p className="text-muted-foreground text-sm">
            Підпишіться на новини — знижки та новинки першими.
          </p>
          <NewsletterSignup />
        </div>
      </div>

      {/* Copyright row */}
      <div className="border-border text-faint border-t">
        <div className="container flex flex-col items-start justify-between gap-3 py-5 text-[12.5px] lg:flex-row lg:items-center">
          <span>
            &copy; {new Date().getFullYear()} {site.name}. {site.tagline}
          </span>
          <nav className="flex gap-6">
            {shopLinks.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-foreground transition-colors">
                {l.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
