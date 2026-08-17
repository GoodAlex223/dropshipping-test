# G11 Docs-Freshness Linter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retire the doc-drift defect class that human review has caught nine times, by adding a guarded Vitest check that compares `docs/README.md`'s index rows against each doc's own `**Last Updated**` header — and fixing the fourteen instances of real drift currently in the tree.

**Architecture:** One new test file, `tests/unit/docs-freshness.test.ts`, built like `tests/unit/no-bright-colors.test.ts`: plain Node `fs` walking, exemption sets declared by exact path, and a vacuous-pass guard on every scanned set. Three shared seams (`walkDocs`, `parseTables`, `readStamp`) carry five independent `describe` blocks, so the two deferred checks can attach later without a rewrite. The false-positive guards are the load-bearing part: unguarded, these checks fire 27 + 13 + 18 rows against a tree with only 14 real defects.

**Tech Stack:** Vitest 3 (`globals: true`, jsdom env), Node `fs`/`path`, Prettier 3.7.4 Node API. No new dependencies, no new npm scripts, no pre-commit hook.

**Spec:** [docs/superpowers/specs/2026-08-17-g11-docs-freshness-linter-design.md](../../superpowers/specs/2026-08-17-g11-docs-freshness-linter-design.md)

## Global Constraints

- **No stamp = skip, never fail.** Only files declaring `**Last Updated**:` are ever compared. Never read `**Date**:` for a comparison — spec files carry it as an immutable authoring date (Decision 1).
- **Columns are selected by header name**, literally `Last Updated`. Never by column index. `Status`, `Completed` and `Started` are not freshness stamps.
- **Exemptions are listed by exact path**, in a named `const` with a comment explaining each — the `ADMIN_ONLY_PROPS` idiom from `no-bright-colors.test.ts`. Never a glob that could silently widen.
- **Every check asserts non-vacuity** (`expect(set.length).toBeGreaterThan(0)`) before its per-item assertions. A renamed directory must fail loudly, not silently disarm the guard.
- **Every check is demonstrated red under a deliberately-broken control** before the task is complete, and the control's output is pasted into the task's commit message or the completion notes. Green output alone is not evidence.
- **No new dependencies, no new npm scripts, no pre-commit hook** (Decision 3).
- After editing any `.md`, run `npx prettier --write <file>` — `format:check` covers `**/*.md` in CI and lint-staged will rewrite on commit anyway.
- Paths in the test are repo-root-relative (`docs/README.md`), matching `no-bright-colors.test.ts`; Vitest runs with the repo root as cwd.

---

### Task 1: Test scaffold, shared seams, and the header↔row check

**Files:**

- Create: `tests/unit/docs-freshness.test.ts`
- Modify: `docs/README.md:38` (the one real header↔row drift)
- Test: the file above is itself the test

**Interfaces:**

- Consumes: nothing — this is the first task.
- Produces: `walkDocs(dir?: string): string[]`, `parseTables(md: string): TableRow[]`, `readStamp(file: string): Stamp`, `rowTarget(cell: string): string | null`, and the module consts `DOCS = "docs"`, `INDEX = "docs/README.md"`, `DATE_COLUMN = "Last Updated"`. Tasks 2–5 import nothing; they add `describe` blocks to this same file and reuse these top-level functions.

```ts
interface TableRow {
  line: number; // 1-indexed line in the source file, for failure messages
  header: string[];
  cells: string[];
}
interface Stamp {
  lastUpdated: string | null;
  date: string | null;
}
```

- [ ] **Step 1: Write the failing test**

