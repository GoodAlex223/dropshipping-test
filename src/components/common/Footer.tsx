import Link from "next/link";
import { useTranslations } from "next-intl";
import { BenefitStrip } from "@/components/common/BenefitStrip";
import { SocialLinks } from "@/components/common/SocialLinks";
import { NewsletterSignup } from "./NewsletterSignup";
import { site } from "@/content/site";

// Only routes that actually exist. The mockup's info links ("Shipping &
// payment", "Returns", "Contacts") point at the TASK-055 pages and 404
// today — they join when those pages ship. Same rule as TASK-035.
// `key` (not the label) is the stable identity — `as const` narrows it to
// the literal union next-intl's typed catalog keys require for
// `t(\`links.${l.key}\`)` below.
const shopLinks = [
  { key: "catalog", href: "/products" },
  { key: "categories", href: "/categories" },
  { key: "new", href: "/products?sortBy=createdAt&sortOrder=desc" },
  { key: "track", href: "/track" },
  { key: "feedback", href: "/feedback" },
] as const;

export function Footer() {
  const t = useTranslations("footer");
  const tBrand = useTranslations("brand");

  // title/description moved to the catalog (TASK-039 G9) as
  // footer.benefits.0..3.title/description, addressed by index — order must
  // stay in sync with site.footerBenefits (see that array's own comment).
  // Manually unrolled (not .map()'d): a .map() callback's index is typed
  // `number`, which can't narrow to the literal "0"|"1"|"2"|"3" the catalog's
  // typed keys require — these four literal t() calls keep typo protection.
  const benefitItems = [
    {
      icon: site.footerBenefits[0].icon,
      title: t("benefits.0.title"),
      description: t("benefits.0.description"),
    },
    {
      icon: site.footerBenefits[1].icon,
      title: t("benefits.1.title"),
      description: t("benefits.1.description"),
    },
    {
      icon: site.footerBenefits[2].icon,
      title: t("benefits.2.title"),
      description: t("benefits.2.description"),
    },
    {
      icon: site.footerBenefits[3].icon,
      title: t("benefits.3.title"),
      description: t("benefits.3.description"),
    },
  ];

  return (
    <footer className="border-border bg-background text-foreground border-t">
      {/* Benefit row + socials (handoff footer, row 1) */}
      <div className="container flex flex-col gap-8 py-8 lg:flex-row lg:items-center lg:justify-between">
        <BenefitStrip
          items={benefitItems}
          className="grow gap-6 bg-transparent lg:grid-cols-4 [&>li]:bg-transparent [&>li]:px-0 [&>li]:py-0"
        />
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground text-xs font-semibold">{t("followUs")}</span>
          <SocialLinks className="flex items-center gap-4" />
        </div>
      </div>

      {/* Newsletter — deviation from the mockup: the double-opt-in feature
          exists and keeps its entry point; slim row instead of a column. */}
      <div className="border-border border-t">
        <div className="container flex flex-col items-start justify-between gap-4 py-6 lg:flex-row lg:items-center">
          <p className="text-muted-foreground text-sm">{t("newsletterBlurb")}</p>
          <NewsletterSignup />
        </div>
      </div>

      {/* Copyright row */}
      <div className="border-border text-faint border-t">
        <div className="container flex flex-col items-start justify-between gap-3 py-5 text-[12.5px] lg:flex-row lg:items-center">
          <span>
            &copy; {new Date().getFullYear()} {site.name}. {tBrand("tagline")}
          </span>
          <nav className="flex gap-6">
            {shopLinks.map((l) => (
              <Link key={l.key} href={l.href} className="hover:text-foreground transition-colors">
                {t(`links.${l.key}`)}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
