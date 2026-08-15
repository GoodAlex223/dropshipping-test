# Weekly Plan

**Week**: Monday August 10 – Friday August 14, 2026
**Created**: 2026-08-11
**Sources**: [MILESTONES.md](MILESTONES.md) · [ROADMAP.md](ROADMAP.md) · [GOALS.md](GOALS.md) · [BACKLOG.md](BACKLOG.md) · [TODO.md](TODO.md) · prior WEEKLY (2026-08-03 week, archived below) · [REVIEW-QUEUE.md](REVIEW-QUEUE.md) · git log (2 weeks)
**Cleanup Week?**: No — **overdue by cadence** (4 feature weeks since resumption, 🟤 pool ≫ 20 SP pending) under a standing user deferral (2026-08-04, recorded twice: launch push takes precedence). Not silently skipped: the OVERDUE docs-freshness linter takes this week's single 🟤 slot (G11), and the Cleanup Week is now **user-confirmed for after site launch** (ruling 2026-08-11, closing open question 1).
**Context**: Mirox program v1.3, launch-push continuation per the standing user steer (2026-08-04) and the close-out seed list (2026-08-11): **the TASK-039 i18n spine plus the user's launch feedback loop** (feedback form + homepage announcement marquee, manual-testing intake 2026-08-11), with the categories→catalog redesign as the 🏆 stretch. Planned Tuesday — Monday and Tuesday morning went to the previous week's spillover close-out (PRs #32/#33/#34). **Scope expanded same day by user steer**: finish ALL remaining translations (admin panel; the «Size: M» variant labels) and close any unbuilt design-handoff gaps — G13/G14 added despite SP, overload accepted ("yes, this week will be hard"); **next week (Aug 17–21) is the pre-launch week**: client data ask + polish, user-ready by its end.

---

## Parallel Work

- **Client chases: ⏸️ paused by the G7/TASK-056 deferral (user, 2026-08-11)** — the whole client round-trip (photography, logo vector, socials/claims, size charts, legal copy, domain purchase, WhatsApp/bank details, NP API key) holds until the pre-launch week. The live consequence stands: prod `EMAIL_FROM=onboarding@resend.dev` delivers order emails only to the Resend owner's inbox, so real customers get no order email until the domain items close. Nothing is chased this week; the paused checklist lives in [TODO.md](TODO.md) TASK-056 + decision doc §5.3. **The pre-launch week is now identified: next week, Aug 17–21** (user, 2026-08-11) — the consolidated ask runs then.
- 🟡 **P2 — Prod data re-seed after the variant-name rename (1 SP, user-gated)**: ~~G14's «Size»→«Розмір»/«Колір» seed rename only reaches prod via a re-seed (`SEED_ALLOW_REMOTE=1` against the Neon direct endpoint, read-only preflight first — last week's P1 runbook). Gated on explicit user approval at G14 completion.~~ **Superseded 2026-08-15 (G14 design, user-approved)**: the rename reached prod via data migration `20260815095848_rename_variant_names_ua` at the PR #38 deploy — P2's stated motivation is gone and no re-seed ran. The re-seed runbook itself stays available for any future deliberate prod data refresh (still user-gated).

---

## Task Groups

_Group IDs continue from last week (G1–G7 are permanently taken by DONE.md and memory references); this week is G8–G14._

### G8. Launch Feedback Loop [batch]

🔵 User · storefront/comms · **5 SP** · Tue–Wed

