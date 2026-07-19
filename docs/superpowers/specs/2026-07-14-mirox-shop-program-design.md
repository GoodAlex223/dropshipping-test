# Mirox Shop Program Design — v1.2.0 → v2.0

**Date**: 2026-07-14
**Status**: Approved by user (brainstorming session)
**Source**: Client follow-up brief (Russian-language prompt + design concept screenshot, now
`docs/reference/client-brief.md` and `docs/reference/mirox-concept-screenshot.jpg`); Figma/design
files to arrive later.

---

## 1. Summary

Evolve the existing dropshipping e-commerce platform (frozen at v1.2.0, 2026-02-12) into **Mirox Shop** — a premium, black/white luxury-minimal men's clothing store targeting a **real production launch in Ukraine**. The work runs as a program of three milestone releases with two parallel tracks (A: brand & storefront UX, B: Ukraine launch infrastructure) plus a thin automation track (C).

### Decisions made during brainstorming

| Question          | Decision                                                                                                                                 |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Codebase strategy | Evolve this codebase in place (~60% of the brief already built and tested)                                                               |
| Target            | Straight to production launch in Ukraine (not demo-only)                                                                                 |
| Sequencing        | Two parallel tracks from day one (rebrand ∥ localization/payments)                                                                       |
| Automation        | Ultracode multi-agent workflows for heavy tasks + deterministic CI extensions; no Claude-in-CI PR bot, no scheduled cloud agents for now |
| Release model     | Milestone releases with small task PRs to main (existing `feat/task-NNN-*` convention), feature flags for incomplete user-facing work    |

### Brief coverage: existing vs. new

| Already built (v1.2.0)                                               | New in the brief                                                                                      |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Catalog, cart, checkout, orders                                      | Black/white luxury-minimal rebrand (design system)                                                    |
| Reviews (verified purchase, admin reply)                             | Wishlist (guest + synced), recently viewed                                                            |
| Admin (products, orders, categories, customers, reviews, newsletter) | Promo codes, promotions/sales with countdown timers, bundles                                          |
| SEO, sitemap, OG images, JSON-LD, Google Shopping feed               | Smart search with fuzzy autocomplete                                                                  |
| GA4 analytics, performance optimizations                             | Size assistant, one-click buy, post-purchase upsell modal                                             |
| Newsletter double opt-in                                             | Enhanced reviews (photos, height/weight/size), customer gallery                                       |
| Stripe payments                                                      | Ukraine localization: UAH, UA/RU i18n, local payment gateway, Nova Poshta, Telegram/SMS notifications |
| Multi-theme showcase system                                          | Social-proof widgets (real-data only)                                                                 |

---

## 2. Phase 0 — Resumption (TASK-033)

The repo has been frozen for 5 months. Before any feature work:

- Fresh `npm audit`; review dependency drift (conservative-update policy applies).
- Full validation baseline: `npm run build`, `npm run test:run`, `npm run test:e2e` (seeded DB).
- Create `docs/planning/WEEKLY.md` (required by global workflow; currently missing).
- Promote this program's v1.3 tasks into TODO.md/WEEKLY.md.

Nothing else starts until the baseline is green.

---

## 3. Milestone map

Task numbering continues from TASK-033. Track key: **A** = brand/storefront, **B** = Ukraine launch infra, **C** = automation/ops.

### v1.3 — "Mirox Rebrand Demo" (first client-visible drop)

| Task     | Track | Scope                                                                                                                                                                                                                                                                                                                                                                          |
| -------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| TASK-034 | A     | Design system & rebrand foundation: black `#000000` / white `#FFFFFF` / dark-grey `#1A1A1A` / light-grey `#F5F5F5` tokens; typography; logo assets; animation primitives (fade-in blocks, hover effects, skeleton loaders, smooth transitions); restyle shared components (header, footer, buttons, cards). Token-driven so later design files re-skin tokens, not components. |
| TASK-035 | A     | Homepage: hero banner (model photo, "STYLE. QUALITY. CONFIDENCE." slogan, catalog/new-arrivals CTAs), benefit cards (delivery, size exchange, quality, 24/7 support), "Why choose us" block, featured/hits sections, social links, footer.                                                                                                                                     |
| TASK-036 | A     | Catalog redesign + filters (price, size, color, brand, availability) and sorting (new, popular, price ↑/↓). Variants and `brand` field already exist in schema.                                                                                                                                                                                                                |
| TASK-037 | A     | Product page redesign: large gallery, size/color pickers, size table, stock counter ("Only 4 left"), related products, recently viewed.                                                                                                                                                                                                                                        |
| TASK-038 | B     | **Payments & delivery research spike** (decision doc, no code): Stripe does not onboard Ukrainian merchants → evaluate LiqPay / WayForPay / Fondy / monobank acquiring; Nova Poshta API scoping; UAH currency strategy. Output: gateway decision + integration plan.                                                                                                           |
| TASK-039 | B     | i18n foundation: Ukrainian default locale (required by Ukrainian language law for e-commerce serving Ukraine), Russian secondary; UAH price formatting.                                                                                                                                                                                                                        |
| TASK-040 | C     | CI extensions: Lighthouse CI with performance budget (brief demands PageSpeed 95+), preview deploys per PR, scheduled weekly `npm audit` workflow.                                                                                                                                                                                                                             |

