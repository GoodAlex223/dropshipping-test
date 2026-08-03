# TASK-037 Product Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/products/[slug]` to the `Mirox Product.dc.html` reference — gallery + buy panel, `styleGroup` colorway navigation, `SizePicker`, honest-sum `BoughtTogether`, `RecentlyViewed`, Ukrainian dark-restyled reviews.

**Architecture:** Server page (`page.tsx`) gains fail-soft sibling/companion queries; `product-detail-client.tsx` becomes a lean composition shell; new focused client components live in `src/components/products/`. All prices via `formatPrice()`; every apparel cart line carries a real `variantId`; no client-side-only discounts.

**Tech Stack:** Next.js 14.2.35 (pinned) App Router, React 18, Prisma + PostgreSQL, Zustand cart store, Tailwind (tokens from TASK-034/057), Vitest + RTL, Playwright.

**Spec:** [docs/superpowers/specs/2026-08-01-task-037-product-page-redesign-design.md](../../superpowers/specs/2026-08-01-task-037-product-page-redesign-design.md) — §2 decision table and §7 deviations ledger are binding.

## Global Constraints

- **Ukrainian copy hardcoded** (TASK-039 externalizes later). Money **only** via `formatPrice()` from `@/lib/format`.
- **Colour guard** (`tests/unit/no-bright-colors.test.ts`) scans `src/components/products`, `src/components/reviews`, `src/app/(shop)/products`: no numbered bright utilities (`text-green-400`…). Green stock/verified indicators use the new sanctioned `--available` token (Task 1). Amber stays `--rating`, star ratings only.
- **No dead affordances**: no «У вибране», no «Відкрити фото замірів», no «КУПИТИ В 1 КЛІК» (spec §2 #1/#5).
- **Honest pricing**: strikethrough only when backed by `comparePrice` sums; checkout recomputes prices server-side — never imply a discount checkout won't honor.
- **Fulfillment integrity**: any product with Size variants is only ever added to cart with a size `variantId`.
- **Fail-soft**: sibling/companion/related/review queries must never 500 the page (`safeSection`).
- **Reference metrics** (px sizes, grays like `#a3a3a3`/`#737373`) follow the catalog precedent: arbitrary Tailwind values are fine where no token exists; use `bg-card`, `border-border`, `border-border-strong`, `text-muted-foreground`, `text-rating`, `text-available` where tokens exist.
- **Ignore the IDE's `rounded-[20px]` → `rounded-4xl` suggestion**: this project's radius scale is `--radius: 10px` base, so `rounded-4xl` = 26px ≠ the reference's exact 20px (globals.css's own comment anticipates exact-20px panels on these pages). Exact-equivalent spacing suggestions (`shrink-0`, `h-100` = 400px, `w-4.5` = 18px, `min-w-13` = 52px) are fine either way.
- **Testing**: Vitest unit for pure logic + API params; Playwright E2E foreground, one project per command; PDP interactions wait for `[data-hydrated="true"]` (WebKit pre-hydration lesson).
- **Commits**: conventional (`feat(pdp): …`, `test: …`, `docs: …`), one per task minimum, end body with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- Prisma schema changes: `npm run db:migrate` locally (auto-applies to prod via `vercel-build` on merge); prod _data_ re-seed is a separately-gated user decision — **never run seed against prod in this task**.

---

### Task 1: Sanctioned `--available` token + colour-guard update

The reference uses green `#4ade80` for «● В наявності» and «✓ Підтверджена покупка». The token-layer guard requires every `:root` color token to be achromatic unless sanctioned; the class-name guard bans numbered hue utilities. Add a sanctioned token the honest way (like `--rating` was).

**Files:**

- Modify: `src/app/globals.css` (`:root` block + `@theme inline` block)
- Modify: `tests/unit/no-bright-colors.test.ts:174` (`SANCTIONED_HUE_PROPS`)

**Interfaces:**

- Produces: Tailwind utilities `text-available` / `bg-available` / `border-available` (via `--color-available`), consumed by Tasks 10 and 11.

- [ ] **Step 1: Add the token to `:root`**

In `src/app/globals.css`, inside the `:root { … }` block, directly under the existing `--rating: #fbbf24;` line (which carries the "Sanctioned amber hue" comment), add:

```css
/* Sanctioned green hue — stock-availability line and verified-purchase badge only. */
--available: #4ade80;
```

- [ ] **Step 2: Register it in `@theme inline`**

In the `@theme inline { … }` block, next to the existing `--color-rating: var(--rating);` line, add:

```css
--color-available: var(--available);
```

Both steps are required — an unregistered token produces **silently dead** `text-available` classes (see memory: "A CSS token must be registered in @theme").

- [ ] **Step 3: Run the guard and watch it fail**

Run: `npx vitest run tests/unit/no-bright-colors.test.ts`
Expected: FAIL — `--available: "#4ade80" is chromatic (R≠G≠B) and is not a sanctioned hue token`. This proves the guard has teeth for the new token.

- [ ] **Step 4: Sanction the token in the guard**

In `tests/unit/no-bright-colors.test.ts`, change:

```ts
const SANCTIONED_HUE_PROPS = new Set(["--destructive", "--destructive-foreground", "--rating"]);
```

to:

```ts
// --available: sanctioned green for the PDP stock line and the reviews'
// verified-purchase badge (TASK-037, per Mirox Product.dc.html) — the same
// deliberate-exception mechanism as --rating.
const SANCTIONED_HUE_PROPS = new Set([
  "--destructive",
  "--destructive-foreground",
  "--rating",
  "--available",
]);
```

- [ ] **Step 5: Run the guard again**

Run: `npx vitest run tests/unit/no-bright-colors.test.ts`
Expected: PASS (both describe blocks).

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css tests/unit/no-bright-colors.test.ts
git commit -m "feat(tokens): sanctioned --available green for stock/verified indicators"
```

---

### Task 2: `styleGroup` schema migration + seed colorway cleanup

**Files:**

- Modify: `prisma/schema.prisma:103-133` (Product model)
- Modify: `prisma/seed-data/products.ts` (interface + 3 product entries)
- Modify: `prisma/seed.ts` (~line 160, `scalarFields`)
- Modify (if assertions break): `tests/unit/seed-data.test.ts`

**Interfaces:**

- Produces: `Product.styleGroup: string | null` DB column (indexed); seed where **each product has exactly one Color variant row** and Худі Basic ↔ Худі White share `styleGroup: "hudi-mirox"`. Task 5's sibling query depends on both.

- [ ] **Step 1: Add the column to the Prisma model**

In `prisma/schema.prisma`, inside `model Product`, add after the `mpn String?` line (line ~115):

```prisma
  styleGroup    String?
```

and add alongside the model's other attributes (before the closing `}`, next to existing `@@map`/index lines):

```prisma
  @@index([styleGroup])
```

- [ ] **Step 2: Create the migration + regenerate the client**

Run: `npm run db:migrate -- --name add_product_style_group` (answer prompts non-interactively if asked; the dev DB is the docker-compose Postgres on host port 5433). Then `npm run db:generate`.
Expected: new folder `prisma/migrations/*_add_product_style_group/` containing `ALTER TABLE "products" ADD COLUMN "styleGroup" TEXT;` + `CREATE INDEX`.

- [ ] **Step 3: Update the seed data**

In `prisma/seed-data/products.ts`:

1. Add to the `ProductSeed` interface (after `comparePrice?: number;`):

```ts
  /** Colorway-sibling link: products sharing a styleGroup are the same garment
   *  in different colors; the PDP renders their swatches as links (TASK-037).
   *  Exactly one Color variant row per product — the product's true colorway. */
  styleGroup?: string;
```

2. «Худі Mirox Basic» (slug `hudi-mirox-basic`): add `styleGroup: "hudi-mirox",` after its `comparePrice`/`price` fields, and **delete** the line `{ name: "Color", value: "Білий", stock: 12 },` (keep Чорний).
3. «Худі Mirox White» (slug `hudi-mirox-white`): add `styleGroup: "hudi-mirox",` (its single `Білий` Color row is already correct).
4. «Футболка Mirox» (slug `futbolka-mirox`): **delete** the line `{ name: "Color", value: "Білий", stock: 32 },` (keep Чорний; no white t-shirt product exists).
5. No other product changes — Олімпійка/Oversize/Cargo/Лонгслів/Кепка already carry exactly one Color row.

- [ ] **Step 4: Thread `styleGroup` through the seeder**

In `prisma/seed.ts`, the products loop builds a `scalarFields` object (contains `brand`, `barcode`, `mpn`, …). Add one line to it:

```ts
      styleGroup: p.styleGroup ?? null,
```

- [ ] **Step 5: Run the seed-data unit tests; fix assertions to the new rule**

Run: `npx vitest run tests/unit/seed-data.test.ts`
If it fails on assertions about the dropped «Білий» rows or variant counts, update those assertions to the single-colorway rule. Additionally add this test to `tests/unit/seed-data.test.ts` (adapt the import name to the file's existing style — it imports `products` from `../../prisma/seed-data/products`):

```ts
describe("colorway integrity (TASK-037)", () => {
  it("every product has exactly one Color variant row", () => {
    for (const p of products) {
      const colors = (p.variants ?? []).filter((v) => v.name === "Color");
      expect(colors, `${p.slug} must have exactly one Color row`).toHaveLength(1);
    }
  });

  it("styleGroup links exactly the Худі Basic/White pair", () => {
    const grouped = products.filter((p) => p.styleGroup !== undefined);
    expect(grouped.map((p) => p.slug).sort()).toEqual(["hudi-mirox-basic", "hudi-mirox-white"]);
    expect(new Set(grouped.map((p) => p.styleGroup)).size).toBe(1);
  });
});
```

Expected: PASS after updates.

- [ ] **Step 6: Reseed the local DB and spot-check**

Run: `npm run db:seed` (local Postgres — `assertLocalDatabase()` guards this; do NOT set `SEED_ALLOW_REMOTE`).
Then verify with a one-off Prisma script (the docker CLI is NOT available in this devcontainer — known quirk — so don't reach for psql):

```bash
npx tsx -e "import {PrismaClient} from '@prisma/client'; const p=new PrismaClient(); p.product.findMany({where:{styleGroup:{not:null}},select:{slug:true,styleGroup:true},orderBy:{slug:'asc'}}).then(r=>{console.log(r);return p.\$disconnect()})"
```

Expected: exactly `hudi-mirox-basic` and `hudi-mirox-white`, both `hudi-mirox`.

- [ ] **Step 7: Full unit pass + commit**

Run: `npm run test:run` — expected all green (catalog card color-dot tests may reference variants; fix any that asserted the dropped rows).

```bash
git add prisma tests/unit/seed-data.test.ts
git commit -m "feat(schema): Product.styleGroup colorway link + one-true-colorway seed cleanup"
```

---

### Task 3: Shared helpers — `safeSection`, `product-display`, `pluralizeUk`

**Files:**

- Create: `src/lib/safe-section.ts`
- Create: `src/lib/product-display.ts`
- Modify: `src/app/(shop)/page.tsx:34-47` (delete local `safeSection`, import shared)
- Modify: `src/components/products/ProductCard.tsx:69-86` (import from lib, keep re-export)
- Modify: `src/components/products/QuickViewDialog.tsx:13,31-34,97-106` (import from lib)
- Modify: `src/lib/format.ts` (add `pluralizeUk`)
- Test: `tests/unit/format.test.ts` (extend), `tests/unit/product-display.test.ts` (new)

**Interfaces:**

- Produces:
  - `safeSection<T>(query: Promise<T>, fallback: T, label: string): Promise<T>` from `@/lib/safe-section`
  - `SIZE_ORDER: readonly ["S","M","L","XL","XXL"]`, `COLOR_SWATCH_CLASSES: Record<string,string>`, `rankSizeValues(values: string[]): string[]` from `@/lib/product-display`
  - `pluralizeUk(n: number, one: string, few: string, many: string): string` from `@/lib/format`
- Consumed by: Tasks 5 (safeSection), 7/9/10 (product-display), 10/11 (pluralizeUk).

- [ ] **Step 1: Write failing tests for the two new pure helpers**

Append to `tests/unit/format.test.ts` (it already imports from `@/lib/format` — extend the import):

```ts
// Merge into the file's existing `@/lib/format` import — shown standalone here for clarity.
import { pluralizeUk } from "@/lib/format";

