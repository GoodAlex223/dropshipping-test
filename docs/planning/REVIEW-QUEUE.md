# Review Queue

Durable cross-week state for the **Weekly Reviews** batch (⚪ Overhead, quota-exempt, ~5 SP, scheduled late-week).

**Last Updated**: 2026-08-15
**First run**: 2026-08-10 (WEEKLY G6, week of 2026-08-03) · design: [2026-08-10-g6-weekly-reviews-design.md](../superpowers/specs/2026-08-10-g6-weekly-reviews-design.md)
**Latest run**: 2026-08-15 (WEEKLY G10, week of 2026-08-10) — run 2, executing the recipe below; no new methodology.

---

## How this works

This file **is** the methodology of record for the batch in this repository — there is no `docs/prompts/`
cadence doc here. It is also the **exclusion record**: the Reviewed log is what prevents re-reviewing the
same candidate week after week.

### The four slots

| #   | Slot                         | SP  | Direction    | What it does                                                                                                                        |
| --- | ---------------------------- | --- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Plugins (×2 candidates)      | 2   | Inbound      | Best not-yet-reviewed from the **official** Claude plugin store **and** best from the **wider internet**, each row tagged `source:` |
| 2   | Claude best-practices        | 1   | Inbound      | Top not-yet-reviewed candidate via date-aware web search                                                                            |
| 3   | Non-Claude AI best-practices | 1   | Inbound      | Same, sourced from non-Claude models/tools (Cursor, Codex, Copilot, Gemini CLI, …)                                                  |
| 4   | Cross-project propagation    | 1   | **Outbound** | **No web research.** Scans what shipped _here_ and decides what belongs _elsewhere_                                                 |

### Verdicts and routing sinks

| Slot | Vocabulary                       | Sinks                                                                                                                         |
| ---- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 1–3  | `adopt` \| `defer` \| `pass`     | `adopt` → 🟤 BACKLOG entry · `defer` → Next-up park + re-trigger condition · `pass` → row only                                |
| 4    | `propagate` \| `defer` \| `pass` | `propagate` → `TODO.md` § 🔀 Spawned → _Cross-project propagation (out-of-tree)_ · `defer` → Next-up park · `pass` → row only |

The sink asymmetry is intentional: inbound `adopt` schedules work **here**, outbound `propagate` lands work
**elsewhere** (status user-maintained — this repo cannot verify out-of-tree completion). Do not homogenize them.

### The run recipe

1. Reconcile the batch's scope against its current definition in WEEKLY before starting.
2. Commit this file's skeleton for the run — the empty rows — **before** any research.
3. Run slots 1 → 4 **sequentially, in-session** (`WebSearch` / `WebFetch`). Append each row immediately after
   its research; commit per slot.
4. Route every verdict to its sink; park runners-up and defers under Next-up with re-trigger conditions.
5. **Re-check every count and attribution against the artifact it describes** — see below. Not optional, and
   not satisfied by having written the conventions down.
6. Close out: tick the WEEKLY checkboxes, flip its Summary-Table Status to `✅ PR #N`, update `docs/README.md`.

#### Step 5 in full — the re-check pass

Run 1 shipped four real review findings and **three shared one root cause**: a count or an attribution written
once and never re-read against the thing it describes. Conventions 9 and 10 state the rules; this step is what
makes them a control, because run 1 stated Convention 9's corollary and violated it one slot later. **A
convention a run can state and then not follow is not yet a control.**

Before close-out, assert each of these by re-reading the artifact — not from memory, and not from the note you
wrote when you first made the claim:

- [ ] **Counts match their source.** Every "N conventions", "N rows", "N adopts" claim equals what the file
      actually contains. The spec's conventions list and this file's must align 1:1, item for item — a
      convention added late must propagate back to the live spec.
- [ ] **Verdict tallies agree across all files** that state them (`REVIEW-QUEUE.md`, `WEEKLY.md`, `DONE.md`).
      Flipping one verdict invalidates every tally downstream of it.