### v1.4 — "Commerce & Conversion"

| Task     | Track | Scope                                                                                                                                                                                                 |
| -------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TASK-041 | A     | Wishlist: heart on cards, dedicated page, guest mode via localStorage, sync on login.                                                                                                                 |
| TASK-042 | A     | Smart search: fuzzy autocomplete over name/keywords/brand/category/color/SKU with photo+name+price in dropdown. Decision inside task: Meilisearch (already stubbed in env) vs Postgres FTS + pg_trgm. |
| TASK-043 | A     | Cart redesign + one-click buy / quick order + post-purchase upsell modal (24-hour 5% second-item discount).                                                                                           |
| TASK-044 | A     | Enhanced reviews: customer photos, height/weight/size fields; customer gallery ("Our customers") section.                                                                                             |
| TASK-045 | A     | Size assistant: rules-based recommendation from height/weight/age/build/fit-preference against size charts (no LLM dependency; satisfies the brief's "AI assistant").                                 |
| TASK-046 | B     | Promo codes & discounts: schema, admin CRUD, checkout application.                                                                                                                                    |
| TASK-047 | B     | Promotions section: new/hits/weekly-deals/bundles/last-chance groupings, countdown timers, admin management.                                                                                          |
| TASK-048 | B     | Payment gateway integration per TASK-038 decision (UAH charges, webhooks, refunds).                                                                                                                   |
| TASK-049 | B     | Nova Poshta integration: branch/locker picker, shipping cost calculation at checkout.                                                                                                                 |

### v2.0 — "Ukraine Launch"

| Task     | Track | Scope                                                                                                                                                                                                                                                                                                                                                                            |
| -------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TASK-050 | B     | Notifications: Telegram bot, SMS provider integration, rebranded transactional email templates.                                                                                                                                                                                                                                                                                  |
| TASK-051 | A     | Social-proof widgets — **real data only**: live product view counts from analytics, actual daily purchase counts, real aggregate rating; widgets hide below honesty thresholds. Fabricated counters are explicitly out of scope (deceptive). The "300+ OLX purchases / 100+ Instagram orders" claims are the client's own static marketing copy and remain their responsibility. |
| TASK-052 | B     | Admin sales/statistics dashboard (sales, orders, conversion metrics).                                                                                                                                                                                                                                                                                                            |
| TASK-053 | A     | SEO localization (UA metadata, hreflang) + final performance audit against the 95+ Lighthouse budget.                                                                                                                                                                                                                                                                            |
| TASK-054 | —     | Launch readiness: real product content, domain + SSL, production payment activation, final E2E pass.                                                                                                                                                                                                                                                                             |

### Deferred to BACKLOG.md (v2.1 candidates — YAGNI for launch)

Product comparison, gift wrapping, search history, CRM integration. Listed in the brief but none block launch or materially affect conversion.

---

## 4. Automation plan

**Ultracode multi-agent workflows** (in-session, user stays in the loop between phases):

- TASK-034 component restyle sweep: discover components → transform each in parallel (worktree isolation) → verify.
- TASK-038 research spike: multi-source research fan-out + adversarial verification of claims (gateway fees, API capabilities, merchant requirements).
- Pre-milestone review: multi-dimension find → adversarially-verify review workflow before each milestone merge.

**Deterministic CI (TASK-040)**: Lighthouse budgets, preview deploys, scheduled audit. Runs without operator involvement.

Explicitly out of scope for now: Claude-in-CI PR review bot, scheduled cloud agents.

---

## 5. Risks & coordination rules

1. **Prisma schema is the parallel-track collision point** (promo codes, review extensions, wishlist all touch `schema.prisma`). Rules: one migration per PR; rebase on main before merge; never two schema-changing PRs in flight simultaneously.
2. **Payment gateway choice blocks v1.4 Track B** — the TASK-038 spike therefore lands in v1.3.
3. **Design files pending** — token-driven components (TASK-034) are the hedge; worst case is re-skinning tokens, not rebuilding components.
4. **Scope creep** — the brief is a wishlist; this milestone map is the contract. New asks route through BACKLOG.md intake rules (🔵 user-flagged).
5. **Language-law compliance** — Ukrainian must be the default customer-facing locale; Russian is a secondary toggle.
6. **5-month freeze drift** — Phase 0 gates everything; expect dependency/security surprises there, not mid-feature.

---

## 6. Testing & quality bar

- Existing conventions hold: Vitest unit tests for every new API route (auth, validation, success, edge cases), Playwright E2E for new customer flows (wishlist, promo code application, checkout with new gateway in test mode), TDD per workflow policy.
- Lighthouse budget enforced in CI from v1.3 onward.
- Each milestone ends with the pre-milestone Ultracode review workflow + full validation run before tagging.
