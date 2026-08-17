# G11 — Docs-Freshness Linter: Design

**Date**: 2026-08-17
**Status**: Approved — ready for implementation plan
**Group**: [WEEKLY.md](../../planning/WEEKLY.md) G11 (🟤 Auto · docs tooling · 3 SP)
**Sources**: BACKLOG [2026-07-18] TASK-034 PR #19 reviews · [2026-08-01] PR #26 review · [2026-08-09] G4 completion · [2026-08-10] G6 (prettier fixed-point) · [2026-02-10] TASK-030 (link checker) · [REVIEW-QUEUE.md](../../planning/REVIEW-QUEUE.md) G10 run 2 slot 3 (`spec-kit` design input)

This spec carries `**Date**:`, not `**Last Updated**:` — per Decision 1 below, which this
document is the first instance of.

---

## 1. Problem

A doc's own `**Last Updated**` header and its row in `docs/README.md` drift apart. Human review has
caught this **nine** times — PRs #16, #17, #19, #21, #23, #26, #27 (twice, where the fix that
corrected the header re-created the drift in the row), #30 (twice) and #33. The entry to automate it
has been OVERDUE since 2026-08-03.

**A tenth recurrence is live in the tree right now**, created by the G13 close-out on 2026-08-17
while this entry sat unbuilt: `docs/README.md:38` claims `planning/DONE.md` was last updated
`2026-08-15`; `docs/planning/DONE.md:5` declares `2026-08-17`.

### 1.1 Why a naive implementation is worse than nothing

Measured against the tree at `d845473`:

| Audit                                                       | Rows fired | Real | False  |
| ----------------------------------------------------------- | ---------- | ---- | ------ |
| Naive — compare a row's date to any stamp found, or to none | **27**     | 1    | **26** |
| Guarded — per §3                                            | **1**      | 1    | 0      |

A first pass during PR #19 flagged 17 rows with 16 false; PR #27 measured ~20. Today it is 27. **The
false-positive guards are not a refinement of this feature — they are 96% of it.** Shipping the
naive check would train the team to ignore a red suite, which is strictly worse than the nine manual
catches.

The same lesson repeated twice inside this design session. A first-draft link checker fired **18**
broken links, of which **13 were its own parser's defects** (percent-encoded spaces in
`Mirox%20Cart.dc.html`, and `<…>` autolink syntax wrapping paths that contain parentheses). Fixing
those left 5 — and a fourth link-parser guard, discovered while gathering line numbers for the implementation
plan, removed one more: `docs/archive/plans/2026-07-27_task-057-design-adoption.md:1506` holds a
link **inside an inline code span**, quoting text destined for a different file, where the path is
correct. The true count is **4**.

That second discovery is the strongest evidence for §5's method: the figure moved twice under
inspection, and only running the checker moved it. Neither correction came from re-reading the
BACKLOG.

---

## 2. Decisions

**Decision 1 — specs are exempt by construction (BACKLOG option (b)).**
The linter's universe is files that declare `**Last Updated**:`. A file with no such stamp is
**skipped, never failed**. Spec files under `docs/superpowers/specs/` keep `**Date**:` as an
immutable authoring date and are therefore never compared.

_Rejected: option (a), giving specs their own `Last Updated` line._ It would churn 19 files, add a
third stamp to maintain forever, and create a second drift surface in order to close the first. It
also breaks a legitimate existing pattern: spec index rows deliberately diverge from spec headers to
record revision rounds — the TASK-036 spec's row reads `2026-08-01` for its §8a round while its
header correctly stays `**Date**: 2026-07-31`. A naive header↔row check would false-positive on
exactly the row that PR #26 fixed.

**Decision 2 — the reverse check runs over an explicit directory allowlist, and the 9 missing
archive rows are added rather than exempted.**
This settles the open convention question in BACKLOG [2026-08-09]: **WEEKLY-group plans are indexed
alongside TASK-\* plans.** The archive table's scope is "every archived plan", not "TASK-\* only".

**Decision 3 — enforcement is a unit test, not a hook or a script.**
`tests/unit/docs-freshness.test.ts`, running in the existing CI test job. No pre-commit hook, no npm
script, no new dependency — per WEEKLY's "a plain unit test à la `no-bright-colors.test.ts`, no new
tooling".

**Decision 4 — two optional checks ride along; two are deferred.**
In: the prettier fixed-point assertion and the broken-internal-link check. Out: the git-timestamp
staleness variant and the cross-doc value-agreement check (§7).

---

## 3. Architecture

One file, one parser, five independent `describe` blocks.

