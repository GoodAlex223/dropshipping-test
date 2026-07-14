# TASK-033 Resumption Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-validate the frozen v1.2.0 codebase after 5 months of dormancy and set up the planning documents for the Mirox Shop program (spec: `docs/superpowers/specs/2026-07-14-mirox-shop-program-design.md`).

**Architecture:** No product code changes. This task is (1) an environment + validation sweep proving the baseline is green, (2) a security/dependency audit with a conservative-update decision tree, and (3) planning-document updates (new `WEEKLY.md`, promotion of TASK-034..040 into `TODO.md`).

**Tech Stack:** npm, Docker Compose (PostgreSQL 16 on host port 5433, Redis on 6380), Prisma, Vitest, Playwright, existing GitHub Actions CI.

## Global Constraints

- **Conservative dependency policy** (from project CLAUDE.md): only patch/minor updates within existing semver ranges (`npm update`); defer major upgrades to BACKLOG.md; document any package intentionally kept back.
- **Next.js 14 / React 18 stay pinned** (React.cache unavailable in React 18; upgrade is a separate backlog item).
- **Branch naming**: `feat/task-033-resumption`; conventional commits (`chore:`, `docs:`).
- **Abort condition** (from global CLAUDE.md): 3+ test failures after 3 fix attempts → stop and consult user. This task expects a green baseline; substantive product-code fixes are out of scope and must be reported, not improvised.
- **Task IDs and content for TODO.md promotion come verbatim from the spec** `docs/superpowers/specs/2026-07-14-mirox-shop-program-design.md` §3 (v1.3 milestone table).
- All new planning docs follow `~/.claude/TEMPLATES/weekly-planning.md` and `~/.claude/TEMPLATES/todo-task.md` formats.

---

### Task 1: Branch + environment bring-up

**Files:**

- No file changes (environment only; `package-lock.json` may be touched by later tasks, not this one)

**Interfaces:**

- Produces: running PostgreSQL + Redis containers, installed `node_modules`, migrated + seeded database — required by Task 2 (audit) and Task 3 (validation).

- [x] **Step 1: Create the task branch**

```bash
git checkout main && git pull && git checkout -b feat/task-033-resumption
```

Expected: `Switched to a new branch 'feat/task-033-resumption'`

- [x] **Step 2: Start infrastructure**

```bash
docker-compose up -d && docker-compose ps
```

Expected: `postgres`, `redis`, `adminer` services `Up (healthy)`. If Docker images are stale, `docker-compose pull` first.

- [x] **Step 3: Clean install dependencies**

```bash
npm ci
```

Expected: completes without `ERESOLVE` errors. Deprecation warnings are acceptable — note them in the Progress Log; do not act on them here.

- [x] **Step 4: Apply migrations, generate client, seed**

```bash
npm run db:migrate -- --skip-seed 2>/dev/null || npx prisma migrate deploy
npm run db:generate
npm run db:seed
```

Expected: `prisma migrate deploy` reports all migrations applied (or "No pending migrations"); seed reports created users/categories/products/orders/reviews/subscribers counts matching `prisma/seed-data/` (4 customers, 16 categories, 50+ products).

- [x] **Step 5: Log Task 1 outcome in this plan's Progress Log** (append a dated bullet; commit happens in Task 4)

---

### Task 2: Security & dependency audit

**Files:**

- Modify (conditional): `package-lock.json` (patch/minor updates only)
- Create: audit findings section in this plan's Progress Log (no separate file)

**Interfaces:**

- Consumes: installed `node_modules` from Task 1.
- Produces: audit verdict (clean / patched / deferred items) consumed by Task 4's TODO.md "Blocked/Spawned" entries and the Progress Log.

- [x] **Step 1: Run the audit and capture results**

```bash
npm audit --omit=dev; npm audit
```

Expected: a vulnerability table (likely non-empty after 5 months). Record counts by severity in the Progress Log, separating production (`--omit=dev`) from dev-only findings.

- [x] **Step 2: Check drift**

```bash
npm outdated
```

Expected: a list of outdated packages. Record it. No action yet.

- [x] **Step 3: Apply the decision tree**

For each HIGH/CRITICAL vulnerability:

1. Fixable by patch/minor within existing semver ranges → `npm update <pkg>` (or `npm audit fix` **without** `--force`).
2. Fixable only by major upgrade (e.g., Next.js 16) → do NOT upgrade; add a 🟤 BACKLOG.md entry under `### [2026-07-14] From: TASK-033 Resumption Audit` naming the package, CVE, and required major version.
3. MODERATE/LOW dev-only → document, defer.

```bash
npm audit fix
```

Expected: only semver-compatible changes to `package-lock.json`. Run `git diff package.json` afterward — it must be empty (ranges unchanged). If `package.json` changed, revert and reclassify that package as case 2.

- [x] **Step 4: Re-verify install integrity after any updates**

```bash
npm ci && npm audit
```

Expected: remaining vulnerabilities are only the documented case-2/case-3 items.

- [x] **Step 5: Check Stripe apiVersion drift** (known gotcha from CLAUDE.md: Stripe SDK minor updates can change the expected `apiVersion` string in `src/lib/stripe.ts`)

```bash
npm run typecheck
```

Expected: PASS. If it fails in `src/lib/stripe.ts` with an `apiVersion` type error, update the `apiVersion` literal in `src/lib/stripe.ts` to the version string the error message names, then re-run until PASS.

- [x] **Step 6: Commit (only if files changed)**

```bash
git add package.json package-lock.json src/lib/stripe.ts
git commit -m "chore: post-freeze dependency audit — patch/minor security updates (TASK-033)"
```

---

### Task 3: Full validation baseline

**Files:**

- No intended changes. Any failure here is a **finding to report**, not a license to refactor.

**Interfaces:**

- Consumes: seeded database + services from Task 1, patched deps from Task 2.
- Produces: green baseline (or a findings report) gating the start of TASK-034..040.

- [x] **Step 1: Lint, format, typecheck**

```bash
npm run lint && npm run format:check && npm run typecheck
```

Expected: all PASS with zero warnings (freeze ended at 0 ESLint warnings).

- [x] **Step 2: Unit tests**

```bash
npm run test:run
```

Expected: all tests pass (~246 tests across `tests/unit/`).

- [x] **Step 3: Production build**

```bash
npm run build
```

Expected: `prisma generate` + `next build` complete; no type errors; route listing printed.

- [x] **Step 4: E2E tests** (requires seeded DB from Task 1; local dev uses port 3001)

```bash
npm run test:e2e
```

Expected: global setup validates DB connectivity + seed data, then all Playwright specs pass.

- [x] **Step 5: Failure handling protocol** (only if any step failed)

Per failure: retry once to rule out flakiness; if reproducible, diagnose with the superpowers:systematic-debugging skill. Fixes limited to configuration/environment/test-infrastructure. If a product-code defect is found, record it in the Progress Log and add a 🟤 BACKLOG.md entry — do not fix inside TASK-033. Abort condition: 3+ failures persisting after 3 attempts → stop, report to user.

- [x] **Step 6: Record baseline in Progress Log** (test counts, coverage-relevant notes, duration) — commit lands in Task 4.

---

### Task 4: Planning documents — WEEKLY.md + TODO.md promotion

**Files:**

- Create: `docs/planning/WEEKLY.md`
- Modify: `docs/planning/TODO.md` (replace "Freeze Complete" body with active-task structure)
- Modify: `docs/planning/plans/2026-07-14_task-033-resumption.md` (Progress Log entries from Tasks 1–3)

**Interfaces:**

- Consumes: audit verdict (Task 2), baseline result (Task 3), spec §3 v1.3 table.
- Produces: `WEEKLY.md` and `TODO.md` entries `[TASK-033]`..`[TASK-040]` that all subsequent Mirox work references.

