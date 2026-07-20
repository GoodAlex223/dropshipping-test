import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BenefitStrip } from "@/components/common/BenefitStrip";
import { DEFAULT_BLUR_DATA_URL } from "@/lib/image-utils";
import { cn } from "@/lib/utils";
import { home } from "@/content/home";

/**
 * Hero — client brief list #1, first screen. The single most visible surface
 * in the rebrand, and the page's LCP element (PageSpeed 95+ target).
 *
 * One component, two layouts. With no configured image it renders centred and
 * typographic; with an image it renders two-column. Both states are built to
 * look deliberate and finished on their own, so dropping the photo is a
 * one-line content change (`home.hero.image = null`), never a redesign.
 *
 * Every descendant here reads colour only from the semantic tokens
 * (background/foreground/muted-foreground/primary/...), never a hard-coded
 * shade — those token pairs invert together under `data-surface="dark"`
 * (see globals.css), which is what keeps this safe against the collapsing
 * bug documented for TASK-034 (a fixed-shade descendant going invisible
 * against an inverted surface). `BenefitStrip` was audited on the same basis:
 * it only ever uses `text-muted-foreground` or inherited text colour, no
 * background of its own, so it carries no risk when nested in here.
 */
export function Hero() {
  const { eyebrow, headline, subtitle, primaryCta, secondaryCta, image } = home.hero;
  const hasImage = image !== null;

  return (
    <section data-surface="dark" className="bg-background text-foreground">
      <div className="container py-16 md:py-24">
        <div
          className={cn(
            "gap-12",
            hasImage ? "grid items-center lg:grid-cols-2" : "mx-auto max-w-3xl text-center"
          )}
        >
          <div>
            <p className="text-muted-foreground text-xs font-medium tracking-[0.2em]">{eyebrow}</p>

            {/* Single h1: three content lines, not three headings. */}
            <h1 className="font-heading mt-6 text-5xl leading-[0.95] font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
              {headline.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h1>

            <p className="text-muted-foreground mt-6 text-base sm:text-lg">{subtitle}</p>

            <div
              className={cn(
                "mt-10 flex flex-col gap-4 sm:flex-row",
                !hasImage && "sm:justify-center"
              )}
            >
              <Button asChild size="lg">
                <Link href={primaryCta.href}>{primaryCta.label}</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
              </Button>
            </div>
          </div>

          {hasImage && (
            <div className="relative aspect-[4/5] w-full overflow-hidden lg:aspect-[3/4]">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                // This is the LCP element: eager-loaded, explicitly sized, blurred-in.
                priority
                // Deliberately NOT IMAGE_SIZES.hero ("100vw") — from lg upward
                // this image only occupies half the viewport width, and
                // requesting a full-width image there over-fetches and costs
                // LCP against the PageSpeed 95+ target.
                sizes="(max-width: 1024px) 100vw, 50vw"
                placeholder="blur"
                blurDataURL={DEFAULT_BLUR_DATA_URL}
                className="object-cover"
              />
            </div>
          )}
        </div>

        <BenefitStrip items={home.benefits} className="border-border mt-16 border-t pt-10" />
      </div>
    </section>
  );
}
