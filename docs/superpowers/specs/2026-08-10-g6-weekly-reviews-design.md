# G6 — Weekly Reviews (First Run in This Project)

**Status:** Approved (design sign-off 2026-08-10)
**Date:** 2026-08-10
**Task:** WEEKLY G6 "Weekly Reviews [batch]" — ⚪ Overhead · 5 SP · scheduled Thu–Fri (running Mon 2026-08-10, +3 days spillover)
**Origin:** `docs/planning/WEEKLY.md` (week of 2026-08-03) G6 — the standing recurring batch, never before run in this repo
**Branch:** `chore/g6-weekly-reviews`

---

## 1. Scope & purpose

The **Weekly Reviews** batch is a recurring ⚪ Overhead group (quota-exempt, ~5 SP, scheduled late-week) that
surveys the external tooling ecosystem for things worth adopting into this project, and scans this project's
own output for learnings worth pushing outward. It runs in four slots:

| #   | Slot                         | SP  | Direction                            |
| --- | ---------------------------- | --- | ------------------------------------ |
| 1   | Plugins (×2 candidates)      | 2   | Inbound — external → here            |
| 2   | Claude best-practices        | 1   | Inbound — external → here            |
| 3   | Non-Claude AI best-practices | 1   | Inbound — external → here            |
| 4   | Cross-project propagation    | 1   | **Outbound** — here → other projects |

This is the **first run in this repository**. The batch has six-plus prior runs in sibling projects
(universal-config, `rating_bot`, social-stats), so the _method_ is established; what is new here is the
per-project instantiation: this repo's durable state file, its exclusion sets, its routing sinks, and its
relevance lens. That is why this run gets a spec at all — the standing playbook's own criterion is
"no spec/no plan by default; a short spec only when the run is **first** at something."

**This spec is the design record; it is not archived at close-out.** The run's real deliverables are the
verdict rows, the Next-up parks, and any 🟤 / Spawned entries they route to.

**Non-goals.** No code changes. No plugin is installed by this run — an `adopt` verdict files a BACKLOG entry
for later scheduling, nothing more. No `docs/prompts/` cadence doc is created (see §3). No launch-push work
is touched.

## 2. Ruled decisions

All six were settled in the 2026-08-10 brainstorm and are binding for this run.

| #   | Decision                   | Ruling                                                                                                                                                                                                                                                                                                                                                                  |
| --- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Relevance lens**         | **Launch-push relevance, high adopt bar.** Fit is judged against what helps ship the Mirox storefront now (Next.js 14 / TS / Prisma / Playwright / Vercel, solo dev, translation + visual work). Expect **0–1 adopts**; borderline-but-promising → `defer` + park with a re-trigger condition. Anything that only pays off post-launch defers by default.               |
| 2   | **Sibling review history** | **Prior evidence, not an exclusion list.** Skip a candidate only when its rejection reason elsewhere was _universal_ (Python-only tooling; Claude Code now ships it built-in). Re-evaluate any whose reason was _project-specific_ — this repo is a different shape. Record the prior in the row so the reasoning is auditable.                                         |
| 3   | **Slot 4 scan window**     | **This week + a bounded memory-file sweep.** Primary: PRs #28–#31, Monday's #27 close-out, this week's DONE entries, `.claude/` config diffs. Plus a cheap sweep of the durable learnings already captured as memory files since the 2026-07-14 resumption (enumerated from the memory index — no re-reading of PRs), so the first-run backlog is not silently skipped. |
| 4   | **Journal route**          | **Spec only.** This document, then direct execution. No `docs/planning/plans/` plan doc, nothing to archive.                                                                                                                                                                                                                                                            |
| 5   | **Candidate scoping lens** | **Project-local only.** Verdicts judge fit _here_. The universal-config repo's "three-scope lens" (here / global / other projects, where a `pass` can still route outward) is **deliberately deferred** — recorded under Conventions with a re-trigger condition so a later run adds it knowingly rather than by drift.                                                 |
| 6   | **Run sequence**           | **Skeleton first, append per slot.** Commit REVIEW-QUEUE.md's skeleton before any research, then run slots 1→4 sequentially, appending each verdict row immediately after its research and committing per slot.                                                                                                                                                         |

