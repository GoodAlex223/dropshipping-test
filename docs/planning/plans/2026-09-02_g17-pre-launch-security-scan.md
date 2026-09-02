# G17 — Pre-Launch Security Scan Plan

**Last Updated**: 2026-09-02
**Task**: G17 (WEEKLY [G17](../WEEKLY.md#g17-pre-launch-security-scan-solo)) · 🟤 BACKLOG [2026-08-15] G10 run-2 adopt
**Branch**: `feat/g17-pre-launch-security-scan`
**Status**: IN PROGRESS 2026-09-02 — design approved, scan not yet run
**Spec**: none (bounded task; the approved design is §1–§4 below)

**Goal:** Run the adopted `claude-security` deep scan against the code that is about to take real
customer traffic, then triage what it finds — quick confirmed fixes land in-branch with tests, the
rest is filed 🟤 with severity, and anything severe is a consult, not a silent fix.

**Why now:** the G10 run-2 `adopt` was pinned by its own park condition to exactly this window
("pre-launch security pass is scheduled, or real customer traffic is imminent"). Real product data
is already live in production (G16, 2026-09-01), so the second half of that condition has fired.

---

## 0. Preconditions (measured 2026-09-02, not assumed)

| Precondition                | Measured value                                                                | Verdict                                                   |
| --------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------- |
| `claude-security` installed | **No** — in the marketplace clone, absent from `installed_plugins.json`       | Blocker — user runs `/plugin install` + `/reload-plugins` |
| Plugin version in clone     | **v0.11.0** (BACKLOG recorded v0.10.0; clone refreshed since 2026-08-15)      | Note the drift in the close-out                           |
| Python on PATH              | 3.11.2 (needs ≥ 3.9)                                                          | ✅                                                        |
| Git checkout                | clean, branched off `main` at `b0a9983`                                       | ✅                                                        |
| Workflow tool               | available to this session                                                     | ✅ (re-checked at run time by the recipe)                 |
| Tracked files               | 532 total · `src` 253 · `src/app/api` 48 · `src/lib` 35                       | sizing input                                              |
| Repo visibility             | **PUBLIC** (`GoodAlex223/dropshipping-test`)                                  | governs §4                                                |
| Container memory            | 9.71 GiB total · 4.13 GiB available · peak-since-boot 4.70 GiB · `oom_kill 0` | see §1                                                    |
| `.husky/pre-commit`         | `npx lint-staged` only — **no unit suite**                                    | run `npm run test:run` manually before every commit       |

**Known environment hazard.** [[devcontainer-tooling-quirks]] records background Workflow fan-outs
being OOM-killed 3× in TASK-038b (8.45 GiB peak; no cgroup cap, so the ceiling is the WSL2 VM's
9.7 GiB). The Workflow runtime caps concurrency at `min(16, nproc−2)` = **14 agents**, and
`claude-security`'s `scan.js` calls `parallel()` in four places. Mitigating but unverified: those
agents read local files rather than fetching web payloads, so per-agent footprint should be lower
than TASK-038b's research fan-out. Treated as a live risk, not a solved one — hence §1.

---

## 1. Step 1 — instrument, then smoke run (`low`, whole repository, `focus=attack-surface`)

At `low` the scan shape is **one researcher + a secrets pass + the fixed three-voter panel**, and
that fan-out does _not_ scale with scope. The whole 532-file tree therefore costs the same ~5
agents as an 88-file slice — so the smoke run is deliberately the **widest** scope, not the
narrowest: maximum coverage for minimum OOM exposure, and it returns a genuine panel-verified
report plus a full-tree secrets sweep rather than a throwaway dry run.

Instrument (verified working before use, per [[guards-need-teeth-and-token-layer-coverage]]):
a detached sampler logs `MemAvailable`, `SwapFree`, `memory.current`, `memory.peak` and the
`oom_kill` counter every 5s. **`/sys/fs/cgroup/memory.peak` is read-only in this container**, so it
cannot be zeroed before the run; the usable signals are therefore (a) does peak climb past its
current 4.70 GiB high-water mark, and (b) does `oom_kill` move off 0.

- [ ] User installs the plugin (`/plugin install claude-security@claude-plugins-official`, `/reload-plugins`)
- [ ] Start the sampler detached; record the pre-run memory baseline
- [ ] Run the `low` / whole-repository / `focus=attack-surface` scan
- [ ] Stop the sampler; record peak delta, `oom_kill` delta, wall-clock, and the run's own coverage object

## 2. Step 2 — depth run (`medium`, scope `src`, `focus=attack-surface`)

**Gate:** if step 1's sampler shows peak running close to the ceiling, the medium scope is narrowed
and the user is told **before** the run starts, not after.

Scope is `src` (253 files), not the tighter `src/app/api,src/lib,src/services,src/workers` (~88).
The BACKLOG's own target surface names the **auth middleware** — which lives at `src/middleware.ts`,
_outside_ `src/app` — and the **admin routes**. A directory list that omits them leaves named
surface unscanned while the report still reads clean. `src` covers the whole named surface and
still excludes `docs/`, `tests/`, `public/`.

**Coverage caveat to carry into the record:** `completenessCheckOutcome` is `not-applicable` for
both low-effort and scoped runs, so neither pass produces the whole-tree accounting an unscoped
`medium`+ run would. A clean result is reported as "this scope was examined" — never as "the
repository is covered".

- [ ] Read the step-1 instrument; decide scope; state the decision before launching
- [ ] Run the `medium` / `src` / `focus=attack-surface` scan
- [ ] Record revision SHA, effort, scope, severity counts, verification stamp, coverage object

## 3. Step 3 — triage

Routed by severity, decided on the record:

| Severity                                    | Route                                                                              |
| ------------------------------------------- | ---------------------------------------------------------------------------------- |
| CRITICAL / HIGH, or any data-exposure class | **Stop and consult the user.** WEEKLY's own abort condition — not a silent fix.    |
| MEDIUM / LOW judged _quick_                 | Fix in-branch, **TDD**: a failing test demonstrating the flaw first, then the fix. |
| Everything else                             | 🟤 BACKLOG row with severity.                                                      |

"Quick" is bounded, not vibes: **one file, no API-contract change, no schema change.** Anything
that fails that test is filed rather than fixed, however tempting.

BACKLOG rows go under `### [2026-09-02] From: G17 pre-launch security scan`, one entry per finding
(never silently merged), tagged `[possible-dup-of: …]` where a finding overlaps a standing G2
hardening item.

- [ ] Triage every surviving finding into exactly one of the three routes
- [ ] Implement the quick fixes, each with its own failing-first regression test
- [ ] File the remainder 🟤 with severity

## 4. Step 4 — what is and is not committed

**The repository is PUBLIC, so the raw report is never committed.** `CLAUDE-SECURITY-<ts>/`
carries its own `.gitignore`; a root-level `CLAUDE-SECURITY-*/` entry is added as a second latch.
Trade-off accepted knowingly: that overrides the plugin's "delete the inner `.gitignore` to commit
a report" affordance, so deliberately committing a report later needs `git add -f`. On a public
repo holding unfixed findings that is the right trade.

Committed instead: this plan doc (revision SHA, effort tiers, scopes, coverage caveats, severity
counts, verification stamp, triage table — findings **by class, with no exploit recipes**), the
fixes and their tests, the BACKLOG rows, and the WEEKLY checkboxes.

**G11 constraint:** `docs/planning/plans/` is covered by `docs/planning` in the linter's
`INDEXED_DIRS`, so this file needs a `docs/README.md` row in the same commit, and the index's own
header must be ≥ every date it lists.

- [ ] Root `.gitignore` latch added
- [ ] Plan doc + `docs/README.md` index row committed together
- [ ] `npm run test:run`, `typecheck`, `lint`, `format:check` green before each commit

---

## Out of scope

Dependency-vulnerability scanning (`npm audit` — TASK-027 lineage, separate work); G18's
confirmation-page ownership check (its own group); applying plugin-generated patch files (the user
chose hand-fixing with tests over the plugin's "Suggest patches" job); opening a PR (explicitly
not wanted — the branch is pushed as backup only).

---

## Progress Log

### 2026-09-02 — Planning

- Branch `feat/g17-pre-launch-security-scan` cut from clean `main` at `b0a9983`.
- Brainstormed as a **bounded** task; design approved by the user in chat before any execution.
- Two user decisions on the record: **staged `low` → `medium`** scan shape (over straight-to-medium,
  whole-repo, or narrow-`high`), and **hand-fixing with TDD** (over the plugin's patch job).
- Preconditions measured rather than assumed — table in §0. Two surprises worth the ink: the
  marketplace clone now carries **v0.11.0**, not the v0.10.0 the BACKLOG recorded; and
  `.husky/pre-commit` runs **lint-staged only**, so the unit suite is a manual step before each
  commit (the same correction G16's plan already had to make).
- Memory sampler written to the scratchpad and **self-tested before trust** — 3 data rows, every
  field populated. `memory.peak` proved read-only, so the instrument's design was adjusted to a
  high-water-mark delta rather than a zeroed-peak measurement.
