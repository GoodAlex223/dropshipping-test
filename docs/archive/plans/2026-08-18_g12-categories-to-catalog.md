# G12 Categories-to-Catalog Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retire the pre-Mirox `/categories/[slug]` page in favor of the catalog: a two-level parent rollup in `/api/products` (closes the launch-visible «Всі» = 0 bug), a DB-driven category facet in the catalog `FilterBar`, a thin 307 redirect from `/categories/<slug>` to `/products?category=<slug>`, and a desktop «Категорії» nav entry.

**Architecture:** The rollup nests a two-level OR inside `where.category` (top-level `where.OR` is owned by the search filter). Category data reaches the `FilterBar` client-side exactly like brands: one mount-effect in `products-content.tsx` fetching `/api/categories?parentOnly=true`, passed down as a required prop. The facet renders as a desktop popover chip + a mobile FiltersSheet section, hidden entirely when the list is empty. The old category page shrinks to an unvalidated `redirect()` call; its client component, metadata helper, sitemap rows, and orphaned catalog key are deleted.

**Tech Stack:** Next.js 14 App Router, Prisma (PostgreSQL), next-intl 4.13 cookie mode, Radix Popover/Sheet via shadcn, Vitest + RTL (`renderWithIntl` helper), Prettier/ESLint via lint-staged.

**Spec:** `docs/superpowers/specs/2026-08-18-g12-categories-to-catalog-design.md` (read it first — decisions + rationale live there).

## Global Constraints

- TypeScript strict; `@/` alias for all src imports; double quotes, 2-space indent, 100-char width (Prettier runs on commit via lint-staged).
- API routes: bare `catch` when the error variable is unused; no `console.error` in API routes.
- Every UI string comes from `messages/uk.json` (+ mirrored RU draft entry) — never a hardcoded literal in a storefront component.
- Unit tests mock `@/lib/db` / `@/lib/auth` at module level BEFORE imports; component tests render via `renderWithIntl` (real `uk.json` messages, no message mocks).
- Commit style: `feat(g12):` / `fix(g12):` / `docs(g12):`; commit after each task; NEVER push without user approval.
- Branch: `feat/g12-categories-to-catalog` (already checked out; spec committed at `fc23733`).
- Do not touch `src/components/ui/*` (shadcn-managed), the E2E specs, or `/categories` index page styling (index restyle is explicitly out of scope).
- The docs-freshness linter (`tests/unit/docs-freshness.test.ts`) requires: this plan file has a `docs/README.md` index row (added with the plan); any doc whose `**Last Updated**` you bump needs its index row bumped in the same commit.

---

### Task 1: Two-level parent rollup in `/api/products`

**Files:**

- Modify: `src/app/api/products/route.ts:71-73`
- Test: `tests/unit/products-api.test.ts`

**Interfaces:**

- Consumes: existing `GET /api/products` handler; test helpers `createNextRequest`, `whereOf` (already in the test file).
- Produces: `where.category = { OR: [{ slug }, { parent: { slug } }] }` query semantics — Tasks 2–5 rely on a parent slug in the `category` URL param matching descendants' products.

- [x] **Step 1: Update the existing combined-filter test and add the rollup test**

In `tests/unit/products-api.test.ts`, replace the `category: { slug: "hudi" }` expectation inside the existing `"combines new filters with existing category and price params"` test with the new shape, and add one new test right after it:

```ts
it("combines new filters with existing category and price params", async () => {
  await GET(
    createNextRequest({
      url: "/api/products",
      searchParams: { size: "L", category: "hudi", minPrice: "500", maxPrice: "1500" },
    })
  );
  expect(whereOf()).toEqual(
    expect.objectContaining({
      category: { OR: [{ slug: "hudi" }, { parent: { slug: "hudi" } }] },
      price: { gte: 500, lte: 1500 },
      AND: [{ variants: { some: { name: "Розмір", value: "L" } } }],
    })
  );
});

it("rolls a parent slug up to descendants via a two-level category OR", async () => {
  await GET(createNextRequest({ url: "/api/products", searchParams: { category: "odyah" } }));
  expect(whereOf().category).toEqual({
    OR: [{ slug: "odyah" }, { parent: { slug: "odyah" } }],
  });
});
```

