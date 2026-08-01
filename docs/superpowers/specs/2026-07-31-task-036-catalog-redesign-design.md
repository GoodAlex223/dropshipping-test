# TASK-036 — Catalog Redesign + Filters (Design)

**Date**: 2026-07-31
**Status**: Approved (brainstorming sign-off 2026-07-31)
**Task**: TASK-036 (v1.3, 🟠 High, L) — see [TODO.md](../../planning/TODO.md)
**Design source of truth**: [`Mirox Catalog.dc.html`](../../design/design_handoff_mirox/Mirox%20Catalog.dc.html) (desktop), [`Mirox Mobile.dc.html`](../../design/design_handoff_mirox/Mirox%20Mobile.dc.html) (390px), per the [design-adoption spec](2026-07-27-mirox-design-adoption-design.md) §4
**Predecessors**: TASK-034 (tokens), TASK-057 (dark flip, Mirox seed, `formatPrice()`)

## 1. Context

The catalog page (`/products`) still runs the pre-rebrand English UI (shadcn selects, search
toolbar, Previous/Next pagination) on the generic light-era layout. TASK-036 re-scopes it to the
Mirox handoff: monochrome filter bar with chips and dropdowns, white-active sort buttons,
`auto-fill minmax(240px,1fr)` grid, badge/sizes-row product cards, 36px square pagination — plus
the client-brief card extras (second image on hover, quick-view, quick-buy, colour swatches;
client list #2 items 18/19) and the standing E2E hydration-gate AC.

## 2. Decisions made during brainstorming (user-confirmed)

| #   | Question                                                 | Decision                                                                                                                                                                                                                                                                                                                                         |
| --- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Sort set: design's 3 vs TODO's 4 incl. "popular"         | **4 sorts** — Новинки / Популярні / Ціна ↑ / Ціна ↓. «Популярні» consumes `getBestsellers()`'s sales-ranking definition (its documented intended consumer). Documented deviation from the 3-button mock. Header «Бестселери» retargets from the `?featured=true` proxy to `?sort=popular`.                                                       |
| 2   | Quick-view / quick-buy semantics                         | **One dialog serves both.** Hover reveals «Швидкий перегляд» and «В кошик»; both open the same QuickViewDialog (quick-buy focuses the size row). No size guessing — clothing requires an explicit size choice before add-to-cart.                                                                                                                |
| 3   | Second image on hover with 7/8 products lacking image #2 | **Graceful fallback.** Hover-swap activates only when `images[1]` exists (Худі Mirox Basic demos it today). The 7 missing back-view images are logged as a TASK-056 client-asset item. No duplicated or fabricated assets.                                                                                                                       |
| 4   | Rendering architecture                                   | **Approach A — evolve the existing client-fetch page.** Restyle `products-content.tsx`; extend `/api/products`. Chosen over an RSC rewrite (B) and SSR-hybrid (C) because it is the smallest diff and the only option under which the E2E hydration gate stays valid _by construction_ — cards remain client-rendered by a post-hydration fetch. |

## 3. Scope & URL/API contract

**In scope**: the `/products` catalog page, `/api/products`, `ProductCard` (+ its new
sub-components), Header nav link targets. ProductCard upgrades propagate to category pages and
homepage rails automatically but degrade gracefully where data is absent (no variants passed →
no sizes row / swatches; no second image → no hover swap). **Not in scope**: category-page or
PDP redesign (TASK-037), wishlist (TASK-041), cart/checkout (TASK-043/048/049), string
externalization (TASK-039).

**URL params** — shareable, all combinable with AND semantics:

- Existing, unchanged: `page`, `search`, `category`, `minPrice`, `maxPrice`, `featured`.
- New: `size` (single-toggle, one of the catalog's Size values S–XXL/One size), `color`
  (Чорний/Білий), `brand`, `inStock=true`, `sort` = `new` (default) | `popular` | `price-asc` |
  `price-desc`.
- Legacy `sortBy`/`sortOrder` stay accepted by the API (mapped internally to the new sort set) so
  existing links don't 500 or silently mis-sort; the catalog UI emits only `sort`.

**`/api/products` extensions**:

- `size`/`color` filter via `variants: { some: { name: "Size"|"Color", value } }`; `brand` via
  equality on `product.brand`; `inStock=true` via `stock > 0`.
- Response `select` adds `variants` (name, value — the shape `ProductCard` already consumes) and
  widens `images` from `take: 1` to `take: 2` for the hover swap.
- `sort=popular`: reuse `getBestsellers()`'s definition — `orderItem.groupBy` over counted
  statuses (CONFIRMED/PROCESSING/SHIPPED/DELIVERED) in a 90-day window → rank map → filtered
  products ordered by rank with newest-first backfill for unranked products → paginate. The
  ranking logic is shared with/extracted alongside `product-queries.ts`, not duplicated.
- Invalid values for `sort`/`size`/`color` etc. follow the established query-param validation
  pattern: fall back to defaults, never throw.

**Search**: stays API-supported, but per the mock the catalog page has **no search input** — the
Header search icon is the entry point. An active `?search=` renders as a removable filter chip.

**Header nav**: «Новинки» → `/products?sort=new`; «Бестселери» → `/products?sort=popular`.

## 4. UI design

### Filter bar (desktop, per `Mirox Catalog.dc.html`)

- Breadcrumb «Головна / Каталог» + H1 «Каталог» 40px/800/-0.02em.
- Chip row (10px gap, wrap): **«Фільтри»** button (icon + label) opening a Sheet containing every
  filter plus «Скинути все» — a functional upgrade of the mock's inert chip, and the mobile entry
  point; **«Ціна ▾»** popover (range slider + apply, existing `minPrice`/`maxPrice` params);
  **«Бренд ▾»** popover (distinct brands from the catalog); **Розмір** inline chip group
  (bordered container, label «Розмір:», single-toggle buttons, active = white bg/black text);
  **«Колір ▾»** popover (Чорний/Білий); **«Наявність ▾»** popover («Всі» / «В наявності»).
- Right-aligned: «Сортування:» label + **4 white-active sort buttons** (Новинки / Популярні /
  Ціна ↑ / Ціна ↓).
- Dropdown chips whose filter is active get the white-active treatment; chip styling follows the
  mock (1px #262626/#333 borders, 10px radius, 13px/600–700).

### Grid & pagination

- Grid `repeat(auto-fill, minmax(240px, 1fr))`, gap 20px (desktop); 2 columns, gap 12px at 390px.
- Pagination: numbered **36px squares** (9px radius, active = white bg/black text) with arrow
  next/prev, replacing the Previous/Next text buttons. `page` param unchanged.

### ProductCard upgrades

- **Badge slot** (top-left, one badge max, priority order): `-N%` (dark `#1a1a1a` bg, `#333`
  border — existing discount badge restyled to match the mock) → `НОВИНКА` (white bg, black
  text) → out-of-stock («Немає в наявності»).
- **Second image on hover**: cross-fade to `images[1]` when present (decision #3).
- **Colour swatches**: display-only circles derived from Color variants (Чорний `#000` with
  border, Білий `#F5F5F5`) — client item 18.
- **Sizes row**: existing `getSizeLabel()` rendering, now actually fed on the catalog because the
  API returns variants.
- **Quick actions** (client item 19): on hover-capable devices only (`group-hover` +
  `@media (hover: hover)` gating; hidden on touch, where tap navigates as today): «Швидкий
  перегляд» and «В кошик» buttons overlaying the image. Out-of-stock cards drop «В кошик» and
  keep quick-view.

### QuickViewDialog (new — `src/components/products/QuickViewDialog.tsx`)

Image, name, price + struck `comparePrice` (both via `formatPrice()`), colour swatches, size
chip group (selection required before add), «ДОДАТИ В КОШИК» → cart store add + cart drawer
open + GA4 `add_to_cart`, and «Детальніше →» link to the PDP. Quick-buy opens this same dialog
with the size row focused (decision #2). Built on the existing shadcn Dialog primitive.

### Copy

All customer-visible strings Ukrainian, hardcoded and greppable for TASK-039 externalization
(TASK-057 pattern).

## 5. Data rules & edge cases

- **НОВИНКА rule**: `createdAt` within the last 30 days **and** no active discount; a discount
  always wins the badge slot (one badge per card — the mock never shows two). Implemented as a
  small shared helper (unit-tested) so the PDP can reuse it in TASK-037.
- **Thin-data popular sort**: unranked products backfill newest-first, same semantics as
  `getBestsellers()`; documented, not presented as fabricated popularity.
- **Degradation** (see scope): missing Color variants → no swatches; missing `images[1]` → no
  hover swap; missing Size variants → no sizes row.
- **Empty results**: Ukrainian empty state + «Скинути фільтри» resetting to bare `/products`.
- **Analytics**: `view_item_list` / `select_item` preserved as-is; QuickViewDialog add fires
  `add_to_cart` through the existing analytics lib.
- **Invalid params**: fall back to defaults per the established pattern; never throw on
  malformed user input.

## 6. Testing & gates

- **Unit (TDD)**: new `tests/unit/products-api.test.ts` — each of the five filters, filter
  combinations, sort mapping incl. legacy `sortBy`/`sortOrder`, popular-rank ordering +
  backfill, invalid-param fallbacks. Badge-helper tests (30-day boundary, discount precedence).
  Existing suites stay green.
- **E2E**: the hydration gate in `tests/e2e/products.spec.ts`
  (`waitForSelector("[data-testid='product-card']")`) is **untouched** — Approach A keeps cards
  client-rendered by a post-hydration fetch, so the gate's validity holds by construction (the
  AC's invariant). Sort test updated from combobox to buttons; search test retargeted to the
  Header search input; new smoke: toggling a size chip updates the URL (`size=`) and the grid.
- **Visual-fidelity gate** (standing rule): screenshots of the rendered catalog — desktop and
  390px — against `Mirox Catalog.dc.html` / `Mirox Mobile.dc.html`, with explicit user sign-off
  before merge; verify compiled CSS for any new token/utility.
- **Quality bar**: lint, typecheck, format, full unit + E2E suites green; pre-commit hooks pass.

## 7. Out of scope

- Category-page and PDP redesigns (TASK-037 et al.); wishlist (TASK-041); cart/checkout
  (TASK-043/048/049); locale infrastructure (TASK-039).
- Generating the 7 missing second-image assets (TASK-056 client-asset item, per decision #3).
- Any fabricated data: ratings, counters, popularity beyond what orders legitimately contain.

## 8a. Revision round — visual gate (2026-08-01, user feedback)

The first visual-gate review requested these changes; they supersede the matching lines above:

1. **Equal card heights** within a grid row (flex/h-full card, bottom-pinned price group).
2. **Image carousel replaces the two-image hover swap** (supersedes decision #3's mechanism, not its
   graceful-fallback principle): the API returns **all** product images; cards with 2+ images
   auto-advance (~1.5s) on hover with prev/next arrows (arrow hover pauses; touch: static, no
   arrows); QuickViewDialog gets the same carousel with autoplay while open (~2s). Single-image
   products keep today's behavior — the asset gap (7/8 single-image) still demos on one card only.
3. **Quick-buy button shows the header's cart icon** instead of the «В кошик» text label
   (aria-label stays «В кошик»).
4. **Hover states on all filter/sort controls** (border #333→#666 / text lighten), incl. popover
   and sheet rows and pagination squares.
5. **Mobile shows only the «Фільтри» button**; the sheet gains a «Сортування» section — inline
   chips and sort row are md+ only (resolves the mobile brief-vs-mock conflict toward the mock).
6. **Mobile struck-price overflow fixed** (price row wraps).
7. **PDP mobile horizontal overflow**: diagnose; contained CSS fix ships in this branch, else the
   diagnosis is handed to TASK-037.

Confirmed unchanged by the user: pagination design (hidden at 8 products is correct behavior;
12/page via API).

## 8. Risks

1. **Popular sort + filters + pagination interplay** — mitigated by sharing `getBestsellers()`'s
   ranking logic and unit-testing rank/backfill ordering explicitly.
2. **Hover/touch behavior divergence** — quick actions are hover-gated; touch keeps today's
   tap-to-navigate. E2E runs chromium + webkit; the hydration gate is untouched.
3. **Visual drift from the mock** (4th sort button, functional «Фільтри» sheet, swatches on
   cards are deliberate deviations) — each is documented here; the visual gate reviews the
   rendered result against the mock with these deviations declared up front.
4. **ProductCard consumers regressing** (homepage rails, category pages) — changes are additive
   and data-gated; existing consumers pass no new fields and render as before, verified by the
   full E2E suite.
