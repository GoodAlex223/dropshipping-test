# TASK-037 — Product Page Redesign (Design)

**Date**: 2026-08-01
**Status**: Approved (brainstorming sign-off 2026-08-01)
**Task**: TASK-037 (v1.3, 🟠 High, L) — see [TODO.md](../../planning/TODO.md)
**Design source of truth**: [`Mirox Product.dc.html`](../../design/design_handoff_mirox/Mirox%20Product.dc.html) (desktop), [`Mirox Mobile.dc.html`](../../design/design_handoff_mirox/Mirox%20Mobile.dc.html) («Mobile Товар» screen, 390px), per the [design-adoption spec](2026-07-27-mirox-design-adoption-design.md) §4
**Predecessors**: TASK-034 (tokens), TASK-057 (dark flip, Mirox seed, `formatPrice()`), TASK-036 (ProductCard/QuickViewDialog patterns, `getSalesRanking()`)

## 1. Context

The PDP (`src/app/(shop)/products/[slug]/`) is the last v1.3 storefront surface still on the
pre-rebrand layout: English strings, light-era layout (aspect-square gallery with horizontal
thumbs, mixed «Options» variant buttons, quantity stepper, Buy Now), English ReviewSection.
TASK-037 rebuilds it to the Mirox reference and adds the two AC-named components
(`SizePicker.tsx`, `BoughtTogether.tsx`) plus a recently-viewed section.

Two integrity constraints discovered during brainstorming shape the design:

1. **Checkout recomputes all prices server-side from the DB**
   (`create-payment-intent`/`confirm-order`) — any client-side-only "bundle discount" would
   display one total and charge another. Fake discounts are structurally impossible to do honestly.
2. **An order line carries exactly one `variantId`**, and `variantInfo` is derived server-side
   (`${variant.name}: ${variant.value}`) — a client-side color pick can never reach the order or
   the supplier. The variant model is one-dimensional (Size is the real dimension;
   QuickViewDialog already settled this in TASK-036).

The seed data was also found internally contradictory: «Худі Mirox Basic» (black) carried a bogus
«Білий» Color row _while_ «Худі Mirox White» exists as a separate product. The user confirmed the
suspicion; this task fixes the data model honestly.

## 2. Decisions made during brainstorming (user-confirmed)

| #   | Decision                              | Choice                                                                                                                                                                                                                                                                                                                        |
| --- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | «КУПИТИ В 1 КЛІК» (quick-order)       | **Deferred to TASK-043** (which owns the phone-callback backend). The slot keeps the two-CTA layout as **«КУПИТИ ЗАРАЗ»** (outline): add selection to cart → `router.push("/checkout")`. Resolves TODO AC-6 as "explicitly deferred".                                                                                         |
| 2   | Color swatches                        | **Sibling navigation + `styleGroup`**: nullable `Product.styleGroup` column links colorway siblings (each colorway stays its own product/page/slug). Swatch row = current color active (white 2px border) + sibling swatches as links to their PDPs. Seed fixed to one true color per product. Cart/orders stay fully honest. |
| 3   | Bundle price                          | **Honest sums via comparePrice**: struck sum = Σ(`comparePrice` ?? `price`) shown **only when genuinely greater**, bundle price = Σ(`price`). No checkout changes; charge always matches display.                                                                                                                             |
| 4   | Bundle companion sizes                | **Size chips per companion**, auto-preselected to the main product's chosen size (when that size exists and is in stock), editable. Every bundle cart line carries a real `variantId`.                                                                                                                                        |
| 5   | «У вибране» + «Відкрити фото замірів» | **Both omitted** until real (no-dead-links rule, TASK-057 precedent). «У вибране» restore pointer → BACKLOG 🟤 `[relates-to: TASK-041]`; фото-замірів restore noted on TASK-056's size-charts item.                                                                                                                           |
| 6   | Architecture                          | **Component decomposition** (Approach A): lean composition shell + focused components, matching the TASK-036 precedent.                                                                                                                                                                                                       |

