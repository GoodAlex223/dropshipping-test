# G12 — Categories-to-Catalog Redesign: Design Spec

**Date**: 2026-08-18
**Status**: Approved (user, 2026-08-18) — pending implementation plan
**Branch**: `feat/g12-categories-to-catalog` (from `main` @ `d13c8a1`)
**Source**: WEEKLY.md G12 (🔵 User, 3 members, 5 SP, 🏆 stretch) — user-proposed at the G4 visual gate 2026-08-09, scheduled 2026-08-11; subsumes the launch-visible «Всі» = 0 rollup bug (BACKLOG member 3, standalone escape hatch no longer needed once this ships)
**Program context**: `2026-07-14-mirox-shop-program-design.md` (Mirox rebrand + Ukraine launch); builds on the TASK-036 catalog (`FilterBar`, PR #26) and closes part of the G1-audited "`/categories` + `/categories/[slug]` missed the rebrand sweep" BACKLOG entry

## Problem

1. **`/categories/[slug]` duplicates the catalog, badly.** `category-client.tsx` (~434
   lines) is a pre-Mirox surface: generic shadcn styling instead of the catalog's design
   language, its own six-option legacy sort set (`sortBy`/`sortOrder`) diverging from the
   catalog's four (`sort=`), its own price-filter sheet, its own pagination — and
   hardcoded UA string literals that predate the G9 i18n extraction (the file was left
   out of TASK-039 deliberately, slated for this retirement).
2. **Launch-visible bug: parent categories list zero products.** `/api/products` matches
   the exact category slug only (`where.category = { slug }`,
   `src/app/api/products/route.ts:71-73`), while the `/categories` index cards roll up
   children's counts — so `/categories/odyah` claims N товарів on its card but its «Всі»
   tab lists nothing.
3. **No desktop entry point for categories.** Desktop nav has Каталог / Новинки /
   Бестселери; «Категорії» exists only in the mobile menu and Footer (the user couldn't
   find it during the G4 gate).
4. **Rider nit (BACKLOG'd)**: the catalog's active-category pill renders the raw slug
   (`Категорія: hudi`), not the display name.

## Decisions

1. **Rollup = two-level OR, nested inside the relation filter.**
   `where.category = { OR: [{ slug }, { parent: { slug } }] }` — a product matches when
   its category has the slug **or** its category's parent does. This is exactly the
   rollup depth the `/categories` index cards already use (one level of children), and
   the live hierarchy is two levels (odyah/aksesuary → 6 children). Recursive descendant
   resolution rejected as YAGNI — nothing in the app handles deeper nesting, including
   the index page. The OR **must** nest inside `where.category`: top-level `where.OR` is
   already owned by the search filter and would collide.
2. **Facet data reaches the FilterBar client-side, brands-style.**
   `products-content.tsx` gains one mount-effect fetching
   `/api/categories?parentOnly=true` (the same call the Header already makes: active
   parents with nested active children, `sortOrder`-sorted), stored as state and passed
   to `FilterBar` as a new prop typed
   `{ id; name; slug; children: { id; name; slug }[] }[]`. Server-side threading
   rejected: the page is a client island and the facet is interaction chrome.
3. **Facet UI follows existing FilterBar anatomy.**
   - _Desktop_: a «Категорії» chip, first among the filter chips (before Ціна — primary
     facet), opening a popover with the established dark tokens (`#0d0d0d` bg,
     `#262626` border, white-when-active rows). Each parent renders as a selectable row
     with its children indented beneath it; clicking a parent filters by the parent slug
     (meaningful via decision 1). Single-select; clicking the active row toggles it off;
     selection closes the popover (brand behavior).
   - _Mobile_: a matching «Категорії» section at the top of the FiltersSheet (above
     Ціна); selection leaves the sheet open (the sheet-wide multi-filter convention,
     TASK-036 final-review Fix 6).
   - _URL semantics unchanged_: single `category` param via `onChange`; page resets to 1
     in the existing caller. GA4 untouched — the existing `category_${slug}` list labels
     keep working.
4. **Empty/failed categories fetch hides the facet entirely** (desktop chip and sheet
   section both). Deliberate divergence from the brands popover's placeholder text: an
   empty category facet is dead chrome, and no functioning-store scenario has zero
   active categories. The catalog otherwise renders normally.
5. **Pill rider**: with categories in props, a slug→name map (parents + children)
   resolves the pill's display name; unknown/stale slugs and the fetch-in-flight window
   fall back to showing the slug. Closes the BACKLOG "pill shows raw slug" nit.
6. **`/categories/[slug]` becomes a thin, unvalidated 307.** The page shrinks to a
   server component: `await params`, then
   ``redirect(`/products?category=${encodeURIComponent(slug)}`)`` — Next's `redirect()`
   emits 307, per the BACKLOG's deliberate choice (not 308: the URLs are not permanently
   written off). No DB existence check — an invalid slug lands on the catalog's empty
   state with a removable pill, which is graceful. The segment's `loading.tsx` is
   deleted (nothing renders).

   > **SUPERSEDED during implementation (2026-08-18, browser gate).** The premise
   > "Next's `redirect()` emits 307" is **false** for a Server Component page. Next wraps
   > every route segment in a `RedirectBoundary`, so the redirect error is captured
   > mid-stream and emitted as `<meta id="__next-page-redirect" http-equiv="refresh"
content="1;url=…">` on an **HTTP 200** — measured against a production build
   > (`next build` + `next start`), not just dev; the meta-refresh branch in
   > `next/dist/server/app-render/make-get-server-inserted-html.js` is not
   > `NODE_ENV`-gated. Next only sets a real 307 in its shell-error path
   > (`app-render.js:830`), which a boundary-captured redirect never reaches.
   >
   > **Shipped instead** (user decision 2026-08-18): a routing-layer
   > `redirects()` entry in `next.config.mjs` — `source: "/categories/:slug"`,
   > `destination: "/products?category=:slug"`, `permanent: false` — which emits a
   > genuine `307 Temporary Redirect` before any rendering, verified end-to-end. The
   > page file is deleted outright rather than shrunk (routing-layer redirects run
   > before the filesystem route, so it would be dead code). Everything else in this
   > decision stands: still 307 not 308, still unvalidated, `loading.tsx` still deleted.
   > `:slug` is a required segment, so the bare `/categories` index is unaffected.
   > Regression: `tests/unit/category-redirect.test.ts` resolves the real exported config
   > and invokes `redirects()`.

7. **Retirement sweep.** `category-client.tsx` deleted outright (`CategoryNotFound`
   becomes unreachable). `getCategoryMetadata` deleted from `seo.ts` (its only consumer
   dies) with its 4 tests pruned from `seo.test.ts`; the orphaned `seo.categoryNotFound`
   key removed from `messages/{uk,ru}.json`; `sitemap.ts` drops the per-category URL
   block (a sitemap must not list URLs that 307). `/categories` static sitemap row,
   `getCategoriesListingMetadata`, and `getBreadcrumbJsonLd` (still used by the PDP) all
   stay. Note: `scripts/i18n-byte-diff.mjs` is a one-off TASK-039 verification tool, not
   a standing CI check (verified 2026-08-18) — deleting the file's Cyrillic literals
   trips no automation.
8. **Link sweep — internal links go direct; the redirect serves only old
   bookmarks/external links.**
   - `/categories` index cards → `href="/products?category=<slug>"`
   - Mobile Header top-5 parent links → same
   - Desktop nav: add «Категорії» → `/categories` after Бестселери, reusing the
     existing `header.categories` key (**user decision 2026-08-18**: plain link to the
     index, matching the mobile entry; dropdown and no-entry options rejected)
   - Footer `/categories` link: unchanged
9. **i18n**: new catalog keys `products.filters.categoryTrigger` and
   `products.filters.categoryHeading` («Категорії») in `messages/uk.json` + mirrored RU
   draft entries; `products.filters.categoryPill` already exists.

## Out of scope

- **`/categories` index restyle.** The index page keeps working untouched (G12's stated
  scope); its half of the "missed the rebrand sweep" BACKLOG entry remains open — the
  close-out should mark that entry partially resolved (the `[slug]` half retires), not
  done.
- Multi-select categories, product counts inside the facet, category landing pages
  (a future re-introduction would be a new task; the 307 keeps that door open).
- `/api/categories/[slug]` route retirement — it has no `src/` consumers today, but
  removing a public API is not in G12's mandate; leave as-is.

## Error handling

- Categories fetch fails → facet hidden (decision 4); catalog unaffected.
- Invalid slug on the redirect → catalog empty state + removable pill (decision 6).
- Unknown slug in the pill → slug fallback (decision 5).

## Testing & verification

- `products-api.test.ts`: update the existing category-filter assertion to the new OR
  shape; add a parent-slug test asserting `{ OR: [{ slug }, { parent: { slug } }] }`.
- `filter-bar.test.tsx`: facet renders parent groups with children; selection calls
  `onChange({ category: slug })`; active-row toggle-off; pill shows the resolved name
  and falls back to the slug; facet hidden when categories are empty.
- New small unit test for the redirect page (`redirect()` throws `NEXT_REDIRECT`;
  assert the encoded target).
- E2E `navigation.spec.ts` "categories page via mobile menu" must keep passing
  untouched (index page intact).
- Standard gates: `typecheck`, `lint`, `test:run`, `build`; then a browser gate on a
  fresh `.next` (stale-cache precedent) walking: desktop facet, mobile sheet facet,
  index card → filtered catalog, parent category showing products (the «Всі» = 0
  repro), old `/categories/hudi` URL redirecting, desktop nav entry — screenshots
  delivered via Artifact per the gate convention.
