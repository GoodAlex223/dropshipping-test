# TASK-036 Catalog Redesign + Filters — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/products` to the Mirox catalog design — five combinable filters, 4-sort set incl. «Популярні», upgraded ProductCard (badges, swatches, hover second image, quick-view/quick-buy), square pagination — while keeping the E2E hydration gate valid unchanged.

**Architecture:** Approach A from the approved spec ([2026-07-31-task-036-catalog-redesign-design.md](../../superpowers/specs/2026-07-31-task-036-catalog-redesign-design.md)): the page stays a client component fetching `/api/products` post-hydration; the API gains filter/sort params and richer selects; card upgrades are additive and data-gated so other ProductCard consumers render unchanged.

**Tech Stack:** Next.js 14 App Router, Prisma, shadcn/ui (Popover/Sheet/Dialog/Slider), Zustand cart store, Vitest + RTL (jsdom), Playwright.

## Global Constraints

- Prices render **only** via `formatPrice()` from `src/lib/format.ts` — never hand-rolled.
- All new customer-visible strings are **Ukrainian**, hardcoded inline (greppable for TASK-039).
- Monochrome palette only (no bright colors — `no-bright-colors.test.ts` guards this); colors via existing tokens or the handoff hexes (`#0d0d0d`, `#1a1a1a`, `#262626`, `#333`, `#f5f5f5`).
- API routes: `try/catch` with no `console.error`; bare `catch` when the error is unused.
- Query params: parse defensively, fall back to defaults, never throw on malformed input.
- TDD: test first, watch it fail, implement, watch it pass, commit. Run `npm run test:run -- <file>` for single-file runs.
- The E2E hydration gate (`waitForSelector("[data-testid='product-card']")` in `tests/e2e/products.spec.ts`) must remain valid: product cards stay client-rendered by a post-hydration fetch. Do not convert the catalog to server rendering.
- `data-testid="product-card"` must remain on the card root.
- Never touch `.env`; never run `db:seed` against a non-local `DATABASE_URL`.
- Pre-commit hooks (eslint --fix + prettier) run automatically; don't bypass them.

---

### Task 1: `getSalesRanking()` — shared sales-ranking helper

**Files:**

- Modify: `src/lib/product-queries.ts`
- Test: `tests/unit/product-queries.test.ts`

**Interfaces:**

- Consumes: existing `COUNTED_STATUSES`, `prisma.orderItem.groupBy`.
- Produces: `export async function getSalesRanking(windowDays = 90, take?: number): Promise<string[]>` — product IDs ranked by units sold (desc) over the trailing window, counting only stuck orders. `getBestsellers()` now calls it with `take = limit` (its groupBy call shape is unchanged, so existing tests still pass). Task 4 calls it with no `take` for the full ranking.

- [x] **Step 1: Write the failing tests** — append to `tests/unit/product-queries.test.ts`:

```ts
import {
  getBestsellers,
  getFeaturedProducts,
  getNewArrivals,
  getSalesRanking,
} from "@/lib/product-queries"; // extend the existing import

describe("getSalesRanking", () => {
  it("returns product ids in sales order without a take when none is given", async () => {
    groupBy.mockResolvedValue([
      { productId: "b", _sum: { quantity: 9 } },
      { productId: "a", _sum: { quantity: 4 } },
    ]);

    const before = Date.now();
    const ids = await getSalesRanking(90);

    expect(ids).toEqual(["b", "a"]);
    const arg = groupBy.mock.calls[0][0];
    expect(arg.take).toBeUndefined();
    expect(arg.where.order.status.in).toEqual(["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"]);
    assertWindowGte(arg.where.order.createdAt.gte, 90, before);
  });

  it("passes take through when given", async () => {
    groupBy.mockResolvedValue([]);
    await getSalesRanking(90, 4);
    expect(groupBy.mock.calls[0][0].take).toBe(4);
  });
});
```

- [x] **Step 2: Run to verify failure** — `npm run test:run -- tests/unit/product-queries.test.ts`. Expected: FAIL — `getSalesRanking` is not exported.

- [x] **Step 3: Implement** in `src/lib/product-queries.ts` — add above `getBestsellers()`:

```ts
/**
 * Product IDs ranked by units sold (desc) over a trailing window, counting
 * only orders that stuck. Shared by getBestsellers() and the catalog's
 * `sort=popular` (/api/products) so "popular" has exactly one definition.
 */
export async function getSalesRanking(windowDays = 90, take?: number): Promise<string[]> {
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

  const grouped = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      order: { status: { in: [...COUNTED_STATUSES] }, createdAt: { gte: since } },
    },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    ...(take !== undefined ? { take } : {}),
  });

  return grouped.map((group) => group.productId);
}
```

Then inside `getBestsellers()`, replace the `grouped` groupBy call and `rankedIds` line with:

```ts
const rankedIds = await getSalesRanking(windowDays, limit);
```

(delete the now-unused local `since`/`grouped` code; keep everything from `const ranked = ...` down unchanged). Also update the stale comment above `getBestsellers` (`// No homepage consumer since TASK-057...`) to note TASK-036 now consumes `getSalesRanking()`.

- [x] **Step 4: Run to verify pass** — `npm run test:run -- tests/unit/product-queries.test.ts`. Expected: all pass, including the pre-existing `getBestsellers` tests (its groupBy still receives `take: limit`).

- [x] **Step 5: Commit** — `git add src/lib/product-queries.ts tests/unit/product-queries.test.ts && git commit -m "feat(catalog): extract getSalesRanking() shared popularity definition"`

---

### Task 2: `isNewProduct()` — НОВИНКА badge helper

**Files:**

- Create: `src/lib/product-badges.ts`
- Test: `tests/unit/product-badges.test.ts`

**Interfaces:**

- Produces: `export const NEW_BADGE_WINDOW_DAYS = 30`; `export function isNewProduct(createdAt: string | Date, now: Date = new Date()): boolean` — true iff `createdAt` is strictly within the last 30 days. Task 6 (ProductCard) consumes it.

- [x] **Step 1: Write the failing test** — create `tests/unit/product-badges.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { isNewProduct, NEW_BADGE_WINDOW_DAYS } from "@/lib/product-badges";

const DAY_MS = 24 * 60 * 60 * 1000;
const now = new Date("2026-07-31T12:00:00Z");

describe("isNewProduct", () => {
  it("is true for a product created 29 days ago", () => {
    expect(isNewProduct(new Date(now.getTime() - 29 * DAY_MS), now)).toBe(true);
  });

  it("is false for a product created 31 days ago", () => {
    expect(isNewProduct(new Date(now.getTime() - 31 * DAY_MS), now)).toBe(false);
  });

  it("is false at exactly the 30-day boundary", () => {
    expect(isNewProduct(new Date(now.getTime() - NEW_BADGE_WINDOW_DAYS * DAY_MS), now)).toBe(false);
  });

  it("accepts ISO-string dates (serialized API responses)", () => {
    expect(isNewProduct(new Date(now.getTime() - 2 * DAY_MS).toISOString(), now)).toBe(true);
  });

  it("is false for an invalid date string", () => {
    expect(isNewProduct("not-a-date", now)).toBe(false);
  });
});
```

- [x] **Step 2: Run to verify failure** — `npm run test:run -- tests/unit/product-badges.test.ts`. Expected: FAIL — module not found.

- [x] **Step 3: Implement** — create `src/lib/product-badges.ts`:

```ts
/** Window inside which a product earns the НОВИНКА badge (spec §5). */
export const NEW_BADGE_WINDOW_DAYS = 30;

/**
 * True iff the product was created strictly within the last
 * NEW_BADGE_WINDOW_DAYS. Accepts serialized (string) dates because catalog
 * cards receive JSON API responses. Invalid dates are simply not "new".
 */
export function isNewProduct(createdAt: string | Date, now: Date = new Date()): boolean {
  const created = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const age = now.getTime() - created.getTime();
  if (Number.isNaN(age)) return false;
  return age >= 0 && age < NEW_BADGE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}
```