## 3. Data model & server side

### Schema (migration `add_product_style_group`)

- `Product.styleGroup String?` + `@@index([styleGroup])`. Nullable → zero-risk migration; prod
  applies it automatically via `vercel-build` (`prisma migrate deploy` on `DIRECT_URL`) on merge.

### Seed fix (`prisma/seed-data/products.ts`)

- **One true colorway per product** (kills bogus rows): Худі Mirox Basic — drop «Білий» (keep
  Чорний); Футболка Mirox — drop «Білий» (keep Чорний). The other six already carry a single
  Color row (Олімпійка/Oversize/Cargo/Лонгслів/Кепка — Чорний; Худі White — Білий).
- `styleGroup: "hudi-mirox"` on **Худі Mirox Basic ↔ Худі Mirox White**; `null` elsewhere
  (Худі Oversize is a different cut, not a colorway sibling).
- Side effect: catalog card color dots become honest (one dot on single-colorway products).
- **Prod data note**: prod keeps its current rows until the next **user-approved** re-seed
  (destructive, `SEED_ALLOW_REMOTE=1` — separate gated decision, NOT part of this task's
  pipeline). Until then prod PDPs show legacy Color rows as informational swatches and no sibling
  links (`styleGroup` null). The page must render correctly in **both** data states.

### Server page queries (`page.tsx` / `getProduct`)

