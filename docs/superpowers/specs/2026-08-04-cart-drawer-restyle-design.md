# G1 — Cart & Drawer Restyle: Design

**Date**: 2026-08-04
**Status**: Approved (user, 2026-08-04)
**Source**: WEEKLY 2026-08-03 G1 (5 SP, Tue) — [WEEKLY.md](../../planning/WEEKLY.md)
**Design handoff**: `docs/design/design_handoff_mirox/Mirox Cart.dc.html` (desktop only — no cart section in `Mirox Mobile.dc.html`)
**Branch**: `feat/g1-cart-drawer-restyle`

## Goal

Convert the last two cart surfaces to the Mirox design language with Ukrainian copy: the cart
page ([src/app/(shop)/cart/page.tsx](<../../../src/app/(shop)/cart/page.tsx>)) and the
CartDrawer ([src/components/shop/CartDrawer.tsx](../../../src/components/shop/CartDrawer.tsx)).
Opens with the definitive route-by-route staleness audit that scopes G2/G4 and feeds content
gaps to TASK-056/G7.

**Visual/copy only.** Out of scope (deliberately): one-click buy, upsell modal, and the
promo-code field visible in the handoff — all TASK-043 (v1.4). No changes to checkout, stock
validation semantics, GA4 events, or the cart store's merge/persist behavior.

## Approach (chosen)

**Parallel restyles + shared content module** (Approach A). The page row and drawer row
genuinely differ (image size, typography, control scale, warning placement), so each surface
keeps its own markup; both read one new content module. A shared `CartLineItem` component
(Approach B) was rejected as two designs wearing one trench coat; an inline-string reskin
(Approach C) was rejected because WEEKLY mandates the content-config layer (feeds TASK-039
i18n extraction).

## 1. Staleness audit (runs first)

- Dev server on 3001; Playwright screenshots of every customer-facing route at desktop 1440
  and mobile 390: `/`, `/products`, one PDP, `/categories`, one category, `/cart` (empty +
  filled), `/checkout`, `/checkout/confirmation`, `/login`, `/register`, `/account`,
  `/account/orders` (list; `orders/[id]` is a known 500 — recorded as-is, fixed by G3),
  `/newsletter/confirm`, `/newsletter/unsubscribe`, 404 and root error pages. Auth routes
  visited as a seeded test customer. Admin routes excluded (outside the launch theme).
- Per-route EN-string sweep: grep of each route's page + component tree for English UI strings.
- **Deliverable**: `docs/planning/audits/2026-08-04-storefront-staleness-audit.md` — one table:
  route → design verdict (Mirox / stale) → EN strings found → content gaps (routed to
  TASK-056/G7). Indexed in docs/README.md. Screenshots stay in the session scratchpad as
  working evidence (not committed); the doc records findings. The G2/G4 rows become those
  groups' definitive scope lists.

## 2. Content module + store extension

**New `src/content/cart.ts`** (pattern of `site.ts`/`home.ts`), holding all strings for both
surfaces:

- Page: «Кошик», items-count line via a Ukrainian plural helper (1 товар / 2 товари /
  5 товарів — `Intl.PluralRules("uk")`), «← Продовжити покупки».