- [x] **Step 4: Run to verify pass** — `npm run test:run -- tests/unit/product-badges.test.ts`. Expected: PASS.

- [x] **Step 5: Commit** — `git add src/lib/product-badges.ts tests/unit/product-badges.test.ts && git commit -m "feat(catalog): add isNewProduct() НОВИНКА badge helper"`

---

### Task 3: `/api/products` — five filters + richer select

**Files:**

- Modify: `src/app/api/products/route.ts`
- Create: `tests/unit/products-api.test.ts`

**Interfaces:**

- Consumes: nothing new.
- Produces: `GET /api/products` accepting `size`, `color`, `brand`, `inStock=true` (combinable with the existing `search`/`category`/`minPrice`/`maxPrice`/`featured`); response items now include `variants: { id, name, value, stock, price }[]`, `createdAt`, and up to **2** images. Tasks 6–8 consume the response shape.

- [x] **Step 1: Write the failing tests** — create `tests/unit/products-api.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    product: { findMany: vi.fn(), count: vi.fn() },
  },
}));
vi.mock("@/lib/product-queries", () => ({
  getSalesRanking: vi.fn(),
}));

import { prisma } from "@/lib/db";
import { GET } from "@/app/api/products/route";
import { createNextRequest } from "../helpers/api-test-utils";

const findMany = prisma.product.findMany as unknown as ReturnType<typeof vi.fn>;
const count = prisma.product.count as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  findMany.mockResolvedValue([]);
  count.mockResolvedValue(0);
});

function whereOf(call = 0) {
  return findMany.mock.calls[call][0].where;
}

describe("GET /api/products — filters", () => {
  it("filters by size via a Size-variant some-condition", async () => {
    await GET(createNextRequest({ url: "/api/products", searchParams: { size: "M" } }));
    expect(whereOf().AND).toEqual([{ variants: { some: { name: "Size", value: "M" } } }]);
  });

  it("combines size and color as two independent some-conditions", async () => {
    await GET(
      createNextRequest({ url: "/api/products", searchParams: { size: "M", color: "Чорний" } })
    );
    expect(whereOf().AND).toEqual([
      { variants: { some: { name: "Size", value: "M" } } },
      { variants: { some: { name: "Color", value: "Чорний" } } },
    ]);
  });

  it("filters by brand equality and inStock as stock > 0", async () => {
    await GET(
      createNextRequest({ url: "/api/products", searchParams: { brand: "Mirox", inStock: "true" } })
    );
    expect(whereOf()).toEqual(
      expect.objectContaining({ isActive: true, brand: "Mirox", stock: { gt: 0 } })
    );
  });

  it("ignores inStock values other than 'true'", async () => {
    await GET(createNextRequest({ url: "/api/products", searchParams: { inStock: "yes" } }));
    expect(whereOf().stock).toBeUndefined();
  });

  it("combines new filters with existing category and price params", async () => {
    await GET(
      createNextRequest({
        url: "/api/products",
        searchParams: { size: "L", category: "hudi", minPrice: "500", maxPrice: "1500" },
      })
    );
    expect(whereOf()).toEqual(
      expect.objectContaining({
        category: { slug: "hudi" },
        price: { gte: 500, lte: 1500 },
        AND: [{ variants: { some: { name: "Size", value: "L" } } }],
      })
    );
  });

  it("selects variants (id/name/value/stock/price), createdAt, and two images", async () => {
    await GET(createNextRequest({ url: "/api/products", searchParams: {} }));
    const select = findMany.mock.calls[0][0].select;
    expect(select.variants).toEqual({
      select: { id: true, name: true, value: true, stock: true, price: true },
    });
    expect(select.createdAt).toBe(true);
    expect(select.images.take).toBe(2);
  });
});
```

Note: `createNextRequest` comes from `tests/helpers/api-test-utils.ts` — signature `createNextRequest({ url, method?, body?, searchParams? })`; `url` is required and `searchParams` are merged onto it.

- [x] **Step 2: Run to verify failure** — `npm run test:run -- tests/unit/products-api.test.ts`. Expected: FAIL on the filter assertions (params ignored today). The `vi.mock("@/lib/product-queries")` is inert until Task 4 — harmless here.

- [x] **Step 3: Implement** in `src/app/api/products/route.ts` — after the existing `featured` block, add:

```ts
const size = searchParams.get("size");
const color = searchParams.get("color");
const brand = searchParams.get("brand");
const inStock = searchParams.get("inStock");

const variantConditions: Prisma.ProductWhereInput[] = [];
if (size) {
  variantConditions.push({ variants: { some: { name: "Size", value: size } } });
}
if (color) {
  variantConditions.push({ variants: { some: { name: "Color", value: color } } });
}
if (variantConditions.length > 0) {
  where.AND = variantConditions;
}
if (brand) {
  where.brand = brand;
}
if (inStock === "true") {
  where.stock = { gt: 0 };
}
```

And in the `select`, change `images` to `take: 2` and add:

```ts
createdAt: true,
variants: { select: { id: true, name: true, value: true, stock: true, price: true } },
```

- [x] **Step 4: Run to verify pass** — `npm run test:run -- tests/unit/products-api.test.ts`. Expected: PASS.

- [x] **Step 5: Commit** — `git add src/app/api/products/route.ts tests/unit/products-api.test.ts && git commit -m "feat(catalog): size/color/brand/inStock filters + variants in /api/products"`

---

### Task 4: `/api/products` — `sort` param incl. `popular`

**Files:**

- Modify: `src/app/api/products/route.ts`
- Test: `tests/unit/products-api.test.ts` (extend)

**Interfaces:**

- Consumes: `getSalesRanking()` from Task 1.
- Produces: `sort` = `new` (default) | `popular` | `price-asc` | `price-desc`. When `sort` is **absent**, the legacy `sortBy`/`sortOrder` path runs exactly as today (full back-compat). Invalid `sort` values fall back to `new`.

- [x] **Step 1: Write the failing tests** — append to `tests/unit/products-api.test.ts`:

```ts
import { getSalesRanking } from "@/lib/product-queries";
const salesRanking = getSalesRanking as unknown as ReturnType<typeof vi.fn>;

describe("GET /api/products — sort", () => {
  it("maps sort=new to createdAt desc", async () => {
    await GET(createNextRequest({ url: "/api/products", searchParams: { sort: "new" } }));
    expect(findMany.mock.calls[0][0].orderBy).toEqual({ createdAt: "desc" });
  });

  it("maps sort=price-asc and sort=price-desc to price ordering", async () => {
    await GET(createNextRequest({ url: "/api/products", searchParams: { sort: "price-asc" } }));
    expect(findMany.mock.calls[0][0].orderBy).toEqual({ price: "asc" });
    vi.clearAllMocks();
    findMany.mockResolvedValue([]);
    count.mockResolvedValue(0);
    await GET(createNextRequest({ url: "/api/products", searchParams: { sort: "price-desc" } }));
    expect(findMany.mock.calls[0][0].orderBy).toEqual({ price: "desc" });
  });

  it("falls back to new for an invalid sort value", async () => {
    await GET(createNextRequest({ url: "/api/products", searchParams: { sort: "hack" } }));
    expect(findMany.mock.calls[0][0].orderBy).toEqual({ createdAt: "desc" });
  });

  it("keeps the legacy sortBy/sortOrder path when sort is absent", async () => {
    await GET(
      createNextRequest({
        url: "/api/products",
        searchParams: { sortBy: "name", sortOrder: "asc" },
      })
    );
    expect(findMany.mock.calls[0][0].orderBy).toEqual({ name: "asc" });
  });

  it("sort=popular orders ranked products first, backfills newest-first, and paginates", async () => {
    salesRanking.mockResolvedValue(["sold-2", "sold-1"]);
    const d = (day: number) => new Date(2026, 6, day);
    // id-only query for ranking (first findMany call)
    findMany
      .mockResolvedValueOnce([
        { id: "unranked-new", createdAt: d(30) },
        { id: "sold-1", createdAt: d(1) },
        { id: "unranked-old", createdAt: d(2) },
        { id: "sold-2", createdAt: d(3) },
      ])
      // page-row fetch (second findMany call) returns arbitrary order
      .mockResolvedValueOnce([
        { id: "sold-1", createdAt: d(1) },
        { id: "sold-2", createdAt: d(3) },
        { id: "unranked-new", createdAt: d(30) },
        { id: "unranked-old", createdAt: d(2) },
      ]);
    count.mockResolvedValue(4);

    const res = await GET(
      createNextRequest({ url: "/api/products", searchParams: { sort: "popular" } })
    );
    const body = await res.json();

    expect(salesRanking).toHaveBeenCalledWith(90);
    expect(body.data.map((p: { id: string }) => p.id)).toEqual([
      "sold-2",
      "sold-1",
      "unranked-new",
      "unranked-old",
    ]);
    expect(body.pagination.total).toBe(4);
  });
});
```

