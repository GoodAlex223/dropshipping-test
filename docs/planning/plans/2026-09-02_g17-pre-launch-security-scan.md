# G17 — Pre-Launch Security Scan Plan

**Last Updated**: 2026-09-03
**Task**: G17 (WEEKLY [G17](../WEEKLY.md#g17-pre-launch-security-scan-solo)) · 🟤 BACKLOG [2026-08-15] G10 run-2 adopt
**Branch**: `feat/g17-pre-launch-security-scan`
**Status**: COMPLETE 2026-09-03 — run 1 (low, whole repo) complete; 6 of 9 findings fixed, 3 filed 🟤; **F1 closed end-to-end incl. production**; run 2 (medium, `src`) attempted twice and **abandoned on cost** by user ruling — G17 closes at run-1 coverage
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

- [x] User installs the plugin (`/plugin install claude-security@claude-plugins-official`, `/reload-plugins`)
- [x] Start the sampler detached; record the pre-run memory baseline
- [x] Run the `low` / whole-repository / `focus=attack-surface` scan
- [x] Stop the sampler; record peak delta, `oom_kill` delta, wall-clock, and the run's own coverage object

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

- [x] Triage every surviving finding into exactly one of the three routes
- [x] Implement the quick fixes, each with its own failing-first regression test
- [x] File the remainder 🟤 with severity

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

- [x] Root `.gitignore` latch added
- [x] Plan doc + `docs/README.md` index row committed together
- [x] `npm run test:run`, `typecheck`, `lint`, `format:check` green before each commit

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

### 2026-09-02 — Run 1 (low, whole repository, focus=attack-surface)

**Result**: revision `cc5615e`, `verification.status: verified`. 12 candidates → **9 findings**
(1 HIGH, 7 MEDIUM, 1 LOW); 3 rejected by the panel. 36 panel votes, one verification run, no
candidate lost, no severity lowered. 38 agents, ~23 min wall-clock.

**The OOM hypothesis was wrong, and now measured.** 634 samples: cgroup peak moved 2.80 → 3.34 GiB
(+550 MiB) against a 9.71 GiB ceiling, MemAvailable floor 3.40 GiB, `oom_kill` **0**. The prediction
of ~5 agents was also wrong — 38 ran (2 researchers + 36 panel votes) — yet memory barely moved,
because these agents read local files rather than holding WebFetch payloads like the TASK-038b
fan-out that OOM'd. **The step-2 gate passes.**

**Coverage limit, stated rather than implied**: `completenessCheckOutcome: "not-applicable"` — a
low-effort run has no inventory stage, so the whole-tree accounting never ran. Run 1 says what one
pass surfaced; it is not evidence any directory is clean. Run 2 was meant to close this
gap and did not — see the 2026-09-03 section: it was abandoned on cost, so this caveat is
**permanent for G17**, not a temporary state.

### 2026-09-02 — Triage (user decisions on the record)

F1 was an abort-condition consult, not a silent fix: a HIGH, data-exposure-class finding whose
credential was verified live in the public README (9 occurrences) with documented `SEED_ALLOW_REMOTE=1`
prod seed runs behind it. The user chose to **rotate production themselves** while the code half was
fixed here, and to **triage the nine before running the depth scan**.

| Finding                                     | Severity | Route         | Outcome                                          |
| ------------------------------------------- | -------- | ------------- | ------------------------------------------------ |
| F1 seeded admin password in a public README | HIGH 3/3 | consult → fix | Fixed `fdb24ae` + owner-side rotation            |
| F2 stored XSS via review text in JSON-LD    | MED 3/3  | quick fix     | Fixed — `serializeJsonLd()`                      |
| F3 confirmation page leaks order PII        | MED 3/3  | file 🟤       | G18 owns it (shares its verification design)     |
| F4 CSV formula injection in order export    | MED 3/3  | quick fix     | Fixed — shared `src/lib/csv.ts`                  |
| F5 open redirect via `callbackUrl`          | MED 3/3  | quick fix     | Fixed — `safeCallbackUrl()`                      |
| F6 `/_next/image` SSRF via `**` host        | MED 3/3  | quick fix     | Fixed — CDN allow-list (needs post-deploy check) |
| F7 card checkout ignores amount paid        | MED 2/3  | quick fix     | Amount+currency fixed; cart-binding filed        |
| F8 unguarded stock decrement                | MED 3/3  | quick fix     | `gte` guard fixed; rate limiting filed           |
| F9 no login throttling                      | LOW 3/3  | file 🟤       | Needs Redis-backed throttling                    |

**Three things the fixing turned up that the scan did not:**

1. `confirm-order` had the **same** unguarded stock decrement as F8's `create-order`, and the scan
   only flagged the latter. Fixed both — leaving the sibling weak is exactly how F4 arose (two
   copies of an escaper, one correct, one not).
2. `confirm-order` also decremented from **raw client items** rather than the validated order lines,
   unlike `create-order`, which carries a comment explaining why that is wrong. Corrected; found by
   `tsc`, not by a test.
3. The existing `create-order` test fixture mocked `product.update`. Left alone it would have gone
   green against the guarded route **without exercising the guard** — a vacuous pass of exactly the
   [[real-data-intake-finds-what-review-cannot]] shape. Fixture moved with the code.

**Test-load finding**: the suite now fans out to 79 workers and fails non-deterministically in this
container (6 worker-start failures, 5s timeouts on IO-bound tests, `oom_kill` 0 — contention, not
the documented OOM class). Green at `--maxWorkers=4`: 79 files, 993 passed, 1 todo. Filed 🟤.

### 2026-09-02 — F1 closed in production (owner-executed, verified)

The code half shipped in `fdb24ae`; the production half was the owner's, since the app has **no
password-change endpoint or UI anywhere** — the only write to `passwordHash` in `src/app/api` is the
register route, so rotation was only possible against the database and no tool existed. Two guarded
scripts were added for it: `db:rotate-password` (`2fe52a9`) and `db:delete-test-accounts`
(`8d4c370`, dry-run by default, hard-coded address list, refuses on an ADMIN target — guard proven
by promoting a fixture and watching it refuse **with** `CONFIRM_DELETE=yes`).

**What was exposed**: `admin@store.com` / `admin123` (ADMIN), published in `README.md`'s Test
Accounts table in a public repository, plus `customer123` / `password123` on four seeded customers.

| Action                           | Evidence                                                                                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Admin password rotated           | `Rotated password for admin@store.com (ADMIN) on host "ep-small-dream-ag9shegw-pooler…neon.tech"`                                                      |
| Rotation reached the **live** DB | New password signs in on the deployed site; **`admin123` now fails** — the check that matters, since it rules out having written to the wrong endpoint |
| 4 seeded test customers deleted  | Same prod host; 8 reviews cascaded, 7 orders detached and kept                                                                                         |
| Prod confirmed clean afterwards  | Re-run dry run against prod: `No seeded test accounts found — nothing to do.`                                                                          |

**Accepted consequence, verified benign**: production PDPs now show zero reviews. Checked rather
than assumed — `getProductJsonLd`'s `hasReviews` guard (`src/lib/seo.ts:281`) omits both
`aggregateRating` and `review` rather than emitting empty or `NaN` markup, `ReviewStats` returns
`null` at zero, and `tests/unit/seo.test.ts:441` already covers the zero case. The 8 deleted reviews
were seeded placeholders; real social proof has to come from real customers.

**Correction recorded**: the `.env` duplicate-`DATABASE_URL` hazard carried in memory is **stale** —
the second (Neon) line is commented out, disabled in TASK-038a with a note explaining it had
silently pointed local dev and E2E at live production. What was verified instead, and is what the
runbook should say: an inline `DATABASE_URL=… npm run …` **does** beat `.env`, because dotenv does
not override variables already present in the environment.

### 2026-09-03 — Run 2 attempted twice, abandoned on cost (user ruling)

Run 2 was launched as specified: scope `src` (**255 tracked files**), `--effort medium`,
`focus: "attack-surface"`, report dir `CLAUDE-SECURITY-20260902-220932/`.

**It never reached the verification panel.** Two launches, both ended by the session, not by the
scan:

| Attempt               | Started   | Died      | Ran for | Artifacts written                     |
| --------------------- | --------- | --------- | ------- | ------------------------------------- |
| 1 (fresh)             | 22:09 UTC | 22:17 UTC | ~8 min  | `scan-meta.json`, `target-files.json` |
| 2 (`resumeFromRunId`) | 00:29 UTC | —         | ~30 min | none beyond the above                 |

Neither attempt wrote a `findings.json`, a `votes.json`, or a report. The report directory was
therefore **deleted**, not kept: it held no results, and an empty `CLAUDE-SECURITY-*` directory on
disk reads like a clean scan to anyone who finds it later. That misreading is the whole hazard here.

**Not an OOM.** The sampler ran across both attempts: cgroup peak **4.86 GiB** against the 9.71 GiB
ceiling, `oom_kill` **0** throughout. Run 1's measurement (peak 3.34 GiB, 38 agents) still stands as
the memory-gate evidence; the medium tier costs more but stayed well inside the box. What it did not
stay inside was the **context/session budget** — the constraint that actually binds here is tokens
and session length, not RAM.

**User ruling (2026-09-03):** the medium tier is not affordable — "a huge number of tokens that I
can't afford to use, plus I can't fit them all into a single work session (Claude's limits cut the
session short)". Run 2 is **abandoned, not deferred to later in G17**. G17 closes at run-1 coverage.

**What this costs, stated plainly:** run 1 was low-effort, so it had no inventory stage and its
`completenessCheckOutcome` was `not-applicable`. G17 therefore ships **nine findings that one pass
surfaced, six of them fixed** — and **no claim that any directory is clean**. Anyone reading this
record later should not treat G17 as a clean bill of health for `src`.

**Re-run shape, if it is ever wanted:** the tier is the problem, not the target. A `low` run scoped
to `src` fits a session (run 1's whole-repo `low` pass completed comfortably) and would at least
re-examine the attack surface against the six fixes now in the branch. Filed 🟤 rather than left as
a dangling "owed".
