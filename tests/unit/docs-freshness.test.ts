import { describe, it, expect } from "vitest";
import {
  readFileSync,
  readdirSync,
  statSync,
  existsSync,
  writeFileSync,
  unlinkSync,
} from "node:fs";
import { join, dirname, resolve, relative } from "node:path";
import { tmpdir } from "node:os";
import * as prettier from "prettier";

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

// Blank out fenced code blocks character-by-character, never line-by-line —
// deleting lines would shift every subsequent TableRow.line, which is used in
// failure messages and must stay accurate. Non-greedy across `[\s\S]` so
// multiple fences in one doc are handled separately; an unclosed fence simply
// doesn't match and is left as ordinary text (same behavior as extractLinks'
// fence handling near the bottom of this file — that helper discards
// newlines too, which is fine there since it has no line numbers to protect).
function blankFences(md: string): string {
  return md.replace(/```[\s\S]*?```/g, (block) => block.replace(/[^\n]/g, ""));
}

// Exactly ONE kind of `|` on a table line is content rather than a separator:
// a backslash-escaped `\|`. Splitting on it invents a column and would trip the
// malformed-row assertion below on valid markdown, so it is masked to a
// sentinel, split around, then restored — dropping the backslash, so
// `literal \| pipe` yields `literal | pipe`.
//
// A raw `|` inside an inline code span is NOT content. GFM requires the escape
// "including inside other inline spans", and this repo's own prettier/remark-gfm
// confirms it: a row containing a code span with a raw pipe renders as FOUR
// cells against a three-cell header, on GitHub and under `prettier --write`
// alike. Such a row is genuinely malformed and MUST still split — masking it
// would convert a true positive into a false negative and silence the very
// assertion below that exists to catch a stray unescaped `|`. House style
// already follows the rule: all 19 table rows under docs/ that carry a pipe
// inside a code span write it as the escaped form.
//
// (A previous revision masked code spans too, on a premise stated as fact and
// since disproved by running prettier against it. Corrected 2026-08-17.)
const PIPE_SENTINEL = "\u0000";

function splitCells(line: string): string[] {
  return line
    .replace(/\\\|/g, PIPE_SENTINEL)
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.split(PIPE_SENTINEL).join("|").trim());
}

