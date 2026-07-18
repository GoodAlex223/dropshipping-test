# Mirox Design System & Rebrand Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Mirox black/white luxury-minimal design system as CSS tokens wired into the shared UI, so later design files re-skin tokens rather than components.

**Architecture:** One fixed theme defined as CSS custom properties on `:root` (white surface); a `[data-surface="dark"]` wrapper overrides the same variables for black sections. `next-themes` is removed from the storefront (it can't guarantee a fixed theme). Manrope headings + Inter body with Cyrillic support. A code-built `<Logo/>`, reduced-motion-aware animation primitives, a single order-status style module, and neutralization of the customer pages no later task will rebuild.

**Tech Stack:** Next.js 14 App Router, Tailwind CSS v4 (`@theme`/CSS vars), `next/font/google`, Vitest + React Testing Library (jsdom), shadcn/ui primitives (token-driven, not edited).

**Spec:** `docs/superpowers/specs/2026-07-17-mirox-design-system-design.md`

## Global Constraints

- **Color policy:** monochrome only; the sole hue is `--destructive` red, reserved for error/destructive states. No `bg-*/text-*/border-*-{red,blue,green,yellow,…}-NNN` utilities anywhere customer-facing.
- **Brand anchors:** `#FFFFFF` · `#F5F5F5` · `#1A1A1A` · `#000000` (all chroma-zero); functional greys `#E5E5E5` (border/white), `#666666` (muted-fg/white), `#262626` (border/black), `#A1A1A1` (muted-fg/black).
- **Contrast-tuned exceptions (do NOT pure-flip):** `--muted-foreground` = `#666666`(white)/`#A1A1A1`(black); `--destructive` = `#B91C1C`(white)/`#F87171`(black). Every text/background pairing must meet WCAG AA (≥4.5:1).
- **Radius:** `--radius: 0.25rem`. **Motion:** `--ease-mirox: cubic-bezier(0.16,1,0.3,1)`, `--duration-fast/base/slow: 150/250/400ms`.
- **Fonts:** Manrope (headings/wordmark, weights 500/700/800) + Inter (body); both loaded with `subsets: ["latin","cyrillic","cyrillic-ext"]` — `cyrillic-ext` carries `₴` (U+20B4) and is mandatory.
- **All animation primitives** must no-op under `@media (prefers-reduced-motion: reduce)`.
- **Do NOT edit shadcn primitives** in `src/components/ui/` except `sonner.tsx` (mandatory, next-themes removal). Everything else re-skins via tokens.
- **Out of scope:** home/catalog/PDP color (TASK-035/036/037), cart (TASK-043), admin layout redesign, showcase visual themes, i18n copy (TASK-039).
- **Verification gates:** `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:run`, `npm run format:check` must pass. Existing 246 unit tests stay green. Local dev server: `npm run dev` (port 3001).

---

## File Structure

**Create:**

- `src/components/common/Logo.tsx` — code-built wordmark + bag-with-M glyph (token-driven, link-less)
- `src/components/common/FadeIn.tsx` — IntersectionObserver scroll-reveal wrapper, reduced-motion-safe
- `src/lib/order-status.ts` — single source for OrderStatus → style/label
- `tests/unit/logo.test.tsx`, `tests/unit/fade-in.test.tsx`, `tests/unit/order-status.test.ts`, `tests/unit/no-bright-colors.test.ts`

**Modify:**

- `src/app/globals.css` — token rewrite, motion tokens, animation utilities, `--font-heading`
- `src/app/layout.tsx` — Manrope + Cyrillic subsets
- `src/components/providers.tsx` — remove `ThemeProvider`
- `src/components/ui/sonner.tsx` — drop `useTheme`, fixed theme
- `src/app/showcase/layout.tsx` — local theme wrapper (decouple from global switch)
- `src/components/common/Header.tsx` — `data-surface="dark"`, `<Logo/>`, remove `ThemeSwitcher`, red→destructive, hover fix
- `src/components/common/Footer.tsx` — `data-surface="dark"`, `<Logo/>`, tokens
- `src/components/common/NewsletterSignup.tsx` — success box → tokens
- `src/components/common/index.ts` — export `Logo`, `FadeIn`
- `src/components/reviews/StarRating.tsx`, `src/components/reviews/ReviewStats.tsx` — yellow → foreground
- `src/app/(admin)/admin/orders/page.tsx`, `.../orders/[id]/page.tsx`, `src/app/(shop)/account/orders/page.tsx`, `.../account/orders/[id]/page.tsx` — consume order-status module
- `src/app/(shop)/checkout/page.tsx` — Stripe Elements Mirox appearance
- `src/app/newsletter/confirm/page.tsx`, `src/app/newsletter/unsubscribe/page.tsx`, `src/app/not-found.tsx` — neutralize colors

**Delete:**

- `src/components/theme/` (`theme-switcher.tsx`, `theme-config.ts`, `index.ts`)

---

## Task 1: Design tokens (globals.css core)

**Files:**

- Modify: `src/app/globals.css:53-123`

- [ ] **Step 1: Replace the `:root` block (lines 53–89) and the `.dark` block (lines 91–123) with the Mirox token blocks below.** Keep everything else in the file (the `@theme inline` block, `.bold`/`.luxury`/`.organic` and their `-dark` variants, `@layer base/components/utilities`) unchanged.

```css
/* ========================================
   MIROX THEME — white surface (default)
   ======================================== */
:root {
  --radius: 0.25rem;
  --font-heading: var(--font-geist-sans); /* Manrope wired in Task 2 */
  --font-body: var(--font-geist-sans);
  --font-serif: var(--font-playfair);

  /* Motion */
  --ease-mirox: cubic-bezier(0.16, 1, 0.3, 1);
  --duration-fast: 150ms;
  --duration-base: 250ms;
  --duration-slow: 400ms;

  /* Semantic tokens */
  --background: #ffffff;
  --foreground: #1a1a1a;
  --card: #ffffff;
  --card-foreground: #1a1a1a;
  --popover: #ffffff;
  --popover-foreground: #1a1a1a;
  --primary: #000000;
  --primary-foreground: #ffffff;
  --secondary: #f5f5f5;
  --secondary-foreground: #1a1a1a;
  --muted: #f5f5f5;
  --muted-foreground: #666666;
  --accent: #f5f5f5;
  --accent-foreground: #000000;
  --destructive: #b91c1c;
  --destructive-foreground: #ffffff;
  --border: #e5e5e5;
  --input: #e5e5e5;
  --ring: #1a1a1a;

  /* Charts — admin analytics only (retained) */
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);

  /* Sidebar — admin chrome (already neutral, retained) */
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}

/* ========================================
   SECTION INVERSION — black surface
   Same tokens, inverted. Wrap any section
   in [data-surface="dark"] to re-skin it.
   ======================================== */
[data-surface="dark"] {
  --background: #000000;
  --foreground: #ffffff;
  --card: #1a1a1a;
  --card-foreground: #ffffff;
  --popover: #1a1a1a;
  --popover-foreground: #ffffff;
  --primary: #ffffff;
  --primary-foreground: #000000;
  --secondary: #1a1a1a;
  --secondary-foreground: #ffffff;
  --muted: #1a1a1a;
  --muted-foreground: #a1a1a1;
  --accent: #1a1a1a;
  --accent-foreground: #ffffff;
  --destructive: #f87171;
  --destructive-foreground: #000000;
  --border: #262626;
  --input: #262626;
  --ring: #ffffff;
}
```

- [ ] **Step 2: Verify the build compiles the new CSS.**

Run: `npm run build`
Expected: build succeeds (Tailwind parses the tokens; no CSS errors).

- [ ] **Step 3: Manual smoke check.**

Run: `npm run dev` then open `http://localhost:3001`.
Expected: the storefront is white with near-black text; no color tints. (Header/Footer are still styled from the old chrome — that's fine; they get `data-surface` in Tasks 6–7.)

- [ ] **Step 4: Commit.**

```bash
git add src/app/globals.css
git commit -m "feat(design): add Mirox color, radius, and motion tokens with section inversion"
```

---

## Task 2: Typography — Manrope + Cyrillic

**Files:**

- Modify: `src/app/layout.tsx:23,30-33` (imports + Inter subsets, add Manrope, body class)
- Modify: `src/app/globals.css` (`@theme inline` add `--font-heading`; `:root` point `--font-heading` at Manrope)

**Interfaces:**

- Produces: CSS var `--font-manrope` (via `next/font`) and a `font-heading` Tailwind utility, both consumed by `<Logo/>` (Task 4) and all `h1–h6`.

- [ ] **Step 1: Update fonts in `src/app/layout.tsx`.** Change the `next/font/google` import to include `Manrope`, add Cyrillic subsets to Inter, add the Manrope loader, and add `manrope.variable` to the `<body>` className.

```tsx
// line 23 — add Manrope:
import { Inter, JetBrains_Mono, Playfair_Display, Lora, Manrope } from "next/font/google";

// lines 30-33 — Inter gains Cyrillic:
const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
});

// add after the inter loader — Manrope (headings + wordmark):
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: ["500", "700", "800"],
});
```

Then add `${manrope.variable}` to the body className (line ~108):

```tsx
<body
  className={`${inter.variable} ${jetbrainsMono.variable} ${playfair.variable} ${lora.variable} ${manrope.variable} antialiased`}
>
```

- [ ] **Step 2: Register the `font-heading` utility and point `--font-heading` at Manrope in `src/app/globals.css`.**

In the `@theme inline { … }` block, add this line next to `--font-sans` (line ~9):

```css
--font-heading: var(--font-heading);
```

In `:root`, change the `--font-heading` line (from Task 1) to:

```css
--font-heading: var(--font-manrope);
```

- [ ] **Step 3: Verify build + Cyrillic/₴ rendering.**

Run: `npm run build` — Expected: succeeds.
Run: `npm run dev`, open `http://localhost:3001`. In DevTools console run:

```js
document.body.insertAdjacentHTML(
  "afterbegin",
  '<h1 style="position:fixed;top:0;z-index:9999;background:#fff">Стиль. Якість. Впевненість. ₴1250</h1>'
);
```

Expected: the heading renders in Manrope (geometric sans) with all Ukrainian glyphs and the `₴` sign visible (no tofu boxes / fallback serif).

- [ ] **Step 4: Commit.**

```bash
git add src/app/layout.tsx src/app/globals.css
git commit -m "feat(design): wire Manrope headings + Inter body with Cyrillic (₴) support"
```

---

## Task 3: Animation primitives

**Files:**

- Modify: `src/app/globals.css` (`@layer utilities`)
- Create: `src/components/common/FadeIn.tsx`
- Modify: `src/components/common/index.ts`
- Test: `tests/unit/fade-in.test.tsx`

**Interfaces:**

- Produces: `<FadeIn delay?={number} as?={ElementType}>` component; `.animate-fade-up` and `.hover-lift` utility classes.

- [ ] **Step 1: Write the failing test.** Create `tests/unit/fade-in.test.tsx`:

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
  it("renders children visible and constructs no observer under reduced motion", () => {
    const ctor = vi.fn();
    // @ts-expect-error jsdom lacks IntersectionObserver
    global.IntersectionObserver = class {
      constructor() {
        ctor();
      }
      observe() {}
      disconnect() {}
    };
    mockMatchMedia(true);

    render(<FadeIn>Hello</FadeIn>);

    const el = screen.getByText("Hello");
    expect(el).toBeInTheDocument();
    expect(el).toHaveClass("opacity-100");
    expect(ctor).not.toHaveBeenCalled();
  });

  it("reveals children when scrolled into view", () => {
    let cb: IntersectionObserverCallback | undefined;
    // @ts-expect-error jsdom lacks IntersectionObserver
    global.IntersectionObserver = class {
      constructor(c: IntersectionObserverCallback) {
        cb = c;
      }
      observe() {
        cb?.(
          [{ isIntersecting: true } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver
        );
      }
      disconnect() {}
    };
    mockMatchMedia(false);

    render(<FadeIn>World</FadeIn>);

    expect(screen.getByText("World")).toHaveClass("opacity-100");
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails.**

Run: `npx vitest run tests/unit/fade-in.test.tsx`
Expected: FAIL — `Failed to resolve import "@/components/common/FadeIn"`.

- [ ] **Step 3: Create `src/components/common/FadeIn.tsx`.**

```tsx
"use client";

import {
  createElement,
  useEffect,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

interface FadeInProps {
  children: ReactNode;
  className?: string;
  /** Extra delay before the reveal transition, in ms. */
  delay?: number;
  /** Element/tag to render as. Defaults to "div". */
  as?: ElementType;
}

export function FadeIn({ children, className, delay = 0, as = "div" }: FadeInProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return createElement(
    as,
    {
      ref,
      className: cn(
        "transition-all ease-[var(--ease-mirox)] duration-[var(--duration-slow)] motion-reduce:transition-none motion-reduce:opacity-100",
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        className
      ),
      style: delay ? { transitionDelay: `${delay}ms` } : undefined,
    },
    children
  );
}
```

- [ ] **Step 4: Add the animation utilities to `src/app/globals.css`.** Inside the existing `@layer utilities { … }` block (starts line ~439), add:

```css
/* Mirox motion primitives */
@keyframes mirox-fade-up {
  from {
    opacity: 0;
    transform: translateY(1rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-up {
  animation: mirox-fade-up var(--duration-slow) var(--ease-mirox) both;
}
.hover-lift {
  transition:
    transform var(--duration-base) var(--ease-mirox),
    box-shadow var(--duration-base) var(--ease-mirox);
}
.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px -8px rgb(0 0 0 / 0.15);
}
@media (prefers-reduced-motion: reduce) {
  .animate-fade-up {
    animation: none;
  }
  .hover-lift,
  .hover-lift:hover {
    transform: none;
    box-shadow: none;
    transition: none;
  }
}
```

- [ ] **Step 5: Export from the barrel `src/components/common/index.ts`.** Add:

```ts
export { FadeIn } from "./FadeIn";
```

- [ ] **Step 6: Run the test to confirm it passes.**

Run: `npx vitest run tests/unit/fade-in.test.tsx`
Expected: PASS (both tests).

- [ ] **Step 7: Commit.**

```bash
git add src/components/common/FadeIn.tsx src/components/common/index.ts src/app/globals.css tests/unit/fade-in.test.tsx
git commit -m "feat(design): add FadeIn primitive + fade-up/hover-lift utilities (reduced-motion safe)"
```

---

## Task 4: Logo component

**Files:**

- Create: `src/components/common/Logo.tsx`
- Modify: `src/components/common/index.ts`
- Test: `tests/unit/logo.test.tsx`

**Interfaces:**

- Produces: `<Logo showText?={boolean} size?={"sm"|"md"|"lg"} className?={string} />` — link-less; renders `role="img"` labelled "Mirox Shop"; inherits color via `currentColor`. Consumed by Header (Task 6) and Footer (Task 7), each wrapping it in a `<Link href="/">`.

- [ ] **Step 1: Write the failing test.** Create `tests/unit/logo.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Logo } from "@/components/common/Logo";

describe("Logo", () => {
  it("renders the wordmark by default", () => {
    render(<Logo />);
    expect(screen.getByText("Mirox Shop")).toBeInTheDocument();
  });

  it("hides the wordmark when showText is false", () => {
    render(<Logo showText={false} />);
    expect(screen.queryByText("Mirox Shop")).not.toBeInTheDocument();
  });

  it("exposes an accessible label", () => {
    render(<Logo showText={false} />);
    expect(screen.getByRole("img", { name: "Mirox Shop" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails.**

Run: `npx vitest run tests/unit/logo.test.tsx`
Expected: FAIL — cannot resolve `@/components/common/Logo`.

- [ ] **Step 3: Create `src/components/common/Logo.tsx`.**

```tsx
import { cn } from "@/lib/utils";

interface LogoProps {
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { icon: "h-5 w-5", text: "text-lg" },
  md: { icon: "h-6 w-6", text: "text-xl" },
  lg: { icon: "h-8 w-8", text: "text-2xl" },
};

export function Logo({ showText = true, size = "md", className }: LogoProps) {
  const s = sizeMap[size];

  return (
    <span
      role="img"
      aria-label="Mirox Shop"
      className={cn("inline-flex items-center gap-2 text-current", className)}
    >
      <svg
        viewBox="0 0 24 24"
        className={s.icon}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {/* shopping bag */}
        <path d="M6 8h12l-1 12H7L6 8z" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" />
        {/* M monogram */}
        <path d="M9.5 16.5v-5l2.5 3 2.5-3v5" strokeWidth={1.5} />
      </svg>
      {showText && (
        <span className={cn("font-heading font-extrabold tracking-tight", s.text)}>Mirox Shop</span>
      )}
    </span>
  );
}
```

- [ ] **Step 4: Export from the barrel `src/components/common/index.ts`.** Add:

```ts
export { Logo } from "./Logo";
```

- [ ] **Step 5: Run the test to confirm it passes.**

Run: `npx vitest run tests/unit/logo.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit.**

```bash
git add src/components/common/Logo.tsx src/components/common/index.ts tests/unit/logo.test.tsx
git commit -m "feat(design): add code-built Mirox Logo (wordmark + bag-with-M glyph)"
```

---

## Task 5: Excise next-themes from the storefront

**Files:**

- Modify: `src/components/providers.tsx` (remove `ThemeProvider` + `THEMES`)
- Modify: `src/components/ui/sonner.tsx` (drop `useTheme`, fixed theme)
- Modify: `src/app/showcase/layout.tsx` (local theme wrapper)
- Modify: `src/components/common/Header.tsx:33,352-353` (remove `ThemeSwitcher` import + usage ONLY)
- Delete: `src/components/theme/theme-switcher.tsx`, `src/components/theme/theme-config.ts`, `src/components/theme/index.ts`

**Interfaces:**

- Consumes: nothing new.
- Produces: `:root` Mirox tokens now apply with no theme class; `localStorage` cannot re-theme the storefront.

- [ ] **Step 1: Replace `src/components/providers.tsx` with the next-themes-free version.**

```tsx
"use client";

import dynamic from "next/dynamic";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import { CookieConsent } from "@/components/common/CookieConsent";

// Dynamic import with ssr: false to ensure Web Vitals only runs on the client
const WebVitalsReporter = dynamic(
  () => import("@/components/analytics/WebVitalsReporter").then((mod) => mod.WebVitalsReporter),
  { ssr: false }
);

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      {children}
      <Toaster position="top-right" />
      <CookieConsent />
      {/* Web Vitals reporting to GA4 via GTM */}
      <WebVitalsReporter />
    </SessionProvider>
  );
}
```

- [ ] **Step 2: Replace `src/components/ui/sonner.tsx` (remove `useTheme`).**

```tsx
"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
```

- [ ] **Step 3: Replace `src/app/showcase/layout.tsx` with the locally-scoped theme version.** Themes now apply as a class on the layout's own subtree — never on `<html>` — so showcase cannot leak into the storefront.

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

// Hydration-safe mounting check
const emptySubscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

function useIsMounted() {
  return useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot);
}

// Map route to theme class
function getThemeFromPath(pathname: string | null): string | null {
  if (!pathname) return null;
  if (pathname.includes("/showcase/bold")) return "bold";
  if (pathname.includes("/showcase/luxury")) return "luxury";
  if (pathname.includes("/showcase/organic")) return "organic";
  return null;
}

const themes = [
  { id: "bold", name: "Bold", href: "/showcase/bold", color: "bg-blue-500" },
  { id: "luxury", name: "Luxury", href: "/showcase/luxury", color: "bg-amber-600" },
  { id: "organic", name: "Organic", href: "/showcase/organic", color: "bg-emerald-600" },
];

export default function ShowcaseLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMounted = useIsMounted();
  const currentTheme = getThemeFromPath(pathname);

  return (
    <div className={cn("flex min-h-screen flex-col", currentTheme ?? undefined)}>
      {/* Showcase Header */}
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Store</span>
          </Link>

          <div className="flex items-center gap-2">
            <Palette className="text-muted-foreground h-4 w-4" />
            <span className="text-sm font-medium">
              {currentTheme
                ? `${currentTheme.charAt(0).toUpperCase() + currentTheme.slice(1)} Theme`
                : "Showcase"}
            </span>
          </div>

          {isMounted && (
            <nav className="flex items-center gap-1">
              {themes.map((theme) => (
                <Link key={theme.id} href={theme.href}>
                  <Button
                    variant={currentTheme === theme.id ? "default" : "ghost"}
                    size="sm"
                    className="gap-2"
                  >
                    <span className={`h-3 w-3 rounded-full ${theme.color}`} />
                    <span className="hidden sm:inline">{theme.name}</span>
                  </Button>
                </Link>
              ))}
            </nav>
          )}
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t py-6">
        <div className="text-muted-foreground container text-center text-sm">
          <p>Theme Showcase &middot; Demonstrating visual design capabilities</p>
        </div>
      </footer>
    </div>
  );
}
```

- [ ] **Step 4: In `src/components/common/Header.tsx`, remove the `ThemeSwitcher` import and its usage.** Delete line 33 (`import { ThemeSwitcher } from "@/components/theme";`) and delete lines 352–353:

```tsx
{
  /* Theme Switcher */
}
<ThemeSwitcher />;
```

- [ ] **Step 5: Delete the theme component directory.**

```bash
git rm src/components/theme/theme-switcher.tsx src/components/theme/theme-config.ts src/components/theme/index.ts
```

- [ ] **Step 6: Verify build, then manually confirm no contamination.**

Run: `npm run typecheck` — Expected: passes (no dangling `@/components/theme` import).
Run: `npm run build` — Expected: succeeds.
Run: `npm run dev`, then:

1. Visit `http://localhost:3001/showcase/bold` — confirm the Bold theme (blue) renders.
2. Navigate back to `http://localhost:3001/` — confirm the storefront is Mirox black/white (NOT blue). Reload — still Mirox.

- [ ] **Step 7: Commit.**

```bash
git add src/components/providers.tsx src/components/ui/sonner.tsx src/app/showcase/layout.tsx src/components/common/Header.tsx
git commit -m "refactor(design): remove next-themes from storefront; scope showcase themes locally"
```

---

## Task 6: Restyle Header

**Files:**

- Modify: `src/components/common/Header.tsx`

- [ ] **Step 1: Make the header a dark surface and drop the logo text for `<Logo/>`.**

Add the `Logo` import near the other component imports (after line 30):

```tsx
import { Logo } from "@/components/common/Logo";
```

Change the `<header>` opening tag (line 181) to add `data-surface="dark"`:

```tsx
    <header
      data-surface="dark"
      className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur"
    >
```

Replace the logo block (lines 294–297):

```tsx
{
  /* Logo */
}
<Link href="/" className="flex items-center gap-2">
  <Logo />
</Link>;
```

- [ ] **Step 2: Fix hover states that collapse on the dark surface.** On a dark surface `text-primary` equals `--foreground` (both white), so `hover:text-primary` is invisible. Replace the three desktop-nav occurrences with `hover:text-muted-foreground`:
  - Line 305: `className="hover:text-primary text-sm font-medium transition-colors"` → `className="hover:text-muted-foreground text-sm font-medium transition-colors"`
  - Line 313: `className="hover:text-primary flex items-center gap-1 text-sm font-medium transition-colors outline-none"` → replace `hover:text-primary` with `hover:text-muted-foreground`
  - Lines 337: the admin link `className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"` → `className="hover:text-muted-foreground text-sm font-medium transition-colors"`

- [ ] **Step 3: Neutralize the two sign-out reds to the sanctioned destructive token** (sign-out is treated as a mild destructive action; `text-destructive` is a token, not a bright utility):
  - Line 273: replace `text-red-600` with `text-destructive`
  - Line 483: replace `text-red-600` with `text-destructive`

- [ ] **Step 4: Verify.**

Run: `npm run typecheck` — Expected: passes.
Run: `npm run dev`, open `http://localhost:3001`.
Expected: header bar is black with the white Mirox logo + white nav; hovering a nav link dims it to grey; the cart badge is white-on-black. Open the mobile menu (narrow the window) — it portals to a white sheet (intended). The search dialog opens white (intended).

- [ ] **Step 5: Commit.**

```bash
git add src/components/common/Header.tsx
git commit -m "feat(design): restyle Header as dark surface with Mirox logo"
```

---

## Task 7: Restyle Footer + NewsletterSignup

**Files:**

- Modify: `src/components/common/Footer.tsx`
- Modify: `src/components/common/NewsletterSignup.tsx:44-46`

- [ ] **Step 1: Restyle `src/components/common/Footer.tsx`.** Add the `Logo` import, make the footer a dark surface, replace the "Store" wordmark with `<Logo/>`, and update the copyright.

Add import at top (after line 2):

```tsx
import { Logo } from "@/components/common/Logo";
```

Change the `<footer>` opening tag (line 26) to a dark surface:

```tsx
    <footer data-surface="dark" className="bg-background border-t">
```

Replace the brand block (lines 30–37):

```tsx
{
  /* Brand */
}
<div className="space-y-4">
  <Link href="/" className="inline-flex items-center gap-2">
    <Logo />
  </Link>
  <p className="text-muted-foreground text-sm">
    Your one-stop shop for quality products at great prices.
  </p>
</div>;
```

Replace the copyright line (line 86) `Store` with `Mirox Shop`:

```tsx
            &copy; {new Date().getFullYear()} Mirox Shop. All rights reserved.
```

- [ ] **Step 2: Neutralize the NewsletterSignup success box** at `src/components/common/NewsletterSignup.tsx:44-46`. Replace the green success block with token-driven monochrome (and drop the `dark:` variants):

```tsx
      <div className="flex items-start gap-2 rounded-md border border-border bg-muted p-3">
        <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-foreground" />
        <p className="text-sm text-foreground">
```

(Leave the closing tags and message text unchanged.)

- [ ] **Step 3: Verify.**

Run: `npm run typecheck` — Expected: passes.
Run: `npm run dev`, open `http://localhost:3001` and scroll to the footer.
Expected: footer is black with the white Mirox logo and grey links; submitting the newsletter form shows a monochrome (grey) success box, not green.

- [ ] **Step 4: Commit.**

```bash
git add src/components/common/Footer.tsx src/components/common/NewsletterSignup.tsx
git commit -m "feat(design): restyle Footer as dark surface; monochrome newsletter success"
```

---

## Task 8: Reviews monochrome

**Files:**

- Modify: `src/components/reviews/StarRating.tsx:39`
- Modify: `src/components/reviews/ReviewStats.tsx:42`

- [ ] **Step 1: Make stars monochrome.** In `src/components/reviews/StarRating.tsx` line 39, replace the fill/text yellow with `foreground`:

```tsx
star <= value ? "fill-foreground text-foreground" : "text-muted-foreground/30";
```

- [ ] **Step 2: Make the rating-distribution bar monochrome.** In `src/components/reviews/ReviewStats.tsx` line 42, replace `bg-yellow-400`:

```tsx
className = "bg-foreground h-full rounded-full transition-all";
```

- [ ] **Step 3: Verify existing review tests still pass and check visually.**

Run: `npm run test:run` — Expected: all existing tests pass (246 + new).
Run: `npm run dev`, open a product page with reviews (e.g. `http://localhost:3001/products/<any-seeded-slug>`).
Expected: stars are filled black (not yellow); the rating bars are black.

- [ ] **Step 4: Commit.**

```bash
git add src/components/reviews/StarRating.tsx src/components/reviews/ReviewStats.tsx
git commit -m "feat(design): monochrome star rating and review distribution bars"
```

---

## Task 9: Shared order-status module

**Files:**

- Create: `src/lib/order-status.ts`
- Test: `tests/unit/order-status.test.ts`
- Modify: `src/app/(admin)/admin/orders/page.tsx:67-75`, `src/app/(admin)/admin/orders/[id]/page.tsx:128-136`, `src/app/(shop)/account/orders/page.tsx:50-66`, `src/app/(shop)/account/orders/[id]/page.tsx:69-...`

**Interfaces:**

- Produces:
  - `getOrderStatusStyle(status: string): string` — Tailwind classes (monochrome; red for CANCELLED/REFUNDED)
  - `getOrderStatusLabel(status: string): string` — human label
  - `ORDER_STATUS_STYLES` / `ORDER_STATUS_LABELS` maps
- Note: the admin pages' separate `PAYMENT_STATUS_COLORS` map is admin-only and NOT covered here (out of scope; left as-is).

- [ ] **Step 1: Write the failing test.** Create `tests/unit/order-status.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { getOrderStatusStyle, getOrderStatusLabel, ORDER_STATUS_STYLES } from "@/lib/order-status";

describe("order-status", () => {
  const ALL = [
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "REFUNDED",
  ];

  it("defines a style for every OrderStatus value", () => {
    for (const s of ALL) {
      expect(ORDER_STATUS_STYLES[s]).toBeTruthy();
    }
  });

  it("uses the destructive token only for negative terminal states", () => {
    expect(getOrderStatusStyle("CANCELLED")).toContain("destructive");
    expect(getOrderStatusStyle("REFUNDED")).toContain("destructive");
    expect(getOrderStatusStyle("DELIVERED")).not.toContain("destructive");
    expect(getOrderStatusStyle("PENDING")).not.toContain("destructive");
  });

  it("contains no bright color utilities", () => {
    const bright = /-(red|blue|green|yellow|amber|orange|purple|indigo|pink|emerald|teal|gray)-\d/;
    for (const cls of Object.values(ORDER_STATUS_STYLES)) {
      expect(cls).not.toMatch(bright);
    }
  });

  it("labels known statuses and falls back to the raw value", () => {
    expect(getOrderStatusLabel("SHIPPED")).toBe("Shipped");
    expect(getOrderStatusLabel("WEIRD")).toBe("WEIRD");
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails.**

Run: `npx vitest run tests/unit/order-status.test.ts`
Expected: FAIL — cannot resolve `@/lib/order-status`.

- [ ] **Step 3: Create `src/lib/order-status.ts`.**

```ts
/**
 * Single source of truth for OrderStatus presentation.
 * Monochrome by policy; the destructive (red) token is reserved for the
 * negative terminal states CANCELLED and REFUNDED.
 */
export const ORDER_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-muted text-muted-foreground",
  CONFIRMED: "bg-muted text-foreground",
  PROCESSING: "bg-secondary text-secondary-foreground",
  SHIPPED: "bg-secondary text-secondary-foreground",
  DELIVERED: "bg-foreground text-background",
  CANCELLED: "bg-destructive/10 text-destructive",
  REFUNDED: "bg-destructive/10 text-destructive",
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export function getOrderStatusStyle(status: string): string {
  return ORDER_STATUS_STYLES[status] ?? "bg-muted text-muted-foreground";
}

export function getOrderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status] ?? status;
}
```

- [ ] **Step 4: Run the test to confirm it passes.**

Run: `npx vitest run tests/unit/order-status.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Refactor the four order pages to consume the module.** In each file, delete the local `STATUS_COLORS` (and `STATUS_LABELS` where present) `const` block, add the import, and replace usages.

For `src/app/(shop)/account/orders/page.tsx` and `src/app/(shop)/account/orders/[id]/page.tsx` (both have `STATUS_COLORS` + `STATUS_LABELS`):

- Add near the top imports: `import { getOrderStatusStyle, getOrderStatusLabel } from "@/lib/order-status";`
- Delete the local `const STATUS_COLORS: Record<string, string> = { … }` and `const STATUS_LABELS: Record<string, string> = { … }` blocks.
- Replace `STATUS_COLORS[order.status]` → `getOrderStatusStyle(order.status)` and `STATUS_LABELS[order.status]` → `getOrderStatusLabel(order.status)` (search each file for `STATUS_COLORS[` and `STATUS_LABELS[`).

For `src/app/(admin)/admin/orders/page.tsx` and `src/app/(admin)/admin/orders/[id]/page.tsx` (have `STATUS_COLORS` for OrderStatus + a separate `PAYMENT_STATUS_COLORS`):

- Add: `import { getOrderStatusStyle } from "@/lib/order-status";`
- Delete only the `const STATUS_COLORS: Record<string, string> = { … }` block (the OrderStatus one). **Leave `PAYMENT_STATUS_COLORS` untouched.**
- Replace `STATUS_COLORS[...]` usages with `getOrderStatusStyle(...)`.

- [ ] **Step 6: Verify.**

Run: `npm run typecheck` — Expected: passes.
Run: `npm run test:run` — Expected: all pass.
Run: `npm run dev`, sign in as the seeded admin, visit `/account/orders` and `/admin/orders`.
Expected: order status chips render monochrome; CANCELLED/REFUNDED show the muted-red token. (Admin payment-status chips are unchanged — expected.)

- [ ] **Step 7: Commit.**

```bash
git add src/lib/order-status.ts tests/unit/order-status.test.ts "src/app/(admin)/admin/orders/page.tsx" "src/app/(admin)/admin/orders/[id]/page.tsx" "src/app/(shop)/account/orders/page.tsx" "src/app/(shop)/account/orders/[id]/page.tsx"
git commit -m "refactor(design): extract shared monochrome order-status module"
```

---

## Task 10: Neutralize unscheduled pages

**Files:**

- Modify: `src/app/(shop)/checkout/page.tsx:606-614`
- Modify: `src/app/newsletter/confirm/page.tsx:57,68`
- Modify: `src/app/newsletter/unsubscribe/page.tsx:51,87,98`
- Modify: `src/app/not-found.tsx:9`

- [ ] **Step 1: Give Stripe Elements a Mirox appearance** (Stripe's default `theme:"stripe"` renders blue accents inside the iframe; hex values are required — Stripe cannot read CSS vars). Replace the `options` object at `src/app/(shop)/checkout/page.tsx:606-614`:

```tsx
                      options={{
                        clientSecret,
                        appearance: {
                          theme: "flat",
                          variables: {
                            colorPrimary: "#000000",
                            colorBackground: "#ffffff",
                            colorText: "#1a1a1a",
                            colorDanger: "#b91c1c",
                            borderRadius: "4px",
                            fontFamily: "Inter, system-ui, sans-serif",
                          },
                        },
                      }}
```

- [ ] **Step 2: Neutralize the newsletter confirm page** at `src/app/newsletter/confirm/page.tsx`:
  - Line 57: `text-green-600` → `text-foreground` (success checkmark)
  - Line 68: `text-red-600` → `text-destructive` (error X)

- [ ] **Step 3: Neutralize the newsletter unsubscribe page** at `src/app/newsletter/unsubscribe/page.tsx`:
  - Line 51: `text-red-600` → `text-destructive`
  - Line 87: `text-green-600` → `text-foreground`
  - Line 98: `text-red-600` → `text-destructive`

- [ ] **Step 4: Neutralize the 404 CTA** at `src/app/not-found.tsx:9`. Replace the blue button link:

```tsx
      <Link href="/" className="bg-primary text-primary-foreground hover:bg-primary/90 mt-6 inline-block rounded-md px-4 py-2 transition-colors">
```

- [ ] **Step 5: Verify.**

Run: `npm run typecheck` — Expected: passes.
Run: `npm run dev` and check:

- `http://localhost:3001/newsletter/confirm` (any/invalid token) — the status icon is monochrome/red, not green.
- `http://localhost:3001/not-found-xyz` (any missing route) — the "return home" button is black, not blue.
- Checkout payment step (add an item → checkout) — the Stripe card field uses black accents, not blue.

- [ ] **Step 6: Commit.**

```bash
git add "src/app/(shop)/checkout/page.tsx" src/app/newsletter/confirm/page.tsx src/app/newsletter/unsubscribe/page.tsx src/app/not-found.tsx
git commit -m "feat(design): neutralize checkout, newsletter, and 404 to Mirox palette"
```

---

## Task 11: No-bright-colors regression guard

**Files:**

- Test: `tests/unit/no-bright-colors.test.ts`

- [ ] **Step 1: Write the guard test.** Create `tests/unit/no-bright-colors.test.ts`. It scans the customer-facing surfaces this task owns and fails on any bright color utility. Deferred surfaces (`(shop)` home/catalog/PDP/cart pages, `(admin)`, `showcase`, shadcn `ui/`) are intentionally excluded until their owning tasks land.

```ts
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

// Surfaces TASK-034 cleaned; these must never carry bright color utilities.
const SCAN_PATHS = [
  "src/components/common",
  "src/components/reviews",
  "src/components/products",
  "src/components/shop",
  "src/components/checkout",
  "src/app/newsletter",
  "src/lib/order-status.ts",
  "src/app/not-found.tsx",
];

const BRIGHT =
  /\b(?:bg|text|border|from|to|via|ring|fill|stroke|divide|outline|shadow|accent|caret|decoration)-(?:red|blue|green|yellow|amber|orange|purple|indigo|pink|emerald|teal|cyan|sky|violet|rose|lime|fuchsia)-\d{2,3}\b/;

function walk(path: string): string[] {
  const st = statSync(path);
  if (st.isFile()) return path.match(/\.(tsx?|css)$/) ? [path] : [];
  return readdirSync(path).flatMap((entry) => walk(join(path, entry)));
}

describe("no bright colors in customer-facing scope", () => {
  const files = SCAN_PATHS.flatMap(walk).filter((f) => !f.includes(".test."));

  it.each(files)("%s has no bright color utilities", (file) => {
    const lines = readFileSync(file, "utf8").split("\n");
    const hits = lines
      .map((line, i) => ({ line, n: i + 1 }))
      .filter(({ line }) => BRIGHT.test(line))
      .map(({ n, line }) => `${file}:${n}  ${line.trim()}`);
    expect(hits, `Bright color utilities found:\n${hits.join("\n")}`).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the guard — it must pass now that Tasks 6–10 cleaned every offender.**

Run: `npx vitest run tests/unit/no-bright-colors.test.ts`
Expected: PASS. If it FAILS, the failure message lists `file:line` offenders — fix each by mapping to a token (`text-foreground`, `text-destructive`, `bg-primary`, etc.), then re-run.

- [ ] **Step 3: Commit.**

```bash
git add tests/unit/no-bright-colors.test.ts
git commit -m "test(design): guard against bright colors in customer-facing scope"
```

---

## Task 12: Final verification & docs

**Files:**

- Modify (if stale): `src/components/CLAUDE.md`, `src/app/CLAUDE.md` (note next-themes removal + `theme/` deletion)

- [ ] **Step 1: Run the full gate suite.**

```bash
npm run typecheck && npm run lint && npm run format:check && npm run test:run && npm run build
```

Expected: all pass; test count is 246 prior + new (`fade-in` 2, `logo` 3, `order-status` 4, `no-bright-colors` N-files). If `format:check` fails, run `npm run format` and re-commit.

- [ ] **Step 2: Manual acceptance pass** (`npm run dev`, `http://localhost:3001`):
  1. Home/product pages render white surface, black text, zero color tint.
  2. Header + Footer are black with the white Mirox logo; nav hovers dim to grey.
  3. Set OS "Reduce motion" → reload → `FadeIn`/hover-lift do not animate (content still visible).
  4. Inject a Ukrainian heading with `₴` (Task 2 Step 3 snippet) → Manrope renders all glyphs.
  5. `/showcase/bold` → back to `/` → storefront stays Mirox (no contamination).
  6. `/account/orders` status chips monochrome; CANCELLED/REFUNDED muted-red.

- [ ] **Step 3: Update module docs if stale.** In `src/components/CLAUDE.md`, remove the `theme/` directory entry and the `next-themes` dependency line; note toasts use a fixed theme. Keep edits minimal and factual.

- [ ] **Step 4: Commit.**

```bash
git add src/components/CLAUDE.md src/app/CLAUDE.md
git commit -m "docs(design): update module notes for next-themes removal"
```

- [ ] **Step 5: Confirm acceptance criteria (spec §10.3).** Tokens consumed by shared components (Tasks 1,6,7); Header/Footer/buttons/cards restyled (Tasks 1,6,7 — buttons/cards re-skin via tokens); animation primitives available (Task 3); no bright colors customer-facing (Tasks 6–11 + guard). All four boxes checkable.

---

## Self-Review

**Spec coverage:**

- §3 theme model → Task 1 (tokens/inversion), Task 5 (next-themes removal) ✓
- §4 tokens (anchors, ramp, mapping, radius, motion) → Task 1 ✓
- §5 typography + logo → Task 2 (fonts), Task 4 (Logo) ✓
- §6 animation primitives → Task 3 ✓
- §7 shared component restyle → Tasks 6 (Header), 7 (Footer/NewsletterSignup), 8 (StarRating/ReviewStats); button/card/badge/overlays re-skin via tokens (Task 1), sonner in Task 5 ✓
- §8 order-status module → Task 9 ✓
- §9 unscheduled pages → Task 10; deferred pages excluded from guard (Task 11) ✓
- §10 testing → Tasks 3,4,9 (unit), 11 (guard), 12 (gates + manual) ✓

**Placeholder scan:** No TBD/TODO; every code step shows full code; every command has expected output. ✓

**Type consistency:** `getOrderStatusStyle`/`getOrderStatusLabel` used identically in Task 9 test, module, and call sites. `<Logo showText size className>` and `<FadeIn delay as>` match between component, tests, and consumers. `--font-manrope`/`--font-heading`/`font-heading` consistent across Tasks 2 and 4. ✓

**Deviations from spec (deliberate, YAGNI/convention):**

- button.tsx/badge.tsx/card.tsx are NOT edited (spec §7 listed them) — they are already fully token-driven, so they re-skin through Task 1; the shadcn "don't edit `ui/`" convention is honored. Their inert `dark:` variants are harmless (no `.dark` class exists post-Task 5).
- `next-themes` package left installed (unused) to avoid lockfile churn — flag for a later dependency-cleanup backlog item.
- Header sign-out and admin `PAYMENT_STATUS_COLORS`: sign-out red → `text-destructive` (kept as the one sanctioned red); admin payment-status colors left as-is (admin out of scope, excluded from the guard).
