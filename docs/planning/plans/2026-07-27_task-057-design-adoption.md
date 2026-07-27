# TASK-057: Mirox Design Adoption Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Flip the storefront to the all-black Mirox design (`docs/design/design_handoff_mirox/`), realign homepage/header/footer to `Mirox Home.dc.html`, replace the electronics seed with the Mirox clothing catalog, and switch all customer-facing prices to UAH display formatting.

**Architecture:** Token-level re-skin (`:root` flips to the dark palette; `[data-surface="dark"]` machinery deleted), then component realignment on top of the existing content-config layer (`src/content/*`), then a guarded destructive re-seed. One shared `formatPrice()` replaces 5 duplicated USD formatters and ~90 inline `$…toFixed(2)` sites.

**Tech Stack:** Next.js 14.2.35 App Router, Tailwind v4 (`@theme inline` in globals.css), shadcn/ui, Prisma + PostgreSQL, Vitest, Playwright.

**Spec:** [2026-07-27-mirox-design-adoption-design.md](../../superpowers/specs/2026-07-27-mirox-design-adoption-design.md) · Pixel source of truth: the `.dc.html` prototypes in `docs/design/design_handoff_mirox/` (open in a browser; inline styles are the spec).

## Global Constraints

- **Monochrome only**: no color utilities/hexes outside the palette; sanctioned hues are exactly `--destructive` (#f87171 on dark) and `--rating` (#fbbf24, added in Task 8). Status green `#4ADE80` is deferred to TASK-037 (no chunk-1 consumer) — do not add it.
- **Every new CSS token must be registered in `@theme inline`** (`--color-<name>: var(--<name>)`) or its utility silently doesn't exist. Verify utilities in compiled CSS only after a consumer exists (Tailwind emits on use).
- **Ukrainian copy** for homepage/header/footer surfaces (this chunk); other pages keep English until their redesign tasks / TASK-039. `BRAND_NAME` stays `"Mirox Shop"` (Latin).
- **UAH display via `formatPrice()` from `src/lib/format.ts` only** — never hand-roll price strings (decision doc §7.4). Stripe stays `currency: "usd"` and `SHIPPING_METHODS` keeps its current values (TASK-048/049 territory).
- **No dead links**: never link to `/contact`, `/faq`, `/shipping`, `/returns`, `/about`, `/privacy`, `/terms` (TASK-055) — mockup nav/footer items pointing there are omitted, documented.
- **No fabricated data**: claims render only from `site.claims`; never feed claims into structured data; no invented ratings/counters.
- **Hydration gate untouched**: do not change how `/products` renders product cards (`tests/e2e/products.spec.ts` waits on `[data-testid='product-card']` as a hydration signal).
- **Seed safety**: `prisma/seed.ts` gains a localhost-only guard; never run seed against a non-local host without the explicit `SEED_ALLOW_REMOTE=1` override, which is reserved for the user-approved prod re-seed AFTER merge.
- **Slow environment**: run only the named test files per task (`npx vitest run <paths>`); full unit suite (~9 min) + E2E + build only in Task 12. Run long commands in the foreground. If the pre-commit hook times out (~2 min), run `npx lint-staged` manually; use `--no-verify` only after manual eslint+prettier on staged files, and say so in the task report.
- **Commits**: conventional commits, one per task minimum, ending with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- Branch: `feat/task-057-design-adoption` (created in Task 1). Do not push or open a PR until Task 12's user sign-off.

---

### Task 1: Branch, canonical assets, app images

**Files:**

- Create: `public/images/products/*.png` (14 files), `public/images/hero-model-2.png`, `public/images/logo.png` (copied from handoff)
- Delete: `docs/images/` (17 files — verified byte-identical duplicates of `docs/design/design_handoff_mirox/images/`, MD5-compared 2026-07-27)
- Commit (previously untracked): `docs/design/design_handoff_mirox/**`, `docs/reference/reference.png`, `docs/reference/Mirox_Shop_Улучшения_сайта.docx`

**Interfaces:**

- Produces: image paths used by later tasks — `/images/hero-model-2.png` (Task 6 hero), `/images/logo.png` (Task 7 header/footer), `/images/products/p-hudi-basic.png`, `p-hudi-white.png`, `p-hudi-oversize.png`, `p-tshirt.png`, `p-olimp.png`, `p-longsleeve.png`, `p-cargo.png`, `p-cap.png`, `pd-main.png`, `pd-thumb-1.png` … `pd-thumb-5.png` (Task 9 seed).

- [ ] **Step 1: Create the branch**

```bash
git checkout -b feat/task-057-design-adoption
```

- [ ] **Step 2: Copy app assets from the handoff**

```bash
mkdir -p public/images/products
cp docs/design/design_handoff_mirox/images/p-*.png public/images/products/
cp docs/design/design_handoff_mirox/images/pd-*.png public/images/products/
cp docs/design/design_handoff_mirox/images/hero-model-2.png public/images/hero-model-2.png
cp docs/design/design_handoff_mirox/images/logo.png public/images/logo.png
ls public/images/products | wc -l   # expect 14 (8 p-*.png + 6 pd-*.png)
```

- [ ] **Step 3: Verify copies are byte-identical, then delete the duplicate folder**

```bash
md5sum public/images/logo.png docs/design/design_handoff_mirox/images/logo.png   # hashes must match
git rm -r docs/images
```

- [ ] **Step 4: Stage the handoff + reference materials and commit**

```bash
git add docs/design docs/reference/reference.png "docs/reference/Mirox_Shop_Улучшения_сайта.docx" public/images
git commit -m "feat(design): adopt Mirox design handoff; stage app image assets

Canonical design source committed (7 .dc.html prototypes + spec).
docs/images/ deleted (byte-identical duplicate of the handoff images).

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

Expected: commit contains ~24MB handoff + 16 public images; `git status` shows no leftover untracked design files (`.claude/settings*` local modifications stay uncommitted).

---

### Task 2: `formatPrice()` utility (TDD)

**Files:**

- Create: `src/lib/format.ts`
- Test: `tests/unit/format.test.ts`

**Interfaces:**

- Produces: `formatPrice(value: number | string): string` — uk-UA digits with non-breaking-space grouping, ` грн` suffix, integers without decimals, fractional values with exactly two. All later tasks import this; nothing else formats money.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/format.test.ts
import { describe, expect, it } from "vitest";
import { formatPrice } from "@/lib/format";

//   = non-breaking space (uk-UA group separator AND the amount–грн joiner).
// Decision doc §7.4: currency word AFTER the amount, Intl-based, never hand-rolled.
describe("formatPrice", () => {
  it("formats integer UAH amounts without decimals, nbsp-grouped", () => {
    expect(formatPrice(1290)).toBe("1 290 грн");
    expect(formatPrice(590)).toBe("590 грн");
    expect(formatPrice(0)).toBe("0 грн");
  });

  it("formats fractional amounts with exactly two comma decimals", () => {
    expect(formatPrice(1290.5)).toBe("1 290,50 грн");
    expect(formatPrice(2150.75)).toBe("2 150,75 грн");
  });

  it("accepts Prisma Decimal strings (integer-valued strings drop decimals)", () => {
    expect(formatPrice("1290.00")).toBe("1 290 грн");
    expect(formatPrice("589.99")).toBe("589,99 грн");
  });

  it("renders negative amounts (discount lines) with a leading minus", () => {
    expect(formatPrice(-50)).toBe("-50 грн");
  });

  it("degrades non-finite input to zero instead of rendering NaN", () => {
    expect(formatPrice(Number.NaN)).toBe("0 грн");
    expect(formatPrice("not-a-price")).toBe("0 грн");
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/unit/format.test.ts`
Expected: FAIL — `Cannot find module '@/lib/format'`

- [ ] **Step 3: Implement**

```ts
// src/lib/format.ts
/**
 * UAH display formatting per the Ukraine payments decision doc §7.4:
 * uk-UA grouping (non-breaking spaces), comma decimals, "грн" AFTER the
 * amount joined by a non-breaking space. Integers render without decimals
 * («1 290 грн»), fractional amounts with exactly two («1 290,50 грн»).
 * The only sanctioned money formatter — do not hand-roll price strings.
 * Stripe charge currency is unrelated and stays in the checkout API.
 */
export function formatPrice(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return formatPrice(0);
  const digits = Number.isInteger(n) ? 0 : 2;
  const formatted = new Intl.NumberFormat("uk-UA", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
  return `${formatted} грн`;
}
```

Note for the negative test: `Number.isInteger(-50)` is true → `"-50 грн"`. uk-UA renders the minus as U+002D via Intl with these options; if the test shows U+2212 (minus sign), update the test to the actual Intl output and note it — the assertion exists to pin the behavior, whichever glyph ICU emits.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/format.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/format.ts tests/unit/format.test.ts
git commit -m "feat(i18n): add shared uk-UA formatPrice() per decision doc §7.4

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Currency sweep — every display site to `formatPrice`, currency codes to UAH

**Files (from the 2026-07-27 inventory; treat as the checklist):**

- Modify (storefront): `src/components/products/ProductCard.tsx:37-42,99,102`, `src/app/(shop)/products/[slug]/product-detail-client.tsx:286,289`, `src/app/(shop)/products/[slug]/opengraph-image.tsx:46-49,122`, `src/components/shop/CartDrawer.tsx:101,141,155,159,164`, `src/app/(shop)/cart/page.tsx:128,199,256,299,348,399,407,413,419`, `src/app/(shop)/checkout/page.tsx:528,668,679,684,689,697`, `src/app/(shop)/checkout/confirmation/page.tsx:85,88,99,103,107,112`, `src/app/(shop)/account/orders/page.tsx:176`, `src/app/(shop)/account/orders/[id]/page.tsx:298,300,319,323,328,333,338`, `src/components/common/Header.tsx:400`, `src/app/(shop)/categories/[slug]/category-client.tsx:288,289,310`, `src/app/(shop)/products/products-content.tsx:289,290,379-380`
- Modify (showcase): `src/components/showcase/{bold/BoldProductGrid,organic/OrganicProductGrid,luxury/LuxuryProductGrid}.tsx` (2 sites each)
- Modify (admin): `src/app/(admin)/admin/orders/[id]/page.tsx` (8 sites), `admin/orders/page.tsx:386`, `admin/products/page.tsx:205-210,359`, `admin/customers/page.tsx:106-111,212`, `admin/suppliers/[id]/page.tsx:190-195,457,459,533`, `admin/page.tsx:23`, `src/components/admin/ProductForm.tsx:285-287,307-309,333-335`
- Modify (email/meta/feed/analytics): `src/lib/email.ts:49,99,103,107,111`, `src/lib/seo.ts:314`, `src/lib/analytics.ts:65,76,87,98,109,121,140`, `src/app/feed/google-shopping.xml/route.ts:24-26`
- Test: `tests/unit/seo.test.ts`, `tests/unit/google-shopping-feed.test.ts`, `tests/unit/product-card.test.tsx`, `tests/e2e/products.spec.ts:96`

**Interfaces:**

- Consumes: `formatPrice(value: number | string): string` from Task 2.
- Produces: zero `$`-formatted money in `src/` display code; `priceCurrency: "UAH"` (seo), `currency: "UAH"` (analytics ×7), feed prices `"<n>.00 UAH"`.

- [ ] **Step 1: Mechanical replacement, file by file**

Patterns (apply exactly; `price`/`x` stands for the existing expression at each listed line):

- `` `$${x.toFixed(2)}` `` → `{formatPrice(x)}` (inside JSX: `${x.toFixed(2)}` text → `{formatPrice(x)}`)
- `${parseFloat(x).toFixed(2)}` → `{formatPrice(x)}`
- `${Number(x).toFixed(2)}` → `{formatPrice(x)}`
- Local `const formatPrice/formatCurrency = new Intl.NumberFormat("en-US"…)` definitions (ProductCard, PDP opengraph-image, admin/products, admin/customers, admin/suppliers/[id]) → delete; `import { formatPrice } from "@/lib/format";` instead. Where the local one took a string, the shared one already accepts strings.
- Raw-integer filter labels (`category-client.tsx`, `products-content.tsx`): `${priceRange[0]}` → `{priceRange[0]} грн` style — keep plain numbers, append ` грн` (slider bounds are ints; full filter redesign is TASK-036). The `"∞"` fallback line becomes `{maxPrice || "∞"} грн`.
- `admin/page.tsx:23` `$0.00` → `{formatPrice(0)}`.
- `ProductForm.tsx` three `$` input adornments → `грн` (same span, text swapped).
- `email.ts` five sites → `${formatPrice(item.totalPrice)}` etc. (template strings — call directly, it returns a plain string).
- Discount-percent computations (`Math.round(((comparePrice - price) / comparePrice) * 100)`) are currency-free — leave.

- [ ] **Step 2: Currency codes**

- `src/lib/seo.ts:314` `priceCurrency: "USD"` → `"UAH"`.
- `src/lib/analytics.ts` — all 7 `currency: "USD"` → `"UAH"`.
- `src/app/feed/google-shopping.xml/route.ts:24-26` → ``return `${Number(price).toFixed(2)} UAH`;`` (machine format keeps two decimals + ISO code; this local `formatPrice` is the FEED formatter, distinct from display — rename it `formatFeedPrice` to prevent import confusion).

- [ ] **Step 3: Cart de-USD + retracted-claim neutralization** (`src/app/(shop)/cart/page.tsx`)

- Delete line 128 `const shipping = subtotal > 100 ? 0 : 9.99;` and the free-shipping upsell line (~413, "Add $X more for free shipping") — with UAH numbers this fabricates the retracted free-delivery promise (`src/content/site.ts` retraction comment).
- Shipping summary row value → the literal string `Calculated at checkout` (same copy CartDrawer:159 already uses; cart page copy stays English until TASK-043).
- Total row: `total` = `subtotal` (shipping now added at checkout only). Keep the variable, drop the shipping addend.

- [ ] **Step 4: Update tests that pin USD**

- `tests/unit/seo.test.ts`: JSON-LD assertions expecting `priceCurrency: "USD"` → `"UAH"`.
- `tests/unit/google-shopping-feed.test.ts`: expectations of `"… USD"` price strings → `"… UAH"` (fixture inputs stating `USD` stay valid inputs where they only exercise the regex — `[A-Z]{3}` still passes; change only route-formatter output expectations).
- `tests/unit/product-card.test.tsx`: if any assertion matches `$` formatting, update to `грн` (badge `-20%` test is unaffected).
- `tests/e2e/products.spec.ts:96`: `page.getByText(/\$\d+/)` → `page.getByText(/\d[\s ]?грн/)`.

- [ ] **Step 5: Verify no display-side dollars remain**

```bash
grep -rn '\$\$\{' src/ ; grep -rn 'toFixed(2)' src/ ; grep -rn '"USD"\|'"'usd'" src/
```

Expected survivors ONLY: `src/app/feed/google-shopping.xml/route.ts` (`toFixed(2)` inside `formatFeedPrice`), `src/app/api/checkout/create-payment-intent/route.ts:109-110` (`Math.round(totals.total * 100)`, `currency: "usd"` — stays per spec), `src/lib/stripe.ts` SHIPPING_METHODS numbers. Anything else = missed site.

- [ ] **Step 6: Run the named unit tests**

Run: `npx vitest run tests/unit/format.test.ts tests/unit/seo.test.ts tests/unit/google-shopping-feed.test.ts tests/unit/product-card.test.tsx`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add -A src/ tests/
git commit -m "feat(i18n): UAH display everywhere — shared formatPrice sweep, UAH currency codes

Cart's fake free-shipping rule removed (retracted-claim guard); Stripe charge
currency deliberately unchanged (TASK-048).

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Token flip — `:root` goes dark, `data-surface` machinery deleted

**Files:**

- Modify: `src/app/globals.css`, `src/components/common/Header.tsx:182`, `src/components/common/Footer.tsx:20`, `src/components/home/Hero.tsx:33`, `src/components/home/WhyChooseUs.tsx:23`, `src/components/common/AnnouncementBar.tsx:87`, `src/app/(shop)/page.tsx:90`
- Test: `tests/unit/no-bright-colors.test.ts`, `tests/unit/hero.test.tsx`, `tests/unit/why-choose-us.test.tsx`

**Interfaces:**

- Produces: dark default tokens (values below); new tokens `--border-strong` (#333333) and `--text-faint` (#737373) registered as `--color-border-strong` / `--color-faint` → utilities `border-border-strong`, `hover:border-border-strong`, `text-faint`. `--radius: 0.625rem` (10px) → `rounded-lg`=10px, `rounded-xl`=14px, `rounded-2xl`=18px. No `data-surface` anywhere in `src/`.

- [ ] **Step 1: Rewrite the `:root` semantic tokens in `src/app/globals.css`**

Replace the current `:root` semantic block (lines ~55-107) values and DELETE the whole `[data-surface="dark"]` block (lines ~109-137):

```css
:root {
  --radius: 0.625rem; /* 10px: buttons/inputs rounded-lg; cards rounded-xl (14px); panels use rounded-[20px] where the prototype demands exact 20 */
  --font-heading: var(--font-manrope);
  --font-body: var(--font-manrope);
  --font-serif: var(--font-playfair);

  /* Motion (unchanged) */
  --ease-mirox: cubic-bezier(0.16, 1, 0.3, 1);
  --duration-fast: 150ms;
  --duration-base: 250ms;
  --duration-slow: 400ms;

  /* Elevation — dark-surface tuning (was the data-surface override) */
  --shadow-soft: 0 1px 2px rgb(0 0 0 / 0.4), 0 12px 32px -8px rgb(0 0 0 / 0.6);

  /* Semantic tokens — Mirox dark (handoff §1). bg #000, panel #0D0D0D,
     panel-2/border #1A1A1A, border-hover #333, text #FFF / #A3A3A3 / #737373 */
  --background: #000000;
  --foreground: #ffffff;
  --card: #0d0d0d;
  --card-foreground: #ffffff;
  --popover: #0d0d0d;
  --popover-foreground: #ffffff;
  --primary: #ffffff;
  --primary-foreground: #000000;
  --secondary: #1a1a1a;
  --secondary-foreground: #ffffff;
  --muted: #1a1a1a;
  --muted-foreground: #a3a3a3;
  --accent: #1a1a1a;
  --accent-foreground: #ffffff;
  --destructive: #f87171;
  --destructive-foreground: #000000;
  --border: #1a1a1a;
  --input: #1a1a1a;
  --ring: #ffffff;
  --border-strong: #333333;
  --text-faint: #737373;
```

Keep the `--chart-*` values unchanged; replace the `--sidebar-*` values (admin chrome coheres with dark):

```css
  --sidebar: #0d0d0d;
  --sidebar-foreground: #ffffff;
  --sidebar-primary: #ffffff;
  --sidebar-primary-foreground: #000000;
  --sidebar-accent: #1a1a1a;
  --sidebar-accent-foreground: #ffffff;
  --sidebar-border: #1a1a1a;
  --sidebar-ring: #737373;
}
```

- [ ] **Step 2: Register the new tokens in `@theme inline`** (top block, next to `--color-border`):

```css
--color-border-strong: var(--border-strong);
--color-faint: var(--text-faint);
```

Also change line 9 `--font-sans: var(--font-geist-sans);` → `--font-sans: var(--font-manrope);` (Manrope 400–800 body-wide per handoff; Manrope already loads `latin + cyrillic + cyrillic-ext`).

- [ ] **Step 3: Base/utilities layer cleanup**

- Delete the `@layer base` rule `[data-surface="dark"] { background-color: …; color: …; }` (lines ~434-437).
- Fold the hover-glow: base `.hover-lift:hover` box-shadow becomes the light glow, and the `[data-surface="dark"] .hover-lift:hover` override is deleted:

```css
.hover-lift:hover {
  transform: translateY(-4px);
  /* Light glow, not black shadow — black drop shadows are invisible on the
     black default surface (learned in PR #23 / 87eed62). */
  box-shadow: 0 10px 30px -6px rgb(255 255 255 / 0.1);
}
```

- Reduced-motion block: remove the now-dead `[data-surface="dark"] .hover-lift:hover` selector from the reset list (keep `.hover-lift, .hover-lift:hover`).
- Keep `.glass`, `.grain`, `.animate-fade-up`, showcase theme blocks (`.bold`, `.luxury`, `.organic`, `*-dark`) untouched.

- [ ] **Step 4: Remove all `data-surface` attributes in components**

In the six TSX files listed above, delete the `data-surface="dark"` attribute (keep the elements and their `bg-background text-foreground` classes — they now inherit dark from `:root`). Then prove removal:

```bash
grep -rn "data-surface" src/
```

Expected: no matches. (If `src/app/opengraph-image.tsx` or others surface here, clean them too.)

- [ ] **Step 5: Update the colour guard** (`tests/unit/no-bright-colors.test.ts`)

- Layer 2 currently extracts BOTH `:root` and `[data-surface="dark"]` blocks (`:188-189`); the dark block no longer exists. Drop the dark-block regex + its parse, keep the `:root` parse. The non-empty guard (`finds a non-empty set of Mirox color tokens`) must still pass on `:root` alone.
- `NON_COLOR_PROPS` / `ADMIN_ONLY_PROPS` / `SANCTIONED_HUE_PROPS` stay as-is (new tokens `--border-strong` #333333 and `--text-faint` #737373 are achromatic and pass automatically).

- [ ] **Step 6: Update component tests that pinned `data-surface`**

- `tests/unit/hero.test.tsx`: the assertion that the hero section has `data-surface="dark"` → assert the attribute is ABSENT (dark is default now); keep the rest.
- `tests/unit/why-choose-us.test.tsx`: `"renders on a dark surface"` → same inversion (assert no `data-surface` attribute; rename the test `"relies on the dark default surface (no data-surface attribute)"`).

- [ ] **Step 7: Run the named tests**

Run: `npx vitest run tests/unit/no-bright-colors.test.ts tests/unit/hero.test.tsx tests/unit/why-choose-us.test.tsx tests/unit/testimonials.test.tsx tests/unit/footer.test.tsx`
Expected: PASS

- [ ] **Step 8: Token-value smoke check in compiled CSS**

```bash
npm run build 2>&1 | tail -5
grep -c -- "--border-strong:#333" .next/static/css/*.css && grep -c "data-surface" .next/static/css/*.css || true
```

Expected: `--border-strong:#333` count ≥ 1; `data-surface` count 0 (second grep exits non-zero on zero matches — that IS the pass; do not pipe through `head`). Utility-class checks (`.border-border-strong`) happen in Task 6/7 once a consumer exists.

- [ ] **Step 9: Commit**

```bash
git add src/app/globals.css src/components src/app tests/unit
git commit -m "feat(theme): flip :root to the Mirox dark palette; delete data-surface machinery

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Ukrainian content config + homepage restructure

**Files:**

- Modify: `src/content/brand.ts`, `src/content/home.ts`, `src/content/site.ts`, `src/app/(shop)/page.tsx`
- Test: `tests/unit/content.test.ts` (rewrite), `tests/unit/home-page.test.tsx` (rewrite), `tests/unit/footer.test.tsx` (tagline regex), `tests/unit/why-choose-us.test.tsx` (items), `tests/e2e/home.spec.ts` (copy), `tests/e2e/navigation.spec.ts:18` (title regex)

**Interfaces:**

- Consumes: nothing new (config-only).
- Produces (later tasks rely on these exact shapes):
  - `home.hero.image: HeroImage | null` = `{ src: "/images/hero-model-2.png", alt: "Модель у чорному худі Mirox" }`
  - `home.benefits: BenefitItem[]` (4 items, icons `Truck, ShieldCheck, Headphones, CreditCard`)
  - `home.whyChooseUs: { title: string; intro: string; items: string[] }` (**new `intro` field**, 6 items)
  - `home.rails: { newArrivals: { title: string; viewAllHref: string; viewAllLabel: string } }` (featured/bestsellers keys REMOVED)
  - `home.testimonials.title`; **`home.social` removed**
  - `site.footerBenefits` (4 new items), everything else in `site` unchanged
  - Homepage section order: `Hero`, `BenefitStrip` (own section), `ProductRail` (Новинки ← `getNewArrivals(4)`), `WhyChooseUs`, `Testimonials`

- [ ] **Step 1: Rewrite `src/content/brand.ts` strings** (structure/comments preserved; `BRAND_NAME` unchanged):

```ts
export const BRAND_NAME = "Mirox Shop";

/** Long form — hero subtitle, footer. */
export const BRAND_TAGLINE = "Сучасний одяг для тих, хто цінує якість і мінімалізм.";

export const BRAND_HERO_SUBTITLE =
  "Mirox Shop — сучасний одяг для тих, хто цінує якість і мінімалізм.";

export const BRAND_META_SUFFIX = "Сучасний одяг";

export const BRAND_DESCRIPTION =
  "Mirox Shop — сучасний одяг для тих, хто цінує якість і мінімалізм. Перевіряємо кожну річ перед відправкою, швидка доставка по всій Україні.";
```

- [ ] **Step 2: Rewrite `src/content/home.ts`** (keep the file's explanatory comments where still true; update the retraction comment to note «Обмін розміру» removed per client 26.07.2026):

```ts
import { Truck, ShieldCheck, Headphones, CreditCard } from "lucide-react";
import type { BenefitItem } from "./site";
import { BRAND_HERO_SUBTITLE } from "./brand";

export interface HeroImage {
  src: string;
  alt: string;
}

export const home = {
  hero: {
    eyebrow: "НОВА КОЛЕКЦІЯ",
    headline: ["СТИЛЬ.", "ЯКІСТЬ.", "ВПЕВНЕНІСТЬ."],
    subtitle: BRAND_HERO_SUBTITLE,
    primaryCta: { label: "ПЕРЕЙТИ В КАТАЛОГ", href: "/products" },
    secondaryCta: {
      label: "ПЕРЕГЛЯНУТИ НОВИНКИ",
      href: "/products?sortBy=createdAt&sortOrder=desc",
    },
    // Generated placeholder from the design handoff; client photography
    // replaces the file (same path) via TASK-056 — content stays untouched.
    image: {
      src: "/images/hero-model-2.png",
      alt: "Модель у чорному худі Mirox",
    } as HeroImage | null,
  },

  // Handoff §4: «Безкоштовна доставка від 1000 грн» stays retracted;
  // «Обмін розміру» removed (no such service — client, 26.07.2026);
  // «Оплата при отриманні» confirmed by the client (26.07.2026), payment
  // method itself ships in TASK-049 — the benefit states the offer, честно.
  benefits: [
    { icon: Truck, title: "Швидка доставка", description: "По всій Україні" },
    { icon: ShieldCheck, title: "Преміум якість", description: "Тільки найкращі матеріали" },
    { icon: Headphones, title: "Підтримка 24/7", description: "Ми завжди на зв'язку" },
    { icon: CreditCard, title: "Оплата при отриманні", description: "Без передоплати" },
  ] as BenefitItem[],

  whyChooseUs: {
    title: "Чому обирають нас",
    intro: "Перевіряємо кожну річ перед відправкою і завжди на зв'язку.",
    items: [
      "Швидка доставка по Україні",
      "Перевірка кожної речі",
      "Підтримка без вихідних",
      "Тільки якісний одяг",
      "Безпечна оплата",
      "Нам довіряють постійні клієнти",
    ],
  },

  rails: {
    newArrivals: {
      title: "Новинки",
      viewAllHref: "/products",
      viewAllLabel: "Дивитись все",
    },
  },

  testimonials: { title: "Відгуки покупців" },
};
```

(`?sortBy=createdAt&sortOrder=desc` is the REAL sort param pair — the old `?sort=newest` was a silent no-op; `products-content.tsx` reads `sortBy`/`sortOrder`.)

- [ ] **Step 3: Update `src/content/site.ts`** — only `footerBenefits` (imports change to match):

```ts
import { Truck, CreditCard, ShieldCheck, Headphones, type LucideIcon } from "lucide-react";
// …interfaces and the rest of `site` unchanged (announcement stays null, socials
// stay placeholder @miroxshop, claims stay "300+"/"100+"/null)…

  footerBenefits: [
    { icon: Truck, title: "Швидка доставка", description: "Розрахунок при оформленні" },
    { icon: CreditCard, title: "Оплата при отриманні", description: "Без передоплати" },
    { icon: ShieldCheck, title: "Безпечна оплата", description: "Захищений checkout" },
    { icon: Headphones, title: "Підтримка 24/7", description: "Ми завжди на зв'язку" },
  ] as BenefitItem[],
```

Update the retraction comment above it: «Обмін розміру»/"Easy returns — 14 days" removed (unconfirmed + no service); «Оплата при отриманні» in per client confirmation 26.07.2026.

- [ ] **Step 4: Restructure `src/app/(shop)/page.tsx`**

```tsx
import type { Metadata } from "next";
import { BenefitStrip } from "@/components/common";
import { Hero, ProductRail, Testimonials, WhyChooseUs } from "@/components/home";
import { home } from "@/content/home";
import { getNewArrivals, type ProductCardData } from "@/lib/product-queries";
import { getTestimonials, type Testimonial } from "@/lib/review-queries";
import { getHomeMetadata } from "@/lib/seo";

export const metadata: Metadata = getHomeMetadata();
export const dynamic = "force-dynamic";

// (keep the existing safeSection<T> helper and its doc comment verbatim)

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
```

Removed: both old rails (featured + bestsellers with honest-heading swap) and the social-tiles section. `getFeaturedProducts`/`getBestsellers` REMAIN exported in `src/lib/product-queries.ts` with their unit tests — add one comment line above `getBestsellers`: `// No homepage consumer since TASK-057; TASK-036's "popular" sort is the intended next consumer.` `SocialLinks` `variant="tiles"` loses its consumer — leave component + tests (the Contacts design, TASK-055, is the intended consumer); note it in the Task 13 BACKLOG entry.

- [ ] **Step 5: Rewrite the affected tests** — exact expectations:

- `tests/unit/content.test.ts`: update to the new shapes — brand name unchanged; headline `["СТИЛЬ.", "ЯКІСТЬ.", "ВПЕВНЕНІСТЬ."]`; CTA hrefs `/products` and `/products?sortBy=createdAt&sortOrder=desc`; benefits length 4 **and a new teeth test**:

```ts
it("never advertises retracted services (free delivery threshold, size exchange)", () => {
  const allBenefitText = [...home.benefits, ...site.footerBenefits]
    .map((b) => `${b.title} ${b.description}`)
    .join(" ")
    .toLowerCase();
  expect(allBenefitText).not.toMatch(
    /обмін розміру|безкоштовна доставка|free delivery|size exchange/
  );
});
```

whyChooseUs items length 6 + `intro` non-empty; rails has ONLY `newArrivals` (`expect(Object.keys(home.rails)).toEqual(["newArrivals"])`); hero image src `/images/hero-model-2.png`.

- `tests/unit/home-page.test.tsx`: rewrite around the new structure — mocks for `getNewArrivals`/`getTestimonials`; tests: (1) renders Новинки rail with 4 mocked products + view-all → `/products`; (2) `getTestimonials` rejection still renders h1 «СТИЛЬ.» + «Чому обирають нас» (safeSection resilience — keep this scenario, it's the prod-incident regression test); (3) `getNewArrivals` rejection still renders hero + testimonials section; (4) benefit strip titles «Швидка доставка» … «Оплата при отриманні» render. Delete the bestsellers/backfilled-honest-heading tests (machinery no longer on the page).
- `tests/unit/footer.test.tsx`: tagline regex → `/цінує якість і мінімалізм/`; keep the no-404 links assertion VERBATIM (it must keep failing if anyone adds `/contact` etc.).
- `tests/unit/why-choose-us.test.tsx`: `"renders the supporting brand-voice items"` → `getByText("Безпечна оплата")`; count 6.
- `tests/e2e/home.spec.ts`: `"STYLE."`→`"СТИЛЬ."` etc.; CTA names → `ПЕРЕЙТИ В КАТАЛОГ` / `ПЕРЕГЛЯНУТИ НОВИНКИ`; `/why choose us/i` → `/чому обирають нас/i`; social-links assertion moves to footer scope (`footer >> /Instagram/i`).
- `tests/e2e/navigation.spec.ts:18`: `toHaveTitle(/Modern Clothing/)` → `toHaveTitle(/Mirox/)` (locale-stable choice; keep the existing explanatory comment, adjusting its text).

- [ ] **Step 6: Run the named unit tests**

Run: `npx vitest run tests/unit/content.test.ts tests/unit/home-page.test.tsx tests/unit/footer.test.tsx tests/unit/why-choose-us.test.tsx tests/unit/hero.test.tsx tests/unit/announcement-bar.test.tsx`
Expected: PASS (E2E deferred to Task 12)

- [ ] **Step 7: Commit**

```bash
git add src/content src/app/\(shop\)/page.tsx src/lib/product-queries.ts tests/
git commit -m "feat(home): Ukrainian content config; homepage restructured to the handoff section order

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Hero image variant + BenefitStrip redesign

**Files:**

- Modify: `src/components/home/Hero.tsx`, `src/components/common/BenefitStrip.tsx`
- Test: `tests/unit/hero.test.tsx`, `tests/unit/benefit-strip.test.tsx`

**Interfaces:**

- Consumes: `home.hero.image` (now non-null), `home.benefits` from Task 5; tokens from Task 4.
- Produces: `BenefitStrip({ items, className })` — SAME props, new bordered-grid rendering (both homepage + footer callers restyle for free). Hero renders `data-testid="hero-vignette"` overlay.

- [ ] **Step 1: Extend `tests/unit/hero.test.tsx` first (failing)** — add to the existing suite (its `mockHero` fixture gains `image` set in the relevant tests):

```tsx
it("renders the vignette overlay above the hero photo", () => {
  mockHero.image = { src: "/images/hero-model-2.png", alt: "Модель Mirox" };
  render(<Hero />);
  const vignette = screen.getByTestId("hero-vignette");
  expect(vignette).toHaveAttribute("aria-hidden", "true");
  expect(vignette.className).toContain("pointer-events-none");
});

it("no longer renders the benefit strip inside the hero", () => {
  render(<Hero />);
  expect(screen.queryByText("Швидка доставка")).not.toBeInTheDocument();
});
```

Run: `npx vitest run tests/unit/hero.test.tsx` — expect the two new tests FAIL.

- [ ] **Step 2: Rewrite the Hero image-variant layout** (`src/components/home/Hero.tsx`)

Keep: config read, `hasImage` branch, typographic fallback (backdrop/grain/watermark) exactly as-is, headline stagger (`animate-fade-up` + delays), Button/Link CTA structure. Change (per `Mirox Home.dc.html:48-66` + `Mirox Mobile.dc.html:37-48`):

- Section: `className="border-border relative overflow-hidden border-b bg-background text-foreground"` (no data-surface — already removed).
- Image-variant layout: replace the current `container grid lg:grid-cols-2` with a full-bleed split — desktop text-left/photo-right `lg:grid lg:grid-cols-[1fr_minmax(400px,44%)]`, mobile photo-as-backdrop with bottom-anchored text:

```tsx
{
  hasImage && (
    <div className="absolute inset-0 lg:static lg:order-2 lg:min-h-[620px]">
      <Image
        src={image.src}
        alt={image.alt}
        fill
        priority
        sizes="(max-width: 1024px) 100vw, 44vw"
        placeholder="blur"
        blurDataURL={DEFAULT_BLUR_DATA_URL}
        className="object-cover object-top"
      />
      {/* CSS vignette per the handoff — photo is swappable, effect persists */}
      <div
        data-testid="hero-vignette"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, var(--background) 0%, rgb(0 0 0 / 0.9) 9%, rgb(0 0 0 / 0) 45%), linear-gradient(to bottom, rgb(0 0 0 / 0.7) 0%, rgb(0 0 0 / 0) 16%), linear-gradient(to right, var(--background) 0%, rgb(0 0 0 / 0.55) 6%, rgb(0 0 0 / 0) 20%), linear-gradient(to left, var(--background) 0%, rgb(0 0 0 / 0.55) 6%, rgb(0 0 0 / 0) 20%)",
        }}
      />
    </div>
  );
}
```

- Text column (image variant): `relative z-10 flex min-h-[560px] flex-col justify-end px-5 pb-10 lg:min-h-[620px] lg:justify-center lg:px-12 lg:pb-16 xl:pl-20` — eyebrow with the 24px dash (`<span aria-hidden className="bg-border-strong inline-block h-px w-6" />` — this is the `border-strong` utility consumer), H1 `text-4xl leading-[1.08] sm:text-5xl lg:text-[64px] lg:leading-[1.05]`, subtitle `text-muted-foreground max-w-[420px] text-base lg:text-lg`, CTAs row `flex-col gap-3 sm:flex-row`.
- DELETE the `<BenefitStrip …/>` render at the bottom of Hero (moved to page.tsx in Task 5) and its import.

- [ ] **Step 3: Restyle `BenefitStrip` to the bordered 1px-gap grid** (props unchanged):

```tsx
export function BenefitStrip({ items, className }: BenefitStripProps) {
  if (items.length === 0) return null;
  return (
    <ul className={cn("bg-border grid grid-cols-2 gap-px lg:grid-cols-4", className)}>
      {items.map(({ icon: Icon, title, description }) => (
        <li
          key={title}
          className="bg-background flex items-center gap-4 px-5 py-5 lg:px-10 lg:py-7"
        >
          <Icon className="h-6 w-6 shrink-0" strokeWidth={1.5} aria-hidden="true" />
          <div>
            <p className="text-sm font-bold">{title}</p>
            <p className="text-muted-foreground mt-0.5 text-xs">{description}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
```

(The `bg-border` wrapper + `gap-px` + `bg-background` cells is the handoff's 1px-grid hack. Footer caller passes a compact `className` in Task 7.)

- [ ] **Step 4: Run the named tests**

Run: `npx vitest run tests/unit/hero.test.tsx tests/unit/benefit-strip.test.tsx tests/unit/home-page.test.tsx`
Expected: PASS (benefit-strip fixtures are structure-based and survive; if a class assertion exists, align it).

- [ ] **Step 5: Utility-registration check in compiled CSS** (first `border-strong` consumer now exists):

```bash
npm run build 2>&1 | tail -3
grep -c "bg-border-strong\|border-strong" .next/static/css/*.css
```

Expected: count ≥ 1 (the `bg-border-strong` utility from the eyebrow dash). A zero count means the `@theme` registration is missing — fix before proceeding.

- [ ] **Step 6: Commit**

```bash
git add src/components/home/Hero.tsx src/components/common/BenefitStrip.tsx tests/unit
git commit -m "feat(home): hero photo variant with CSS vignette; bordered benefit strip

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: Header + Footer redesign

**Files:**

- Modify: `src/components/common/Header.tsx`, `src/components/common/Footer.tsx`
- Create: `tests/unit/header.test.tsx`
- Test: `tests/unit/footer.test.tsx`

**Interfaces:**

- Consumes: `/images/logo.png` (Task 1), tokens (Task 4), `site.footerBenefits`/`BRAND_TAGLINE` (Task 5), `BenefitStrip` (Task 6).
- Produces: header nav links `Каталог → /products`, `Новинки → /products?sortBy=createdAt&sortOrder=desc`, `Бестселери → /products?featured=true`. Logo is `next/image` in both header and footer (the code-drawn `<Logo/>` REMAINS in `ProductImage` fallback + Hero watermark — do not delete the component or `tests/unit/logo.test.tsx`).

- [ ] **Step 1: Write `tests/unit/header.test.tsx` (failing first)**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null, status: "unauthenticated" }),
  signOut: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/",
}));
vi.mock("@/stores/cart.store", () => ({
  useCartStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({ items: [{ id: "1", quantity: 2 }], openCart: vi.fn(), getTotalItems: () => 2 }),
}));

import { Header } from "@/components/common/Header";

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [] }) });
});

describe("Header", () => {
  it("renders the client logo image, not the code-drawn wordmark", () => {
    render(<Header />);
    expect(screen.getAllByAltText("Mirox Shop").length).toBeGreaterThan(0);
  });

  it("renders the three resolvable Ukrainian nav links (and none to unbuilt pages)", () => {
    render(<Header />);
    expect(screen.getByRole("link", { name: "Каталог" })).toHaveAttribute("href", "/products");
    expect(screen.getByRole("link", { name: "Новинки" })).toHaveAttribute(
      "href",
      "/products?sortBy=createdAt&sortOrder=desc"
    );
    expect(screen.getByRole("link", { name: "Бестселери" })).toHaveAttribute(
      "href",
      "/products?featured=true"
    );
    for (const dead of ["Про нас", "Доставка", "Контакти"]) {
      expect(screen.queryByRole("link", { name: dead })).not.toBeInTheDocument();
    }
  });
});
```

NOTE for the implementer: adjust the `useCartStore` mock to the store's REAL selector usage in Header (check how `Header.tsx` reads the store — e.g. `useCartStore((s) => s.openCart)`); the mock above supports selector-style calls. If Header reads categories on mount, the `fetch` stub covers it.

Run: `npx vitest run tests/unit/header.test.tsx` — expect FAIL (nav still English).

- [ ] **Step 2: Rework `Header.tsx`**

- `navigation` array (lines ~50-53) →

```tsx
const navigation = [
  { name: "Каталог", href: "/products" },
  { name: "Новинки", href: "/products?sortBy=createdAt&sortOrder=desc" },
  { name: "Бестселери", href: "/products?featured=true" },
];
```

(«Про нас», «Доставка», «Контакти» from the mockup are TASK-055 pages — no-404 rule, deviation documented in the plan/spec. «Бестселери» maps to the curated `featured=true` listing until TASK-036 adds a popularity sort.)

- Logo: replace `<Logo />` with

```tsx
<Image
  src="/images/logo.png"
  alt="Mirox Shop"
  width={262}
  height={128}
  priority
  className="h-9 w-auto md:h-[42px]"
/>
```

(`import Image from "next/image";`; drop the now-unused `Logo` import.)

- Remove the desktop Categories `DropdownMenu` (design nav has plain links); KEEP the mobile Sheet menu, updating its links to the new `navigation` array + its existing categories list (categories stay reachable on mobile + via footer).
- Header shell: `sticky top-0 z-50 w-full border-b bg-background/90 backdrop-blur` (the `supports-[backdrop-filter]` variant may stay). Desktop nav link classes: `text-muted-foreground hover:text-foreground text-sm font-semibold transition-colors`.
- Keep search dialog, account dropdown, cart button + badge logic untouched (badge now renders white-on-black via flipped `--primary`). Do NOT add a wishlist icon (TASK-041; spec decision — no non-functional icons).

- [ ] **Step 3: Rework `Footer.tsx`** per `Mirox Home.dc.html:195-216` + documented deviations:

```tsx
import Image from "next/image";
import Link from "next/link";
import { BenefitStrip } from "@/components/common/BenefitStrip";
import { SocialLinks } from "@/components/common/SocialLinks";
import { NewsletterSignup } from "@/components/common/NewsletterSignup";
import { site } from "@/content/site";

// Only routes that actually exist. The mockup's info links («Доставка та
// оплата», «Повернення», «Контакти») point at the TASK-055 pages and 404
// today — they join when those pages ship. Same rule as TASK-035.
const shopLinks = [
  { name: "Каталог", href: "/products" },
  { name: "Категорії", href: "/categories" },
  { name: "Новинки", href: "/products?sortBy=createdAt&sortOrder=desc" },
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
```

Notes: `text-faint` is the `--color-faint` utility (its first consumer — compiled-CSS check below). The `[&>li]:…` overrides let the footer reuse the Task-6 BenefitStrip without the 1px-grid look; if that fights visually, add a `variant?: "grid" | "inline"` prop to BenefitStrip instead — implementer's call, tests only assert content. Logo image in the footer is optional per prototype (row 1 has no logo) — do not add one.

- [ ] **Step 4: Update `tests/unit/footer.test.tsx`** — tagline regex already updated in Task 5; adjust link-name expectations to «Каталог»/«Категорії»/«Новинки»; keep the no-404 assertion; add `getByText("Слідкуйте за нами")`.

- [ ] **Step 5: Run the named tests**

Run: `npx vitest run tests/unit/header.test.tsx tests/unit/footer.test.tsx tests/unit/logo.test.tsx tests/unit/social-links.test.tsx`
Expected: PASS (logo.test still passes — component untouched).

- [ ] **Step 6: `text-faint` utility check**

```bash
npm run build 2>&1 | tail -3
grep -c "text-faint" .next/static/css/*.css
```

Expected: ≥ 1.

- [ ] **Step 7: Commit**

```bash
git add src/components/common tests/unit
git commit -m "feat(chrome): header nav + client logo PNG; footer per handoff (benefits, socials, copyright)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: WhyChooseUs 2-col + Testimonials cards + rating token

**Files:**

- Modify: `src/components/home/WhyChooseUs.tsx`, `src/components/home/Testimonials.tsx`, `src/components/reviews/StarRating.tsx`, `src/app/globals.css` (+`--rating` token), `tests/unit/no-bright-colors.test.ts` (sanction `--rating`)
- Test: `tests/unit/why-choose-us.test.tsx`, `tests/unit/testimonials.test.tsx`

**Interfaces:**

- Consumes: `home.whyChooseUs.{title,intro,items}`, `site.claims` (Task 5), `Testimonial` type (`id, author→user name field, rating, comment, productSlug, productName, createdAt` — check `src/lib/review-queries.ts` for exact field names before writing JSX).
- Produces: `--rating: #fbbf24` token registered as `--color-rating` → `text-rating` / `fill-rating`; StarRating stars render amber site-wide (reviews pages included — intended, per design).

- [ ] **Step 1: Add the `--rating` token WITH its consumer** (same commit — a registered token with no consumer is the dead `--shadow-soft` mistake):

globals.css `:root`: `--rating: #fbbf24;` · `@theme inline`: `--color-rating: var(--rating);`
`tests/unit/no-bright-colors.test.ts`: `SANCTIONED_HUE_PROPS` → `new Set(["--destructive", "--destructive-foreground", "--rating"])`.
`StarRating.tsx`: filled-star classes `fill-foreground`→`fill-rating text-rating` (inspect the file; change ONLY the filled state, keep empty-star muted styling).

- [ ] **Step 2: Update `tests/unit/testimonials.test.tsx` (failing first)** — the star-count queries select `.fill-foreground` → change to `.fill-rating`; add:

```tsx
it("renders an initial avatar and a uk-UA date for each testimonial", () => {
  render(<Testimonials testimonials={fixtures} />);
  expect(screen.getByText(fixtures[0].author[0])).toBeInTheDocument(); // «О» for Олександр
  expect(
    screen.getByText(new Date(fixtures[0].createdAt).toLocaleDateString("uk-UA"))
  ).toBeInTheDocument();
});
```

(Adapt `author` to the Testimonial type's real field name.) Run — expect FAIL.

- [ ] **Step 3: Restyle `Testimonials.tsx`** per `Mirox Home.dc.html:169-192`: section `container border-border border-t py-16 lg:py-[72px]`; h2 left-aligned `text-2xl font-extrabold tracking-tight sm:text-[32px]`; grid `mt-8 grid gap-5 md:grid-cols-2`; card `bg-card border-border rounded-2xl border p-7` (drop the shadcn `Card` if simpler — keep `data-testid="testimonial-card"`); header row: avatar `bg-secondary flex h-10 w-10 items-center justify-center rounded-full text-[15px] font-extrabold` with `{name.charAt(0)}`, name `text-sm font-bold`, `StarRating`, date `text-faint ml-auto text-[12.5px]` = `new Date(createdAt).toLocaleDateString("uk-UA")`; body `text-sm leading-relaxed` (keep `text-muted-foreground`-adjacent tone via `text-foreground/85` or default). KEEP the product link line (documented deviation — ties the real review to its product; render small under the comment: `text-faint hover:text-foreground text-xs`).

- [ ] **Step 4: Restyle `WhyChooseUs.tsx`** per `Mirox Home.dc.html:141-167`: section `border-border border-t py-16 lg:py-[72px]` → `container grid gap-12 lg:grid-cols-2 lg:gap-16`; LEFT: h2 (left-aligned, same scale as Testimonials) + `<p className="text-muted-foreground mt-4 max-w-[420px] text-[15px] leading-relaxed">{intro}</p>` + stat cards row `mt-8 flex gap-4` with each `bg-card border-border flex-1 rounded-2xl border px-7 py-6`: value `text-[32px] font-extrabold`, label `text-muted-foreground mt-1 text-[13px]`; RIGHT: `grid content-center gap-3 sm:grid-cols-2` of items with dot `<span aria-hidden className="bg-foreground h-1.5 w-1.5 shrink-0 rounded-full" />` + `text-sm font-semibold text-foreground/85`. Stat labels go Ukrainian in the component (mark with a `// TASK-039: externalize` comment): `успішних покупок на OLX`, `замовлень через Instagram`, `середня оцінка покупців`. Keep the `claim && …` gating + `stats.length > 0` guard exactly as-is (claims may go null).

- [ ] **Step 5: Update `tests/unit/why-choose-us.test.tsx`** — stat-label regex `/customer rating/i` → `/середня оцінка/`; item probe «Безпечна оплата» (already from Task 5); dark-surface test already inverted in Task 4.

- [ ] **Step 6: Run named tests + compiled check**

Run: `npx vitest run tests/unit/why-choose-us.test.tsx tests/unit/testimonials.test.tsx tests/unit/no-bright-colors.test.ts`
Expected: PASS.
`npm run build 2>&1 | tail -3 && grep -c "fill-rating" .next/static/css/*.css` — expect ≥ 1.

- [ ] **Step 7: Commit**

```bash
git add src/components src/app/globals.css tests/unit
git commit -m "feat(home): why-choose-us 2-col with stat cards; testimonial cards with avatars; amber rating token

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: Mirox clothing seed + guarded destructive reset

**Files:**

- Modify: `prisma/seed.ts`, `prisma/seed-data/categories.ts`, `prisma/seed-data/products.ts`, `prisma/seed-data/orders.ts`, `prisma/seed-data/reviews.ts`, `prisma/seed-data/users.ts`
- Create: `tests/unit/seed-data.test.ts`

**Interfaces:**

- Consumes: `/images/products/*.png` paths (Task 1).
- Produces: catalog of 8 Mirox products (SKUs `MRX-001…MRX-008`), UAH integer prices; categories `odyah` (Одяг) + `aksesuary` (Аксесуари) with subs `hudi`, `futbolky`, `olimpiyky`, `shtany`, `longslivy`, `kepky`; Ukrainian users/orders/reviews. `assertLocalDatabase()` guard + full catalog cleanup phase in seed.ts.

- [ ] **Step 1: Write the failing integrity test** — `tests/unit/seed-data.test.ts` (pure data test, no DB):

```ts
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { subcategories, topLevelCategories } from "../../prisma/seed-data/categories";
import { orders } from "../../prisma/seed-data/orders";
import { products } from "../../prisma/seed-data/products";
import { reviews } from "../../prisma/seed-data/reviews";
import { adminUser, testCustomers } from "../../prisma/seed-data/users";

const slugs = new Set([...topLevelCategories, ...subcategories].map((c) => c.slug));
const skus = new Set(products.map((p) => p.sku));
const emails = new Set([adminUser.email, ...testCustomers.map((u) => u.email)]);
const orderNumbers = new Map(orders.map((o) => [o.orderNumber, o]));

describe("seed data integrity (mirrors seed.ts fail-fast guards)", () => {
  it("every product references an existing category and a unique slug/SKU", () => {
    expect(products.length).toBeGreaterThanOrEqual(8);
    expect(new Set(products.map((p) => p.slug)).size).toBe(products.length);
    expect(skus.size).toBe(products.length);
    for (const p of products) expect(slugs.has(p.categorySlug), p.sku).toBe(true);
  });

  it("prices are positive UAH integers; comparePrice always exceeds price", () => {
    for (const p of products) {
      expect(Number.isInteger(p.price), p.sku).toBe(true);
      expect(p.price).toBeGreaterThan(0);
      if (p.comparePrice) expect(p.comparePrice).toBeGreaterThan(p.price);
    }
  });

  it("every product image file exists under public/", () => {
    for (const p of products)
      for (const img of p.images)
        expect(existsSync(join(process.cwd(), "public", img.url)), img.url).toBe(true);
  });

  it("orders reference real users and SKUs", () => {
    for (const o of orders) {
      expect(emails.has(o.customerEmail), o.orderNumber).toBe(true);
      for (const i of o.items) expect(skus.has(i.productSku), i.productSku).toBe(true);
    }
  });

  it("reviews reference DELIVERED orders that contain the reviewed SKU", () => {
    for (const r of reviews) {
      const order = orderNumbers.get(r.orderNumber);
      expect(order, r.orderNumber).toBeDefined();
      expect(order!.status).toBe("DELIVERED");
      expect(order!.items.some((i) => i.productSku === r.productSku)).toBe(true);
      expect(order!.customerEmail).toBe(r.customerEmail);
    }
  });

  it("supplies the homepage: ≥4 featured products and ≥2 testimonial-grade reviews", () => {
    expect(products.filter((p) => p.isFeatured).length).toBeGreaterThanOrEqual(4);
    expect(reviews.filter((r) => r.rating >= 4 && r.comment).length).toBeGreaterThanOrEqual(2);
  });
});
```

Run: `npx vitest run tests/unit/seed-data.test.ts` — FAIL (electronics data: image paths are Unsplash URLs, `existsSync` false).

- [ ] **Step 2: Rewrite `prisma/seed-data/categories.ts`**

```ts
export const topLevelCategories = [
  {
    name: "Одяг",
    slug: "odyah",
    description: "Чоловічий одяг Mirox — худі, футболки, штани та олімпійки",
    image: "/images/products/p-hudi-basic.png",
    sortOrder: 1,
  },
  {
    name: "Аксесуари",
    slug: "aksesuary",
    description: "Аксесуари Mirox — кепки та доповнення до образу",
    image: "/images/products/p-cap.png",
    sortOrder: 2,
  },
];

export const subcategories = [
  {
    name: "Худі",
    slug: "hudi",
    description: "Худі Mirox — базові, oversize та зимові",
    parentSlug: "odyah",
    sortOrder: 1,
  },
  {
    name: "Футболки",
    slug: "futbolky",
    description: "Футболки Mirox з щільної бавовни",
    parentSlug: "odyah",
    sortOrder: 2,
  },
  {
    name: "Лонгсліви",
    slug: "longslivy",
    description: "Лонгсліви Mirox на прохолодну погоду",
    parentSlug: "odyah",
    sortOrder: 3,
  },
  {
    name: "Олімпійки",
    slug: "olimpiyky",
    description: "Олімпійки Mirox на блискавці",
    parentSlug: "odyah",
    sortOrder: 4,
  },
  {
    name: "Штани",
    slug: "shtany",
    description: "Штани та карго Mirox",
    parentSlug: "odyah",
    sortOrder: 5,
  },
  {
    name: "Кепки",
    slug: "kepky",
    description: "Кепки Mirox з вишитим логотипом",
    parentSlug: "aksesuary",
    sortOrder: 1,
  },
];
```

- [ ] **Step 3: Rewrite `prisma/seed-data/products.ts`** — 8 products, exact names/prices/sizes from `Mirox Catalog.dc.html`'s data array. Full first entry + the pattern; write the remaining seven with the same fields:

```ts
export const products = [
  {
    name: "Худі Mirox Basic",
    slug: "hudi-mirox-basic",
    sku: "MRX-001",
    description:
      "Базове чорне худі Mirox з щільного футеру (400 г/м²) з начосом. Оверсайз-крій, посилені шви, капюшон з подвійним шаром та металеві люверси. Вишитий логотип на грудях. Не втрачає форму після прання.",
    shortDesc: "Базове худі з щільного футеру з начосом",
    price: 1290,
    stock: 42,
    isFeatured: true,
    categorySlug: "hudi",
    brand: "Mirox",
    images: [
      {
        url: "/images/products/p-hudi-basic.png",
        alt: "Худі Mirox Basic — вид спереду",
        position: 0,
      },
      { url: "/images/products/pd-main.png", alt: "Худі Mirox Basic — основне фото", position: 1 },
      { url: "/images/products/pd-thumb-1.png", alt: "Худі Mirox Basic — деталь 1", position: 2 },
      { url: "/images/products/pd-thumb-2.png", alt: "Худі Mirox Basic — деталь 2", position: 3 },
      { url: "/images/products/pd-thumb-3.png", alt: "Худі Mirox Basic — деталь 3", position: 4 },
      { url: "/images/products/pd-thumb-4.png", alt: "Худі Mirox Basic — деталь 4", position: 5 },
      { url: "/images/products/pd-thumb-5.png", alt: "Худі Mirox Basic — деталь 5", position: 6 },
    ],
    variants: [
      { name: "Size", value: "S", stock: 8 },
      { name: "Size", value: "M", stock: 12 },
      { name: "Size", value: "L", stock: 12 },
      { name: "Size", value: "XL", stock: 10 },
      { name: "Color", value: "Чорний", stock: 30 },
      { name: "Color", value: "Білий", stock: 12 },
    ],
  },
  // MRX-002 Футболка Mirox — slug "futbolka-mirox", price 590, comparePrice 690,
  //   category futbolky, image p-tshirt.png, sizes S/M/L/XL, colors Чорний/Білий, featured: true
  // MRX-003 Олімпійка Mirox — "olimpiyka-mirox", 1490, category olimpiyky,
  //   image p-olimp.png, sizes S/M/L/XL, color Чорний, featured: true
  // MRX-004 Худі Mirox White — "hudi-mirox-white", 1290, comparePrice 1490,
  //   category hudi, image p-hudi-white.png, sizes S/M/L/XL, color Білий, featured: true
  // MRX-005 Худі Mirox Oversize — "hudi-mirox-oversize", 1390, category hudi,
  //   image p-hudi-oversize.png, sizes M/L/XL/XXL, color Чорний, featured: false
  // MRX-006 Штани Mirox Cargo — "shtany-mirox-cargo", 1190, category shtany,
  //   image p-cargo.png, sizes S/M/L, color Чорний, featured: false
  // MRX-007 Лонгслів Mirox — "longsliv-mirox", 690, category longslivy,
  //   image p-longsleeve.png, sizes S/M/L/XL, color Чорний, featured: false
  // MRX-008 Кепка Mirox — "kepka-mirox", 490, category kepky,
  //   image p-cap.png, variant Size "One size", color Чорний, featured: false
];
```

Write ALL eight as full literals (the comments above give every value; descriptions: 2-3 Ukrainian sentences each in the same register, shortDesc one line). Omit `barcode`/`mpn` (optional in schema; the Google feed's Zod validation silently drops GTIN-less items — acceptable, TASK-056 asks the client for real identifiers). Stocks: any positive ints.

- [ ] **Step 4: Rewrite `prisma/seed-data/users.ts`** — same emails/passwords/structure, Ukrainian names surfacing in testimonials:

`adminUser` name `"Admin User"` → `"Адміністратор Mirox"`; `testCustomers` names → `"Олександр Петренко"`, `"Дмитро Коваленко"`, `"Марія Шевченко"`, `"Ірина Бондаренко"` (emails unchanged — tests and logins reference them).

- [ ] **Step 5: Rewrite `prisma/seed-data/orders.ts`** — 7 orders, same `ORD-2026-000N` numbers/statuses/`daysAgo` spread (4 DELIVERED, 1 SHIPPED, 1 PROCESSING, 1 PENDING), items re-pointed to `MRX-*` SKUs with matching `productName` + UAH `unitPrice`, addresses Ukrainian:

```ts
shippingAddress: {
  fullName: "Олександр Петренко",
  addressLine1: "вул. Хрещатик, 12, кв. 4",
  city: "Київ",
  state: "Київська обл.",
  postalCode: "01001",
  country: "Україна",
},
```

DELIVERED orders must contain the SKUs the reviews reference (keep the pairing consistent — the integrity test enforces it).

- [ ] **Step 6: Rewrite `prisma/seed-data/reviews.ts`** — 8 Ukrainian reviews, ratings `5,4,5,4,5,3,4,5`, the two design testimonials verbatim on recent dates so they surface first (`getTestimonials` orders by `createdAt desc`, takes rating ≥ 4 with comment):

```ts
  {
    customerEmail: "customer@example.com",   // Олександр Петренко
    productSku: "MRX-001",
    orderNumber: "ORD-2026-0001",
    rating: 5,
    comment: "Відмінна якість! Худі сидить ідеально, тканина щільна, дуже задоволений покупкою.",
    adminReply: "Дякуємо за відгук! Раді, що худі підійшло — носіть із задоволенням!",
    adminRepliedAt: daysAgo(1),
    createdAt: daysAgo(2),
  },
  {
    customerEmail: "sarah.wilson@example.com",   // Дмитро Коваленко — adjust to the email whose user is named Дмитро
    productSku: "MRX-002",
    orderNumber: "ORD-2026-0002",
    rating: 5,
    comment: "Швидка доставка, все як на фото. Рекомендую!",
    createdAt: daysAgo(4),
  },
  // + 6 more UA reviews across MRX-003/004/005/007, incl. one rating 3
  //   (renders on the PDP, filtered out of testimonials), 1-2 with adminReply.
```

Align each review's `customerEmail` with the user whose NAME should display (Дмитро's review must belong to the account renamed "Дмитро Коваленко").

- [ ] **Step 7: Harden `prisma/seed.ts`**

At the top (after imports):

```ts
function assertLocalDatabase() {
  const raw = process.env.DATABASE_URL ?? "";
  let host = "";
  try {
    host = new URL(raw).hostname;
  } catch {
    throw new Error("DATABASE_URL is missing or unparsable — refusing to seed.");
  }
  const local = new Set(["localhost", "127.0.0.1", "postgres", "db"]);
  if (!local.has(host) && process.env.SEED_ALLOW_REMOTE !== "1") {
    throw new Error(
      `Refusing to seed non-local database host "${host}". ` +
        `This seed DELETES the catalog and all orders/reviews. ` +
        `Set SEED_ALLOW_REMOTE=1 only for a deliberate, user-approved production re-seed.`
    );
  }
}
```

Call `assertLocalDatabase()` first in `main()`. Then, BEFORE the users phase, add the catalog reset (upserts alone cannot remove the electronics rows; FK-safe order — verify each model name against `prisma/schema.prisma` before writing, e.g. the supplier-order model, cart item model):

```ts
// Full catalog + transactional reset. Users, subscribers, settings, and the
// supplier record survive (upserted below); everything catalog-shaped is
// rebuilt from seed-data so stale rows can't linger next to the new catalog.
await prisma.review.deleteMany();
await prisma.supplierOrder.deleteMany();
await prisma.orderItem.deleteMany();
await prisma.order.deleteMany();
await prisma.cartItem.deleteMany();
await prisma.productVariant.deleteMany();
await prisma.productImage.deleteMany();
await prisma.product.deleteMany();
await prisma.category.deleteMany({ where: { parentId: { not: null } } });
await prisma.category.deleteMany();
```

Totals computation (lines ~163-166) — UAH-sane placeholder:

```ts
const subtotal = o.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
const shippingCost = 80; // Нова Пошта відділення flat placeholder (real rates: TASK-049)
const tax = 0; // no VAT itemization in the demo
const total = subtotal + shippingCost + tax;
```

Settings: `store_name` value `"DropShip Store"` → `"Mirox Shop"`.

- [ ] **Step 8: Run integrity test, then seed locally**

```bash
npx vitest run tests/unit/seed-data.test.ts     # PASS now
grep -n "^DATABASE_URL" .env                    # confirm host is local BEFORE seeding
npm run db:seed
```

Expected: seed completes; guard did not trigger; log shows the new product names.

- [ ] **Step 9: Spot-check the seeded DB**

```bash
npx tsx -e "import {PrismaClient} from '@prisma/client'; const p=new PrismaClient(); p.product.count().then(async c=>{console.log('products',c); console.log(await p.product.findFirst({select:{name:true,price:true}})); const cats=await p.category.count(); console.log('categories',cats); await p.\$disconnect();})"
```

Expected: `products 8`, a Ukrainian product name with an integer price, `categories 8`.

- [ ] **Step 10: Commit**

```bash
git add prisma tests/unit/seed-data.test.ts
git commit -m "feat(seed): Mirox clothing catalog (UA, UAH) with guarded destructive reset

assertLocalDatabase() refuses non-local hosts without SEED_ALLOW_REMOTE=1;
catalog/transactional tables are reset before upserts so stale electronics
rows cannot survive a re-seed.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 10: OG images — Cyrillic fonts + de-branding the PDP card

**Files:**

- Create: `src/lib/og-fonts.ts`
- Modify: `src/app/opengraph-image.tsx`, `src/app/(shop)/products/[slug]/opengraph-image.tsx`

**Interfaces:**

- Consumes: Ukrainian `BRAND_*` strings (Task 5), `formatPrice` (Task 2 — PDP card price).
- Produces: `loadManropeForOg(text: string): Promise<OgFont[]>` where `OgFont = { name: "Manrope"; data: ArrayBuffer; weight: 400 | 800 }` — returns `[]` on any failure (callers spread `fonts` only when non-empty).

- [ ] **Step 1: Why** — Satori's bundled fallback font is Latin-only; with `BRAND_META_SUFFIX`/`BRAND_TAGLINE` now Ukrainian, both OG images would render tofu. Neither file loads a font today (deliberate at the time — English text).

- [ ] **Step 2: Implement `src/lib/og-fonts.ts`**

```ts
export interface OgFont {
  name: "Manrope";
  data: ArrayBuffer;
  weight: 400 | 800;
}

/**
 * Fetch TTF subsets of Manrope (400 + 800) covering exactly the glyphs in
 * `text`, via the css2 API with a legacy UA (legacy UAs are served truetype,
 * which Satori can consume — it cannot parse woff2). Returns [] on ANY
 * failure so callers fall back to Satori's bundled font: the OG route must
 * never 500 over a font fetch; worst case is tofu on Cyrillic glyphs.
 */
export async function loadManropeForOg(text: string): Promise<OgFont[]> {
  try {
    const load = async (weight: 400 | 800): Promise<OgFont> => {
      const css = await fetch(
        `https://fonts.googleapis.com/css2?family=Manrope:wght@${weight}&text=${encodeURIComponent(text)}`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 6.1; Trident/7.0; rv:11.0) like Gecko",
          },
        }
      ).then((r) => r.text());
      const url = css.match(
        /src:\s*url\((https:[^)]+)\)\s*format\(['"](?:truetype|opentype)['"]\)/
      )?.[1];
      if (!url) throw new Error(`no TTF URL for weight ${weight}`);
      const data = await fetch(url).then((r) => r.arrayBuffer());
      return { name: "Manrope", data, weight };
    };
    return await Promise.all([load(400), load(800)]);
  } catch {
    return [];
  }
}
```

- [ ] **Step 3: Wire into `src/app/opengraph-image.tsx`** — collect the rendered strings, load fonts, pass conditionally:

```tsx
export default async function Image() {
  const text = `${BRAND_META_SUFFIX}${BRAND_NAME}${BRAND_TAGLINE}`;
  const fonts = await loadManropeForOg(text);
  return new ImageResponse(
    (/* existing JSX, fontFamily: "Manrope" on the root div */),
    { ...size, ...(fonts.length ? { fonts } : {}) }
  );
}
```

Add `fontFamily: "Manrope"` to the root style; keep existing hex colors (already the dark pair). Update the file's "no custom font fetch" comment — it now explains the Cyrillic requirement.

- [ ] **Step 4: De-brand `src/app/(shop)/products/[slug]/opengraph-image.tsx`** — same font wiring (include the product name + price string in `text`), and replace the off-brand colors: `linear-gradient(135deg, #1e293b 0%, #0f172a 100%)` → `#000000`; `color: "#22c55e"` (price) → `#ffffff`; secondary text `#a3a3a3`; card/panel hints `#0d0d0d`/`#1a1a1a`. The price line uses `formatPrice(Number(product.price))` (Task 3 already swapped the formatter — verify).

- [ ] **Step 5: Verify by rendering**

```bash
npm run dev &   # or reuse a running dev server; foreground alternative: two terminals
sleep 15 && curl -s -o /tmp/og-root.png -w "%{http_code}\n" http://localhost:3000/opengraph-image
curl -s -o /tmp/og-pdp.png -w "%{http_code}\n" "http://localhost:3000/products/hudi-mirox-basic/opengraph-image"
kill %1
```

Expected: both `200`; open both PNGs (Read tool) and CONFIRM Cyrillic renders (no □□□) and the PDP card is black/white. This is a mandatory eyes-on check, not just status codes.

- [ ] **Step 6: Commit**

```bash
git add src/lib/og-fonts.ts src/app/opengraph-image.tsx "src/app/(shop)/products/[slug]/opengraph-image.tsx"
git commit -m "feat(seo): Cyrillic-capable OG images; PDP card on the Mirox palette

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 11: Dark-coherence sweep — bright utilities, guard expansion, admin pass

**Files:**

- Modify: whatever the greps below surface under `src/app/(shop)/{cart,products,categories}`, `src/app/(admin)`, `src/components/admin`
- Test: `tests/unit/no-bright-colors.test.ts` (SCAN_PATHS expansion)

**Interfaces:**

- Consumes: tokens (Task 4). Produces: `SCAN_PATHS` additionally covers `src/app/(shop)/cart`, `src/app/(shop)/products`, `src/app/(shop)/categories` — closing the TASK-034-era carve-out with teeth.

- [ ] **Step 1: Find and fix the deferred bright utilities** (the carve-out is path-level; enumerate now):

```bash
grep -rnE '\b(bg|text|border|from|to|via|ring|fill|stroke|divide|outline|shadow|accent|caret|decoration)-(red|blue|green|yellow|amber|orange|purple|indigo|pink|emerald|teal|cyan|sky|violet|rose|lime|fuchsia|chart)-[0-9]{1,3}\b' "src/app/(shop)/cart" "src/app/(shop)/products" "src/app/(shop)/categories"
```

For each hit, substitute the token-equivalent: success/stock greens → `text-foreground` or `text-muted-foreground` (NOT the green — status green arrives with TASK-037), warning ambers → `text-muted-foreground`, blue links → `text-foreground underline`. Judgment call per site; the outcome that matters: the grep above returns nothing.

- [ ] **Step 2: Extend the guard** — `tests/unit/no-bright-colors.test.ts` `SCAN_PATHS`, add:

```ts
  "src/app/(shop)/cart",
  "src/app/(shop)/products",
  "src/app/(shop)/categories",
```

Update the exemption comment block (`:5-33`): the storefront carve-out is CLOSED; `src/app/(admin)` remains exempt (BACKLOG'd), showcase + ui stay exempt.

Run: `npx vitest run tests/unit/no-bright-colors.test.ts` — PASS (it now proves Step 1).

- [ ] **Step 3: Light-assumption sweep on unredesigned storefront pages**

```bash
grep -rnE 'bg-white|text-black|#fff\b|#ffffff|rgba\(255' "src/app/(shop)" src/components/shop src/components/checkout src/components/reviews | grep -v node_modules
```

Fix hits that hardcode light surfaces (swap to `bg-background`/`bg-card`/`text-foreground`). Black-shadow utilities (`shadow-md` etc.) on dark surfaces: leave unless visibly broken — pixel polish belongs to TASK-036/037/043.

- [ ] **Step 4: Admin functional-contrast pass** — with the dev server running and an admin login (`admin@store.com` / `admin123`), click through: dashboard, products (+form), orders (+detail), customers, suppliers (+detail), reviews, newsletter, settings. Fix ONLY unreadable/unusable spots (typically hardcoded `bg-white`, `text-gray-900`, light table stripes):

```bash
grep -rnE 'bg-white|text-gray-[89]00|bg-gray-50\b' "src/app/(admin)" src/components/admin
```

`PAYMENT_STATUS_COLORS` + supplier status maps stay bright (exempt, BACKLOG'd). Screenshot anything ambiguous for the Task 12 report rather than redesigning.

- [ ] **Step 5: Commit**

```bash
git add src tests/unit/no-bright-colors.test.ts
git commit -m "fix(theme): clear deferred bright utilities; extend colour guard to cart/products/categories; admin contrast pass

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 12: Full verification + visual-fidelity gate (STOP for user sign-off)

**Files:** none (verification only; fixes loop back into the responsible files)

- [ ] **Step 1: Static gates**

```bash
npm run lint && npm run typecheck && npm run format:check
```

Expected: all clean (run `npm run lint:fix` / `npm run format` for mechanical fixes, then re-run).

- [ ] **Step 2: Full unit suite** (foreground; ~9 min in this environment — do NOT background it)

```bash
npm run test:run
```

Expected: 0 failures. Budget: previously 423 passed + 1 todo; this branch adds format/header/seed-data suites and rewrites several — expect ≈430+ passed, 1 todo.

- [ ] **Step 3: Build + E2E** (local DB seeded in Task 9; E2E starts its own dev server on port 3001)

```bash
npm run build
npm run test:e2e
```

Expected: suites green, incl. the updated `home.spec.ts` (Ukrainian copy), `products.spec.ts` (`грн` regex + untouched hydration gate), `navigation.spec.ts` (`/Mirox/` title). Known pre-existing flake: `[chromium] navigation.spec.ts "can navigate to categories page"` cold-compile timeout — retry once before investigating (BACKLOG'd since TASK-038a).

- [ ] **Step 4: Visual-fidelity screenshots** (standing gate for design tasks — the rendered page vs the prototype, not green CI)

With the dev server running, use the Playwright MCP browser tools (or a scratchpad script) to capture into the session scratchpad:

1. `http://localhost:3000/` at 1440×900 — full-page
2. `http://localhost:3000/` at 390×844 — full-page
3. `file:///workspaces/dropshipping/docs/design/design_handoff_mirox/Mirox%20Home.dc.html` at 1440×900 — full-page (reference)
4. The two OG images from Task 10

Compare 1↔3 section by section (header, hero + vignette, benefit strip, rail cards, why-choose-us stats, testimonials, footer) and 2 against the Mobile prototype's Головна frame. Fix discrepancies you'd call defects (wrong hierarchy, missing section, broken overlay); log deliberate deviations (nav/footer link omissions, newsletter row, testimonial product link, current-gen ProductCard internals pending TASK-036).

- [ ] **Step 5: STOP — user sign-off**

Present the screenshot pairs + deviation list to the user and ask explicitly for visual approval of (a) desktop homepage, (b) mobile homepage, (c) OG cards. Do not push, do not open a PR, do not proceed to Task 13's commit until approval. If revisions are requested, loop them through the owning task's files and re-run the affected tests.

---

### Task 13: Docs housekeeping — task map, weekly, indexes, CLAUDE.md

**Files:**

- Modify: `docs/planning/TODO.md`, `docs/planning/WEEKLY.md`, `docs/planning/BACKLOG.md`, `docs/README.md`, `docs/superpowers/specs/2026-07-14-mirox-shop-program-design.md` (dated note only), `CLAUDE.md` (project root), `src/app/CLAUDE.md` (only if falsified), this plan file (progress log)

- [ ] **Step 1: TODO.md** — add TASK-057 under 🔄 In Progress (spec + plan links, AC mirroring spec §3: token flip, homepage per prototype, clothing seed + guard, UAH display, visual gate). Apply spec §4 revisions verbatim: re-scope TASK-036/037/039 descriptions (design source → handoff files; TASK-037 gains SizePicker + BoughtTogether with the size formula; TASK-039 scope = externalize hardcoded UA strings + RU + §7.4 verification), annotate TASK-055/056; TASK-036's hydration AC and TASK-039's monobank escalation stay verbatim.
- [ ] **Step 2: WEEKLY.md** — roll to "Week of 2026-07-27 to 2026-08-02": primary goal TASK-057 (this branch), secondary TASK-036 start + TASK-039 carry-over; move the completed 07-20 week's content per the template's archive convention (check `.claude/TEMPLATES/` weekly template; 🔄 legend differs between templates — use the weekly-planning meaning).
- [ ] **Step 3: BACKLOG.md** — new `### [2026-07-27] From: TASK-057 design adoption` group (🟤 Auto-Generated per intake rules): (1) v1.4 annotations from spec §4 for TASK-043/048/049 (cart/checkout designs exist — pointer entries); (2) `SocialLinks` tiles variant unconsumed since homepage restructure — intended consumer is TASK-055 Contacts; (3) admin UAH/status-color polish leftovers; (4) OG font runtime fetch depends on fonts.googleapis.com — consider committing subset TTFs; (5) `getBestsellers`/`getFeaturedProducts` без homepage consumer — TASK-036 popularity sort is the successor. Route any user-raised items 🔵.
- [ ] **Step 4: Program spec note** — under the header of `2026-07-14-mirox-shop-program-design.md` add: `> **Update 2026-07-27:** A-track design source of truth is now docs/design/design_handoff_mirox/ + the [design-adoption spec](2026-07-27-mirox-design-adoption-design.md); TASK-036/037/039 details revised there. TASK-057 added.` (frozen doc — note only, no rewrite).
- [ ] **Step 5: docs/README.md** — index the new spec, the design handoff (one row pointing at its README), and this plan. Touch ONLY rows you add/change (the Last-Updated audit false-positive lesson — no table sweeps).
- [ ] **Step 6: CLAUDE.md propagation check** (root project file) — correct what this branch falsified: light-theme/`data-surface` inversion pattern (now: dark `:root` default, no data-surface), seed described as electronics/16-categories/50+ products (now: Mirox clothing, 8 products, guarded destructive reset, `SEED_ALLOW_REMOTE`), add `formatPrice`/UAH display convention + `src/lib/format.ts` to the structure listing, homepage section list, test counts if stated. Check `src/app/CLAUDE.md` for the same claims; fix only falsified lines.
- [ ] **Step 7: Commit**

```bash
git add docs CLAUDE.md src/app/CLAUDE.md
git commit -m "docs: TASK-057 progress + task-map revisions per design-adoption spec

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

- [ ] **Step 8: Hand back for integration** — after the Task 12 sign-off and this commit, follow superpowers:finishing-a-development-branch (push, PR `feat/task-057-design-adoption` → `main`, `/code-review` per project policy — list sub-threshold findings in chat, the ≥80 gate understates doc/visual findings). The post-merge completion workflow (DONE.md transition, plan archival, WEEKLY check-off, memory capture) and the **user-approved prod re-seed** (`SEED_ALLOW_REMOTE=1` against the prod `DIRECT_URL`, only after the Vercel deploy is verified serving the branch) happen after merge, per the global CLAUDE.md completion rules.

---

## Self-review notes (author)

- Spec §3.1→Task 4/8/11, §3.2→Tasks 5-7, §3.3→Task 9, §3.4→Tasks 2-3, §3.5→Task 12, §4/§5→Task 13, §2 asset decisions→Task 1. OG Cyrillic (Task 10) is additive — required by §3.2's Ukrainian copy meeting the existing OG images.
- Deliberate deviations from the mockup, carried in code comments + Task 12's deviation list: nav/footer links to TASK-055 pages omitted; newsletter row kept in footer; testimonial product-link kept; wishlist icon not added; ProductCard internals (НОВИНКА badge, sizes row, swatches, whole-card link) deferred to TASK-036 — the rail shows current-gen cards on dark, restyled only by tokens.
- Known post-branch mismatches (documented, accepted): Stripe test-mode `usd` on UAH amounts (TASK-048); checkout `SHIPPING_METHODS` still 5.99/12.99/24.99 rendered as грн (TASK-048/049); admin status colors bright (BACKLOG).