- [x] **Step 2: Run to verify failure** — `npm run test:run -- tests/unit/products-api.test.ts`. Expected: new tests FAIL (`sort` unknown).

- [x] **Step 3: Implement** in `src/app/api/products/route.ts`:

Add the import: `import { getSalesRanking } from "@/lib/product-queries";` and extract the current `select` object into a module-level `const LIST_SELECT = { ... }` (the object from Task 3, unchanged) so both query paths share it.

Replace the "Build order by" block and the query execution with:

```ts
const VALID_SORTS = ["new", "popular", "price-asc", "price-desc"] as const;
const sortParam = searchParams.get("sort");
const sort = (VALID_SORTS as readonly string[]).includes(sortParam ?? "")
  ? (sortParam as (typeof VALID_SORTS)[number])
  : sortParam !== null
    ? "new" // explicit but invalid → default
    : null; // absent → legacy path

let products;
let total: number;

if (sort === "popular") {
  const [rankedIds, matching, matchTotal] = await Promise.all([
    getSalesRanking(90),
    prisma.product.findMany({ where, select: { id: true, createdAt: true } }),
    prisma.product.count({ where }),
  ]);
  const rank = new Map(rankedIds.map((id, index) => [id, index]));
  const pageIds = matching
    .sort((a, b) => {
      const ra = rank.get(a.id);
      const rb = rank.get(b.id);
      if (ra !== undefined && rb !== undefined) return ra - rb;
      if (ra !== undefined) return -1;
      if (rb !== undefined) return 1;
      return b.createdAt.getTime() - a.createdAt.getTime();
    })
    .slice(skip, skip + limit)
    .map((p) => p.id);
  const rows = await prisma.product.findMany({
    where: { id: { in: pageIds } },
    select: LIST_SELECT,
  });
  // `in` does not preserve order — re-impose the page order.
  const byId = new Map(rows.map((r) => [r.id, r]));
  products = pageIds.map((id) => byId.get(id)).filter((p) => p !== undefined);
  total = matchTotal;
} else {
  const orderBy: Prisma.ProductOrderByWithRelationInput = {};
  if (sort === "price-asc") orderBy.price = "asc";
  else if (sort === "price-desc") orderBy.price = "desc";
  else if (sort === "new") orderBy.createdAt = "desc";
  else {
    // Legacy path (sort absent): sortBy/sortOrder exactly as before.
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const validSortFields = ["name", "price", "createdAt"];
    if (validSortFields.includes(sortBy)) {
      orderBy[sortBy as keyof Prisma.ProductOrderByWithRelationInput] =
        sortOrder === "asc" ? "asc" : "desc";
    }
  }
  const [rows, rowTotal] = await Promise.all([
    prisma.product.findMany({ where, select: LIST_SELECT, orderBy, skip, take: limit }),
    prisma.product.count({ where }),
  ]);
  products = rows;
  total = rowTotal;
}
```

(The old top-of-function `sortBy`/`sortOrder` reads move into the legacy branch; the response construction below stays as-is, now using `products`/`total`.)

- [x] **Step 4: Run to verify pass** — `npm run test:run -- tests/unit/products-api.test.ts` then the full suite `npm run test:run`. Expected: PASS everywhere.

- [x] **Step 5: Commit** — `git add src/app/api/products/route.ts tests/unit/products-api.test.ts && git commit -m "feat(catalog): sort param with popular ranking in /api/products"`

---

### Task 5: `/api/products/brands` — distinct brand list

**Files:**

- Create: `src/app/api/products/brands/route.ts`
- Test: `tests/unit/products-api.test.ts` (extend)

**Interfaces:**

- Produces: `GET /api/products/brands` → `string[]` of distinct non-null brands of active products, alphabetical. Task 8's FilterBar consumes it.

- [x] **Step 1: Write the failing tests** — append to `tests/unit/products-api.test.ts`:

```ts
import { GET as GET_BRANDS } from "@/app/api/products/brands/route";

describe("GET /api/products/brands", () => {
  it("returns distinct non-null brands of active products, alphabetical", async () => {
    findMany.mockResolvedValue([{ brand: "Mirox" }]);
    const res = await GET_BRANDS();
    expect(await res.json()).toEqual(["Mirox"]);
    expect(findMany).toHaveBeenCalledWith({
      where: { isActive: true, brand: { not: null } },
      distinct: ["brand"],
      select: { brand: true },
      orderBy: { brand: "asc" },
    });
  });
});
```

- [x] **Step 2: Run to verify failure** — module not found. Expected: FAIL.

- [x] **Step 3: Implement** — create `src/app/api/products/brands/route.ts`:

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/products/brands — distinct brands for the catalog filter
export async function GET() {
  try {
    const rows = await prisma.product.findMany({
      where: { isActive: true, brand: { not: null } },
      distinct: ["brand"],
      select: { brand: true },
      orderBy: { brand: "asc" },
    });
    return NextResponse.json(rows.map((row) => row.brand));
  } catch {
    return NextResponse.json({ error: "Failed to fetch brands" }, { status: 500 });
  }
}
```

- [x] **Step 4: Run to verify pass** — `npm run test:run -- tests/unit/products-api.test.ts`. Expected: PASS.

- [x] **Step 5: Commit** — `git add src/app/api/products/brands/route.ts tests/unit/products-api.test.ts && git commit -m "feat(catalog): /api/products/brands distinct-brand endpoint"`

---

### Task 6: ProductCard upgrades

**Files:**

- Modify: `src/components/products/ProductCard.tsx`
- Modify: `src/components/products/ProductImage.tsx` (add optional `className` passthrough)
- Modify: `src/lib/product-queries.ts` (`PRODUCT_CARD_SELECT` + `ProductCardData` gain `createdAt`)
- Test: `tests/unit/product-card.test.tsx`, `tests/unit/product-queries.test.ts`

**Interfaces:**

- Consumes: `isNewProduct` (Task 2).
- Produces: `ProductCardProps.product` gains optional `createdAt?: string | Date` and richer optional `variants?: { name: string; value: string }[]` (unchanged shape); new optional prop `onQuickView?: (opts: { focusSizes: boolean }) => void` — when provided (and product in stock for «В кошик»), a hover overlay renders the two quick-action buttons. `export const SIZE_ORDER` (moved from module-private to exported). `ProductImage` gains `className?: string`. Existing consumers pass no new props and render exactly as before.

- [x] **Step 1: Write the failing tests** — in `tests/unit/product-card.test.tsx`, update the out-of-stock test's expected text from `"Out of Stock"` to `"Немає в наявності"`, and append:

```ts
const now = Date.now();
const DAY_MS = 24 * 60 * 60 * 1000;

