import { readdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Live deployment docs quote strings that source files emit — build-log lines an
 * operator is told to look for, the robots.txt disallow list. Those quotes drift
 * exactly the way a plan's embedded snippets do, and for the same reason: a doc
 * that QUOTES code shares no keyword with the change that invalidates it.
 *
 * tests/unit/plan-snippets.test.ts covers the same hazard for active plans, but
 * a plan is archived at close-out and stops being checked by design. The runbook
 * is the opposite: it outlives the task and is executed during a production
 * cutover, which is the one moment nobody is reading diffs. So it needs its own
 * guard, and the quotes here are inline backticked strings rather than fenced
 * blocks — a different extraction, not a wider glob.
 *
 * Both checks derive the expected strings FROM the source, so coverage grows on
 * its own: no hand-maintained list to forget to extend.
 */
const DOCS_DIR = "docs/deployment";
const SHELL_DIR = "scripts";
const ROBOTS = "src/app/robots.ts";

function deploymentDocs(): { path: string; text: string }[] {
  return readdirSync(DOCS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => ({ path: join(DOCS_DIR, f), text: readFileSync(join(DOCS_DIR, f), "utf8") }));
}

/** Every string literal any shell script echoes. */
function echoedStrings(): string[] {
  return readdirSync(SHELL_DIR)
    .filter((f) => f.endsWith(".sh"))
    .flatMap((f) => [...readFileSync(join(SHELL_DIR, f), "utf8").matchAll(/echo\s+"([^"]*)"/g)])
    .map((m) => m[1]);
}

/**
 * A backticked span opening with ▶ ✓ or ⚠ is a build-log line being quoted.
 * Prose never starts with those, so extraction needs no allowlist and any new
 * quote is picked up automatically.
 */
function quotedLogLines(text: string): string[] {
  return [...text.matchAll(/`([▶✓⚠][^`]*)`/g)].map((m) => m[1]);
}

describe("deployment docs quote source accurately", () => {
  const docs = deploymentDocs();
  const echoes = echoedStrings();

  it("has docs and shell output to compare", () => {
    // Guards the guard: empty extraction on either side would pass forever.
    expect(docs.length).toBeGreaterThan(0);
    expect(echoes.length).toBeGreaterThan(0);
  });

  it("quotes only build-log lines the scripts actually emit", () => {
    const quotes = docs.flatMap(({ path, text }) =>
      quotedLogLines(text).map((quote) => ({ path, quote }))
    );
    expect(quotes.length).toBeGreaterThan(0);

    // A doc quotes a recognisable prefix, not always the whole echo, so the
    // quote must be a contiguous substring of some emitted line. Reword the
    // echo and the doc sends an operator hunting for a line that never prints.
    const missing = quotes
      .filter(({ quote }) => !echoes.some((e) => e.includes(quote)))
      .map(({ path, quote }) => `${path}: no script emits "${quote}"`);
    expect(missing).toEqual([]);
  });

  it("reproduces every robots.txt disallow entry", () => {
    const block = readFileSync(ROBOTS, "utf8").match(/disallow:\s*\[([^\]]*)\]/);
    expect(block).not.toBeNull();
    const entries = [...block![1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    expect(entries.length).toBeGreaterThan(0);

    const runbook = readFileSync(join(DOCS_DIR, "launch-runbook.md"), "utf8");
    // Fails in both directions: a renamed entry stops matching, and a NEW entry
    // added to robots.ts fails until the runbook lists it too.
    const absent = entries.filter((e) => !runbook.includes(`\`${e}\``));
    expect(absent).toEqual([]);
  });
});

/**
 * Everything a deployment doc quotes in backticks that names something real —
 * an npm script an operator types, a repo file they open — must still resolve.
 * The runbook is executed during a production cutover, the one moment nobody is
 * reading diffs, so an instruction naming a script that was renamed sends them
 * hunting mid-outage.
 *
 * Expectations come from package.json and the filesystem, never a hand list, so
 * coverage grows by itself. The single exemption is derived from the doc's own
 * words rather than an allowlist: a path under a heading or on a line saying
 * "Not Yet Implemented" is describing future work, and starts being checked the
 * moment that marker is removed.
 */
const NOT_YET = /not yet implemented/i;

interface Quote {
  doc: string;
  line: number;
  text: string;
  exempt: boolean;
}

function quotedSpans(): Quote[] {
  const out: Quote[] = [];
  for (const file of readdirSync(DOCS_DIR).filter((f) => f.endsWith(".md"))) {
    const doc = join(DOCS_DIR, file);
    let section = "";
    readFileSync(doc, "utf8")
      .split("\n")
      .forEach((line, i) => {
        if (/^#{2,4} /.test(line)) section = line;
        for (const text of line.match(/`[^`\n]+`/g) ?? []) {
          out.push({
            doc,
            line: i + 1,
            text: text.slice(1, -1),
            exempt: NOT_YET.test(line) || NOT_YET.test(section),
          });
        }
      });
  }
  return out;
}

const quotes = quotedSpans();
const npmScripts = new Set(
  Object.keys(JSON.parse(readFileSync("package.json", "utf8")).scripts ?? {})
);

describe("deployment docs name things that still exist", () => {
  const scriptQuotes = quotes.flatMap((q) =>
    [...q.text.matchAll(/npm run ([a-z0-9:-]+)/g)].map((m) => ({ ...q, script: m[1] }))
  );
  const pathQuotes = quotes.filter((q) => /^[\w./-]+\.(ts|tsx|sh|mjs)$/.test(q.text));

  it("has npm-script and file-path quotes to check", () => {
    // Guards the guard: an extraction that silently matched nothing would pass
    // forever — the same shape as a fence that is never diffed.
    expect(scriptQuotes.length).toBeGreaterThan(0);
    expect(pathQuotes.length).toBeGreaterThan(0);
  });

  it("quotes only npm scripts that package.json defines", () => {
    const missing = scriptQuotes
      .filter((q) => !npmScripts.has(q.script))
      .map((q) => `${q.doc}:${q.line}  npm run ${q.script} is not a package.json script`);
    expect(missing).toEqual([]);
  });

  it("quotes only repo paths that exist, unless marked not yet implemented", () => {
    const missing = pathQuotes
      .filter((q) => !q.exempt && !existsSync(q.text))
      .map((q) => `${q.doc}:${q.line}  ${q.text} does not exist`);
    expect(missing).toEqual([]);
  });
});