## 3. `docs/planning/REVIEW-QUEUE.md` — the durable state

This repo has no `docs/prompts/` directory (the sibling repos keep the cadence definition in
`docs/prompts/weekly-planning.md`). Rather than create one for a single consumer, **REVIEW-QUEUE.md's
"How this works" section is the methodology of record here**, matching the `rating_bot` instantiation.

```
# Review Queue

## How this works        ← cadence, the four slots, verdict vocabulary, routing sinks, the run recipe
## Conventions           ← standing rules + deliberate deferrals, each dated
## Reviewed log          ← the exclusion record; grows one block per run
   ### 1. Plugins                        (two rows per run, each tagged `source:`)
   ### 2. Claude best-practices
   ### 3. Non-Claude AI best-practices
   ### 4. Cross-project propagation
## Next-up               ← parked runners-up + defers, each with a re-trigger condition
```

Rows carry: date, run, candidate, `source:` (slot 1 only), a **verified primary-source URL**, the verdict,
one-to-three-sentence reasoning, and the routing target if any.

**Conventions seeded on this first run:**

1. **Every slot writes a Reviewed-log row regardless of verdict**, `pass` included — one row per candidate
   considered, so four-to-five rows is the floor (one per slot), not the cadence; run 1 wrote 9. Sibling runs
   twice nearly dropped `pass` rows by composing the log from memory after the research; skeleton-first
   ordering plus this rule is the fix.
2. **Derive the "already in use" exclusion set from live `enabledPlugins`**, never from a hardcoded list
   (a sibling first-run retro: the hardcoded set missed several enabled plugins).
3. **Verification gate** — every top pick must be confirmed against a fetched primary source with a real
   URL and date. Unverifiable ⇒ cannot be adopted. Where cheap, decide by _running_ the thing rather than
   reading about it; two sibling verdicts were settled that way and both were stronger for it.
4. **Respect a park's re-trigger condition.** A `defer` parks with a condition; do the cheap condition check
   and stop. Re-reading a condition-gated park's source cost two sibling runs real time for nothing.
5. **One 🟤 per `adopt` is a minimum, not a cap.** Incidental process findings surfaced during a run route
   🟤 by the source rule (Claude-surfaced), independent of any slot's verdict. What is forbidden is
   _manufacturing_ entries out of `pass` / `defer` verdicts.
6. **Sibling-project review history is prior evidence, not an exclusion list** (decision §2.2). Skip a
   candidate only when its rejection reason elsewhere was _universal_; re-evaluate any whose reason was
   _project-specific_, and record the prior in the row.
7. **Deferred: the three-scope lens** (decision §2.5). Re-trigger: a second active project starts consuming
   this repo's conventions, or a run produces a candidate with an obvious non-local fit and no sink for it.
8. **No parallel subagent fan-out for web research** (§4). Sequential in-session only — fan-out is a
   rate-limit hazard and gets OOM-killed in this devcontainer.
9. **Slot 4 must scan the memory files, not just the PRs**, because auto-memory is per-project by
   construction — and when testing whether something already propagated, grep the **specific strings** in the
   live `~/.claude` tree rather than diffing it.
10. **An "already present" claim requires reading the matched line, not the filename.** `grep -l` for a
    _concept_ proves only that some line matched some pattern; quote the matched line into the row.

> **Conventions 9 and 10 were not designed up front.** 9 was discovered by slot 4 during the run; 10 was
> added by the PR #32 review after slot 4's own first pass violated 9's corollary. See §10.

## 4. The four slots

