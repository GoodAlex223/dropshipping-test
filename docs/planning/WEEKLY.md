# Weekly Plan

**Week**: Monday August 3 – Friday August 7, 2026
**Created**: 2026-08-04
**Sources**: [MILESTONES.md](MILESTONES.md) · [ROADMAP.md](ROADMAP.md) · [GOALS.md](GOALS.md) · [BACKLOG.md](BACKLOG.md) · [TODO.md](TODO.md) · prior WEEKLY (2026-07-27 week, archived below) · REVIEW-QUEUE.md (does not exist yet — created this week by G6)
**Cleanup Week?**: No — due by cadence (3 feature weeks since resumption, 🟤 pool ≫ 20 SP pending), but deferred by explicit user steer: this week finishes the rebrand and **next week (Aug 10–14) continues the visuals/translation launch push** (user, 2026-08-04 — "launch and show to users as fast as possible"). The OVERDUE docs-freshness linter competes for next week's single 🟤 slot; a full Cleanup Week is re-evaluated after the launch push.
**Context**: Mirox program v1.3. User-directed theme (2026-08-04 brainstorm): **finish the redesign + Ukrainian translation of the storefront** — cart, checkout, auth, account, newsletter and error surfaces still carry pre-rebrand design and English copy (transactional emails as the stretch 🏆); the data side rides along as a user-gated prod re-seed plus the USD shipping constants decision inside the checkout group.

---

## Parallel Work

- 🟡 **P1 — Prod data re-seed (1 SP)**: ✅ **ran 2026-08-04, user-approved** — guarded `SEED_ALLOW_REMOTE=1` against the Neon direct endpoint, read-only preflight first. Verified in DB (both hoodies share `styleGroup: "hudi-mirox"`; kepka «Один розмір»; futbolka «Білий») and live (hudi PDP renders the white-sibling colorway link, kepka PDP shows «Один розмір», homepage 200). Prod PDPs now render the full swatch UI; the legacy fallback path is retired from prod.
- **Client chases (zero-code, carry-forward)**: 9-item payments prerequisites checklist ([decision doc §5.3](../superpowers/specs/2026-07-16-ukraine-payments-delivery-decision.md)); `developers.novaposhta.ua` webhook question from an unblocked network (gates TASK-049); TASK-056 content asks (photography, logo vector, socials/claims, size charts, legal copy) — G1's audit sharpens this list; formal TASK-056 checklist assembly is scheduled Friday as G7.

---

## Task Groups

### G1. Cart and Drawer Restyle [batch]

🔵 User · storefront/cart · **5 SP** · Tue

> Opens with the definitive staleness audit, then converts the cart surfaces — design handoff exists (`Mirox Cart.dc.html`). Visual/copy only: one-click buy, upsell modal and the promo-code field stay in TASK-043 (v1.4).

- [x] Route-by-route staleness audit — screenshot + EN-string sweep of every customer route; produces the definitive scope list for G2/G4 and feeds content gaps to TASK-056 (1) — BACKLOG [2026-08-04] weekly-planning steer → [audit doc](audits/2026-08-04-storefront-staleness-audit.md)
- [x] Cart page → `Mirox Cart.dc.html`: quantity steppers, sticky order summary, dashed-border empty state; Ukrainian copy via the content-config layer — [src/app/(shop)/cart/page.tsx](<../../src/app/(shop)/cart/page.tsx>) ("Shopping Cart" / "Continue Shopping" / "Proceed to Checkout" today) (3) — BACKLOG [2026-08-04] weekly-planning steer [HIGH]
- [x] CartDrawer restyle + Ukrainian strings; update E2E cart specs — [src/components/shop/CartDrawer.tsx](../../src/components/shop/CartDrawer.tsx) (1) — BACKLOG [2026-08-04] weekly-planning steer

