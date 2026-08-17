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