Executed **sequentially in-session** with `WebSearch` / `WebFetch`. Parallel subagent fan-out for web
research is banned: it is a documented rate-limit hazard, and background fan-outs are OOM-killed in this
devcontainer.

### 4.1 Slot 1 — Plugins (2 SP, two independent candidates)

Two rows: the best not-yet-reviewed candidate from the **official Claude plugin store**, and the best from
the **wider internet**, each row tagged `source: official` / `source: internet`.

Exclusion set — **16 plugins in use**, derived live from all three settings files:

| Source file                   | Enabled                                                                                                                                            |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.claude/settings.json`       | playwright, superpowers, frontend-design, code-review, context7, feature-dev, ralph-loop, commit-commands, chrome-devtools-mcp, playground, vercel |
| `.claude/settings.local.json` | english-coach@goodalex223-claude-marketplace, auto-memory@severity1-marketplace, feature-dev, code-review                                          |
| `~/.claude/settings.json`     | context7, code-review, feature-dev, hookify, playwright, playground, superpowers, claude-code-setup, claude-md-management                          |

MCP servers already wired at repo level: `context7`, `github`, `memory`.

### 4.2 Slot 2 — Claude best-practices (1 SP)

Top not-yet-reviewed candidate via date-aware web search (current month: August 2026). Prefer practices that
translate into a **committed repo artifact or convention change** — a pure usage habit cannot produce an
`adopt` (there is nothing to file), which is a documented sibling finding.

### 4.3 Slot 3 — Non-Claude AI best-practices (1 SP)

Same, sourced from non-Claude models/tools (Cursor, Codex, Copilot, Gemini CLI, and similar).

**Known structural bias, recorded not fought:** this slot under-delivers for single-tool solo projects,
because it tends to surface _cross-tool portability_ practices that are unusable until a second tool enters.
It has produced only `pass`/`defer` across multiple sibling runs for exactly this reason. The correct
response is to record the observation in the row, not to manufacture an adopt to fill the slot. Note that
one sibling run nonetheless found a genuine adopt here by asking what the _other_ tools' equivalents reveal
about a native Claude Code feature that was going unused — that angle is in scope.

### 4.4 Slot 4 — Cross-project propagation (1 SP, no web research)

An internal scan. It asks: did anything that shipped **here** produce a learning that belongs **elsewhere**
(in `~/.claude` global config, or another project's config)?

Scan window per decision §2.3:

- PRs **#28** (G1 cart/drawer), **#29** (G2 checkout COD), **#30** (G3 params fix), **#31** (G4 peripheral
  surfaces), plus Monday's **#27** TASK-037 close-out — the week's real output.
- This week's `DONE.md` entries and `.claude/` config diffs.
- A bounded sweep of memory files written since the 2026-07-14 resumption, enumerated from the memory index.

Method that works, per the sibling playbook: grep the **specific changed strings** in live `~/.claude` to test
whether something already propagated — never diff the trees, which are scrubbed and drifted by design — and
check **both halves** of a multi-part edit, since a half-landed edit is itself a finding. Also worth asking of
any convention that landed in a planning doc: did the _template_ that seeds that doc in other projects get it
too?

## 5. Verdicts and routing sinks

| Slot | Vocabulary                       | Sinks                                                                                    |
| ---- | -------------------------------- | ---------------------------------------------------------------------------------------- |
| 1–3  | `adopt` \| `defer` \| `pass`     | `adopt` → 🟤 BACKLOG · `defer` → Next-up park + re-trigger condition · `pass` → row only |
| 4    | `propagate` \| `defer` \| `pass` | `propagate` → `TODO.md` Spawned row · `defer` → Next-up park · `pass` → row only         |

- **🟤 BACKLOG entries** go under a new group `### [2026-08-10] From: G6 Weekly Reviews (first run)`, using this
  repo's existing inline-marker format.