// A plain for-loop rather than forEach so the line index is in scope for
// TableRow.line without threading it through a callback.
function parseTables(md: string): TableRow[] {
  const rows: TableRow[] = [];
  let header: string[] | null = null;
  const lines = blankFences(md).split("\n");
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (!t.startsWith("|")) {
      header = null; // a non-table line ends the current table
      continue;
    }
    if (/^\|[\s:|-]+\|$/.test(t)) continue; // separator row
    const cells = splitCells(t);
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
  // several planning docs carry no stamp at all. Spec §1.1 / Decision 1.
  //
  // Scale of what it suppresses, measured at d845473 (this branch's merge base,
  // before its own fixes): dropping the stamp guard AND selecting date columns
  // positionally took the audit from 1 real finding to 27 fires, 26 of them
  // false. Treat that as a dated historical measurement, not a live invariant —
  // the exact number depends on which guard you drop and on how many docs exist,
  // and this branch both fixed the one real finding and added ~1000 doc lines.
  // Re-measuring at HEAD gives a different figure and a guarded result of 0,
  // which is the point: 0 is what a clean tree looks like.
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
    //
    // Non-vacuity floor for THIS assertion, added in the final whole-branch
    // review (M5): its discriminating power depends on spec rows being
    // CANDIDATES for `comparable` at all — i.e. rows whose target is under
    // superpowers/specs/ and whose table has a literal "Last Updated" column
    // with a date in it. If specs ever moved to a table without that column,
    // "no spec rows entered comparable" would pass forever regardless of the
    // code — the same shape as the vacuous-pass bug fixed at 04afe43.
    const specCandidateRows = indexRows.filter((row) => {
      const di = row.header.indexOf(DATE_COLUMN);
      if (di < 0) return false;
      const target = rowTarget(row.cells[0] ?? "");
      if (!target || !target.includes("superpowers/specs/")) return false;
      return /\d{4}-\d{2}-\d{2}/.test(row.cells[di] ?? "");
    });
    expect(specCandidateRows.length).toBeGreaterThan(0);

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

describe("parseTables / readStamp / rowTarget — synthetic-input coverage", () => {
  // Two tables separated by a heading line: each row must carry its OWN
  // table's header (not the first table's), and `line` must be the correct
  // 1-indexed source line for each data row, not the header/separator lines.
  it("parseTables: two tables separated by a heading line each keep their own header, with correct 1-indexed line numbers", () => {
    const md = [
      "| A | B |",
      "| --- | --- |",
      "| 1 | 2 |",
      "",
      "## Heading",
      "",
      "| C | D |",
      "| --- | --- |",
      "| 3 | 4 |",
    ].join("\n");
    const rows = parseTables(md);
    expect(rows).toEqual([
      { line: 3, header: ["A", "B"], cells: ["1", "2"] },
      { line: 9, header: ["C", "D"], cells: ["3", "4"] },
    ]);
  });

  it("parseTables: a separator row is not returned as a data row", () => {
    const md = ["| A | B |", "| --- | --- |", "| 1 | 2 |"].join("\n");
    const rows = parseTables(md);
    expect(rows).toHaveLength(1);
    expect(rows[0].cells).toEqual(["1", "2"]);
  });

  it("parseTables: a row with more cells than its header is still returned", () => {
    // The malformed-table check depends on seeing the mismatch, not on the
    // parser silently truncating or dropping the extra cell.
    const md = ["| A | B |", "| --- | --- |", "| 1 | 2 | 3 |"].join("\n");
    const rows = parseTables(md);
    expect(rows).toHaveLength(1);
    expect(rows[0].header).toEqual(["A", "B"]);
    expect(rows[0].cells).toEqual(["1", "2", "3"]);
  });

  it("parseTables: an escaped pipe is cell content, but a raw pipe in a code span still splits", () => {
    // GFM requires pipes in table cells to be escaped "including inside other
    // inline spans". Verified against this repo's prettier/remark-gfm: the
    // escaped form survives as one cell; a code span holding a RAW pipe is
    // rendered as an extra column by prettier and by GitHub. So the parser must
    // treat only the escaped form as content. Masking code spans would turn a
    // real malformed row into a silent pass — the failure mode the assertion
    // below exists to prevent.
    const escaped = ["| A | B |", "| --- | --- |", "| x | literal \\| pipe |"].join("\n");
    const rowsEscaped = parseTables(escaped);
    expect(rowsEscaped).toHaveLength(1);
    expect(rowsEscaped[0].cells).toHaveLength(2);
    expect(rowsEscaped[0].cells[1]).toBe("literal | pipe");

    // The raw-pipe-in-code-span row is malformed and must be SEEN as malformed:
    // three cells against a two-cell header.
    const rawInSpan = ["| A | B |", "| --- | --- |", "| x | uses `a|b` here |"].join("\n");
    const rowsRaw = parseTables(rawInSpan);
    expect(rowsRaw).toHaveLength(1);
    expect(rowsRaw[0].cells).toHaveLength(3);
    expect(rowsRaw[0].cells.length).not.toBe(rowsRaw[0].header.length);
  });

  it("no doc contains the pipe sentinel, so masking cannot corrupt a cell", () => {
    // splitCells assumes U+0000 never occurs in these docs. That was this
    // file's only unasserted assumption — and an editing slip did briefly put a
    // literal NUL into this very file, which is the argument for asserting it.
    const carriers = walkDocs().filter((f) => readFileSync(f, "utf8").includes(PIPE_SENTINEL));
    expect(
      carriers,
      `Docs containing U+0000, which splitCells uses as its mask:\n${carriers.join("\n")}`
    ).toEqual([]);
  });

  it("parseTables: a fenced code block's table-shaped content is not read as rows, and line numbers after the fence are unaffected", () => {
    // Guards M6 of the final whole-branch review: docs/README.md's "Adding
    // New Documentation" section is exactly the place someone would add a
    // ```markdown example of a table row, which — unguarded — would either
    // trip the malformed-row check or, with an illustrative date, cause a
    // false drift failure. Without the fence guard this test would find 3
    // rows (the fenced example's header/row leaking in); with it, 2.
    const md = [
      "| A | B |",
      "| --- | --- |",
      "| 1 | 2 |",
      "",
      "```markdown",
      "| Doc | Last Updated |",
      "| --- | --- |",
      "| example.md | 2020-01-01 |",
      "```",
      "",
      "| C | D |",
      "| --- | --- |",
      "| 3 | 4 |",
    ].join("\n");
    const rows = parseTables(md);
    expect(rows).toEqual([
      { line: 3, header: ["A", "B"], cells: ["1", "2"] },
      { line: 13, header: ["C", "D"], cells: ["3", "4"] },
    ]);
  });

  it("readStamp: returns **Date** and **Last Updated** independently, never conflated", () => {
    // Pins Decision 1: a file can carry both stamps, and `date`/`lastUpdated`
    // must never bleed into each other.
    const file = join(
      tmpdir(),
      `docs-freshness-readstamp-${Date.now()}-${Math.random().toString(36).slice(2)}.md`
    );
    writeFileSync(file, "**Date**: 2020-01-01\n**Last Updated**: 2021-02-03\n", "utf8");
    try {
      expect(readStamp(file)).toEqual({ date: "2020-01-01", lastUpdated: "2021-02-03" });
    } finally {
      unlinkSync(file);
    }
  });

  it("rowTarget: null for no link, null for an https:// target, repo-relative path for a relative link", () => {
    expect(rowTarget("no link here")).toBeNull();
    expect(rowTarget("[External](https://example.com/page)")).toBeNull();
    expect(rowTarget("[planning/DONE.md](planning/DONE.md)")).toBe("docs/planning/DONE.md");
  });
});

// Directories whose every .md must appear in the index. Walked recursively, so
// docs/planning/audits/ and docs/planning/plans/ are covered by docs/planning.
// See OUT_OF_SCOPE_DIRS below for directories deliberately excluded instead.
const INDEXED_DIRS = [
  "docs/planning",
  "docs/superpowers/specs",
  "docs/archive/plans",
  "docs/api",
  "docs/database",
  "docs/deployment",
  "docs/testing",
  "docs/reference",
];

// Root-level docs that are indexed. docs/README.md is the index itself and is
// not listed here — it's accounted for instead via OUT_OF_SCOPE_DIRS below, so
// the meta-assertion at the bottom of the next describe block covers it too.
const INDEXED_ROOT_DOCS = [
  "docs/ARCHITECTURE.md",
  "docs/PROJECT_CONTEXT.md",
  "docs/TESTING_CHECKLIST.md",
];

// By exact path, never a glob. One entry: archive/plans/README.md is the
// archive directory's own guide, reached from docs/README.md's prose link to
// archive/README.md rather than from a table row.
const INDEX_EXEMPT = new Set(["docs/archive/plans/README.md"]);

// Directories (or single files) excluded from the index by decision, not
// oversight — each entry records WHY, so the meta-assertion below can tell
// "known and excluded" apart from "silently uncovered." A path matches an
// entry if it equals the key or sits anywhere under it. Overlap with
// INDEXED_DIRS is harmless (e.g. docs/archive/plans/ sits under the
// docs/archive entry here too) — a file only needs to be explained by ONE
// category, checked as an OR below, never partitioned.
const OUT_OF_SCOPE_DIRS: Record<string, string> = {
  "docs/design":
    "handoff artifact directory (design_handoff_mirox/), deliberately out of the index's " +
    "scope — NOT because its own README indexes the set (verified false: the two sibling docs " +
    "are named only inside inline code spans, which Check 5b's link-extraction guard " +
    "deliberately strips, so they were never markdown links in the first place)",
  "docs/plans": "legacy guide directory holding only a README",
  "docs/archive":
    "the archive/ root itself — archive/README.md is a directory guide, reached from " +
    "docs/README.md's prose link, not a table row (archive/plans/ is separately in scope via " +
    "INDEXED_DIRS, so this entry only ever explains docs/archive/README.md in practice)",
  "docs/README.md": "the index itself; it does not index itself",
};

function isOutOfScope(file: string): boolean {
  return Object.keys(OUT_OF_SCOPE_DIRS).some((dir) => file === dir || file.startsWith(`${dir}/`));
}

describe("every doc in an indexed directory has a docs/README.md row", () => {
  const linked = new Set(
    parseTables(readFileSync(INDEX, "utf8"))
      .map((r) => rowTarget(r.cells[0] ?? ""))
      .filter((t): t is string => t !== null)
  );

  const underIndexedDirs = [...INDEXED_DIRS.flatMap((d) => walkDocs(d)), ...INDEXED_ROOT_DOCS];
  const inScope = underIndexedDirs.filter((f) => !INDEX_EXEMPT.has(f));

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

  it("every INDEXED_ROOT_DOCS entry still exists on disk", () => {
    // Symmetric to the exemption ghost check above. Without it, a deleted
    // root doc fails only in "every in-scope doc is indexed" below, with the
    // misleading message "Docs with no docs/README.md row" — misleading
    // because the doc has no row for the mundane reason that it no longer
    // exists, not because someone forgot to index it.
    const ghosts = INDEXED_ROOT_DOCS.filter((f) => !existsSync(f));
    expect(ghosts, `INDEXED_ROOT_DOCS entries no longer on disk:\n${ghosts.join("\n")}`).toEqual(
      []
    );
  });

  it("every in-scope doc is indexed", () => {
    const missing = inScope.filter((f) => !linked.has(f));
    expect(missing, `Docs with no docs/README.md row:\n${missing.join("\n")}`).toEqual([]);
  });

  it("every .md under docs/ is indexed, exempt, or explicitly out of scope", () => {
    // Self-truing meta-assertion, added in the final whole-branch review: a
    // newly-added docs subdirectory that nobody remembers to add to
    // INDEXED_DIRS (or to OUT_OF_SCOPE_DIRS, if excluded on purpose) fails
    // loudly here instead of silently vanishing from every check above —
    // "in-scope" and "out-of-scope" are both opt-IN lists, so a new directory
    // defaults to neither, which is exactly the failure mode this closes.
    const known = new Set([...underIndexedDirs, ...INDEX_EXEMPT]);
    const uncovered = walkDocs().filter((f) => !known.has(f) && !isOutOfScope(f));
    expect(
      uncovered,
      `Docs neither indexed nor explicitly out of scope:\n${uncovered.join("\n")}`
    ).toEqual([]);
  });
});

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
    expect(own, `${INDEX} declares no **Last Updated** header to compare against`).not.toBeNull();
    // ISO yyyy-mm-dd compares correctly as a string.
    const ahead = listed
      .filter((l) => l.date > own!)
      .map((l) => `${INDEX}:${l.line} lists ${l.date}, but the index header says ${own}`);
    expect(ahead, `Index header lags its rows:\n${ahead.join("\n")}`).toEqual([]);
  });
});