```
tests/unit/docs-freshness.test.ts
├── seams (shared)
│   ├── walkDocs(dir)      → every .md under docs/
│   ├── parseTables(md)    → rows keyed by HEADER NAME, with source line numbers
│   └── readStamp(file)    → { lastUpdated | null, date | null }
└── describe blocks 1–5 (below)
```

The seams exist because BACKLOG [2026-08-01] requires the host be scoped to carry more than
header↔row pairs, and BACKLOG [2026-08-15] names a third check for the same host. Keeping them as
named local functions rather than a `scripts/` module satisfies that without the new tooling
Decision 3 rules out; extraction later is mechanical.

### 3.1 The five checks and their guards

**Check 1 — index row ↔ doc header.**
For each index row whose target file declares `**Last Updated**:`, the row's date must equal the
header's. _Guard:_ files without the stamp are skipped. This alone removes 26 of the 27 naive fires.

**Check 2 — date columns are selected by header name.**
A column contributes a comparison only if its header cell is literally `Last Updated`. _Guard:_ the
Archived Plans table's `Status` column holds `COMPLETE`/`ACTIVE` — not a date at all — and its
`Completed` column holds an event date, not a freshness stamp. Both are excluded by name, never by
column index.

**Check 3 — reverse coverage.**
Every `.md` under an allowlisted directory must have a row in `docs/README.md`. Allowlist:
`planning/`, `superpowers/specs/`, `archive/plans/`, `api/`, `database/`, `deployment/`, `testing/`,
`reference/`, plus the three tracked root docs (`ARCHITECTURE.md`, `PROJECT_CONTEXT.md`,
`TESTING_CHECKLIST.md`).
_Guard:_ exemptions are listed **by exact path**, following the
`ADMIN_ONLY_PROPS` idiom in `no-bright-colors.test.ts` — `docs/README.md` (self), `*/README.md`
directory indexes, and the two `design_handoff_mirox/` sub-docs indexed by their own parent README.
Unguarded, this check fires 13 rows of which 4 are wrong.

> **Superseded note (2026-08-17, final whole-branch review).** The paragraph above is left as the
> record of what was designed, not edited to match what shipped — it describes an allowlist (7
> directories + 3 root docs, now 8 with `reference/` added just above) that cannot itself produce
> the exemption list in the same paragraph: the shipped `INDEX_EXEMPT` is one exact-path entry
> (`docs/archive/plans/README.md`), not a `*/README.md` pattern, and the claim that the two
> `design_handoff_mirox/` sub-docs are "indexed by their own parent README" was checked during
> this review and found false — that README names its siblings only inside inline code spans,
> which Check 5b's link-extraction guard deliberately strips, so they were never markdown links at
> all. The shipped test therefore excludes `docs/design/**` and `docs/plans/` (plus the
> `docs/archive/` root and `docs/README.md` itself) via a separate, explicit `OUT_OF_SCOPE_DIRS`
> const with a stated reason per entry, rather than folding them into `INDEX_EXEMPT`. The "13 rows
> of which 4 are wrong" figure was also measured at an earlier, different point in the same design
> session than the "1 finding" figure in §1.1's table — not a contradiction to reconcile, just two
> snapshots of a tree that was still moving. The shipped scope's unguarded fire count is **10** rows
> with **1** exemption. `tests/unit/docs-freshness.test.ts`'s `INDEXED_DIRS` / `INDEXED_ROOT_DOCS` /
> `INDEX_EXEMPT` / `OUT_OF_SCOPE_DIRS` are the current, coherent source of truth for this check's
> scope; a new self-truing meta-assertion added in the same review (every `.md` under `docs/` must
> be indexed, exempt, or explicitly out of scope) keeps it from drifting silently again.

**Check 4 — `docs/README.md`'s own header.**
README's own `**Last Updated**` must be greater than or equal to every date in any `Last Updated`
column it contains. Catches the "bumped a row, forgot the header" half of the class — recurrences #8
and #9. Verified passing today: `2026-08-17` ≥ `2026-08-16`.

**Check 5 — prettier fixed-point, and no broken relative links.**

- _Fixed-point:_ running `prettier --write` over `docs/**/*.md` twice must leave the tree
  byte-identical. PR #32 `53fa347` hit a state `--write` could not reach a fixed point on — an
  inline code span carrying list-marker syntax across a wrapped line — and CI failed on a file the
  formatter had just "fixed". Verified today: idempotent, and `--check` is clean.
- _Links:_ every relative link in `docs/**` must resolve. _Guard:_ four parser requirements, each
  earned by a false positive it removed — `decodeURIComponent` the target; accept the
  `[text](<path with (parens)>)` autolink form; strip fenced code blocks, so directory-structure
  diagrams are not read as links; and **strip inline code spans**, so a link quoted as literal text
  for insertion into another file is not resolved against the quoting file's own location. Without
  all four the check reports 18 instead of 4.

