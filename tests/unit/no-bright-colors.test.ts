import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

// Surfaces TASK-034 cleaned; these must never carry bright color utilities.
//
// Within src/app/(shop), only home / catalog / product / cart (page.tsx et al.) are
// deliberately NOT in this list — they're rebuilt by TASK-035 / 036 / 037 / 043 and
// may legitimately still contain bright colors until those land. Every other
// customer-facing route group IS scanned, specifically because none of them has a
// rebuild task of its own to inherit the obligation: `(shop)/account` (Task 10
// neutralized its one offender, account/orders/[id]/page.tsx), `(shop)/checkout`
// (this task neutralized its one offender, checkout/confirmation/page.tsx), and the
// whole `(auth)` group (login/register — verified clean, no changes needed). Do not
// mistake any of these three for oversights, and do not add the deferred (shop)
// page routes above without a corresponding cleanup task landing first.
//
// Also deliberately NOT in this list, for unrelated reasons:
// - src/app/(admin) — admin is inheriting design tokens but is not being restyled
//   by TASK-034; it still has bright status/payment chips by design.
// - src/components/ui/ — shadcn primitives. Token-driven and managed by the shadcn
//   CLI, not hand-edited.
// - src/app/showcase and the .bold/.luxury/.organic theme blocks — the showcase
//   demo intentionally keeps its bright theme variants.
const SCAN_PATHS = [
  "src/components/common",
  "src/components/reviews",
  "src/components/products",
  "src/components/shop",
  "src/components/checkout",
  "src/app/newsletter",
  "src/lib/order-status.ts",
  "src/app/not-found.tsx",
  "src/app/(shop)/account",
  "src/app/(shop)/checkout",
  "src/app/(auth)",
];

// Numbered bright-hue utilities across every color-bearing utility prefix. gray /
// slate / zinc / neutral / stone are hueless neutrals, not "bright" colors, and are
// intentionally left out of the hue alternation below — they're in scope for the
// design system but not for this guard. The sanctioned destructive red is applied
// via the `--destructive` token (text-destructive, bg-destructive, ...), never a
// numbered utility like red-500, so token usage never trips this pattern.
const BRIGHT =
  /\b(?:bg|text|border|from|to|via|ring|fill|stroke|divide|outline|shadow|accent|caret|decoration)-(?:red|blue|green|yellow|amber|orange|purple|indigo|pink|emerald|teal|cyan|sky|violet|rose|lime|fuchsia)-\d{2,3}\b/;

function walk(path: string): string[] {
  const st = statSync(path);
  if (st.isFile()) return path.match(/\.(tsx?|css)$/) ? [path] : [];
  return readdirSync(path).flatMap((entry) => walk(join(path, entry)));
}

describe("no bright colors in customer-facing scope", () => {
  const files = SCAN_PATHS.flatMap(walk).filter((f) => !f.includes(".test."));

  // Guard against a vacuous pass: it.each([]) below would register zero tests and
  // the suite would go green while checking nothing — the worst failure mode for a
  // regression guard (e.g. a renamed/moved SCAN_PATHS directory silently disarms
  // it). Fail loudly instead if the file list is ever empty.
  it("scans a non-empty set of files", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)("%s has no bright color utilities", (file) => {
    const lines = readFileSync(file, "utf8").split("\n");
    const hits = lines
      .map((line, i) => ({ line, n: i + 1 }))
      .filter(({ line }) => BRIGHT.test(line))
      .map(({ n, line }) => `${file}:${n}  ${line.trim()}`);
    expect(hits, `Bright color utilities found:\n${hits.join("\n")}`).toEqual([]);
  });
});
