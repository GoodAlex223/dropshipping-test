# Homepage Polish & Art Direction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the deployed Mirox homepage from a tokenised wireframe up to the brief's "luxury minimalism" bar, using only what's buildable without client-supplied photography/catalog.

**Architecture:** Build on the existing TASK-034 token system. Flip `FadeIn` to visible-by-default (fixes the blank-until-scroll bug), monochrome the discount badge, add a soft-shadow var + a moderate glass utility, re-conceive "Why choose us" as a dark stats block and "Follow us" as social tiles, art-direct the no-photo hero, and give broken product images a branded fallback.

**Tech Stack:** Next.js 14 App Router, React 18, Tailwind CSS v4 (`@theme inline` + arbitrary-value custom props), Vitest + @testing-library/react (jsdom), Playwright E2E.

**Spec:** [docs/superpowers/specs/2026-07-24-mirox-homepage-polish-design.md](../../superpowers/specs/2026-07-24-mirox-homepage-polish-design.md)

## Global Constraints

- **Monochrome only** — black/white/gray. No new colour, no accent hue, no `destructive`/red on the homepage. (brief: "никаких ярких цветов")
- **Motion invariants (I1–I5):** SSR/no-JS renders content visible (no `opacity:0` in server HTML); nothing stuck hidden after load; `prefers-reduced-motion` disables animation with content fully visible; reveal never gates visibility; `[data-testid='product-card']` E2E signal preserved.
- **Token idiom:** define custom props in `:root` (and re-skin under `[data-surface="dark"]`), consume via arbitrary values (e.g. `shadow-[var(--shadow-soft)]`) — matches existing `ease-[var(--ease-mirox)]` usage. A token used but not defined is a silent no-op; verify against compiled CSS.
- **Glass is moderate** — header, card hover, social tiles only. Not every surface.
- **Out of scope (do not touch):** hero photography & real catalog (TASK-056), USD→UAH price formatting (TASK-039), rich card interactions — 2nd image/quick-view/swatches (TASK-036).
- **Quality floor:** responsive to mobile, visible keyboard focus, reduced motion respected. `npm run lint`, `npm run typecheck`, `npm run test:run`, `npm run build` all pass before the branch is done.

---

## File Structure

- **Modify** `src/app/globals.css` — add `--shadow-soft` (in `:root` + dark re-skin) and a `.glass` utility.
- **Modify** `src/components/common/FadeIn.tsx` — visible-by-default CSS entrance; remove `IntersectionObserver`.
- **Modify** `tests/unit/fade-in.test.tsx` — reflect new contract.
- **Modify** `src/components/products/ProductCard.tsx` — monochrome badge; delegate image to `ProductImage`.
- **Create** `src/components/products/ProductImage.tsx` — `"use client"` image with `onError` → branded M fallback.
- **Create** `tests/unit/product-card.test.tsx` — badge + fallback behavior.
- **Modify** `src/components/home/WhyChooseUs.tsx` — dark "by the numbers" stats block + supporting grid.
- **Modify** `tests/unit/why-choose-us.test.tsx` — stats gating + surface.
- **Modify** `src/components/common/SocialLinks.tsx` — add `variant: "inline" | "tiles"`.
- **Modify** `src/app/(shop)/page.tsx` — social section uses `variant="tiles"`.
- **Modify** `tests/unit/social-links.test.tsx` — tiles variant.
- **Modify** `src/components/home/Hero.tsx` — art-directed `!hasImage` branch (gradient + grain + ghosted M + staggered headline).
- **Modify** `tests/unit/hero.test.tsx` — art-direction assertions.

Order matters: Task 1 (tokens) and Task 2 (FadeIn) are foundations consumed by later tasks.

---

### Task 1: Design tokens — soft shadow + glass utility

**Files:**

- Modify: `src/app/globals.css`

**Interfaces:**

- Produces: CSS custom prop `--shadow-soft` (consume via `shadow-[var(--shadow-soft)]`); utility class `.glass`. Both invert under `[data-surface="dark"]`.

- [ ] **Step 1: Add `--shadow-soft` to `:root` and dark re-skin.** In `src/app/globals.css`, find the `:root` block that defines `--ease-mirox`/`--duration-slow` and add a soft shadow var; then find the `[data-surface="dark"]` block and add its dark variant.