- **Propagation rows** go into a new `### Cross-project propagation (out-of-tree)` subsection under TODO.md's
  existing `## 🔀 Spawned`, kept separate from TASK-055/056 because those are in-tree tasks. Status is
  **user-maintained** — this repo cannot verify that out-of-tree work completed.
- The sink asymmetry (inbound → BACKLOG, scheduled _here_; outbound → Spawned, landing _elsewhere_) is
  intentional. Do not homogenize them.

## 6. Execution sequence

1. Commit the REVIEW-QUEUE.md skeleton — all sections, all four Reviewed-log headers, How-this-works and
   Conventions filled, Next-up empty. Nothing researched yet.
2. Slot 1a (official store) → verify → append row → commit.
3. Slot 1b (wider internet) → verify → append row → commit.
4. Slot 2 → verify → append row → commit.
5. Slot 3 → verify → append row → commit.
6. Slot 4 (internal scan) → append row → commit.
7. Route every verdict to its sink (§5); park runners-up and defers under Next-up.
8. **Re-check pass** — re-read every count and attribution against the artifact it describes, per
   `REVIEW-QUEUE.md` § How this works → _Step 5 in full_. This step exists because run 1's review found that
   three of its four real findings shared this one root cause, and because stating Conventions 9 and 10 did
   not by itself prevent the run from violating them.
9. Documentation & close-out (§7).

## 7. Documentation & completion

**Two stale facts in WEEKLY.md are corrected as part of this run**, both artifacts of the plan having been
written Tue 2026-08-04 (`a4dab21`, 02:16), when the week's only merge so far was Monday's PR #27 (`cec8408`,
Aug 3 15:28 — TASK-037's spillover close-out):

1. G6's slot-4 line says "merged PRs #24–#27" — the four then-most-recent PRs, of which only #27 belongs to
   this week; the other three are the _previous_ week's. Corrected to #28–#31 (plus that #27 close-out), with
   a brief parenthetical recording why the original range was written that way. This is a live doc, so it is
   corrected, not annotated as superseded.
2. The **Sources** line says REVIEW-QUEUE.md "does not exist yet — created this week by G6". True when
   written; false once step 1 lands. Updated at close-out.

**Schedule honesty.** G6 is scheduled Thu–Fri of the Aug 3–7 week; it runs **Mon 2026-08-10, +3 days**, the
same queue-spillover pattern as G2 (+1), G3 (+2) and G4 (+2). It displaced nothing — G6 is quota-exempt
overhead, and G5 and G7 remain open independently of it. The close-out records the real date.

**Close-out checklist:**

- Tick G6's four WEEKLY checkboxes; Summary-Table Status → `✅ PR #N` (the number, never a bare ✅); update
  the Thursday and Friday Daily-Schedule entries with the real run date.
- Add `planning/REVIEW-QUEUE.md` and this spec to `docs/README.md`'s index, with dates.
- Verify `docs/README.md` index rows ↔ doc headers **in both directions plus neighbouring rows** — the
  standing manual mitigation until the docs-freshness linter lands.
- `DONE.md` entry; 🟤 extractions per §5.
- Capture durable learnings from the run as memory files.

## 8. Known priors (sourcing input, not pre-decided verdicts)

Carried from sibling runs per decision §2.2. These inform where to look; every one still needs its own
verification and its own verdict in this project's context.

