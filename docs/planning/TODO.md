# TODO

**Last Updated**: 2026-07-21

Program spec: [Mirox Shop Program Design](../superpowers/specs/2026-07-14-mirox-shop-program-design.md) · Current week: [WEEKLY.md](WEEKLY.md)

---

## 🔄 In Progress

_None. TASK-035 completed 2026-07-21 (PR #21; prod hotfix PR #22) — see [DONE.md](DONE.md)._

## 📋 Planned (v1.3 — "Mirox Rebrand Demo")

#### [TASK-036] Catalog redesign + filters

**Priority**: 🟠 High
**Status**: 📋 Planned
**Effort**: L
**Dependencies**: [TASK-034]

**Description**: Catalog page in the new design with filters (price, size, color, brand, availability) and sorting (new, popular, price ↑/↓). Variants and `brand` field already exist in the Prisma schema.

**Acceptance Criteria**:

- [ ] All five filters functional and combinable
- [ ] Four sort orders functional ("popular" definition decided in plan)
- [ ] Filter state reflected in the URL (shareable)
- [ ] ProductCard: second image on hover, quick-view, quick-buy, circular color swatches — client list #2 items 18/19
- [ ] Hydration invariant preserved or replaced: the E2E hydration gate in `tests/e2e/products.spec.ts` (`waitForSelector("[data-testid='product-card']")`) relies on product cards being client-rendered by a post-hydration `useEffect` fetch. If this rewrite moves product rendering to server components or streaming SSR, that gate stops being a valid hydration signal — replace it with an equivalent readiness signal, or the WebKit `fill()`-before-hydration race diagnosed in TASK-038a returns undetected.

#### [TASK-037] Product page redesign

**Priority**: 🟠 High
**Status**: 📋 Planned
**Effort**: L
**Dependencies**: [TASK-034]

**Description**: Large gallery, size/color pickers, size table, stock counter ("Only N left"), related products, recently viewed.

**Acceptance Criteria**:

- [ ] Gallery, size/color selection, size table implemented
- [ ] Stock counter shows real inventory below a threshold
- [ ] Related + recently-viewed sections implemented

#### [TASK-039] i18n foundation

**Priority**: 🟠 High
**Status**: 📋 Planned
**Effort**: L
**Dependencies**: [TASK-033]

**Description**: Ukrainian as default customer-facing locale (language-law requirement), Russian secondary; UAH price formatting. Library choice (e.g., next-intl) decided in plan.

**⚠️ Dependency escalated by [TASK-038b]**: this is no longer only a language-law item. **monobank will not approve internet acquiring without a Ukrainian-language version of the site** ([decision doc §4.2](../superpowers/specs/2026-07-16-ukraine-payments-delivery-decision.md)) — so if the Plata-by-mono branch is chosen, TASK-039 becomes a **hard prerequisite for payments (TASK-048)**, not a parallel track. UAH formatting is specified in decision doc §7.4 (uk-UA: non-breaking-space thousands, comma decimal, `₴`/`грн` **after** the amount, ДСТУ 3582:2013) — use `Intl.NumberFormat('uk-UA', …)`, not hand-rolled formatting.

**Acceptance Criteria**:

- [ ] Locale infrastructure with UA default, RU toggle
- [ ] Customer-facing storefront strings externalized
- [ ] Prices render in UAH with correct formatting (per decision doc §7.4)

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

**Acceptance Criteria**:

- [ ] Hero photography confirmed or supplied (currently `home.hero.image = null` in `src/content/home.ts`)
- [ ] Logo vector/source file (current `<Logo/>` is code-drawn per TASK-034)
- [ ] Real social URLs and follower counts for Instagram, TikTok, Telegram (`site.socials` in `src/content/site.ts`)
- [ ] The three client claim figures re-confirmed (`site.claims`: OLX sales, Instagram orders, customer rating)
- [ ] Announcement banner copy, once a real promotion exists (`site.announcement`, currently `null`)
- [ ] Free-shipping threshold/currency and the return window (currently unconfirmed "14 days") — see TASK-035's Finding 1 for why the current codebase can't invent either
- [ ] Contact details (phone/email/address) for the `/contact` page (feeds TASK-055)
- [ ] Size charts (feeds TASK-037/TASK-045)
- [ ] Legal-page content or lawyer engagement (feeds TASK-055)
