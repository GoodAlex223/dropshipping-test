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
