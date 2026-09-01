# Weekly Plan

**Week**: Monday August 24 – Friday August 28, 2026
**Created**: 2026-08-20
**Sources**: [MILESTONES.md](MILESTONES.md) · [ROADMAP.md](ROADMAP.md) · [GOALS.md](GOALS.md) · [BACKLOG.md](BACKLOG.md) · [TODO.md](TODO.md) · prior WEEKLY (2026-08-10 week, archived below) · [REVIEW-QUEUE.md](REVIEW-QUEUE.md) · git log (2 weeks)
**Cleanup Week?**: No — overdue by cadence (🟤 pool ≫ 20 SP pending) under the standing user ruling (2026-08-11): the Cleanup Week runs **after site launch**.
**Context**: **The pre-launch week, carried OVERDUE from its declared slot** — Aug 17–21 was consumed by the previous week's +4-day spillover and was never planned; the mandate moves, it does not reset. Theme (user-confirmed 2026-08-20): the TASK-056 client ask goes out Monday (drafted Fri Aug 21 as a user-approved head start), the client's **first 3 real products** (received 2026-08-20) are intaken in a pair session, and the launch gate hardens while the round-trip runs — security scan, guest order access + ownership check, deploy runbook + smoke, polish.

---

## Parallel Work

- **Client round-trip tracking (G15)** — responses are processed as they arrive, as welcome interrupts. The **domain → Resend DNS → `EMAIL_FROM` flip → redeploy** chain is pre-authorized interrupt work: it closes the standing "real customers receive no order email" gap the moment the client's domain lands.
- **TASK-055 content/legal pages** — still blocked on client/lawyer copy; the G15 ask requests it. The pages get built the week the copy arrives (they gate TASK-048 per decision doc §5.3).

---

## Task Groups

_Group IDs continue from prior weeks (G1–G14 are permanently taken by DONE.md and memory references); this week is G15–G21._

### G15. TASK-056 Client Round-Trip [solo]

🔵 User · client comms/content · **3 SP** · Fri (pre-week head start) + Mon

> The launch critical path: every remaining launch blocker is client-side (domain → order emails, legal copy → TASK-055 → TASK-048 prerequisites, photography, NP API key). Head start user-approved 2026-08-20 — the ask drafts **Fri Aug 21** so the client's multi-week clock starts before the weekend. The 3 real products received 2026-08-20 are **acknowledged** in the ask (with their remaining gaps: size charts, back-view images for the card hover-swap, GTIN/brand data); their intake is G16's job, not this group's.

- [x] _(2026-08-21)_ Draft the consolidated ask document (client-facing, UA) from the TASK-056 checklist: photography (hero/product/measurement), logo vector, real socials + claims re-confirmation, size charts, legal-page copy / lawyer engagement, contact details, bank-card + WhatsApp details, free-shipping threshold, announcement copy, **domain purchase + email chain** (Resend DNS → `EMAIL_FROM`), NP API key + the Ukrposhta carrier question, `FEEDBACK_EMAIL` recipient, RU catalog sign-off package (nuance list in [messages/README.md](../../messages/README.md)) + the RU product-copy opt-in question (2) — TODO.md TASK-056 [HIGH]
- [x] _(2026-08-21 — sent by the user the same day as drafted, ahead of the Monday plan; send date + 📨 statuses recorded on the TODO TASK-056 tracking table)_ Hand off for sending Monday; record the send date + per-item response tracking on TODO TASK-056; process same-week responses as interrupts (1) — TODO.md TASK-056

### G16. Real-Product Intake Pair Session [batch]

🔵 User · catalog/data · **4 SP → revised 9 SP (spec §8, 2026-08-26)** · Mon (can pull forward to Fri if the user is available)