All new/non-critical queries are **fail-soft** — a failure hides its section, never 500s the page
(extract the homepage's `safeSection` helper from `src/app/(shop)/page.tsx` into a shared module
and reuse; this also addresses the BACKLOG'd all-or-nothing multi-query risk for the PDP). Core
product query failure keeps the existing not-found path.

1. **Colorway siblings**: active products with the same non-null `styleGroup`, `id != current` —
   select `slug`, `name`, their Color variant value. Feeds the swatch links.
2. **Bundle companions**: top-2 products from `getSalesRanking(90)` (`src/lib/product-queries.ts`)
   excluding the current product; fallback fill (deterministic): same-category actives, then any
   active product, both ordered `createdAt desc`. Select images, `price`, `comparePrice`, Size
   variants (`id`/`value`/`stock`). Fewer than 2 available → BoughtTogether hides.
3. **Related products** and **reviews/stats** queries: unchanged (related section stays
   same-category, 4 items).

### API

- `/api/products` gains an **`ids` filter**: comma-separated, validated (non-empty strings), capped
  at 12, invalid entries ignored, `isActive: true` enforced, existing response shape. Used only by
  RecentlyViewed's client fetch. No other API changes.

### SEO

- Product JSON-LD unchanged. Breadcrumb JSON-LD realigned to the visible crumbs:
  Головна (`/`) / Каталог (`/products`) / {name} — the category crumb level is dropped to match
  the reference.
- `opengraph-image.tsx` untouched.

## 4. UI design

**File shape**: `product-detail-client.tsx` becomes a lean composition shell. New components in
`src/components/products/`: `ProductGallery.tsx`, `SizePicker.tsx`, `BoughtTogether.tsx`,
`RecentlyViewed.tsx` (barrel-exported). Review components restyled in place
(`src/components/reviews/*`). Use TASK-057 tokens throughout (no raw hexes where tokens exist;
stars use `--rating`). Reuse/extract the `SIZE_ORDER` ranking and `COLOR_SWATCH_CLASSES` map
currently in `ProductCard.tsx` into a shared module rather than duplicating.

**Page order** (desktop): breadcrumb → main grid
`96px | minmax(0,1fr) | minmax(340px,420px)` (gap 24) → «Підбір розміру» + «Купують разом» row
(`minmax(0,1fr) / minmax(0,1.4fr)`, gap 20) → «Опис» → «Відгуки покупців» (`#reviews`) →
«Схожі товари» → «Ви нещодавно переглянули». Related/recently sections use the catalog's
ProductCard grid style (4-col desktop / 2-col mobile), H2 28px/800 — present per AC even though
the reference page omits them.

### ProductGallery

- Desktop: vertical 96px thumb rail (radius 12, active border per reference) + main photo,
  height `clamp(420px, calc(100vh - 190px), 620px)`, radius 20, border. Thumb click swaps the
  main image.
- Mobile (< sm): rail hidden; full-width ~400px scroll-snap swipe gallery with the reference's
  dots pager (active dot = 18×4px bar, inactive 4×4px), no arrows. Dots clickable.
- Zero-image fallback keeps the current Package-icon placeholder, styled dark.

### Buy panel

Top-to-bottom, per reference: H1 30px/800 (tracking −0.02em) → price 26px/800 via `formatPrice`
(selected size's variant price when set) → stars row (amber `--rating`, real `averageRating`) +
«{N} відгуків» anchor link to `#reviews` (uk pluralization: відгук/відгуки/відгуків) →
«Колір: {value}» + 36px swatch circles (current = white 2px border; siblings = `Link` to their
slug, aria-labelled) → «Розмір:» + size buttons (min-width 52px, S→XXL via `SIZE_ORDER`, active =
white bg/black text, out-of-stock disabled, first in-stock preselected) → stock line: left
«● В наявності» (green) / «Залишилось {N} шт» (amber, when selected-size stock ≤ 5) /
«Немає в наявності» (muted/red, CTAs disabled); right «Доставка Новою Поштою» → CTAs:
**«ДОДАТИ В КОШИК»** (white primary; on add → «✓ ДОДАНО В КОШИК» for 2 s, existing state pattern)

- **«КУПИТИ ЗАРАЗ»** (outline; add + `router.push("/checkout")`) → share row: «Поділитися» via
  restyled `SocialShareButtons` only.

* Cart lines & analytics use `${product.name} — ${size.value}` and `item_variant: size.value`
  (QuickViewDialog parity) — **fixes the BACKLOG'd PDP cart-line naming bug** («…- Size»).
* Stock authority: selected Size variant's stock; product-level `stock` when no Size variants.
* Quantity stepper is **dropped** (reference has none; quantity edits live in the cart).
  `shortDesc` leaves the panel (still used on cards/quick-view).
* Mobile: name+price on one row, stars + «В наявності» inline, 30px swatches, size buttons
  `flex-1` in one row, CTAs stacked full-width.

### SizePicker (`SizePicker.tsx`, new)

- Card `bg` dark-elevated, radius 20, padding 32. H2 «Підбір розміру» 22px/800 + subline
  «Вкажіть свій зріст і вагу, ми підберемо ідеальний розмір».
- Inputs Зріст (см) / Вага (кг), type number, defaults 180/75, dark styling per reference.
- Result card: «Ваш розмір:» + 44px/800 letter + static «Рекомендації:» list (Вільна посадка /
  Комфорт у русі / Ідеальний вибір).
- Formula (exact, per AC): XXL if h≥190‖w≥95; XL if h≥184‖w≥85; L if h≥176‖w≥72; M if h≥168‖w≥60;
  else S. Non-numeric/empty input falls back to defaults (reference behavior).
- Pure client state; no persistence; **no coupling to the buy panel** (placeholder until client
  size charts arrive; TASK-045 replaces the logic).
- The recommendation formula lives as an exported pure function so it is unit-testable.

### BoughtTogether (`BoughtTogether.tsx`, new)

- Card dark-elevated, radius 20, padding 32. H2 «Купують разом» 22px/800.
- 3 columns (current product + 2 server-picked companions) with «+» separators; each: photo 150px
  (radius 14), name (truncate), price 13.5px/800, and a compact **size-chip row** (preselected to
  the main product's selected size when available & in stock, else first in-stock; single
  «One size» chip for Кепка-type products; row hidden for products without Size variants).
- Footer: «Загальна ціна:» + struck Σ(`comparePrice` ?? `price`) rendered **only when greater
  than** Σ(`price`), then Σ(`price`) bold — via `formatPrice` → «ДОДАТИ КОМПЛЕКТ У КОШИК» button
  adds 3 real variant lines (each with its `variantId`, QuickView-style names) + one
  `trackAddToCart` per line, then opens the cart drawer.
- Hides entirely when fewer than 2 companions are available.

### RecentlyViewed (`RecentlyViewed.tsx`, new)

- localStorage ring buffer (key e.g. `mirox:recently-viewed`, product ids, cap 8, de-duped);
  current PDP recorded on mount.
- Renders «Ви нещодавно переглянули» ProductCard grid for _other_ recorded products via
  `/api/products?ids=…`; renders nothing server-side and nothing when empty → no hydration risk
  (ReviewSection-eligibility pattern). Fetch errors silently hide the section.

### Reviews restyle (in place)

- Keep **all** functionality: stats/distribution, eligibility-gated form, edit/delete, admin
  replies. Restyle to dark Mirox + Ukrainian strings.
- H2 «Відгуки покупців» 28px/800; cards dark-elevated radius 16 padding 28; avatar = initial
  circle; name + «✓ Підтверджена покупка» (green, 11px — true by construction: eligibility
  requires a DELIVERED order); amber stars; date right-aligned muted, `dd.MM.yyyy`; admin-reply
  block restyled consistently. 2-col card grid desktop / 1-col mobile.
- Form inputs match SizePicker's dark input styling; Ukrainian labels/actions/validation copy.

### «Опис»

- Product `description` kept as its own section below the SizePicker/BoughtTogether row (SEO +
  informational value; reference omits it — pragmatic extension). H2 «Опис» 28px/800 (page-level
  section heading, matching «Відгуки покупців»), muted body, `whitespace-pre-wrap`.

### Copy

All customer-facing strings hardcoded Ukrainian (TASK-057/036 precedent; TASK-039 externalizes
later). Breadcrumb: Головна / Каталог / {name}.

## 5. Data rules & edge cases

- **Sizeless products** (no Size variants): size row hidden; add-to-cart uses product-level stock
  and no `variantId` (QuickView parity). Кепка is _not_ sizeless — it has a «One size» Size row.
- **Variant price**: size rows may carry their own `price`; panel price and cart lines follow the
  selected size (existing behavior preserved).
- **Legacy prod data** (pre-re-seed): multiple Color rows render as informational swatches
  (non-links); no sibling links until `styleGroup` is populated. No errors in either state.
- **comparePrice on the main price**: keep the struck compare price next to the main price when
  present (existing behavior, `formatPrice`), matching catalog-card behavior.
- **Out of stock**: product-level stock 0 or all sizes 0 → CTAs disabled + «Немає в наявності»;
  BoughtTogether never offers out-of-stock chips as preselection.
- **Recently-viewed staleness**: ids whose products went inactive are dropped by the `ids` fetch
  (isActive enforced) — the section self-heals.
- **Analytics**: `trackViewItem` on mount (existing), `trackAddToCart` for single and bundle adds;
  no new event types.

## 6. Testing & gates

- **Unit (Vitest)**: size-recommendation formula (all 5 bands + boundary values 168/176/184/190,
  60/72/85/95, defaults fallback); bundle sum math (mixed comparePrice, strike-only-when-greater);
  `ids` param on `/api/products` (validation, cap 12, isActive, invalid-id tolerance, combines
  with existing response shape); size-ordering helper extraction stays covered.
- **E2E (Playwright)**: update `products.spec.ts` (PDP headings, «ДОДАТИ В КОШИК» button) and any
  cart flow that transits the PDP; new flow: open PDP → size preselected → add → drawer line shows
  «{name} — {size}». Hydration-safe interactions (wait for a hydration-only signal, not
  `isVisible()` — WebKit lesson). Run foreground, one project per command.
- **Visual-fidelity gate** (standing rule): rendered screenshots (desktop ~1440 + 390px mobile)
  side-by-side with `Mirox Product.dc.html` / `Mirox Mobile.dc.html`; **user sign-off required**
  before merge; the §7 deviations ledger accompanies the gate.
- Full local suite before PR: `lint`, `typecheck`, `format:check`, `test:run`, `build`, E2E.
- Migration: `prisma migrate dev` locally; prod schema migrates automatically on merge
  (vercel-build); prod _data_ changes wait for the separately-approved re-seed.

## 7. Deviations ledger (pre-approved 2026-08-01, listed for the visual gate)

1. Second CTA reads «КУПИТИ ЗАРАЗ» (buy-now behavior), not «КУПИТИ В 1 КЛІК» — quick-order
   deferred to TASK-043.
2. «У вибране» omitted — wishlist is TASK-041 (BACKLOG restore pointer).
3. «Відкрити фото замірів» omitted — measurement photos client-owed (TASK-056 note).
4. Color swatches: current colorway + real sibling links only — no toy color toggling; single-
   colorway products show one swatch.
5. BoughtTogether adds compact size chips per companion (fulfillment integrity requires a real
   `variantId` per line).
6. Bundle strikethrough appears only when constituent `comparePrice`s make it true; no invented
   bundle discount (checkout recomputes prices server-side).
7. Quantity stepper dropped from the PDP (reference has none; cart owns quantity).
8. Related + recently-viewed sections exist (AC requirement) though absent from the reference
   page; styled in the catalog's card-grid language.
9. «Опис» section kept for SEO though absent from the reference.
10. _(added 2026-08-02, final whole-branch review)_ The low-stock line «Залишилось {N} шт» renders
    white bold, not amber — §4's amber suggestion collided with the token charter (`--rating` is
    star-ratings-only, per the colour-guard policy), and the reference never renders a low-stock
    state at all, so the gate's side-by-sides can't arbitrate it. White-bold is the deliberate
    choice; re-open only if the visual gate objects.

## 8. Out of scope

- Quick-order backend (TASK-043), wishlist (TASK-041), real bundle-discount/promo infrastructure
  (TASK-043/v1.4), i18n externalization (TASK-039), size-chart data & the real size assistant
  (TASK-045/TASK-056), checkout/shipping/payment changes (TASK-048/049), admin UI for
  `styleGroup` (seed-only for now — BACKLOG if needed), search.

## 9. Docs deliverables (at completion)

- BACKLOG 🟤: «У вибране» PDP affordance omitted — restore when wishlist ships
  `[relates-to: TASK-041]`; consider an admin-form field for `styleGroup` (new column has no
  admin surface).
- TASK-056: add «Відкрити фото замірів» restore note to the size-charts item.
- TODO.md AC-6: record resolution (1-click explicitly deferred to TASK-043; «КУПИТИ ЗАРАЗ»
  interim).
- CLAUDE.md propagation check (PDP patterns section, seed description — single-colorway rule,
  `styleGroup`).

## 10. Risks

- **Visual gate revisions expected** (every design task so far had ≥1 round) — the ledger above
  minimizes surprise; budget a revision round.
- **E2E churn**: PDP selectors are asserted in `products.spec.ts`/`cart.spec.ts`; the local
  dev-server race that masks later assertions is documented — rely on CI's prod-build run as the
  authoritative pass (TASK-036 lesson).
- **Prod data lag**: until the user-approved re-seed, prod shows legacy colorway data — by design,
  documented above; verify post-merge prod against the _schema_ (page renders, no 500) rather
  than expecting sibling swatches.
- **Bundle preselection UX**: auto-preselecting companions' sizes to the main size may surprise —
  chips are visible and editable, and the visual gate arbitrates.