- [x] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/unit/products-api.test.ts`
Expected: the two tests above FAIL (received `{ slug: "hudi" }` / `{ slug: "odyah" }`); everything else passes.

- [x] **Step 3: Implement the rollup**

In `src/app/api/products/route.ts`, replace:

```ts
if (categorySlug) {
  where.category = { slug: categorySlug };
}
```

with:

```ts
if (categorySlug) {
  // Two-level rollup (G12): match the product's own category OR its
  // category's parent, so a parent slug lists descendants' products.
  // Must nest inside the relation filter — top-level where.OR is owned
  // by the search filter above.
  where.category = { OR: [{ slug: categorySlug }, { parent: { slug: categorySlug } }] };
}
```

- [x] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/unit/products-api.test.ts`
Expected: PASS (all tests in the file).

- [x] **Step 5: Typecheck (Prisma relation-filter shape must compile)**

Run: `npm run typecheck`
Expected: clean. (If `where.category = { OR: [...] }` errors against the generated Prisma types, the fallback shape is `where.category = { is: { OR: [...] } }` — update the two test expectations to match whichever form compiles.)

- [x] **Step 6: Commit**

```bash
git add src/app/api/products/route.ts tests/unit/products-api.test.ts
git commit -m "fix(g12): parent-category slugs roll up to descendants in /api/products"
```

---

### Task 2: Category facet + pill-name fix in `FilterBar`

**Files:**

- Modify: `src/app/(shop)/products/filter-bar.tsx`
- Modify: `src/app/(shop)/products/products-content.tsx` (temporary `categories={[]}` — Task 3 wires the real fetch)
- Modify: `messages/uk.json`, `messages/ru.json`
- Test: `tests/unit/filter-bar.test.tsx`

**Interfaces:**

- Consumes: existing `FilterBarProps`, `chipClasses`, `INACTIVE_ROW_HOVER`, `cn`, Radix `Popover`/`Sheet` imports (all already in `filter-bar.tsx`).
- Produces: `export interface CategoryFacetGroup { id: string; name: string; slug: string; children: { id: string; name: string; slug: string }[] }`; `FilterBarProps` gains required `categories: CategoryFacetGroup[]`; `FilterBar` and `FiltersSheet` accept and render it. Task 3 imports `CategoryFacetGroup` from `./filter-bar`.

- [x] **Step 1: Add the catalog keys**

In `messages/uk.json`, inside `products.filters` (next to `"colorTrigger"`), add:

```json
      "categoryTrigger": "Категорії",
      "categoryHeading": "Категорії",
```

In `messages/ru.json`, same position inside `products.filters`:

```json
      "categoryTrigger": "Категории",
      "categoryHeading": "Категории",
```

(RU is a DRAFT catalog — mirroring keeps the toggle coherent; the values match RU `header.categories` = «Категории».)

- [x] **Step 2: Write the failing tests**