- Summary: «Разом», «Товари», «Доставка» → **«Розраховується при оформленні»** (neutral by
  explicit decision — true today; G2 flips this string in this file when the ship methods
  actually become NP-style; the handoff's «за тарифами Нової Пошти» would be false until
  then, per the site's retract-false-claims precedent in `site.ts`), «До сплати»,
  «ОФОРМИТИ ЗАМОВЛЕННЯ», «Безпечна оплата».
- Empty states: «Кошик порожній», «Перейти в каталог».
- Clear-cart action + AlertDialog copy («Очистити кошик», title/description/confirm/cancel).
- Stock warnings: «Немає в наявності», «Доступно лише N»; validating state «Перевірка…».
- Drawer: header «Кошик (N)», secondary CTA «Переглянути кошик»; the primary CTA is the same
  uppercase «ОФОРМИТИ ЗАМОВЛЕННЯ» on both surfaces.
- Variant labels: «Колір:», «Розмір:».

**`CartItem` extension** ([src/stores/cart.store.ts](../../../src/stores/cart.store.ts)):
optional `color?: string` and `size?: string` (refinement of the approved "variantLabel +
color" — raw parts composed at render as «Колір: X · Розмір: Y», omitting missing parts).
The three `addItem` callers — product-detail-client, QuickViewDialog, BoughtTogether — pass
`size` from the selected variant and `color` from the product's own colorway value (the one
the PDP renders as the active swatch, per the TASK-037 `styleGroup` model) when the product
has one;
`name` reverts to the plain product name (drops the TASK-037 ` — ${variant.value}` suffix,
which the separate `size` field now replaces). Backward compatible: old persisted carts keep
combined-name items with no `size`/`color` and simply render no variant line. Merge key
(productId + variantId) unchanged.

## 3. Cart page

Presentation-only rewrite of `cart/page.tsx`. **Untouched logic**: stock validation flow
(`/api/cart/validate` loop), GA4 `trackViewCart`, store calls, mounted/skeleton hydration
pattern, router pushes.

- **Layout**: one responsive card-row list replaces the desktop `Table` / mobile-cards split.
  Grid: 1 column mobile → `lg:grid-cols-[minmax(0,1fr)_minmax(340px,400px)]` (declare the
  mobile track explicitly — implicit-track overflow lesson from TASK-037).
- **Item card**: `rounded-2xl` row on `bg-card`/`border-border` tokens; 96×110 image
  (rounded-xl, object-cover; ShoppingBag placeholder fallback kept), name, variant line,
  «X грн» via `formatPrice`, joined −/qty/+ stepper (single bordered group; the handoff's
  plain qty `span` replaces today's `<input type=number>` — direct typing is removed for
  handoff fidelity), line total, trash icon button with `aria-label` «Видалити». `+` stays
  disabled at `maxStock`. Stock warnings render inside the card under the variant line
  (destructive color for out-of-stock, muted for insufficient).
- **Mobile** (derived — no handoff): same card wraps to two rows (image + info / stepper +
  line total); covered by the visual gate at 390px.
- **Below the list**: «← Продовжити покупки» link and a quiet «Очистити кошик» text action
  keeping its AlertDialog with UA copy.
- **Empty state**: dashed-border card (`border-dashed`), «Кошик порожній», underlined
  «Перейти в каталог» → `/products`.
- **Summary column**: `lg:sticky lg:top-24`; card with «Разом» heading; rows «Товари (N)» /
  subtotal and «Доставка» / neutral copy; divider; «До сплати» with 20px-scale total;
  full-width inverted CTA «ОФОРМИТИ ЗАМОВЛЕННЯ» (uppercase, letter-spaced); lock icon +
  «Безпечна оплата» footnote. **No promo field.** Stock-issue alert box stays above the CTA;
  `disabled`/«Перевірка…» states kept. The «Taxes calculated at checkout» footnote is
  dropped (not in the handoff; UA VAT-inclusive pricing makes it noise).
- **Skeleton**: reshaped to the new card-row + summary geometry.
- Cleanup: `console.error` in the validate loop dropped (bare-catch convention).

## 4. CartDrawer

Visual + copy pass only; Sheet mechanics, analytics, and handlers stay.

- Header «Кошик (N)»; compact echo of the page card row: 80px image, name, variant line,
  small joined stepper, line total, remove (×) with `aria-label` «Видалити».
- Summary: «Товари (N)» / «Доставка» (same neutral string) / «До сплати»; primary
  «ОФОРМИТИ ЗАМОВЛЕННЯ», secondary «Переглянути кошик».
- Empty state matches the page's dashed-border pattern («Кошик порожній», «Перейти в
  каталог»).

## 5. Tests & verification

- **E2E** ([tests/e2e/cart.spec.ts](../../../tests/e2e/cart.spec.ts)): assertions → Ukrainian
  (`/порожній/i` for empty states, remove button `/видалити/i`, stepper by `+`/aria); keep
  the hydration-wait and heading-click patterns; sweep navigation/products specs for cart
  strings.
- **Unit**: plural helper + content-module shape tests; verify no existing tests reference
  removed strings.
- **Gates**: `npm run lint`, `typecheck`, `test:run`, `next build`; Playwright foreground,
  one project per command.
- **Visual-fidelity gate** (standing rule): rendered screenshots vs `Mirox Cart.dc.html` —
  desktop cart, mobile 390 cart, drawer, both empty states — user sign-off before PR.

## Error handling

Unchanged semantics: a failed stock-validate fetch shows no warning for that item (as today);
checkout stays blocked only on known stock issues or in-flight validation. Store hydration
mismatch handling (mounted flag) unchanged.

## Decisions log

| Decision                                        | Choice                                         | Why                                                                                                  |
| ----------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Variant info                                    | Extend `CartItem` with `color`/`size`          | Faithful to handoff; name-parsing fragile; old carts degrade gracefully                              |
| Clear Cart / stock warnings / validating states | Keep all, restyle                              | G1 is visual/copy only — no functionality removed                                                    |
| Shipping row copy                               | Neutral «Розраховується при оформленні»        | Handoff's NP wording false until G2's ship-method decision; string lives in `cart.ts` for G2 to flip |
| Qty input                                       | Handoff's span (typing removed)                | Handoff fidelity; steppers remain the only mutation path                                             |
| Structure                                       | Parallel page/drawer markup + shared `cart.ts` | Surfaces genuinely differ; content layer mandated for i18n extraction                                |
