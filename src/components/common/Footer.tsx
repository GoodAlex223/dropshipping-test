import Link from "next/link";
import { Logo } from "@/components/common/Logo";
import { BenefitStrip } from "@/components/common/BenefitStrip";
import { SocialLinks } from "@/components/common/SocialLinks";
import { NewsletterSignup } from "./NewsletterSignup";
import { site } from "@/content/site";

// Only routes that actually exist. The seven former links (/contact, /faq,
// /shipping, /returns, /about, /privacy, /terms) all 404 — those pages are a
// separate task, and three of them are payment-gateway onboarding
// prerequisites needing client and legal copy we cannot write.
const shopLinks = [
  { name: "All Products", href: "/products" },
  { name: "Categories", href: "/categories" },
  { name: "New Arrivals", href: "/products?sort=newest" },
];

export function Footer() {
  return (
    <footer data-surface="dark" className="bg-background text-foreground border-t">
      <div className="container py-12">
        <BenefitStrip items={site.footerBenefits} className="border-border border-b pb-10" />

        <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2">
              <Logo />
            </Link>
            <p className="text-muted-foreground text-sm">{site.tagline}</p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">Shop</h3>
            <ul className="space-y-2">
              {shopLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">Follow us</h3>
            <SocialLinks className="flex-col items-start gap-3" />
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">Newsletter</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Get exclusive offers and updates delivered to your inbox.
            </p>
            <NewsletterSignup />
          </div>
        </div>

        <div className="border-border mt-12 border-t pt-8">
          <p className="text-muted-foreground text-center text-sm">
            &copy; {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