In `tests/unit/filter-bar.test.tsx`: add `categories={[]}` to EVERY pre-existing `<FilterBar ...>` render (initial renders and `rerender(wrapIntl(...))` calls alike — the prop is required, the file won't typecheck without it). Then add this fixture after the existing `filters` const, and the new describe block at the end of the file:

```tsx
const categoryGroups = [
  {
    id: "c1",
    name: "Одяг",
    slug: "odyah",
    children: [
      { id: "c2", name: "Худі", slug: "hudi" },
      { id: "c3", name: "Футболки", slug: "futbolky" },
    ],
  },
  { id: "c4", name: "Аксесуари", slug: "aksesuary", children: [] },
];
```

```tsx
describe("FilterBar — category facet (G12)", () => {
  it("renders parent groups with children and filters by the clicked slug", () => {
    const onChange = vi.fn();
    renderWithIntl(
      <FilterBar
        filters={filters}
        brands={[]}
        categories={categoryGroups}
        onChange={onChange}
        onClearAll={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Категорії" }));
    expect(screen.getByRole("button", { name: "Одяг" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Аксесуари" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Худі" }));
    expect(onChange).toHaveBeenCalledWith({ category: "hudi" });
  });

  it("filters by a parent slug from the parent row (rollup entry point)", () => {
    const onChange = vi.fn();
    renderWithIntl(
      <FilterBar
        filters={filters}
        brands={[]}
        categories={categoryGroups}
        onChange={onChange}
        onClearAll={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Категорії" }));
    fireEvent.click(screen.getByRole("button", { name: "Одяг" }));
    expect(onChange).toHaveBeenCalledWith({ category: "odyah" });
  });

  it("toggles the active category off", () => {
    const onChange = vi.fn();
    renderWithIntl(
      <FilterBar
        filters={{ ...filters, category: "hudi" }}
        brands={[]}
        categories={categoryGroups}
        onChange={onChange}
        onClearAll={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Категорії" }));
    fireEvent.click(screen.getByRole("button", { name: "Худі" }));
    expect(onChange).toHaveBeenCalledWith({ category: null });
  });

  it("hides the facet entirely when categories are empty", () => {
    renderWithIntl(
      <FilterBar
        filters={filters}
        brands={[]}
        categories={[]}
        onChange={vi.fn()}
        onClearAll={vi.fn()}
      />
    );
    expect(screen.queryByRole("button", { name: "Категорії" })).not.toBeInTheDocument();
  });

  it("offers the facet inside the mobile Фільтри sheet and keeps the sheet open on select", () => {
    const onChange = vi.fn();
    renderWithIntl(
      <FilterBar
        filters={filters}
        brands={[]}
        categories={categoryGroups}
        onChange={onChange}
        onClearAll={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Фільтри" }));
    const sheet = screen.getByRole("dialog");
    fireEvent.click(within(sheet).getByRole("button", { name: "Футболки" }));
    expect(onChange).toHaveBeenCalledWith({ category: "futbolky" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("resolves the category pill to the display name, with slug fallback", () => {
    const { rerender } = renderWithIntl(
      <FilterBar
        filters={{ ...filters, category: "hudi" }}
        brands={[]}
        categories={categoryGroups}
        onChange={vi.fn()}
        onClearAll={vi.fn()}
      />
    );
    expect(screen.getByText("Категорія: Худі")).toBeInTheDocument();
    rerender(
      wrapIntl(
        <FilterBar
          filters={{ ...filters, category: "hudi" }}
          brands={[]}
          categories={[]}
          onChange={vi.fn()}
          onClearAll={vi.fn()}
        />
      )
    );
    expect(screen.getByText("Категорія: hudi")).toBeInTheDocument();
  });
});
```

- [x] **Step 3: Run the tests to verify they fail**

Run: `npx vitest run tests/unit/filter-bar.test.tsx`
Expected: the six new tests FAIL (no «Категорії» chip exists); pre-existing tests still pass once `categories={[]}` is added to their renders.

- [x] **Step 4: Implement the facet in `filter-bar.tsx`**

Add the exported type after `CatalogFilters` and extend the props:

```tsx
export interface CategoryFacetGroup {
  id: string;
  name: string;
  slug: string;
  children: { id: string; name: string; slug: string }[];
}
```

```tsx
interface FilterBarProps {
  filters: CatalogFilters;
  brands: string[];
  /** Parent categories with children (G12); empty array hides the facet. */
  categories: CategoryFacetGroup[];
  /** null deletes the param; page resets to 1 (handled by the caller). */
  onChange: (updates: Record<string, string | null>) => void;
  onClearAll: () => void;
}
```

Add the desktop popover component (after `BrandPopover`, same conventions):

```tsx
function CategoryPopover({
  category,
  categories,
  onChange,
}: {
  category: string | null;
  categories: CategoryFacetGroup[];
  onChange: FilterBarProps["onChange"];
}) {
  const t = useTranslations("products");
  const [open, setOpen] = useState(false);
  if (categories.length === 0) return null;
  const select = (slug: string) => {
    onChange({ category: category === slug ? null : slug });
    setOpen(false);
  };
  const rowClasses = (isActive: boolean, indented: boolean) =>
    cn(
      "rounded-[8px] border px-3 py-2 text-left text-[13px] font-semibold transition-colors",
      indented && "ml-3",
      isActive
        ? "border-white bg-white text-black"
        : cn("border-transparent text-[#a3a3a3]", INACTIVE_ROW_HOVER)
    );
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn("hidden md:inline-flex", chipClasses(category !== null))}
        >
          {t("filters.categoryTrigger")}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 border-[#262626] bg-[#0d0d0d] p-2 text-white">
        <div className="flex flex-col gap-1">
          {categories.map((parent) => (
            <div key={parent.id} className="flex flex-col gap-1">
              <button
                type="button"
                aria-pressed={category === parent.slug}
                onClick={() => select(parent.slug)}
                className={rowClasses(category === parent.slug, false)}
              >
                {parent.name}
              </button>
              {parent.children.map((child) => (
                <button
                  key={child.id}
                  type="button"
                  aria-pressed={category === child.slug}
                  onClick={() => select(child.slug)}
                  className={rowClasses(category === child.slug, true)}
                >
                  {child.name}
                </button>
              ))}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

Give `FiltersSheet` the `categories` prop and render the section FIRST in its column (above the price section); sheet rows do NOT close the sheet (the sheet-wide multi-filter convention):

```tsx
function FiltersSheet({
  filters,
  brands,
  categories,
  onChange,
  onClearAll,
}: {
  filters: CatalogFilters;
  brands: string[];
  categories: CategoryFacetGroup[];
  onChange: FilterBarProps["onChange"];
  onClearAll: FilterBarProps["onClearAll"];
}) {
```

```tsx
{
  categories.length > 0 && (
    <div>
      <p className="mb-2 text-[13px] font-semibold text-[#a3a3a3]">
        {t("filters.categoryHeading")}
      </p>
      <div className="flex flex-col gap-1">
        {categories.map((parent) => (
          <div key={parent.id} className="flex flex-col gap-1">
            <button
              type="button"
              aria-pressed={filters.category === parent.slug}
              onClick={() =>
                onChange({
                  category: filters.category === parent.slug ? null : parent.slug,
                })
              }
              className={cn(
                "rounded-[8px] border px-3 py-2 text-left text-[13px] font-semibold transition-colors",
                filters.category === parent.slug
                  ? "border-white bg-white text-black"
                  : cn("border-[#262626] text-[#a3a3a3]", INACTIVE_ROW_HOVER)
              )}
            >
              {parent.name}
            </button>
            {parent.children.map((child) => (
              <button
                key={child.id}
                type="button"
                aria-pressed={filters.category === child.slug}
                onClick={() =>
                  onChange({
                    category: filters.category === child.slug ? null : child.slug,
                  })
                }
                className={cn(
                  "ml-3 rounded-[8px] border px-3 py-2 text-left text-[13px] font-semibold transition-colors",
                  filters.category === child.slug
                    ? "border-white bg-white text-black"
                    : cn("border-[#262626] text-[#a3a3a3]", INACTIVE_ROW_HOVER)
                )}
              >
                {child.name}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
```

Update `FilterBar` itself — signature, name map, chip placement (CategoryPopover goes right after `FiltersSheet`, before `PricePopover`), sheet prop, and the pill:

```tsx
export function FilterBar({ filters, brands, categories, onChange, onClearAll }: FilterBarProps) {
  const t = useTranslations("products");
  const categoryNameBySlug = new Map<string, string>();
  for (const parent of categories) {
    categoryNameBySlug.set(parent.slug, parent.name);
    for (const child of parent.children) categoryNameBySlug.set(child.slug, child.name);
  }
```

```tsx
        <FiltersSheet
          filters={filters}
          brands={brands}
          categories={categories}
          onChange={onChange}
          onClearAll={onClearAll}
        />
        <CategoryPopover category={filters.category} categories={categories} onChange={onChange} />
        <PricePopover minPrice={filters.minPrice} maxPrice={filters.maxPrice} onChange={onChange} />
```

Pill (only the interpolation changes):

```tsx
{
  t("filters.categoryPill", {
    category: categoryNameBySlug.get(filters.category) ?? filters.category,
  });
}
```

- [x] **Step 5: Temporary wiring in `products-content.tsx`**

The `categories` prop is required, so the page must compile now; Task 3 replaces this with the real fetch:

```tsx
<FilterBar
  filters={filters}
  brands={brands}
  categories={[]}
  onChange={updateFilters}
  onClearAll={clearFilters}
/>
```

- [x] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run tests/unit/filter-bar.test.tsx && npm run typecheck`
Expected: PASS, typecheck clean.

- [x] **Step 7: Commit**

```bash
git add src/app/\(shop\)/products/filter-bar.tsx src/app/\(shop\)/products/products-content.tsx messages/uk.json messages/ru.json tests/unit/filter-bar.test.tsx
git commit -m "feat(g12): DB-driven category facet in the catalog FilterBar + pill name fix"
```

---

### Task 3: Wire the categories fetch in `products-content.tsx`

**Files:**

- Modify: `src/app/(shop)/products/products-content.tsx`

**Interfaces:**

- Consumes: `CategoryFacetGroup` from `./filter-bar` (Task 2); `GET /api/categories?parentOnly=true` (existing route — active parents with nested active children, `sortOrder`-sorted; the Header makes the same call).
- Produces: `categories` state passed to `<FilterBar categories={categories} ...>`.

- [x] **Step 1: Add the fetch (brands pattern, verbatim analog)**

Extend the import: `import { FilterBar, type CatalogFilters, type CatalogSort, type CategoryFacetGroup } from "./filter-bar";`

Add state next to `brands`:

```tsx
const [categories, setCategories] = useState<CategoryFacetGroup[]>([]);
```

Add the effect directly after the `fetchBrands` effect:

```tsx
useEffect(() => {
  async function fetchCategories() {
    try {
      const response = await fetch("/api/categories?parentOnly=true");
      if (!response.ok) throw new Error("Failed to fetch categories");
      const data = await response.json();
      setCategories(data);
    } catch {
      setCategories([]);
    }
  }
  fetchCategories();
}, []);
```

Replace Task 2's temporary `categories={[]}` with `categories={categories}`.

- [x] **Step 2: Verify**

Run: `npm run typecheck && npx vitest run tests/unit/filter-bar.test.tsx`
Expected: clean/PASS. (No dedicated products-content unit test exists — the wiring mirrors the brands fetch verbatim; the Task 6 browser gate exercises it end-to-end.)

- [x] **Step 3: Commit**

```bash
git add src/app/\(shop\)/products/products-content.tsx
git commit -m "feat(g12): fetch category groups for the catalog facet"
```

---

### Task 4: Thin 307 redirect + retirement sweep

**Files:**

- Rewrite: `src/app/(shop)/categories/[slug]/page.tsx`
- Delete: `src/app/(shop)/categories/[slug]/category-client.tsx`, `src/app/(shop)/categories/[slug]/loading.tsx`
- Modify: `src/lib/seo.ts` (delete `getCategoryMetadata`, lines ~148–198 including its leading comment block), `src/app/sitemap.ts`, `messages/uk.json`, `messages/ru.json`
- Test: Create `tests/unit/category-redirect.test.ts`; modify `tests/unit/seo.test.ts`

**Interfaces:**

- Consumes: `redirect` from `next/navigation` (server-component redirect — emits 307).
- Produces: `/categories/<slug>` → `/products?category=<slug>` for old bookmarks/external links. Task 5 rewrites internal links to skip the bounce.

- [x] **Step 1: Write the failing redirect test**

Create `tests/unit/category-redirect.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

import { redirect } from "next/navigation";
import CategoryRedirectPage from "@/app/(shop)/categories/[slug]/page";

const redirectMock = redirect as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("/categories/[slug] thin 307 redirect (G12)", () => {
  it("redirects to the catalog with the category param", async () => {
    await CategoryRedirectPage({ params: Promise.resolve({ slug: "hudi" }) });
    expect(redirectMock).toHaveBeenCalledWith("/products?category=hudi");
  });

  it("URI-encodes the slug", async () => {
    await CategoryRedirectPage({ params: Promise.resolve({ slug: "a b&c" }) });
    expect(redirectMock).toHaveBeenCalledWith("/products?category=a%20b%26c");
  });
});
```

- [x] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/category-redirect.test.ts`
Expected: FAIL — the current page renders `CategoryClient`; `redirect` is never called (the import of the old page may also error on its `next-intl/server` dependency chain — either failure mode is fine).

- [x] **Step 3: Rewrite the page, delete the client component and loading file**

Replace the ENTIRE contents of `src/app/(shop)/categories/[slug]/page.tsx` with:

```tsx
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// G12: /categories/<slug> is a thin 307 to the catalog — the category page
// is retired in favor of the FilterBar category facet (2026-08-18 spec).
// Deliberately unvalidated: unknown slugs land on the catalog's empty
// state. 307 (not 308) keeps the URLs reclaimable for future landing pages.
export default async function CategoryRedirectPage({ params }: PageProps) {
  const { slug } = await params;
  redirect(`/products?category=${encodeURIComponent(slug)}`);
}
```

```bash
git rm src/app/\(shop\)/categories/\[slug\]/category-client.tsx src/app/\(shop\)/categories/\[slug\]/loading.tsx
```

- [x] **Step 4: Retirement sweep**

1. `src/lib/seo.ts`: delete the whole `getCategoryMetadata` exported function INCLUDING the multi-line comment directly above it (the block starting near line 148 discussing the unreachable EN description fallback — that concern retires with the function).
2. `tests/unit/seo.test.ts`: delete the `describe("getCategoryMetadata", ...)` block (lines ~178–231) and remove `getCategoryMetadata` from the import list (line ~46).
3. `messages/uk.json` AND `messages/ru.json`: remove the `"categoryNotFound"` key from the `seo` namespace (its only consumer was the old page's `generateMetadata`).
4. `src/app/sitemap.ts`: remove `let categoryPages: MetadataRoute.Sitemap = [];`, the whole `// Category pages` fetch+map block inside the try, and change the return to `return [...staticPages, ...productPages];`. The `/categories` static row stays.

- [x] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run tests/unit/category-redirect.test.ts tests/unit/seo.test.ts && npm run typecheck`
Expected: PASS / clean. Typecheck confirms no dangling references to the deleted function or component (`CategoryClient`, `CategoryNotFound`, `Category` type were only imported by the old page itself).

- [x] **Step 6: Commit**

```bash
git add -A src/app/\(shop\)/categories/\[slug\] src/lib/seo.ts src/app/sitemap.ts messages/uk.json messages/ru.json tests/unit/category-redirect.test.ts tests/unit/seo.test.ts
git commit -m "feat(g12): /categories/[slug] becomes a thin 307 to the catalog; retire category-client"
```

---

### Task 5: Link sweep + desktop «Категорії» nav entry

**Files:**

- Modify: `src/components/common/Header.tsx`, `src/app/(shop)/categories/page.tsx`
- Test: `tests/unit/header.test.tsx`

**Interfaces:**

- Consumes: existing `header.categories` catalog key («Категорії» / «Категории» — already present in both files); rollup semantics from Task 1 (parent slugs now list products).
- Produces: no internal link points at `/categories/<slug>` anymore.

- [x] **Step 1: Extend the failing header test**

In `tests/unit/header.test.tsx`, inside the `"renders the three resolvable Ukrainian nav links (and none to unbuilt pages)"` test, add after the Бестселери assertion:

```tsx
expect(screen.getByRole("link", { name: "Категорії" })).toHaveAttribute("href", "/categories");
```

(The mobile sheet is closed in this render, so its own «Категорії» link is unmounted — the query is unambiguous.)

- [x] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/header.test.tsx`
Expected: FAIL — no desktop «Категорії» link exists yet.

- [x] **Step 3: Implement the Header changes**

In `src/components/common/Header.tsx`:

1. Desktop nav (the `<nav className="hidden items-center gap-6 md:flex">` block): after the `navigation.map(...)` loop and BEFORE the `isAdmin` block, add:

```tsx
<Link
  href="/categories"
  className="text-muted-foreground hover:text-foreground text-sm font-semibold transition-colors"
>
  {t("categories")}
</Link>
```

(A separate link, not a `navigation`-array entry — the array feeds the mobile menu too, which already has its own «Категорії» link and would duplicate it.)

2. Mobile menu top-5 category links: change `href={`/categories/${category.slug}`}` to `href={`/products?category=${category.slug}`}` (internal links skip the redirect bounce).

- [x] **Step 4: Rewrite the index-card links**

In `src/app/(shop)/categories/page.tsx`, change the card link from `href={`/categories/${category.slug}`}` to `href={`/products?category=${category.slug}`}`. Nothing else on the page changes (index restyle is out of scope).

- [x] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run tests/unit/header.test.tsx && npm run typecheck`
Expected: PASS / clean.

- [x] **Step 6: Commit**

```bash
git add src/components/common/Header.tsx src/app/\(shop\)/categories/page.tsx tests/unit/header.test.tsx
git commit -m "feat(g12): desktop Категорії nav entry; internal category links go straight to the catalog"
```

---

### Task 6: Full gates + browser gate

**Files:** none (verification only; plan checkbox updates + any fixes found)

- [x] **Step 1: Full local gates**

Run, in order:

```bash
npm run typecheck
npm run lint
npm run format:check
npm run test:run
npm run build
```

Expected: all clean. `test:run` must show the full suite green — including `docs-freshness.test.ts` (this plan file is indexed) and the untouched E2E-adjacent unit suites. NOTE: do NOT judge visuals from this local `next build` (the `/etc/environment` `NODE_ENV=development` corrupts local prod-CSS — known container issue); the build gate is for compile errors only.

- [x] **Step 2: Browser gate (fresh cache, real browser)**

```bash
rm -rf .next
npm run dev
```

Walk and screenshot each check (Playwright/Chrome DevTools MCP against `http://localhost:3001`):

1. Desktop catalog: «Категорії» chip opens the facet — parent rows + indented children; selecting «Худі» filters and the pill reads «Категорія: Худі» (name, not slug).
2. Parent rollup: selecting «Одяг» (or visiting `/products?category=odyah`) lists products — the «Всі» = 0 repro is dead.
3. Mobile (~390px): Фільтри sheet shows the «Категорії» section on top; selection keeps the sheet open.
4. `/categories` index: cards land on `/products?category=<slug>` directly.
5. Old URL `/categories/hudi`: 307 → `/products?category=hudi` (check the network tab status, not just the landing).
6. Desktop header: «Категорії» nav entry present → `/categories`.

Publish the screenshots as ONE Artifact page (gate convention — chat-inline images never reach the user) and present it for user sign-off. **STOP for the user's visual approval before proceeding to close-out.**

- [x] **Step 3: Log completion in this plan**

Check off all task checkboxes, note any deviations inline, and commit the plan update:

```bash
git add docs/planning/plans/2026-08-18_g12-categories-to-catalog.md
git commit -m "docs(g12): plan execution log"
```

---

## Close-out reminders (post-approval, per CLAUDE.md Task Completion)

- BACKLOG resolutions: mark the two [2026-08-09] G4-gate entries resolved (redesign + rollup); mark the "pill shows raw slug" 🟤 entry resolved; mark the "`/categories` + `/categories/[slug]` missed the rebrand sweep" entry **partially** resolved (the `[slug]` half retired; the index half stays open); check whether the G9 "machine-metadata residue" entry's `getCategoryMetadata` EN-fallback fragment can be struck (the function is deleted).
- Extract ≥2 improvements → BACKLOG (🟤), transition WEEKLY G12 → `✅ PR #N`, archive this plan (file move + index-row move, same commit), DONE.md entry, memory capture.

---

## Execution Log (2026-08-18)

Executed with `superpowers:executing-plans` (user-directed; no subagents). All six
tasks complete, one commit per task.

| Task | Commit    | Notes                                                                                               |
| ---- | --------- | --------------------------------------------------------------------------------------------------- |
| 1    | `f82f172` | Rollup. Prisma accepted `where.category = { OR: [...] }` — the `{ is: … }` fallback was not needed. |
| 2    | `904282b` | Facet + pill. Trigger label deviates (see D1).                                                      |
| 3    | `6705dfd` | Categories fetch, brands-pattern analog.                                                            |
| 4    | `031c3f9` | 307 + retirement sweep, plus four live-doc corrections (see D2).                                    |
| 5    | `1c172d3` | Nav entry + link sweep, plus an E2E assertion fix (see D3).                                         |
| 6    | this      | Gates + browser gate.                                                                               |

### Deviations

**D1 — chip label carries the `▾` affordance marker.** The plan specified
`products.filters.categoryTrigger` = «Категорії». Every sibling dropdown-trigger chip
in the same row reads «Ціна ▾» / «Бренд ▾» / «Колір ▾» / «Наявність ▾», so a bare
«Категорії» would have been the only popover trigger without the marker, and
`categoryTrigger`/`categoryHeading` would have held byte-identical values (the
established pattern is `priceTrigger` «Ціна ▾» vs `priceHeading` «Ціна»). Shipped as
«Категорії ▾» / «Категорії» (RU: «Категории ▾» / «Категории»). Raised before Task 2
and **user-confirmed 2026-08-18**. The plan's six facet tests were adjusted to query
the trigger by its actual accessible name.

**D2 — live-doc propagation, beyond the plan's four-item retirement sweep.** Deleting
`getCategoryMetadata` and `category-client.tsx` falsified four assertions in _live_
docs, none of which the plan listed:

- root `CLAUDE.md` — "(`getCategoryMetadata` stays sync — category names come from
  the DB, not the catalog)"
- `src/app/CLAUDE.md` — the same claim, in its Async SEO metadata convention
- `src/app/CLAUDE.md` — `category-client.tsx` cited as a client-component example,
  and the `categories/` tree line described as "Category listing + detail (with
  [slug])"
- `tests/unit/seo.test.ts` — a comment citing the deleted page as live precedent for
  the `getTranslations("seo")` not-found pattern

All corrected in Task 4's commit, per CLAUDE.md's propagation check (live docs get
corrected; frozen specs/audits/BACKLOG get their notes at close-out). Neither
`CLAUDE.md` carries a `**Last Updated**` header, so the docs-freshness linter was not
implicated.

**D3 — an E2E assertion directly contradicted Task 5.** `tests/e2e/navigation.spec.ts`
asserted, with a TASK-034 comment justifying it against the Mirox prototype:

```ts
await expect(header.getByRole("link", { name: "Категорії", exact: true })).toHaveCount(0);
```

Task 5 adds exactly that link. The plan's Global Constraints said not to touch the E2E
specs and the spec's testing section named only the _mobile-menu_ E2E test as needing
to keep passing, so this was missed on both. It would not have surfaced in any local
gate — `npm run test:run` is Vitest-only; the Playwright suite runs in CI. Flipped to
an href assertion with the reasoning rewritten. Raised to the user before Task 1.

**D4 — the spec's 307 premise was false; the redirect mechanism changed.** The Task 6
browser gate measured `/categories/hudi` returning **HTTP 200 with
`<meta http-equiv="refresh">`**, not the 307 the spec (decision 6) and the shipped page
comment both asserted. Next wraps every route segment in a `RedirectBoundary`, so a
`redirect()` thrown inside a Server Component page is captured mid-stream; Next only sets
a real 307 in its shell-error path (`app-render.js:830`), which a captured redirect never
reaches. Confirmed against a **production** build (`next build` + `next start`), not just
dev — the meta-refresh branch in `make-get-server-inserted-html.js` is not
`NODE_ENV`-gated, so this was never a dev-only artifact.

Fix (**user decision 2026-08-18**, chosen from three options): move the redirect to the
routing layer as a `next.config.mjs` `redirects()` entry, which emits a genuine
`307 Temporary Redirect` before any rendering. `src/app/(shop)/categories/[slug]/page.tsx`
is deleted outright — config redirects run before the filesystem route, so the page would
be unreachable dead code. `tests/unit/category-redirect.test.ts` was rewritten to resolve
the real exported config and invoke `redirects()` (asserting shipped behaviour, not source
text); both its assertions were proven able to fail via deliberately-broken controls
(`permanent: true`, and a broadened `/categories/:path*` source that would swallow the
index). Spec decision 6 carries a superseded note.

### Verification

- `npm run typecheck` — clean
- `npm run lint` — clean
- `npm run format:check` — "All matched files use Prettier code style!"
- `npm run test:run` — **64 files, 882 passed, 1 todo**, exit 0 (includes
  `docs-freshness.test.ts`)
- `npm run build` — see the gate section below
- Rollup proven against the seeded local DB, not just the mocked `where` shape:
  `odyah` 0 → 7 products, `aksesuary` 0 → 1, leaf `hudi` unchanged at 3. The «Всі» = 0
  repro is dead and leaf slugs did not regress.