describe("ProductCard — TASK-036 upgrades", () => {
  it("shows НОВИНКА for a fresh product without discount", () => {
    render(
      <ProductCard
        product={{ ...base, comparePrice: null, createdAt: new Date(now - 5 * DAY_MS).toISOString() }}
      />
    );
    expect(screen.getByText("НОВИНКА")).toBeInTheDocument();
  });

  it("discount badge wins over НОВИНКА (one badge max)", () => {
    render(
      <ProductCard product={{ ...base, createdAt: new Date(now - 5 * DAY_MS).toISOString() }} />
    );
    expect(screen.getByText("-20%")).toBeInTheDocument();
    expect(screen.queryByText("НОВИНКА")).not.toBeInTheDocument();
  });

  it("renders no НОВИНКА badge for an old product", () => {
    render(
      <ProductCard
        product={{ ...base, comparePrice: null, createdAt: new Date(now - 60 * DAY_MS).toISOString() }}
      />
    );
    expect(screen.queryByText("НОВИНКА")).not.toBeInTheDocument();
  });

  it("renders display-only colour swatches from Color variants", () => {
    render(
      <ProductCard
        product={{
          ...base,
          variants: [
            { name: "Color", value: "Чорний" },
            { name: "Color", value: "Білий" },
            { name: "Color", value: "Чорний" }, // duplicate — one swatch only
          ],
        }}
      />
    );
    expect(screen.getByLabelText("Колір: Чорний")).toBeInTheDocument();
    expect(screen.getByLabelText("Колір: Білий")).toBeInTheDocument();
    expect(screen.getAllByLabelText(/^Колір:/)).toHaveLength(2);
  });

  it("renders quick-action buttons only when onQuickView is provided", () => {
    const onQuickView = vi.fn();
    render(<ProductCard product={base} onQuickView={onQuickView} />);
    fireEvent.click(screen.getByRole("button", { name: "Швидкий перегляд" }));
    expect(onQuickView).toHaveBeenCalledWith({ focusSizes: false });
    fireEvent.click(screen.getByRole("button", { name: "В кошик" }));
    expect(onQuickView).toHaveBeenCalledWith({ focusSizes: true });
    // still a single link — buttons are siblings of the anchor, not nested in it
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("hides «В кошик» (but keeps quick view) when out of stock", () => {
    render(<ProductCard product={{ ...base, stock: 0 }} onQuickView={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Швидкий перегляд" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "В кошик" })).not.toBeInTheDocument();
  });

  it("renders a second image element only when images[1] exists", () => {
    const two = {
      ...base,
      images: [
        { url: "https://example.com/a.jpg", alt: "front" },
        { url: "https://example.com/b.jpg", alt: "back" },
      ],
    };
    const { unmount } = render(<ProductCard product={two} />);
    expect(screen.getByAltText("back")).toBeInTheDocument();
    expect(screen.getAllByRole("img")).toHaveLength(2); // front + hover image
    unmount();
    render(<ProductCard product={base} />);
    expect(screen.getAllByRole("img")).toHaveLength(1); // no hover layer without images[1]
  });
});
```

Add `vi` to the vitest import in that file. Note the existing "renders the whole card as a single link, with no separate View Product/Details button" test — its `queryByRole("button")` expectation stays valid because no `onQuickView` is passed there.

- [x] **Step 2: Run to verify failure** — `npm run test:run -- tests/unit/product-card.test.tsx`. Expected: FAIL on all new tests + the out-of-stock text change.

- [x] **Step 3: Implement.** In `ProductImage.tsx`: add `className?: string` to props, apply via `cn()` to the `<Image>` (import `cn` from `@/lib/utils`; spread onto the fallback div too so hover layering works with fallbacks). In `ProductCard.tsx`:

```tsx
import { isNewProduct } from "@/lib/product-badges";
import { cn } from "@/lib/utils";

/** Canonical display order; exported for the catalog filter chips (TASK-036). */
export const SIZE_ORDER = ["S", "M", "L", "XL", "XXL"] as const;

const COLOR_SWATCH_CLASSES: Record<string, string> = {
  Чорний: "bg-black border-border-strong",
  Білий: "bg-[#f5f5f5] border-border",
};
```

Props additions:

```ts
createdAt?: string | Date;
// ...
onQuickView?: (opts: { focusSizes: boolean }) => void;
```

Badge logic (single badge, spec §4 precedence — discount > НОВИНКА > out-of-stock):

```tsx
const badge = discount
  ? { label: `-${discount}%`, className: "bg-secondary border-border-strong text-foreground" }
  : product.createdAt && isNewProduct(product.createdAt)
    ? { label: "НОВИНКА", className: "bg-white text-black border-transparent" }
    : isOutOfStock
      ? { label: "Немає в наявності", className: "bg-secondary text-foreground" }
      : null;
```

Render one `<Badge>` from `badge` in the existing top-left slot (`rounded-full px-2.5 py-1 text-[10.5px] font-extrabold` retained). Keep `data-testid="product-card"` on the Card.

Structure — overlay lives **outside** the Link (buttons inside an `<a>` are invalid HTML):

```tsx
<Card
  className="group hover-lift relative overflow-hidden shadow-[var(--shadow-soft)]"
  data-testid="product-card"
>
  <Link href={`/products/${product.slug}`} className="block" aria-label={product.name}>
    <div className="bg-muted relative aspect-square overflow-hidden">
      <ProductImage
        src={product.images[0]?.url}
        alt={product.images[0]?.alt || product.name}
        sizes={IMAGE_SIZES.productCard}
        className={cn(hasHoverImage && "transition-opacity duration-300 group-hover:opacity-0")}
      />
      {hasHoverImage && (
        <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <ProductImage
            src={product.images[1]!.url}
            alt={product.images[1]!.alt || product.name}
            sizes={IMAGE_SIZES.productCard}
          />
        </div>
      )}
      {/* badge markup here (inside the link, pointer-events-none) */}
    </div>
    <CardContent className="p-4">
      {/* category, name, prices via formatPrice, swatches, sizes row */}
    </CardContent>
  </Link>
  {onQuickView && (
    <div className="pointer-events-none absolute inset-x-0 top-0 hidden aspect-square items-end justify-center gap-2 p-3 opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100 md:flex">
      <button
        type="button"
        onClick={() => onQuickView({ focusSizes: false })}
        className="border-border-strong pointer-events-auto rounded-[10px] border bg-black/80 px-3 py-2 text-[12px] font-bold backdrop-blur-sm hover:border-white"
      >
        Швидкий перегляд
      </button>
      {!isOutOfStock && (
        <button
          type="button"
          onClick={() => onQuickView({ focusSizes: true })}
          className="pointer-events-auto rounded-[10px] bg-white px-3 py-2 text-[12px] font-extrabold text-black hover:bg-[#e5e5e5]"
        >
          В кошик
        </button>
      )}
    </div>
  )}
</Card>
```

with `const hasHoverImage = Boolean(product.images[1]?.url);`. Swatches in CardContent:

```tsx
const colorValues = Array.from(
  new Set(product.variants?.filter((v) => v.name === "Color").map((v) => v.value) ?? [])
).filter((value) => value in COLOR_SWATCH_CLASSES);
// ...
{
  colorValues.length > 0 && (
    <div className="mt-2 flex gap-1.5">
      {colorValues.map((value) => (
        <span
          key={value}
          role="img"
          aria-label={`Колір: ${value}`}
          title={value}
          className={cn("h-4 w-4 rounded-full border", COLOR_SWATCH_CLASSES[value])}
        />
      ))}
    </div>
  );
}
```

In `product-queries.ts`: add `createdAt: true` to `PRODUCT_CARD_SELECT` and `createdAt: Date | string` to `ProductCardData` — homepage rails then show НОВИНКА consistently. Note: `ProductCardData` crosses a server→client boundary in rails; Next serializes `Date` fine in RSC props, but keep the type union so catalog JSON (string) also fits.

- [x] **Step 4: Run to verify pass** — `npm run test:run -- tests/unit/product-card.test.tsx tests/unit/product-queries.test.ts`, then full `npm run test:run` (home-page/product-rail/showcase tests must stay green — card is additive).

- [x] **Step 5: Commit** — `git add -A src/components/products src/lib/product-queries.ts tests/unit/product-card.test.tsx tests/unit/product-queries.test.ts && git commit -m "feat(catalog): ProductCard badges, swatches, hover image, quick actions"`

---

### Task 7: QuickViewDialog

**Files:**

- Create: `src/components/products/QuickViewDialog.tsx`
- Modify: `src/components/products/index.ts` (export)
- Test: `tests/unit/quick-view-dialog.test.tsx`

**Interfaces:**

- Consumes: `useCartStore` (`addItem`, `openCart` — signatures in `src/stores/cart.store.ts`), `trackAddToCart(item: GA4Item)` from `@/lib/analytics`, `formatPrice`, `SIZE_ORDER` (Task 6), `ProductImage`.
- Produces:

```ts
export interface QuickViewProduct {
  id: string;
  name: string;
  slug: string;
  price: string;
  comparePrice: string | null;
  stock: number;
  category?: { name: string; slug: string };
  images: { url: string; alt: string | null }[];
  variants: { id: string; name: string; value: string; stock: number; price: string | null }[];
}
export function QuickViewDialog(props: {
  product: QuickViewProduct | null;
  focusSizes: boolean;
  onOpenChange: (open: boolean) => void;
}): JSX.Element;
```

Open when `product !== null`. Task 8 consumes it.

- [x] **Step 1: Write the failing tests** — create `tests/unit/quick-view-dialog.test.tsx`:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/analytics", () => ({ trackAddToCart: vi.fn() }));

import { QuickViewDialog } from "@/components/products/QuickViewDialog";
import { useCartStore } from "@/stores/cart.store";
import { trackAddToCart } from "@/lib/analytics";

const product = {
  id: "p1",
  name: "Худі Mirox Basic",
  slug: "hudi-mirox-basic",
  price: "1290",
  comparePrice: null,
  stock: 42,
  category: { name: "Худі", slug: "hudi" },
  images: [{ url: "https://example.com/a.jpg", alt: "front" }],
  variants: [
    { id: "v-s", name: "Size", value: "S", stock: 5, price: null },
    { id: "v-m", name: "Size", value: "M", stock: 8, price: null },
    { id: "v-black", name: "Color", value: "Чорний", stock: 30, price: null },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  useCartStore.setState({ items: [], isOpen: false });
});

describe("QuickViewDialog", () => {
  it("requires a size before adding to cart", () => {
    render(<QuickViewDialog product={product} focusSizes={false} onOpenChange={vi.fn()} />);
    const addButton = screen.getByRole("button", { name: /додати в кошик/i });
    expect(addButton).toBeDisabled();
  });

  it("adds the selected size variant to the cart, tracks GA4, opens the drawer", () => {
    const onOpenChange = vi.fn();
    render(<QuickViewDialog product={product} focusSizes onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByRole("button", { name: "M" }));
    fireEvent.click(screen.getByRole("button", { name: /додати в кошик/i }));

    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      productId: "p1",
      variantId: "v-m",
      name: "Худі Mirox Basic — M",
      price: 1290,
      maxStock: 8,
      quantity: 1,
    });
    expect(useCartStore.getState().isOpen).toBe(true);
    expect(trackAddToCart).toHaveBeenCalledWith(
      expect.objectContaining({ item_id: "p1", item_variant: "M", price: 1290, quantity: 1 })
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("disables out-of-stock size chips", () => {
    const oos = {
      ...product,
      variants: [{ id: "v-s", name: "Size", value: "S", stock: 0, price: null }],
    };
    render(<QuickViewDialog product={oos} focusSizes={false} onOpenChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "S" })).toBeDisabled();
  });

  it("allows adding without size selection when the product has no Size variants", () => {
    const sizeless = { ...product, variants: [] };
    render(<QuickViewDialog product={sizeless} focusSizes={false} onOpenChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /додати в кошик/i }));
    expect(useCartStore.getState().items[0]).toMatchObject({
      productId: "p1",
      variantId: undefined,
      maxStock: 42,
    });
  });

  it("uses the variant price when the variant has its own", () => {
    const priced = {
      ...product,
      variants: [{ id: "v-l", name: "Size", value: "L", stock: 3, price: "1390" }],
    };
    render(<QuickViewDialog product={priced} focusSizes={false} onOpenChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "L" }));
    fireEvent.click(screen.getByRole("button", { name: /додати в кошик/i }));
    expect(useCartStore.getState().items[0].price).toBe(1390);
  });

  it("renders a PDP link «Детальніше»", () => {
    render(<QuickViewDialog product={product} focusSizes={false} onOpenChange={vi.fn()} />);
    expect(screen.getByRole("link", { name: /детальніше/i })).toHaveAttribute(
      "href",
      "/products/hudi-mirox-basic"
    );
  });
});
```

- [x] **Step 2: Run to verify failure** — `npm run test:run -- tests/unit/quick-view-dialog.test.tsx`. Expected: FAIL — module not found.

- [x] **Step 3: Implement** `src/components/products/QuickViewDialog.tsx` (`"use client"`). Key structure:

```tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useCartStore } from "@/stores/cart.store";
import { trackAddToCart } from "@/lib/analytics";
import { formatPrice } from "@/lib/format";
import { IMAGE_SIZES } from "@/lib/image-utils";
import { cn } from "@/lib/utils";
import { ProductImage } from "./ProductImage";
import { SIZE_ORDER } from "./ProductCard";
```

Behavior requirements (all covered by the tests above):

- `open={product !== null}`; on `product` change reset `selectedSizeId` to `null`.
- `sizes` = `product.variants.filter((v) => v.name === "Size")`, ordered by `SIZE_ORDER` first then first-seen (reuse the ordering approach from `getSizeLabel`); each renders a chip `<button>` (52px min-width look per handoff: `border border-[#333] rounded-[7px] px-3 py-2 text-[12.5px] font-bold`, active = `bg-white text-black`), `disabled` when `variant.stock <= 0`.
- Colour swatches: same display-only markup as ProductCard (dedupe Color values, known-color map).
- `focusSizes` — `useEffect` focusing the size group container (`ref` + `tabIndex={-1}` + `.focus()`) when the dialog opens with `focusSizes === true`.
- Add button: label «ДОДАТИ В КОШИК», `disabled={sizes.length > 0 && !selectedSize}`. On click:

```tsx
const selectedSize = sizes.find((v) => v.id === selectedSizeId) ?? null;
const price = selectedSize?.price ? parseFloat(selectedSize.price) : parseFloat(product.price);
addItem({
  productId: product.id,
  variantId: selectedSize?.id,
  name: selectedSize ? `${product.name} — ${selectedSize.value}` : product.name,
  price,
  image: product.images[0]?.url,
  maxStock: selectedSize ? selectedSize.stock : product.stock,
});
trackAddToCart({
  item_id: product.id,
  item_name: selectedSize ? `${product.name} — ${selectedSize.value}` : product.name,
  item_category: product.category?.name,
  item_variant: selectedSize?.value,
  price,
  quantity: 1,
});
openCart();
onOpenChange(false);
```

- Prices via `formatPrice(parseFloat(...))`, struck `comparePrice` when higher.
- «Детальніше →» is a `<Link href={`/products/${product.slug}`}>`.
- `DialogTitle` = product name (Radix a11y requirement).
- Export from `src/components/products/index.ts`.

- [x] **Step 4: Run to verify pass** — `npm run test:run -- tests/unit/quick-view-dialog.test.tsx`. Expected: PASS.

- [x] **Step 5: Commit** — `git add src/components/products tests/unit/quick-view-dialog.test.tsx && git commit -m "feat(catalog): QuickViewDialog for quick-view/quick-buy"`

---

### Task 8: Catalog page rewrite (filter bar, grid, pagination, UA copy)

**Files:**

- Create: `src/app/(shop)/products/filter-bar.tsx`
- Modify: `src/app/(shop)/products/products-content.tsx`
- Test: `tests/unit/filter-bar.test.tsx`

**Interfaces:**

- Consumes: API params from Tasks 3–5, `ProductCard` `onQuickView` (Task 6), `QuickViewDialog` + `QuickViewProduct` (Task 7).
- Produces:

```ts
// filter-bar.tsx
export type CatalogSort = "new" | "popular" | "price-asc" | "price-desc";
export interface CatalogFilters {
  size: string | null;
  color: string | null;
  brand: string | null;
  inStock: boolean;
  minPrice: number | null;
  maxPrice: number | null;
  search: string | null;
  category: string | null;
  sort: CatalogSort;
}
export function FilterBar(props: {
  filters: CatalogFilters;
  brands: string[];
  onChange: (updates: Record<string, string | null>) => void; // null deletes the param; page resets to 1
  onClearAll: () => void;
}): JSX.Element;
```

- [x] **Step 1: Write the failing tests** — create `tests/unit/filter-bar.test.tsx` (no router needed — FilterBar is controlled via props):

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FilterBar, type CatalogFilters } from "@/app/(shop)/products/filter-bar";

const filters: CatalogFilters = {
  size: null,
  color: null,
  brand: null,
  inStock: false,
  minPrice: null,
  maxPrice: null,
  search: null,
  category: null,
  sort: "new",
};

describe("FilterBar", () => {
  it("toggles a size chip on and off", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <FilterBar filters={filters} brands={[]} onChange={onChange} onClearAll={vi.fn()} />
    );
    fireEvent.click(screen.getByRole("button", { name: "M" }));
    expect(onChange).toHaveBeenCalledWith({ size: "M" });
    rerender(
      <FilterBar
        filters={{ ...filters, size: "M" }}
        brands={[]}
        onChange={onChange}
        onClearAll={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "M" }));
    expect(onChange).toHaveBeenLastCalledWith({ size: null });
  });

  it("renders all five size chips S–XXL", () => {
    render(<FilterBar filters={filters} brands={[]} onChange={vi.fn()} onClearAll={vi.fn()} />);
    for (const s of ["S", "M", "L", "XL", "XXL"]) {
      expect(screen.getByRole("button", { name: s })).toBeInTheDocument();
    }
  });

  it("emits sort selection from the sort buttons", () => {
    const onChange = vi.fn();
    render(<FilterBar filters={filters} brands={[]} onChange={onChange} onClearAll={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Ціна ↑" }));
    expect(onChange).toHaveBeenCalledWith({ sort: "price-asc" });
    fireEvent.click(screen.getByRole("button", { name: "Популярні" }));
    expect(onChange).toHaveBeenCalledWith({ sort: "popular" });
  });

  it("marks the active sort button with aria-pressed", () => {
    render(
      <FilterBar
        filters={{ ...filters, sort: "popular" }}
        brands={[]}
        onChange={vi.fn()}
        onClearAll={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: "Популярні" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: "Новинки" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  it("shows a removable chip for an active search", () => {
    const onChange = vi.fn();
    render(
      <FilterBar
        filters={{ ...filters, search: "худі" }}
        brands={[]}
        onChange={onChange}
        onClearAll={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /скинути пошук/i }));
    expect(onChange).toHaveBeenCalledWith({ search: null });
  });
});
```

- [x] **Step 2: Run to verify failure** — `npm run test:run -- tests/unit/filter-bar.test.tsx`. Expected: FAIL — module not found.

- [x] **Step 3: Implement `filter-bar.tsx`** (`"use client"`). Layout per the mock (`Mirox Catalog.dc.html` lines 49–69):

- Wrapping flex row, `gap-2.5`, `flex-wrap`, `mb-8`; on mobile (`max-md`) the chip row becomes `overflow-x-auto flex-nowrap` (per `Mirox Mobile.dc.html`).
- **«Фільтри»** button (SlidersHorizontal icon + label, `border border-[#333] rounded-[10px] px-4 py-2.5 text-[13px] font-bold`) opens a shadcn `Sheet` (side="left") containing: price `Slider` (0–2000, step 10) + «Застосувати» button emitting `{ minPrice, maxPrice }` (null when at the bounds), brand radio list (from `brands` prop), size chips, colour options (Чорний/Білій — fixed per spec), availability toggle, and «Скинути все» calling `onClearAll`.
- **«Ціна ▾»** — shadcn `Popover` with the same slider + apply (desktop path; `hidden md:inline-flex` on the trigger).
- **«Бренд ▾»** — `Popover` listing `brands`; click emits `{ brand }` or `{ brand: null }` to clear.
- **Розмір** — inline bordered group (`border border-[#262626] rounded-[10px] px-2 py-1.5` with label «Розмір:»), chips from `SIZE_ORDER` (import from `@/components/products/ProductCard`): `aria-pressed`, active = `bg-white text-black`, inactive = `text-[#a3a3a3] border-[#333]`; click toggles (`{ size: value }` / `{ size: null }`).
- **«Колір ▾»** — `Popover` with Чорний/Білий rows (swatch circle + label), emits `{ color }`.
- **«Наявність ▾»** — `Popover` with «Всі товари» / «В наявності», emits `{ inStock: "true" }` / `{ inStock: null }`.
- Active dropdown-chip triggers get white-active styling when their filter is set (e.g. brand chip white when `filters.brand !== null`).
- Right side (`md:ml-auto`): «Сортування:» muted label + 4 buttons «Новинки» / «Популярні» / «Ціна ↑» / «Ціна ↓» mapping to `sort` values `new`/`popular`/`price-asc`/`price-desc`, `aria-pressed` on active, white-active styling.
- Removable chips row beneath when `search`/`category` present: «Пошук: {q}» with an X button `aria-label="Скинути пошук"` emitting `{ search: null }`; «Категорія: {slug}» with `aria-label="Скинути категорію"` emitting `{ category: null }`.

**Rewrite `products-content.tsx`:**

- Keep: `Suspense` wrapper, `fetchProducts` URL-driven pattern, GA4 `view_item_list`/`select_item` wiring, `updateFilters` (URL merge + `page=1` reset), `handlePageChange`.
- `Product` interface gains `createdAt: string;` and `variants: { id: string; name: string; value: string; stock: number; price: string | null }[];` (satisfies `QuickViewProduct`).
- `fetchProducts` forwards the new params from `searchParams`: `size`, `color`, `brand`, `inStock`, `sort` (drop the always-set legacy `sortBy`/`sortOrder` — the API defaults `sort` to `new`; legacy URLs still work because their params pass through untouched: forward `sortBy`/`sortOrder` only when present).
- Fetch brands once: `useEffect` → `/api/products/brands` → `string[]` state (bare `catch`, default `[]`).
- Header block per mock: breadcrumb `Головна / Каталог` (Link to `/`), `<h1 className="text-[40px] font-extrabold tracking-[-0.02em]">Каталог</h1>`.
- Render `<FilterBar filters={...} brands={brands} onChange={updateFilters} onClearAll={clearFilters} />` — build `filters` from `searchParams` each render (single-source-of-truth: URL). `clearFilters` = `router.push("/products")`.
- Grid: `<div className="grid grid-cols-2 gap-3 md:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] md:gap-5">`; each card gets `onQuickView={(opts) => setQuickView({ product, focusSizes: opts.focusSizes })}` plus the existing `trackSelectItem` wrapper.
- Quick-view state: `const [quickView, setQuickView] = useState<{ product: Product; focusSizes: boolean } | null>(null);` → `<QuickViewDialog product={quickView?.product ?? null} focusSizes={quickView?.focusSizes ?? false} onOpenChange={(open) => !open && setQuickView(null)} />`.
- Empty state: Package icon, «Нічого не знайдено», «Спробуйте змінити фільтри або пошуковий запит.», button «Скинути фільтри» → `clearFilters`.
- Pagination (inline in `products-content.tsx` — small enough): centered flex, `←` button (when `hasPrev`), numbered `h-9 w-9` (36px) squares `rounded-[9px] border`, active = `bg-white text-black border-[#333]`, inactive = `border-[#262626] text-[#a3a3a3]`; `→` (when `hasNext`). All page numbers rendered when `totalPages <= 7`, else window of current ±2 with first/last. `aria-current="page"` on active.
- Loading skeleton: keep the existing token-based skeleton, adjust grid classes to match the new grid.
- Delete: search form, category `Select`s, sort `Select`, old active-filter badges (replaced by FilterBar chips), old Sheet contents (replaced by FilterBar's Sheet).
- All copy Ukrainian: «Каталог», counts line optional per mock (omit — mock shows none).

- [x] **Step 4: Run to verify pass** — `npm run test:run -- tests/unit/filter-bar.test.tsx`, then full `npm run test:run`, then `npm run typecheck`.

- [x] **Step 5: Manual smoke** — `npm run dev`, open `http://localhost:3000/products`: filters combine and reflect in the URL, sort buttons white-activate, quick view adds to cart and opens the drawer, pagination squares render. (Full visual gate is Task 11.)

- [x] **Step 6: Commit** — `git add "src/app/(shop)/products" tests/unit/filter-bar.test.tsx && git commit -m "feat(catalog): Mirox filter bar, grid, square pagination, quick view wiring"`

---

### Task 9: Header nav retarget + search trigger label

**Files:**

- Modify: `src/components/common/Header.tsx`
- Test: `tests/unit/header.test.tsx`

**Interfaces:**

- Produces: nav «Новинки» → `/products?sort=new`, «Бестселери» → `/products?sort=popular`; the header search icon button gains `aria-label="Пошук"` (consumed by Task 10's E2E retarget).

- [x] **Step 1: Update the failing tests** — in `tests/unit/header.test.tsx` change the two href assertions (currently lines ~35–41): «Новинки» → `"/products?sort=new"`, «Бестселери» → `"/products?sort=popular"`. Add:

```ts
it("labels the search trigger for a11y and E2E", () => {
  renderHeader(); // use this file's existing render helper/pattern
  expect(screen.getByRole("button", { name: "Пошук" })).toBeInTheDocument();
});
```

- [x] **Step 2: Run to verify failure** — `npm run test:run -- tests/unit/header.test.tsx`. Expected: FAIL on all three.

- [x] **Step 3: Implement** — in `Header.tsx`: update the two `navigation` entries (line ~42–44); add `aria-label="Пошук"` to the search icon `<Button>` (the one calling `setSearchOpen(true)`; there may be desktop + mobile instances — label every search trigger; `getByRole` in the test should then use `getAllByRole(...)` if more than one renders).

- [x] **Step 4: Run to verify pass** — `npm run test:run -- tests/unit/header.test.tsx`. Expected: PASS.

- [x] **Step 5: Commit** — `git add src/components/common/Header.tsx tests/unit/header.test.tsx && git commit -m "feat(catalog): retarget Новинки/Бестселери nav to sort params"`

---

### Task 10: E2E updates

**Files:**

- Modify: `tests/e2e/products.spec.ts`

**Interfaces:**

- Consumes: sort buttons + size chips (Task 8), header search label (Task 9). The hydration-gate comment and `waitForSelector("[data-testid='product-card']")` lines are **not modified**.

- [x] **Step 1: Update the sort test** — replace the combobox-based `"can sort products"` with:

```ts
test("can sort products", async ({ page }) => {
  await page.goto("/products");
  await page.waitForSelector("[data-testid='product-card']");

  await Promise.all([
    page.waitForURL(/sort=price-asc/, { timeout: 15000 }),
    page.getByRole("button", { name: "Ціна ↑" }).click(),
  ]);

  await page.waitForSelector("[data-testid='product-card']");
  await expect(page).toHaveURL(/sort=price-asc/);
});
```

- [x] **Step 2: Retarget the search test to the Header** — replace the body of `"can filter products by search"` (keep the hydration-gate comment + waitForSelector):

```ts
// Search moved to the Header dialog in TASK-036 (the catalog filter bar
// has no search input, per the Mirox mock).
await page.getByRole("button", { name: "Пошук" }).first().click();
const searchInput = page.getByPlaceholder(/search/i);
await searchInput.fill("test");
await searchInput.press("Enter");
await page.waitForURL(/search=test/, { timeout: 15000 });
await expect(page).toHaveURL(/search=test/);
```

(This drops the `isMobile` branch — Enter submits on both. Keep the `isMobile` fixture out of the signature if unused.)

- [x] **Step 3: Add the size-filter smoke test**:

```ts
test("size filter chip updates URL and grid", async ({ page }) => {
  await page.goto("/products");
  await page.waitForSelector("[data-testid='product-card']");

  await Promise.all([
    page.waitForURL(/size=M/, { timeout: 15000 }),
    page.getByRole("button", { name: "M", exact: true }).first().click(),
  ]);

  await page.waitForSelector("[data-testid='product-card']");
});
```

Note for mobile projects: the size chips live in the scrollable chip row — if the chip is off-screen, Playwright auto-scrolls; if the mobile layout puts sizes only inside the «Фільтри» sheet, open the sheet first with `page.getByRole("button", { name: "Фільтри" }).click()` guarded by `isMobile`. Match the implementation from Task 8.

- [x] **Step 4: Run E2E locally** — infra first: `docker-compose up -d`, DB seeded (`npm run db:seed` — verify `DATABASE_URL` points at local Postgres first, `.env` duplicate-URL footgun), then `npm run test:e2e`. Expected: all products/navigation specs green on all five local projects.

- [x] **Step 5: Commit** — `git add tests/e2e/products.spec.ts && git commit -m "test(e2e): sort buttons, header search, size-filter smoke for TASK-036"`

---

### Task 11: Full verification, visual-fidelity gate, docs

**Files:**

- Modify: `docs/planning/BACKLOG.md`, `docs/planning/plans/2026-07-31_task-036-catalog-redesign-filters.md` (progress log)

- [x] **Step 1: Full local verification** — run and confirm green, in order:

```bash
npm run lint
npm run typecheck
npm run format:check
npm run test:run
npm run build
npm run test:e2e
```

- [x] **Step 2: Visual-fidelity gate (standing rule)** — with `npm run dev` running: screenshot `/products` at 1440×900 and 390×844; open `docs/design/design_handoff_mirox/Mirox Catalog.dc.html` and `Mirox Mobile.dc.html` in a browser and screenshot the catalog views; present side-by-sides to the user and get **explicit sign-off**. Declared deviations (spec §8): 4th sort button «Популярні», functional «Фільтри» sheet, card colour swatches, quick-action hover overlay.

- [x] **Step 3: BACKLOG entries** (🟤 Auto-Generated, `### [date] From: TASK-036 implementation`):
  - TASK-056 client-asset item: 7 products lack a second (back-view) image, so hover-swap only demos on Худі Mirox Basic (`[possible-dup-of:` check existing TASK-056 entries first`]`).
  - PDP cart-line naming: `product-detail-client.tsx` uses `${product.name} - ${selectedVariant.name}` — `variant.name` is `"Size"`/`"Color"`, producing lines like «Худі — Size»; QuickViewDialog uses `variant.value`. Align PDP later.

- [x] **Step 4: Commit docs** — `git add docs/planning && git commit -m "docs(task-036): backlog extracts + plan progress log"`

- [ ] **Step 5: User approval → completion workflow** — after sign-off: push branch, open PR (CI must be green — check the check-runs, not just reviews), then the CLAUDE.md completion workflow (Extract → Archive → Transition → Commit → Capture learnings) after merge approval.

---

## Self-review notes (spec coverage)

- Spec §3 filters/params → Tasks 3–4; brands source → Task 5; legacy-link back-compat → Task 4 (legacy branch preserved verbatim).
- Spec §4 filter bar/grid/pagination/card/dialog/copy → Tasks 6–8; Header nav → Task 9.
- Spec §5 badge rule → Task 2 + Task 6; degradation paths → Tasks 6–7 tests; empty state → Task 8; analytics → Tasks 7–8.
- Spec §6 testing → Tasks 1–10; hydration gate untouched → Task 10 constraint; visual gate → Task 11.
- Spec §7 out-of-scope respected: no category-page/PDP changes (PDP naming oddity goes to BACKLOG, not fixed here).

---

## Progress Log

**2026-07-31 — Tasks 1–9 (TDD build-out)**: `getSalesRanking()` extraction, `isNewProduct()` badge
helper, `/api/products` five-filter + richer-select support, `sort` param (incl. `popular` via
`getSalesRanking`), `/api/products/brands`, `ProductCard` upgrades (badges/swatches/hover
image/quick actions), `QuickViewDialog`, the catalog page rewrite (`filter-bar.tsx` + grid +
pagination + Ukrainian copy), and the Header nav retarget (`Новинки`/`Бестселери` → `sort=new`/
`sort=popular` + `aria-label="Пошук"`) all landed test-first, one commit per task
(`9119422` → `36e1737`). A same-day fix round after `b1c326e` addressed a click-tracking bubbling
issue (`d39a01a`). See each task's own report (`task-1-report.md` … `task-9-report.md`) for
per-task detail.

**2026-07-31 — Task 10 (E2E updates) + fix round 2**: Updated `products.spec.ts`'s sort/search
tests and added a size-filter smoke test (`b0d9672`). A follow-up review round found and fixed a
real product bug — `ProductCard`'s quick-action buttons kept `pointer-events-auto` while their
container was invisible, intercepting clicks meant for the underlying product link — via
`group-hover`/`group-focus-within`-gated `pointer-events-none→auto` (`07b9ecd`, plus a jsdom
regression test), and retargeted 3 `products.spec.ts` tests + 2 stale `navigation.spec.ts` href
assertions (`sortBy=createdAt`/`featured=true` → the new `sort=new`/`sort=popular` hrefs)
(`bf60b89`). During that round's triage, a dev-server-only navigation race was diagnosed via
Playwright trace (aborted RSC prefetch racing a webpack HMR push on the _first_ navigation to a
not-yet-compiled route) and confirmed structurally impossible against a production build/CI. Full
detail in `task-10-report.md`.

**2026-08-01 — Task 11 (final verification, visual gate, docs)**:

- **Static/unit verification, all green**: `npm run lint` (clean), `npm run typecheck` (clean),
  `npm run format:check` (one pre-existing warning in the uncommitted, out-of-scope
  `.claude/settings.local.json` — not a project source/test file), `npm run test:run` (33 test
  files, 493 tests passed + 1 todo, matching Task 10's baseline).
- **Build**: `npm run build` succeeded cleanly (with the known, already-documented non-standard
  `NODE_ENV` warning, harmless — pending the devcontainer rebuild that will remove it). The
  Prisma/TypeScript build failure task-10-report.md flagged under `products/brands/route.ts` did
  not reproduce here; a fresh `prisma generate` + `next build` cleared it, consistent with it
  having been a stale-client artifact rather than a branch-caused regression.
- **E2E, full suite, one project per foreground command** (`--reporter=line`, `timeout: 590000`,
  fresh `next dev` per command, DB already seeded — 8 categories / 8 active products verified via
  Prisma count, no reseed needed): a blind product-card click in `tests/e2e/cart.spec.ts` (4
  tests) collided with the Task 6 quick-action hover overlay, exactly as anticipated — retargeted
  all 4 to click the card heading via `.getByRole("heading")`, the same pattern Task 10 already
  applied to `products.spec.ts` (verified fixed: 6/6 on chromium in isolation). Checked
  `home.spec.ts`'s suspected stale `sortBy=createdAt` CTA assertion against actual behavior first
  — it's real: `src/content/home.ts`'s `secondaryCta.href` was never touched by TASK-036 (only
  `Header.tsx`'s nav array was retargeted in Task 9), so the test still matches the app; left
  unmodified (home.spec.ts passes 6/6 as-is).
  | Project | Passed | Failed | Notes |
  |---|---|---|---|
  | chromium | 23 | 1 | pre-existing `navigation.spec.ts` "can navigate to products page" only |
  | firefox | 23 | 1 | same pre-existing failure only |
  | Mobile Chrome | 23 | 1 | same pre-existing failure only |
  | webkit | 19 | 5 | pre-existing failure + non-deterministic WebKit-only dev-server race (different failing tests across 2 runs) |
  | Mobile Safari | 19 | 5 | same WebKit-family race |

  Every failure beyond the single deterministic pre-existing one (`navigation.spec.ts` "can
  navigate to products page", confirmed reproducing byte-identically on `main` in Task 10's
  triage) is the dev-server-only compile/HMR navigation race already diagnosed with trace evidence
  in Task 10's fix round 2 — confirmed non-deterministic here by re-running webkit twice and
  getting two different failing-test sets, and confirmed WebKit-family-specific (only webkit +
  Mobile Safari affected, never Chromium/Firefox/Mobile Chrome). Cannot occur against CI's
  production build (no on-demand compilation, no Fast Refresh). No source or test change applies;
  documented in BACKLOG.

- **Test-file changes this task**: `tests/e2e/cart.spec.ts` only (4 click-target retargets, no
  hydration-gate lines touched). No `src/**` changes were needed.
- **Visual-fidelity gate artifacts produced** (not committed — `.superpowers/` is gitignored):
  `catalog-desktop.png` (1440×900), `catalog-mobile.png` (390×844) from the live `/products` page,
  and `mock-desktop.png` / `mock-mobile.png` from the design handoff HTML files, all under
  `.superpowers/sdd/2026-07-31_task-036-catalog-redesign-filters/visual/`, captured via a
  throwaway Playwright spec/config reusing the repo's dev-server `webServer` settings. Visual
  spot-check: live `/products` matches the mock's dark theme, filter bar, badges, swatches, and
  square pagination at both breakpoints; the mock's own `Mirox Mobile.dc.html` is a 3-frame
  desktop-style overview page (Home/Catalog/Product side by side, each 390px), not a real
  responsive single-page render, so its screenshot is 1368px wide — the catalog frame is the
  middle panel. Presenting these to the user for explicit sign-off is the controller's next step,
  not completed by this task.
- **BACKLOG**: added 5 🟤 Auto-Generated entries under `### [2026-07-31] From: TASK-036
implementation` (all claims verified against source before writing): the 7-of-8-products
  missing-second-image asset gap (checked for an existing TASK-056 dup — none found, closest
  neighbor is a different finding), the PDP cart-line naming bug (`variant.name` vs
  `variant.value`, verified against both `product-detail-client.tsx` and `QuickViewDialog.tsx`),
  the pre-existing/dev-server-race E2E failures documented above, `sort=popular`'s in-memory
  full-scan ranking (verified in `route.ts`), and `filter-bar.tsx`'s `FiltersSheet`
  duplication + `COLOR_SWATCH_CLASSES` token/hex drift against `ProductCard.tsx` (verified both
  definitions and the ~150-line `FiltersSheet` span).
- **Deviations from the brief**: none requiring `src/**` changes or a BLOCKED report — the one
  anticipated fix (cart.spec.ts) and one suspected-but-not-actual fix (home.spec.ts) were both
  resolved within the E2E-spec-file scope the brief allowed.

Step 5 (push branch, open PR, post-merge completion workflow) is intentionally left for after
human visual-gate sign-off — outside this task's scope.
