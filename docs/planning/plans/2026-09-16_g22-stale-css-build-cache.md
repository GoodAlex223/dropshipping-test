# G22 — Stale Production CSS: Build-Cache Fix Plan

**Last Updated**: 2026-09-16
**Task**: G22 (WEEKLY [G22](../WEEKLY.md#g22-production-cache-off-redeploy--smoke-re-verify-solo)) · 🟡 Ops · origin BACKLOG 🟠 🟤 [2026-09-12] G20 close-out (stale CSS, third recurrence)
**Branch**: `chore/g22-cache-off-redeploy` (from `main` @ `2804d66`)
**Status**: IN PROGRESS
**Spec**: none — classified **bounded** at brainstorming (2026-09-16): the build script, the smoke check and the runbook all exist. Design approved in chat; this plan is the project-convention record.

> **For agentic workers:** steps use checkbox (`- [ ]`) syntax for tracking. TDD: failing test first, run it red, then implement.

**Goal:** Production serves CSS compiled from the deployed source — now, and on every later deploy — without an owner-side dashboard action per deploy.

**Deviation from the booked member (user ruling, 2026-09-16):** WEEKLY books G22 as an owner-side dashboard Redeploy with "Use existing Build Cache" unchecked. At brainstorming the user chose a durable repo-side fix instead, over two alternatives: the project env var `VERCEL_FORCE_NO_BUILD_CACHE=1` (lives outside the repo, unreviewable, easy to lose at the G27 handover, also drops the npm install cache) and the one-time redeploy (fixes today only — G23 ships new utilities on Wednesday). Estimate moves from 1 SP to ~2 SP; the owner action becomes the merge go.

**Architecture:** One new step in `scripts/vercel-build.sh`, immediately before `next build`: log a line, then `rm -rf .next/cache/webpack`. That directory is Next's persistent compile cache — the only part of the restored build cache that holds compiled output — so the CSS module can no longer be served from it. The npm packages (`node_modules`) and the lint cache (`.next/cache/eslint`) stay cached. Every Vercel build, production and preview, compiles CSS from source. CI (no `.next` cache restored — `actions/setup-node` caches npm only) and local builds (`npm run build` does not run this script) are unchanged.

**Tech Stack:** Next.js 14.2.35 (webpack), Tailwind v4.1.18 via `@tailwindcss/postcss`, Vercel Git integration, Vitest.

---

## Evidence (measured 2026-09-16, read-only)

- **Production is stale.** `/` serves `143491e5ab2efd5e.css` (28 010 B) and `61c0f0682ec37a4c.css` (116 674 B). The HTML carries `flex flex-wrap gap-x-6 gap-y-2`; neither chunk contains `.gap-x-6`, `.gap-y-2` or `.-mr-4`.
- **Every production build restores the previous deployment's cache.** The `2804d66` build (`dpl_2eyC3fTo4BAVWDmyix76tNUEHTci`) logs `Restored build cache from previous deployment (3U7rgCZda4UyJZGn8i44eAZUpQR8)`. Its compile step ran 12 s (`Creating an optimized production build ...` 20:24:09 → `✓ Compiled successfully` 20:24:21) — nearly everything came from the cache; the whole build reported `Build Completed in /vercel/output [1m]`.
- **Not a missing loader hook.** Next 14.2.35's bundled postcss-loader (`next/dist/build/webpack/loaders/postcss-loader/src/index.js`) forwards Tailwind's `dependency` and `dir-dependency` messages to webpack (`addDependency` / `addContextDependency`). Why the cached CSS module still survives a source change is **not identified** — out of scope here (see Improvements).
- **Previews reproduce it.** G21's first preview (`2f3e862`, `dpl_6Rb8rreFbSvBTQKeur8taVuJJaeB`) restored production's cache (`3ntpdFN768Y3GaMWN3Bvc9R6UpaH`) and served the same stale pair.
- **The cache sometimes refreshes on its own.** G21's last preview (`03ffedd`, `dpl_ApzHWHxYFTUBtRPXV65nqjk1QKm4`) served `143491e5ab2efd5e.css` + `7f7016c66514cf76.css` (117 043 B, all seven missing utilities present), although every build in that chain restored its predecessor's cache and every commit was docs-only — while production built the same tree after the merge (`05edce3`) and stayed stale. **Consequence for verification: correct CSS alone proves nothing.** A build counts only if its log also shows the cache restore, the purge line, and a cold compile.
- **The env-var alternative is real.** Vercel docs, [Troubleshooting Build Errors § Managing Build cache](https://vercel.com/docs/deployments/troubleshoot-a-build#managing-build-cache): `VERCEL_FORCE_NO_BUILD_CACHE` = `1` skips restoring the cache; a successful build still uploads a fresh one. The runbook's existing reference to it is correct.

The seven utilities new in PR #46 and absent from production CSS (from the G20 close-out BACKLOG entry): `.gap-x-6`, `.gap-y-2`, `.-mr-4`, `.pr-4`, `.sm:overflow-visible`, `.sm:mr-0`, `.sm:pr-0`.

---

## Global Constraints

- **Nothing reaches production without the user's go.** Two pre-PR pushes of this branch are approved (preview builds only). The merge waits for an explicit go.
- **TDD** — the guard test is written first and run red before the script changes.
- **Verify against served CSS, never class strings or source text.** A build is evidence only with its log (restore → purge line → cold compile) — see Evidence.
- **Previews sit behind Vercel Authentication.** Read them through the Vercel MCP: `get_access_to_vercel_url`, then `curl` with a cookie jar (keeps the HTML out of context).
- **Docs freshness is enforced by a test.** This plan's `docs/README.md` row lands in the same commit; the index header must be ≥ every date it lists.
- **This plan carries no `ts` fences** — `tests/unit/plan-snippets.test.ts` diffs every active-plan `ts` fence against the file it names.
- **Gates run in the foreground**; commits get `timeout: 600000` (cold eslint in the pre-commit hook). Never `--no-verify`.
- **Merge readiness = CI check-runs that executed**, not the badge.

---

## Task 1: Control preview (before the fix)

- [x] Commit this plan + its index row; push the branch. — `217108c`
- [x] Preview build log: which deployment's cache was restored; compile duration. — V1
- [x] Preview CSS: expect `.gap-x-6` absent; record the chunk hashes. If it is **present**, record "control not stale — the before/after pair is inconclusive" and rely on Task 5's production evidence. — stale, 0 of 7 (V1)

## Task 2: Guard test (red first)

**Files:** Create `tests/unit/vercel-build.test.ts`

- [x] Write the test. It runs the real `scripts/vercel-build.sh` through `bash` in a temp directory, with a minimal environment (`DIRECT_URL` unset, so migrations are skipped) and a fake `npx` first on `PATH` that appends `npx <args> webpack=<present|absent>` to a log. The temp directory is seeded with `.next/cache/webpack/client-production/0.pack` and `.next/cache/eslint/.cache`. Assertions: `next build` is invoked exactly once, it saw `webpack=absent`, and `.next/cache/eslint` still exists afterwards (pins the targeted scope — widening the purge is a deliberate edit to this test, per the Task 4 escalation).
- [x] Run it: red on `webpack=present`. — V2

## Task 3: The purge

**Files:** Modify `scripts/vercel-build.sh`

- [x] Before `next build`: a comment explaining why (stale CSS served from the restored compile cache, three recurrences, root cause unidentified, what is kept), then `echo "▶ vercel-build: clearing the webpack build cache (.next/cache/webpack)"` and `rm -rf .next/cache/webpack`.
- [x] Guard test green; then `npm run test:run`, `npm run typecheck`, `npm run lint`, `npm run format:check`. — V2

## Task 4: Docs, then the fix preview

**Files:** Modify `docs/deployment/launch-runbook.md`, `CLAUDE.md`

- [x] Runbook Part 2 step 2: a CSS-affecting deploy reading `UNCHANGED` → first confirm the build log shows the purge line; the cache-off redeploy is the fallback. Part 1 Step 12: the purge covers the cache-off concern; keep the env var / dashboard option as the fallback. The quoted log line is guarded by `tests/unit/doc-source-quotes.test.ts`.
- [x] `CLAUDE.md`: add the step to the "Operative reality" `vercel-build` chain; update the stale-cache clause under Known challenges.
- [x] `doc-source-quotes`, `docs-freshness` and `plan-snippets` tests green; prettier clean. — V2
- [ ] Commit; push → fix preview. Its log must show the restore, the purge line and a cold compile; its CSS must contain all seven utilities.
- [ ] Escalation: still stale → widen to `rm -rf .next/cache` (update the test's eslint assertion); still stale → **stop and report** (the env var is the next option, and it is the user's call).

## Task 5: PR, merge, production verification

- [ ] Open the PR; confirm the CI jobs executed and passed (check-runs).
- [ ] User go → merge.
- [ ] Production build log: restore + purge line + compile duration.
- [ ] `npm run smoke -- --url https://dropshipping-test.vercel.app` exits 0 with the CSS row `CHANGED` (the local baseline holds the stale pair).
- [ ] Served CSS contains all seven utilities.
- [ ] 390px `/track`: the footer nav's computed `column-gap` is 24px and `row-gap` 8px; adjacent links are more than 0px apart.
- [ ] Record the served chunk hashes and build durations in the Verification Log.

---

## Verification Log

**Checker.** The seven utilities are counted as exact rule openings (`.gap-x-6{` … `.sm\:pr-0{`) in the downloaded chunks with a Node string split, not `grep` — `grep` in this container is `ugrep`, which rejected a `\{` pattern mid-run. Its positive control is G21's last preview chunk `7f7016c66514cf76.css`, which reads **7 of 7**, so a 0 below is a real absence and not a broken checker.

### V1 — Control preview, before the fix (2026-09-16)

- Commit `217108c` → `dpl_BGKNZAmyupGi7LqrhW5crmNtJ68f` (`dropshipping-test-mmo3y68mw-goodalex223s-projects.vercel.app`).
- Log: `Restored build cache from previous deployment (2eyC3fTo4BAVWDmyix76tNUEHTci)` — production's latest build (`2804d66`).
- Compile: `Creating an optimized production build ...` 22:53:18 → `✓ Compiled successfully` 22:53:26 = **8 s**.
- Served CSS: `143491e5ab2efd5e.css` (28 010 B) + `61c0f0682ec37a4c.css` (116 674 B) — the production pair, byte for byte in size; the HTML carries `flex flex-wrap gap-x-6 gap-y-2`. Utilities: **0 of 7**.
- **The control reproduces the bug**, so the before/after pair is meaningful.

### V2 — Guard test red → green, gates (2026-09-16)

- Red, before the script change: `deletes the webpack build cache before next build runs` failed with `expected [ 'npx next build webpack=present' ] to deeply equal [ 'npx next build webpack=absent' ]`. The scope test passed, as it must with no purge yet.
- Green after it: `vercel-build.test.ts` 2/2, `doc-source-quotes.test.ts` still passing (8 tests across the two files).
- Gates: `npm run typecheck` exit 0 · `npm run lint` exit 0 · `npm run test:run` exit 0 — 89 files, 1132 passed + 1 todo · `prettier --write` left every changed file unchanged.

---

## Improvements

Candidates for close-out extraction (minimum 2):

1. **Root cause unidentified** — why Next 14.2.35's persistent webpack cache keeps serving a CSS module whose Tailwind-scanned sources changed, although the loader forwards the dependencies, and why the same cache chain sometimes refreshes on its own (G21's preview chain). Re-examine when the ROADMAP'd Next upgrade is scoped: if the upgrade fixes invalidation, the purge can go — measure before removing it.
2. **`scripts/smoke.ts`'s `UNCHANGED` detail still says "redeploy with the cache off"** — after this change the first check is the purge line in the build log; the message will steer an operator to the fallback first.
3. **Local `npm run build` keeps the same hazard** — the purge is Vercel-only, and the stale `.next/cache` corruptor is already recorded for local prod-build verification (TASK-037). A note or a `prebuild` step would close it for local visual gates.

---

## Progress Log

- 2026-09-16 — Brainstorm (bounded). The user chose the build-script fix over the env var and the one-time redeploy; design approved in chat. Branch `chore/g22-cache-off-redeploy` created from `2804d66`.
- 2026-09-16 — Task 1: control pushed (`217108c`), stale as expected (V1). Tasks 2–3: guard test red → purge → green, full gates green (V2). Task 4 docs: runbook Step 12 and Part 2 step 2 now lead with the purge line and keep the cache-off redeploy as the fallback (Part 2 step 2 also names "markup that only reuses existing utilities" as a legitimate `UNCHANGED`, the case that let PR #46's `flex-wrap` land while its gaps did not); the runbook's `**Last Updated**` and index row moved to 2026-09-16; `CLAUDE.md` chain + Known challenges updated.

---

## Close-out

- [ ] Extract improvements → BACKLOG.md (🟤) and actionable items → TODO.md
- [ ] Archive this plan → `docs/archive/plans/` — **four** edits: move the file, move its index row to the archive table, repoint inbound links, fix this file's own outbound relative links (depth changes by one)
- [ ] WEEKLY.md: G22 member checkbox + deviation note, Summary-Table status → `✅ PR #N`, Monday Daily-Schedule entry
- [ ] BACKLOG 🟠 [2026-09-12] stale-CSS entry → resolved; DONE.md entry; commit docs; memory (the tailwind/build-cache note + the MEMORY.md 🟠 OPEN line)
