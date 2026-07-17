# Weekly Plan

**Week of**: 2026-07-13 to 2026-07-19
**Last Updated**: 2026-07-16

---

## 🎯 Weekly Focus

**Primary Goal**: Resume development post-freeze (TASK-033) and start Mirox Shop v1.3 tracks.

**Secondary Goals**:

- Start Track A rebrand foundation (TASK-034)
- Complete Track B payments/delivery research spike (TASK-038b)

---

## 📋 Planned Tasks

### Must Complete (Critical)

| Task                      | Reference         | Status    | Notes                                                                                                                                                                     |
| ------------------------- | ----------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resumption validation     | TODO.md TASK-033  | ✅ PR #16 | Merged 2026-07-14                                                                                                                                                         |
| Prework (WebKit/sharp/CI) | TODO.md TASK-038a | ✅ PR #17 | Branch B (test artifact, not a product bug) — WebKit `fill()` before hydration; no product code changed                                                                   |
| Payments & delivery spike | TODO.md TASK-038b | ✅ PR #18 | Decision doc; 120 claims verified (27.5% disputed). Fondy disqualified (NBU licence revoked); LiqPay = safest default. Unblocks v1.4 Track B pending client prerequisites |

### Should Complete (Important)

| Task                     | Reference        | Status     | Notes                             |
| ------------------------ | ---------------- | ---------- | --------------------------------- |
| Design system foundation | TODO.md TASK-034 | 📋 Planned | Ultracode restyle sweep candidate |

### Nice to Have (If Time Permits)

| Task          | Reference        | Status     | Notes                              |
| ------------- | ---------------- | ---------- | ---------------------------------- |
| CI extensions | TODO.md TASK-040 | 📋 Planned | Lighthouse budget, preview deploys |

---

## 🚧 Blockers & Risks

| Blocker                        | Impact                      | Mitigation                              | Owner  |
| ------------------------------ | --------------------------- | --------------------------------------- | ------ |
| 5-month dependency drift       | Unknown vulnerabilities     | TASK-033 audit with conservative policy | Claude |
| Design files not yet delivered | Possible rework in TASK-035 | Token-driven components in TASK-034     | User   |

---

## 📊 Progress Tracking

### Daily Log

#### Tuesday (2026-07-14)

- [x] TASK-033: environment bring-up, audit, validation baseline, planning docs
- **Completed**: TASK-033 in full — env bring-up, audit (32→6 vulns, commit 3a3ec75), validation baseline (unit/build green; E2E 83/85, WebKit-only pre-existing bug), planning docs, review fixes, PR #16 merged (c07e474)
- **Blockers**: none (open decision: WebKit E2E fix-vs-defer before v1.3 feature work)

#### Wednesday (2026-07-15)

- [x] Post-merge verification: CI + Deploy green on merge (c07e474) and completion docs (35819dc); Vercel production deploy live
- **Completed**: TASK-033 completion workflow (extract/archive/transition/commit/memory); 2 new BACKLOG entries from verification (`sharp` missing in standalone mode; Actions deploy job is a validated no-op without secrets)
- **Blockers**: none (open decisions for user: WebKit fix-vs-defer; add `sharp` now vs backlog)

#### Thursday (2026-07-16)

- [x] TASK-038a: diagnosed WebKit E2E search-filter failure, added `sharp`, added `webkit` to CI, completion workflow
- **Completed**: TASK-038a in full — diagnosis proved the WebKit failure is a test artifact (pre-hydration `fill()` race), not a product bug, per Branch B of spec §4.3; `tests/e2e/products.spec.ts` now waits for a hydration signal before interacting; `sharp ^0.35.3` added to `dependencies`; `webkit` added to the CI E2E matrix; BACKLOG `:345`/`:361` resolved, 6 new entries added; `.prettierignore` fixed so `format:check` is usable locally again. Full verification: unit 246+1 todo, lint/typecheck/build/format:check all PASS, E2E 84/85 (both previously-failing WebKit/Mobile Safari tests now pass; 1 pre-existing unrelated chromium dev-server flake remains, BACKLOG'd)
- **Blockers**: none. Both open decisions from 2026-07-15 (WebKit fix-vs-defer, `sharp` add-vs-backlog) are resolved. PR #17 opened from `feat/task-038a-prework`; that run is the first execution of the new `webkit` CI job, which is spec §8's one criterion not verifiable locally

#### Friday (2026-07-17)

- [x] TASK-038b: Ukraine payments & delivery research spike — brainstorm → spec → plan → research → decision doc → PR #18 merged (`cebbbe5`), completion workflow
- **Completed**: TASK-038b in full. Decision doc delivered (9 sections, no product code): two-rail model (online gateway **and** NP COD), 5-gateway × 16-field matrix, conditional decision tree + 9-item client prerequisites, NP scoping, single-UAH strategy, and a TASK-048/049 integration blueprint. Method: Ultracode fan-out + adversarial verification — **120 claims, all verified; 27.5% of the raw research was disputed**, which is the spike's central justification. Four plan-changing findings: **Fondy disqualified** (NBU licence of ТОВ «ФК "ЕЛАЄНС"» revoked 2024-07-22), **Plata by mono cannot offer installments** via the acquiring API, **monobank requires a UA-language site** (escalates TASK-039 to a payments prerequisite), and an **inverted NP postomat UUID** that would have shipped branch pickups to locker customers. PR review found 3 issues (all self-imposed-rule violations), fixed in `92b4e1f`; re-review clean; CI + Deploy green; Vercel production live.
- **Blockers**: none for this task. **Downstream blockers now recorded**: the 9-item client prerequisites checklist (decision doc §5.3) gates TASK-048's single-gateway pick; the classic NP status-webhook question is unresolved (devportal Cloudflare-blocked) and gates TASK-049's polling design.
- **Note**: the research workflow was OOM-killed 3× (devcontainer memory, not Docker); finished via foreground agents. Phase 1 investigation BACKLOG'd with a repro plan — do it in a separate session.

---

## 🔮 Next Week Preview

**Tentative Focus**: TASK-035 homepage + TASK-036 catalog (Track A); TASK-039 i18n foundation (Track B).

**Preparation Needed**:

- [ ] Client design files (Figma) — chase if still missing
- [ ] Client asset chase-list: hero model photos, customer/gallery photos (w/ consent), vector logo, real follower counts, size charts — see BACKLOG "Content dependencies" note
- [ ] Client decision: discount wheel — present recorded doubts (BACKLOG) before any build
- [ ] **Client answers to the 9-item prerequisites checklist** ([decision doc §5.3](../superpowers/specs/2026-07-16-ukraine-payments-delivery-decision.md)) — legal form (ФОП/ТОВ), tax group, turnover vs the 10,091,049 UAH Group 3 cap, VAT status, current bank (the Plata-vs-LiqPay switch), installments wanted?, РРО/ПРРО status (**accountant, not us**), NovaPay account?, site prerequisites (public offer + return policy; UA-language version). Until these land, TASK-048 has a decision tree but no single gateway.
- [ ] **Open the Cloudflare-blocked `developers.novaposhta.ua` from an unblocked network** to settle whether the classic API has a status webhook — gates TASK-049's polling design (decision doc §6.6)

---

## Status Legend

| Symbol | Meaning      |
| ------ | ------------ |
| 📋     | Planned      |
| ⏳     | In Progress  |
| ✅     | Completed    |
| ⏸️     | On Hold      |
| ❌     | Canceled     |
| 🔄     | Carried Over |
