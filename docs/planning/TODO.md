# TODO

**Last Updated**: 2026-07-16

Program spec: [Mirox Shop Program Design](../superpowers/specs/2026-07-14-mirox-shop-program-design.md) · Current week: [WEEKLY.md](WEEKLY.md)

---

## 🔄 In Progress

_None. TASK-033 completed 2026-07-14 (PR #16) — see [DONE.md](DONE.md)._

## 📋 Planned (v1.3 — "Mirox Rebrand Demo")

#### [TASK-038b] Payments & delivery research spike (Ukraine)

**Priority**: 🔴 Critical
**Status**: 📋 Planned
**Effort**: M
**Dependencies**: [TASK-033]

**Description**: Decision doc, no code. Stripe does not onboard Ukrainian merchants → evaluate LiqPay / WayForPay / Fondy / monobank acquiring (fees, API, merchant requirements, refunds/webhooks); scope Nova Poshta API; define UAH currency strategy. Output: gateway decision + integration plan for TASK-048/049. Candidate for Ultracode research fan-out workflow.

**Acceptance Criteria**:

- [ ] Comparison matrix of ≥3 gateways with fees and API capabilities
- [ ] Recommended gateway with rationale; merchant-account prerequisites listed
- [ ] Nova Poshta integration scoped (API, branch picker, cost calc)
- [ ] UAH pricing strategy defined (single- vs multi-currency)

#### [TASK-034] Design system & rebrand foundation

**Priority**: 🟠 High
**Status**: 📋 Planned
**Effort**: XL
**Dependencies**: [TASK-033]

**Description**: Mirox Shop black/white luxury-minimal design system: color tokens (#000000, #FFFFFF, #1A1A1A, #F5F5F5), typography, logo assets, animation primitives (fade-in, hover, skeleton loaders, transitions); restyle shared components (header, footer, buttons, cards). Token-driven so later design files re-skin tokens, not components. Candidate for Ultracode restyle-sweep workflow.

**Acceptance Criteria**:

- [ ] Design tokens defined and consumed by all shared components
- [ ] Header, footer, buttons, cards restyled to the screenshot's direction
- [ ] Animation primitives available as reusable utilities
- [ ] No bright colors anywhere in the customer-facing theme

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

**Acceptance Criteria**:

- [ ] Locale infrastructure with UA default, RU toggle
- [ ] Customer-facing storefront strings externalized
- [ ] Prices render in UAH with correct formatting

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