// format:check already runs `prettier --check` over **/*.md in CI, so a plain
// check adds nothing. What that misses is idempotency: PR #32 (53fa347) hit a
// state `--write` could not reach a fixed point on (an inline code span
// carrying list-marker syntax across a wrapped line), and CI failed on a file
// the formatter had just "fixed". To reproduce the control for this check,
// don't re-derive a shape by hand — it may no longer oscillate on a newer
// prettier. Use the real pre-fix text instead:
//   git show 53fa347^:docs/planning/TODO.md > docs/design/design_handoff_mirox/image-prompts.md
// (that target is deliberately outside INDEXED_DIRS and carries no
// **Last Updated**/**Date** stamp, so only this describe's check reacts to it)
// then `git checkout -- docs/design/design_handoff_mirox/image-prompts.md` after.
// If that SHA ever becomes unreachable (rebase, shallow clone, history
// rewrite), reconstruct the control by hand instead: the defect's shape was a
// list continuation losing its two-space indent across a wrapped line.
describe("prettier reaches a fixed point on every doc", () => {
  const docs = walkDocs();

  it("finds a non-empty set of docs", () => {
    expect(docs.length).toBeGreaterThan(0);
  });

  // Explicit 30s timeout (3rd arg): the default per-test 5000ms leaves only
  // ~4x headroom over the largest doc today (~1.3s), against files that only
  // grow and CI runners that are typically slower than local. Left as one
  // `it.each` case per doc, not batched into a single test — batching would
  // guarantee hitting whatever timeout is set, since it'd sum every doc's
  // format time into one test instead of budgeting per file.
  it.each(docs)(
    "%s formats to a fixed point",
    async (file) => {
      const options = { ...(await prettier.resolveConfig(file)), filepath: file };
      const once = await prettier.format(readFileSync(file, "utf8"), options);
      const twice = await prettier.format(once, options);
      expect(twice, `prettier --write is not idempotent on ${file}`).toBe(once);
    },
    30_000
  );
});

// Four parser guards, each earned by a specific false positive it removed.
// Measured at d845473 (this branch's merge base): with only the fence guard the
// check reported 18 broken links against a tree that had 4 real ones. As with
// the header-audit figure above, that is a dated historical measurement, not a
// live invariant — it moves with the doc corpus, and this branch fixed all 4,
// so the guarded result at HEAD is 0. What stays true is the reason each guard
// exists:
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
