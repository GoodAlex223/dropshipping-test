# TODO

**Last Updated**: 2026-07-29

Program spec: [Mirox Shop Program Design](../superpowers/specs/2026-07-14-mirox-shop-program-design.md) · Current week: [WEEKLY.md](WEEKLY.md)

---

## 🔄 In Progress

#### [TASK-057] Mirox design adoption — dark theme, homepage realignment, task-map revision

**Priority**: 🟠 High
**Status**: 🔄 In Progress — build complete, user sign-off granted 2026-07-29; PR #24 in review
**Effort**: L
**Dependencies**: [TASK-034], [TASK-035]
**Branch**: `feat/task-057-design-adoption`
**Spec**: [2026-07-27-mirox-design-adoption-design.md](../superpowers/specs/2026-07-27-mirox-design-adoption-design.md)
**Plan**: [2026-07-27_task-057-design-adoption.md](plans/2026-07-27_task-057-design-adoption.md)
**PR**: [#24](https://github.com/GoodAlex223/dropshipping-test/pull/24) (in review)

**Description**: Dark-theme token flip (`:root` → the Mirox dark palette; `[data-surface="dark"]` inversion machinery removed as dead code), homepage/header/footer realignment to `docs/design/design_handoff_mirox/` (`Mirox Home.dc.html`), a Mirox Ukrainian clothing seed replacing the electronics catalog (destructive reset guarded by `assertLocalDatabase()` / `SEED_ALLOW_REMOTE=1`), and UAH price display via a shared `formatPrice()`. Supersedes the homepage _visuals_ of TASK-035/PR #23 — its content-config layer and section architecture survive. Also revises the v1.3/v1.4 task map (see TASK-036/037/039 re-scopes and the TASK-055/056 annotations below; TASK-043/048/049 annotations recorded in BACKLOG.md pending their v1.4 promotion).

**Acceptance Criteria**:

- [x] Token flip: dark `:root` default, `data-surface` machinery removed, colour guard re-pointed at the new palette
- [x] Homepage realigned to `Mirox Home.dc.html` (header, hero, benefit strip, "Новинки" rail, WhyChooseUs, testimonials, footer) with Ukrainian copy
- [x] Mirox clothing seed (8 products, UAH prices, `brand: "Mirox"`) replaces the electronics catalog, with a guarded destructive reset
- [x] UAH display via shared `formatPrice()` (`src/lib/format.ts`) across all customer-facing price renders
- [x] Visual-fidelity gate: rendered homepage vs `Mirox Home.dc.html` / `reference.png`, explicit user sign-off (granted v3, 2026-07-29, after 3 revision rounds)

## 📋 Planned (v1.3 — "Mirox Rebrand Demo")

#### [TASK-036] Catalog redesign + filters

**Priority**: 🟠 High
**Status**: 📋 Planned
**Effort**: L
**Dependencies**: [TASK-034]

**Description** (re-scoped by TASK-057, 2026-07-27 — spec §4): Re-scope to `Mirox Catalog.dc.html`: filter bar (Фільтри, Ціна, Бренд, Розмір chips S–XXL, Колір, Наявність), white-active sort buttons, grid `auto-fill minmax(240px,1fr)`, 36px square pagination, card badges (НОВИНКА white / -15% dark-bordered), sizes row «S · M · L · XL». Design shows 3 sort orders (Новинки / Ціна ↑ / Ціна ↓) vs the TODO's 4 incl. "popular" — reconcile in the task plan. Client-brief extras (second image on hover, quick-view, quick-buy, colour swatches) and the **hydration-gate AC stay**. _(Variants and `brand` field already exist in the Prisma schema.)_

**Acceptance Criteria**:

- [ ] All five filters functional and combinable
- [ ] Sort orders functional — design (`Mirox Catalog.dc.html`) shows 3 (Новинки / Ціна ↑ / Ціна ↓) vs. this TODO's previous 4 incl. "popular"; reconcile the exact set in this task's own plan (`getBestsellers()` in `src/lib/product-queries.ts` is the ready-made "popular" definition if kept)
- [ ] Filter state reflected in the URL (shareable)
- [ ] ProductCard: second image on hover, quick-view, quick-buy, circular color swatches — client list #2 items 18/19 — plus card badges (НОВИНКА white / -15% dark-bordered) and a sizes row («S · M · L · XL») per `Mirox Catalog.dc.html`
- [ ] Hydration invariant preserved or replaced: the E2E hydration gate in `tests/e2e/products.spec.ts` (`waitForSelector("[data-testid='product-card']")`) relies on product cards being client-rendered by a post-hydration `useEffect` fetch. If this rewrite moves product rendering to server components or streaming SSR, that gate stops being a valid hydration signal — replace it with an equivalent readiness signal, or the WebKit `fill()`-before-hydration race diagnosed in TASK-038a returns undetected.

#### [TASK-037] Product page redesign

**Priority**: 🟠 High
**Status**: 📋 Planned
**Effort**: L
**Dependencies**: [TASK-034]

**Description** (re-scoped by TASK-057, 2026-07-27 — spec §4): Re-scope to `Mirox Product.dc.html`: 96px thumbnail rail, `clamp(420px,100vh−190px,620px)` photo, colour swatches (active white 2px border), size buttons 52px, «Відкрити фото замірів», stock line + «Доставка Новою Поштою», ДОДАТИ В КОШИК → «✓ ДОДАНО В КОШИК» state. New components: **`SizePicker.tsx`** (formula: XXL h≥190\|w≥95; XL h≥184\|w≥85; L h≥176\|w≥72; M h≥168\|w≥60; else S — placeholder until client size charts arrive; TASK-045 later upgrades it) and **`BoughtTogether.tsx`** (3 items, struck-through sum → bundle price). «Купити в 1 клік» overlaps TASK-043 quick-order — decide there or in TASK-037's plan.

**Acceptance Criteria**:

- [ ] Gallery, size/color selection, size table implemented per `Mirox Product.dc.html`
- [ ] Stock counter shows real inventory below a threshold
- [ ] Related + recently-viewed sections implemented
- [ ] `SizePicker.tsx` implements the placeholder height/weight formula (XXL h≥190\|w≥95; XL h≥184\|w≥85; L h≥176\|w≥72; M h≥168\|w≥60; else S) pending client size charts (TASK-045 upgrades it later)
- [ ] `BoughtTogether.tsx` shows 3 items with a struck-through sum collapsing to a bundle price
- [ ] «Купити в 1 клік» resolved — either built here or explicitly deferred to TASK-043's quick-order (decide in this task's plan)