---

## 4. In-branch drift fixes

The linter is red on arrival by design. Fourteen fixes, all genuine drift, all in this branch (one
PR, docs fixes committed ahead of the linter so the two are independently reviewable):

1. **1 header↔row drift** — `docs/README.md:38`, `2026-08-15` → `2026-08-17` (recurrence #10).
2. **9 missing archive rows** — `2026-02-10_task-030-documentation-finalization`, `2026-08-04_g1`,
   `2026-08-06_g2`, `2026-08-08_g3`, `2026-08-08_g4`, `2026-08-10_g5`, `2026-08-14_task-039`,
   `2026-08-15_g14`, `2026-08-16_g13`. Each row's `Completed` date is **sourced from DONE.md or the
   merge commit**, never inferred from the filename. Closes BACKLOG [2026-08-09].
3. **4 broken links** —
   - `docs/planning/DONE.md:672` and `:852` → `../plans/2026-01-05_dropshipping-mvp-plan.md`; the
     plan was archived to `archive/plans/`. This is BACKLOG [2026-07-18] "Two stale plan links in
     DONE.md", open since July and independently rediscovered by this check — the line numbers in
     that entry (`:245`, `:425`) have since shifted, which is itself why a linter beats a filed
     coordinate.
   - `docs/planning/DONE.md:241` → `../audits/2026-08-04-storefront-staleness-audit.md`; `audits/`
     is a child of `planning/`, so the `../` is wrong.
   - `docs/plans/README.md:60` → `../../.claude/TEMPLATES/plan.md`. The template is real but lives at
     the **user-global** `/root/.claude/TEMPLATES/plan.md`; there is no `.claude/TEMPLATES/` in this
     repo. **Reworded to prose, not repathed** — a repo-relative link to a machine-local file would
     be broken for every other checkout. (`:9` names the same template in prose already and is not a
     link, so it needs no change.)

**Not fixes, and deliberately so.** `docs/archive/plans/2026-07-27_task-057-design-adoption.md:1506`
resolves as broken only to a parser that reads inline code spans — the link is quoted text destined
for a file in `superpowers/specs/`, where the path is correct. It is handled by Check 5's guard, not
by editing the archived plan. Separately, **this spec's own index row** was added while writing this
document and is therefore not counted among the fourteen.

---

## 5. Verification approach

A check that cannot fail is indistinguishable from one that passes, so green output is not evidence.

- **Non-vacuity assertions** on every scanned set — `files.length > 0`, `comparableRows.length > 0`,
  `linkCount > 0` — mirroring the vacuous-pass guards in `no-bright-colors.test.ts`. A renamed or
  moved directory must fail loudly rather than silently disarm the guard.
- **Deliberately-broken controls, run and recorded before the suite is trusted.** For each of the
  five checks, introduce the defect it exists to catch, confirm red, restore, confirm green. The
  control run's output is part of the completion evidence, not just the passing run.
- **TDD order** — write the check, watch it fail against today's real drift (§4), fix the docs,
  green. The `DONE.md` row is a genuine red-before-green fixture; no fabrication needed.

---

## 6. Acceptance criteria

- [ ] `npm run test:run` green, with `tests/unit/docs-freshness.test.ts` reporting a non-zero
      scanned-file count for every check.
- [ ] Each of the five checks demonstrated red under its deliberately-broken control, output
      recorded.
- [ ] Guarded audit fires **0** rows; naive-equivalent behaviour is not reachable from the shipped
      code (no code path compares against `**Date**:`).
- [ ] All 14 §4 fixes applied; `prettier --check "docs/**/*.md"` clean.
- [ ] `npm run typecheck` and `npm run lint` clean.

---

## 7. Out of scope

- **Git-timestamp staleness** (BACKLOG [2026-02-10]) — noisy by construction here: `ARCHITECTURE.md`
  and five siblings are deliberately six months old, so it needs its own allowlist, and it would
  make the suite depend on git history being present in the test environment. Its entry stays open;
  §3's seams are what it will attach to.
- **Cross-doc value agreement** (BACKLOG [2026-08-15]) — highest value, highest false-positive risk:
  a value quoted inside a worked example or a superseded note is not a live claim, and
  `REVIEW-QUEUE.md` contains both. Its own task.
- **Spec-vs-code (`converge`) direction** (REVIEW-QUEUE G10 run 2 slot 3) — a different check
  entirely; the entry's false-positive warning applies to it doubly.
- Rewording the code-review skill's severity rubric — the complementary option raised in the PR #26
  review. Covers drift a linter structurally cannot see; unrelated to this build.