> Both halves of the user's 2026-08-11 manual-testing ask, coupled by design (the marquee links to the form). Unblocked despite the TASK-056 deferral: the interim `onboarding@resend.dev` sender delivers to the Resend account owner's inbox, and for this form the owner **is** the recipient (the opposite of the order-email case). Ships through the extraction-ready `src/content/` layer; G9 externalizes it along with everything else (the designed trade, not drift).
>
> **✅ Shipped 2026-08-14** — PR [#35](https://github.com/GoodAlex223/dropshipping-test/pull/35) `a4114e6` (+2 days: 6 visual-gate rounds / 9 user rulings) + prod-CSS hotfix PR [#36](https://github.com/GoodAlex223/dropshipping-test/pull/36) `92236d4`; production live-verified after a cache-off redeploy. Details: [DONE.md](DONE.md).

- [x] **[TASK-058]** Site-wide feedback form — page/host decision in-plan (own `/feedback` route vs dialog; `/contact` belongs to TASK-055 and stays client-blocked) + new `src/app/api/feedback/route.ts` + Resend send via [src/lib/email.ts](../../src/lib/email.ts) + Zod schema + `src/content/` module + unit tests; interim recipient = owner address until TASK-056 supplies the real one (3) — TODO.md § Medium Priority [2026-08-11] manual testing [HIGH]
- [x] **[TASK-059]** Homepage launch-announcement marquee linking to the form — scrolling variant of the existing [AnnouncementBar](../../src/components/common/AnnouncementBar.tsx) (component renders today, gated off by `site.announcement = null`); needs a richer `site.announcement` shape than `string | null`, a `prefers-reduced-motion` guard that rejoins the repo's reduced-motion reset, and launch copy (2) — TODO.md § Medium Priority [2026-08-11] manual testing

### G9. TASK-039 i18n Foundation [solo]

🔵 User · i18n/content · **8 SP** · Wed–Thu (contiguous)

> The launch-push spine named in the standing steer — the last big v1.3 engineering item. Library choice decided in-plan: next-intl is the default candidate, weighing its `useExtracted` agent workflow against the repo's deliberately extraction-ready `src/content/*.ts` layer (G6-surfaced design input, BACKLOG [2026-08-10]; same source advises against agent-translated catalogs). Urgency note: the monobank UA-site prerequisite still holds, but TASK-048 payments is client-gated and deferred — this is spine-by-steer, not payments-blocked.
>
> **✅ Shipped 2026-08-15** — PR [#37](https://github.com/GoodAlex223/dropshipping-test/pull/37) merged `2c93da7` (+1 day: ran Thu–Fri after G8's slip; 2 visual-gate rounds, 4 PR-review rounds, every finding fixed). next-intl cookie mode, UA default + RU toggle; 474-key RU catalog is a DRAFT pending client sign-off (TASK-056 rider). The agent-translated-catalog risk the G6 note warned about was mitigated by the byte-diff verifier + the user gate's nuance-flag review. Details: [DONE.md](DONE.md).

- [x] Locale infrastructure: UA default + RU toggle, library decision + wiring (3) — TODO.md TASK-039 [HIGH]
- [x] Externalize the hardcoded-Ukrainian customer strings — `src/content/*.ts` config layer + inline homepage/header/footer strings — into locale files (4) — TODO.md TASK-039 [HIGH]
- [x] Verify `formatPrice()` §7.4 compliance (decision-doc AC); rule in-plan whether the EN SEO/metadata layer (BACKLOG [2026-08-09] G4 final review) joins this scope or stays parked (1) — TODO.md TASK-039 _(ruled: joined — the user-visible fixed set shipped UA in T8)_

### G10. Weekly Reviews [batch]

⚪ Overhead · recurring reviews · **5 SP** · Thu–Fri

> Run 2. Read [REVIEW-QUEUE.md](REVIEW-QUEUE.md) first — the run recipe (incl. the step-5 re-check pass), the standing launch-push lens (high adopt bar), Convention-4 cheap re-trigger checks on the six parks, and Convention 7's deferral of the three-scope lens here (re-trigger check only). Sequential in-session per Convention 8. **Pressure valve**: under this week's deliberate overload, G10 defers first (the batch's own under-deadline rule) — noted here so a deferral is a recorded move, not a silent drop.

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

> The Weekly Challenge — see the 🏆 section below. User-proposed at the G4 visual gate (2026-08-09); stretch placement user-confirmed 2026-08-11 ("G12 now is ok"). Subsumes the launch-visible parent-category «Всі»=0 rollup bug; if the stretch doesn't run, the rollup member's standalone-fix escape hatch moves to next week.

- [ ] `/categories/[slug]` → thin 307 redirect to `/products?category=<slug>`; retire `category-client.tsx` (~436 lines); `/categories` index page keeps working (2) — BACKLOG [2026-08-09] G4 visual gate [HIGH]
- [ ] DB-driven category facet in the catalog `FilterBar` (parent groups with children, auto-grows with new categories) + desktop «Категорії» nav entry decision (the gate found no entry point) (2) — BACKLOG [2026-08-09] G4 visual gate
- [ ] Parent-category rollup fix in `/api/products` (parent slug matches descendants' products — closes «Всі» shows 0) (1) — BACKLOG [2026-08-09] G4 visual gate [HIGH]

### G13. Admin Translation & Alignment [solo]

🔵 User · admin panel · **8 SP** · Fri (weekend spill expected, accepted)

> User steer 2026-08-11: "we have not finished with translations of pages (Admin pages)". Admin was deliberately excluded from G4's customer-first sweep and is still fully English (AdminSidebar: "Dashboard/Products/Orders…"). **Runs AFTER G9** so admin strings land once, directly in whatever mechanism G9 picks (locale files vs content module). Subsumes three 🟤 alignment residuals (bright `PAYMENT_STATUS_COLORS` chips, the parallel supplier-status module, settings "$" labels).

- [ ] Admin chrome + all list pages → Ukrainian: AdminSidebar, dashboard, products/categories/orders/customers/suppliers/reviews/newsletter/settings — labels, table headers, empty states, search placeholders, toasts (4) — user steer 2026-08-11 [HIGH]
- [ ] Admin forms + dialogs → Ukrainian: ProductForm, category/supplier forms, delete confirms, validation messages (2) — user steer 2026-08-11
- [ ] Mirox alignment residuals: monochrome `PAYMENT_STATUS_COLORS` chips (both admin orders pages), parallel `supplier-order-status` module (lowercase vocab, deliberately not reusing `order-status.ts`), settings "$"→грн labels (2) — BACKLOG [2026-07-18] TASK-034 Task 12 + [2026-07-29] TASK-057 groups

### G14. Rebrand Residuals: Variant Names + Design-Gap Audit [batch]

🔵 User · storefront/data completeness · **5 SP** · Thu

> User steer 2026-08-11: the «Size: M» fix (un-holds the [2026-08-07] G2-gate hold-off ruling) + "maybe we have not finished redesigning of some pages (due to design files)" — settled by an audit against the 7 design-handoff files rather than guesswork. ~~The rename's prod effect requires P2 (user-gated re-seed).~~ **Superseded 2026-08-15 (G14 design, user-approved)**: prod renames via a data migration (`20260815095848_rename_variant_names_ua`) applied by `vercel-build`'s `migrate deploy` at the next deploy — no P2 dependency; P2 stays gated for its other purposes.

- [x] ✅ Variant-name UA rename: seed «Розмір»/«Колір» + the 12+ `v.name === "Size"/"Color"` call sites (ProductCard, QuickViewDialog, PDP page/client, styleGroup colorway lookups — via a shared variant-name constant so a 13th site can't drift) + tests; retires «Size: M» from cart lines, receipts and emails (3) — user steer 2026-08-11, un-holding BACKLOG [2026-08-07] G2 post-gate [HIGH]
- [x] ✅ Design-handoff gap audit: compare all 7 `docs/design/design_handoff_mirox/*.dc.html` against shipped pages — esp. `Mirox Mobile.dc.html`, never tracked as built (Cart/Catalog/Checkout/Home/Product shipped via G1/TASK-036/G2/TASK-057/TASK-037; Contacts = TASK-055, client-blocked); fix small gaps in-place, file larger finds for the pre-launch week (2) — user steer 2026-08-11

---

## Daily Schedule

### Monday — Previous week's spillover (pre-plan, recorded)

- Previous week's G6 (Weekly Reviews run 1, PR #32) and G5 🏆 (transactional emails, PR #33) shipped — see the archive below. No groups were scheduled; this plan was written Tuesday.

### Tuesday — Close-outs + this plan + feedback form

- Morning (recorded): PR #34 order-email-await hotfix merged `c137eb9` + G5 arc close-out `da03abc`; G7/TASK-056 deferral ruled and recorded `e11a7de`; manual-testing intake filed `508b2de`; this plan (+ same-day user review: scope expansion → G13/G14).
- ✅ **[G8](#g8-launch-feedback-loop-batch)** 🔵 — part 1: TASK-058 feedback form.

### Wednesday — Feedback loop lands + i18n opens

- ✅ **[G8](#g8-launch-feedback-loop-batch)** 🔵 — part 2: TASK-059 marquee, visual gate, PR (gate ran 6 rounds → shipped Thu 2026-08-14, +2 days; hotfix PR #36 same day).
- ✅ **[G9](#g9-task-039-i18n-foundation-solo)** 🔵 — part 1: library decision + locale infra (the week's riskiest design call, front-loaded to the first full day). (Ran Thu 2026-08-14 after G8's +2-day slip.)

### Thursday — i18n externalization + rebrand residuals

- ✅ **[G9](#g9-task-039-i18n-foundation-solo)** 🔵 — part 2: content-layer externalization + §7.4 verification. (Shipped Fri 2026-08-15, PR #37.)
- ✅ **[G14](#g14-rebrand-residuals-variant-names--design-gap-audit-batch)** 🔵 — variant rename + design-gap audit. (Shipped Fri 2026-08-15, PR #38 `caf8103`; prod rename via data migration — P2 not needed.)
- **[G10](#g10-weekly-reviews-batch)** ⚪ — part 1: plugins + Claude best-practices slots (defers first if the day jams).

### Friday — Admin sweep + linter + reviews close + stretch

- **[G13](#g13-admin-translation--alignment-solo)** 🔵 — admin sweep, on G9's landed mechanism; weekend spill expected and accepted.
- **[G11](#g11-docs-freshness-linter-solo)** 🟤 — the OVERDUE linter.
- **[G10](#g10-weekly-reviews-batch)** ⚪ — part 2: non-Claude slot + propagation scan.
- 🏆 **[G12](#g12-categories-to-catalog-redesign-batch-)** 🔵 — stretch, behind everything above.
- Week close-out: statuses → `✅ PR #N`, spillover check (**add the Spillover header line if delivery runs past Sun Aug 16**), seed the pre-launch week (client ask + polish + carried finds).

---

## Summary Table

| ID  | Group                                               | Domain             | Source      | Tasks  | Total SP | Day           | Status                                                                |
| --- | --------------------------------------------------- | ------------------ | ----------- | ------ | -------- | ------------- | --------------------------------------------------------------------- |
| G8  | Launch Feedback Loop `[batch]`                      | storefront/comms   | 🔵 User     | 2      | 5        | Tue–Wed       | ✅ PR #35                                                             |
| G9  | TASK-039 i18n Foundation `[solo]`                   | i18n/content       | 🔵 User     | 3      | 8        | Wed–Thu       | ✅ PR [#37](https://github.com/GoodAlex223/dropshipping-test/pull/37) |
| G10 | Weekly Reviews `[batch]`                            | recurring reviews  | ⚪ Overhead | 4      | 5        | Thu–Fri       | ☐ Planned                                                             |
| G11 | Docs-Freshness Linter `[solo]`                      | docs tooling       | 🟤 Auto     | 1      | 3        | Fri           | ☐ Planned                                                             |
| G12 | Categories-to-Catalog Redesign `[batch]` 🏆         | storefront/catalog | 🔵 User     | 3      | 5        | Fri (stretch) | ☐ Planned                                                             |
| G13 | Admin Translation & Alignment `[solo]`              | admin panel        | 🔵 User     | 3      | 8        | Fri→spill     | ☐ Planned                                                             |
| G14 | Rebrand Residuals: Variants + Design Gaps `[batch]` | storefront/data    | 🔵 User     | 2      | 5        | Thu           | ✅ PR [#38](https://github.com/GoodAlex223/dropshipping-test/pull/38) |
| P2  | Prod re-seed after variant rename (user-gated)      | ops/data           | 🟡 Ops      | 1      | 1        | on G14 done   | ⛔ Superseded (G14 migration)                                         |
|     | **Total**                                           |                    |             | **19** | **40**   |               |                                                                       |

_Source legend: 🔵 User · 🟡 Ops · 🟤 Auto · ⚪ Overhead (exempt from the quota denominator). Status on completion: `✅ PR #N` (the number, never a bare ✅)._

---

## Notes

- _Brainstorm sanity-checks: week dates confirmed vs git/DONE (today Tue 2026-08-11; Mon Aug 10 + Tue morning consumed by the previous week's spillover — PRs #32 `8298dab` / #33 `1a4f030` Mon, #34 `c137eb9` + close-outs Tue); **the previous week did NOT land inside its header** — Aug 3–7 delivery ran through 2026-08-11, +4 days past its Friday, archived below under its TRUE header with a spillover note; velocity 26 of 28 planned SP delivered, but only via the 4-day spill → the original plan was 21 SP core + 5 SP stretch, **expanded to 40 SP by explicit user steer** (below); Cleanup Week OVERDUE by cadence, now user-confirmed for after site launch; source quotas satisfiable (89% 🔵 of scheduled non-⚪)._
- **Discussion Phase — round 1 (self-conducted, unattended, 2026-08-11)**: themes considered — **(A, chosen) i18n spine + launch feedback loop**, per the standing 2026-08-04 steer and the 2026-08-11 close-out seed list; (B) catalog-coherence-first (categories redesign core, i18n deferred) — rejected: the steer names i18n the spine, and the redesign fits as stretch; (C) pre-launch hardening bundle (deploy runbook, guest order tracking, confirmation ownership check) — rejected for now: their trigger is "before real customer traffic", which the TASK-056 deferral pushes to the pre-launch week; they seed that week instead.
- **Discussion Phase — round 2 (user review, 2026-08-11)**: rulings — (1) Cleanup Week confirmed for **after site launch**; (2) reaps **approved with a modified convention** — mark + move to BACKLOG's 🪦 end-of-file section instead of deleting (user preference, now the standing reap convention here); all 5 executed 2026-08-11 with tombstone rows; (3) G12 stays as scheduled, 🏆 stretch; (4) G9's library decision stays in-plan. **Scope expansion in the same reply**: finish ALL translations — admin panel + «Size: M» variant labels — and audit/close unbuilt design-handoff gaps → G13 (8 SP) + G14 (5 SP) + gated P2 added **despite SP** ("yes, this week will be hard"); **next week (Aug 17–21) = pre-launch week**: client data ask (TASK-056 un-defers) + polish, user-ready by its end.
- **Backlog reaps (user-approved + executed 2026-08-11 — marked-and-moved to BACKLOG's 🪦 section, not deleted, per the user's convention ruling)**:
  1. **[TASK-013] Enhanced Features umbrella** · Post-MVP Features — every open sub-item has a program-spec successor (wishlist → TASK-041, advanced search → TASK-042, discount codes → TASK-046; product recommendations shipped as BoughtTogether in TASK-037).
  2. **[TASK-015] Growth Features umbrella** · Post-MVP Features — same: i18n → TASK-039 (scheduled this week), analytics dashboard duplicates the [2026-02-01] entry, multi-currency/loyalty are spec v2.0 directions.
  3. **"Extract hardcoded USD → `NEXT_PUBLIC_CURRENCY` env var"** · [2026-02-01] TASK-018 — superseded by the shipped `formatPrice()`/§7.4 UAH architecture; transaction currency is a TASK-048 decision, and an env-var currency switch contradicts the settled design.
  4. **"Seed demo products with brand/barcode/MPN data to test feed"** · [2026-02-02] TASK-020 — its premise (the electronics demo catalog) was replaced wholesale by the deliberately-placeholder Mirox seed; realistic feed content explicitly waits for real products (TASK-054/056; user ruling 2026-08-04).
  5. **"Manual Testing Plan"** · Deferred Tasks, 2026-01-22 (flag: possibly user-raised) — implicitly delivered: `docs/TESTING_CHECKLIST.md` is literally a "Manual Testing Checklist" of "critical user flows … before each release" (323 lines), plus the standing visual-fidelity gate and the user's live manual-testing rounds now feeding TODO/BACKLOG directly (the 2026-08-11 batch).
- **Overload accounting (deliberate, user-accepted)**: 40 SP against an observed ~21-SP 3.5-day capacity — roughly 2×. Expected order under pressure: G10 defers first (its own under-deadline rule, recorded in the group note), then G12 slips to next week (its rollup member ships standalone there); weekend spillover is accepted, and the close-out adds the **Spillover** header line if delivery runs past Sun Aug 16. Sequencing that protects the critical path: G8 (Tue–Wed) → G9 (Wed–Thu) → G14 (Thu) → G13 (Fri+), because G13 and G14's string work must land in G9's final i18n mechanism, not be converted twice.
- **TASK-056 deferral consequences (standing, now time-boxed)**: real customers receive no order email (interim sender → owner inbox only) until the domain items close in the pre-launch week. The **pre-launch week (Aug 17–21)** inherits: the TASK-056 round-trip, the 🔵 production-launch deploy runbook, 🔵 guest order tracking, the G2 confirmation-page ownership check ("before real customer traffic"), the client-gated 🔵 delivery pickers / carrier decision (the Ukrposhta question), and whatever G14's audit files as larger finds.
- **TASK-039 interactions**: G8 deliberately ships through `src/content/` first; G9 then externalizes those strings with the rest — the designed trade recorded last week. G13 (admin) and G14 (variant names) run after G9 for the same reason. The EN SEO/metadata layer joins G9 only by in-plan ruling, else its BACKLOG entry stands. Any string changes must sweep every locator type across ALL E2E spec files (the PR #31 lesson), and specs that don't run locally run in CI.
- **Dependencies/risks**: G9 is the design-heavy risk (library choice; `useExtracted` vs content-config); 8 SP in 2 days matches the 8-SP-class precedent but leaves no slack. G8's marquee must rejoin the reduced-motion reset and needs a richer `site.announcement` type. G13's admin surface count is G4-sized (in-task growth precedent applies). G14's rename touches seed + 12+ call sites — the shared-constant approach is the drift guard; prod effect waits on gated P2. G11's false-positive guards are load-bearing (a naive audit fires ~20 false rows). G10 runs sequential in-session (Convention 8 — fan-out gets OOM-killed in this devcontainer).
- **Parked (carried)**: MILESTONES/GOALS refresh + 📌 Process Rules section for BACKLOG.md (Cleanup-Week fodder; MILESTONES/GOALS still show pre-Mirox January state); hydration console errors investigation (held since 2026-08-04).

### Quota Check

- 🔵 User-Flagged SP: 31 / 35 (89%) — must be ≥50% ✅
- 🟡 Operational SP: 1 / 35 (3%) — must be ≤25% ✅ (P2, user-gated)
- 🟤 Auto-Generated SP: 3 / 35 (9%) — must be ≤25% AND ≤1 group ✅ (one group: G11)
- Cleanup Week status: **overdue** — user-confirmed to run **after site launch** (ruling 2026-08-11)
- Last Cleanup Week: never (the Feb 2026 freeze week predates the cadence)
- Compliance: ✅ all quotas met — the cadence deviation and the 40-SP overload are both explicit user rulings, recorded above
- _Denominator note_: Y = 40 total − 5 ⚪ (G10 Weekly Reviews) = 35. Stretch/gated SP count in the denominator (planned work); as-delivered quotas are recomputed at close-out per last week's precedent.

---

## Weekly Challenge 🏆

**G12 — Categories-to-Catalog Redesign (🔵)**: the default-source pick — user-proposed at the G4 gate, strategic catalog UX, and it retires a launch-visible bug (parent categories listing zero products). Stretch rather than core (user-confirmed 2026-08-11): with G13/G14 added, it sits behind the translation-completion work; the rollup-fix member ships standalone next week if the stretch doesn't run.

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
