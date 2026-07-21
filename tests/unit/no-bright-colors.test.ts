import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

// Surfaces TASK-034 and TASK-035 cleaned; these must never carry bright color
// utilities.
//
// Within src/app/(shop), only catalog / product / cart (page.tsx et al.) are
// deliberately NOT in this list — they're rebuilt by TASK-036 / 037 / 043 and
// may legitimately still contain bright colors until those land. The home page
// WAS in that deferred set; TASK-035 rebuilt it, so `(shop)/page.tsx`,
// `src/components/home` and `src/content` joined the scan as part of that task.
// Every other customer-facing route group IS scanned, specifically because none
// of them has a rebuild task of its own to inherit the obligation:
// `(shop)/account` (TASK-034 neutralized its one offender,
// account/orders/[id]/page.tsx), `(shop)/checkout` (TASK-034 neutralized its one
// offender, checkout/confirmation/page.tsx), the whole `(auth)` group
// (login/register — verified clean, no changes needed), and the shared
// root-level files every route tree passes through — `(shop)/layout.tsx`, the
// root `error.tsx`, and the root `layout.tsx` (all three verified clean). Do not
// mistake any of these for oversights, and do not add the remaining deferred
// (shop) page routes above without a corresponding cleanup task landing first.
//
// Also deliberately NOT in this list, for unrelated reasons:
// - src/app/(admin) — admin is inheriting design tokens but is not being restyled
//   by TASK-034. Note its OrderStatus chips ARE already monochrome: both admin
//   orders pages were converted to the shared getOrderStatusStyle() in this task.
//   What remains bright is PAYMENT_STATUS_COLORS (PaymentStatus, admin-only) and
//   the supplier-order status map — both deliberate, both backlogged.
// - src/components/ui/ — shadcn primitives. Token-driven and managed by the shadcn
//   CLI, not hand-edited.
// - src/app/showcase and the .bold/.luxury/.organic theme blocks — the showcase
//   demo intentionally keeps its bright theme variants.
const SCAN_PATHS = [
  "src/components/common",
  "src/components/home",
  "src/components/reviews",
  "src/components/products",
  "src/components/shop",
  "src/components/checkout",
  "src/content",
  "src/app/newsletter",
  "src/lib/order-status.ts",
  "src/app/not-found.tsx",
  "src/app/(shop)/page.tsx",
  "src/app/(shop)/account",
  "src/app/(shop)/checkout",
  "src/app/(shop)/layout.tsx",
  "src/app/(auth)",
  "src/app/error.tsx",
  "src/app/layout.tsx",
];

// Numbered bright-hue utilities across every color-bearing utility prefix. gray /
// slate / zinc / neutral / stone are hueless neutrals, not "bright" colors, and are
// intentionally left out of the hue alternation below — they're in scope for the
// design system but not for this guard. The sanctioned destructive red is applied
// via the `--destructive` token (text-destructive, bg-destructive, ...), never a
// numbered utility like red-500, so token usage never trips this pattern.
//
// `chart` is in the alternation too, even though it isn't a Tailwind hue name:
// `--chart-1` through `--chart-5` are registered as real utilities via `@theme
// inline` in globals.css (`--color-chart-1: var(--chart-1)`, etc.), and `--chart-1`
// itself is chromatic orange (`oklch(0.646 0.222 41.116)`) — intentionally so, for
// admin analytics data-vis, never for a customer-facing surface. A `bg-chart-1` in
// a scanned file is exactly as much a violation as `bg-orange-500` would be, so the
// digit count below is widened to `\d{1,3}` to also match chart's single-digit
// suffixes (1-5) alongside the standard two/three-digit Tailwind shades (50-950).
const BRIGHT =
  /\b(?:bg|text|border|from|to|via|ring|fill|stroke|divide|outline|shadow|accent|caret|decoration)-(?:red|blue|green|yellow|amber|orange|purple|indigo|pink|emerald|teal|cyan|sky|violet|rose|lime|fuchsia|chart)-\d{1,3}\b/;

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