Create `tests/unit/docs-freshness.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";

const DOCS = "docs";
const INDEX = "docs/README.md";

// Only a column whose header cell is LITERALLY this holds a freshness stamp.
// The Archived Plans table's `Completed` and the active table's `Started` are
// event dates, and `Status` holds COMPLETE/ACTIVE — not a date at all. Selecting
// by name rather than by index is what keeps those out. See spec §3.1 Check 2.
const DATE_COLUMN = "Last Updated";

interface TableRow {
  line: number;
  header: string[];
  cells: string[];
}
interface Stamp {
  lastUpdated: string | null;
  date: string | null;
}

function walkDocs(path: string = DOCS): string[] {
  const st = statSync(path);
  if (st.isFile()) return path.endsWith(".md") ? [path] : [];
  return readdirSync(path).flatMap((entry) => walkDocs(join(path, entry)));
}

// A plain for-loop rather than forEach: `header` is reassigned across
// iterations, and TS narrows it far more reliably outside a closure.
function parseTables(md: string): TableRow[] {
  const rows: TableRow[] = [];
  let header: string[] | null = null;
  const lines = md.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (!t.startsWith("|")) {
      header = null; // a non-table line ends the current table
      continue;
    }
    if (/^\|[\s:|-]+\|$/.test(t)) continue; // separator row
    const cells = t
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim());
    if (header === null) {
      header = cells;
      continue;
    }
    rows.push({ line: i + 1, header, cells });
  }
  return rows;
}

function readStamp(file: string): Stamp {
  const body = readFileSync(file, "utf8");
  return {
    lastUpdated: body.match(/^\*\*Last Updated\*\*:\s*(\d{4}-\d{2}-\d{2})/m)?.[1] ?? null,
    date: body.match(/^\*\*Date\*\*:\s*(\d{4}-\d{2}-\d{2})/m)?.[1] ?? null,
  };
}

// Resolve the repo-relative path a table row's first cell links to, or null if
// the cell has no link / links off-site.
function rowTarget(cell: string): string | null {
  const m = /\[[^\]]*\]\(([^)\s]+)\)/.exec(cell);
  if (!m) return null;
  const target = m[1];
  if (/^(https?:|#)/.test(target)) return null;
  const [path] = target.split("#");
  if (!path) return null;
  return relative(process.cwd(), resolve(dirname(INDEX), decodeURIComponent(path)));
}

const indexRows = parseTables(readFileSync(INDEX, "utf8"));

describe("docs/README.md index rows agree with each doc's own **Last Updated**", () => {
  // THE load-bearing guard. A row is comparable only when its target file
  // actually declares **Last Updated**. Specs carry **Date** (an immutable
  // authoring date) and are therefore never compared; archived plans and
  // several planning docs carry no stamp at all. Dropping this guard takes the
  // audit from 1 finding to 27, of which 26 are false. Spec §1.1 / Decision 1.
  const comparable = indexRows.flatMap((row) => {
    const di = row.header.indexOf(DATE_COLUMN);
    if (di < 0) return [];
    const target = rowTarget(row.cells[0] ?? "");
    if (!target || !target.endsWith(".md") || !existsSync(target)) return [];
    const rowDate = (row.cells[di] ?? "").match(/\d{4}-\d{2}-\d{2}/)?.[0];
    if (!rowDate) return [];
    const { lastUpdated } = readStamp(target);
    if (!lastUpdated) return [];
    return [{ line: row.line, target, rowDate, lastUpdated }];
  });

  it("finds a non-empty set of comparable rows", () => {
    expect(comparable.length).toBeGreaterThan(0);
  });

  it("every comparable row matches its document's header", () => {
    const drift = comparable
      .filter((c) => c.rowDate !== c.lastUpdated)
      .map(
        (c) => `${INDEX}:${c.line} says ${c.rowDate}, but ${c.target} declares ${c.lastUpdated}`
      );
    expect(drift, `Index/header drift:\n${drift.join("\n")}`).toEqual([]);
  });

  it("never compares against a **Date** stamp", () => {
    // Guards Decision 1 by construction: every comparable row's target must
    // declare **Last Updated**. If a future edit made the check fall back to
    // **Date**, spec rows would enter `comparable` and this would fail.
    const specRows = comparable.filter((c) => c.target.includes("superpowers/specs/"));
    expect(specRows.map((c) => c.target)).toEqual([]);
  });
});

describe("docs/README.md tables are well-formed", () => {
  it("finds a non-empty set of table rows", () => {
    expect(indexRows.length).toBeGreaterThan(0);
  });

  it("every row has exactly as many cells as its header", () => {
    // A stray unescaped `|` inside a cell shifts every column after it, which
    // would silently move the date out of the DATE_COLUMN position and make
    // the check above compare the wrong text.
    const malformed = indexRows
      .filter((r) => r.cells.length !== r.header.length)
      .map((r) => `${INDEX}:${r.line} has ${r.cells.length} cells, header has ${r.header.length}`);
    expect(malformed, `Malformed table rows:\n${malformed.join("\n")}`).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/docs-freshness.test.ts`

Expected: **FAIL** on "every comparable row matches its document's header", with:

```
docs/README.md:38 says 2026-08-15, but docs/planning/DONE.md declares 2026-08-17
```

This is recurrence #10, created by the G13 close-out on 2026-08-17 — a real red, not a fixture. The other three tests in this task must PASS.