- [ ] **Every "already present / already covered" claim quotes the matched line** (Convention 10). A `grep -l`
      hit is not evidence; read the line and paste it into the row.
- [ ] **Every `Origin` / attribution cell names things inside the window it claims** — the dates, PR numbers
      and task IDs must actually fall within the scan window recorded for that slot.
- [ ] **Cadence and "typical" descriptions match the run that just happened**, not the run that was imagined
      when the sentence was drafted.

### Standing lens

**Launch-push relevance, high adopt bar** (set 2026-08-10). Fit is judged against what helps ship the Mirox
storefront now — Next.js 14 / TypeScript / Prisma / Playwright / Vercel, solo developer, translation and
visual work. Expect **0–1 adopts** per run; borderline-but-promising → `defer` + park, not adopt. Anything
that only pays off post-launch defers by default. Re-scope this lens once the storefront has launched.

---

## Conventions

1. **Every slot writes a Reviewed-log row regardless of verdict**, `pass` included — one row per candidate
   considered, so four-to-five rows is the floor (one per slot), not the cadence: run 1 wrote **9**, of which
   slot 4's first-run memory sweep alone was 5.
   _(2026-08-10; sibling runs twice nearly dropped `pass` rows by composing the log from memory after the
   research. Cadence corrected on the PR #32 review — the original text read "four-to-five rows per run", a
   figure the very run that seeded it contradicted.)_
2. **Derive the "already in use" exclusion set from live `enabledPlugins`**, never from a hardcoded list —
   all three settings files: `.claude/settings.json`, `.claude/settings.local.json`, `~/.claude/settings.json`.
   _(2026-08-10; a sibling first-run retro found its hardcoded set had missed several enabled plugins.)_
3. **Verification gate** — every top pick must be confirmed against a **fetched primary source** with a real URL
   and date. Unverifiable ⇒ cannot be adopted. Where cheap, decide by _running_ the thing rather than reading
   about it. _(2026-08-10.)_
4. **Respect a park's re-trigger condition.** Do the cheap condition check and stop; do not re-read a
   condition-gated park's source. _(2026-08-10; that cost two sibling runs real time for nothing.)_
5. **One 🟤 per `adopt` is a minimum, not a cap.** Incidental process findings surfaced during a run route 🟤 by
   the source rule (Claude-surfaced), independent of any slot's verdict. What is forbidden is _manufacturing_
   entries out of `pass` / `defer` verdicts. _(2026-08-10.)_
6. **Sibling-project review history is prior evidence, not an exclusion list.** Skip a candidate only when its
   rejection reason elsewhere was _universal_ (Python-only tooling; Claude Code ships it built-in); re-evaluate
   any whose reason was _project-specific_. Record the prior in the row. _(2026-08-10.)_
7. **Deferred: the three-scope lens.** The universal-config repo weighs each inbound candidate for fit _here_,
   _globally_ (`~/.claude`), and _for other active projects_, letting a `pass` still route outward. Not carried
   here. **Re-trigger**: a second active project starts consuming this repo's conventions, or a run produces a
   candidate with an obvious non-local fit and no sink for it. _(2026-08-10.)_
8. **No parallel subagent fan-out for web research.** Sequential in-session only — fan-out is a rate-limit
   hazard and gets OOM-killed in this devcontainer. _(2026-08-10.)_
9. **Slot 4 must scan the memory files, not just the PRs.** Auto-memory lives in
   `~/.claude/projects/<project>/memory/` and is **per-project by construction** — a durable process rule
   captured only there reaches no other project by any route. That is precisely where both of run 1's
   `propagate` verdicts were found, while the conventions that had reached a doc or template turned out to
   have already gone global. Corollary for testing an existing propagation: grep the **specific changed
   strings** in the live `~/.claude` tree, excluding `projects/` (per-project memory) and `plugins/`
   (third-party caches) — never diff the trees, which are scrubbed and drifted by design. _(2026-08-10.)_
