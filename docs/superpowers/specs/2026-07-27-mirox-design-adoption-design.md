# Mirox Design Adoption — Dark Theme, Homepage Realignment & Task-Map Revision

**Date**: 2026-07-27
**Status**: Approved (brainstorm 2026-07-27)
**Supersedes**: design direction of [2026-07-24 Homepage Polish design](2026-07-24-mirox-homepage-polish-design.md) (visuals only — its content-config layer, section architecture, and content constraints survive); revises the A-track task descriptions in the [Mirox program design](2026-07-14-mirox-shop-program-design.md)
**Design source of truth**: [`docs/design/design_handoff_mirox/`](../../design/design_handoff_mirox/) — 7 HTML screen prototypes + [`mirox-design-spec.md`](../../design/design_handoff_mirox/mirox-design-spec.md), reconstructed from the client mockup [`docs/reference/reference.png`](../../reference/reference.png) and client-approved

---

## 1. Context

The client supplied a more accurate full-page mockup (`docs/reference/reference.png`) than the blurry concept screenshot TASK-035/PR #23 were built against. From it, a complete high-fidelity design handoff was produced in Claude Design (`docs/design/design_handoff_mirox/`): Home, Catalog, Product, Cart, Checkout, Contacts, and Mobile screens, plus a spec with an exact block→repo-file mapping, design tokens, interaction notes, and content constraints already reconciled with codebase reality (free-shipping claim stays retracted, COD confirmed, no size-exchange service). Product/model photography placeholders were generated (17 images inside the handoff).

The handoff is not production code. The work is to (a) adopt it as the design source of truth across the v1.3+ task map, and (b) build the first chunk.

## 2. Decisions (locked during brainstorming, 2026-07-27)

1. **Scope**: Replan + first build in one effort. The first build chunk is **TASK-057**: dark-theme token flip + homepage/header/footer realignment + Mirox clothing seed. Catalog, product, cart, checkout remain separate tasks.
2. **Language/currency sequencing**: Redesigned pages ship with **Ukrainian copy hardcoded now** (via the existing content-config layer where possible) and **UAH display formatting**. TASK-039 later externalizes strings into locale infra and adds Russian. Stripe keeps charging test-mode `usd` on the numeric amounts until TASK-048 — a known, documented mismatch.
3. **Theme mechanism**: **Flip `:root` to the dark palette** (Approach 1). The whole app becomes dark by default, admin included (admin gets a functional-contrast pass only, no redesign). Rejected: scoping dark to the `(shop)` layout (portaled components — cart drawer, dialogs, toasts — render to `<body>` outside the scope) and per-section `data-surface` wrapping (noise + body seams).
4. **Assets/git**: Commit the handoff as canonical (+ `reference.png` + the client `.docx`); copy app-needed images into `public/`; **delete `docs/images/`** — verified byte-identical duplicate of the handoff's `images/` folder (MD5-compared, 2026-07-27).
5. **Prod re-seed** is destructive and therefore a **separate, explicitly user-approved step** after merge/deploy — never an automatic part of the task.

## 3. TASK-057 build spec

### 3.1 Token flip (`src/app/globals.css`, tailwind theme)

Move the Mirox dark palette into `:root` (values from handoff §1):

| Token                                | Value                            | Notes                                                         |
| ------------------------------------ | -------------------------------- | ------------------------------------------------------------- |
| `--background`                       | `#000000`                        | page bg                                                       |
| `--foreground`                       | `#FFFFFF`                        |                                                               |
| `--card`                             | `#0D0D0D`                        | handoff "panel"; cards/panels                                 |
| `--card-foreground`                  | `#FFFFFF`                        |                                                               |
| `--border`                           | `#1A1A1A`                        | also secondary surfaces ("panel-2")                           |
| `--border-strong`                    | `#333333`                        | **new token** — hover borders; must be registered in `@theme` |
| `--muted-foreground`                 | `#A3A3A3`                        | secondary text                                                |
| `--text-faint`                       | `#737373`                        | **new token** — muted text tier; register in `@theme`         |
| `--primary` / `--primary-foreground` | `#FFFFFF` / `#000000`            | primary button white-on-black, hover `#E5E5E5`                |
| status accents                       | stock `#4ADE80`, stars `#FBBF24` | the only permitted non-monochrome values                      |

Radii per handoff: buttons/inputs 10px, cards 14–16px, panels 20px, badges pill. Typography: Manrope 400–800 (already wired as `--font-manrope`); buttons 13px/800/tracking 0.06em/UPPERCASE. Exact per-element values come from the `.dc.html` prototypes (inline styles are the spec).

Consequences to handle in the same change:

- **Remove all `data-surface="dark"` usages** (7 files: Header, Footer, WhyChooseUs, Hero, AnnouncementBar, `(shop)/page.tsx`, root `opengraph-image.tsx`) and delete the `[data-surface="dark"]` CSS block — dark is now the default, the inversion machinery is dead code. Light sections, if ever needed later, are reintroduced deliberately.
- **Fold `[data-surface="dark"]`-scoped overrides into base rules** — specifically the `87eed62` hover-lift glow and its reduced-motion rejoin. Their selectors silently stop matching once the attribute disappears; the glow becomes the base `.hover-lift` behavior.
- **Re-point the colour guard** (`tests/unit/no-bright-colors.test.ts`, both layers — utility classes and token values) at the new palette; clean the 4 deferred bright utilities on cart (×3) and PDP (×1) in the same sweep, closing their BACKLOG entries.
- **Admin functional-contrast pass**: admin inherits dark via shared tokens; fix only unreadable/unusable spots, no redesign.
- **Showcase themes untouched** (they scope their own tokens to their subtree).
- Sweep for light-bg assumptions (black shadows, hardcoded light hexes) across storefront pages that are not yet redesigned — they must be _coherent_ in dark, not pixel-perfect; their own tasks (TASK-036/037/043…) bring them to spec.

### 3.2 Homepage realignment (per `Mirox Home.dc.html`)