```css
/* in :root { ... } near --duration-slow */
--shadow-soft: 0 1px 2px rgb(0 0 0 / 0.04), 0 8px 24px -8px rgb(0 0 0 / 0.12);

/* in [data-surface="dark"] { ... } — shadows read heavier on dark surfaces */
--shadow-soft: 0 1px 2px rgb(0 0 0 / 0.4), 0 12px 32px -8px rgb(0 0 0 / 0.6);
```

- [ ] **Step 2: Add the `.glass` utility next to `.hover-lift`.** In the same utilities block that defines `.hover-lift`:

```css
.glass {
  background-color: color-mix(in oklch, var(--background) 72%, transparent);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--border);
}
```

- [ ] **Step 3: Verify the tokens are real (compiled), not silent no-ops.** Build the CSS and grep the output.

Run: `npm run build 2>&1 | tail -5 && grep -ro "shadow-soft\|\.glass" .next/static/css/*.css | sort -u`
Expected: at least one match for each (`--shadow-soft` value present; `.glass` rule present). If empty → the token isn't registered; fix before proceeding.

- [ ] **Step 4: Commit.**

```bash
git add src/app/globals.css
git commit -m "feat(design): add soft-shadow var and moderate glass utility"
```

---

### Task 2: FadeIn — visible by default, CSS entrance, no observer

**Files:**

- Modify: `src/components/common/FadeIn.tsx`
- Test: `tests/unit/fade-in.test.tsx`

**Interfaces:**

- Consumes: existing `.animate-fade-up` keyframe class (globals.css) and its reduced-motion disable.
- Produces: `FadeIn({ children, className?, delay?, as? })` — renders children **visible** (`opacity-100`), applies `.animate-fade-up` only when motion is allowed; `delay` sets `animationDelay`. No `IntersectionObserver`.