> ✅ Shipped 2026-08-04 — PR [#28](https://github.com/GoodAlex223/dropshipping-test/pull/28) merged `0eccaf7`; prod verified. G2 inherits two audit catches: checkout Order-Summary variant line (audit doc §G2 item 4) and the missing Ukraine country option.

### G2. Checkout Restyle [batch]

🔵 User · storefront/checkout · **5 SP** · Wed

> Visual + language only per `Mirox Checkout.dc.html`'s shell — the Stripe rails, step logic and order creation stay untouched (payment/delivery integration is TASK-048/049). Risk: Stripe Elements' dark theme is unverifiable locally (no keys — known BACKLOG note); the visual gate covers the rest.
> **Scope change (client steer, 2026-08-06, ruled in-task)**: launch WITHOUT payment processing — checkout is now a guest-capable no-prepayment COD flow (new `create-order` API, NP methods, content-gated prepay block); Stripe path dormant. 5 SP → ~8 SP. Spec: [2026-08-06-g2-checkout-restyle-cod-design.md](../superpowers/specs/2026-08-06-g2-checkout-restyle-cod-design.md).

- [x] 3-step checkout restyle + Ukrainian copy (information/shipping/payment steps, PaymentForm labels) — [src/app/(shop)/checkout/page.tsx](<../../src/app/(shop)/checkout/page.tsx>) (3) — BACKLOG [2026-08-04] weekly-planning steer [HIGH]
- [x] Shipping methods: replace English "Standard/Express/Overnight" (5.99/12.99/24.99 USD) with Nova-Poshta-style Ukrainian labels; in-task decision on interim numeric amounts (NP published rates 80/120/70 as numerics under the documented Stripe-USD-mismatch convention) — checkout page local list + `SHIPPING_METHODS` in [src/lib/stripe.ts](../../src/lib/stripe.ts) (1) — BACKLOG [2026-07-29] TASK-057 group (checkout pointer)
- [x] Order confirmation page Ukrainian + Mirox alignment — `src/app/(shop)/checkout/confirmation/` (1) — BACKLOG [2026-08-04] weekly-planning steer

> ✅ Shipped 2026-08-07 (Thu, +1 day) — PR [#29](https://github.com/GoodAlex223/dropshipping-test/pull/29) merged `cf308f9`. Delivered the scope-change form: guest COD checkout (no payment processing), NP methods 80/120/70 грн, `create-order` API, UA confirmation page + cart-crumb stepper. Six user-posted review rounds (13 findings fixed incl. isActive gate, phantom decrement, foreign-variantId reject, coded UA errors, cart unavailable-status, quantity cap). Stripe path dormant, zero diff.

### G3. Params Fix [solo]

🟤 Auto · Next.js routing · **2 SP** · Wed

> The only 🟤 group this week (≤1-group cap). Solo-2-SP exception: kept separate from G4 so every group stays single-source; it is one mechanical pattern across 4 files. `/account/orders/[id]` is also squarely inside this week's theme — a 500 page is the ultimate stale surface.

- [x] Fix `use(params)` on Next 14.2.35 (plain object, not a Promise) in all 4 broken client routes — `/admin/orders/[id]`, `/admin/products/[id]`, `/admin/suppliers/[id]`, `/account/orders/[id]` — each currently 500s; add a regression check (2) — BACKLOG [2026-07-18] TASK-034 Task 12 [HIGH]

> ✅ Shipped 2026-08-08 (Fri, +2 days — G2 spillover) — PR [#30](https://github.com/GoodAlex223/dropshipping-test/pull/30) merged `6f81f95`. All four routes now `useParams<{ id: string }>()!` and prop-less; the `!` is forced by the pages-compat types `next-env.d.ts` pulls in (adjudicated mid-task, reviewer finding overruled on reproduced tsc evidence). RTL regression file `dynamic-route-params.test.tsx` (red→green); browser-verified 200s under admin + customer logins. Unit 632 → **636**. Two review rounds: r1 docs-freshness recurrences #8/#9 + chat near-misses fixed; r2 clean on code, 2 BACKLOG-wording refinements.

### G4. Peripheral Surfaces Sweep [batch]

🔵 User · storefront/auth+account+system pages · **5 SP** · Thu

> Tokens are already global, so this is mostly copy conversion + component alignment to the Mirox look; G1's audit fixes the exact file list.

- [ ] Auth: login/register forms → Ukrainian + Mirox alignment — `src/app/(auth)/login/`, `src/app/(auth)/register/` (2) — BACKLOG [2026-08-04] weekly-planning steer
- [ ] Account: layout ("My Account"), overview, orders list/detail ("Order History") → Ukrainian + restyle — `src/app/(shop)/account/**` (2) — BACKLOG [2026-08-04] weekly-planning steer
- [ ] Newsletter confirm/unsubscribe pages + root error/404 pages → Ukrainian — `src/app/newsletter/**`, [src/app/error.tsx](../../src/app/error.tsx) ("Something went wrong"), [src/app/not-found.tsx](../../src/app/not-found.tsx) ("Page not found") (1) — BACKLOG [2026-08-04] weekly-planning steer

### G5. Transactional Emails [solo] 🏆

🔵 User · email templates · **3 SP** · Fri (stretch)

> The Weekly Challenge — see the 🏆 section below.

- [ ] Order-confirmation + newsletter-confirmation emails → Ukrainian, Mirox-consistent styling — [src/lib/email.ts](../../src/lib/email.ts) ("Order Confirmation" / "Thank you for your order" today), `src/lib/email-templates/` (2) — BACKLOG [2026-08-04] weekly-planning steer
- [ ] Route the brand through `BRAND_NAME` instead of `|| "Store"` fallbacks (email.ts, newsletter template, admin settings label) — closes the code side of the `NEXT_PUBLIC_STORE_NAME` entry (1) — BACKLOG [2026-07-18] post-merge deploy verification

### G6. Weekly Reviews [batch]

⚪ Overhead · recurring reviews · **5 SP** · Thu–Fri

> First-ever run of the standing batch — creates `REVIEW-QUEUE.md` (per-category Reviewed log + Next-up + Conventions). Exempt from the quota denominator; scheduled late-week per rule.

- [ ] Create REVIEW-QUEUE.md; Plugins: review two independent tops — best not-yet-reviewed from the official Claude plugin store AND best from the wider internet, each logged with `source:` (2)
- [ ] Claude best-practices: top not-yet-reviewed candidate via web search (1)
- [ ] Non-Claude AI best-practices: same, for non-Claude models/tools (1)
- [ ] Cross-project propagation (outbound): scan this week's DONE entries, merged PRs #24–#27, new memory files, config diffs → `propagate | pass | defer` rows; high bar, `propagate` files a TODO § Spawned Tasks row (1)

### G7. Client Content Ask (TASK-056) [solo]

🔵 User · client content round-trip · **2 SP** · Fri

> Folded in at user request (2026-08-04, launch push): assemble and send the consolidated client ask now so the round-trip runs while engineering continues. Solo-2-SP exception: no domain-mate among this week's code groups (doc + client-communication task).

- [ ] Assemble the consolidated TASK-056 ask from TODO's checklist + G1-audit findings (real photography incl. the 7 missing back-view shots, logo vector, real socials/claims, size charts + measurement photos, contact details, legal copy, free-shipping threshold, announcement copy) and hand it to the user for forwarding to the client (2) — TODO.md TASK-056 [HIGH]

---

## Daily Schedule

### Monday — Spillover close-out (pre-plan, recorded)

- **TASK-037 completion** — PR #27 merged `cec8408` + full completion workflow (DONE/TODO/WEEKLY/BACKLOG/docs-README sync, plan archived, CLAUDE.md propagation). No groups were scheduled; this week's plan was written Tuesday.

### Tuesday — Cart surfaces + this plan

- ✅ **[G1](#g1-cart-and-drawer-restyle-batch)** 🔵 — staleness audit first, then cart page + drawer. Shipped same day, PR [#28](https://github.com/GoodAlex223/dropshipping-test/pull/28).

### Wednesday — Checkout + broken routes

- ✅ **[G2](#g2-checkout-restyle-batch)** 🔵 — the riskiest restyle, front-loaded. Shipped Thu 2026-08-07 (+1 day: client COD scope-change absorbed in-task), PR [#29](https://github.com/GoodAlex223/dropshipping-test/pull/29).
- ✅ **[G3](#g3-params-fix-solo)** 🟤 — 4-route `use(params)` fix. Shipped Fri 2026-08-08 (+2 days: G2's COD scope-change spillover pushed the queue), PR [#30](https://github.com/GoodAlex223/dropshipping-test/pull/30).

### Thursday — Peripheral sweep + reviews start

- **[G4](#g4-peripheral-surfaces-sweep-batch)** 🔵 — auth/account/newsletter/error pages.
- **[G6](#g6-weekly-reviews-batch)** ⚪ — part 1 (queue creation + plugins slot).

### Friday — Reviews close + stretch

- **[G6](#g6-weekly-reviews-batch)** ⚪ — part 2 (best-practices slots + propagation scan).
- **[G7](#g7-client-content-ask-task-056-solo)** 🔵 — consolidated client ask assembled + handed off.
- **[G5](#g5-transactional-emails-solo-)** 🔵 🏆 — stretch: emails, if the core groups are green.
- Week close-out: statuses → `✅ PR #N`, spillover check, next-week (launch-push continuation) seed list.

---

## Summary Table

| ID  | Group                                  | Domain              | Source      | Tasks  | Total SP | Day     | Status        |
| --- | -------------------------------------- | ------------------- | ----------- | ------ | -------- | ------- | ------------- |
| G1  | Cart and Drawer Restyle `[batch]`      | storefront/cart     | 🔵 User     | 3      | 5        | Tue     | ✅ PR #28     |
| G2  | Checkout Restyle `[batch]`             | storefront/checkout | 🔵 User     | 3      | 5        | Wed     | ✅ PR #29     |
| G3  | Params Fix `[solo]`                    | Next.js routing     | 🟤 Auto     | 1      | 2        | Wed     | ✅ PR #30     |
| G4  | Peripheral Surfaces Sweep `[batch]`    | auth/account/system | 🔵 User     | 3      | 5        | Thu     | ☐ Planned     |
| G5  | Transactional Emails `[solo]` 🏆       | email templates     | 🔵 User     | 2      | 3        | Fri     | ☐ Planned     |
| G6  | Weekly Reviews `[batch]`               | recurring reviews   | ⚪ Overhead | 4      | 5        | Thu–Fri | ☐ Planned     |
| G7  | Client Content Ask (TASK-056) `[solo]` | client content      | 🔵 User     | 1      | 2        | Fri     | ☐ Planned     |
| P1  | Prod data re-seed                      | ops/data            | 🟡 Ops      | 1      | 1        | Tue     | ✅ 2026-08-04 |
|     | **Total**                              |                     |             | **18** | **28**   |         |               |

_Source legend: 🔵 User · 🟡 Ops · 🟤 Auto · ⚪ Overhead (exempt from the quota denominator). Status on completion: `✅ PR #N` (the number, never a bare ✅)._

---

## Notes

- _Brainstorm sanity-checks: week dates confirmed vs git/DONE (today Tue 2026-08-04; Mon Aug 3 was consumed by TASK-037's spillover close-out — `cec8408`, `3b208f9`); previous week's delivery ran through Mon 2026-08-03, **3 days past its Friday (Jul 31)** → archived below under its TRUE header with a spillover note, not re-dated; velocity ≈ 2–3 large (8-SP-class) tasks/week but with recurring weekend spillovers → this 4-effective-day week planned at 26 SP incl. 5 ⚪ overhead; Cleanup Week due by cadence but **deferred by user decision**, not skipped — and further deferred same day by the launch-push steer (see the Launch-push note below); source quotas satisfiable and met (below)._
- **Discussion-phase decisions (2026-08-04, ruled same day)**: user chose the rebrand-completion theme over the recommended Cleanup Week. **Ruled + executed**: all 7 BACKLOG **reaps** approved and executed (tombstone rows in Rejected Ideas; user note recorded there — the DB catalog is deliberately placeholder data, built for visual integrity and tests, and will be replaced with real products when the site deploys to its real server/domain); **P1 prod re-seed** approved, ran and verified (see Parallel Work); **TASK-056** folded in as G7 (Fri). Still parked: **MILESTONES/GOALS refresh** and **📌 Process Rules section for BACKLOG.md** (cleanup work, post-launch-push); **hydration console errors** investigation (held).
- **OVERDUE item not schedulable this week**: the docs-freshness linter (🟤, recurrence #7) loses the week's single 🟤 slot to G3 under the ≤1-group hard rule. Mitigation until it lands: every PR this week manually verifies `docs/README.md` index rows ↔ doc headers **in both directions plus neighbouring rows** at completion. With next week now also a launch-push week, its realistic home is next week's single 🟤 slot; the manual check stands until it lands.
- **Launch push (user steer, 2026-08-04)**: the goal is to launch and show the site to users as fast as possible — next week continues visuals/language. Likely spine: **TASK-039 i18n** (it _is_ the remaining language work and the monobank payments prerequisite), plus whatever G1's staleness audit leaves over, plus TASK-055 pages if client copy arrives. The true launch long-poles are **client-gated**, not engineering: photography/logo/socials/size charts (TASK-056), legal-page copy (TASK-055 — gateway-onboarding prerequisite), and the §5.3 payments checklist (TASK-048). Chase these in parallel starting now; engineering speed cannot substitute for them.
- **TASK-039 interaction**: this week deliberately adds more hardcoded-Ukrainian copy via the extraction-ready content-config layer (`src/content/`) — the established TASK-057 pattern. TASK-039's externalization scope grows by exactly these surfaces; that is the designed trade, not drift.
- **TASK-043 interaction**: the cart _restyle_ is pulled forward into G1; TASK-043 (v1.4) retains one-click buy, the post-purchase upsell modal, and the promo-code field.
- **Scope boundary**: admin surfaces are excluded from this sweep (customer-facing first); the admin visual pass + admin settings "$" labels stay BACKLOG'd. Showcase routes untouched.
- **Dependencies/risks**: checkout E2E specs and cart specs will need updating with the restyles (known-fragile area — hydration-gate patterns apply); Stripe Elements dark theme remains runtime-unverifiable locally; the shipping-method numeric decision must respect the documented UAH-display / USD-test-charge convention (decision doc §7.4 context).

### Quota Check

- 🔵 User-Flagged SP: 20 / 23 (87%) — must be ≥50% ✅
- 🟡 Operational SP: 1 / 23 (4%) — must be ≤25% ✅
- 🟤 Auto-Generated SP: 2 / 23 (9%) — must be ≤25% AND ≤1 group ✅ (one group: G3)
- Cleanup Week status: **due** (deferred by user steer; launch push takes precedence — re-evaluate after it)
- Last Cleanup Week: never (Feb 2026 freeze week predates the cadence)
- Compliance: ✅ all quotas met — deviation-free; the cadence deferral is recorded above with justification
- _Denominator note_: Y = 28 total − 5 ⚪ (G6 Weekly Reviews) = 23.

---

## Weekly Challenge 🏆

**G5 — Transactional Emails (🔵)**: completes the user's "finish the rebrand" theme end-to-end — the inbox is the last customer-facing surface still branded "Store" in English — and opportunistically closes the standing `NEXT_PUBLIC_STORE_NAME` backlog item on the code side. Stretch because the four core groups (G1–G4, G6) come first in a 4-effective-day week.

---

## Previous Week Summary

**Week of 2026-07-27 – 2026-08-02** (old header schema, Mon–Sun) · **Spillover: delivery ran through 2026-08-03** — TASK-037's merge + completion landed Monday, 3 days past the week's Friday (Jul 31), past the 2-day grace. Archived under its true header; the header was correct when written — delivery is what slipped.

- **TASK-057 Mirox design adoption** — ✅ PR #24 merged `f9ceb97` 2026-07-31 (+ follow-up PR #25 `acb0c30` same day for the PDP og:image tracing ENOENT). Dark `:root` flip, homepage/header/footer realignment, Mirox clothing seed, `formatPrice()` UAH, Cyrillic OG cards. Visual gate signed off v3; **user-approved prod re-seed ran 2026-07-31** — prod serves the Mirox catalog, verified live.
- **TASK-036 Catalog redesign + filters** — ✅ PR #26 merged `919906b` Sat 2026-08-01 (+1 day). Five URL-driven filters, 4 sorts incl. «Популярні» via `getSalesRanking()`, card carousel/quick-view/quick-buy, mobile sheet-only filters, square pagination. Visual gate: 1 revision round; prod verified live.
- **TASK-037 Product page redesign** — ✅ PR #27 merged `cec8408` Mon 2026-08-03 (+3 days, the spillover). PDP rebuilt to `Mirox Product.dc.html`: gallery, `styleGroup` colorways, ranked size chips, SizePicker, honest-sum BoughtTogether, RecentlyViewed, reviews restyle, cart-line naming fix. Unit tests 517 → 598. 3 PR review rounds (incl. the docs-freshness recurrence #7 → automation entry marked OVERDUE).
- **Velocity**: 3 large (8-SP-class) tasks delivered across 8 calendar days — high, but only via weekend + Monday spillover; this informed the current week's 26-SP cap.
- **Carried forward**: prod data re-seed (user-gated → P1), client content inventory (TASK-056), payments prerequisites checklist (§5.3), NP webhook network check.

_Full detail: [DONE.md](DONE.md) · daily logs in git history of this file (pre-2026-08-04 version)._