// ---------------------------------------------------------------------------
// Token-layer guard: everything above scans class names in TSX/CSS files. It
// says nothing about globals.css's own custom-property VALUES — if `--primary`
// were changed to a chromatic hex literal directly, no scanned file's class
// names would change, and every test above would stay green while the actual
// color definitions went bright. This block closes that gap by parsing the
// token declarations themselves.
// ---------------------------------------------------------------------------
describe("token-layer color policy (globals.css Mirox tokens are achromatic)", () => {
  const GLOBALS_CSS_PATH = "src/app/globals.css";
  const css = readFileSync(GLOBALS_CSS_PATH, "utf8");

  // Non-color custom properties that legitimately live inside the same :root
  // block as the color tokens (radius, font-family refs, motion timing).
  // They aren't colors at all, so they're exempt rather than expected to
  // pass a color check.
  const NON_COLOR_PROPS = new Set([
    "--radius",
    "--font-heading",
    "--font-body",
    "--font-serif",
    "--ease-mirox",
    "--duration-fast",
    "--duration-base",
    "--duration-slow",
  ]);

  // --chart-1..5 and --sidebar-* are declared inside the very same :root block
  // as the Mirox semantic tokens (they are NOT off in some separate part of
  // the file), but they are deliberately excluded from the Mirox palette
  // check below:
  //   - chart-*  is intentionally chromatic admin-analytics data-vis color
  //     (distinct hues differentiate series on a graph) — see the BRIGHT
  //     regex guard above, which is what actually polices chart tokens
  //     leaking into customer-facing class names.
  //   - sidebar-* is admin chrome. Its oklch values are already achromatic
  //     by inspection (chroma 0 in every entry), but they're expressed as
  //     `oklch(L 0 0)` rather than the Mirox `#RRGGBB` convention this guard
  //     checks, and they're admin-only regardless.
  // Listed by exact property name so the exclusion is explicit and
  // reviewable, not an accidental byproduct of a shape/format guess.
  const ADMIN_ONLY_PROPS = new Set([
    "--chart-1",
    "--chart-2",
    "--chart-3",
    "--chart-4",
    "--chart-5",
    "--sidebar",
    "--sidebar-foreground",
    "--sidebar-primary",
    "--sidebar-primary-foreground",
    "--sidebar-accent",
    "--sidebar-accent-foreground",
    "--sidebar-border",
    "--sidebar-ring",
  ]);

  // The one sanctioned hue: destructive red. Must still resolve to a valid
  // hex color, just not required to be achromatic.
  const SANCTIONED_HUE_PROPS = new Set(["--destructive", "--destructive-foreground"]);

  function extractBlock(selectorPattern: RegExp): string {
    const match = selectorPattern.exec(css);
    if (!match) {
      throw new Error(`Could not find a block matching ${selectorPattern} in ${GLOBALS_CSS_PATH}`);
    }
    return match[1];
  }

  function parseDeclarations(block: string): Array<{ prop: string; value: string }> {
    return block
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("--"))
      .map((line) => {
        const [prop, ...rest] = line.split(":");
        return { prop: prop.trim(), value: rest.join(":").replace(/;\s*$/, "").trim() };
      });
  }

  // Neither block has nested rules inside it (flat custom-property
  // declarations only), so matching up to the first `}` safely captures the
  // whole block. `[data-surface="dark"]` is reused later in the file inside
  // `@layer base` purely for a background-color/color rule — but since these
  // patterns are non-global, `.exec()` returns only the FIRST match, which is
  // the token-definition block, not that later reuse.
  const rootDeclarations = parseDeclarations(extractBlock(/:root\s*{([^}]*)}/));
  const darkDeclarations = parseDeclarations(extractBlock(/\[data-surface="dark"\]\s*{([^}]*)}/));

  const colorDeclarations = [...rootDeclarations, ...darkDeclarations].filter(
    ({ prop }) => !NON_COLOR_PROPS.has(prop) && !ADMIN_ONLY_PROPS.has(prop)
  );

  // Same vacuous-pass guard as the class-name scan above: if the block
  // regexes ever stop matching (e.g. globals.css gets restructured), fail
  // loudly instead of silently checking zero tokens.
  it("finds a non-empty set of Mirox color tokens to check", () => {
    expect(colorDeclarations.length).toBeGreaterThan(0);
  });

  it.each(colorDeclarations.map(({ prop, value }): [string, string] => [prop, value]))(
    "%s: %s is achromatic hex (or the sanctioned destructive hue)",
    (prop, value) => {
      const hexMatch = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(value);
      expect(hexMatch, `${prop}: "${value}" is not a #RRGGBB hex color`).not.toBeNull();

      if (SANCTIONED_HUE_PROPS.has(prop)) return;

      const [, r, g, b] = hexMatch!;
      const achromatic = r.toLowerCase() === g.toLowerCase() && g.toLowerCase() === b.toLowerCase();
      expect(
        achromatic,
        `${prop}: "${value}" is chromatic (R≠G≠B) and is not a sanctioned hue token`
      ).toBe(true);
    }
  );
});