- **Header** (`src/components/common/Header.tsx`): sticky, `rgba(0,0,0,.9)` + backdrop-blur; client logo `public/images/logo.png` (white-on-transparent PNG, h 42px desktop / 36px mobile, via `next/image`) replaces the code-drawn `<Logo/>` in Header/Footer (vector source still owed — TASK-056). The handoff contradicts itself here (its spec §1 says keep the code `<Logo/>`, its README/§5 say use `logo.png`); **this spec resolves it: use the client PNG** — it is the client's actual mark, and swaps for vector when TASK-056 delivers. Icons: search, account, wishlist, cart-with-counter per prototype (wishlist icon may be non-functional until TASK-041 — decide in plan whether to show it).
- **Header nav — no-404 rule**: the mockup shows Каталог · Новинки · Бестселери · Про нас · Доставка · Контакти. Only resolvable targets ship now: Каталог (`/products`), Новинки (`/products?sort=newest` or equivalent supported sort), Бестселери (only if a supported sort/filter target exists; otherwise omitted). Про нас / Доставка / Контакти join when TASK-055 lands. This intentional fidelity deviation is documented here; do not "fix" it by adding dead links (established rule from TASK-035).
- **Hero** (`src/components/home/Hero.tsx`, `src/content/home.ts`): switch to the existing image-variant layout by populating `home.hero.image` with the generated model photo (`public/images/hero-model.png`); 2 columns (text left / photo right ~640px); eyebrow «НОВА КОЛЕКЦІЯ» with dash-line, H1 «СТИЛЬ. ЯКІСТЬ. ВПЕВНЕНІСТЬ.», subtitle from brand config, primary + secondary CTAs; **CSS vignette overlay** on the photo — 4 linear gradients (bottom strong to 45%, top light 16%, sides to 20%), `pointer-events: none`, so the photo is swappable while the effect stays.
- **Benefit strip** (`src/components/common/BenefitStrip.tsx`, `home.benefits`): exactly 4 cells with the 1px-grid gap hack (#1A1A1A): Швидка доставка (По всій Україні) / Преміум якість (Тільки найкращі матеріали) / Підтримка 24/7 (Ми завжди на зв'язку) / Оплата при отриманні (Без передоплати). **Not** «Безкоштовна доставка від 1000 грн» — retracted claim, stays retracted even though the client mockup shows it (handoff §4.1). **Not** «Обмін розміру» — service does not exist (client, 26.07.2026; handoff §4.2a).
- **«Новинки» rail** (`ProductRail.tsx` + `product-queries.ts`): 4 ProductCards, newest products (add `getNewArrivals()` if only `getBestsellers()` exists — decide in plan).
- **WhyChooseUs**: 2 columns — left: heading + 2 stat cards from `site.claims` (300+ OLX / 100+ Instagram; render only if non-null; never fed into structured data); right: 6 items with white dots, no size-exchange item.
- **Testimonials**: 2 cards — initial-avatar, name, stars, date right-aligned; data continues to come from real seeded reviews via `safeSection`-wrapped queries (the new seed's Ukrainian reviews are what renders — §3.3).
- **Footer**: benefit line from updated `site.footerBenefits` (size-exchange → «Оплата при отриманні»), socials from `site.socials` (placeholder `@miroxshop` handles until TASK-056), copyright line.
- **Copy**: all customer-visible homepage/header/footer strings go Ukrainian — through `src/content/{brand,home,site}.ts` where the config layer exists; inline component strings hardcoded UA and left greppable for TASK-039 externalization.

### 3.3 Mirox clothing seed (`prisma/seed-data/`)

- **Products**: replace the electronics catalog with the Mirox clothing range from the references — Худі Mirox Basic 1290, Худі Mirox White 1290, Худі Oversize (price per prototype), Футболка Mirox 590, Олімпійка Mirox 1490, Лонгслів, Карго, Кепка Mirox 490 (names/prices exactly as in the `.dc.html` files; `-15%`-badged items get `comparePrice` per the cross-field validation rule). Category tree becomes clothing (Худі, Футболки, …). Variants: sizes S–XXL, colors Чорний/Білий where shown. `brand: "Mirox"`. **Prices are UAH-denominated numbers.**
- **Images**: copy from the handoff into `public/images/products/` (`p-*.png` as primary images; `pd-main.png` + `pd-thumb-*.png` as the Худі Mirox Basic gallery) and `public/images/hero-model.png`; seed image URLs point at these local paths. `next/image` with `DEFAULT_BLUR_DATA_URL` + `IMAGE_SIZES` handles optimization; hero loads with `priority`.
- **Orders/reviews**: re-point to the new SKUs; reviews become Ukrainian (the design's Олександр «Відмінна якість!…» / Дмитро «Швидка доставка…» included) so Testimonials and PDP reviews render coherent content. Subscribers seed unchanged.
- **Guardrails**: the seed is destructive (`deleteMany`) and `.env` has the duplicate-`DATABASE_URL` footgun — the plan must include an explicit check that `DATABASE_URL` resolves to local Postgres before any seed run. **Prod re-seed happens only as a separate step with explicit user approval** (decision #5).
- **E2E**: `tests/global-setup.ts` requires categories + active products — the new seed satisfies it; sweep E2E specs for electronics-specific text assertions.

### 3.4 UAH display

- New shared `formatPrice()` in `src/lib/` using `Intl.NumberFormat("uk-UA", …)` per the [payments decision doc](2026-07-16-ukraine-payments-delivery-decision.md) §7.4: non-breaking-space thousands separator, «грн» **after** the amount («1 290 грн»). No hand-rolled formatting.
- Because seed prices become UAH numbers, **every customer-facing price render switches to `formatPrice()` in this chunk** — ProductCard, PDP, cart, checkout summary, account orders, and order-confirmation email if cheap (else BACKLOG'd with an entry) — otherwise unredesigned pages would display UAH values as dollars (actively wrong). Admin price displays switch too if trivial, else BACKLOG'd.
- **Stripe unchanged**: still `currency: 'usd'` in test mode on the numeric amount until TASK-048. Documented mismatch; no real charges occur.

### 3.5 Testing & gates

- Unit: colour guard updated to the new palette with its non-vacuity checks intact; `formatPrice()` (incl. nbsp assertion); content-config invariants (4 benefit cells, no retracted claims); seed integrity test (SKU/category/review references resolve).
- E2E: full suite green on the new seed; **the hydration gate in `tests/e2e/products.spec.ts` is untouched** (this chunk does not change the catalog rendering path — that invariant transfers to TASK-036 as already recorded in its AC).
- **Visual-fidelity gate** (standing rule for design tasks): screenshot the rendered homepage — desktop and 390px mobile — against `Mirox Home.dc.html` / `reference.png`, and get explicit user sign-off before merge. Verify the compiled CSS for any token/utility the design depends on (registered-in-`@theme` lesson), and verify the live prod URL after deploy, not the Deploy badge.
- Lint/typecheck/build/format green; pre-commit hooks pass.

## 4. Task-map revision

| Task                                 | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **TASK-057** (new, v1.3, 🟠 High, L) | The §3 build. Depends on: nothing new (TASK-034/035 shipped). Supersedes the homepage _visuals_ of TASK-035/PR #23.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **TASK-036** catalog                 | Re-scope to `Mirox Catalog.dc.html`: filter bar (Фільтри, Ціна, Бренд, Розмір chips S–XXL, Колір, Наявність), white-active sort buttons, grid `auto-fill minmax(240px,1fr)`, 36px square pagination, card badges (НОВИНКА white / -15% dark-bordered), sizes row «S · M · L · XL». Design shows 3 sort orders (Новинки / Ціна ↑ / Ціна ↓) vs the TODO's 4 incl. "popular" — reconcile in the task plan. Client-brief extras (second image on hover, quick-view, quick-buy, colour swatches) and the **hydration-gate AC stay**.                                                                                                            |
| **TASK-037** product page            | Re-scope to `Mirox Product.dc.html`: 96px thumbnail rail, `clamp(420px,100vh−190px,620px)` photo, colour swatches (active white 2px border), size buttons 52px, «Відкрити фото замірів», stock line + «Доставка Новою Поштою», ДОДАТИ В КОШИК → «✓ ДОДАНО В КОШИК» state. New components: **`SizePicker.tsx`** (formula: XXL h≥190\|w≥95; XL h≥184\|w≥85; L h≥176\|w≥72; M h≥168\|w≥60; else S — placeholder until client size charts arrive; TASK-045 later upgrades it) and **`BoughtTogether.tsx`** (3 items, struck-through sum → bundle price). «Купити в 1 клік» overlaps TASK-043 quick-order — decide there or in TASK-037's plan. |
| **TASK-039** i18n                    | Scope shifts: externalize the _now-hardcoded Ukrainian strings_ into locale files + locale infra with UA default / RU toggle. `formatPrice()` lands early via TASK-057; §7.4-compliance verification remains TASK-039's AC. The monobank payments-prerequisite escalation is unchanged.                                                                                                                                                                                                                                                                                                                                                    |
| **TASK-043** cart (v1.4)             | Annotate: design now exists — `Mirox Cart.dc.html` (steppers, sticky summary, promo field, dashed-border empty state).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **TASK-048/049** payments/NP (v1.4)  | Annotate: checkout design exists — `Mirox Checkout.dc.html`: 3-step flow, NP radio-cards (відділення 80 грн / кур'єр 120 / поштомат 70 — published rates, negotiable, real economics need quotes), payment step «Карткою онлайн» vs «Оплата при отриманні» (COD → `AWAITING_COD`, decision doc §8.4). Shipping-method/currency swap in `stripe.ts` belongs to these tasks, not TASK-057.                                                                                                                                                                                                                                                   |
| **TASK-055** content pages           | Annotate: `/contact` layout now designed (`Mirox Contacts.dc.html` — social cards, delivery/payment + returns blocks, about + stat cards). Still blocked on client/lawyer copy; legal pages remain gateway-onboarding prerequisites.                                                                                                                                                                                                                                                                                                                                                                                                       |
| **TASK-056** client inventory        | Update items: generated placeholders now exist for hero/products/logo (PNG); still owed — real photography, logo vector source, real social URLs/counts, size charts, claim re-confirmation, contact details, legal copy.                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Program spec 2026-07-14**          | Frozen doc — add a dated update note in-place: A-track design source of truth is now the handoff + this spec; task details revised here. No rewrite.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

## 5. Docs & assets housekeeping

- Commit: `docs/design/design_handoff_mirox/` (canonical), `docs/reference/reference.png`, `docs/reference/Mirox_Shop_Улучшения_сайта.docx`, this spec.
- Delete: `docs/images/` (byte-identical duplicate of the handoff's `images/`; verified by MD5 before deletion).
- Index this spec + the handoff in `docs/README.md`; update TODO.md (TASK-057 + re-scopes/annotations from §4); roll WEEKLY.md to the week of 2026-07-27 with TASK-057 as primary goal.
- Propagation check at completion: correct project `CLAUDE.md` where the flip falsifies it (light-theme + `data-surface` inversion descriptions, homepage patterns, seed-data description mentioning electronics counts).

## 6. Out of scope (TASK-057)

- Catalog/product/cart/checkout/contacts page redesigns (their own tasks, §4).
- Locale infrastructure, RU locale, string externalization (TASK-039).
- Stripe currency change, COD payment method, Nova Poshta methods (TASK-048/049).
- Wishlist functionality (TASK-041) — icon-only if shown at all.
- Any fabricated data: ratings, counters, review counts beyond what the seed legitimately contains.

## 7. Risks

1. **Dark flip breaks unredesigned pages** — mitigated by the token-consuming architecture (TASK-034's hedge), a coherence sweep, and the colour guard; pixel-perfection on those pages is explicitly deferred to their tasks.
2. **Destructive seed against the wrong DB** — mitigated by the explicit `DATABASE_URL` check and the user-approved prod re-seed step.
3. **UAH/USD mixed surfaces** — mitigated by switching all customer-facing price renders in one chunk via the shared formatter.
4. **`data-surface` removal orphans scoped CSS** (hover-glow, reduced-motion rejoins) — named explicitly in §3.1; verified in compiled CSS.
5. **Repo weight** — ~24MB handoff + ~20MB `public/` images is accepted for the demo phase; real client photography later replaces generated placeholders (TASK-056).