- [ ] **Step 3: Fix the drift**

In `docs/README.md:38`, change the `Last Updated` cell for the `planning/DONE.md` row from `2026-08-15` to `2026-08-17`. Change only that cell.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/unit/docs-freshness.test.ts`
Expected: **PASS**, 5 tests.

- [ ] **Step 5: Commit, then run the deliberately-broken controls**

Commit **before** the controls: they restore with `git checkout --`, which would
otherwise discard Step 3's uncommitted fix.

```bash
npx prettier --write docs/README.md
git add tests/unit/docs-freshness.test.ts docs/README.md
git commit -m "test(g11): index-row <-> **Last Updated** header check

Guarded per spec Decision 1: only files declaring **Last Updated** are
compared, so specs' **Date** stamps are never read. Unguarded this fires
27 rows of which 26 are false; guarded it fires exactly one.

Fixes that one: docs/README.md:38 claimed DONE.md was last updated
2026-08-15 while the file declares 2026-08-17 — recurrence #10, created
by the G13 close-out while this linter sat OVERDUE.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

Now prove both guards have teeth. Paste both FAIL outputs into the task report:

```bash
# Control A — the drift check must catch the drift it was built for
sed -i '38s/2026-08-17/2026-08-15/' docs/README.md
npx vitest run tests/unit/docs-freshness.test.ts   # EXPECT: FAIL, naming DONE.md
git checkout -- docs/README.md

# Control B — non-vacuity. Do NOT try this by mangling row links: rows whose
# target stops existing are dropped by design, and ~7 comparable rows survive,
# so the guard would still pass and the control would prove nothing. Instead
# point DATE_COLUMN at a header no table uses, which empties `comparable`.
sed -i 's/const DATE_COLUMN = "Last Updated";/const DATE_COLUMN = "Last Modified";/' tests/unit/docs-freshness.test.ts
npx vitest run tests/unit/docs-freshness.test.ts   # EXPECT: FAIL on "finds a non-empty set of comparable rows"
git checkout -- tests/unit/docs-freshness.test.ts

npx vitest run tests/unit/docs-freshness.test.ts   # EXPECT: PASS, 5 tests
git status --porcelain                             # EXPECT: empty — controls left nothing behind
```

If Control B does **not** fail, the non-vacuity guard is not wired to
`comparable` — fix it before continuing. A guard that cannot fail is
indistinguishable from one that passes.

---

### Task 2: Reverse coverage — every doc in scope has an index row

**Files:**

- Modify: `tests/unit/docs-freshness.test.ts` (append a `describe`)
- Modify: `docs/README.md` (add 9 rows to the Archived Plans table)

**Interfaces:**

- Consumes: `walkDocs`, `rowTarget`, `INDEX` from Task 1.
- Produces: `INDEXED_DIRS`, `INDEXED_ROOT_DOCS`, `INDEX_EXEMPT` consts; nothing later depends on them.

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/docs-freshness.test.ts`:

```ts
// Directories whose every .md must appear in the index. Walked recursively, so
// docs/planning/audits/ and docs/planning/plans/ are covered by docs/planning.
// Deliberately NOT listed: docs/design/** (its own README indexes the handoff
// set) and docs/plans/ (a legacy guide directory holding only a README).
const INDEXED_DIRS = [
  "docs/planning",
  "docs/superpowers/specs",
  "docs/archive/plans",
  "docs/api",
  "docs/database",
  "docs/deployment",
  "docs/testing",
];

// Root-level docs that are indexed. docs/README.md is the index itself and is
// not listed here, so it never needs an exemption.
const INDEXED_ROOT_DOCS = [
  "docs/ARCHITECTURE.md",
  "docs/PROJECT_CONTEXT.md",
  "docs/TESTING_CHECKLIST.md",
];

// By exact path, never a glob. One entry: archive/plans/README.md is the
// archive directory's own guide, reached from docs/README.md's prose link to
// archive/README.md rather than from a table row.
const INDEX_EXEMPT = new Set(["docs/archive/plans/README.md"]);