| Candidate           | Prior verdict elsewhere | Reason class               | Bearing here                                                                                                                                                          |
| ------------------- | ----------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `code-simplifier`   | pass                    | **Universal**              | Claude Code ships a built-in `/simplify`. Skip.                                                                                                                       |
| `pyright-lsp`       | adopt (Python repos)    | **Universal-inapplicable** | This is a TypeScript repo. A TS-analogue candidate would be its own, separate evaluation.                                                                             |
| `security-guidance` | pass                    | **Project-specific**       | Passed elsewhere for "no app-code web surface". This repo _is_ a Next.js app with auth, API routes and payment code — genuinely re-evaluable.                         |
| `dead-rules-audit`  | pass, routed outward    | **Project-specific**       | Failed elsewhere on a measurement (that repo's prose CLAUDE.md parses into ~5 fragmentary rules); the same measurement routed it _toward_ app projects like this one. |
| `spec-kit`          | defer                   | **Project-specific**       | In-house superpowers SDD flow covers it; likely the same conclusion here, but the park's condition should be checked rather than assumed.                             |
| `claude-mem`        | pass                    | **Mixed**                  | Settled memory strategy + public-repo PII hazard. Both conditions want re-checking against this repo.                                                                 |

## 9. Risks

| Risk                                                                  | Mitigation                                                                                                                |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Hallucinated plugins / dead links entering the log as real candidates | Verification gate (§3, Convention 3) — fetched primary source with URL and date, or it cannot be adopted                  |
| Scope creep into launch-push work                                     | High adopt bar + launch-push lens (§2.1); an `adopt` files a BACKLOG entry, it does not schedule work                     |
| Slot 3 under-delivering                                               | Expected and documented (§4.3) — record the observation, do not manufacture an adopt                                      |
| Web-research rate limits / devcontainer OOM                           | Sequential in-session research only; no parallel subagent fan-out (§4)                                                    |
| A `pass` row silently going unwritten                                 | Skeleton-first sequencing (§2.6) + Convention 1; the empty row is visible before research begins                          |
| 🟤 pool growth pulling the Cleanup-Week trigger harder                | Defer-leaning bar; the Cleanup Week is already due and deferred by user steer, so this is a recorded cost, not a surprise |

**A risk this table missed**, added post-review: _an "already covered" claim resting on an unread grep match_
— the failure that produced the run's one wrong verdict (§10). Mitigation is now Convention 10.

## 10. Post-review corrections (PR #32, 2026-08-10)

This spec is **live**, not frozen, so review findings are corrected here rather than annotated as
superseded.

**Round 1 — the two posted findings:**

1. **The Conventions list above was stale on arrival.** It shipped with 6 items while `REVIEW-QUEUE.md`
   shipped 9, and the numbering had drifted — spec item 6 was queue item 7, and queue items 6, 8 and 9
   appeared nowhere here. Conventions 6 and 8 were derivable from this spec's own prose at writing time
   (decision §2.2 and §4's fan-out ban) and simply never made the list; convention 9 was discovered during
   slot 4 and never propagated back. The list is now synced at 10, matching the file.

2. **Slot 4 shipped one wrong verdict.** The bidirectional docs-index check was recorded `pass` on the claim
   that `POLICIES/code-review.md` "already" carried the rule. It does not: the claim came from a `grep -l`
   for the _concept_ (`bidirection\|both directions`) that matched `- [ ] Migration tested both directions`,
   a database-migration checklist item. Re-verified as absent; the verdict is now `propagate` and the row is
   filed. The sibling `pass` in the same block (the `✅ PR #N` close-out rule) was re-checked and **holds** —
   it was a literal-string grep and all three hits are the rule verbatim, so the defect was confined to the
   one concept-grep.

The second finding is the more interesting one: the run wrote Convention 9's corollary — grep specific
strings, don't diff trees — and then violated it in the same slot. The corollary was right; the run did not
follow it. Convention 10 makes the unread-match failure explicit rather than leaving it implied.

**Round 2 — sub-threshold findings from the same review, each checked before fixing:**

3. **Convention 1's cadence was contradicted by the run that seeded it.** It read "four-to-five rows per
   run" while run 1's Reviewed log carries **9** rows — slot 4's first-run memory sweep alone wrote 5.
   Reworded in both this spec and `REVIEW-QUEUE.md`: four-to-five is the _floor_ (one row per slot), not
   the cadence, and the unit is one row per candidate considered.

4. **The visual-fidelity gate's Origin cell misattributed the gate.** It read "TASK-057 / TASK-036 /
   TASK-037 / G1 / G4 (PRs #24–#31)" — tasks that _reinforced_ the gate, under a PR range that both
   predates its actual origin (TASK-035 shipped a homepage that passed every automated gate and still
   looked broken; PR #23 made the sign-off standing) and overruns this slot's own corrected #28–#31 plus
   #27 scan window. Corrected in `REVIEW-QUEUE.md` and in the `TODO.md` Spawned row carrying the same
   lineage.

Both round-2 items are finding 1's shape again — a figure or an attribution written once and never
re-checked against the artifact it describes. That is now three of four findings in this review with a
single root cause, which is the argument for making the count/attribution re-check a step of the run
recipe rather than a thing each run remembers.

**Round 3 — the re-raised framing, and the through-line acted on:**

5. **"Before the week had shipped anything" was itself a claim written once and never checked.** The
   correction rationale in §7, `WEEKLY.md` and `DONE.md` all justified the stale PR range by saying the plan
   predated the week's first merge. It did not: PR #27 merged **Mon 2026-08-03 15:28** (`cec8408`), and the
   plan was committed **Tue 2026-08-04 02:16** (`a4dab21`). The corrected range was right all along — its own
   "plus Monday's #27" clause conceded the point — but the reason given for the error was wrong. All three
   instances now state the real chronology; the review cited two, and the third here was found by sweeping
   for the phrase rather than fixing only what was quoted.

6. **The re-check is now step 5 of the run recipe**, not merely Conventions 9 and 10. The review's closing
   argument is the load-bearing one: a convention a run can state and then violate one slot later is not yet
   a control. `REVIEW-QUEUE.md` § How this works now carries _Step 5 in full_ — a five-item assertion list
   (counts match source, tallies agree across files, "already covered" claims quote the matched line,
   attributions fall inside their declared window, cadence descriptions match the run that happened) — and
   §6 of this spec references it as an execution step. The conventions state the rules; the recipe step is
   what makes a run perform them.

Also re-surfaced, not duplicated: `docs/README.md`'s Archived Plans table ends at TASK-037 (line 96) while
four G-group plans sit unindexed in `docs/archive/plans/`. That is the same drift class Spawned row 3
propagates outward, and it was already filed as a 🟤 at G4 completion — so the Spawned row now cites it as a
live worked example and the 🟤 gained a back-reference, rather than a second entry being created for one
defect.

---

## 11. Run 2 (2026-08-15, WEEKLY G10) — what the design produced on its second execution

This spec is the **frozen first-run design**; the live methodology is
[`REVIEW-QUEUE.md`](../../planning/REVIEW-QUEUE.md). Recorded here only where run 2 changed something
this document asserts:

- **Convention 1's cadence evidence was refreshed.** It cited only run 1's 9 rows; run 2 wrote **14**
  (3 / 1 / 2 / 8 by slot). The conventions list itself is **unchanged at 10 items** and still aligns 1:1
  with §"Conventions seeded on this first run" above — no convention was added, so nothing propagates back
  beyond this note. The refresh was produced by step 5's own cadence assertion, which is the check §10 item 6
  introduced.
- **The step-5 re-check earned its place.** It caught the stale cadence figure above, and it cleared two
  candidate mismatches as false positives before anything was "fixed": a naive convention count read 17 in
  this file (two unrelated numbered lists — §6's execution sequence and §10's corrections) and an extraction
  slicing from the file-layout code block read 0. Both were tooling artefacts, not drift. That is the
  `docs-readme-index-audit-false-positives` lesson holding on its first contact with this spec.
- **Convention 7's re-trigger partially fired** — slot 2 produced a candidate whose sharpest target is the
  _global_ `~/.claude` tree, for which this repo has no sink. Recorded in `REVIEW-QUEUE.md` § Next-up, not
  acted on: one occurrence is not the pattern the convention asks for.
