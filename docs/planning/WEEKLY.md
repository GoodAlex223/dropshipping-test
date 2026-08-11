# Weekly Plan

**Week**: Monday August 10 – Friday August 14, 2026
**Created**: 2026-08-11
**Sources**: [MILESTONES.md](MILESTONES.md) · [ROADMAP.md](ROADMAP.md) · [GOALS.md](GOALS.md) · [BACKLOG.md](BACKLOG.md) · [TODO.md](TODO.md) · prior WEEKLY (2026-08-03 week, archived below) · [REVIEW-QUEUE.md](REVIEW-QUEUE.md) · git log (2 weeks)
**Cleanup Week?**: No — **overdue by cadence** (4 feature weeks since resumption, 🟤 pool ≫ 20 SP pending) under a standing user deferral (2026-08-04, recorded twice: launch push takes precedence). Not silently skipped: the OVERDUE docs-freshness linter takes this week's single 🟤 slot (G11), and the post-launch-push week is proposed as the Cleanup Week — open question 1 in Notes.
**Context**: Mirox program v1.3, launch-push continuation per the standing user steer (2026-08-04) and the close-out seed list (2026-08-11): **the TASK-039 i18n spine plus the user's launch feedback loop** (feedback form + homepage announcement marquee, manual-testing intake 2026-08-11), with the categories→catalog redesign as the 🏆 stretch. Planned Tuesday — Monday and Tuesday morning went to the previous week's spillover close-out (PRs #32/#33/#34).

---

## Parallel Work

- **Client chases: ⏸️ paused by the G7/TASK-056 deferral (user, 2026-08-11)** — the whole client round-trip (photography, logo vector, socials/claims, size charts, legal copy, domain purchase, WhatsApp/bank details, NP API key) holds until the pre-launch week. The live consequence stands: prod `EMAIL_FROM=onboarding@resend.dev` delivers order emails only to the Resend owner's inbox, so real customers get no order email until the domain items close. Nothing is chased this week; the paused checklist lives in [TODO.md](TODO.md) TASK-056 + decision doc §5.3.

---

## Task Groups

_Group IDs continue from last week (G1–G7 are permanently taken by DONE.md and memory references); this week is G8–G12._

### G8. Launch Feedback Loop [batch]

🔵 User · storefront/comms · **5 SP** · Tue–Wed

> Both halves of the user's 2026-08-11 manual-testing ask, coupled by design (the marquee links to the form). Unblocked despite the TASK-056 deferral: the interim `onboarding@resend.dev` sender delivers to the Resend account owner's inbox, and for this form the owner **is** the recipient (the opposite of the order-email case). Ships through the extraction-ready `src/content/` layer; G9 externalizes it along with everything else (the designed trade, not drift).

- [ ] **[TASK-058]** Site-wide feedback form — page/host decision in-plan (own `/feedback` route vs dialog; `/contact` belongs to TASK-055 and stays client-blocked) + new `src/app/api/feedback/route.ts` + Resend send via [src/lib/email.ts](../../src/lib/email.ts) + Zod schema + `src/content/` module + unit tests; interim recipient = owner address until TASK-056 supplies the real one (3) — TODO.md § Medium Priority [2026-08-11] manual testing [HIGH]
- [ ] **[TASK-059]** Homepage launch-announcement marquee linking to the form — scrolling variant of the existing [AnnouncementBar](../../src/components/common/AnnouncementBar.tsx) (component renders today, gated off by `site.announcement = null`); needs a richer `site.announcement` shape than `string | null`, a `prefers-reduced-motion` guard that rejoins the repo's reduced-motion reset, and launch copy (2) — TODO.md § Medium Priority [2026-08-11] manual testing

### G9. TASK-039 i18n Foundation [solo]

🔵 User · i18n/content · **8 SP** · Wed–Thu (contiguous)

> The launch-push spine named in the standing steer — the last big v1.3 engineering item. Library choice decided in-plan: next-intl is the default candidate, weighing its `useExtracted` agent workflow against the repo's deliberately extraction-ready `src/content/*.ts` layer (G6-surfaced design input, BACKLOG [2026-08-10]; same source advises against agent-translated catalogs). Urgency note: the monobank UA-site prerequisite still holds, but TASK-048 payments is client-gated and deferred — this is spine-by-steer, not payments-blocked.

- [ ] Locale infrastructure: UA default + RU toggle, library decision + wiring (3) — TODO.md TASK-039 [HIGH]
- [ ] Externalize the hardcoded-Ukrainian customer strings — `src/content/*.ts` config layer + inline homepage/header/footer strings — into locale files (4) — TODO.md TASK-039 [HIGH]
- [ ] Verify `formatPrice()` §7.4 compliance (decision-doc AC); rule in-plan whether the EN SEO/metadata layer (BACKLOG [2026-08-09] G4 final review) joins this scope or stays parked (1) — TODO.md TASK-039

### G10. Weekly Reviews [batch]

⚪ Overhead · recurring reviews · **5 SP** · Thu–Fri

> Run 2. Read [REVIEW-QUEUE.md](REVIEW-QUEUE.md) first — the run recipe (incl. the step-5 re-check pass), the standing launch-push lens (high adopt bar), Convention-4 cheap re-trigger checks on the six parks, and Convention 7's deferral of the three-scope lens here (re-trigger check only). Sequential in-session per Convention 8.

- [ ] Plugins: two independent tops — best not-yet-reviewed from the official Claude plugin store AND best from the wider internet, each row tagged `source:` (2)
- [ ] Claude best-practices: top not-yet-reviewed candidate via date-aware web search (1)
- [ ] Non-Claude AI best-practices: same, for non-Claude tools — carries the bias-watch counter (run 2 of the 2-more-runs condition) (1)
- [ ] Cross-project propagation (outbound): scan window = shipped since run 1 — PR #33 close-out, the PR #34 hotfix arc, the G7 deferral, new memory files — `propagate | pass | defer` rows; a `propagate` files a TODO § 🔀 Spawned row (1)

### G11. Docs-Freshness Linter [solo]

🟤 Auto · docs tooling · **3 SP** · Fri

> The week's single 🟤 group — OVERDUE at 9 manual catches across PRs #16→#33. The design is pre-specified by the entry's own updates: the false-positive guards ARE the load-bearing part, and PR #27's ~20-row naive-audit set is the ready-made test fixture. Shape: a plain unit test à la `no-bright-colors.test.ts`, no new tooling.

- [ ] Build the doc-header ↔ `docs/README.md` index-row consistency check, bidirectional + README's own header: guards for spec files' `**Date**:` (no stamp = skip, never fail) and archive tables' Status column (parse by header name); scoping decision (a) specs get their own `Last Updated` line vs (b) exempt `superpowers/specs/**` resolved in-plan; optional adds if cheap — prettier fixed-point assertion, the [2026-02-10] git-timestamp staleness variant (3) — BACKLOG [2026-07-18] TASK-034 PR #19 reviews + [2026-08-01] PR #26 update [HIGH]

### G12. Categories-to-Catalog Redesign [batch] 🏆

🔵 User · storefront/catalog · **5 SP** · Fri (stretch)

> The Weekly Challenge — see the 🏆 section below. User-proposed at the G4 visual gate (2026-08-09). Subsumes the launch-visible parent-category «Всі»=0 rollup bug; if the stretch doesn't run, the rollup member's standalone-fix escape hatch moves to next week.

- [ ] `/categories/[slug]` → thin 307 redirect to `/products?category=<slug>`; retire `category-client.tsx` (~436 lines); `/categories` index page keeps working (2) — BACKLOG [2026-08-09] G4 visual gate [HIGH]
- [ ] DB-driven category facet in the catalog `FilterBar` (parent groups with children, auto-grows with new categories) + desktop «Категорії» nav entry decision (the gate found no entry point) (2) — BACKLOG [2026-08-09] G4 visual gate
- [ ] Parent-category rollup fix in `/api/products` (parent slug matches descendants' products — closes «Всі» shows 0) (1) — BACKLOG [2026-08-09] G4 visual gate [HIGH]

---

## Daily Schedule

### Monday — Previous week's spillover (pre-plan, recorded)

- Previous week's G6 (Weekly Reviews run 1, PR #32) and G5 🏆 (transactional emails, PR #33) shipped — see the archive below. No groups were scheduled; this plan was written Tuesday.

### Tuesday — Close-outs + this plan + feedback form

- Morning (recorded): PR #34 order-email-await hotfix merged `c137eb9` + G5 arc close-out `da03abc`; G7/TASK-056 deferral ruled and recorded `e11a7de`; manual-testing intake filed `508b2de`; this plan.
- **[G8](#g8-launch-feedback-loop-batch)** 🔵 — part 1: TASK-058 feedback form.

### Wednesday — Feedback loop lands + i18n opens

- **[G8](#g8-launch-feedback-loop-batch)** 🔵 — part 2: TASK-059 marquee, visual gate, PR.
- **[G9](#g9-task-039-i18n-foundation-solo)** 🔵 — part 1: library decision + locale infra (the week's riskiest design call, front-loaded to the first full day).

### Thursday — i18n externalization + reviews start

- **[G9](#g9-task-039-i18n-foundation-solo)** 🔵 — part 2: content-layer externalization + §7.4 verification.
- **[G10](#g10-weekly-reviews-batch)** ⚪ — part 1: plugins + Claude best-practices slots.

### Friday — Linter + reviews close + stretch

- **[G11](#g11-docs-freshness-linter-solo)** 🟤 — the OVERDUE linter.
- **[G10](#g10-weekly-reviews-batch)** ⚪ — part 2: non-Claude slot + propagation scan.
- 🏆 **[G12](#g12-categories-to-catalog-redesign-batch-)** 🔵 — stretch, only if G8/G9 are green.
- Week close-out: statuses → `✅ PR #N`, spillover check, next-week seed list (pre-launch-week candidates).

---

## Summary Table

| ID  | Group                                       | Domain             | Source      | Tasks  | Total SP | Day           | Status    |
| --- | ------------------------------------------- | ------------------ | ----------- | ------ | -------- | ------------- | --------- |
| G8  | Launch Feedback Loop `[batch]`              | storefront/comms   | 🔵 User     | 2      | 5        | Tue–Wed       | ☐ Planned |
| G9  | TASK-039 i18n Foundation `[solo]`           | i18n/content       | 🔵 User     | 3      | 8        | Wed–Thu       | ☐ Planned |
| G10 | Weekly Reviews `[batch]`                    | recurring reviews  | ⚪ Overhead | 4      | 5        | Thu–Fri       | ☐ Planned |
| G11 | Docs-Freshness Linter `[solo]`              | docs tooling       | 🟤 Auto     | 1      | 3        | Fri           | ☐ Planned |
| G12 | Categories-to-Catalog Redesign `[batch]` 🏆 | storefront/catalog | 🔵 User     | 3      | 5        | Fri (stretch) | ☐ Planned |
|     | **Total**                                   |                    |             | **13** | **26**   |               |           |

_Source legend: 🔵 User · 🟡 Ops · 🟤 Auto · ⚪ Overhead (exempt from the quota denominator). Status on completion: `✅ PR #N` (the number, never a bare ✅)._

---

## Notes

- _Brainstorm sanity-checks: week dates confirmed vs git/DONE (today Tue 2026-08-11; Mon Aug 10 + Tue morning consumed by the previous week's spillover — PRs #32 `8298dab` / #33 `1a4f030` Mon, #34 `c137eb9` + close-outs Tue); **the previous week did NOT land inside its header** — Aug 3–7 delivery ran through 2026-08-11, +4 days past its Friday, archived below under its TRUE header with a spillover note; velocity 26 of 28 planned SP delivered, but only via the 4-day spill → this 3.5-effective-day week planned at 21 SP core + 5 SP explicit stretch; Cleanup Week OVERDUE by cadence but under a standing user deferral (2026-08-04, twice-recorded), not silently skipped; source quotas satisfiable (86% 🔵 of scheduled non-⚪)._
- **Discussion Phase (self-conducted — unattended run, 2026-08-11)**: themes considered — **(A, chosen) i18n spine + launch feedback loop**, per the standing 2026-08-04 steer and the 2026-08-11 close-out seed list; (B) catalog-coherence-first (categories redesign core, i18n deferred) — rejected: the steer names i18n the spine, and the redesign fits as stretch; (C) pre-launch hardening bundle (deploy runbook, guest order tracking, confirmation ownership check) — rejected for now: their trigger is "before real customer traffic", which the TASK-056 deferral pushes to the pre-launch week; they seed that week instead. Reap deletions skipped per the unattended rule — candidates listed below for user ruling.
- **Backlog reap candidates (nominated only, NOT executed — user rules on each)**:
  1. **[TASK-013] Enhanced Features umbrella** · Post-MVP Features — every open sub-item has a program-spec successor (wishlist → TASK-041, advanced search → TASK-042, discount codes → TASK-046; product recommendations shipped as BoughtTogether in TASK-037).
  2. **[TASK-015] Growth Features umbrella** · Post-MVP Features — same: i18n → TASK-039 (scheduled this week), analytics dashboard duplicates the [2026-02-01] entry, multi-currency/loyalty are spec v2.0 directions.
  3. **"Extract hardcoded USD → `NEXT_PUBLIC_CURRENCY` env var"** · [2026-02-01] TASK-018 — superseded by the shipped `formatPrice()`/§7.4 UAH architecture; transaction currency is a TASK-048 decision, and an env-var currency switch contradicts the settled design.
  4. **"Seed demo products with brand/barcode/MPN data to test feed"** · [2026-02-02] TASK-020 — its premise (the electronics demo catalog) was replaced wholesale by the deliberately-placeholder Mirox seed; realistic feed content explicitly waits for real products (TASK-054/056; user ruling 2026-08-04).
  5. **"Manual Testing Plan"** · Deferred Tasks, 2026-01-22 (flag: possibly user-raised) — implicitly delivered: `docs/TESTING_CHECKLIST.md` is literally a "Manual Testing Checklist" of "critical user flows … before each release" (323 lines), plus the standing visual-fidelity gate and the user's live manual-testing rounds now feeding TODO/BACKLOG directly (the 2026-08-11 batch).
- **Open questions for the user**: (1) confirm the post-launch-push week as the Cleanup Week (cadence overdue, 🟤 pool ≫ 20 SP); (2) rule on the 5 reap nominations above; (3) G12 is scheduled as stretch — say the word to promote it to core at the cost of likely spillover; (4) G9's library decision is ruled in-plan by default — flag now if you want a user gate before implementation instead.
- **TASK-056 deferral consequences (standing)**: real customers receive no order email (interim sender → owner inbox only); client chases paused. The **pre-launch week** inherits: the TASK-056 round-trip, the 🔵 production-launch deploy runbook, 🔵 guest order tracking, the G2 confirmation-page ownership check ("before real customer traffic"), and the client-gated 🔵 delivery pickers / carrier decision (the Ukrposhta question — uncosted, needs the client's NP key).
- **TASK-039 interactions**: G8 deliberately ships through `src/content/` first; G9 then externalizes those strings with the rest — the designed trade recorded last week. The EN SEO/metadata layer joins G9 only by in-plan ruling, else its BACKLOG entry stands. Any string changes must sweep every locator type across ALL E2E spec files (the PR #31 lesson), and specs that don't run locally run in CI.
- **Dependencies/risks**: G9 is the design-heavy risk (library choice; `useExtracted` vs content-config); 8 SP in 2 days matches the 8-SP-class precedent but leaves no slack — G12 absorbs the variance as stretch. G8's marquee must rejoin the reduced-motion reset and needs a richer `site.announcement` type. G11's false-positive guards are load-bearing (a naive audit fires ~20 false rows). G10 runs sequential in-session (Convention 8 — fan-out gets OOM-killed in this devcontainer).
- **Parked (carried)**: MILESTONES/GOALS refresh + 📌 Process Rules section for BACKLOG.md (Cleanup-Week fodder; MILESTONES/GOALS still show pre-Mirox January state); hydration console errors investigation (held since 2026-08-04).

### Quota Check

- 🔵 User-Flagged SP: 18 / 21 (86%) — must be ≥50% ✅
- 🟡 Operational SP: 0 / 21 (0%) — must be ≤25% ✅
- 🟤 Auto-Generated SP: 3 / 21 (14%) — must be ≤25% AND ≤1 group ✅ (one group: G11)
- Cleanup Week status: **overdue** (cadence + 🟤 pool ≫ 20 SP; standing user deferral for the launch push — post-launch-push week proposed, open question 1)
- Last Cleanup Week: never (the Feb 2026 freeze week predates the cadence)
- Compliance: ✅ all quotas met — the cadence deviation is user-ruled and re-proposed above, not silent
- _Denominator note_: Y = 26 total − 5 ⚪ (G10 Weekly Reviews) = 21. G12's stretch SP count in the denominator (planned work); if the stretch doesn't run, as-delivered quotas are recomputed at close-out per last week's precedent.

---

## Weekly Challenge 🏆

**G12 — Categories-to-Catalog Redesign (🔵)**: the default-source pick — user-proposed at the G4 gate, strategic catalog UX, and it retires a launch-visible bug (parent categories listing zero products). Stretch rather than core because G8 + G9 already fill the 3.5 effective days at the observed velocity; the rollup-fix member ships standalone next week if the stretch doesn't run.

---

## Previous Week Summary

**Week of Monday August 3 – Friday August 7, 2026** · **Spillover: delivery ran through 2026-08-11** — G3/G4/G6/G5 and the G5 hotfix landed Aug 8–11, up to +4 days past the week's Friday (Aug 7), beyond the 2-day grace. Archived under its TRUE header; the header was correct when written — delivery is what slipped.

- **G1 Cart & Drawer Restyle** — ✅ PR #28 `0eccaf7` (Tue Aug 4, on schedule) + the definitive storefront staleness audit.
- **G2 Checkout Restyle → guest COD checkout** — ✅ PR #29 `cf308f9` (Thu Aug 7, +1 day): client steer mid-week — launch WITHOUT payments; NP methods 80/120/70 грн, coded UA errors, Stripe dormant zero-diff. 6 review rounds / 13 findings.
- **G3 Params Fix** — ✅ PR #30 `6f81f95` (Fri Aug 8, +2 days): 4 broken `[id]` client routes → `useParams<{ id: string }>()!` + RTL regression file.
- **G4 Peripheral Surfaces Sweep** — ✅ PR #31 `eb630f4` (Sat Aug 9, +2 days): all EN rendered customer strings gone (SEO/metadata layer explicitly excepted); the gate spawned the categories→catalog redesign (→ this week's G12).
- **G6 Weekly Reviews run 1** — ✅ PR #32 `8298dab` (Mon Aug 10, +3 days): created REVIEW-QUEUE.md; verdicts 1 adopt / 1 defer / 2 pass inbound, 3 propagate / 1 defer / 1 pass outbound.
- **G5 Transactional Emails 🏆** — ✅ PR #33 `1a4f030` (Mon Aug 10, +3 days): both emails UA dark-Mirox on a shared shell; `BRAND_NAME` routed; prod email config resolved (key set, interim sender). **Post-merge live smoke (Aug 11) found the un-awaited send** → hotfix **PR #34 `c137eb9`** (Tue Aug 11): awaited + 10s-bounded sends, race regression test; the user manually verified the order email delivering live.
- **G7 Client Content Ask (TASK-056)** — ⏸️ deferred (user, 2026-08-11) to the pre-launch week; counter-consideration recorded (domain/legal/photography lead times gate readiness itself). The week's only unshipped group.
- **P1 prod re-seed** — ✅ 2026-08-04, user-approved, verified live.
- **As delivered**: 26 of 28 planned SP; quotas held (18 🔵 / 21 non-⚪ = 86%). Unit tests 598 → **701 | 1 todo** across the week.
- **Carried forward**: TASK-056 + paused client chases (pre-launch week); NP webhook question; §5.3 payments checklist; the pre-launch hardening set (deploy runbook, guest order tracking, confirmation ownership check, delivery pickers).

_Full detail: [DONE.md](DONE.md) · daily logs in git history of this file (pre-2026-08-11 version)._