describe("every doc in an indexed directory has a docs/README.md row", () => {
  const linked = new Set(
    parseTables(readFileSync(INDEX, "utf8"))
      .map((r) => rowTarget(r.cells[0] ?? ""))
      .filter((t): t is string => t !== null)
  );

  const inScope = [...INDEXED_DIRS.flatMap((d) => walkDocs(d)), ...INDEXED_ROOT_DOCS].filter(
    (f) => !INDEX_EXEMPT.has(f)
  );

  it("finds a non-empty set of in-scope docs", () => {
    expect(inScope.length).toBeGreaterThan(0);
  });

  it("finds a non-empty set of indexed targets", () => {
    expect(linked.size).toBeGreaterThan(0);
  });

  it("every exemption still exists on disk", () => {
    // Stops the exemption set rotting into a list of ghosts that quietly
    // widens what the check ignores.
    const ghosts = [...INDEX_EXEMPT].filter((f) => !existsSync(f));
    expect(ghosts, `Exempt paths no longer on disk:\n${ghosts.join("\n")}`).toEqual([]);
  });

  it("every in-scope doc is indexed", () => {
    const missing = inScope.filter((f) => !linked.has(f));
    expect(missing, `Docs with no docs/README.md row:\n${missing.join("\n")}`).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/docs-freshness.test.ts`

Expected: **FAIL** on "every in-scope doc is indexed", listing exactly these 9:

```
docs/archive/plans/2026-02-10_task-030-documentation-finalization.md
docs/archive/plans/2026-08-04_g1-cart-drawer-restyle.md
docs/archive/plans/2026-08-06_g2-checkout-restyle.md
docs/archive/plans/2026-08-08_g3-params-fix.md
docs/archive/plans/2026-08-08_g4-peripheral-surfaces.md
docs/archive/plans/2026-08-10_g5-transactional-emails.md
docs/archive/plans/2026-08-14_task-039-i18n-foundation.md
docs/archive/plans/2026-08-15_g14-rebrand-residuals.md
docs/archive/plans/2026-08-16_g13-admin-translation.md
```

If the list differs, stop and reconcile before editing anything — a tenth entry means the allowlist or exemption set is wrong, not that a row is missing.

- [ ] **Step 3: Add the 9 rows**

Add to `docs/README.md`'s **Archived Plans** table, in filename order, keeping the existing 4-column shape (`Plan | Task | Status | Completed`).

**The `Completed` dates below are already verified** against `docs/planning/DONE.md`, whose authoritative value is the bracketed date in each entry's `### [YYYY-MM-DD]` heading — **not** the plan's filename date, which differs for `task-030` (file `2026-02-10`, completed `2026-02-11`) and for four of the G-groups. Use these values verbatim; if you re-derive any of them and get a different answer, stop and report rather than "correcting" the table:

```markdown
| [2026-02-10_task-030-documentation-finalization.md](archive/plans/2026-02-10_task-030-documentation-finalization.md) | TASK-030 Documentation Finalization | COMPLETE | 2026-02-11 |
| [2026-08-04_g1-cart-drawer-restyle.md](archive/plans/2026-08-04_g1-cart-drawer-restyle.md) | G1 Cart & Drawer Restyle | COMPLETE | 2026-08-04 |
| [2026-08-06_g2-checkout-restyle.md](archive/plans/2026-08-06_g2-checkout-restyle.md) | G2 Checkout Restyle → COD | COMPLETE | 2026-08-07 |
| [2026-08-08_g3-params-fix.md](archive/plans/2026-08-08_g3-params-fix.md) | G3 Dynamic Route Params Fix | COMPLETE | 2026-08-08 |
| [2026-08-08_g4-peripheral-surfaces.md](archive/plans/2026-08-08_g4-peripheral-surfaces.md) | G4 Peripheral Surfaces Sweep | COMPLETE | 2026-08-09 |
| [2026-08-10_g5-transactional-emails.md](archive/plans/2026-08-10_g5-transactional-emails.md) | G5 Transactional Emails | COMPLETE | 2026-08-10 |
| [2026-08-14_task-039-i18n-foundation.md](archive/plans/2026-08-14_task-039-i18n-foundation.md) | G9 TASK-039 i18n Foundation | COMPLETE | 2026-08-15 |
| [2026-08-15_g14-rebrand-residuals.md](archive/plans/2026-08-15_g14-rebrand-residuals.md) | G14 Rebrand Residuals | COMPLETE | 2026-08-15 |
| [2026-08-16_g13-admin-translation.md](archive/plans/2026-08-16_g13-admin-translation.md) | G13 Admin Translation & Alignment | COMPLETE | 2026-08-17 |
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/unit/docs-freshness.test.ts`
Expected: **PASS**, 9 tests. Note the rows are in a table with no `Last Updated` column, so Task 1's check correctly ignores them.

- [ ] **Step 5: Commit, then run the deliberately-broken controls**

Commit **before** the controls: they restore with `git checkout --`, which would
otherwise discard Step 3's nine uncommitted rows.

```bash
npx prettier --write docs/README.md
git add tests/unit/docs-freshness.test.ts docs/README.md
git commit -m "test(g11): reverse coverage check + 9 missing archive rows

Settles the open convention in BACKLOG [2026-08-09]: WEEKLY-group plans
are indexed alongside TASK-* ones. Adds the 9 archived plans that were on
disk with no index row (task-030, g1-g5, task-039, g14, g13).

Scope is an explicit directory allowlist with one exact-path exemption;
without it the check fires 13 rows of which 4 are wrong.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

Then both controls, pasting each FAIL output into the task report:

```bash
# Control A — a deleted row must be named
sed -i '/2026-08-16_g13-admin-translation\.md/d' docs/README.md
npx vitest run tests/unit/docs-freshness.test.ts   # EXPECT: FAIL naming g13
git checkout -- docs/README.md

# Control B — a ghost exemption must be rejected, so the exemption set
# cannot rot into a list that silently widens what the check ignores
sed -i 's|const INDEX_EXEMPT = new Set(\["docs/archive/plans/README.md"\]);|const INDEX_EXEMPT = new Set(["docs/archive/plans/README.md", "docs/archive/plans/NOPE.md"]);|' tests/unit/docs-freshness.test.ts
npx vitest run tests/unit/docs-freshness.test.ts   # EXPECT: FAIL on "every exemption still exists on disk"
git checkout -- tests/unit/docs-freshness.test.ts

npx vitest run tests/unit/docs-freshness.test.ts   # EXPECT: PASS
git status --porcelain                             # EXPECT: empty
```

---

### Task 3: The index's own header must not lag the rows it lists

**Files:**

- Modify: `tests/unit/docs-freshness.test.ts` (append a `describe`)

**Interfaces:**

- Consumes: `indexRows`, `readStamp`, `INDEX`, `DATE_COLUMN` from Task 1.
- Produces: nothing consumed later.

This closes the half of the class behind recurrences #8 and #9 — a row bumped without `docs/README.md`'s own header following, or vice versa.

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/docs-freshness.test.ts`:

```ts
describe("docs/README.md's own header is at least as new as every date it lists", () => {
  const own = readStamp(INDEX).lastUpdated;

  const listed = indexRows.flatMap((row) => {
    const di = row.header.indexOf(DATE_COLUMN);
    if (di < 0) return [];
    const d = (row.cells[di] ?? "").match(/\d{4}-\d{2}-\d{2}/)?.[0];
    return d ? [{ line: row.line, date: d }] : [];
  });

  it("the index declares its own **Last Updated**", () => {
    expect(own).not.toBeNull();
  });

  it("finds a non-empty set of listed dates", () => {
    expect(listed.length).toBeGreaterThan(0);
  });

  it("no listed date is newer than the index's own header", () => {
    // ISO yyyy-mm-dd compares correctly as a string.
    const ahead = listed
      .filter((l) => l.date > own!)
      .map((l) => `${INDEX}:${l.line} lists ${l.date}, but the index header says ${own}`);
    expect(ahead, `Index header lags its rows:\n${ahead.join("\n")}`).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it passes immediately**

Run: `npx vitest run tests/unit/docs-freshness.test.ts`
Expected: **PASS**, 17 tests (14 already in the file + your 3). This check is green on arrival — the index header is `2026-08-17`, the newest listed `Last Updated` is `2026-08-16`. That is the expected state, not a missed bug; Step 3 is what proves the check works.

- [ ] **Step 3: Run the deliberately-broken control**

A check that is green on arrival is worthless until it has been shown to fail:

```bash
# Roll the index's own header back behind its newest row
sed -i '5s/2026-08-17/2026-08-01/' docs/README.md
npx vitest run tests/unit/docs-freshness.test.ts   # EXPECT: FAIL, naming the rows ahead of it
sed -i '5s/2026-08-01/2026-08-17/' docs/README.md
npx vitest run tests/unit/docs-freshness.test.ts   # EXPECT: PASS
```

Paste the FAIL output into the commit message. Without it there is no evidence this check does anything.

- [ ] **Step 4: Commit**

```bash
git add tests/unit/docs-freshness.test.ts
git commit -m "test(g11): index self-header must not lag its rows

Closes the recurrence #8/#9 half of the class: a row bumped without
docs/README.md's own **Last Updated** following. Green on arrival, so the
deliberately-broken control output is the evidence -- see below.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Prettier fixed-point assertion

**Files:**

- Modify: `tests/unit/docs-freshness.test.ts` (append a `describe`)

**Interfaces:**

- Consumes: `walkDocs` from Task 1.
- Produces: nothing consumed later.

CI's `format:check` already runs `prettier --check` over `**/*.md`, so a plain check adds nothing. What is **not** covered is idempotency: PR #32 `53fa347` hit a state `--write` could not reach a fixed point on (an inline code span carrying list-marker syntax across a wrapped line), and CI failed on a file the formatter had just fixed. This check asserts `format(format(x)) === format(x)`.

- [ ] **Step 1: Write the failing test**

Append the `describe` to `tests/unit/docs-freshness.test.ts`, but **put the `import` line in the existing import block at the top of the file** — a mid-file import is legal ESM but trips `import/first` and reads badly. Note the Prettier 3 API is async, and `resolveConfig` must be used so the repo's `.prettierrc` applies:

```ts
// ↑ belongs with the other imports at the top of the file, not here
import * as prettier from "prettier";

describe("prettier reaches a fixed point on every doc", () => {
  const docs = walkDocs();

  it("finds a non-empty set of docs", () => {
    expect(docs.length).toBeGreaterThan(0);
  });

  it.each(docs)("%s formats to a fixed point", async (file) => {
    const options = { ...(await prettier.resolveConfig(file)), filepath: file };
    const once = await prettier.format(readFileSync(file, "utf8"), options);
    const twice = await prettier.format(once, options);
    expect(twice, `prettier --write is not idempotent on ${file}`).toBe(once);
  });
});
```

- [ ] **Step 2: Run the test to verify it passes**

Run: `npx vitest run tests/unit/docs-freshness.test.ts`
Expected: **PASS**. Verified during design: the tree is currently idempotent and `--check` clean.

The reported test count jumps sharply here and that is correct, not a bug: `it.each(docs)` registers **one test per doc**, and `docs/` currently holds 71 `.md` files — so expect roughly 17 + 1 + 71 ≈ 89 tests, not a handful. Do not "fix" the fan-out into a single loop inside one test; per-file tests are what make the failure message name the offending file.

If it is slow, that is expected — it formats every doc twice. Do not add a timeout override unless it actually exceeds Vitest's default; report the duration instead.

- [ ] **Step 3: Run the deliberately-broken control**

Reproduce the PR #32 shape — an inline code span holding list-marker syntax across a wrapped line:

```bash
cat >> docs/planning/README.md <<'EOF'

- A wrapped list item quoting `- [ ] README updated if needed` across a line
  break, which Prettier's list parser re-indents on every pass.
EOF
npx vitest run tests/unit/docs-freshness.test.ts   # EXPECT: FAIL on docs/planning/README.md
git checkout docs/planning/README.md
npx vitest run tests/unit/docs-freshness.test.ts   # EXPECT: PASS
```

If the control does **not** fail, the oscillation shape has changed in Prettier 3.7.4. Do not silently keep a check you could not make fail — report it, and either find a shape that does oscillate or drop this `describe` and record why.

- [ ] **Step 4: Commit**

```bash
git add tests/unit/docs-freshness.test.ts
git commit -m "test(g11): prettier fixed-point assertion over docs

format:check already covers --check; what it misses is idempotency. PR #32
53fa347 failed CI on a file the formatter had just fixed. Asserts
format(format(x)) === format(x). Control output below.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Broken internal-link check, and the 4 real broken links

**Files:**

- Modify: `tests/unit/docs-freshness.test.ts` (append a `describe`)
- Modify: `docs/planning/DONE.md:241`, `:672`, `:852`
- Modify: `docs/plans/README.md:9`, `:60`

**Interfaces:**

- Consumes: `walkDocs` from Task 1.
- Produces: `extractLinks(md: string): string[]`; nothing later consumes it.

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/docs-freshness.test.ts`:

````ts
// Four parser guards, each earned by a false positive it removed. Without all
// four this check reports 18 broken links against a tree that has 4:
//   1. fenced code blocks   — the Directory Structure diagram is not links
//   2. inline code spans    — archive/plans/2026-07-27_task-057-design-adoption.md:1506
//                             quotes a link destined for a file in specs/, where
//                             the path is correct; resolving it against the
//                             quoting file's own directory is simply wrong
//   3. <...> autolink form  — [text](<path/(with)/parens>) is valid markdown
//   4. decodeURIComponent   — "Mirox%20Cart.dc.html" is a real file with a space
function extractLinks(md: string): string[] {
  const clean = md.replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "");
  return [...clean.matchAll(/\[[^\]]*\]\((?:<([^>]+)>|([^)\s]+))\)/g)].map((m) => m[1] ?? m[2]);
}

describe("every relative link in docs/** resolves", () => {
  const checks = walkDocs().flatMap((file) =>
    extractLinks(readFileSync(file, "utf8"))
      .filter((t) => !/^(https?:|mailto:|#)/.test(t))
      .map((target) => ({ file, target, path: target.split("#")[0] }))
      .filter((c) => c.path !== "")
      .map((c) => ({ ...c, abs: resolve(dirname(c.file), decodeURIComponent(c.path)) }))
  );

  it("finds a non-empty set of relative links", () => {
    expect(checks.length).toBeGreaterThan(0);
  });

  it("every relative link target exists", () => {
    const broken = checks.filter((c) => !existsSync(c.abs)).map((c) => `${c.file} -> ${c.target}`);
    expect(broken, `Broken relative links:\n${broken.join("\n")}`).toEqual([]);
  });
});
````

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/docs-freshness.test.ts`

Expected: **FAIL** listing exactly 4:

```
docs/planning/DONE.md -> ../audits/2026-08-04-storefront-staleness-audit.md
docs/planning/DONE.md -> ../plans/2026-01-05_dropshipping-mvp-plan.md
docs/planning/DONE.md -> ../plans/2026-01-05_dropshipping-mvp-plan.md
docs/plans/README.md -> ../../.claude/TEMPLATES/plan.md
```

If `2026-07-27_task-057-design-adoption.md` appears, the inline-code-span guard is missing or wrong — fix the parser, do **not** edit the archived plan.

- [ ] **Step 3: Fix the 4 links**

`docs/planning/DONE.md:241` — `audits/` is a child of `planning/`, so `../` is wrong:

```markdown
**Audit**: [2026-08-04-storefront-staleness-audit.md](audits/2026-08-04-storefront-staleness-audit.md) — G2/G4 definitive scope + TASK-056 content gaps
```

`docs/planning/DONE.md:672` and `:852` — the MVP plan was archived to `archive/plans/`. This is BACKLOG [2026-07-18] "Two stale plan links in DONE.md". Fix the link **text** as well as the target, both lines identically:

```markdown
**Plan Document**: [docs/archive/plans/2026-01-05_dropshipping-mvp-plan.md](../archive/plans/2026-01-05_dropshipping-mvp-plan.md)
```

`docs/plans/README.md:60` — the template is real but lives at the **user-global** `~/.claude/TEMPLATES/plan.md`; there is no `.claude/TEMPLATES/` in this repo, so a repo-relative link is broken for every checkout. Reword to prose rather than repathing:

```markdown
_Template: `plan.md` in the user-level `~/.claude/TEMPLATES/` directory (not tracked in this repo)._
```

`docs/plans/README.md:9` — not a link (it is inside a code span, so the checker never saw it) but it asserts the same wrong location. Correct it in the same commit so the file stops contradicting itself:

```markdown
1. Use template: `~/.claude/TEMPLATES/plan.md` (user-level, not tracked in this repo)
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/unit/docs-freshness.test.ts`
Expected: **PASS**, all tests.

- [ ] **Step 5: Commit, then run the deliberately-broken controls**

Commit **before** the controls: they restore with `git checkout --`, which would
otherwise discard Step 3's uncommitted link fixes.

```bash
npx prettier --write docs/planning/DONE.md docs/plans/README.md
git add tests/unit/docs-freshness.test.ts docs/planning/DONE.md docs/plans/README.md
git commit -m "test(g11): broken-link check + fix 4 real broken links

Independently rediscovers BACKLOG [2026-07-18] 'Two stale plan links in
DONE.md', open since July -- its filed line numbers (:245, :425) had since
shifted to :672/:852, which is exactly why a linter beats a filed coordinate.

Four parser guards keep this at 4 findings instead of 18.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

Then both controls, pasting each FAIL output into the task report:

```bash
# Control A — a genuinely broken link must be caught
sed -i '241s|](audits/|](../audits/|' docs/planning/DONE.md
npx vitest run tests/unit/docs-freshness.test.ts   # EXPECT: FAIL naming DONE.md
git checkout -- docs/planning/DONE.md

# Control B — the inline-code-span guard must be load-bearing. Delete only that
# one .replace(...) call from extractLinks and the count rises by one.
npx vitest run tests/unit/docs-freshness.test.ts   # EXPECT: FAIL naming 2026-07-27_task-057-design-adoption.md
git checkout -- tests/unit/docs-freshness.test.ts

npx vitest run tests/unit/docs-freshness.test.ts   # EXPECT: PASS
git status --porcelain                             # EXPECT: empty
```

---

### Task 6: Record the conventions, and verify the whole suite

**Files:**

- Modify: `docs/README.md` (the "Adding New Documentation" / "Updating Documentation" sections)
- Modify: `docs/planning/BACKLOG.md` (mark the three resolved entries)

**Interfaces:**

- Consumes: everything above.
- Produces: the completion evidence.

The spec settles two conventions that currently live only in the spec. `docs/README.md` is the live doc that states the indexing rule, so it must carry them or the next author will not know.

- [ ] **Step 1: Record the conventions in the index's own instructions**

In `docs/README.md`, under "Adding New Documentation", replace step 3 and add a fourth:

```markdown
3. Include a `**Last Updated**: YYYY-MM-DD` line in the document — **except** design specs under
   `superpowers/specs/`, which carry `**Date**:` (the authoring date, which must not track edits).
   `tests/unit/docs-freshness.test.ts` compares this line against the index row above; a document
   with no `**Last Updated**` line is skipped, never failed.
4. Link from related documents
```

Under "Updating Documentation", append:

```markdown
4. Bump this file's own `**Last Updated**` too — the linter requires it to be at least as new as
   every date it lists
```

- [ ] **Step 2: Mark the resolved BACKLOG entries**

Three entries are closed by this work. Follow the existing in-place resolution style (strikethrough heading + a bold **RESOLVED in G11 (PR #NN, merged `<sha>`, 2026-08-17)** clause), leaving the body intact:

1. `[2026-07-18] From: TASK-034 PR #19 reviews` — "Automate the `docs/README.md` index-freshness check"
2. `[2026-08-01] From: PR #26 review` — "Automate the `docs/README.md` ↔ doc-header `Last Updated` consistency check (7th recurrence)"
3. `[2026-08-09] From: G4 completion` — "WEEKLY-group archived plans missing from docs/README.md's Archived Plans table"

Also mark the "Two stale plan links in `DONE.md`" entry (`[2026-07-18] From: TASK-034 Task 12`) resolved by Task 5, and the `[2026-02-10]` "Link checker in CI" item checked off.

Leave the PR/SHA placeholders to be filled at close-out; do **not** invent a SHA.

- [ ] **Step 3: Full verification sweep**

Run each, and record the actual output — not a claim that it passed:

```bash
npm run test:run          # whole suite; note the new total vs the previous 701
npm run typecheck
npm run lint
npm run format:check
```

- [ ] **Step 4: Confirm the guarded audit is at zero and the naive one is not reachable**

```bash
# Every check green, and no code path reads **Date** for a comparison:
grep -n 'readStamp\|\.date' tests/unit/docs-freshness.test.ts
# EXPECT: `date` appears only in the Stamp interface and readStamp's return —
# never in a comparison. If a comparison reads `.date`, Decision 1 is violated.
```

- [ ] **Step 5: Commit**

```bash
npx prettier --write docs/README.md docs/planning/BACKLOG.md
git add docs/README.md docs/planning/BACKLOG.md
git commit -m "docs(g11): record the two settled conventions + close 3 BACKLOG entries

The index's own instructions now state the specs-carry-**Date** rule and the
self-header requirement, so the next author learns them from the live doc
rather than the spec.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Notes for the executor

- **The tree moves under you.** Re-read `git status -sb` before any docs edit; the user merges and commits in this same checkout.
- **`Edit` fails on NBSP-bearing lines** in this repo — use `sed` with `\xc2\xa0` byte patterns if you hit one.
- **Do not widen an exemption set to make a test pass.** Every exemption added beyond the one in Task 2 must be justified in a comment and raised for review — hiding real drift behind an exemption is the failure mode this whole task exists to prevent.
- **If a control does not fail, the check is not trustworthy.** Report it rather than proceeding; a check that cannot fail is indistinguishable from one that passes.
