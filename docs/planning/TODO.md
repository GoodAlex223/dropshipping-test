# TODO

**Last Updated**: 2026-07-18

Program spec: [Mirox Shop Program Design](../superpowers/specs/2026-07-14-mirox-shop-program-design.md) · Current week: [WEEKLY.md](WEEKLY.md)

---

## 🔄 In Progress

_None. TASK-033 completed 2026-07-14 (PR #16) — see [DONE.md](DONE.md)._

## 📋 Planned (v1.3 — "Mirox Rebrand Demo")

#### [TASK-035] Homepage rebrand

**Priority**: 🟠 High
**Status**: 📋 Planned
**Effort**: L
**Dependencies**: [TASK-034]

**Description**: Hero banner (model photo, "STYLE. QUALITY. CONFIDENCE.", catalog + new-arrivals CTAs), benefit cards (delivery, size exchange, quality, 24/7 support), "Why choose us" block, featured/hits sections, social links, rebranded footer.

**Acceptance Criteria**:

- [ ] First screen matches brief: slogan, subtitle, two CTAs
- [ ] Benefit cards and "Why choose us" blocks present
- [ ] Social section (Instagram, TikTok, Telegram) present
- [ ] Top announcement banner slot (free delivery/promo text) — client list #2 item 13
- [ ] Hero uses real model photography (client to supply; placeholder until then) — item 14
- [ ] Social follower counters only if real numbers supplied — item 16

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

_None yet — audit findings from TASK-033 may add entries here or to BACKLOG.md._
