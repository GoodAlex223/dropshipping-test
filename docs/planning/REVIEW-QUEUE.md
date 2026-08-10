# Review Queue

Durable cross-week state for the **Weekly Reviews** batch (⚪ Overhead, quota-exempt, ~5 SP, scheduled late-week).

**Last Updated**: 2026-08-10
**First run**: 2026-08-10 (WEEKLY G6, week of 2026-08-03) · design: [2026-08-10-g6-weekly-reviews-design.md](../superpowers/specs/2026-08-10-g6-weekly-reviews-design.md)

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
5. Close out: tick the WEEKLY checkboxes, flip its Summary-Table Status to `✅ PR #N`, update `docs/README.md`.

### Standing lens

**Launch-push relevance, high adopt bar** (set 2026-08-10). Fit is judged against what helps ship the Mirox
storefront now — Next.js 14 / TypeScript / Prisma / Playwright / Vercel, solo developer, translation and
visual work. Expect **0–1 adopts** per run; borderline-but-promising → `defer` + park, not adopt. Anything
that only pays off post-launch defers by default. Re-scope this lens once the storefront has launched.

---

## Conventions

1. **Every slot writes a Reviewed-log row regardless of verdict** — four-to-five rows per run, `pass` included.
   _(2026-08-10; sibling runs twice nearly dropped `pass` rows by composing the log from memory after the research.)_
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

---

## Reviewed log

### 1. Plugins

| Date       | Run    | Candidate                                                                                             | `source:` | Primary source                                                                                                | Verdict   | Reasoning                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Routed to                                        |
| ---------- | ------ | ----------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| 2026-08-10 | 1 (G6) | `resend` — Resend agent skills + MCP                                                                  | official  | [resend/resend-skills](https://github.com/resend/resend-skills) @ `7fa08a1`, MIT; manifest fetched 2026-08-10 | **defer** | Maps to the immediate next group (G5 transactional emails), but its weight sits in `react-email` — a rewrite of the hand-rolled HTML-string templates, outside G5's copy/styling scope — and a hosted MCP needing OAuth. Read the actual `email-best-practices` SKILL.md rather than the blurb: it reduces to double opt-in (already implemented here) plus DNS authentication, whose provisioning half is already covered by the [2026-08-07] 🔵 "Verify prod email config" entry.                                                                                                                             | Next-up park; 1 incidental 🟤 (`lang` attribute) |
| 2026-08-10 | 1 (G6) | `nextjs-marketplace` — Next.js 14+ App Router plugin set (10 plugins incl. "i18n & Localization Pro") | internet  | [rdimascio/nextjs-marketplace](https://github.com/rdimascio/nextjs-marketplace), fetched 2026-08-10           | **pass**  | Nominally an exact fit (Next.js 14 App Router, and i18n is the likely next-week spine), but it fails the provenance bar: **1 star**, single maintainer, and installation is `cp -r plugins/* .claude/plugins/` rather than a marketplace add. Surveyed alternatives fail differently — `claude-mem` duplicates the installed `auto-memory`, `frontend-design`/`playwright`/a11y tooling are already installed, and the i18n "skills" on aggregator sites have no traceable source repo (mcpmarket.com also returned HTTP 429, so it could not be verified at all). Unverifiable ⇒ not adoptable (Convention 3). | 1 incidental 🟤 (next-intl `useExtracted`)       |

### 2. Claude best-practices

| Date | Run | Candidate | Primary source | Verdict | Reasoning | Routed to |
| ---- | --- | --------- | -------------- | ------- | --------- | --------- |

### 3. Non-Claude AI best-practices

| Date | Run | Candidate | Primary source | Verdict | Reasoning | Routed to |
| ---- | --- | --------- | -------------- | ------- | --------- | --------- |

### 4. Cross-project propagation

| Date | Run | Learning scanned | Origin | Verdict | Reasoning | Routed to |
| ---- | --- | ---------------- | ------ | ------- | --------- | --------- |

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
- **`claude-security` / `security-guidance`** (slot 1 runners-up, official) — parked unreviewed.
  Both are first-party. Noted here because this repo, unlike the sibling that passed
  `security-guidance` for having no app-code web surface, **is** a Next.js app with auth, API
  routes and order-creation code. **Re-trigger**: the pre-launch security pass is scheduled, or
  real customer traffic is imminent (which is also the pin on the standing G2 hardening bundle).
