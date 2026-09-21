# G22 — Stale Production CSS: Build-Cache Fix Plan

**Last Updated**: 2026-09-21
**Task**: G22 (WEEKLY [G22](../../planning/WEEKLY.md#g22-production-cache-off-redeploy--smoke-re-verify-solo)) · 🟡 Ops · origin BACKLOG 🟠 🟤 [2026-09-12] G20 close-out (stale CSS, third recurrence)
**Branch**: `chore/g22-cache-off-redeploy` (from `main` @ `2804d66`)
**Status**: COMPLETE (merged `b1027aa`, production verified 2026-09-21 — V5)
**Spec**: none — classified **bounded** at brainstorming (2026-09-16): the build script, the smoke check and the runbook all exist. Design approved in chat; this plan is the project-convention record.

> **For agentic workers:** steps use checkbox (`- [ ]`) syntax for tracking. TDD: failing test first, run it red, then implement.

**Goal:** Production serves CSS compiled from the deployed source — now, and on every later deploy — without an owner-side dashboard action per deploy.

**Deviation from the booked member (user ruling, 2026-09-16):** WEEKLY books G22 as an owner-side dashboard Redeploy with "Use existing Build Cache" unchecked. At brainstorming the user chose a durable repo-side fix instead, over two alternatives: the project env var `VERCEL_FORCE_NO_BUILD_CACHE=1` (lives outside the repo, unreviewable, easy to lose at the G27 handover, also drops the npm install cache) and the one-time redeploy (fixes today only — G23 ships new utilities in the Sep 21–25 week). Estimate moves from 1 SP to ~2 SP; the owner action becomes the merge go.

**Architecture:** One new step in `scripts/vercel-build.sh`, immediately before `next build`: log a line, then `rm -rf .next/cache/webpack`. That directory is Next's persistent compile cache — the only part of the restored build cache that holds compiled output — so the CSS module can no longer be served from it. The npm packages (`node_modules`) and the lint cache (`.next/cache/eslint`) stay cached. Every Vercel build, production and preview, compiles CSS from source. CI (no `.next` cache restored — `actions/setup-node` caches npm only) and local builds (`npm run build` does not run this script) are unchanged.

**Tech Stack:** Next.js 14.2.35 (webpack), Tailwind v4.1.18 via `@tailwindcss/postcss`, Vercel Git integration, Vitest.

---

## Evidence (measured 2026-09-16, read-only)

- **Production is stale.** `/` serves `143491e5ab2efd5e.css` (28 010 B) and `61c0f0682ec37a4c.css` (116 674 B). The HTML carries `flex flex-wrap gap-x-6 gap-y-2`; neither chunk contains `.gap-x-6`, `.gap-y-2` or `.-mr-4`.
- **Every production build restores the previous deployment's cache.** The `2804d66` build (`dpl_2eyC3fTo4BAVWDmyix76tNUEHTci`) logs `Restored build cache from previous deployment (3U7rgCZda4UyJZGn8i44eAZUpQR8)`. Its compile step ran 12 s (`Creating an optimized production build ...` 20:24:09 → `✓ Compiled successfully` 20:24:21) — nearly everything came from the cache; the whole build reported `Build Completed in /vercel/output [1m]`.
- **Not a missing loader hook.** Next 14.2.35's bundled postcss-loader (`next/dist/build/webpack/loaders/postcss-loader/src/index.js`) forwards Tailwind's `dependency` and `dir-dependency` messages to webpack (`addDependency` / `addContextDependency`). Why the cached CSS module still survives a source change is **not identified** — out of scope here (see Improvements).
- **Previews reproduce it.** G21's first preview (`2f3e862`, `dpl_6Rb8rreFbSvBTQKeur8taVuJJaeB`) restored production's cache (`3ntpdFN768Y3GaMWN3Bvc9R6UpaH`) and served the same stale pair.
- **The cache sometimes refreshes on its own.** G21's last preview (`03ffedd`, `dpl_ApzHWHxYFTUBtRPXV65nqjk1QKm4`) served `143491e5ab2efd5e.css` + `7f7016c66514cf76.css` (117 043 B, all seven missing utilities present), although every build in that chain restored its predecessor's cache and every commit was docs-only — while production built the same tree after the merge (`05edce3`) and stayed stale. **Consequence for verification: correct CSS alone proves nothing.** A build counts only if its log also shows the cache restore, the purge line, and a cold compile. _(PR review, 2026-09-17: "docs-only" does not mean CSS-neutral here — Tailwind scans `docs/` too; see Improvement 1.)_
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

- [x] Before `next build`: a comment explaining why (stale CSS served from the restored build cache after PR #35 and PR #46, root cause unidentified, what is kept), then `echo "▶ vercel-build: clearing the webpack build cache (.next/cache/webpack)"` and `rm -rf .next/cache/webpack`.
- [x] Guard test green; then `npm run test:run`, `npm run typecheck`, `npm run lint`, `npm run format:check`. — V2

## Task 4: Docs, then the fix preview

**Files:** Modify `docs/deployment/launch-runbook.md`, `CLAUDE.md`

- [x] Runbook Part 2 step 2: a CSS-affecting deploy reading `UNCHANGED` → first confirm the build log shows the purge line; the cache-off redeploy is the fallback. Part 1 Step 12: the purge covers the cache-off concern; keep the env var / dashboard option as the fallback. The quoted log line is guarded by `tests/unit/doc-source-quotes.test.ts`. _(Superseded 2026-09-17 after the PR review: Part 2 step 2 now checks the served CSS first, and Step 12 builds the cutover with the cache off — see the Progress Log.)_
- [x] `CLAUDE.md`: add the step to the "Operative reality" `vercel-build` chain; update the stale-cache clause under Known challenges.
- [x] `doc-source-quotes`, `docs-freshness` and `plan-snippets` tests green; prettier clean. — V2
- [x] Commit; push → fix preview. Its log must show the restore, the purge line and a cold compile; its CSS must contain all seven utilities. — `ea28cbe` + `c99af2b`, 7 of 7 (V3)
- [x] Escalation: still stale → widen to `rm -rf .next/cache` (update the test's eslint assertion); still stale → **stop and report** (the env var is the next option, and it is the user's call). — not needed (V3)

## Task 5: PR, merge, production verification

- [x] Open the PR; confirm the CI jobs executed and passed (check-runs). — PR #48; CI on `d7792c4` and `3650d82` (Progress Log)
- [x] PR review: one reviewer agent (user-approved 2026-09-17). Fix what holds up, post the response record on the PR, re-confirm CI on the new head. — 1 important + 6 minor, all text; fixed in `9b3a994`; [response record](https://github.com/GoodAlex223/dropshipping-test/pull/48#issuecomment-5711601044); CI run 35201542225 on `9b3a994`, every step executed
- [x] User go → merge. — 2026-09-21, merge commit `b1027aa`
- [x] Production build log: restore + purge line + compile duration. — V5
- [x] `npm run smoke -- --url https://dropshipping-test.vercel.app` exits 0 with the CSS row `CHANGED` (the local baseline holds the stale pair). — 14/14, exit 0 (V5)
- [x] Served CSS contains all seven utilities. — 7 of 7 (V5)
- [x] 390px `/track`: the footer nav's computed `column-gap` is 24px and `row-gap` 8px; adjacent links are more than 0px apart. — 24px / 8px, links 24 px apart (V5)
- [x] Escalation: production below 7 of 7 with the purge line printed → Task 4's escalation (widen, then stop and report), and pull the "until G22" / "from G22 on" claims from `scripts/vercel-build.sh`, `CLAUDE.md` and the runbook (Step 12, Part 2 step 2). — not needed (V5)
- [x] Record the served chunk hashes and build durations in the Verification Log. — V5

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
- Mutations, script restored from git after each (clean diff, 2/2 green again): the purge moved **after** `npx next build` → `deletes the webpack build cache before next build runs` red; the purge widened to `rm -rf .next/cache` → `keeps the rest of the restored cache` red.

### V3 — Fix preview (2026-09-16)

- Commits `ea28cbe` + `c99af2b` → `dpl_BTazsSsbBd5vzBunmFQviXX2EeVP` (`dropshipping-test-8plv1o6pv-goodalex223s-projects.vercel.app`).
- Log, in order: `Restored build cache from previous deployment (BGKNZAmyupGi7LqrhW5crmNtJ68f)` — the stale control build (V1) → 23:14:42 `▶ vercel-build: clearing the webpack build cache (.next/cache/webpack)` → `▶ vercel-build: next build` → `Creating an optimized production build ...` 23:14:43 → `✓ Compiled successfully` 23:15:13 = **30 s** (V1: 8 s).
- The cold compile logged, three times: `<w> [webpack.cache.PackFileCacheStrategy/webpack.FileSystemInfo] Parsing of /vercel/path0/node_modules/next-intl/dist/esm/production/extractor/format/index.js for build dependencies failed at 'import(t)'.` / `Build dependencies behind this expression are ignored and might cause incorrect cache invalidation.` Recorded as a lead for Improvement 1, not as the explanation.
- Served CSS: `143491e5ab2efd5e.css` (28 010 B, unchanged — it never held these utilities) + `7f7016c66514cf76.css` (117 043 B). Utilities: **7 of 7**. The chunk hash equals G21's known-good preview, so the correct output is deterministic.
- **Before/after on Vercel: 0 of 7 (8 s cached compile) → 7 of 7 (30 s cold compile)**. The fix build restored the cache the stale control build left behind, so the cold compile came from the purge, not a cache miss.
- Prediction for production after merge: `143491e5ab2efd5e.css` + `7f7016c66514cf76.css`, so the smoke CSS row compares against the stale baseline pair and reads `CHANGED`.

### V4 — 390px footer check, proven against both states (2026-09-16)

The Playwright MCP could not launch Chrome here (`Running as root without --no-sandbox is not supported`), so the check is a scratch Node script on the repo's own `playwright` (which launches without the sandbox): viewport 390×844, `/track`, the footer `nav` carrying `flex-wrap gap-x-6 gap-y-2`, computed gaps plus the measured pixel distance between its links.

| Target           | CSS loaded                | `column-gap` | `row-gap` | Min gap, same line | Min gap, between lines | Doc width |
| ---------------- | ------------------------- | ------------ | --------- | ------------------ | ---------------------- | --------- |
| Production today | `143491e5…` + `61c0f068…` | `normal`     | `normal`  | **0 px**           | −0.25 px               | 390 / 390 |
| Fix preview (V3) | `143491e5…` + `7f7016c6…` | `24px`       | `8px`     | **24 px**          | 7.75 px                | 390 / 390 |

The check fails on stale CSS and passes on the fixed build, so its post-merge reading means something. Five links on two lines in both.

### V5 — Production after the merge (2026-09-21)

- Merge `b1027aa` (PR #48, merge commit) → `dpl_GyKgYJF6vhAV8MSjeCFNAAWrKSWT`, target production, created 12:39:01Z.
- Log, in order: 12:39:07Z `Restored build cache from previous deployment (2eyC3fTo4BAVWDmyix76tNUEHTci)` — the `2804d66` production build, the one whose cache served the stale pair (Evidence, V1) → 12:39:24Z `▶ vercel-build: clearing the webpack build cache (.next/cache/webpack)` → 12:39:24Z `▶ vercel-build: next build` → `Creating an optimized production build ...` 12:39:26Z → `✓ Compiled successfully` 12:40:08Z = **42 s**, against 12 s on `2804d66` from that same cache. The three next-intl `import(t)` warnings printed again — the cold-compile signature from V3.
- `✓ migrations applied` (`No pending migrations to apply.`) — the purge left Step 13's line untouched.
- Served CSS: `143491e5ab2efd5e.css` (28 010 B) + `7f7016c66514cf76.css` (117 043 B) — the pair V3 predicted, at the preview's byte sizes. Utilities: **7 of 7** (0 of 7 in the first chunk, which never held them; 7 of 7 in the second).
- `npm run smoke -- --url https://dropshipping-test.vercel.app`: exit 0, **14 of 14 PASS**, CSS row `CHANGED — the served CSS differs from the previous run (143491e5ab2efd5e, 7f7016c66514cf76)`.
- 390px `/track`: `column-gap` `24px`, `row-gap` `8px`, minimum gap between links on a line **24 px** (production before the merge: `normal` / **0 px**, V4), 5 links on 2 lines, document 390 / 390 — no horizontal overflow.
- The stale `61c0f0682ec37a4c.css` left `/` between 12:41:11Z and 12:41:33Z, about 2.5 minutes after the merge.
- **The 🟠 [2026-09-12] stale-CSS entry is closed by measurement**, and the fix is proven on the deploy path that matters, not only on previews.

---

## Improvements

Candidates for close-out extraction (minimum 2):

1. **Root cause unidentified** — why Next 14.2.35's persistent webpack cache keeps serving a CSS module whose Tailwind-scanned sources changed, although the loader forwards the dependencies, and why the same cache chain sometimes refreshes on its own (G21's preview chain). One lead from V3: on a fresh cache, webpack warns that build dependencies behind `next-intl`'s extractor `import(t)` are ignored and "might cause incorrect cache invalidation". Re-examine when the ROADMAP'd Next upgrade is scoped: if the upgrade fixes invalidation, the purge can go — measure before removing it (the V1/V3 before/after pair is the template). Three more leads from the PR review (2026-09-17): (a) **docs are Tailwind sources** — `globals.css` imports `tailwindcss` without `source()`, `@tailwindcss/postcss` takes its base from `process.cwd()`, and the oxide scanner reads 95 files under `docs/`, this plan included (confirmed 2026-09-17), so the "docs-only" commits in G21's preview chain did change Tailwind's inputs; (b) per the review's reading of the build logs, every build in that chain compiled warm, so its refresh came without a cold rebuild; (c) per the same reading, all 7 production builds since PR #46 restored from the previous production build, never from a preview.
2. **`scripts/smoke.ts`'s `UNCHANGED` detail still says "redeploy with the cache off"** — after this change the first check is the purge line in the build log; the message will steer an operator to the fallback first.
3. **Local `npm run build` keeps the same hazard** — the purge is Vercel-only, and the stale `.next/cache` corruptor is already recorded for local prod-build verification (TASK-037). A note or a `prebuild` step would close it for local visual gates.
4. **The deleted webpack cache is still rebuilt and uploaded after every build** — per the PR review's reading of the build logs, a build still ends with `Created build cache` (~20 s) and a ~300 MB upload, which includes the fresh webpack pack the next build deletes. Disabling webpack's persistent cache when `process.env.VERCEL` is set (in `next.config.mjs`) would skip writing, uploading and restoring it. Measure on a preview first, and keep what the guard test pins: no compiled output from an earlier build reaches `next build`.

---

## Progress Log

- 2026-09-16 — Brainstorm (bounded). The user chose the build-script fix over the env var and the one-time redeploy; design approved in chat. Branch `chore/g22-cache-off-redeploy` created from `2804d66`.
- 2026-09-16 — Task 1: control pushed (`217108c`), stale as expected (V1). Tasks 2–3: guard test red → purge → green, full gates green (V2). Task 4 docs: runbook Step 12 and Part 2 step 2 now lead with the purge line and keep the cache-off redeploy as the fallback (Part 2 step 2 also names "markup that only reuses existing utilities" as a legitimate `UNCHANGED`, the case that let PR #46's `flex-wrap` land while its gaps did not); the runbook's `**Last Updated**` and index row moved to 2026-09-16; `CLAUDE.md` chain + Known challenges updated.
- 2026-09-16 — Guard mutations both red (V2). Fix pushed (`ea28cbe`, `c99af2b`); fix preview 7 of 7 with a cold compile on a restored stale cache (V3); escalation not needed. Next: PR + CI, then the merge waits for the user's go.
- 2026-09-16 — Deviation from Global Constraints: **three** pushes preceded the PR, not the two approved — the third, `d7792c4`, carried only this plan's V3 record (a docs-only preview build; nothing reached production).
- 2026-09-16 — PR [#48](https://github.com/GoodAlex223/dropshipping-test/pull/48) opened; CI green on `d7792c4` with every job executing (Lint & Type Check 10/10 steps, Unit Tests 9/9, Build 9/9, E2E 16/16). No automated review comment posted. Footer check prepared against the live site (V4). Self-review of the whole diff found three wording defects, fixed in one commit: a "three times" claim listing two incidents (`CLAUDE.md`, the test's header comment, the PR body), a doubled conjunction in runbook Part 2 step 2, and the PR #35 incident attributed to the webpack cache in the runbook and the script comment, where only the PR #46 case was measured.
- 2026-09-17 — Before the review, CI on `3650d82` (run 35162999815) had passed with every step executing: Lint & Type Check 10/10, Unit Tests 9/9, Build 9/9, E2E 16/16. PR review by one reviewer agent (user-approved; ~347k tokens, 100 tool calls, ~29 min, against an estimate of ~150k). It read 16 Vercel build logs and ran 9 guard mutations on copies (the control stayed green, all 8 real mutations went red), and confirmed the mechanism. Result: 0 critical · 1 important · 6 minor, all in text. The important one is a fix-wave miss: `3650d82` said the PR #35 attribution was gone, but the test's header comment still tied PR #35 to the webpack cache, and runbook Step 12 still called that whole history "handled at the source". The "Since …, so …" construction also survived in Part 2 step 2, with a second copy in `CLAUDE.md`. Fixed as a class in one commit: the PR #35 attributions (the test comment, Step 12, and this plan's own Task 3 line); Part 2 step 2 rewritten as one diagnosis order (confirm the symptom → the purge line, with a branch for a missing line → a cache-off redeploy), mirrored in `CLAUDE.md`; Step 12 builds the one-time cutover with the cache off again (user ruling 2026-09-17), since Step 14's smoke run reads `NO-BASELINE` on a new origin and so cannot catch stale CSS there, and its purge-line check moved into Verification; the "exact cache" wording; Task 5 gains the review box and an escalation box; the close-out list gains the surfaces the review found plus a main-CI check; Improvement 1 gains three leads; Improvement 4 is new. Every remark's verdict is in the PR's response record.
- 2026-09-21 — User go → merged PR #48 as `b1027aa` (merge commit). The production build restored the stale `2804d66` cache, printed the purge line, and compiled cold in 42 s: served CSS 7 of 7, smoke 14/14 exit 0 with `CHANGED`, the 390px footer at 24px / 8px and links 24 px apart (V5). Task 5's escalation was not needed. The booked owner-side dashboard redeploy never had to happen — the merge was the owner action, as the deviation note said it would be.

---

## Close-out

- [x] Extract improvements → BACKLOG.md (🟤) and actionable items → TODO.md — 4 🟤 under `[2026-09-21] From: G22 close-out`; nothing for TODO.md (all four are backlog-shaped)
- [x] Archive this plan → `docs/archive/plans/` — **four** edits: move the file, move its index row to the archive table, repoint inbound links, fix this file's own outbound relative links (depth changes by one)
- [x] WEEKLY.md: G22 member checkbox + deviation note, Summary-Table status → `✅ PR #N`, Monday Daily-Schedule entry, the Parallel Work 🟠 stale-CSS bullet → resolved, and "G22 is an owner action" under Dependencies / risks → corrected
- [x] G19 design spec (frozen — a superseded note, not a rewrite, per the G2/G4/G5 precedent): §3's `UNCHANGED` row and §4.2 still send an operator straight to the cache-off redeploy
- [x] BACKLOG 🟠 [2026-09-12] stale-CSS entry → resolved; DONE.md entry; commit docs; memory (the tailwind/build-cache note + the MEMORY.md 🟠 OPEN line)
- [x] After the close-out push: `gh run list --branch main` shows main green — CI run 35606105193 on `f217a63`, all four jobs with every step executed (the Actions Deploy job skipped 7 of 10 steps, the documented no-op). Its docs-only production deploy printed the purge line again and left production on `143491e5ab2efd5e` + `7f7016c66514cf76`.