> User-raised 2026-08-20: the client delivered the first 3 real products — a live rehearsal of the real-data path before launch, run as a **pair session** (user + Claude) so problems are seen and fixed together. Environment decision at session start: prod admin (alongside the deliberately-placeholder catalog) vs local-first. **Landmine recorded up front**: once real data enters prod, `db:seed` against prod is destruction — the seed deletes the whole catalog tree by design; the user-gated re-seed runbook is effectively retired for prod from that moment.

> **Effort revision (2026-08-26, spec §8)**: the prep step found the admin path cannot carry a real product (no image/variant UI, no storage backend, no `styleGroup` field, no feed opt-out). Decision 1 (close the admin gap first) makes this a feature group — realistic 8–10 SP, booked as 9. Scheduling overflow surfaced to the user, not absorbed; pressure-valve order (G20 → G18 tracking half → G21) unchanged.

- [ ] Prep: dry-run the admin product-creation path on seed data — ProductForm fields incl. brand/MPN (Google Shopping), image upload path (S3 config in the target env), category assignment, comparePrice refine; variant names MUST be the canonical «Розмір»/«Колір» DATA values ([src/lib/variant-names.ts](../../src/lib/variant-names.ts) — a hand-typed "Size" breaks every storefront variant lookup); known gaps going in: no `styleGroup` field in the form (colorway linking needs DB access), Textarea ref-drop (validation errors can't autofocus) (1) — user-raised 2026-08-20 [HIGH]
- [ ] Pair session: enter the 3 products together; verify each end-to-end — PDP, catalog listing + filters, search, cart → COD checkout, Google Shopping feed row validity (`validateFeedItemSafe` must not silently drop them), sitemap + OG image; fix small problems live, file larger finds (3) — user-raised 2026-08-20 [HIGH]

### G17. Pre-Launch Security Scan [solo]

🟤 Auto · security · **3 SP** · Tue — **the week's single 🟤 group**

> The G10 run-2 `adopt`, pinned by its own park condition to exactly this window ("pre-launch security pass is scheduled, or real customer traffic is imminent"). Runs Tuesday so findings can be triaged and the quick ones fixed inside the week.

- [ ] Install `claude-security@claude-plugins-official` (v0.10.0, Anthropic) and run the scoped deep scan: auth (NextAuth v5 + middleware), API routes + `requireAdmin()`/`requireAuth()` guards, `/api/checkout/create-order` (guest COD, no auth), the HMAC unsubscribe token path, admin routes, secrets pass (2) — BACKLOG [2026-08-15] G10 run 2 adopt [HIGH]
- [ ] Triage findings: fix quick confirmed ones in-branch; file the rest 🟤 with severity. A severe finding (data exposure class) is an abort-condition consult with the user, not a silent fix (1)

### G18. Guest Order Access & Hardening [batch]

🔵 User · checkout/orders · **7 SP** · Tue–Wed · **🏆 Weekly Challenge**

> Guest order tracking (🔵 [2026-08-07], "recommended before real launch") and the G2 confirmation-page ownership check (subsumed 🟤 rider, pinned "**before real customer traffic**") share one design space: verified guest access to order data. Design constraints on record: never lookup by phone alone (order-enumeration risk — order# + email/phone pair); the post-checkout redirect must still show the just-created order (one-time grant / session), while cold visits require verification.

- [ ] Guest order tracking: lookup by order number + email (form + API; rate-limit consideration); claim-by-email-at-registration decision in-plan (5) — BACKLOG [2026-08-07] G2 post-gate 🔵 [HIGH]
- [ ] Confirmation-page ownership check (subsumed 🟤 rider): order PII no longer sits behind the order-number capability URL alone; same verification mechanism as the lookup (2) — BACKLOG [2026-08-06] G2 hardening bundle (the pinned privacy piece; the volume-triggered pieces stay BACKLOG'd)

### G19. Launch Runbook + Deploy Verification [batch]

🔵 User · ops/deploy · **3 SP** · Thu

> The operational half of launch readiness: the user-raised runbook (🔵 [2026-08-10]) plus the smoke-check 🟤 riders it subsumes ([2026-07-21] post-deploy smoke test; [2026-08-14] served-asset staleness check; [2026-08-18] "nothing verifies a Vercel production deploy except a human looking at it").

- [ ] Write the production-launch deploy runbook (pre / while / post) as an executable checklist doc, indexed in docs/README.md at authoring time (2) — BACKLOG [2026-08-10] G5 user-raised 🔵 [HIGH]
- [ ] Post-deploy smoke script: fetch `/`, `/products`, a DB-backed route (assert 200 + a DB-backed string), `/categories/hudi` (assert 307), and assert the served CSS chunk hash changed vs the previous deploy (1) — subsumed 🟤 riders [2026-07-21] + [2026-08-14] + [2026-08-18]

### G20. Pre-Launch Polish [batch]

🔵 User (by steer) · storefront · **4 SP** · Thu

> Sourced 🔵 under the user's 2026-08-11 "ask + polish" pre-launch steer, confirmed 2026-08-20 (G13/G14 subsumption precedent); member origins are 🟤 and cited. The checkout distraction-free header is **deliberately deferred** (user-ratified 2026-08-20): restructuring checkout chrome days before launch risks more than it buys.

- [ ] Mobile «Новинки» horizontal-scroll rail per [`Mirox Mobile.dc.html`](../design/design_handoff_mirox/Mirox%20Mobile.dc.html) (~160px cards below `sm:`), with its own visual-gate round (2) — BACKLOG [2026-08-15] G14 audit
- [ ] G8 feedback/marquee residue batch (one commit, ranked by the PR #35 re-review): malformed-JSON body → 400 `VALIDATION_ERROR` on feedback + newsletter subscribe, `observer.observe(first)` font-swap guard in [AnnouncementBar.tsx](../../src/components/common/AnnouncementBar.tsx), the listed test-debt, static-variant inset note (2) — TODO.md § Medium Priority [2026-08-14]

### G21. Weekly Reviews [batch]

⚪ Overhead · recurring reviews · **5 SP** · Fri

> Run 3. Read [REVIEW-QUEUE.md](REVIEW-QUEUE.md) first — the run recipe (incl. the step-5 re-check pass), the standing launch-push lens (high adopt bar, re-scope after launch), and Convention-4 cheap checks on all parks. Two parks interact with this very week: `resend`'s condition ("sending domain provisioned") may FIRE if G15's domain item lands mid-week, and `security-guidance`'s re-trigger reads G17's scan results (a recurring vulnerability class un-defers it). Sequential in-session (Convention 8).

- [ ] Plugins ×2: best not-yet-reviewed from the official store AND from the wider internet, each row tagged `source:` (2)
- [ ] Claude best-practices: top not-yet-reviewed candidate via date-aware web search (1)
- [ ] Non-Claude AI best-practices — the bias-watch counter stands at **0 of 2** under the rewritten methodology-aimed condition (1)
- [ ] Cross-project propagation: window = shipped since run 2 — PRs #39/#40, G11 merge `745e039`, G12 merge `9fc4fd3`, memory files 2026-08-15 → run day (1)

---

## Daily Schedule

### Friday Aug 21 (pre-week) — Head start (user-approved 2026-08-20)

- **[G15](#g15-task-056-client-round-trip-solo)** 🔵 — part 1: the consolidated ask drafts today so it can reach the client before the weekend. _(Done 2026-08-21 — and part 2 as well: after two review rounds — user edits, the branded-goods advisory, item renumber to 21 — the user sent the ask the same day. The whole group landed Friday.)_

### Monday — Real data + the ask goes out

- **[G16](#g16-real-product-intake-pair-session-batch)** 🔵 — prep first thing, then the pair session (user availability governs the hour).
- **[G15](#g15-task-056-client-round-trip-solo)** 🔵 — ~~part 2: finalize, hand off for sending, set up response tracking~~ _(moot — completed Fri 2026-08-21, ask already sent)_.

### Tuesday — Security + guest-access design

- **[G17](#g17-pre-launch-security-scan-solo)** 🟤 — scan + triage, early so fixes fit in-week.
- **[G18](#g18-guest-order-access--hardening-batch)** 🔵 — part 1: design + API (the week's biggest design decision, front-loaded).

### Wednesday — Guest access lands

- **[G18](#g18-guest-order-access--hardening-batch)** 🔵 — part 2: UI, visual gate, PR.

### Thursday — Launch ops + polish

- **[G19](#g19-launch-runbook--deploy-verification-batch)** 🔵 — runbook + smoke script.
- **[G20](#g20-pre-launch-polish-batch)** 🔵 — polish batch.

### Friday — Reviews + close

- **[G21](#g21-weekly-reviews-batch)** ⚪ — run 3, all four slots.
- Close-out: statuses → `✅ PR #N`, as-delivered quota recompute, next-week seed list; slack for G17-finding fixes and client-response interrupts.

---

## Summary Table

| ID  | Group                                       | Domain          | Source      | Tasks  | Total SP | Day          | Status       |
| --- | ------------------------------------------- | --------------- | ----------- | ------ | -------- | ------------ | ------------ |
| G15 | TASK-056 Client Round-Trip `[solo]`         | client comms    | 🔵 User     | 2      | 3        | Fri(pre)+Mon | ✅ `b836e77` |
| G16 | Real-Product Intake Pair Session `[batch]`  | catalog/data    | 🔵 User     | 2      | 9        | Mon          | ☐ Planned    |
| G17 | Pre-Launch Security Scan `[solo]`           | security        | 🟤 Auto     | 2      | 3        | Tue          | ☐ Planned    |
| G18 | Guest Order Access & Hardening `[batch]` 🏆 | checkout/orders | 🔵 User     | 2      | 7        | Tue–Wed      | ☐ Planned    |
| G19 | Launch Runbook + Deploy Verify `[batch]`    | ops/deploy      | 🔵 User     | 2      | 3        | Thu          | ☐ Planned    |
| G20 | Pre-Launch Polish `[batch]`                 | storefront      | 🔵 User     | 2      | 4        | Thu          | ☐ Planned    |
| G21 | Weekly Reviews `[batch]`                    | recurring       | ⚪ Overhead | 4      | 5        | Fri          | ☐ Planned    |
|     | **Total**                                   |                 |             | **16** | **34**   |              |              |

_Source legend: 🔵 User · 🟡 Ops · 🟤 Auto · ⚪ Overhead (exempt from the quota denominator). Status on completion: `✅ PR #N` (the number, never a bare ✅)._

---

## Notes

- _Brainstorm sanity-checks: week dates confirmed vs git/DONE (today Thu 2026-08-20; Aug 24 verified a Monday); **the previous week did NOT land inside its header** — Aug 10–14 delivery ran to Tue Aug 18 (+4 days, Spillover line recorded, archived below under its TRUE header); **what fell due during the spillover: the declared pre-launch week itself (Aug 17–21)** — consumed, never planned, Aug 19–20 idle in git → its mandate carries OVERDUE into this plan rather than resetting; velocity: two weeks running delivered fully but +4 days each (26/28 SP, then 40/40 planned-overload) → realistic in-window capacity ≈ 20–26 non-⚪ SP, this plan sits at 24; Cleanup Week overdue by cadence, user-pinned to after launch (2026-08-11); source quotas satisfiable (87.5% 🔵)._
- **Discussion Phase (attended, 2026-08-20)**: 4 rulings via structured questions — (1) week window **Aug 24–28 + Fri Aug 21 head start** on the ask draft; (2) theme **A, launch-gate hardening** (over polish-forward and CI-forward/TASK-040); (3) **all 4 reap nominations approved** (the 5th, the Stripe live-mode Research Topics row, was not approved and stays live — re-nominate only on new evidence); (4) **polish included as 🔵 per the 2026-08-11 steer**, checkout distraction-free header deferred. **Same-day addendum (user)**: the client delivered the **first 3 real products** → G16 added (+4 SP, pair session, front-loaded Mon with a Fri pull-forward option).
- **Backlog reaps (user-approved 2026-08-20, executed per the standing move-to-🪦 convention — marked and moved, not deleted)**:
  1. **Products↔categories sort-set unification** · [2026-08-08] G4 brainstorm — its own subsumption condition fired: G12 retired `/categories/[slug]` and `category-client.tsx`, so there is no second sort set to unify.
  2. **next-intl `useExtracted` design input for TASK-039** · [2026-08-10] G6 run 1 — consumed: G9's library decision weighed exactly this input and TASK-039 shipped (PR #37).
  3. **G13 duplicate-value sync test** · [2026-08-15] G9 close-out — mooted by its own condition: G13 reuses `account.orderStatus`/`paymentStatus` keys directly (PR #40).
  4. **[TASK-014] Additional Integrations umbrella** · Post-MVP Features (section removed with it, as with TASK-013/015) — payments → TASK-048 + the payments decision doc; supplier APIs / shipping calculators → spec v2.0 directions; automated inventory sync is an explicit GOALS.md Non-Goal.
- **Capacity & pressure valve**: 29 non-⚪ SP (G16 **4 SP → revised 9 SP**, spec §8, 2026-08-26) against observed 20–26 — now above the band, not within it. Deferral order under pressure: **G20 polish first**, then G18's guest-tracking member slips to launch week (**the ownership check stays** — its "before real customer traffic" pin is the point); G21 may defer under its own hard-deadline rule. G16's fix-work is unknown-size by nature: small problems fixed live, larger finds filed rather than absorbed.
- **Dependencies / risks**: G16 may surface real-data-path defects (that is its purpose) — Friday holds slack; the prod-seed destruction landmine is recorded in the group note. G17's findings are unknown-size; severe ones are an abort-condition consult. G18 must not break the post-checkout confirmation flow (one-time grant design decision in-plan) and touches checkout/account surfaces → visual gate + the standing rule: any string change sweeps every E2E locator type (specs that don't run locally run in CI). G21 runs sequential in-session (devcontainer fan-out OOM). Client responses are welcome interrupts — the domain → Resend DNS → `EMAIL_FROM` chain is pre-authorized (Parallel Work).
- **Quota sourcing transparency**: G18/G19/G20 subsume 🟤-origin riders (2 + 1 + 2 SP) inside 🔵 groups under the G13/G14 subsumption precedent and the explicit user rulings (2026-08-11 steer; 2026-08-20 confirmation). Strict-origin accounting would read 🟤 at 8/24 (33%); the Quota Check below uses group sourcing, and this note is the honest record of the difference.
- **Parked (carried)**: 📌 Process Rules section for BACKLOG.md + MILESTONES/GOALS refresh (Cleanup-Week fodder; both still show pre-Mirox January state); hydration console errors investigation (held since 2026-08-04); the cross-project propagation queue (6 TODO § 🔀 rows + 4 fold-ins, none actioned — candidate for a post-launch batch sitting); checkout distraction-free header (deferred 2026-08-20); TASK-040 CI extensions (next candidate week); admin dashboard stat-tile wiring.

### Quota Check

- 🔵 User-Flagged SP: 21 / 24 (87.5%) — must be ≥50% ✅
- 🟡 Operational SP: 0 / 24 (0%) — must be ≤25% ✅ (no time-sensitive ops items this week; P2 superseded last week)
- 🟤 Auto-Generated SP: 3 / 24 (12.5%) — must be ≤25% AND ≤1 group ✅ (one group: G17)
- Cleanup Week status: **overdue by cadence** — user-pinned to run **after site launch** (ruling 2026-08-11)
- Last Cleanup Week: never (the Feb 2026 freeze week predates the cadence)
- Compliance: ✅ all quotas met — the cadence deviation is an explicit user ruling; see the sourcing-transparency note above for the subsumed 🟤 riders
- _Denominator note_: Y = 29 total − 5 ⚪ (G21 Weekly Reviews) = 24. As-delivered quotas are recomputed at close-out per standing precedent.

---

## Weekly Challenge 🏆

**G18 — Guest Order Access & Hardening (🔵)**: the default-source pick and the week's most strategic feature. Guest COD customers are the launch's primary buyers, and today they have no way back to their order after the confirmation page — while that same page exposes order PII to anyone holding the URL. One verification mechanism ships both the feature and the pinned privacy fix.

---

## Previous Week Summary

**Week of Monday August 10 – Friday August 14, 2026** · **Spillover: delivery ran to Tue 2026-08-18** (+4 days past the Friday, recorded via the plan's own Spillover header line). **All 7 groups shipped** — 40/40 planned SP, the deliberate 2× overload accepted in advance ("yes, this week will be hard"); the pressure valve was never exercised.

- **G8 Launch Feedback Loop** — ✅ PR #35 `a4114e6` + prod-CSS hotfix PR #36 `92236d4` (Thu Aug 14, +2 days): `/feedback` form + launch marquee, production live-verified after a cache-off redeploy.
- **G9 TASK-039 i18n Foundation** — ✅ PR #37 `2c93da7` (Fri Aug 15): next-intl cookie mode, UA default + RU toggle; the 474-key RU catalog is a DRAFT pending client sign-off (→ this week's G15 ask).
- **G14 Rebrand Residuals** — ✅ PR #38 `caf8103` (Fri Aug 15): «Розмір»/«Колір» via data migration (P2 re-seed superseded); design-gap audit verdict: the storefront matches its handoff; 2 finds filed (→ G20 + the deferred checkout header).
- **G10 Weekly Reviews run 2** — ✅ PR #39 `85caf2b` (Sat Aug 15): 14 rows — 1 adopt (`claude-security` → this week's G17) · 7 defer · 2 pass · 3 propagate.
- **G13 Admin Translation & Alignment** — ✅ PR #40 `56328f0` (Aug 17, the accepted weekend spill): `admin.*` 520 keys, UA-only by decision, provider split, monochrome badges, infinite-refetch loop killed.
- **G11 Docs-Freshness Linter** — ✅ `745e039` (Aug 17, no PR — branch never pushed): five guarded checks; the OVERDUE 🟤 retired; 14 drift instances fixed.
- **G12 Categories→Catalog Redesign 🏆** — ✅ merged `9fc4fd3` (Tue Aug 18, no PR — reviewed as a local branch): routing-layer 307, DB-driven category facet, parent rollup fix («Всі» 0 → 7); −576 net lines. CI (E2E 60/60) + prod deploy verified post-merge.
- **As delivered**: 40/40 SP (31 🔵 / 35 non-⚪ = 89%); unit suite 701 → **868 | 1 todo** across the week.
- **The declared pre-launch week (Mon Aug 17 – Fri Aug 21) was consumed by this spillover and never planned** — G13/G11 merged Mon Aug 17, G12 Tue Aug 18, Aug 19–20 idle. Its mandate (TASK-056 un-defer, client ask + polish, user-ready) carries **OVERDUE** into the current plan above.
- **Carried forward**: TASK-056 + client chases (→ G15/G16); the pre-launch hardening set (→ G17–G19); NP webhook question; §5.3 payments checklist; G14 audit finds (→ G20 + deferred header).

_Full detail: [DONE.md](DONE.md) · the prior plan in git history of this file (pre-2026-08-20 version)._