- [x] **Step 1: Create `docs/planning/WEEKLY.md`** with this content (statuses reflect reality at time of writing — adjust TASK-033's status if Tasks 1–3 are already done):

```markdown
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

| Task                      | Reference        | Status         | Notes                |
| ------------------------- | ---------------- | -------------- | -------------------- |
| Resumption validation     | TODO.md TASK-033 | ⏳ In Progress | Gates all other work |
| Payments & delivery spike | TODO.md TASK-038 | 📋 Planned     | Blocks v1.4 Track B  |

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

- [ ] TASK-033: environment bring-up, audit, validation baseline, planning docs
- **Completed**:
- **Blockers**:

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
```

- [x] **Step 2: Rewrite `docs/planning/TODO.md`** with this content:

```markdown
# TODO

**Last Updated**: 2026-07-14

Program spec: [Mirox Shop Program Design](../superpowers/specs/2026-07-14-mirox-shop-program-design.md) · Current week: [WEEKLY.md](WEEKLY.md)

---

## 🔄 In Progress

#### [TASK-033] Post-freeze resumption validation

**Priority**: 🔴 Critical
**Status**: 🔄 In Progress
**Effort**: M
**Plan**: [docs/planning/plans/2026-07-14_task-033-resumption.md](plans/2026-07-14_task-033-resumption.md)

**Description**: Re-validate the frozen v1.2.0 codebase (npm audit, dependency drift, full build/unit/E2E baseline) and set up Mirox Shop program planning docs. Gates all v1.3 work.

**Acceptance Criteria**:

- [ ] `npm audit` reviewed; HIGH/CRITICAL patched within semver or deferred to BACKLOG with rationale
- [ ] Lint, format, typecheck, unit tests, build, E2E all green
- [ ] WEEKLY.md created; TASK-034..040 promoted to TODO.md

## 📋 Planned (v1.3 — "Mirox Rebrand Demo")

#### [TASK-034] Design system & rebrand foundation

**Priority**: 🟠 High
**Status**: 📋 Planned
**Effort**: XL
**Dependencies**: [TASK-033]

**Description**: Mirox Shop black/white luxury-minimal design system: color tokens (#000000, #FFFFFF, #1A1A1A, #F5F5F5), typography, logo assets, animation primitives (fade-in, hover, skeleton loaders, transitions); restyle shared components (header, footer, buttons, cards). Token-driven so later design files re-skin tokens, not components. Candidate for Ultracode restyle-sweep workflow.

**Acceptance Criteria**:

- [ ] Design tokens defined and consumed by all shared components
- [ ] Header, footer, buttons, cards restyled to the screenshot's direction
- [ ] Animation primitives available as reusable utilities
- [ ] No bright colors anywhere in the customer-facing theme

#### [TASK-035] Homepage rebrand

**Priority**: 🟠 High
**Status**: 📋 Planned
**Effort**: L
**Dependencies**: [TASK-034]

**Description**: Hero banner (model photo, "STYLE. QUALITY. CONFIDENCE.", catalog + new-arrivals CTAs), benefit cards (delivery, size exchange, quality, 24/7 support), "Why choose us" block, featured/hits sections, social links, rebranded footer.

**Acceptance Criteria**:

- [ ] First screen matches brief: slogan, subtitle, two CTAs
- [ ] Benefit cards and "Why choose us" blocks present
- [ ] Social section (Instagram, TikTok, Telegram) present

#### [TASK-036] Catalog redesign + filters

**Priority**: 🟠 High
**Status**: 📋 Planned
**Effort**: L
**Dependencies**: [TASK-034]

**Description**: Catalog page in the new design with filters (price, size, color, brand, availability) and sorting (new, popular, price ↑/↓). Variants and `brand` field already exist in the Prisma schema.

**Acceptance Criteria**:

- [ ] All five filters functional and combinable
- [ ] Four sort orders functional ("popular" definition decided in plan)
- [ ] Filter state reflected in the URL (shareable)

#### [TASK-037] Product page redesign

**Priority**: 🟠 High
**Status**: 📋 Planned
**Effort**: L
**Dependencies**: [TASK-034]

**Description**: Large gallery, size/color pickers, size table, stock counter ("Only N left"), related products, recently viewed.

**Acceptance Criteria**:

- [ ] Gallery, size/color selection, size table implemented
- [ ] Stock counter shows real inventory below a threshold
- [ ] Related + recently-viewed sections implemented

#### [TASK-038] Payments & delivery research spike (Ukraine)

**Priority**: 🔴 Critical
**Status**: 📋 Planned
**Effort**: M
**Dependencies**: [TASK-033]

**Description**: Decision doc, no code. Stripe does not onboard Ukrainian merchants → evaluate LiqPay / WayForPay / Fondy / monobank acquiring (fees, API, merchant requirements, refunds/webhooks); scope Nova Poshta API; define UAH currency strategy. Output: gateway decision + integration plan for TASK-048/049. Candidate for Ultracode research fan-out workflow.

**Acceptance Criteria**:

- [ ] Comparison matrix of ≥3 gateways with fees and API capabilities
- [ ] Recommended gateway with rationale; merchant-account prerequisites listed
- [ ] Nova Poshta integration scoped (API, branch picker, cost calc)
- [ ] UAH pricing strategy defined (single- vs multi-currency)

#### [TASK-039] i18n foundation

**Priority**: 🟠 High
**Status**: 📋 Planned
**Effort**: L
**Dependencies**: [TASK-033]

**Description**: Ukrainian as default customer-facing locale (language-law requirement), Russian secondary; UAH price formatting. Library choice (e.g., next-intl) decided in plan.

**Acceptance Criteria**:

- [ ] Locale infrastructure with UA default, RU toggle
- [ ] Customer-facing storefront strings externalized
- [ ] Prices render in UAH with correct formatting

#### [TASK-040] CI extensions

**Priority**: 🟡 Medium
**Status**: 📋 Planned
**Effort**: M
**Dependencies**: [TASK-033]

**Description**: Lighthouse CI with performance budget (brief demands PageSpeed 95+), preview deploys per PR, scheduled weekly `npm audit` workflow.

**Acceptance Criteria**:

- [ ] Lighthouse CI job with budget failing PRs below threshold
- [ ] Preview deploy per PR with URL comment
- [ ] Weekly scheduled audit workflow opening an issue on findings

---

## ⏸️ Blocked

_None._

## 🔀 Spawned

_None yet — audit findings from TASK-033 may add entries here or to BACKLOG.md._
```

- [x] **Step 3: Format check** (lint-staged will also prettify on commit)

```bash
npx prettier --check docs/planning/WEEKLY.md docs/planning/TODO.md || npx prettier --write docs/planning/WEEKLY.md docs/planning/TODO.md
```

Expected: files formatted.

- [x] **Step 4: Commit planning docs + progress log**

```bash
git add docs/planning/WEEKLY.md docs/planning/TODO.md docs/planning/plans/2026-07-14_task-033-resumption.md
git commit -m "docs: Resume development — WEEKLY.md, promote v1.3 tasks to TODO.md (TASK-033)"
```

---

### Task 5: Report & handoff

**Files:**

- Modify: this plan (final Progress Log entry)
- Conditional: `docs/planning/BACKLOG.md` (deferred audit findings, 🟤 under `### [2026-07-14] From: TASK-033 Resumption Audit`)

**Interfaces:**

- Consumes: everything above.
- Produces: PR for user review; TASK-033 completion follows the global workflow (extract → archive → transition → commit → capture learnings) **after** user approval — not part of this plan.

- [ ] **Step 1: Write baseline report in the Progress Log**: audit verdict (counts, patched, deferred), validation results (pass/fail per suite, test count), any BACKLOG entries added.

- [ ] **Step 2: Push branch and open PR**

```bash
git push -u origin feat/task-033-resumption
gh pr create --title "TASK-033: Post-freeze resumption validation & Mirox program planning docs" --body "$(cat <<'EOF'
## Summary
- Post-freeze baseline: dependency audit (conservative policy), full validation (lint/typecheck/unit/build/E2E)
- New docs/planning/WEEKLY.md; v1.3 tasks TASK-034..040 promoted to TODO.md
- Program spec: docs/superpowers/specs/2026-07-14-mirox-shop-program-design.md

## Validation
- [ ] npm audit reviewed (see plan Progress Log)
- [ ] All checks green: lint, format, typecheck, test:run, build, test:e2e

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR URL printed. Stop here and wait for user review — no merge without approval.

---

## Progress Log

- 2026-07-14: Plan created (brainstorming spec approved; see `docs/superpowers/specs/2026-07-14-mirox-shop-program-design.md`).
- 2026-07-14: **Task 1 complete.** Branch `feat/task-033-resumption` created from `main` (note: local `main` had 1 unpushed commit `d72f0c0` "docs: Add Mirox Shop program design spec" ahead of `origin/main`; `git pull` was a no-op and that commit is now on the task branch too — flag for Task 2/5 if it needs separating out before PR). Pre-existing dirty working-tree files (`.claude/settings.json`, `CLAUDE.md`, deleted `playwright-report/*`, `test-results/.last-run.json`, untracked `.devcontainer/devcontainer-lock.json`) carried over untouched as instructed.
  - **Infrastructure**: `docker-compose`/`docker` CLI is not installed inside this devcontainer's `app` service (no docker-in-docker). This is expected for this environment: the repo has two compose files — root `docker-compose.yml` (host port 5433/6380 mapping, for host-driven dev) and `.devcontainer/docker-compose.yml` (the one actually orchestrating this session, sibling `postgres`/`redis`/`adminer` containers on an internal `devcontainer` bridge network, addressed by service name on native ports). The outer orchestration had already started and health-checked `postgres`/`redis` before this session began (confirmed via DNS resolution, raw TCP connect, `pg_isready`, and `redis-cli ping` — all healthy; `adminer:8080` also reachable). Substituted literal Step 2 command with direct reachability/health verification since `docker-compose ps` cannot run here.
  - **.env hygiene finding**: `/workspaces/dropshipping/.env` has a duplicate `DATABASE_URL` key — line 2 (correct local `postgres:5432`) and a second one appended near the bottom alongside `VERCEL_TOKEN`/`VERCEL_ORG_ID`/`VERCEL_PROJECT_ID` pointing at a **remote Neon** connection string. Verified this is currently harmless only because the devcontainer's `remoteEnv` (`devcontainer.json`) pre-sets `DATABASE_URL`/`REDIS_URL` in the shell before `.env` loads, and `dotenv` does not override already-set `process.env` vars — confirmed via `node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL)"` resolving to the local URL. Still a latent footgun (any shell without that `remoteEnv` pre-seed, or a different .env loader that doesn't respect existing env vars, would target the Neon DB). Recommend a BACKLOG/audit item to deduplicate `.env` and stop committing what look like live Vercel credentials to a tracked file (needs owner confirmation on secret rotation).
  - **`npm ci`**: completed successfully, 843 packages added, no `ERESOLVE` errors (only warnings). Deprecation/warning notes: (1) peer-dependency warning between `@auth/core@0.41.0` (via `next-auth@5.0.0-beta.30`) requiring `nodemailer@^6.8.0` vs `@auth/core@0.41.1` (via `@auth/prisma-adapter`) requiring `nodemailer@^7.0.7`, resolved `nodemailer@7.0.11` installed; (2) Prisma `package.json#prisma` config key deprecated, recommends migrating to `prisma.config.ts`; (3) `npm audit`: **32 vulnerabilities (2 low, 13 moderate, 14 high, 3 critical)** — not acted on here, flagged for Task 2 audit.
  - **Migrate/generate/seed**: `npm run db:migrate -- --skip-seed` (→ `prisma migrate dev --skip-seed`) reported "Already in sync, no schema change or pending migration was found" and regenerated the client; `npm run db:generate` OK; `npm run db:seed` succeeded: 5 users (1 admin + 4 customers), 15 categories (4 top-level + 11 sub), 1 supplier, 21 products, 7 orders, 8 reviews, 6 subscribers, 4 settings.
  - **Docs/data discrepancy**: CLAUDE.md and this brief state "16 categories, 50+ products," but `prisma/seed-data/categories.ts` and `products.ts` currently only define 15 categories / 21 products respectively (verified by direct grep of the seed-data source), and the seed output matches those files exactly. The seed pipeline is not broken — the documentation is stale. Flagging for Task 2/BACKLOG rather than editing seed data (out of scope for an ops-only task).
  - **Environment**: Node v20.20.2, npm 10.8.2, inside devcontainer `app` service.
- 2026-07-14: **Task 2 complete — security & dependency audit (conservative policy).**
  - **Before**: `npm audit` 32 vulnerabilities total (2 low, 13 moderate, 14 high, 3 critical); production subset (`--omit=dev`) 19 (0 low, 9 moderate, 9 high, 1 critical) — prod findings: defu, effect (via prisma), fast-xml-parser (critical, via @aws-sdk/xml-builder), linkify-it/mailparser (via resend), next, nodemailer chain (@auth/core/next-auth), postcss (nested in next), uuid (via bullmq/svix), ws. Dev-only findings: @babel/core, ajv, brace-expansion, esbuild (via tsx), flatted, js-yaml, minimatch, picomatch, rollup, vite, vitest (critical), yaml, postcss (top-level).
  - **`npm outdated`**: 63 packages behind; majors available but deferred per policy: next 16, react/react-dom 19, prisma/@prisma/client 7, eslint 10, typescript 7, @stripe/react-stripe-js 6, @stripe/stripe-js 9, stripe 22, jsdom 29, lucide-react 1.x, react-dropzone 17, @types/node 26, @vitejs/plugin-react 6, next-auth "latest" tag is 4.24.14 (older line than the pinned 5.0.0-beta), prettier-plugin-tailwindcss 0.8, @aws-sdk/\* 3.1086. All others were wanted-range (patch/minor) drift.
  - **Case 1 (fixed within semver, `npm audit fix` without --force + `npm update tsx`)**: 151 lockfile-only version bumps, 35 packages removed, 1 added; `git diff package.json` empty (ranges unchanged). Key security-relevant bumps: ws 8.19.0→8.21.0, defu 6.1.4→6.1.7, effect 3.18.4→3.21.0 (prisma 6.19.2→6.19.3), resend 6.9.1→6.17.2 (drops vulnerable mailparser/linkify-it/svix subtree entirely), @aws-sdk/xml-builder 3.972.4→3.972.34 (drops vulnerable fast-xml-parser — CRITICAL cleared), bullmq 5.67.3→5.80.2 (drops vulnerable uuid), vitest/@vitest/coverage-v8 4.0.18→4.1.10 (CRITICAL GHSA-5xrq-8626-4rwp cleared), vite 7.3.1→7.3.6, rollup 4.57.1→4.62.2, flatted 3.3.3→3.4.2, @babel/core 7.29.0→7.29.7, minimatch/brace-expansion/picomatch/ajv/js-yaml/yaml patched, tsx 4.21.0→4.23.1 (esbuild 0.27.3→0.28.1, low advisory cleared), nodemailer 7.0.11→7.0.13, next-auth beta.30→beta.31, @auth/core 0.41.1→0.41.2, @auth/prisma-adapter 2.11.1→2.11.2.
  - **After** (`npm ci && npm audit` re-verified): **6 vulnerabilities (4 moderate, 2 high; 0 critical)**, identical in prod and full audit, all documented case-2 deferrals: (a) `next@14.2.35` — 14 HIGH advisories fixable only by next@16.2.10 major (+ nested postcss MODERATE GHSA-qx2v-qp2m-jg93); (b) nodemailer chain (@auth/core, @auth/prisma-adapter, next-auth) — 6 HIGH advisories fixed only in nodemailer 9.0.1+ while @auth/core pins ^7; no non-breaking fix exists; practical exposure low (email goes through Resend, no SMTP provider configured). Both recorded in BACKLOG.md under `### [2026-07-14] From: TASK-033 Resumption Audit` (Next.js entry tagged `[possible-dup-of: TASK-027 2026-02-09 entry]`).
  - **Stripe apiVersion drift**: none — `npm run typecheck` PASS with `apiVersion: "2026-01-28.clover"` unchanged (stripe stayed at 20.3.1; its wanted 20.4.1 was not pulled by audit fix and was not forced).
  - **Committed**: `package-lock.json` + `docs/planning/BACKLOG.md` only (package.json and src/lib/stripe.ts unchanged).
- 2026-07-14: **Task 3 complete — full validation baseline.** Verdict: **DONE WITH CONCERNS** — lint/typecheck/unit/build all green; E2E 83/85 (97.6%) green with one reproducible, pre-existing, WebKit-only gap (not a Task 2 regression). No product code touched; environment gap (missing Playwright browsers) fixed as legitimate test-infrastructure setup.
  - **Step 1 (lint/format/typecheck)**: `npm run lint` → **PASS**, 0 errors/warnings (60.5s). `npm run format:check` (`prettier --check "**/*.{ts,tsx,js,jsx,json,md}"`) → **FAILED** (7 files), but root-caused to zero real product-code drift: (a) 5 files under `.superpowers/sdd/*.md` — confirmed via `git check-ignore -v` to be excluded by that directory's own nested `.gitignore` (`*`); Prettier's glob doesn't respect nested `.gitignore` files (only root-level `.gitignore`/`.prettierignore`), so these session-scratch orchestration files (never committed, never part of a real PR) get swept in as false positives; (b) `test-results/.last-run.json` — the pre-existing dirty generated artifact already flagged as expected/OK to be dirty; (c) `docs/planning/plans/2026-07-14_task-033-resumption.md` itself — pre-existing formatting from when the plan was authored (table column widths, missing blank lines after headings), confirmed via `prettier <file> | diff` to be unrelated to anything in Task 3; will auto-fix at Task 4's `git commit` via the existing Husky+lint-staged pre-commit hook (`prettier --write` on staged `.md`), consistent with repo convention — no manual action needed. **Verification**: re-ran `format:check` scoped to every real tracked path (`src/`, `tests/`, `prisma/`, root configs, `docs/**`, `.claude/**`) → **0 issues**, confirming the actual codebase is 100% Prettier-clean. `npm run typecheck` → **PASS**, 0 errors (36.2s; ran standalone since the `&&` chain stopped at format:check).
  - **Step 2 (unit tests)**: `npm run test:run` → **PASS** — 9 test files, **246 passed, 1 todo** (247 total), 19.63s. Matches CLAUDE.md's documented "~246 tests" exactly (no discrepancy, unlike the Task 1 categories/products count finding).
  - **Step 3 (build)**: `npm run build` → **PASS**, run twice for determinism (both green): `prisma generate` (Prisma Client v6.19.3, 1.13s) + `next build` compiled successfully, 0 type errors, 49/49 static pages generated, full route table printed (49 app routes + `/_app` pages route). Second timed run: 3m11s. Only warning: pre-existing non-standard `NODE_ENV` notice (informational, not an error, unrelated to Task 2's updates).
  - **Step 4 (E2E)**: Local config (no `CI` env var) runs the full 5-project matrix (chromium, firefox, webkit, Mobile Chrome, Mobile Safari) × 3 spec files (`navigation.spec.ts`, `cart.spec.ts`, `products.spec.ts`) = **85 tests**. CLAUDE.md's "navigation and basic user flow tests" description undersells current scope — `cart.spec.ts` and `products.spec.ts` exist too (pre-existing docs gap, not a Task 3 defect; noting for doc-hygiene backlog).
    - **Environment gap found and fixed**: this devcontainer had zero Playwright browser binaries installed (`~/.cache/ms-playwright` didn't exist; `postinstall` only runs `prisma generate`, no browser install step) — first-time E2E setup gap, not caused by Task 2. Fixed as legitimate test-infrastructure setup: `npx playwright install --with-deps` (chromium, firefox, webkit + ffmpeg, all with system deps via apt). CI's own workflow (`ci.yml`) independently confirms this is the expected/normal step (`npx playwright install --with-deps chromium`, chromium-only for CI speed — this devcontainer install extended to all 3 engines since local Playwright config runs all 5 projects unfiltered).
    - **Run 1** (global setup validated DB: "Categories: 15, Active products: 21" — OK): **82/85 passed, 3 failed**: `navigation.spec.ts` "can navigate to products page" (chromium), `products.spec.ts` "can filter products by search" (webkit), same test (Mobile Safari).
    - **Retry (Step 5 protocol, attempt 2/3 max)**: re-ran full suite (port 3001 confirmed free first) → **83/85 passed, 2 failed**. The chromium navigation failure **did not recur** — confirmed flaky, caused by cold dev-server route compilation on first hit (`GET /products` took 8494ms to compile+respond against the test's 5000ms `toHaveURL` timeout in run 1; `.next` cache was warm on retry). No further action needed on that one.
    - **Reproducible failure (2/2 attempts, diagnosed, not fixed — product code out of scope)**: `products.spec.ts` "can filter products by search" fails **only** on WebKit-engine projects (`webkit` desktop and `Mobile Safari`, which also runs on WebKit) — `chromium`, `firefox`, and `Mobile Chrome` all pass it consistently both runs. Error: `TimeoutError: page.waitForURL: Timeout 10000ms exceeded` — the app navigates to `/products?page=1` instead of `/products?search=test`. Root-cause investigation (source review, not a guess): `src/app/(shop)/products/products-content.tsx`'s `handleSearch` is a single synchronous `onSubmit` handler (`e.preventDefault()` → one `router.push` with both `page=1` and `search` set together via `URLSearchParams`; no debounce, no competing `useEffect` that could race it — the only `useEffect` present is a one-way URL→state sync that cannot preempt the button's own push). The observed URL (`page=1` present, `search` absent) is only reachable if the component's local `search` state was still `""` when `handleSearch` read it (`search || null` → `null` → `params.delete("search")`), implying Playwright's `.fill("test")` → React controlled-input `onChange` round trip didn't land before submit, specifically under WebKit. **Ruled out as a Task 2 regression**: diffed `package-lock.json` before/after commit `3a3ec75` — `@playwright/test`/`playwright`/`playwright-core` are byte-identical at `1.58.2` (untouched by the audit), and none of Task 2's 151 bumped packages touch the React/Next.js rendering or routing path. **This is a pre-existing, latent gap**: `.github/workflows/ci.yml` installs and runs **chromium only** (`npx playwright install --with-deps chromium`) — CI has never exercised WebKit/Safari, so this could have been present since the feature shipped and simply never been caught. Real-world relevance: WebKit is the Safari/iOS engine, a materially large slice of e-commerce traffic, so this is a genuine product-facing risk worth investigating even though it's untouched by TASK-033. **Not fixed here** (product code, out of scope) — needs a BACKLOG.md entry; see Concerns below (Task 3's scope is the plan file only, so the entry itself is deferred to Task 5 per this task's specific instructions).
    - **Abort condition check**: 2 persisting failures (both instances of one root cause) after 2 attempts — below the "3+ failures persisting after 3 attempts" abort threshold. No abort; not pursued further per "diagnose, don't keep grinding."
  - **Minor process observation (no action taken, informational)**: `format:check`'s glob (`**/*.{ts,tsx,js,jsx,json,md}`) doesn't respect nested `.gitignore` files, so any future `.superpowers/sdd/**` (or similarly nested-ignored) scratch content will keep showing as false positives in a bare `npm run format:check`. Not fixed here (`.prettierignore` is a repo config file; Task 3's mandate is "no intended changes" to Files). Worth a low-priority backlog note if it keeps causing confusion.
  - **Baseline verdict**: lint/typecheck/unit/build all green and reproducible; E2E 83/85 (97.6%) with one well-diagnosed pre-existing WebKit-only gap (not a Task 2 regression) documented for backlog rather than fixed. Full details: `.superpowers/sdd/task-3-report.md` (session-local, gitignored).
- 2026-07-14: **Task 4 complete — planning documents.** Created `docs/planning/WEEKLY.md` and rewrote `docs/planning/TODO.md` (replacing the "Freeze Complete" body with the active-task structure), both transcribed verbatim from the plan/spec content above and reformatted by `npx prettier --write` (Step 3) exactly as expected.
  - **WEEKLY.md**: Tuesday daily-log **Completed** line filled in with a summary of Tasks 1–4 (env bring-up; audit 32→6 vulns, commit `3a3ec75`; validation baseline — unit/build green, E2E 83/85 with the WebKit-only pre-existing bug; planning docs); **Blockers** left empty. TASK-033's table status kept `⏳ In Progress` (Task 5 — PR/handoff — is still outstanding, so the task as a whole isn't done yet).
  - **TODO.md**: `[TASK-033]` kept `🔄 In Progress` for the same reason; its Acceptance Criteria checkboxes and WEEKLY.md's Tuesday task checkbox were intentionally left unchecked rather than marked done, since Task 3's E2E result was "DONE WITH CONCERNS" (2/85 known pre-existing failures, not fixed) and Task 5 hasn't run — checking them now would overstate completion. `[TASK-034]`..`[TASK-040]` promoted verbatim from spec §3 v1.3 table.
  - **BACKLOG.md**: appended two entries under the existing `### [2026-07-14] From: TASK-033 Resumption Audit` heading, below Task 2's two existing bullets (same list, no new `**Origin**` sub-line added): (1) the WebKit/Mobile Safari-only `products.spec.ts` "can filter products by search" E2E failure diagnosed in Task 3 (root cause: `handleSearch`/`updateFilters` in `src/app/(shop)/products/products-content.tsx`; invisible to CI's chromium-only run; fix deferred as out of TASK-033 scope) — this resolves the handoff Task 3 left for later, done here instead of Task 5 per updated task assignment; (2) the stale seed-count doc discrepancy found in Task 1 (CLAUDE.md/docs say 16 categories / 50+ products; seed data actually defines 15 / 21), tagged `[possible-dup-of: 2026-02-12 Code Review of TASK-032 entry]`.
  - **Committed** (this commit): `docs/planning/WEEKLY.md`, `docs/planning/TODO.md`, `docs/planning/BACKLOG.md`, and this plan file — added individually by path, no `git add -A`; pre-existing dirty files (`.claude/settings.json`, `CLAUDE.md`, `playwright-report/*`, `test-results/.last-run.json`, untracked `.devcontainer/devcontainer-lock.json`, `photo_2026-07-13_13-23-08.jpg`) left untouched as in Tasks 1–3.
