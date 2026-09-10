import { readdirSync, readFileSync } from "node:fs";
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