describe("pluralizeUk", () => {
  const forms = ["відгук", "відгуки", "відгуків"] as const;
  it.each([
    [1, "відгук"],
    [21, "відгук"],
    [101, "відгук"],
    [2, "відгуки"],
    [3, "відгуки"],
    [4, "відгуки"],
    [22, "відгуки"],
    [5, "відгуків"],
    [11, "відгуків"],
    [12, "відгуків"],
    [14, "відгуків"],
    [111, "відгуків"],
    [0, "відгуків"],
  ])("%i → %s", (n, expected) => {
    expect(pluralizeUk(n, forms[0], forms[1], forms[2])).toBe(expected);
  });
});
```

Create `tests/unit/product-display.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { SIZE_ORDER, COLOR_SWATCH_CLASSES, rankSizeValues } from "@/lib/product-display";

describe("product-display", () => {
  it("SIZE_ORDER is the canonical S→XXL ranking", () => {
    expect([...SIZE_ORDER]).toEqual(["S", "M", "L", "XL", "XXL"]);
  });

  it("rankSizeValues dedupes and ranks known sizes, appends extras in first-seen order", () => {
    expect(rankSizeValues(["XL", "S", "XL", "One size", "M"])).toEqual([
      "S",
      "M",
      "XL",
      "One size",
    ]);
  });

  it("rankSizeValues returns [] for empty input", () => {
    expect(rankSizeValues([])).toEqual([]);
  });

  it("swatch classes cover the seed colorways", () => {
    expect(Object.keys(COLOR_SWATCH_CLASSES)).toEqual(expect.arrayContaining(["Чорний", "Білий"]));
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/unit/product-display.test.ts tests/unit/format.test.ts`
Expected: FAIL (`Cannot find module '@/lib/product-display'`; `pluralizeUk` not exported).

- [ ] **Step 3: Create `src/lib/product-display.ts`**

```ts
/**
 * Shared product-display constants and helpers (TASK-037): single source for
 * the size ranking and colorway swatch classes that ProductCard,
 * QuickViewDialog, and the PDP all render.
 */

/** Canonical display order; any other Size value (e.g. "One size") is appended after, in first-seen order. */
export const SIZE_ORDER = ["S", "M", "L", "XL", "XXL"] as const;

export const COLOR_SWATCH_CLASSES: Record<string, string> = {
  Чорний: "bg-black border-border-strong",
  Білий: "bg-[#f5f5f5] border-border",
};

/** Dedupes size values and orders them S · M · L · XL · XXL, extras appended in first-seen order. */
export function rankSizeValues(values: string[]): string[] {
  const unique = Array.from(new Set(values));
  const ranked = SIZE_ORDER.filter((s) => unique.includes(s));
  const extras = unique.filter((v) => !(SIZE_ORDER as readonly string[]).includes(v));
  return [...ranked, ...extras];
}
```

- [ ] **Step 4: Add `pluralizeUk` to `src/lib/format.ts`**

Append:

```ts
/**
 * Ukrainian cardinal pluralization: 1 відгук / 2-4 відгуки / 5+ відгуків
 * (with the 11-14 exception). Hardcoded-UA interim until TASK-039 i18n.
 */
export function pluralizeUk(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(Math.trunc(n));
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
```

- [ ] **Step 5: Run the new tests**

Run: `npx vitest run tests/unit/product-display.test.ts tests/unit/format.test.ts`
Expected: PASS.

- [ ] **Step 6: Create `src/lib/safe-section.ts` and rewire the homepage**

Create `src/lib/safe-section.ts`:

```ts
/**
 * Fail-soft wrapper for non-critical server-component section queries: a
 * failed query degrades to its fallback (section renders empty/hidden)
 * instead of rejecting the whole page render. Extracted from the homepage
 * (which learned this the hard way — see the prod incident notes there) so
 * the PDP's sibling/companion/review queries share the exact behavior.
 */
export async function safeSection<T>(query: Promise<T>, fallback: T, label: string): Promise<T> {
  try {
    return await query;
  } catch (error) {
    console.error(`[safe-section] "${label}" query failed; rendering without it:`, error);
    return fallback;
  }
}
```

In `src/app/(shop)/page.tsx`: delete the local `async function safeSection…` (lines ~34-41), add `import { safeSection } from "@/lib/safe-section";`, and change the two call labels to `"home:new-arrivals"` and `"home:testimonials"`. **Keep the long explanatory comment block above the deleted function** — move it to sit above the `Promise.all` call so the incident context isn't lost.

- [ ] **Step 7: Deduplicate ProductCard/QuickViewDialog**

In `src/components/products/ProductCard.tsx`:

- Delete the local `export const SIZE_ORDER = …` (line 70) and `const COLOR_SWATCH_CLASSES = …` (lines 72-75).
- Add `import { SIZE_ORDER, COLOR_SWATCH_CLASSES, rankSizeValues } from "@/lib/product-display";`
- Add a compatibility re-export so existing importers keep working: `export { SIZE_ORDER } from "@/lib/product-display";`
- Rewrite `getSizeLabel` to use the helper:

```ts
function getSizeLabel(variants: ProductVariantOption[] | undefined): string | null {
  const sizeValues = variants?.filter((v) => v.name === "Size").map((v) => v.value) ?? [];
  if (sizeValues.length === 0) return null;
  return rankSizeValues(sizeValues).join(" · ");
}
```

In `src/components/products/QuickViewDialog.tsx`:

- Replace `import { SIZE_ORDER } from "./ProductCard";` with `import { SIZE_ORDER, COLOR_SWATCH_CLASSES } from "@/lib/product-display";`
- Delete its local `const COLOR_SWATCH_CLASSES = …` (lines 31-34).

Then run `grep -rn "SIZE_ORDER\|COLOR_SWATCH_CLASSES" src tests` and update any other importer to `@/lib/product-display`.

- [ ] **Step 8: Full unit pass (behavior-neutral refactor proof)**

Run: `npm run test:run` and `npm run typecheck`
Expected: all green — this refactor must not change any behavior.

- [ ] **Step 9: Commit**

```bash
git add src/lib tests/unit "src/app/(shop)/page.tsx" src/components/products
git commit -m "refactor(lib): shared safeSection, product-display helpers, pluralizeUk"
```

---

### Task 4: `/api/products` ids filter (TDD)

**Files:**

- Modify: `src/app/api/products/route.ts:53-102`
- Test: `tests/unit/products-api.test.ts`

**Interfaces:**

- Produces: `GET /api/products?ids=<id1,id2,…>` — max 12 ids honored, empty segments ignored, `isActive: true` always enforced, response shape unchanged (`{ data, pagination }` with `LIST_SELECT` fields). Consumed by Task 8 (RecentlyViewed fetch).

- [ ] **Step 1: Write the failing tests**

Append to `tests/unit/products-api.test.ts` (helpers `whereOf`, `createNextRequest`, `findMany` already exist at top of file):

```ts
describe("GET /api/products — ids filter (TASK-037 recently-viewed)", () => {
  it("filters by ids while still enforcing isActive", async () => {
    await GET(createNextRequest({ url: "/api/products", searchParams: { ids: "a1,b2" } }));
    expect(whereOf().id).toEqual({ in: ["a1", "b2"] });
    expect(whereOf().isActive).toBe(true);
  });

  it("caps ids at 12", async () => {
    const ids = Array.from({ length: 15 }, (_, i) => `id${i}`).join(",");
    await GET(createNextRequest({ url: "/api/products", searchParams: { ids } }));
    expect(whereOf().id.in).toHaveLength(12);
    expect(whereOf().id.in[0]).toBe("id0");
  });

  it("ignores empty/whitespace segments", async () => {
    await GET(createNextRequest({ url: "/api/products", searchParams: { ids: " a ,, b ," } }));
    expect(whereOf().id).toEqual({ in: ["a", "b"] });
  });

  it("an ids param with no usable segments leaves where.id unset", async () => {
    await GET(createNextRequest({ url: "/api/products", searchParams: { ids: " ,, " } }));
    expect(whereOf().id).toBeUndefined();
  });

  it("absent ids leaves where.id unset", async () => {
    await GET(createNextRequest({ url: "/api/products", searchParams: {} }));
    expect(whereOf().id).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/unit/products-api.test.ts`
Expected: the new describe FAILS (`where.id` undefined on the first three).

- [ ] **Step 3: Implement in the route**

In `src/app/api/products/route.ts`, after the `featured` block (line ~79) and before the variant-filters block, add:

```ts
// Explicit id list (recently-viewed): capped, blank-tolerant, still isActive-only.
const idsParam = searchParams.get("ids");
if (idsParam) {
  const ids = idsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);
  if (ids.length > 0) {
    where.id = { in: ids };
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/unit/products-api.test.ts`
Expected: PASS (all, including pre-existing).

- [ ] **Step 5: Commit**

```bash
git add src/app/api/products/route.ts tests/unit/products-api.test.ts
git commit -m "feat(api): /api/products ids filter for recently-viewed (cap 12, isActive enforced)"
```

---

### Task 5: Server data — sibling/companion queries + shared serialized types

**Files:**

- Modify: `src/types/index.ts` (add `StyleSibling`, `BundleCompanion`)
- Modify: `src/app/(shop)/products/[slug]/page.tsx` (queries + serialization)
- Modify: `src/app/(shop)/products/[slug]/product-detail-client.tsx:45-77` (extend `Product` interface + accept/ignore new props — UI unchanged until Task 10)

**Interfaces:**

- Consumes: `safeSection` (Task 3), `getSalesRanking(windowDays, take?)` from `@/lib/product-queries` (existing), `Product.styleGroup` (Task 2).
- Produces (exact types in `src/types/index.ts`, consumed by Tasks 7 and 10):

```ts
export interface StyleSibling {
  slug: string;
  name: string;
  colorValue: string | null;
}

export interface BundleCompanion {
  id: string;
  name: string;
  slug: string;
  price: string;
  comparePrice: string | null;
  /** Product-level stock — the maxStock for sizeless cart lines. */
  stock: number;
  image: { url: string; alt: string | null } | null;
  sizeVariants: { id: string; value: string; stock: number; price: string | null }[];
}
```

- Produces on the client `Product` interface: `styleGroup: string | null`, `colorValue: string | null` (this product's own colorway), `styleSiblings: StyleSibling[]`, `companions: BundleCompanion[]`; and each entry of `variants` now also carries `value: string`.

- [ ] **Step 1: Add the two interfaces to `src/types/index.ts`**

Append the exact `StyleSibling` / `BundleCompanion` interfaces from the block above, with a doc comment:

```ts
/**
 * PDP serialized shapes (TASK-037): Decimal prices arrive as strings, per the
 * "Serialized" convention documented at the top of this file.
 */
```

- [ ] **Step 2: Extend `getProduct` in `page.tsx`**

In `src/app/(shop)/products/[slug]/page.tsx`:

1. Add imports:

```ts
import { safeSection } from "@/lib/safe-section";
import { getSalesRanking } from "@/lib/product-queries";
import type { BundleCompanion, StyleSibling } from "@/types";
```

2. In the main `prisma.product.findUnique` select, add `styleGroup: true,` (top level) and add `value: true,` to the `variants.select` (the client's size buttons need the variant _value_; today only `name` is selected).

3. After the `if (!product) return null;` guard, add the two new fail-soft queries (before the existing related/reviews work):

```ts
// Colorway siblings (TASK-037): same styleGroup, other products, active.
const siblingRows = product.styleGroup
  ? await safeSection(
      prisma.product.findMany({
        where: {
          styleGroup: product.styleGroup,
          id: { not: product.id },
          isActive: true,
        },
        select: {
          slug: true,
          name: true,
          variants: { where: { name: "Color" }, select: { value: true }, take: 1 },
        },
      }),
      [],
      "pdp:style-siblings"
    )
  : [];

const styleSiblings: StyleSibling[] = siblingRows.map((s) => ({
  slug: s.slug,
  name: s.name,
  colorValue: s.variants[0]?.value ?? null,
}));

// Bundle companions (TASK-037): top sellers excluding this product; fill
// deterministically from same-category then any active (createdAt desc).
const companionSelect = {
  id: true,
  name: true,
  slug: true,
  price: true,
  comparePrice: true,
  stock: true,
  categoryId: true,
  images: { select: { url: true, alt: true }, orderBy: { position: "asc" as const }, take: 1 },
  variants: {
    where: { name: "Size" },
    select: { id: true, value: true, stock: true, price: true },
  },
};

const companions: BundleCompanion[] = await safeSection(
  (async () => {
    const rankedIds = (await getSalesRanking(90)).filter((id) => id !== product.id);
    const picked = new Map<string, Awaited<ReturnType<typeof fetchCompanions>>[number]>();

    async function fetchCompanions(ids: string[]) {
      if (ids.length === 0) return [];
      return prisma.product.findMany({
        where: { id: { in: ids }, isActive: true, stock: { gt: 0 } },
        select: companionSelect,
      });
    }

    const rankedRows = await fetchCompanions(rankedIds.slice(0, 6));
    const rowById = new Map(rankedRows.map((r) => [r.id, r]));
    for (const id of rankedIds) {
      const row = rowById.get(id);
      if (row && picked.size < 2) picked.set(id, row);
    }

    if (picked.size < 2) {
      const fill = await prisma.product.findMany({
        where: {
          isActive: true,
          stock: { gt: 0 },
          id: { notIn: [product.id, ...picked.keys()] },
        },
        select: companionSelect,
        orderBy: { createdAt: "desc" },
        take: 4,
      });
      // Same-category fill first, then the rest; Array.prototype.sort is
      // stable, so createdAt desc is preserved within each group.
      const preferred = fill.sort((a, b) => {
        const aSame = a.categoryId === product.category.id ? 0 : 1;
        const bSame = b.categoryId === product.category.id ? 0 : 1;
        return aSame - bSame;
      });
      for (const row of preferred) {
        if (picked.size >= 2) break;
        picked.set(row.id, row);
      }
    }

    return [...picked.values()].map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      price: c.price.toString(),
      comparePrice: c.comparePrice?.toString() ?? null,
      stock: c.stock,
      image: c.images[0] ?? null,
      sizeVariants: c.variants.map((v) => ({
        id: v.id,
        value: v.value,
        stock: v.stock,
        price: v.price?.toString() ?? null,
      })),
    }));
  })(),
  [],
  "pdp:companions"
);
```

4. Wrap the existing related-products and reviews queries in `safeSection` too (labels `"pdp:related"`, `"pdp:reviews"`, `"pdp:review-stats"`, `"pdp:review-distribution"`), with fallbacks `[]`, `[]`, `{ _avg: { rating: null }, _count: 0 }`, `[]` respectively. Keep their selects unchanged.

5. Extend the returned object:

```ts
return {
  ...product,
  price: product.price.toString(),
  comparePrice: product.comparePrice?.toString() ?? null,
  colorValue: product.variants.find((v) => v.name === "Color")?.value ?? null,
  styleSiblings,
  companions,
  variants: product.variants.map((v) => ({
    /* existing mapping, now including value: v.value */
  })),
  // …rest unchanged
};
```

(Note: `product.variants` here still contains both Size and Color rows — the existing mapping keeps them all; the client filters by `name`.)

- [ ] **Step 3: Extend the client `Product` interface (no UI change yet)**

In `product-detail-client.tsx`:

- `ProductVariant` interface gains `value: string;`
- `Product` interface gains:

```ts
  styleGroup?: string | null;
  colorValue: string | null;
  styleSiblings: StyleSibling[];
  companions: BundleCompanion[];
```

- Add `import type { StyleSibling, BundleCompanion } from "@/types";` (merge into the existing `@/types` import).

- [ ] **Step 4: Verify**

Run: `npm run typecheck` and `npm run test:run` — expected PASS (this task is data-plumbing only; the UI consumes it in Tasks 7/10, and Task 12's colorway E2E test verifies the sibling data end-to-end in a real browser).

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts "src/app/(shop)/products/[slug]"
git commit -m "feat(pdp): styleGroup siblings + bundle companions server data (fail-soft)"
```

---

### Task 6: `recommendSize` (TDD) + `SizePicker` component

**Files:**

- Create: `src/lib/size-recommendation.ts`
- Create: `src/components/products/SizePicker.tsx`
- Modify: `src/components/products/index.ts` (export)
- Test: `tests/unit/size-recommendation.test.ts` (new), `tests/unit/size-picker.test.tsx` (new)

**Interfaces:**

- Produces: `recommendSize(heightCm: number, weightKg: number): "S" | "M" | "L" | "XL" | "XXL"` from `@/lib/size-recommendation`; `<SizePicker />` (no props). Consumed by Task 10 (shell renders `<SizePicker />`).

- [ ] **Step 1: Write the failing formula tests**

Create `tests/unit/size-recommendation.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { recommendSize } from "@/lib/size-recommendation";

// Placeholder formula per spec/AC (client size charts pending; TASK-045 replaces):
// XXL h≥190‖w≥95 · XL h≥184‖w≥85 · L h≥176‖w≥72 · M h≥168‖w≥60 · else S
describe("recommendSize", () => {
  it.each([
    [190, 50, "XXL"],
    [150, 95, "XXL"],
    [189, 94, "XL"],
    [184, 40, "XL"],
    [150, 85, "XL"],
    [183, 84, "L"],
    [176, 40, "L"],
    [150, 72, "L"],
    [175, 71, "M"],
    [168, 40, "M"],
    [150, 60, "M"],
    [167, 59, "S"],
    [100, 30, "S"],
    [180, 75, "L"],
  ] as const)("h=%i w=%i → %s", (h, w, expected) => {
    expect(recommendSize(h, w)).toBe(expected);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/unit/size-recommendation.test.ts`
Expected: FAIL (module missing).

- [ ] **Step 3: Implement `src/lib/size-recommendation.ts`**

```ts
export type RecommendedSize = "S" | "M" | "L" | "XL" | "XXL";

/**
 * Placeholder height/weight size formula from the Mirox Product.dc.html
 * reference — thresholds are the client demo's, NOT real garment size charts
 * (those are still owed via TASK-056; TASK-045 replaces this with a real,
 * chart-driven assistant). Kept as a pure function so the AC's exact bands
 * stay unit-tested.
 */
export function recommendSize(heightCm: number, weightKg: number): RecommendedSize {
  if (heightCm >= 190 || weightKg >= 95) return "XXL";
  if (heightCm >= 184 || weightKg >= 85) return "XL";
  if (heightCm >= 176 || weightKg >= 72) return "L";
  if (heightCm >= 168 || weightKg >= 60) return "M";
  return "S";
}
```

- [ ] **Step 4: Run the formula tests**

Run: `npx vitest run tests/unit/size-recommendation.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing component test**

Create `tests/unit/size-picker.test.tsx` (follow the render/query style of `tests/unit/quick-view-dialog.test.tsx`):

```tsx
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SizePicker } from "@/components/products/SizePicker";

describe("SizePicker", () => {
  it("renders defaults 180/75 → L with Ukrainian copy", () => {
    render(<SizePicker />);
    expect(screen.getByRole("heading", { name: "Підбір розміру" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Зріст/)).toHaveValue(180);
    expect(screen.getByLabelText(/Вага/)).toHaveValue(75);
    expect(screen.getByTestId("recommended-size")).toHaveTextContent("L");
  });

  it("recomputes on input change (192 → XXL)", () => {
    render(<SizePicker />);
    fireEvent.change(screen.getByLabelText(/Зріст/), { target: { value: "192" } });
    expect(screen.getByTestId("recommended-size")).toHaveTextContent("XXL");
  });

  it("falls back to defaults on cleared input", () => {
    render(<SizePicker />);
    fireEvent.change(screen.getByLabelText(/Зріст/), { target: { value: "" } });
    expect(screen.getByTestId("recommended-size")).toHaveTextContent("L");
  });
});
```

Run: `npx vitest run tests/unit/size-picker.test.tsx` — expected FAIL (component missing).

- [ ] **Step 6: Implement `src/components/products/SizePicker.tsx`**

```tsx
"use client";

import { useState } from "react";
import { recommendSize } from "@/lib/size-recommendation";

const DEFAULT_HEIGHT = 180;
const DEFAULT_WEIGHT = 75;

/**
 * «Підбір розміру» card (Mirox Product.dc.html): height/weight inputs → a
 * recommended size via the placeholder formula in @/lib/size-recommendation.
 * Deliberately uncoupled from the buy panel — it recommends, never selects
 * (TASK-045 replaces the logic with real size charts).
 */
export function SizePicker() {
  const [height, setHeight] = useState<string>(String(DEFAULT_HEIGHT));
  const [weight, setWeight] = useState<string>(String(DEFAULT_WEIGHT));

  const h = Number(height) || DEFAULT_HEIGHT;
  const w = Number(weight) || DEFAULT_WEIGHT;
  const recommended = recommendSize(h, w);

  const inputClasses =
    "rounded-[10px] border border-border-strong bg-background px-3.5 py-3 text-sm font-bold text-foreground focus:outline-none focus:border-white";

  return (
    <div className="bg-card border-border rounded-[20px] border p-6 sm:p-8">
      <h2 className="text-[22px] font-extrabold">Підбір розміру</h2>
      <p className="text-muted-foreground mt-2 mb-6 text-[13.5px] leading-normal">
        Вкажіть свій зріст і вагу, ми підберемо ідеальний розмір
      </p>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-3.5">
          <label className="text-muted-foreground flex flex-col gap-1.5 text-[12.5px] font-semibold">
            Зріст (см)
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className={inputClasses}
            />
          </label>
          <label className="text-muted-foreground flex flex-col gap-1.5 text-[12.5px] font-semibold">
            Вага (кг)
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className={inputClasses}
            />
          </label>
        </div>
        <div className="bg-background border-border rounded-[14px] border p-5">
          <div className="text-muted-foreground text-[12.5px] font-semibold">Ваш розмір:</div>
          <div data-testid="recommended-size" className="my-1 text-[44px] font-extrabold">
            {recommended}
          </div>
          <div className="text-muted-foreground mb-1.5 text-xs font-semibold">Рекомендації:</div>
          <ul className="text-foreground/80 list-disc pl-4 text-[12.5px] leading-relaxed">
            <li>Вільна посадка</li>
            <li>Комфорт у русі</li>
            <li>Ідеальний вибір</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
```

Add to `src/components/products/index.ts`: `export { SizePicker } from "./SizePicker";`

- [ ] **Step 7: Run tests**

Run: `npx vitest run tests/unit/size-picker.test.tsx tests/unit/size-recommendation.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/lib/size-recommendation.ts src/components/products tests/unit/size-recommendation.test.ts tests/unit/size-picker.test.tsx
git commit -m "feat(pdp): SizePicker with unit-tested placeholder formula"
```

---

### Task 7: `computeBundleTotals` (TDD) + `BoughtTogether` component

**Files:**

- Create: `src/lib/bundle-utils.ts`
- Create: `src/components/products/BoughtTogether.tsx`
- Modify: `src/components/products/index.ts`
- Test: `tests/unit/bundle-utils.test.ts` (new), `tests/unit/bought-together.test.tsx` (new)

**Interfaces:**

- Consumes: `BundleCompanion` from `@/types` (Task 5), `rankSizeValues` (Task 3), cart store `addItem`/`openCart`, `trackAddToCart` from `@/lib/analytics`, `formatPrice`, `ProductImage`.
- Produces:
  - `computeBundleTotals(items: { price: string; comparePrice: string | null }[]): { total: number; compareTotal: number; showStrike: boolean }` from `@/lib/bundle-utils`
  - `<BoughtTogether current={BundleCompanion} companions={BundleCompanion[]} preferredSizeValue={string | null} />` — renders nothing when `companions.length < 2`. Consumed by Task 10.

- [ ] **Step 1: Write failing totals tests**

Create `tests/unit/bundle-utils.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { computeBundleTotals } from "@/lib/bundle-utils";

describe("computeBundleTotals", () => {
  it("no comparePrices → equal totals, no strike", () => {
    const r = computeBundleTotals([
      { price: "1290", comparePrice: null },
      { price: "590", comparePrice: null },
    ]);
    expect(r).toEqual({ total: 1880, compareTotal: 1880, showStrike: false });
  });

  it("one genuine discount → strike with comparePrice folded in", () => {
    const r = computeBundleTotals([
      { price: "1290", comparePrice: null },
      { price: "590", comparePrice: "690" },
      { price: "490", comparePrice: null },
    ]);
    expect(r).toEqual({ total: 2370, compareTotal: 2470, showStrike: true });
  });

  it("bad data (comparePrice below price) never produces a strike", () => {
    const r = computeBundleTotals([{ price: "1290", comparePrice: "990" }]);
    expect(r.showStrike).toBe(false);
  });

  it("empty input → zeros, no strike", () => {
    expect(computeBundleTotals([])).toEqual({ total: 0, compareTotal: 0, showStrike: false });
  });
});
```

Run: `npx vitest run tests/unit/bundle-utils.test.ts` — expected FAIL.

- [ ] **Step 2: Implement `src/lib/bundle-utils.ts`**

```ts
/**
 * Honest bundle math (spec §2 #3): the struck-through figure is the sum of
 * genuine comparePrices (falling back to price), shown ONLY when it exceeds
 * the real sum. Checkout recomputes prices from the DB, so this module must
 * never invent a discount the server won't honor.
 */
export interface BundlePricedItem {
  price: string;
  comparePrice: string | null;
}

export function computeBundleTotals(items: BundlePricedItem[]): {
  total: number;
  compareTotal: number;
  showStrike: boolean;
} {
  const total = items.reduce((sum, i) => sum + parseFloat(i.price), 0);
  const compareTotal = items.reduce((sum, i) => sum + parseFloat(i.comparePrice ?? i.price), 0);
  return { total, compareTotal, showStrike: compareTotal > total };
}
```

Run: `npx vitest run tests/unit/bundle-utils.test.ts` — expected PASS.

- [ ] **Step 3: Write failing component tests**

Create `tests/unit/bought-together.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BoughtTogether } from "@/components/products/BoughtTogether";
import { useCartStore } from "@/stores/cart.store";
import type { BundleCompanion } from "@/types";

function companion(over: Partial<BundleCompanion> & { id: string }): BundleCompanion {
  return {
    name: `Product ${over.id}`,
    slug: `product-${over.id}`,
    price: "590",
    comparePrice: null,
    stock: 10,
    image: null,
    sizeVariants: [
      { id: `${over.id}-s`, value: "S", stock: 5, price: null },
      { id: `${over.id}-l`, value: "L", stock: 5, price: null },
    ],
    ...over,
  };
}

const current = companion({ id: "cur", name: "Худі Mirox Basic", price: "1290" });

beforeEach(() => {
  useCartStore.setState({ items: [], isOpen: false });
});

describe("BoughtTogether", () => {
  it("renders nothing with fewer than 2 companions", () => {
    const { container } = render(
      <BoughtTogether
        current={current}
        companions={[companion({ id: "a" })]}
        preferredSizeValue="L"
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("preselects companions to the preferred size and adds 3 sized lines", () => {
    render(
      <BoughtTogether
        current={current}
        companions={[companion({ id: "a" }), companion({ id: "b" })]}
        preferredSizeValue="L"
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "ДОДАТИ КОМПЛЕКТ У КОШИК" }));
    const items = useCartStore.getState().items;
    expect(items).toHaveLength(3);
    expect(items.every((i) => i.variantId?.endsWith("-l"))).toBe(true);
    expect(items[0].name).toBe("Худі Mirox Basic — L");
  });

  it("shows the struck sum only when comparePrices make it genuinely higher", () => {
    render(
      <BoughtTogether
        current={current}
        companions={[companion({ id: "a", comparePrice: "690" }), companion({ id: "b" })]}
        preferredSizeValue="S"
      />
    );
    // total 1290+590+590=2470; compare 1290+690+590=2570. formatPrice emits
    // NON-BREAKING spaces (uk-UA thousands + before грн) — assert via regex.
    expect(screen.getByText(/2[\s\u00A0]570[\s\u00A0]грн/)).toHaveClass("line-through");
    expect(screen.getByTestId("bundle-total")).toHaveTextContent(/2[\s\u00A0]470/);
  });
});
```

Run: `npx vitest run tests/unit/bought-together.test.tsx` — expected FAIL (component missing).

- [ ] **Step 4: Implement `src/components/products/BoughtTogether.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useCartStore } from "@/stores/cart.store";
import { trackAddToCart } from "@/lib/analytics";
import { formatPrice } from "@/lib/format";
import { computeBundleTotals } from "@/lib/bundle-utils";
import { rankSizeValues } from "@/lib/product-display";
import { IMAGE_SIZES } from "@/lib/image-utils";
import { cn } from "@/lib/utils";
import { ProductImage } from "./ProductImage";
import type { BundleCompanion } from "@/types";

interface BoughtTogetherProps {
  current: BundleCompanion;
  companions: BundleCompanion[];
  /** The size selected in the buy panel; companions preselect to it when available. */
  preferredSizeValue: string | null;
}

type SelectionMap = Record<string, string | null>; // productId → variantId

function pickVariantId(product: BundleCompanion, preferred: string | null): string | null {
  if (product.sizeVariants.length === 0) return null; // sizeless product — added product-level
  const inStock = product.sizeVariants.filter((v) => v.stock > 0);
  if (inStock.length === 0) return null; // unfulfillable
  const preferredMatch = preferred ? inStock.find((v) => v.value === preferred) : undefined;
  if (preferredMatch) return preferredMatch.id;
  const rankedValues = rankSizeValues(inStock.map((v) => v.value));
  return inStock.find((v) => v.value === rankedValues[0])?.id ?? null;
}

function deriveSelections(companions: BundleCompanion[], preferred: string | null): SelectionMap {
  return Object.fromEntries(companions.map((c) => [c.id, pickVariantId(c, preferred)]));
}

/**
 * «Купують разом» (Mirox Product.dc.html): current product + 2 top-selling
 * companions. Deviations from the reference are deliberate and spec-approved
 * (§7): per-companion size chips (fulfillment needs a real variantId per
 * line) and a strikethrough only when constituent comparePrices genuinely
 * exceed the sum — checkout recomputes prices, so no invented bundle discount.
 */
export function BoughtTogether({ current, companions, preferredSizeValue }: BoughtTogetherProps) {
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.openCart);

  const [selections, setSelections] = useState<SelectionMap>(() =>
    deriveSelections(companions, preferredSizeValue)
  );

  // Follow the buy panel's size choice: re-derive all companion chips when it
  // changes (predictable over preserving manual edits — deliberate).
  useEffect(() => {
    setSelections(deriveSelections(companions, preferredSizeValue));
  }, [companions, preferredSizeValue]);

  if (companions.length < 2) return null;

  const currentVariant = preferredSizeValue
    ? (current.sizeVariants.find((v) => v.value === preferredSizeValue) ?? null)
    : null;
  const currentResolved = current.sizeVariants.length === 0 || currentVariant !== null;

  const lines = [
    {
      product: current,
      variant: currentVariant,
    },
    ...companions.map((c) => ({
      product: c,
      variant: c.sizeVariants.find((v) => v.id === selections[c.id]) ?? null,
    })),
  ];

  const allResolved =
    currentResolved &&
    companions.every((c) => c.sizeVariants.length === 0 || selections[c.id] !== null);

  const totals = computeBundleTotals(
    lines.map(({ product, variant }) => ({
      price: variant?.price ?? product.price,
      comparePrice: product.comparePrice,
    }))
  );

  const handleAddBundle = () => {
    if (!allResolved) return;
    for (const { product, variant } of lines) {
      const price = parseFloat(variant?.price ?? product.price);
      const name = variant ? `${product.name} — ${variant.value}` : product.name;
      addItem({
        productId: product.id,
        variantId: variant?.id,
        name,
        price,
        image: product.image?.url,
        maxStock: variant ? variant.stock : product.stock,
      });
      trackAddToCart({
        item_id: product.id,
        item_name: name,
        item_variant: variant?.value,
        price,
        quantity: 1,
      });
    }
    openCart();
  };

  return (
    <div className="bg-card border-border rounded-[20px] border p-6 sm:p-8">
      <h2 className="mb-6 text-[22px] font-extrabold">Купують разом</h2>
      <div className="mb-6 flex items-start gap-3">
        {lines.map(({ product, variant }, index) => (
          <div key={product.id} className="contents">
            {index > 0 && (
              <Plus className="text-muted-foreground mt-16 h-5 w-5 shrink-0" aria-hidden />
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-2.5">
              <div className="border-border relative h-[150px] overflow-hidden rounded-[14px] border">
                <ProductImage
                  src={product.image?.url}
                  alt={product.image?.alt || product.name}
                  sizes={IMAGE_SIZES.thumbnail}
                />
              </div>
              <div className="truncate text-[13px] font-bold">{product.name}</div>
              <div className="text-[13.5px] font-extrabold">
                {formatPrice(variant?.price ?? product.price)}
              </div>
              {index === 0
                ? variant && (
                    <div className="text-muted-foreground text-xs font-semibold">
                      Розмір: <span className="text-foreground">{variant.value}</span>
                    </div>
                  )
                : product.sizeVariants.length > 0 && (
                    <div
                      className="flex flex-wrap gap-1"
                      role="group"
                      aria-label={`Розмір: ${product.name}`}
                    >
                      {product.sizeVariants.map((v) => {
                        const active = selections[product.id] === v.id;
                        const out = v.stock <= 0;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            disabled={out}
                            onClick={() =>
                              setSelections((prev) => ({ ...prev, [product.id]: v.id }))
                            }
                            className={cn(
                              "min-w-8 rounded-md border px-1.5 py-1 text-[11px] font-bold transition-colors",
                              active
                                ? "border-white bg-white text-black"
                                : "border-border-strong text-foreground hover:border-white",
                              out && "cursor-not-allowed opacity-40"
                            )}
                          >
                            {v.value}
                          </button>
                        );
                      })}
                    </div>
                  )}
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="text-muted-foreground text-[13.5px]">
          Загальна ціна:{" "}
          {totals.showStrike && (
            <span className="line-through">{formatPrice(totals.compareTotal)}</span>
          )}{" "}
          <span
            data-testid="bundle-total"
            className="text-foreground ml-1.5 text-base font-extrabold"
          >
            {formatPrice(totals.total)}
          </span>
        </div>
        <button
          type="button"
          onClick={handleAddBundle}
          disabled={!allResolved}
          className="rounded-[10px] bg-white px-6 py-3.5 text-[13px] font-extrabold tracking-[0.05em] text-black transition-colors hover:bg-[#e5e5e5] disabled:cursor-not-allowed disabled:opacity-50"
        >
          ДОДАТИ КОМПЛЕКТ У КОШИК
        </button>
      </div>
    </div>
  );
}
```

Add to `src/components/products/index.ts`: `export { BoughtTogether } from "./BoughtTogether";`

- [ ] **Step 5: Run component tests**

Run: `npx vitest run tests/unit/bought-together.test.tsx tests/unit/bundle-utils.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/bundle-utils.ts src/components/products src/types/index.ts tests/unit/bundle-utils.test.ts tests/unit/bought-together.test.tsx
git commit -m "feat(pdp): BoughtTogether with honest comparePrice sums and per-companion size chips"
```

---

### Task 8: `RecentlyViewed` component

**Files:**

- Create: `src/components/products/RecentlyViewed.tsx`
- Modify: `src/components/products/index.ts`
- Test: `tests/unit/recently-viewed.test.tsx` (new)

**Interfaces:**

- Consumes: `/api/products?ids=…` (Task 4), `ProductCard` (existing — its props accept the API's `LIST_SELECT` product shape).
- Produces: `<RecentlyViewed currentProductId={string} />`; exports `readRecentlyViewed(): string[]` and `recordRecentlyViewed(id: string): void` for tests. localStorage key: `"mirox:recently-viewed"`, newest-first, capped at 8. Consumed by Task 10.

- [ ] **Step 1: Write failing tests**

Create `tests/unit/recently-viewed.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import {
  RecentlyViewed,
  readRecentlyViewed,
  recordRecentlyViewed,
} from "@/components/products/RecentlyViewed";

const originalFetch = global.fetch;

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  global.fetch = originalFetch;
});

describe("recently-viewed storage", () => {
  it("records newest-first, dedupes, caps at 8", () => {
    for (let i = 1; i <= 10; i++) recordRecentlyViewed(`p${i}`);
    recordRecentlyViewed("p9");
    const ids = readRecentlyViewed();
    expect(ids).toHaveLength(8);
    expect(ids[0]).toBe("p9");
    expect(ids).not.toContain("p1");
  });

  it("survives corrupted storage", () => {
    localStorage.setItem("mirox:recently-viewed", "{not json");
    expect(readRecentlyViewed()).toEqual([]);
  });
});

describe("<RecentlyViewed />", () => {
  it("records the current product and renders nothing with no other history", () => {
    global.fetch = vi.fn();
    const { container } = render(<RecentlyViewed currentProductId="cur" />);
    expect(readRecentlyViewed()).toEqual(["cur"]);
    expect(container).toBeEmptyDOMElement();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("fetches other recorded ids and renders the section", async () => {
    recordRecentlyViewed("other1");
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          {
            id: "other1",
            name: "Футболка Mirox",
            slug: "futbolka-mirox",
            price: "590",
            comparePrice: null,
            stock: 10,
            images: [],
            variants: [],
          },
        ],
      }),
    });
    render(<RecentlyViewed currentProductId="cur" />);
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Ви нещодавно переглянули" })).toBeInTheDocument()
    );
    expect(screen.getByText("Футболка Mirox")).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith("/api/products?ids=other1&limit=12");
  });

  it("renders nothing when the fetch fails", async () => {
    recordRecentlyViewed("other1");
    global.fetch = vi.fn().mockRejectedValue(new Error("network"));
    const { container } = render(<RecentlyViewed currentProductId="cur" />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
```

Run: `npx vitest run tests/unit/recently-viewed.test.tsx` — expected FAIL.

- [ ] **Step 2: Implement `src/components/products/RecentlyViewed.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "./ProductCard";

const STORAGE_KEY = "mirox:recently-viewed";
const MAX_ENTRIES = 8;

/** Product shape as returned by /api/products (LIST_SELECT) — passed through to ProductCard. */
interface RecentProduct {
  id: string;
  name: string;
  slug: string;
  shortDesc?: string | null;
  price: string;
  comparePrice?: string | null;
  stock: number;
  isFeatured?: boolean;
  createdAt?: string;
  category?: { name: string; slug: string };
  images: { url: string; alt?: string | null }[];
  variants?: { name: string; value: string }[];
}

export function readRecentlyViewed(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function recordRecentlyViewed(id: string): void {
  try {
    const next = [id, ...readRecentlyViewed().filter((v) => v !== id)].slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable (private mode/quota) — the section just won't build history.
  }
}

/**
 * «Ви нещодавно переглянули» — pure client section (nothing server-rendered,
 * so no hydration risk): records the current PDP into localStorage on mount,
 * then fetches the OTHER recorded products fresh from /api/products?ids=…
 * (isActive enforced server-side, so dead history self-heals). Any failure
 * renders nothing — the section is never load-bearing.
 */
export function RecentlyViewed({ currentProductId }: { currentProductId: string }) {
  const [products, setProducts] = useState<RecentProduct[]>([]);

  useEffect(() => {
    const previous = readRecentlyViewed().filter((id) => id !== currentProductId);
    recordRecentlyViewed(currentProductId);
    if (previous.length === 0) return;

    let cancelled = false;
    fetch(`/api/products?ids=${previous.join(",")}&limit=12`)
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        if (cancelled || !body?.data) return;
        // Preserve recency order — the API returns DB order.
        const byId = new Map((body.data as RecentProduct[]).map((p) => [p.id, p]));
        setProducts(previous.map((id) => byId.get(id)).filter((p): p is RecentProduct => !!p));
      })
      .catch(() => {
        // Fail-soft: section stays hidden.
      });
    return () => {
      cancelled = true;
    };
  }, [currentProductId]);

  if (products.length === 0) return null;

  return (
    <section aria-label="Ви нещодавно переглянули" className="mt-16">
      <h2 className="mb-7 text-[28px] font-extrabold tracking-[-0.02em]">
        Ви нещодавно переглянули
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
```

Add to `src/components/products/index.ts`: `export { RecentlyViewed } from "./RecentlyViewed";`

- [ ] **Step 3: Run tests**

Run: `npx vitest run tests/unit/recently-viewed.test.tsx`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/products tests/unit/recently-viewed.test.tsx
git commit -m "feat(pdp): RecentlyViewed localStorage section via /api/products?ids="
```

---

### Task 9: `ProductGallery` component

**Files:**

- Create: `src/components/products/ProductGallery.tsx`
- Modify: `src/components/products/index.ts`
- Test: `tests/unit/product-gallery.test.tsx` (new)

**Interfaces:**

- Consumes: `ProductImage` (existing), `IMAGE_SIZES` from `@/lib/image-utils`.
- Produces: `<ProductGallery images={{ url: string; alt: string | null }[]} productName={string} />`. Desktop (≥ lg): 96px vertical thumb rail + clamp-height main photo. Mobile (< lg): scroll-snap swipe track + dots pager. Consumed by Task 10.

- [ ] **Step 1: Write failing tests**

Create `tests/unit/product-gallery.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProductGallery } from "@/components/products/ProductGallery";

const images = [
  { url: "/images/products/a.png", alt: "Фото 1" },
  { url: "/images/products/b.png", alt: null },
  { url: "/images/products/c.png", alt: null },
];

describe("ProductGallery", () => {
  it("renders a thumb per image and marks the first active", () => {
    render(<ProductGallery images={images} productName="Худі Mirox Basic" />);
    const thumbs = screen.getAllByRole("button", { name: /Фото \d із \d/ });
    expect(thumbs).toHaveLength(3);
    expect(thumbs[0]).toHaveAttribute("aria-current", "true");
  });

  it("thumb click switches the active image", () => {
    render(<ProductGallery images={images} productName="Худі Mirox Basic" />);
    const thumbs = screen.getAllByRole("button", { name: /Фото \d із \d/ });
    fireEvent.click(thumbs[2]);
    expect(thumbs[2]).toHaveAttribute("aria-current", "true");
    expect(thumbs[0]).toHaveAttribute("aria-current", "false");
  });

  it("renders mobile dots for multi-image products", () => {
    render(<ProductGallery images={images} productName="Худі Mirox Basic" />);
    expect(screen.getAllByRole("button", { name: /Перейти до фото \d/ })).toHaveLength(3);
  });

  it("zero images → single branded fallback, no thumbs or dots", () => {
    render(<ProductGallery images={[]} productName="Худі Mirox Basic" />);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.getAllByTestId("product-image-fallback").length).toBeGreaterThan(0);
  });
});
```

Run: `npx vitest run tests/unit/product-gallery.test.tsx` — expected FAIL.

- [ ] **Step 2: Implement `src/components/products/ProductGallery.tsx`**

```tsx
"use client";

import { useRef, useState } from "react";
import { IMAGE_SIZES } from "@/lib/image-utils";
import { cn } from "@/lib/utils";
import { ProductImage } from "./ProductImage";

interface ProductGalleryProps {
  images: { url: string; alt: string | null }[];
  productName: string;
}

/**
 * PDP gallery (Mirox Product.dc.html): ≥lg — 96px vertical thumbnail rail +
 * main photo at clamp(420px, 100vh−190px, 620px); <lg — full-width
 * scroll-snap swipe track with the reference's dots pager (active dot = 18px
 * bar). One shared activeIndex: thumb clicks drive the desktop main image,
 * scroll position drives the dots. Real swipe behavior is only verifiable in
 * a browser (visual gate) — jsdom asserts state/aria wiring.
 */
export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const hasImages = images.length > 0;
  const active = images[activeIndex] ?? images[0];

  const handleTrackScroll = () => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    const index = Math.round(track.scrollLeft / track.clientWidth);
    if (index !== activeIndex && index >= 0 && index < images.length) setActiveIndex(index);
  };

  const scrollToSlide = (index: number) => {
    setActiveIndex(index);
    trackRef.current?.scrollTo({
      left: index * (trackRef.current?.clientWidth ?? 0),
      behavior: "smooth",
    });
  };

  if (!hasImages) {
    return (
      <div className="border-border relative h-[400px] overflow-hidden rounded-[20px] border lg:h-[clamp(420px,calc(100vh-190px),620px)]">
        <ProductImage alt={productName} sizes={IMAGE_SIZES.productDetail} />
      </div>
    );
  }

  return (
    <div className="min-w-0">
      {/* Mobile: swipe track + dots */}
      <div className="lg:hidden">
        <div
          ref={trackRef}
          onScroll={handleTrackScroll}
          className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label={`Фотографії: ${productName}`}
        >
          {images.map((image, index) => (
            <div
              key={`${image.url}-${index}`}
              className="relative h-[400px] w-full shrink-0 snap-center"
            >
              <ProductImage
                src={image.url}
                alt={image.alt || `${productName} — фото ${index + 1}`}
                sizes="100vw"
              />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <div className="flex justify-center gap-1.5 py-3">
            {images.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Перейти до фото ${index + 1}`}
                onClick={() => scrollToSlide(index)}
                className={cn(
                  "h-1 rounded-full transition-all",
                  index === activeIndex ? "w-[18px] bg-white" : "w-1 bg-[#404040]"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop: thumb rail + main image (the rail is the reference's left column;
          the parent grid in the shell places [rail | main] via grid-cols). */}
      <div className="hidden gap-6 lg:grid lg:grid-cols-[96px_minmax(0,1fr)]">
        <div className="flex flex-col gap-3">
          {images.map((image, index) => (
            <button
              key={`${image.url}-${index}`}
              type="button"
              aria-label={`Фото ${index + 1} із ${images.length}`}
              aria-current={index === activeIndex ? "true" : "false"}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "relative h-24 w-24 overflow-hidden rounded-xl border transition-colors",
                index === activeIndex
                  ? "border-border-strong"
                  : "border-border hover:border-border-strong"
              )}
            >
              <ProductImage
                src={image.url}
                alt={image.alt || `${productName} — мініатюра ${index + 1}`}
                sizes={IMAGE_SIZES.thumbnail}
              />
            </button>
          ))}
        </div>
        <div className="border-border relative h-[clamp(420px,calc(100vh-190px),620px)] overflow-hidden rounded-[20px] border">
          <ProductImage
            src={active?.url}
            alt={active?.alt || productName}
            sizes={IMAGE_SIZES.productDetail}
            className="object-contain"
          />
        </div>
      </div>
    </div>
  );
}
```

Note: thumbs also render inside the mobile-hidden desktop block — the test's `getAllByRole` finds them regardless (jsdom applies no media queries). The active-thumb border follows the reference (`#333` = `border-border-strong` vs `#1a1a1a` = `border-border`); the visual gate arbitrates if it reads too subtle.

Add to `src/components/products/index.ts`: `export { ProductGallery } from "./ProductGallery";`

- [ ] **Step 3: Run tests**

Run: `npx vitest run tests/unit/product-gallery.test.tsx`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/products tests/unit/product-gallery.test.tsx
git commit -m "feat(pdp): ProductGallery — desktop thumb rail, mobile snap track with dots"
```

---

### Task 10: PDP shell + buy panel rebuild

The big one: rewrite `product-detail-client.tsx` as the Mirox composition; restyle `SocialShareButtons` strings; update the loading skeleton; add the `data-hydrated` E2E signal; fix the BACKLOG'd cart-line naming bug.

**Files:**

- Rewrite: `src/app/(shop)/products/[slug]/product-detail-client.tsx`
- Modify: `src/app/(shop)/products/[slug]/page.tsx:201-206` (breadcrumb JSON-LD)
- Modify: `src/components/products/SocialShareButtons.tsx:74-99` (UA strings)
- Modify: `src/app/(shop)/products/[slug]/loading.tsx` (skeleton matches new layout)
- Test: `tests/unit/product-detail-client.test.tsx` (new)

**Interfaces:**

- Consumes: `ProductGallery` (Task 9), `SizePicker` (Task 6), `BoughtTogether` (Task 7), `RecentlyViewed` (Task 8), `SIZE_ORDER`/`COLOR_SWATCH_CLASSES`/`rankSizeValues` (Task 3), `pluralizeUk` (Task 3), extended `Product` (Task 5), `StarRating` from `@/components/reviews`, cart store, `formatPrice`, `trackViewItem`/`trackAddToCart`.
- Produces: the shipped PDP. Root wrapper carries `data-hydrated="true"` after mount (consumed by Task 12 E2E). Cart lines named `${product.name} — ${size.value}`.

- [ ] **Step 1: Write the failing behavior tests**

Create `tests/unit/product-detail-client.test.tsx` (mock module pattern per `quick-view-dialog.test.tsx`; `next/navigation` needs a router mock):

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  ProductDetailClient,
  type Product,
} from "@/app/(shop)/products/[slug]/product-detail-client";
import { useCartStore } from "@/stores/cart.store";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));
// ReviewSection pulls next-auth session — stub the whole reviews barrel.
vi.mock("@/components/reviews", () => ({
  ReviewSection: () => <div data-testid="review-section" />,
  StarRating: ({ value }: { value: number }) => <div data-testid="stars">{value}</div>,
}));

function makeProduct(over: Partial<Product> = {}): Product {
  return {
    id: "p1",
    name: "Худі Mirox Basic",
    slug: "hudi-mirox-basic",
    description: "Опис товару",
    shortDesc: null,
    price: "1290",
    comparePrice: null,
    stock: 42,
    sku: "MRX-001",
    isFeatured: false,
    category: { id: "c1", name: "Худі", slug: "hudi" },
    images: [{ id: "i1", url: "/images/products/a.png", alt: null }],
    variants: [
      {
        id: "v-s",
        name: "Size",
        value: "S",
        sku: "MRX-001-S",
        price: "1290",
        stock: 3,
        options: {},
      },
      {
        id: "v-l",
        name: "Size",
        value: "L",
        sku: "MRX-001-L",
        price: "1290",
        stock: 0,
        options: {},
      },
      {
        id: "v-col",
        name: "Color",
        value: "Чорний",
        sku: "MRX-001-C",
        price: "1290",
        stock: 30,
        options: {},
      },
    ],
    colorValue: "Чорний",
    styleSiblings: [{ slug: "hudi-mirox-white", name: "Худі Mirox White", colorValue: "Білий" }],
    companions: [],
    relatedProducts: [],
    reviews: [],
    averageRating: 4.5,
    totalReviews: 12,
    ratingDistribution: [],
    ...over,
  };
}

beforeEach(() => {
  useCartStore.setState({ items: [], isOpen: false });
  push.mockClear();
});

describe("ProductDetailClient (TASK-037)", () => {
  it("preselects the first in-stock size and renders UA chrome", () => {
    render(<ProductDetailClient product={makeProduct()} />);
    expect(screen.getByRole("link", { name: "Головна" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Каталог" })).toBeInTheDocument();
    const sizeS = screen.getByRole("button", { name: "S" });
    expect(sizeS).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "L" })).toBeDisabled();
  });

  it("add to cart uses the variant VALUE in the line name (BACKLOG naming fix)", async () => {
    render(<ProductDetailClient product={makeProduct()} />);
    fireEvent.click(screen.getByRole("button", { name: "ДОДАТИ В КОШИК" }));
    await screen.findByRole("button", { name: /ДОДАНО В КОШИК/ });
    const item = useCartStore.getState().items[0];
    expect(item.name).toBe("Худі Mirox Basic — S");
    expect(item.variantId).toBe("v-s");
  });

  it("«КУПИТИ ЗАРАЗ» adds and navigates to /checkout", async () => {
    render(<ProductDetailClient product={makeProduct()} />);
    fireEvent.click(screen.getByRole("button", { name: "КУПИТИ ЗАРАЗ" }));
    await vi.waitFor(() => expect(push).toHaveBeenCalledWith("/checkout"));
    expect(useCartStore.getState().items).toHaveLength(1);
  });

  it("sibling colorway renders as a link to its PDP", () => {
    render(<ProductDetailClient product={makeProduct()} />);
    const link = screen.getByRole("link", { name: /Білий — Худі Mirox White/ });
    expect(link).toHaveAttribute("href", "/products/hudi-mirox-white");
  });

  it("low stock (≤5) shows «Залишилось N шт», in-stock shows «В наявності»", () => {
    render(<ProductDetailClient product={makeProduct()} />);
    // Selected size S has stock 3.
    expect(screen.getByText("Залишилось 3 шт")).toBeInTheDocument();
  });

  it("fully out-of-stock disables CTAs and shows «Немає в наявності»", () => {
    const product = makeProduct({
      stock: 0,
      variants: [
        { id: "v-s", name: "Size", value: "S", sku: "s", price: "1290", stock: 0, options: {} },
      ],
    });
    render(<ProductDetailClient product={product} />);
    expect(screen.getByRole("button", { name: "ДОДАТИ В КОШИК" })).toBeDisabled();
    expect(screen.getByText("Немає в наявності")).toBeInTheDocument();
  });

  it("«N відгуків» anchors to #reviews with uk pluralization", () => {
    render(<ProductDetailClient product={makeProduct()} />);
    const link = screen.getByRole("link", { name: "12 відгуків" });
    expect(link).toHaveAttribute("href", "#reviews");
  });
});
```

Run: `npx vitest run tests/unit/product-detail-client.test.tsx` — expected FAIL (old English UI).

- [ ] **Step 2: Rewrite `product-detail-client.tsx`**

Full replacement (keep the exported `Product` interface from Task 5, `ProductNotFound`, and delete `ProductDetailSkeleton` — the route's `loading.tsx` is standalone):

```tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Package, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ProductGallery,
  SizePicker,
  BoughtTogether,
  RecentlyViewed,
  ProductCard,
  SocialShareButtons,
} from "@/components/products";
import { ReviewSection, StarRating } from "@/components/reviews";
import { useCartStore } from "@/stores/cart.store";
import { cn } from "@/lib/utils";
import { formatPrice, pluralizeUk } from "@/lib/format";
import { COLOR_SWATCH_CLASSES, rankSizeValues } from "@/lib/product-display";
import { trackViewItem, trackAddToCart } from "@/lib/analytics";
import type { ReviewWithUser, RatingDistribution, StyleSibling, BundleCompanion } from "@/types";

interface ProductImageData {
  id: string;
  url: string;
  alt: string | null;
}

interface ProductVariant {
  id: string;
  name: string;
  value: string;
  sku: string;
  price: string;
  stock: number;
  options: Record<string, string>;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDesc: string | null;
  metaTitle?: string | null;
  metaDesc?: string | null;
  price: string;
  comparePrice: string | null;
  stock: number;
  sku: string;
  isFeatured: boolean;
  styleGroup?: string | null;
  colorValue: string | null;
  styleSiblings: StyleSibling[];
  companions: BundleCompanion[];
  category: { id: string; name: string; slug: string };
  images: ProductImageData[];
  variants: ProductVariant[];
  relatedProducts: {
    id: string;
    name: string;
    slug: string;
    shortDesc: string | null;
    price: string;
    comparePrice: string | null;
    stock: number;
    isFeatured: boolean;
    category: { name: string; slug: string };
    images: { url: string; alt: string | null }[];
  }[];
  reviews: ReviewWithUser[];
  averageRating: number;
  totalReviews: number;
  ratingDistribution: RatingDistribution[];
}

const LOW_STOCK_THRESHOLD = 5;

export function ProductDetailClient({ product }: { product: Product }) {
  const router = useRouter();
  const { addItem } = useCartStore();

  // Sizes: the one real cart dimension (spec §1 constraint 2). Ranked S→XXL;
  // first in-stock preselected.
  const sizes = useMemo(() => {
    const sizeVariants = product.variants.filter((v) => v.name === "Size");
    const ranked = rankSizeValues(sizeVariants.map((v) => v.value));
    return ranked
      .map((value) => sizeVariants.find((v) => v.value === value))
      .filter((v): v is ProductVariant => Boolean(v));
  }, [product.variants]);

  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(
    () => sizes.find((v) => v.stock > 0)?.id ?? null
  );
  const selectedSize = sizes.find((v) => v.id === selectedSizeId) ?? null;

  const [addedToCart, setAddedToCart] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // E2E hydration signal: interactions (size clicks, add-to-cart) are lost if
  // they land before hydration — tests wait for [data-hydrated="true"].
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const viewTracked = useRef(false);
  useEffect(() => {
    if (viewTracked.current) return;
    viewTracked.current = true;
    trackViewItem({
      item_id: product.id,
      item_name: product.name,
      item_category: product.category.name,
      price: parseFloat(product.price),
      quantity: 1,
    });
  }, [product]);

  const currentPrice = selectedSize ? parseFloat(selectedSize.price) : parseFloat(product.price);
  const comparePrice = product.comparePrice ? parseFloat(product.comparePrice) : null;
  const hasDiscount = comparePrice !== null && comparePrice > currentPrice;

  const currentStock = sizes.length > 0 ? (selectedSize?.stock ?? 0) : product.stock;
  const outOfStock = sizes.length > 0 ? sizes.every((v) => v.stock <= 0) : product.stock <= 0;
  const lowStock = !outOfStock && currentStock > 0 && currentStock <= LOW_STOCK_THRESHOLD;

  const addLine = () => {
    const name = selectedSize ? `${product.name} — ${selectedSize.value}` : product.name;
    addItem({
      productId: product.id,
      variantId: selectedSize?.id,
      name,
      price: currentPrice,
      image: product.images[0]?.url,
      maxStock: currentStock,
    });
    trackAddToCart({
      item_id: product.id,
      item_name: name,
      item_category: product.category.name,
      item_variant: selectedSize?.value,
      price: currentPrice,
      quantity: 1,
    });
  };

  const handleAddToCart = async () => {
    if (outOfStock || isAddingToCart) return;
    setIsAddingToCart(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    addLine();
    setIsAddingToCart(false);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = () => {
    if (outOfStock || isAddingToCart) return;
    addLine();
    router.push("/checkout");
  };

  // Current colorway + linked siblings (spec §2 #2): the active swatch is this
  // product; sibling swatches navigate to their own PDPs. Legacy prod data may
  // still carry extra Color rows — they render as informational swatches.
  const legacyExtraColors = Array.from(
    new Set(
      product.variants
        .filter((v) => v.name === "Color" && v.value !== product.colorValue)
        .map((v) => v.value)
    )
  ).filter((value) => !product.styleSiblings.some((s) => s.colorValue === value));

  const currentAsCompanion: BundleCompanion = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    comparePrice: product.comparePrice,
    stock: product.stock,
    image: product.images[0] ? { url: product.images[0].url, alt: product.images[0].alt } : null,
    sizeVariants: sizes.map((v) => ({ id: v.id, value: v.value, stock: v.stock, price: v.price })),
  };

  return (
    <div className="container py-6 lg:py-8" data-hydrated={hydrated ? "true" : undefined}>
      {/* Breadcrumb — Головна / Каталог / {name} (catalog markup precedent) */}
      <nav className="mb-4 text-[12.5px] text-[#737373]">
        <Link href="/" className="hover:text-white">
          Головна
        </Link>{" "}
        /{" "}
        <Link href="/products" className="hover:text-white">
          Каталог
        </Link>{" "}
        / <span className="text-[#a3a3a3]">{product.name}</span>
      </nav>

      {/* Main: gallery | panel */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,420px)] lg:items-start">
        <ProductGallery
          images={product.images.map((i) => ({ url: i.url, alt: i.alt }))}
          productName={product.name}
        />

        <div className="flex flex-col">
          <h1 className="text-[19px] font-extrabold tracking-[-0.02em] lg:text-[30px]">
            {product.name}
          </h1>
          <div className="mt-2.5 flex items-baseline gap-3">
            <span className="text-lg font-extrabold lg:text-[26px]">
              {formatPrice(currentPrice)}
            </span>
            {hasDiscount && (
              <span className="text-muted-foreground text-base line-through">
                {formatPrice(comparePrice)}
              </span>
            )}
          </div>

          {product.totalReviews > 0 && (
            <div className="mt-2.5 flex items-center gap-2">
              <StarRating value={Math.round(product.averageRating)} size="sm" />
              <a href="#reviews" className="text-[13px] text-[#a3a3a3] hover:text-white">
                {product.totalReviews}{" "}
                {pluralizeUk(product.totalReviews, "відгук", "відгуки", "відгуків")}
              </a>
            </div>
          )}

          {(product.colorValue || product.styleSiblings.length > 0) && (
            <div className="mt-4.5">
              <div className="text-[13.5px] font-semibold text-[#a3a3a3]">
                Колір: <span className="text-foreground">{product.colorValue ?? "—"}</span>
              </div>
              <div className="mt-2.5 flex gap-2.5">
                {product.colorValue && (
                  <span
                    aria-label={`Колір: ${product.colorValue} (обраний)`}
                    className={cn(
                      "h-9 w-9 rounded-full border-2 border-white",
                      COLOR_SWATCH_CLASSES[product.colorValue] ?? "bg-muted"
                    )}
                  />
                )}
                {product.styleSiblings.map((sibling) => (
                  <Link
                    key={sibling.slug}
                    href={`/products/${sibling.slug}`}
                    aria-label={`Колір: ${sibling.colorValue ?? sibling.name} — ${sibling.name}`}
                    title={sibling.name}
                    className={cn(
                      "h-9 w-9 rounded-full border transition-colors hover:border-white",
                      (sibling.colorValue && COLOR_SWATCH_CLASSES[sibling.colorValue]) || "bg-muted"
                    )}
                  />
                ))}
                {legacyExtraColors.map((value) => (
                  <span
                    key={value}
                    aria-label={`Колір: ${value}`}
                    title={value}
                    className={cn(
                      "h-9 w-9 rounded-full border",
                      COLOR_SWATCH_CLASSES[value] ?? "bg-muted"
                    )}
                  />
                ))}
              </div>
            </div>
          )}

          {sizes.length > 0 && (
            <div className="mt-4.5">
              <div className="text-[13.5px] font-semibold text-[#a3a3a3]">Розмір:</div>
              <div className="mt-2.5 flex flex-wrap gap-2.5">
                {sizes.map((variant) => {
                  const isActive = variant.id === selectedSizeId;
                  const isOut = variant.stock <= 0;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      aria-pressed={isActive}
                      disabled={isOut}
                      onClick={() => setSelectedSizeId(variant.id)}
                      className={cn(
                        "min-w-[52px] flex-1 rounded-[10px] border px-2 py-3 text-[13.5px] font-bold transition-colors lg:flex-none",
                        isActive
                          ? "border-white bg-white text-black"
                          : "border-border-strong text-foreground hover:border-white",
                        isOut && "cursor-not-allowed opacity-40"
                      )}
                    >
                      {variant.value}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-4.5 flex items-center justify-between text-[13.5px]">
            {outOfStock ? (
              <span className="text-muted-foreground font-bold">Немає в наявності</span>
            ) : lowStock ? (
              <span className="font-bold">Залишилось {currentStock} шт</span>
            ) : (
              <span className="text-available font-bold">● В наявності</span>
            )}
            <span className="text-[#a3a3a3]">Доставка Новою Поштою</span>
          </div>

          <div className="mt-3 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={outOfStock || isAddingToCart}
              className="rounded-[10px] bg-white p-4 text-sm font-extrabold tracking-[0.06em] text-black transition-colors hover:bg-[#e5e5e5] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {addedToCart ? (
                <span className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4" /> ДОДАНО В КОШИК
                </span>
              ) : (
                "ДОДАТИ В КОШИК"
              )}
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={outOfStock || isAddingToCart}
              className="border-border-strong text-foreground rounded-[10px] border p-4 text-sm font-bold tracking-[0.06em] transition-colors hover:border-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              КУПИТИ ЗАРАЗ
            </button>
          </div>

          {/* «У вибране» and «Відкрити фото замірів» deliberately absent — spec §7 ledger #2/#3. */}
          <div className="mt-4">
            <SocialShareButtons
              productId={product.id}
              productName={product.name}
              productSlug={product.slug}
              productImage={product.images[0]?.url}
            />
          </div>
        </div>
      </div>

      {/* Size picker + bought together */}
      <div className="mt-12 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <SizePicker />
        <BoughtTogether
          current={currentAsCompanion}
          companions={product.companions}
          preferredSizeValue={selectedSize?.value ?? null}
        />
      </div>

      {/* Опис — kept for SEO (spec §7 ledger #9) */}
      {product.description && (
        <section aria-label="Опис" className="mt-16">
          <h2 className="mb-5 text-[28px] font-extrabold tracking-[-0.02em]">Опис</h2>
          <p className="text-foreground/80 max-w-3xl text-[14.5px] leading-relaxed whitespace-pre-wrap">
            {product.description}
          </p>
        </section>
      )}

      <div id="reviews">
        <ReviewSection
          productId={product.id}
          productSlug={product.slug}
          initialReviews={product.reviews}
          averageRating={product.averageRating}
          totalReviews={product.totalReviews}
          ratingDistribution={product.ratingDistribution}
        />
      </div>

      {product.relatedProducts.length > 0 && (
        <section aria-label="Схожі товари" className="mt-16">
          <h2 className="mb-7 text-[28px] font-extrabold tracking-[-0.02em]">Схожі товари</h2>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {product.relatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </section>
      )}

      <RecentlyViewed currentProductId={product.id} />
    </div>
  );
}

export function ProductNotFound() {
  const router = useRouter();
  return (
    <div className="container py-16">
      <div className="flex flex-col items-center justify-center text-center">
        <Package className="text-muted-foreground h-16 w-16" />
        <h1 className="mt-4 text-2xl font-extrabold">Товар не знайдено</h1>
        <p className="text-muted-foreground mt-2">
          Товару, який ви шукаєте, не існує, або його було видалено.
        </p>
        <Button className="mt-6" onClick={() => router.push("/products")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          До каталогу
        </Button>
      </div>
    </div>
  );
}
```

Notes for the implementer:

- The old `ProductDetailSkeleton` export is deleted; `grep -rn "ProductDetailSkeleton" src` and remove any importer (only `loading.tsx` historically had its own copy — verify).
- Quantity stepper, `shortDesc` paragraph, SKU line, and the old Featured/discount badges are **removed by design** (spec §4 buy panel + §7 #7).
- Keep `export type { Product }` consumers working: `page.tsx` imports `ProductDetailClient, ProductNotFound, type Product` — unchanged names.

- [ ] **Step 3: UA strings in `SocialShareButtons`**

In `src/components/products/SocialShareButtons.tsx`, change only:

- `<span …>Share:</span>` → `<span className="text-muted-foreground text-sm font-medium">Поділитися:</span>`
- `toast.success("Link copied to clipboard!")` → `toast.success("Посилання скопійовано!")`
- `toast.error("Failed to copy link")` → `toast.error("Не вдалося скопіювати посилання")`
- `aria-label="Copy link"` → `aria-label="Скопіювати посилання"`
- `aria-label="Share"` → `aria-label="Поділитися"`
- `aria-label={`Share on ${label}`}` → `aria-label={`Поділитися: ${label}`}`

- [ ] **Step 4: Breadcrumb JSON-LD in `page.tsx`**

Replace the `getBreadcrumbJsonLd([...])` call's array with:

```ts
const breadcrumbJsonLd = getBreadcrumbJsonLd([
  { name: "Головна", url: siteConfig.url },
  { name: "Каталог", url: `${siteConfig.url}/products` },
  { name: product.name, url: `${siteConfig.url}/products/${product.slug}` },
]);
```

- [ ] **Step 5: Update `loading.tsx` to the new layout**

Replace the file body with a skeleton matching the new structure (breadcrumb line, `lg:grid-cols-[minmax(0,1fr)_minmax(340px,420px)]` with a tall media block + panel lines with two full-width CTA bars, then two card blocks for SizePicker/BoughtTogether):

```tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetailLoading() {
  return (
    <div className="container py-6 lg:py-8">
      <Skeleton className="mb-4 h-4 w-64" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,420px)]">
        <div className="hidden gap-6 lg:grid lg:grid-cols-[96px_minmax(0,1fr)]">
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 w-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-[clamp(420px,calc(100vh-190px),620px)] rounded-[20px]" />
        </div>
        <Skeleton className="h-[400px] rounded-[20px] lg:hidden" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-40" />
          <div className="flex gap-2.5">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-9 w-9 rounded-full" />
            ))}
          </div>
          <div className="flex gap-2.5">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-11 w-[52px] rounded-[10px]" />
            ))}
          </div>
          <Skeleton className="h-12 w-full rounded-[10px]" />
          <Skeleton className="h-12 w-full rounded-[10px]" />
        </div>
      </div>
      <div className="mt-12 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Skeleton className="h-64 rounded-[20px]" />
        <Skeleton className="h-64 rounded-[20px]" />
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Run the new tests + full unit suite**

Run: `npx vitest run tests/unit/product-detail-client.test.tsx`
Expected: PASS.
Run: `npm run test:run && npm run typecheck`
Expected: all green (fix any stale references — e.g. tests or components importing the deleted skeleton).

- [ ] **Step 7: Commit**

```bash
git add "src/app/(shop)/products/[slug]" src/components/products tests/unit/product-detail-client.test.tsx
git commit -m "feat(pdp): Mirox buy panel + composition shell — colorway links, КУПИТИ ЗАРАЗ, hydration signal"
```

---

### Task 11: Reviews restyle (dark Mirox + Ukrainian)

Restyle in place; **all functionality stays** (stats, distribution, eligibility-gated form, load-more, rating filter, admin replies, optimistic updates).

**Files:**

- Modify: `src/components/reviews/ReviewSection.tsx`
- Modify: `src/components/reviews/ReviewItem.tsx`
- Modify: `src/components/reviews/ReviewStats.tsx`
- Modify: `src/components/reviews/ReviewForm.tsx`
- Modify: `src/components/reviews/ReviewList.tsx`
- Test: `tests/unit/review-item.test.tsx` (new)
- (`StarRating.tsx` already token-correct — untouched.)

**Interfaces:**

- Consumes: `pluralizeUk` (Task 3), `text-available` (Task 1).
- Produces: same component APIs (props unchanged) — only markup, classes, strings.

- [ ] **Step 1: Write the failing ReviewItem test**

Create `tests/unit/review-item.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReviewItem } from "@/components/reviews/ReviewItem";
import type { ReviewWithUser } from "@/types";

const review: ReviewWithUser = {
  id: "r1",
  rating: 5,
  comment: "Відмінна якість!",
  adminReply: "Дякуємо!",
  adminRepliedAt: "2026-06-15T10:00:00.000Z",
  createdAt: "2026-06-12T10:00:00.000Z",
  user: { id: "u1", name: "Олександр", image: null },
};

describe("ReviewItem (Mirox restyle)", () => {
  it("renders avatar initial, verified badge, uk date", () => {
    render(<ReviewItem review={review} />);
    expect(screen.getByText("О")).toBeInTheDocument(); // initial circle
    expect(screen.getByText("✓ Підтверджена покупка")).toBeInTheDocument();
    expect(screen.getByText("12.06.2026")).toBeInTheDocument();
    expect(screen.getByText("Відмінна якість!")).toBeInTheDocument();
  });

  it("renders the admin reply block with uk label", () => {
    render(<ReviewItem review={review} />);
    expect(screen.getByText(/Відповідь магазину/)).toBeInTheDocument();
    expect(screen.getByText("Дякуємо!")).toBeInTheDocument();
  });

  it("anonymous fallback is Ukrainian", () => {
    render(<ReviewItem review={{ ...review, user: { ...review.user, name: null } }} />);
    expect(screen.getByText("Покупець")).toBeInTheDocument();
  });
});
```

Run: `npx vitest run tests/unit/review-item.test.tsx` — expected FAIL.

- [ ] **Step 2: Rewrite `ReviewItem.tsx`**

```tsx
"use client";

import { StarRating } from "./StarRating";
import { Store } from "lucide-react";
import type { ReviewWithUser } from "@/types";

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("uk-UA", { timeZone: "UTC" }).format(new Date(dateString));
}

/**
 * Review card per Mirox Product.dc.html: dark elevated card, initial-circle
 * avatar, name + «✓ Підтверджена покупка» (true by construction — eligibility
 * requires a DELIVERED order containing the product), stars, dd.MM.yyyy date.
 */
export function ReviewItem({ review }: { review: ReviewWithUser }) {
  const displayName = review.user.name || "Покупець";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="bg-card border-border rounded-2xl border p-5 sm:p-7">
      <div className="mb-3.5 flex items-center gap-3">
        <span className="bg-secondary flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-extrabold">
          {initial}
        </span>
        <div className="min-w-0">
          <div className="truncate text-[14.5px] font-bold">
            {displayName}{" "}
            <span className="text-available ml-1.5 text-[11px] font-bold whitespace-nowrap">
              ✓ Підтверджена покупка
            </span>
          </div>
          <StarRating value={review.rating} size="sm" />
        </div>
        <span className="ml-auto shrink-0 text-[12.5px] text-[#737373]">
          {formatDate(review.createdAt)}
        </span>
      </div>

      {review.comment && (
        <p className="text-foreground/80 text-[14.5px] leading-relaxed whitespace-pre-wrap">
          {review.comment}
        </p>
      )}

      {review.adminReply && (
        <div className="bg-background border-border mt-3.5 rounded-xl border p-3.5">
          <div className="text-muted-foreground mb-1 flex items-center gap-1.5 text-xs font-semibold">
            <Store className="h-3 w-3" />
            Відповідь магазину
            {review.adminRepliedAt && (
              <span className="font-normal"> &middot; {formatDate(review.adminRepliedAt)}</span>
            )}
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{review.adminReply}</p>
        </div>
      )}
    </div>
  );
}
```

(`timeZone: "UTC"` keeps the rendered date stable regardless of the machine's zone — the test asserts `12.06.2026` for a `T10:00Z` timestamp.)

- [ ] **Step 3: Restyle `ReviewSection.tsx`**

Exact edits:

- Heading block: replace the `MessageSquare` + `<h2 …>Customer Reviews</h2>` block with:

```tsx
<h2 className="mb-7 text-[28px] font-extrabold tracking-[-0.02em]">Відгуки покупців</h2>
```

(remove the `MessageSquare` import). Root stays `mt-16`.

- Layout: keep the `grid gap-8 lg:grid-cols-3` structure (stats+form left, list right) — the reference shows only cards, but stats/form are kept functionality (spec §4 reviews).

- [ ] **Step 4: Restyle `ReviewStats.tsx`**

Exact edits:

- `{totalReviews} review{totalReviews !== 1 ? "s" : ""}` → `{totalReviews} {pluralizeUk(totalReviews, "відгук", "відгуки", "відгуків")}` (add `import { pluralizeUk } from "@/lib/format";`)
- Wrap the root `div` classes: `"space-y-4"` → `"bg-card border-border space-y-4 rounded-2xl border p-5 sm:p-7"`
- Distribution bar `bg-foreground` stays (monochrome fill on dark = white — correct).

- [ ] **Step 5: Restyle `ReviewForm.tsx` strings**

Exact string swaps (classes stay; shadcn inputs already token-dark):

- `"Please select a rating"` → `"Оберіть оцінку"`
- `"Failed to submit review"` (both occurrences) → `"Не вдалося надіслати відгук"`
- `"Review submitted successfully!"` → `"Відгук надіслано!"`
- `<h3 …>Write a Review</h3>` → `<h3 className="font-extrabold">Написати відгук</h3>`
- `Rating *` → `Оцінка *`
- `Comment (optional)` → `Коментар (необов’язково)`
- placeholder `"Share your experience with this product..."` → `"Поділіться враженнями про товар…"`
- `{isSubmitting ? "Submitting..." : "Submit Review"}` → `{isSubmitting ? "Надсилаємо…" : "Надіслати відгук"}`
- Form wrapper: `"space-y-4 rounded-lg border p-4"` → `"bg-card border-border space-y-4 rounded-2xl border p-5"`

- [ ] **Step 6: Restyle `ReviewList.tsx` strings + card spacing**

Exact swaps:

- `Filter:` → `Фільтр:`
- `All ratings` → `Всі оцінки`
- `5 stars`/`4 stars`/`3 stars`/`2 stars` → `5 зірок` / `4 зірки` / `3 зірки` / `2 зірки`; `1 star` → `1 зірка`
- `No reviews match this filter.` → `Немає відгуків із такою оцінкою.`
- `No reviews yet.` → `Відгуків поки немає.`
- `{isLoading ? "Loading..." : "Load More Reviews"}` → `{isLoading ? "Завантаження…" : "Показати ще"}`
- Reviews container `<div>` around the map → `<div className="space-y-4">` (cards now have their own borders — the old `border-b` dividers live in ReviewItem no longer).

- [ ] **Step 7: Run tests**

Run: `npx vitest run tests/unit/review-item.test.tsx tests/unit/no-bright-colors.test.ts && npm run test:run`
Expected: PASS (colour guard confirms `text-available` usage is legal; full suite green).

- [ ] **Step 8: Commit**

```bash
git add src/components/reviews tests/unit/review-item.test.tsx
git commit -m "feat(reviews): Mirox dark restyle + Ukrainian strings (functionality unchanged)"
```

---

### Task 12: E2E updates + new PDP flow

**Files:**

- Modify: `tests/e2e/products.spec.ts:130-143` (+ new test)
- Modify: `tests/e2e/cart.spec.ts` (all `/add to cart/i` call sites: lines ~28, 63, 85, 106)

**Interfaces:**

- Consumes: `[data-hydrated="true"]` (Task 10), «ДОДАТИ В КОШИК» accessible name, seed slugs (`hudi-mirox-basic` with first in-stock size S).

- [ ] **Step 1: Update the add-to-cart selector everywhere**

In both spec files replace every `page.getByRole("button", { name: /add to cart/i })` with:

```ts
page.getByRole("button", { name: /^додати в кошик$/i });
```

The `^…$` anchors matter: «ДОДАТИ **КОМПЛЕКТ** У КОШИК» (BoughtTogether) must not match.

- [ ] **Step 2: Gate every PDP interaction on hydration**

In `cart.spec.ts`, after each navigation that lands on a PDP (the `toHaveURL(/\/products\/[^/]+$/)` or heading-click patterns) and **before** the add-to-cart click, insert:

```ts
await page.waitForSelector('[data-hydrated="true"]');
```

Do the same in the `products.spec.ts` "product detail shows add to cart button" test before asserting the button.

- [ ] **Step 3: Add the sized-line flow test**

Append to `tests/e2e/products.spec.ts` inside the products describe:

```ts
test("PDP adds a sized cart line (variant value, not dimension name)", async ({ page }) => {
  await page.goto("/products/hudi-mirox-basic");
  await page.waitForSelector('[data-hydrated="true"]');

  // First in-stock size (S) is preselected — add straight away.
  await page.getByRole("button", { name: /^додати в кошик$/i }).click();
  await expect(page.getByRole("button", { name: /додано в кошик/i })).toBeVisible();

  // The drawer line must carry the VALUE («— S»), never «— Size».
  await page
    .getByRole("button", { name: /кошик|cart/i })
    .first()
    .click();
  await expect(page.getByText(/Худі Mirox Basic — S/).first()).toBeVisible();
  await expect(page.getByText(/— Size/)).toHaveCount(0);
});

test("PDP colorway swatch navigates to the sibling product", async ({ page }) => {
  await page.goto("/products/hudi-mirox-basic");
  await page.waitForSelector('[data-hydrated="true"]');
  await page.getByRole("link", { name: /Білий — Худі Mirox White/ }).click();
  await expect(page).toHaveURL(/\/products\/hudi-mirox-white$/);
});
```

(The Header cart button's accessible name is the sr-only "Cart" — with a badge it reads "1 Cart", so `/cart/i` matches both states; keep `.first()`.)

- [ ] **Step 4: Run E2E locally — foreground, one project per command**

```bash
npm run test:e2e -- --project=chromium tests/e2e/products.spec.ts tests/e2e/cart.spec.ts
npm run test:e2e -- --project=webkit tests/e2e/products.spec.ts tests/e2e/cart.spec.ts
```

Expected: PASS both projects (dev DB seeded from Task 2). Known pre-existing failure: `navigation.spec.ts` "can navigate to products page" fails against local `next dev` on `main` too — out of scope, do not chase.

- [ ] **Step 5: Commit**

```bash
git add tests/e2e
git commit -m "test(e2e): PDP Ukrainian selectors, hydration gating, sized-line + colorway flows"
```

---

### Task 13: Docs deliverables

**Files:**

- Modify: `docs/planning/BACKLOG.md` (new intake group)
- Modify: `docs/planning/TODO.md` (TASK-037 AC-6 resolution note; TASK-056 фото-замірів note)

**Interfaces:** none (docs only). Spec §9 is the source.

- [ ] **Step 1: BACKLOG intake group**

Add under the appropriate 🟤 Auto-Generated section, following the file's 📌 Process Rules:

```markdown
### [2026-08-01] From: TASK-037 product page redesign (plan extraction)

- 🟤 **Restore «У вибране» on the PDP when wishlist ships** — TASK-037 omitted the reference's
  «У вибране» affordance under the no-dead-links rule (spec §7 ledger #2); when TASK-041 builds
  wishlist, add the heart action back to the buy panel's share row per `Mirox Product.dc.html`.
  (Low effort) `[relates-to: TASK-041]`
- 🟤 **Admin product form has no `styleGroup` field** — colorway linking (TASK-037) is seed-only;
  `ProductForm.tsx` can't set/edit `Product.styleGroup`, so admins can't link colorways without
  DB access. Add the field to the admin form + validation schema. (Med value, Low effort)
  `[relates-to: TASK-037]`
```

- [ ] **Step 2: TODO.md updates**

1. TASK-037's AC-6 line — annotate (keep unchecked; checked at completion):

```markdown
- [ ] «Купити в 1 клік» resolved — either built here or explicitly deferred to TASK-043's quick-order (decide in this task's plan) — **RESOLVED 2026-08-01 (spec §2 #1): explicitly deferred to TASK-043; interim second CTA is «КУПИТИ ЗАРАЗ» (add → /checkout)**
```

2. TASK-056's size-charts AC line — append the restore note:

```markdown
- [ ] Size charts (feeds TASK-037/TASK-045 — `SizePicker.tsx`'s height/weight formula is an interim placeholder until these arrive; **the PDP's «Відкрити фото замірів» button was omitted by TASK-037 (spec §7 ledger #3) and gets restored when measurement photos arrive with these charts**)
```

- [ ] **Step 3: Commit**

```bash
git add docs/planning/BACKLOG.md docs/planning/TODO.md
git commit -m "docs(task-037): BACKLOG restore pointers + AC-6 resolution + TASK-056 note"
```

---

### Task 14: Full verification + visual-fidelity gate (session-level — not a subagent task)

**Files:** none created (screenshots go to the session scratchpad).

- [ ] **Step 1: Full local suite**

```bash
npm run lint && npm run typecheck && npm run format:check && npm run test:run
```

Expected: all green, 0 warnings.

- [ ] **Step 2: Production build + compiled-CSS token check**

```bash
npm run build
grep -rl "color-available" .next/static/css/ | head -1
```

Expected: build succeeds; grep prints a CSS file (proves `--available` was registered AND emitted — an unregistered token dies silently; run the grep as its own command so its exit code isn't masked).

- [ ] **Step 3: Full E2E against the seeded local DB**

```bash
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=webkit
```

Foreground, one project per command (background runs die silently in this devcontainer). Expected: green except the documented pre-existing navigation dev-server failure.

- [ ] **Step 4: Visual-fidelity gate captures**

Start the prod build locally (`npm run start`, port 3001) — the prod build avoids dev-only styling races. Capture with Playwright (or the browser MCP) into the scratchpad:

- Desktop 1440×900: `/products/hudi-mirox-basic` full page (multi-image product — carousel/thumbs visible)
- Desktop: `/products/kepka-mirox` (One-size product — size row shows the single chip)
- Mobile 390×844: `/products/hudi-mirox-basic` (dots pager, stacked CTAs, flex-1 sizes)
- Reference side-by-sides: open `docs/design/design_handoff_mirox/Mirox Product.dc.html` and the `Mobile Товар` screen of `Mirox Mobile.dc.html` at the same viewports and capture.

- [ ] **Step 5: Present the gate to the user**

Present screenshot pairs + the spec §7 deviations ledger (all 9 items) and **WAIT for explicit user sign-off**. Expect a revision round (every design task so far had one). Do not open the PR before sign-off.

- [ ] **Step 6: After sign-off — push + PR**

Follow the finishing flow: push `feat/task-037-product-page-redesign`, open the PR referencing TASK-037 + the spec, run `/code-review`, list sub-threshold findings in chat per the standing threshold lesson.

---

## Execution notes

- **Task order is dependency order**: 1 → 2 → 3 → 4 → 5 → {6, 7, 8, 9 in any order} → 10 → 11 → 12 → 13 → 14. Tasks 6–9 are independent of each other (7 needs 5's types; all four need 3).
- **Prod data**: merging applies the schema migration only. Prod keeps legacy colorway rows (two dots on Худі Basic, no sibling links) until the user approves a re-seed — the shell's `legacyExtraColors` path renders that state correctly. Never seed prod from this task.
- **Progress logging**: log task completions and deviations in this plan file as you go (per CLAUDE.md).

```

```
