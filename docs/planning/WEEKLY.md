# Weekly Plan

**Week of**: 2026-07-13 to 2026-07-19
**Last Updated**: 2026-07-14

---

## 🎯 Weekly Focus

**Primary Goal**: Resume development post-freeze (TASK-033) and start Mirox Shop v1.3 tracks.

**Secondary Goals**:

- Start Track A rebrand foundation (TASK-034)
- Complete Track B payments/delivery research spike (TASK-038)

---

## 📋 Planned Tasks

### Must Complete (Critical)

| Task                      | Reference        | Status     | Notes               |
| ------------------------- | ---------------- | ---------- | ------------------- |
| Resumption validation     | TODO.md TASK-033 | ✅ PR #16  | Merged 2026-07-14   |
| Payments & delivery spike | TODO.md TASK-038 | 📋 Planned | Blocks v1.4 Track B |

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

---

## 🔮 Next Week Preview

**Tentative Focus**: TASK-035 homepage + TASK-036 catalog (Track A); TASK-039 i18n foundation (Track B).

**Preparation Needed**:

- [ ] Client design files (Figma) — chase if still missing
- [ ] Payment gateway merchant account prerequisites from TASK-038 findings

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
