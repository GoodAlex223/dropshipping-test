import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Active plans embed the code they tell an executor to write. When that code is
 * later revised — by a fix round, or by a PR review — the plan's copy goes stale
 * silently, because a doc that QUOTES code shares no keyword with the change that
 * invalidates it. No phrase-grep can find that by construction, which is how the
 * same drift survived two propagation passes on the G19 plan (PR #45).
 *
 * So this check diffs each embedded snippet against the file it names, rather
 * than searching for known-bad strings. Only ACTIVE plans are checked: archived
 * plans under docs/archive/plans/ are frozen records and are supposed to drift.
 */
const PLANS_DIR = "docs/planning/plans";

/** Nearest preceding non-blank line, e.g. "Append to `scripts/smoke-lib.ts`:" */
function sourcePathAbove(lines: string[], fenceIndex: number): string | null {
  for (let i = fenceIndex - 1; i >= 0 && i > fenceIndex - 6; i--) {
    if (!lines[i].trim()) continue;
    const match = lines[i].match(/`([^`]+\.tsx?)`/);
    return match && existsSync(match[1]) ? match[1] : null;
  }
  return null;
}

interface Snippet {
  plan: string;
  source: string;
  startLine: number;
  body: string[];
}

/**
 * A fence whose heading names no existing source file cannot be diffed, so it
 * would be skipped — and a skipped snippet is exactly the "cannot fail" shape
 * this guard exists to close, one level up. They are collected and asserted
 * empty rather than dropped, so the choice becomes explicit: name the file, or
 * tag an illustrative block as something other than `ts`.
 */
interface Unresolved {
  plan: string;
  line: number;
  heading: string;
}

function collectSnippets(): { found: Snippet[]; unresolved: Unresolved[] } {
  const found: Snippet[] = [];
  const unresolved: Unresolved[] = [];
  for (const file of readdirSync(PLANS_DIR).filter((f) => f.endsWith(".md"))) {
    const plan = join(PLANS_DIR, file);
    const lines = readFileSync(plan, "utf8").split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].startsWith("```ts")) continue;
      let end = i + 1;
      while (end < lines.length && lines[end].trim() !== "```") end++;
      const source = sourcePathAbove(lines, i);
      if (source) {
        found.push({ plan, source, startLine: i + 2, body: lines.slice(i + 1, end) });
      } else {
        const heading = lines.slice(Math.max(0, i - 5), i).filter((l) => l.trim());
        unresolved.push({ plan, line: i + 1, heading: heading[heading.length - 1] ?? "(none)" });
      }
      i = end;
    }
  }
  return { found, unresolved };
}

/**
 * Plans build a test file's import incrementally — Task 1 writes it, later tasks
 * extend it — so an early snippet's import is legitimately narrower than the
 * shipped one. Checked as a subset instead of skipped, so a symbol the plan names
 * that no longer exists still fails.
 */
function importSymbolsMissing(planLine: string, source: string): string[] {
  const named = planLine.match(/^import\s*\{([^}]*)\}/);
  if (!named) return [];
  const sourceImports = source.match(/^import\s*\{[^}]*\}[^;]*;/gm)?.join("\n") ?? "";
  return named[1]
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s && !new RegExp(`\\b${s}\\b`).test(sourceImports));
}

const { found: snippets, unresolved } = collectSnippets();

/**
 * Counted independently of the collector, by the crudest means available, so it
 * cannot share a bug with it. This is what lets the guard-the-guard assertion
 * below tell "the parser matched nothing" apart from "there are no active plans
 * right now" — a legitimate state, since close-out archives a plan the moment
 * its task ships, and this directory is empty between tasks.
 */
function countFences(): number {
  if (!existsSync(PLANS_DIR)) return 0;
  return readdirSync(PLANS_DIR)
    .filter((f) => f.endsWith(".md"))
    .reduce(
      (n, f) =>
        n +
        readFileSync(join(PLANS_DIR, f), "utf8")
          .split("\n")
          .filter((l) => l.startsWith("```ts")).length,
      0
    );
}

const fenceCount = countFences();

describe("plan snippets match the code they quote", () => {
  it("accounts for every ts fence in the active plans", () => {
    // Guards the guard. A parser that silently matched nothing would pass
    // forever — but an empty docs/planning/plans/ is legitimate (close-out
    // archives each plan when its task ships), so asserting "> 0" would fail
    // on a healthy repo between tasks. Comparing against an independent count
    // fails on a broken parser and passes on an empty directory.
    expect(snippets.length + unresolved.length).toBe(fenceCount);
  });

  it("leaves no ts fence unchecked", () => {
    // Every `ts` fence must resolve to a source file, or it is never diffed at
    // all. To fix a failure here: name the file in backticks on the line above
    // the fence, or — if the block is illustrative and quotes no real source —
    // tag it as ```text so it is deliberately out of scope rather than silently
    // skipped.
    expect(unresolved.map((u) => `${u.plan}:${u.line}  heading: ${u.heading}`)).toEqual([]);
  });

  for (const { plan, source, startLine, body } of snippets) {
    it(`${plan}:${startLine} matches ${source}`, () => {
      const text = readFileSync(source, "utf8");
      const sourceLines = new Set(text.split("\n").map((l) => l.trimEnd()));

      const drifted: string[] = [];
      body.forEach((line, offset) => {
        const trimmed = line.trimEnd();
        if (!trimmed.trim()) return;
        if (trimmed.trimStart().startsWith("import ")) {
          for (const symbol of importSymbolsMissing(trimmed.trimStart(), text)) {
            drifted.push(`${plan}:${startLine + offset}  imports missing symbol: ${symbol}`);
          }
          return;
        }
        if (!sourceLines.has(trimmed)) {
          drifted.push(`${plan}:${startLine + offset}  not in ${source}: ${trimmed.trim()}`);
        }
      });

      expect(drifted).toEqual([]);
    });
  }
});