#### [TASK-039] i18n foundation

**Priority**: 🟠 High
**Status**: 📋 Planned
**Effort**: L
**Dependencies**: [TASK-033]

**Description** (scope shifted by TASK-057, 2026-07-27 — spec §4): Scope shifts: externalize the _now-hardcoded Ukrainian strings_ into locale files + locale infra with UA default / RU toggle. `formatPrice()` lands early via TASK-057; §7.4-compliance verification remains TASK-039's AC. The monobank payments-prerequisite escalation is unchanged. Library choice (e.g., next-intl) decided in plan.

**⚠️ Dependency escalated by [TASK-038b]**: this is no longer only a language-law item. **monobank will not approve internet acquiring without a Ukrainian-language version of the site** ([decision doc §4.2](../superpowers/specs/2026-07-16-ukraine-payments-delivery-decision.md)) — so if the Plata-by-mono branch is chosen, TASK-039 becomes a **hard prerequisite for payments (TASK-048)**, not a parallel track. UAH formatting is specified in decision doc §7.4 (uk-UA: non-breaking-space thousands, comma decimal, `₴`/`грн` **after** the amount, ДСТУ 3582:2013) — use `Intl.NumberFormat('uk-UA', …)`, not hand-rolled formatting.

**Acceptance Criteria**:

- [ ] Locale infrastructure with UA default, RU toggle
- [ ] Customer-facing storefront strings — hardcoded Ukrainian since TASK-057 (`src/content/*.ts` config layer + inline component strings on homepage/header/footer) — externalized into locale files
- [ ] `formatPrice()` (landed via TASK-057, `src/lib/format.ts`) verified compliant with decision doc §7.4

#### [TASK-040] CI extensions

**Priority**: 🟡 Medium
**Status**: 📋 Planned
**Effort**: M
**Dependencies**: [TASK-033]

**Description**: Lighthouse CI with performance budget (brief demands PageSpeed 95+), preview deploys per PR, scheduled weekly `npm audit` workflow.

**Acceptance Criteria**:

- [ ] Lighthouse CI job with budget failing PRs below threshold
- [ ] Preview deploy per PR with URL comment
- [ ] Weekly scheduled audit workflow opening an issue on findings

---

## ⏸️ Blocked

_None._

## 🔀 Spawned

#### [TASK-055] Content & legal pages

**Priority**: 🟠 High
**Status**: 📋 Planned
**Effort**: M
**Dependencies**: [TASK-035]

**Description**: Build the seven footer routes that TASK-035 stopped linking to because they don't exist yet and 404 (`/contact`, `/faq`, `/shipping`, `/returns`, `/about`, `/privacy`, `/terms`; see `Footer.tsx`'s `shopLinks` comment). Three of them — public offer/terms, privacy policy, and return policy — are payment-gateway onboarding prerequisites per the [Ukraine payments & delivery decision](../superpowers/specs/2026-07-16-ukraine-payments-delivery-decision.md) §5.3, and block TASK-048 until they exist. Copy for all seven must come from the client or a lawyer; this task builds the pages, it cannot originate the legal content.

**📐 Design update (TASK-057, 2026-07-27 — spec §4)**: `/contact` layout is now designed (`Mirox Contacts.dc.html` — social cards, delivery/payment + returns blocks, about + stat cards). Still blocked on client/lawyer copy; legal pages remain gateway-onboarding prerequisites. Two decisions recorded during TASK-057's visual-gate review: (1) per user decision (2026-07-28), the header/footer info links (Про нас, Доставка, Контакти, etc.) stay hidden until this page ships — TASK-057 did not add dead links, per the established no-dead-links rule; (2) the return window is **USER-APPROVED as «14 днів»** (2026-07-28) for use on this page once built — see the TASK-056 update below.

**Acceptance Criteria**:

- [ ] All seven routes exist and render real, client/lawyer-approved copy (no lorem ipsum placeholders)
- [ ] Public offer/terms, privacy policy, and return policy specifically reviewed against §5.3's onboarding checklist before TASK-048 depends on them
- [ ] `Footer.tsx`'s `shopLinks` restored to link to these pages once live, and its "removed links" comment updated

#### [TASK-056] Client content inventory

**Priority**: 🟠 High
**Status**: 📋 Planned
**Effort**: S
**Dependencies**: None

**Description**: Single consolidated ask covering everything the client still owes for the Mirox rebrand to leave placeholder/retracted state, spawned by TASK-035's final review so these don't dribble out piecemeal across TASK-036/037/039. This task is the checklist and the client round-trip, not implementation.

**Update (TASK-057, 2026-07-27 — spec §4)**: generated placeholders now exist for hero/products/logo (PNG); the items below are updated to reflect that. Still owed: real photography, logo vector source, real social URLs/counts, size charts, claim re-confirmation, contact details, legal copy.

**Acceptance Criteria**:

- [ ] Hero photography confirmed or supplied — TASK-057 shipped a generated placeholder (`public/images/hero-model-2.png`; `home.hero.image` is no longer `null`); real client photography is still owed
- [ ] Product photography confirmed or supplied — TASK-057 shipped generated placeholders for all 8 SKUs (`public/images/products/*.png`); real garment photography is still owed (relates TASK-036/037)
- [ ] Logo vector/source file — TASK-057 replaced the code-drawn `<Logo/>` with a generated PNG (`public/images/logo.png`) in Header/Footer; the vector source file is still owed
- [ ] Real social URLs and follower counts for Instagram, TikTok, Telegram (`site.socials` in `src/content/site.ts` — still placeholder `@miroxshop` handles)
- [ ] The three client claim figures re-confirmed (`site.claims`: OLX sales, Instagram orders, customer rating)
- [ ] Announcement banner copy, once a real promotion exists (`site.announcement`, currently `null`)
- [ ] Free-shipping threshold/currency — still genuinely unconfirmed, no threshold exists anywhere in the order path (see TASK-035's Finding 1). The **return window is now resolved**: «14 днів» is USER-APPROVED (2026-07-28, recorded on TASK-055 above) for use once the `/contact`/policy page ships
- [ ] Contact details (phone/email/address) for the `/contact` page (feeds TASK-055)
- [ ] Size charts (feeds TASK-037/TASK-045 — `SizePicker.tsx`'s height/weight formula is an interim placeholder until these arrive)
- [ ] Legal-page content or lawyer engagement (feeds TASK-055)