10. **An "already present" claim requires reading the matched line, not the filename.** `grep -l` for a
    _concept_ proves only that some line matched some pattern. Run 1 shipped a wrong `pass` this way: a
    concept-grep for `bidirection\|both directions` matched `- [ ] Migration tested both directions` — a
    database-migration item — and the verdict asserted a docs-index rule was already global. Quote the
    matched line into the row, or the "already covered" half of a `pass` is unverified.
    _(2026-08-10, from the PR #32 review; this is the failure mode Convention 9's corollary exists to
    prevent, so the corollary was right and the run did not follow it.)_

---

## Reviewed log

### 1. Plugins

| Date       | Run     | Candidate                                                                                                                                   | `source:`            | Primary source                                                                                                                                                                                                                                                                                                  | Verdict   | Reasoning                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Routed to                                                                 |
| ---------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 2026-08-10 | 1 (G6)  | `resend` — Resend agent skills + MCP                                                                                                        | official             | [resend/resend-skills](https://github.com/resend/resend-skills) @ `7fa08a1`, MIT; manifest fetched 2026-08-10                                                                                                                                                                                                   | **defer** | Maps to the immediate next group (G5 transactional emails), but its weight sits in `react-email` — a rewrite of the hand-rolled HTML-string templates, outside G5's copy/styling scope — and a hosted MCP needing OAuth. Read the actual `email-best-practices` SKILL.md rather than the blurb: it reduces to double opt-in (already implemented here) plus DNS authentication, whose provisioning half is already covered by the [2026-08-07] 🔵 "Verify prod email config" entry.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Next-up park; 1 incidental 🟤 (`lang` attribute)                          |
| 2026-08-10 | 1 (G6)  | `nextjs-marketplace` — Next.js 14+ App Router plugin set (10 plugins incl. "i18n & Localization Pro")                                       | internet             | [rdimascio/nextjs-marketplace](https://github.com/rdimascio/nextjs-marketplace), fetched 2026-08-10                                                                                                                                                                                                             | **pass**  | Nominally an exact fit (Next.js 14 App Router, and i18n is the likely next-week spine), but it fails the provenance bar: **1 star**, single maintainer, and installation is `cp -r plugins/* .claude/plugins/` rather than a marketplace add. Surveyed alternatives fail differently — `claude-mem` duplicates the installed `auto-memory`, `frontend-design`/`playwright`/a11y tooling are already installed, and the i18n "skills" on aggregator sites have no traceable source repo (mcpmarket.com also returned HTTP 429, so it could not be verified at all). Unverifiable ⇒ not adoptable (Convention 3).                                                                                                                                                                                                                                                                                                                                                                          | 1 incidental 🟤 (next-intl `useExtracted`)                                |
| 2026-08-15 | 2 (G10) | **`claude-security`** — in-session deep vulnerability scan (7 agents: inventory → researcher → verifier → patch-generator → patch-verifier) | official             | Local marketplace clone `anthropics/claude-plugins-official`, refreshed 2026-08-15T13:43Z; `plugin.json` **v0.10.0**, author Anthropic; [homepage](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/claude-security). README + agent/hook/skill tree read directly, not the store blurb. | **adopt** | The park run 1 opened ("pre-launch security pass is scheduled, or real customer traffic is imminent") is **fired**: the pre-launch week is user-confirmed for **Aug 17–21 — this Monday** — and already inherits the G2 hardening bundle pinned to "before real customer traffic". Decided by reading the plugin, not the blurb: findings reach the report only after independent verifiers try to _disprove_ them, and the verification tally is computed in code rather than asserted by the model that produced the findings — which is the exact failure mode this repo has hit 18 times as [code-review-threshold-understates-doc-findings]. Preconditions **measured, not assumed**: Python **3.11.2** ≥ the required 3.9 ✅, git checkout ✅, not in the 16-plugin in-use set ✅. Scope fits the surface that actually ships: auth, API routes, order creation, admin panel, HMAC unsubscribe tokens, guest COD checkout. On-demand — no per-turn cost, unlike its sibling below. | 🟤 BACKLOG [2026-08-15] (the adopt) — run the scan in the pre-launch week |
| 2026-08-15 | 2 (G10) | `security-guidance` — always-on hooks: regex warnings on Edit/Write, LLM diff review on Stop, agentic commit reviewer                       | official (runner-up) | Same clone; `plugin.json` **v2.0.7**, author Anthropic (David Dworken); README read in full.                                                                                                                                                                                                                    | **defer** | Same fired park, and genuinely good — but the wrong shape for this week. Its value is a **per-turn tax**: an LLM call (`SECURITY_REVIEW_MODEL=claude-opus-4-7` by default) on every Stop plus an agentic reviewer on every commit, against a week already deliberately overloaded at 2× capacity. It secures code _as it is written_, so its payoff is spread across future development; `claude-security` concentrates its payoff at the launch gate, which is the decision this week actually faces. Now **reviewed** rather than parked-unreviewed — the run 1 park is closed and replaced with a narrower condition.                                                                                                                                                                                                                                                                                                                                                                 | Next-up park (re-trigger rewritten)                                       |
| 2026-08-15 | 2 (G10) | `logic-lens` — logic-first review via explicit execution tracing (Premises → Trace → Divergence → Remedy), 6 skills, 9 risk categories      | internet             | [hyhmrright/logic-lens](https://github.com/hyhmrright/logic-lens), fetched 2026-08-15: **19 stars**, MIT, v0.6.10, installs as a real marketplace add (`/plugin marketplace add hyhmrright/logic-lens`)                                                                                                         | **defer** | Clears the provenance bar run 1's `nextjs-marketplace` failed on — MIT licence and a genuine marketplace add rather than `cp -r plugins/*` — and it aims squarely at this repo's best-documented review weakness: a reviewer that reports only findings carrying a traced divergence chain is the complement to the ≥80 threshold that has suppressed real findings 18 times here. Held back by two things, so borderline-but-promising → `defer` per the standing lens, not adopt: **19 stars / single apparent maintainer**, and its 78.3% benchmark is **self-published**, not independent. Adopting a _second_ reviewer mid-launch-push also adds review rounds exactly when the week has none to spare.                                                                                                                                                                                                                                                                             | Next-up park                                                              |

### 2. Claude best-practices

| Date       | Run     | Candidate                                                                                            | Primary source                                                                               | Verdict   | Reasoning                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Routed to                           |
| ---------- | ------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| 2026-08-10 | 1 (G6)  | **Shrink CLAUDE.md: `/doctor` trim check + path-scoped `.claude/rules/*.md`** (`paths:` frontmatter) | [code.claude.com/docs/en/memory](https://code.claude.com/docs/en/memory), fetched 2026-08-10 | **adopt** | Decided on measurement, not on the write-up. This repo's `CLAUDE.md` is **350 lines** against a first-party "target under 200 lines… longer files reduce adherence", and **232 of those 350 (66%)** sit in Architecture / Detected Patterns / Git Insights — precisely the derivable content `/doctor`'s trim check is documented to cut. `.claude/rules/` does not exist here yet. Both preconditions verified against the installed **CC 2.1.226**: the invalid-`[`-pattern bug (Read failing for every evaluated file) was fixed in 2.1.207, and the brace-expansion startup crash in 2.1.217. Translates into a committed repo artifact, so it can actually be filed. | 🟤 BACKLOG [2026-08-10] (the adopt) |
| 2026-08-15 | 2 (G10) | _pending research_                                                                                   | _pending_                                                                                    | _pending_ | _pending_                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | _pending_                           |

### 3. Non-Claude AI best-practices

| Date       | Run     | Candidate                                                                                                                                                  | Primary source                                                                                                                                        | Verdict   | Reasoning                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Routed to                                  |
| ---------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| 2026-08-10 | 1 (G6)  | Cross-tool agent practices — shared-context instruction files (`AGENTS.md` / `CODEX.md` / `.cursorrules`), multi-agent MCP memory, usage-budget monitoring | Survey of 2026 comparison write-ups (Cursor / Copilot coding agent / Codex / Antigravity); all aggregator-tier, no first-party source cleared the bar | **pass**  | Every substantive practice is already satisfied, already consumed, or structurally inapplicable. Per-project instruction files: `CLAUDE.md` exists. Shared MCP memory across agents: the `memory` MCP server is already enabled here. Rules-file scoping (Cursor `globs` / Copilot `applyTo`): this is exactly what slot 2 adopted natively as `.claude/rules` `paths:` — recording it here too would double-file one finding. `AGENTS.md` and multi-agent shared context are gated on a **second agentic tool**, which a solo single-tool project does not have; that park's condition is unmet, so it got the cheap check and no re-read (Convention 4). | Next-up (category-bias watch only)         |
| 2026-08-15 | 2 (G10) | _pending research_                                                                                                                                         | _pending_                                                                                                                                             | _pending_ | _pending_                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | _pending_ (bias-watch counter: run 2 of 2) |

### 4. Cross-project propagation

| Date       | Run     | Learning scanned                                                 | Origin                                                                          | Verdict       | Reasoning                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Routed to                                      |
| ---------- | ------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| 2026-08-10 | 1 (G6)  | **Visual-fidelity gate for design tasks**                        | TASK-035 → PR #23 (origin); reinforced TASK-057 / TASK-036 / TASK-037 / G1 / G4 | **propagate** | Verified absent from the whole global tree (`CLAUDE.md`, `WORKFLOW.md`, `POLICIES/*`, `TEMPLATES/*`) — grepped for screenshot / rendered-page / design-handoff concepts, hits only in plugin caches and per-project memory. Applies to any project with a UI; caught real defects in four-plus tasks here. Natural home: `POLICIES/manual-testing.md`. **Origin corrected on the PR #32 review** — the cell first read "PRs #24–#31", which both misdates the gate (TASK-035 shipped the failure; PR #23 made the sign-off standing) and overruns this slot's own #28–#31 + #27 scan window.                                                                                                               | `TODO.md` § 🔀 Spawned → Cross-project (row 1) |
| 2026-08-10 | 1 (G6)  | **"Never write execution records ahead of execution"**           | G4 self-review (PR #31)                                                         | **propagate** | Verified absent globally. Failure mode is universal, not project-shaped: a plan drafted with pre-checked boxes and invented SHAs / PR numbers before the work happened. One-line addition to `POLICIES/documentation.md`, pairing with the existing read-SHAs-from-`git rev-parse` rule.                                                                                                                                                                                                                                                                                                                                                                                                                   | `TODO.md` § 🔀 Spawned → Cross-project (row 2) |
| 2026-08-10 | 1 (G6)  | **String renames must sweep every locator type**                 | G4 / PR #31 CI failure                                                          | **defer**     | Genuine and evidence-backed (a renamed UI string broke `getByPlaceholder` in CI after three sound-but-partial sweeps), but narrower than the two above — it is Playwright-locator-shaped, and no second project here runs E2E specs today. Parked rather than filed.                                                                                                                                                                                                                                                                                                                                                                                                                                       | Next-up park                                   |
| 2026-08-10 | 1 (G6)  | **WEEKLY close-out convention (`✅ PR #N`, never a bare ✅)**    | G1–G4 close-outs                                                                | **pass**      | Already global — present in `~/.claude/CLAUDE.md`, `WORKFLOW.md` **and** `TEMPLATES/docs_template/planning/WEEKLY.md`. Both halves landed; two-trees holds. Checked rather than assumed, per the standing method.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | —                                              |
| 2026-08-10 | 1 (G6)  | **Bidirectional docs-index check (rows ↔ headers + neighbours)** | G3 / G4 docs-freshness recurrences                                              | **propagate** | **Corrected from `pass` on PR #32 review.** The original verdict claimed the rule was "already present in `POLICIES/code-review.md`" — it is not. That claim came from a `grep -l` for the _concept_ (`bidirection\|both directions`), which matched line 279, `- [ ] Migration tested both directions`: a **database-migration** checklist item. The file's only docs line is a generic `- [ ] README updated if needed`, which is not this rule. Verified absent globally on re-check. It earns propagation on evidence — the drift class it prevents has been caught by human review on PRs #16, #17, #19, #21, #23 and #26 — and by Convention 9, since it currently lives only in per-project memory. | `TODO.md` § 🔀 Spawned → Cross-project (row 3) |
| 2026-08-15 | 2 (G10) | _pending scan_                                                   | _pending_                                                                       | _pending_     | _pending_                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | _pending_                                      |

**Run 2 scan window (declared before scanning, 2026-08-15)**: everything shipped here since run 1's
merge `8298dab` — **PRs #33, #34, #35, #36, #37, #38** and their close-outs, plus every auto-memory
file created or materially updated **2026-08-11 → 2026-08-15**. This is wider than the window WEEKLY
named when the plan was written on 2026-08-11 ("PR #33 close-out, the PR #34 hotfix arc, the G7
deferral, new memory files") — PRs #35–#38 had not shipped yet. The slot's own definition ("shipped
since run 1") governs; widened by user ruling at the G10 brainstorm. **Candidate rule**: a candidate
is a _durable process rule that could apply outside this repo_. Stack-specific technical facts are
scanned too, but recorded as one grouped row rather than one row each — Convention 1 requires a row
per candidate considered, not per file read.

---

## Next-up

Parked runners-up and `defer` verdicts. Each entry carries a **re-trigger condition** — check the condition
cheaply, and if it is unmet, move on without re-reading the source (Convention 4).

### From run 1 (2026-08-10, G6)

- **`resend` — Resend agent skills + MCP** (slot 1, official) — `defer`.
  **Re-trigger**: email work goes beyond copy/styling — i.e. a `react-email` migration of the
  hand-rolled HTML-string templates is scoped, **or** the real sending domain is provisioned
  (TASK-056 client round-trip) and deliverability/DNS-authentication work becomes actionable.
  Until then the cheap check is the existing [2026-08-07] 🔵 "Verify prod email config" entry —
  do not re-read the skill source (Convention 4).
- **`typescript-lsp`** (slot 1 runner-up, official) — parked unreviewed.
  **Measured**: the `typescript-language-server` binary is **not installed** in this container
  (only `tsserver`, which is the compiler's server, not the LSP wrapper), so adopting it costs a
  global npm install. It is the TypeScript analogue of the `pyright-lsp` adopt in the sibling
  Python repos. **Re-trigger**: type-navigation or rename friction shows up in practice, or the
  binary lands in the toolchain for another reason.
- ~~**`claude-security` / `security-guidance`** (slot 1 runners-up, official) — parked unreviewed.
  Both are first-party. Noted here because this repo, unlike the sibling that passed
  `security-guidance` for having no app-code web surface, **is** a Next.js app with auth, API
  routes and order-creation code. **Re-trigger**: the pre-launch security pass is scheduled, or
  real customer traffic is imminent (which is also the pin on the standing G2 hardening bundle).~~
  **CONDITION FIRED 2026-08-15 (run 2)** — the pre-launch week is user-confirmed for Aug 17–21.
  Both were reviewed rather than re-parked wholesale: `claude-security` → **adopt**,
  `security-guidance` → **defer** under a narrower condition (see run 2 below). This park is closed.
- **Slot 3 category-bias watch** (slot 3, process) — not a candidate; a counter.
  Slot 3 passed on run 1 for the documented structural reason: a **single-tool, solo, no-runtime-LLM**
  project cannot adopt cross-tool portability practices. Sibling projects hit the same wall
  repeatedly and eventually filed a reframe request. One local data point is not a pattern, so
  nothing is filed yet. **Re-trigger**: if slot 3 passes for this same reason in **two more runs
  here** (i.e. runs 2 and 3), file a 🟤 to re-scope the category — or pause it and redistribute its
  1 SP — rather than keep spending the slot to reach a foregone conclusion.
- **`AGENTS.md` / cross-tool shared-context instruction files** (slot 3) — parked, condition unmet.
  **Re-trigger**: a second agentic tool (Codex, Cursor, Copilot coding agent) actually enters this
  project's workflow. Until then the cheap check is "is there a second tool?" — do not re-read the
  sources (Convention 4). Note the mechanism if it ever triggers: Claude Code reads `CLAUDE.md`, not
  `AGENTS.md`, and bridges via an `@AGENTS.md` import or a symlink.
- **"String renames must sweep every locator type"** (slot 4) — `defer`, not filed outward.
  Evidence-backed here (a renamed UI string broke `getByPlaceholder` in CI after three
  sound-but-partial sweeps, PR #31), but Playwright-locator-shaped and narrower than the two rows
  that did propagate. **Re-trigger**: a second project with an E2E suite enters the picture, or
  `~/.claude/POLICIES/testing.md` is being edited anyway — fold it in then rather than as its own
  errand.

#### Run 1 park re-checks performed on 2026-08-15 (run 2, Convention 4 — cheap checks only)

| Park                                    | Condition                                                        | Cheap check run                                                                                                                             | Outcome                                    |
| --------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `resend`                                | `react-email` migration scoped **or** sending domain provisioned | `grep -c react-email package.json` → **0**; TASK-056 still ⏸️ deferred, prod sender still the interim `onboarding@resend.dev`               | **unmet** — re-parked, source not re-read  |
| `typescript-lsp`                        | Type-nav/rename friction, or the binary lands anyway             | `command -v typescript-language-server` → **NOT INSTALLED** (unchanged since run 1); no rename friction raised in G9/G14, both string-heavy | **unmet** — re-parked, source not re-read  |
| `claude-security` / `security-guidance` | Pre-launch security pass scheduled, or traffic imminent          | Pre-launch week user-confirmed **Aug 17–21**                                                                                                | **FIRED** — both reviewed this run         |
| `AGENTS.md` / cross-tool                | A second agentic tool enters the workflow                        | `find` for `AGENTS.md` / `.cursorrules` / `CODEX.md` → **none in tree**                                                                     | **unmet** — re-parked, sources not re-read |
| Slot 3 category-bias watch              | Slot 3 passes for the same structural reason in runs 2 and 3     | See slot 3 below                                                                                                                            | counter → **run 2 of 2**                   |
| String-rename locator sweep             | Second E2E project, or `POLICIES/testing.md` edited anyway       | No second project; no global-tree edit scheduled this run                                                                                   | **unmet** — re-parked                      |

### From run 2 (2026-08-15, G10)

- **`security-guidance`** (slot 1 runner-up, official) — `defer`, now **reviewed** (v2.0.7).
  Not a fit _this week_ because its cost is per-turn, not per-invocation: an LLM diff review on
  every Stop plus an agentic reviewer on every commit, defaulting to Opus. **Re-trigger**: the
  launch push is over and steady-state development resumes (per-turn cost becomes affordable),
  **or** `claude-security`'s pre-launch scan finds a vulnerability class that recurs in new code —
  which is the case continuous review answers and an on-demand scan does not. If it triggers, note
  the cheap knobs already read from its README: `ENABLE_STOP_REVIEW=0` keeps commit review without
  the per-turn tax, and `SECURITY_REVIEW_MODEL=claude-sonnet-4-6` trades precision for cost.
- **`logic-lens`** (slot 1, internet) — `defer`. MIT, v0.6.10, 19 stars, real marketplace add.
  Aimed at this repo's most-recurrent review weakness (findings suppressed by a confidence
  threshold), but single-maintainer with a self-published benchmark, and a second reviewer costs
  review rounds the launch push cannot spare. **Re-trigger**: the launch push ends, **or** the
  `code-review` threshold suppresses a real finding once more (that would be the 19th recurrence)
  and a complementary trace-based reviewer becomes worth its rounds. Cheap check next run: has the
  repo grown past 19 stars / gained visible co-maintainers — do not re-read the skills (Convention 4).