- [ ] **Step 1: Rewrite the test to the new contract.** Replace `tests/unit/fade-in.test.tsx` entirely:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FadeIn } from "@/components/common/FadeIn";

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe("FadeIn", () => {
  it("renders children visible on first paint (never opacity-0)", () => {
    mockMatchMedia(false);
    render(<FadeIn>Hello</FadeIn>);
    const el = screen.getByText("Hello");
    expect(el).toHaveClass("opacity-100");
    expect(el).not.toHaveClass("opacity-0");
  });

  it("applies the entrance animation when motion is allowed", () => {
    mockMatchMedia(false);
    render(<FadeIn>World</FadeIn>);
    expect(screen.getByText("World")).toHaveClass("animate-fade-up");
  });

  it("omits the entrance animation under reduced motion", () => {
    mockMatchMedia(true);
    render(<FadeIn>Quiet</FadeIn>);
    const el = screen.getByText("Quiet");
    expect(el).toHaveClass("opacity-100");
    expect(el).not.toHaveClass("animate-fade-up");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails.**

Run: `npm run test:run -- tests/unit/fade-in.test.tsx`
Expected: FAIL (current FadeIn renders `opacity-0` pre-intersection).

- [ ] **Step 3: Rewrite `FadeIn.tsx`.** Keep the hydration-safe reduced-motion read; drop the observer and the `inView` state.

```tsx
"use client";

import { useSyncExternalStore, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }
  const mql = window.matchMedia(REDUCED_MOTION_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getReducedMotionSnapshot(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia(REDUCED_MOTION_QUERY).matches
  );
}

function getReducedMotionServerSnapshot(): boolean {
  return false;
}

interface FadeInProps {
  children: ReactNode;
  className?: string;
  /** Stagger delay for the entrance animation, in ms. */
  delay?: number;
  /** Element/tag to render as. Defaults to "div". */
  as?: ElementType;
}

/**
 * Visible-by-default entrance. Children render at rest (`opacity-100`) so the
 * server HTML is never hidden (motion invariant I1); when motion is allowed a
 * one-shot `.animate-fade-up` plays. Reduced motion drops the animation class
 * entirely (globals.css also disables the keyframe as a belt-and-braces).
 * No IntersectionObserver — deep sections animate on load, which is why nothing
 * is ever left stuck hidden waiting on a scroll that may not happen.
 */
export function FadeIn({ children, className, delay = 0, as: Component = "div" }: FadeInProps) {
  const prefersReduced = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

  return (
    <Component
      className={cn("opacity-100", !prefersReduced && "animate-fade-up", className)}
      style={!prefersReduced && delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Component>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes.**

Run: `npm run test:run -- tests/unit/fade-in.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Run the broader home suite to catch fallout.**

Run: `npm run test:run -- tests/unit/product-rail.test.tsx tests/unit/testimonials.test.tsx tests/unit/why-choose-us.test.tsx tests/unit/home-page.test.tsx`
Expected: PASS (these render FadeIn-wrapped content; assert they still find their text). If any asserted `opacity-0`, update that assertion to `opacity-100`.

- [ ] **Step 6: Commit.**

```bash
git add src/components/common/FadeIn.tsx tests/unit/fade-in.test.tsx
git commit -m "fix(home): FadeIn visible by default, remove scroll-gate (fixes blank-until-scroll)"
```

---

### Task 3: Monochrome discount badge

**Files:**

- Modify: `src/components/products/ProductCard.tsx:70-82`
- Test: `tests/unit/product-card.test.tsx` (create)

**Interfaces:**

- Consumes: `Badge` from `@/components/ui/badge` (variants: default/secondary/destructive/outline).
- Produces: discount badge rendered with `variant="default"` (monochrome `bg-primary text-primary-foreground`) + uppercase/tracking classes. No `destructive`.

- [ ] **Step 1: Write the failing test.** Create `tests/unit/product-card.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ProductCard } from "@/components/products/ProductCard";

const base = {
  id: "p1",
  name: "Mirox Hoodie",
  slug: "mirox-hoodie",
  price: 39.99,
  comparePrice: 49.99,
  stock: 5,
  images: [{ url: "https://example.com/a.jpg", alt: "Hoodie" }],
  category: { name: "Hoodies", slug: "hoodies" },
};

describe("ProductCard", () => {
  it("renders the discount badge without any destructive/red class", () => {
    const { container } = render(<ProductCard product={base} />);
    expect(screen.getByText("-20%")).toBeInTheDocument();
    // No element on the card uses the destructive (red) badge variant.
    expect(container.querySelector(".bg-destructive")).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify it fails.**

Run: `npm run test:run -- tests/unit/product-card.test.tsx`
Expected: FAIL — current badge uses `variant="destructive"` → `.bg-destructive` present.

- [ ] **Step 3: Replace the badge.** In `src/components/products/ProductCard.tsx`, change the discount `Badge`:

```tsx
{
  discount && (
    <Badge
      variant="default"
      className="rounded-none px-2 py-0.5 text-[0.65rem] font-semibold tracking-wider uppercase"
    >
      -{discount}%
    </Badge>
  );
}
```

Leave the out-of-stock `Badge variant="secondary"` unchanged.

- [ ] **Step 4: Run to verify it passes.**

Run: `npm run test:run -- tests/unit/product-card.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add src/components/products/ProductCard.tsx tests/unit/product-card.test.tsx
git commit -m "feat(products): monochrome discount badge (brand palette)"
```

---

### Task 4: Branded image fallback for broken/missing images

**Files:**

- Create: `src/components/products/ProductImage.tsx`
- Modify: `src/components/products/ProductCard.tsx:52-68`
- Test: `tests/unit/product-card.test.tsx` (extend)

**Interfaces:**

- Consumes: `next/image`, `DEFAULT_BLUR_DATA_URL`/`IMAGE_SIZES` from `@/lib/image-utils`, `Logo` from `@/components/common/Logo`.
- Produces: `ProductImage({ src, alt, sizes })` client component — renders the image; on `onError` OR missing `src`, renders the branded M placeholder (Logo mark on `--muted`) with `data-testid="product-image-fallback"`.

- [ ] **Step 1: Write the failing tests.** Extend `tests/unit/product-card.test.tsx`:

```tsx
import { fireEvent } from "@testing-library/react";

it("shows the branded fallback when an image fails to load", () => {
  render(<ProductCard product={base} />);
  const img = screen.getByAltText("Hoodie");
  fireEvent.error(img);
  expect(screen.getByTestId("product-image-fallback")).toBeInTheDocument();
});

it("shows the branded fallback when no image is provided", () => {
  render(<ProductCard product={{ ...base, images: [] }} />);
  expect(screen.getByTestId("product-image-fallback")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run to verify they fail.**

Run: `npm run test:run -- tests/unit/product-card.test.tsx`
Expected: FAIL — no fallback testid (current empty-image path renders a `Package` icon; broken image stays blank).

- [ ] **Step 3: Create `src/components/products/ProductImage.tsx`.**

```tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { Logo } from "@/components/common/Logo";
import { DEFAULT_BLUR_DATA_URL } from "@/lib/image-utils";

interface ProductImageProps {
  src?: string;
  alt: string;
  sizes: string;
}

/**
 * Product image with a branded fallback. A missing src, or a src that 404s at
 * runtime (onError), renders the Mirox mark on --muted instead of a blank box —
 * making the data-level broken images (dead seed URLs, tracked in BACKLOG) look
 * deliberate. Client component so it can catch the load error; the parent
 * ProductCard stays a server component.
 */
export function ProductImage({ src, alt, sizes }: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        data-testid="product-image-fallback"
        className="bg-muted text-muted-foreground/40 flex h-full items-center justify-center"
        aria-hidden="true"
      >
        <Logo showText={false} size="lg" className="scale-[2.5] opacity-70" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover transition-transform duration-300 group-hover:scale-105"
      sizes={sizes}
      placeholder="blur"
      blurDataURL={DEFAULT_BLUR_DATA_URL}
      onError={() => setFailed(true)}
    />
  );
}
```

- [ ] **Step 4: Wire it into `ProductCard.tsx`.** Replace the `product.images[0] ? (<Image .../>) : (<Package .../>)` block with:

```tsx
<ProductImage
  src={product.images[0]?.url}
  alt={product.images[0]?.alt || product.name}
  sizes={IMAGE_SIZES.productCard}
/>
```

Remove the now-unused `Image` and `Package` imports (keep `IMAGE_SIZES`; drop `DEFAULT_BLUR_DATA_URL` if no longer used in this file). Add `import { ProductImage } from "./ProductImage";`.

- [ ] **Step 5: Run to verify tests pass.**

Run: `npm run test:run -- tests/unit/product-card.test.tsx`
Expected: PASS (4 tests total).

- [ ] **Step 6: Typecheck (catches unused-import / prop errors).**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 7: Commit.**

```bash
git add src/components/products/ProductImage.tsx src/components/products/ProductCard.tsx tests/unit/product-card.test.tsx
git commit -m "feat(products): branded M fallback for missing/broken images"
```

---

### Task 5: "Why choose us" → dark "by the numbers" stats block

**Files:**

- Modify: `src/components/home/WhyChooseUs.tsx`
- Test: `tests/unit/why-choose-us.test.tsx`

**Interfaces:**

- Consumes: `home.whyChooseUs` (`{title, items[]}`), `site.claims` (`{olxSales, instagramOrders, customerRating}` — each `string | null`).
- Produces: a `data-surface="dark"` section; renders a stat for each configured claim (label + value), omits null claims; the 7 `items` render as the supporting grid.

- [ ] **Step 1: Update the test.** Replace `tests/unit/why-choose-us.test.tsx` with assertions for the new structure. (Read the current file first to preserve any still-valid cases; the claims-gating cases below are the load-bearing ones.)

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/content/site", () => ({
  site: { claims: { olxSales: "300+", instagramOrders: "100+", customerRating: null } },
}));

import { WhyChooseUs } from "@/components/home/WhyChooseUs";

describe("WhyChooseUs", () => {
  it("renders a stat for each configured claim and omits null ones", () => {
    render(<WhyChooseUs />);
    expect(screen.getByText("300+")).toBeInTheDocument();
    expect(screen.getByText("100+")).toBeInTheDocument();
    // customerRating is null → its label must not appear.
    expect(screen.queryByText(/average rating/i)).toBeNull();
  });

  it("renders on a dark surface", () => {
    const { container } = render(<WhyChooseUs />);
    expect(container.querySelector('[data-surface="dark"]')).not.toBeNull();
  });

  it("renders the supporting brand-voice items", () => {
    render(<WhyChooseUs />);
    expect(screen.getByText("Secure payment")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify it fails.**

Run: `npm run test:run -- tests/unit/why-choose-us.test.tsx`
Expected: FAIL (no `data-surface="dark"`; "300+" currently only appears inside a sentence, not as a standalone stat).

- [ ] **Step 3: Rewrite `WhyChooseUs.tsx`.**

```tsx
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
            <dl className="mx-auto mt-12 grid max-w-3xl gap-8 sm:grid-cols-3">
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
```

- [ ] **Step 4: Run to verify it passes.**

Run: `npm run test:run -- tests/unit/why-choose-us.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit.**

```bash
git add src/components/home/WhyChooseUs.tsx tests/unit/why-choose-us.test.tsx
git commit -m "feat(home): why-choose-us as dark by-the-numbers stats block"
```

---

### Task 6: "Follow us" social tiles

**Files:**

- Modify: `src/components/common/SocialLinks.tsx`
- Modify: `src/app/(shop)/page.tsx:90-100`
- Test: `tests/unit/social-links.test.tsx`

**Interfaces:**

- Produces: `SocialLinks({ className?, variant?: "inline" | "tiles" })`. `"inline"` (default) = current row (footer + hero unaffected). `"tiles"` = larger `.glass` tiles for the homepage section.

- [ ] **Step 1: Add the failing test.** Append to `tests/unit/social-links.test.tsx`:

```tsx
it("renders glass tiles in the tiles variant", () => {
  const { container } = render(<SocialLinks variant="tiles" />);
  expect(container.querySelector(".glass")).not.toBeNull();
});
```

- [ ] **Step 2: Run to verify it fails.**

Run: `npm run test:run -- tests/unit/social-links.test.tsx`
Expected: FAIL — no `variant` prop, no `.glass`.

- [ ] **Step 3: Add the variant to `SocialLinks.tsx`.** Add the prop and branch the item styling; keep `formatFollowers` and follower gating exactly as-is.

```tsx
interface SocialLinksProps {
  className?: string;
  variant?: "inline" | "tiles";
}

export function SocialLinks({ className, variant = "inline" }: SocialLinksProps) {
  const isTiles = variant === "tiles";
  return (
    <ul
      className={cn(
        isTiles ? "flex flex-wrap justify-center gap-4" : "flex flex-wrap items-center gap-4",
        className
      )}
    >
      {site.socials.map((social) => {
        const Icon = ICONS[social.platform];
        return (
          <li key={social.platform}>
            <a
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "transition-colors",
                isTiles
                  ? "glass hover-lift flex flex-col items-center gap-2 rounded-lg px-8 py-6 text-sm"
                  : "hover:text-muted-foreground -my-2 inline-flex items-center gap-2 py-2 text-sm"
              )}
            >
              <Icon className={isTiles ? "h-6 w-6" : "h-5 w-5"} aria-hidden="true" />
              <span>{social.label}</span>
              {social.followers !== null && (
                <span className="text-muted-foreground text-xs">
                  {formatFollowers(social.followers)}
                </span>
              )}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
```

- [ ] **Step 4: Use the tiles variant on the homepage.** In `src/app/(shop)/page.tsx`, the "Follow us" section, change `<SocialLinks className="mt-8 justify-center" />` to:

```tsx
<SocialLinks variant="tiles" className="mt-8" />
```

- [ ] **Step 5: Run to verify passes.**

Run: `npm run test:run -- tests/unit/social-links.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit.**

```bash
git add src/components/common/SocialLinks.tsx "src/app/(shop)/page.tsx" tests/unit/social-links.test.tsx
git commit -m "feat(home): follow-us social tiles distinct from footer"
```

---

### Task 7: Hero art direction (no-photo branch)

**Files:**

- Modify: `src/components/home/Hero.tsx`
- Test: `tests/unit/hero.test.tsx`

**Interfaces:**

- Consumes: `home.hero` (`eyebrow, headline[], subtitle, primaryCta, secondaryCta, image`), `Logo`.
- Produces: `!hasImage` branch renders a gradient+grain backdrop, an aria-hidden ghosted M watermark (`data-testid="hero-watermark"`), and the headline lines with staggered `.animate-fade-up` (each line an incremental `animationDelay`). `hasImage` branch unchanged.

- [ ] **Step 1: Add failing assertions.** Read `tests/unit/hero.test.tsx`, then add:

```tsx
it("renders the ghosted brand watermark in the no-image hero", () => {
  render(<Hero />);
  expect(screen.getByTestId("hero-watermark")).toBeInTheDocument();
});

it("staggers the headline lines with an entrance animation", () => {
  render(<Hero />);
  expect(screen.getByText("STYLE.")).toHaveClass("animate-fade-up");
});
```

(These assume `home.hero.image` is null, the current shipped state; the existing suite already renders `<Hero/>` in that state.)

- [ ] **Step 2: Run to verify it fails.**

Run: `npm run test:run -- tests/unit/hero.test.tsx`
Expected: FAIL — no watermark, headline lines have no animation class.

- [ ] **Step 3: Update the `!hasImage` branch of `Hero.tsx`.** Add the backdrop + watermark to the `<section>`, and stagger the headline `<span>`s. Keep the `hasImage` two-column branch untouched.

Section wrapper (no-image state) — add a relative overflow container with layered background and watermark:

```tsx
<section
  data-surface="dark"
  className="bg-background text-foreground relative overflow-hidden"
>
  {!hasImage && (
    <>
      {/* Layered near-black gradient. Grain via a tiny inline SVG data-uri. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_0%,#1a1a1a_0%,#000_70%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")]"
      />
      <div
        data-testid="hero-watermark"
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -bottom-24 opacity-[0.04]"
      >
        <Logo showText={false} size="lg" className="scale-[16] origin-bottom-right" />
      </div>
    </>
  )}
  <div className="relative container py-16 md:py-24">
    {/* ...existing inner content... */}
  </div>
</section>
```

Headline stagger — replace the `headline.map` span with an indexed, delayed entrance (reduced-motion-safe because globals disables `.animate-fade-up`):

```tsx
<h1 className="font-heading mt-6 text-5xl leading-[0.95] font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
  {headline.map((line, i) => (
    <span key={line} className="animate-fade-up block" style={{ animationDelay: `${i * 90}ms` }}>
      {line}
    </span>
  ))}
</h1>
```

Add `import { Logo } from "@/components/common/Logo";`.

- [ ] **Step 4: Run to verify passes.**

Run: `npm run test:run -- tests/unit/hero.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add src/components/home/Hero.tsx tests/unit/hero.test.tsx
git commit -m "feat(home): art-directed no-photo hero (gradient, grain, ghosted M, staggered headline)"
```

---

### Task 8: Full gate + visual-fidelity sign-off

**Files:** none (verification only)

- [ ] **Step 1: Run the full automated gate.**

Run: `npm run lint && npm run typecheck && npm run test:run && npm run build`
Expected: all pass. Fix any fallout before continuing (common: `home-page.test.tsx` snapshotting old section copy).

- [ ] **Step 2: Screenshot the built page and compare to the concept.** Start the app (`npm run build && npm run start` on port 3000, DB reachable) or run against a Vercel preview deploy, then screenshot section-by-section at desktop (1440) + mobile (390) using the same approach as the audit (Playwright with the repo's chromium). Save under the scratchpad.

Run (adapt URL to the preview/local): the audit's screenshot script pattern — navigate, dismiss cookie banner, capture `prod-desktop-full.png` / `reveal-*.png`.
Expected artifacts: full-page + per-section screenshots.

- [ ] **Step 3: Visual-fidelity checklist (human sign-off — spec §5 AC).** Put each screenshot beside `docs/reference/mirox-concept-screenshot.jpg` and confirm, yes/no with the screenshot as evidence:
  - Page is fully visible on load (no blank void below hero).
  - Hero reads as deliberate art direction, not flat black.
  - Discount badge is monochrome (no red anywhere).
  - "Why choose us" shows the stats block; "Follow us" shows tiles distinct from the footer.
  - Broken/missing product image shows the branded M fallback, not blank gray.
  - Soft shadow + moderate glass visible on cards/tiles; nothing over-glassed.
    Record the checklist result in the PR description. Any "no" → reopen the relevant task.

- [ ] **Step 4: E2E (preserve the hydration gate).**

Run: `npm run test:e2e -- tests/e2e/products.spec.ts`
Expected: PASS on chromium + webkit; the `[data-testid='product-card']` wait still resolves (invariant I5).

- [ ] **Step 5: Final commit / open PR.** (Follow the project's finishing-a-development-branch flow.)

---

## Self-Review

**Spec coverage:** F2 → Task 2; F4 → Task 3; image fallback → Task 4; F7 "why choose us" → Task 5; F7 "follow us" → Task 6; F8 material (shadow/glass) → Task 1 + applied in Tasks 4/6; hero art direction → Task 7; visual-fidelity gate (spec §5) → Task 8. All spec sections mapped.

**Placeholder scan:** every code step contains full code; every run step has an exact command + expected result. No TBD/TODO.

**Type consistency:** `ProductImage({src, alt, sizes})` produced in Task 4 is consumed with those exact props in the same task's `ProductCard` edit. `SocialLinks` gains `variant?: "inline" | "tiles"` in Task 6 and is called with `variant="tiles"` in the same task. `FadeIn` keeps its `{children, className?, delay?, as?}` signature (Task 2), so existing callers compile unchanged. `WhyChooseUs`/`Hero` take no new props.

**Out-of-scope respected:** no change to `formatPrice` (USD/TASK-039), no 2nd-image/quick-view/swatches (TASK-036), no hero photography or catalog data (TASK-056).
