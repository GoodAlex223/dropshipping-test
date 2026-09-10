# G19 — Launch Runbook & Deploy Verification Plan

**Last Updated**: 2026-09-10
**Task**: G19 (WEEKLY [G19](../WEEKLY.md#g19-launch-runbook--deploy-verification-batch)) · 🔵 BACKLOG [2026-08-10] production-launch deploy runbook + three subsumed 🟤 riders ([2026-07-21] smoke test · [2026-08-14] served-asset staleness · [2026-08-18] nothing verifies a deploy) + two folded-in 🟤 entries ([2026-09-04] probe rejections not renders · [2026-09-06] Preview never migrates)
**Branch**: `feat/g19-launch-runbook-deploy-verification` (from `main` @ `0c8f62c`)
**Status**: In progress
**Spec**: [2026-09-10-g19-launch-runbook-deploy-verification-design.md](../../superpowers/specs/2026-09-10-g19-launch-runbook-deploy-verification-design.md) — the plan argues from the spec; executors read both.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn "someone looks at the site after a deploy" into a command that exits non-zero, and write the one-time real-domain cutover as an executable checklist.

**Architecture:** Two files carry the script. `scripts/smoke-lib.ts` holds every pure function — HTML/XML extraction, baseline comparison, and one `assert*` function per probe row — with no I/O and no module-scope side effects, so it is safe to import from a test. `scripts/smoke.ts` is the CLI: argument parsing, `fetch`, the probe table wiring assertions to URLs, row output, state-file read/write, and the exit code. The runbook (`docs/deployment/launch-runbook.md`) is a document in two parts: a one-time cutover checklist whose client-gated steps are marked ⛔ BLOCKED, and a short every-deploy section whose first instruction is to run the script.

**Tech Stack:** TypeScript (strict), `tsx` (already a devDependency, same runner as `db:seed` / `db:rotate-password`), Node 20 global `fetch`, Vitest.

## Global Constraints

- **TDD** — every code task writes the failing test first, runs it red, then implements. Run `npm run test:run` before every commit; `.husky/pre-commit` runs lint-staged only, not the unit suite.
- **`scripts/**/_.ts`IS type-checked.**`tsconfig.json`includes`\*\*/_.ts`and excludes only`node_modules`and`tests`. So `npm run typecheck`covers both new script files, and does **not** cover`tests/unit/smoke.test.ts`.
- **`scripts/**/\*.ts`IS linted** —`npm run lint`is`eslint . --ext .ts,.tsx` with no scripts exclusion.
- **No module-scope side effects in `scripts/smoke-lib.ts`.** It is imported by the test; anything that runs at import time would run during the suite.
- **Discovery over hardcoding (spec Decision 5).** No product name, product slug or CDN hostname may be written into the script. The CSS hashes, product slugs and the remote image URL are all read out of the target's own homepage HTML at run time. The single exception is row 5's category slug `hudi`, which is a route-shape assertion and is called out in the script header comment.
- **Four-state staleness (spec Decision 2, extended during execution)**: `CHANGED` passes · `UNCHANGED` fails · `NO-BASELINE` fails unless `--allow-missing-baseline` · `NO-CSS` fails always and is never waivable. A missing state file must never make the check silently inconclusive.
- **Exit code is `0` if and only if every row passed.** `--json` changes output only, never the exit contract.
- **State file is keyed by target origin** so a preview run cannot clobber the production baseline.
- **Docs freshness is enforced by a test.** `docs/planning` and `docs/deployment` are both indexed directories, walked recursively — every new `.md` in them needs a `docs/README.md` row in the same commit, and the index's own `**Last Updated**` header must be ≥ every date it lists. `prettier --write` must be idempotent on every touched `.md`.
- **Prettier**: double quotes, semicolons, 2-space indent, 100-char print width, trailing commas (es5). `.husky/pre-commit` reformats staged files, so commit and then re-check rather than assuming your formatting survived.
- **Bare `catch`** when the error variable is unused (ESLint-enforced repo convention).

---

### Task 1: Pure extraction helpers

Reads the three things every later probe depends on out of one homepage response.

**Files:**

- Create: `scripts/smoke-lib.ts`
- Test: `tests/unit/smoke.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces: `extractCssHashes(html: string): string[]` · `extractProductSlugs(html: string): string[]` · `findRemoteImageUrl(html: string, targetOrigin: string): string | null`. All return sorted, de-duplicated results; the last returns `null` when the page carries no absolute remote image.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/smoke.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { extractCssHashes, extractProductSlugs, findRemoteImageUrl } from "../../scripts/smoke-lib";

const ORIGIN = "https://shop.example";

describe("extractCssHashes", () => {
  it("collects, de-duplicates and sorts chunk hashes", () => {
    const html = `
      <link rel="preload" as="style" href="/_next/static/css/1ee63df177967359.css"/>
      <link rel="stylesheet" href="/_next/static/css/1ee63df177967359.css"/>
      <link rel="stylesheet" href="/_next/static/css/143491e5ab2efd5e.css"/>
    `;
    expect(extractCssHashes(html)).toEqual(["143491e5ab2efd5e", "1ee63df177967359"]);
  });

  it("returns an empty array when no stylesheet is linked", () => {
    expect(extractCssHashes("<html><body>no css</body></html>")).toEqual([]);
  });
});

describe("extractProductSlugs", () => {
  it("finds product links in server-rendered HTML", () => {
    const html = `<a href="/products/hudi-mirox-basic">H</a><a href="/products/futbolka-mirox">F</a>`;
    expect(extractProductSlugs(html)).toEqual(["futbolka-mirox", "hudi-mirox-basic"]);
  });

  // The real chunk path the catalog page ships. Counting it as a product would
  // make the homepage's DB-backed assertion pass on a page with no products at
  // all. Note what actually rejects it: PRODUCT_SLUG_RE's lookahead, because
  // `.js` follows the segment. This case passes with or without the /_next
  // strip — it guards the observed input, not the strip.
  it("ignores the catalog page's real /_next chunk path", () => {
    const html = `<script src="/_next/static/chunks/app/(shop)/products/page-9a0c2f2d3d5cd602.js"></script>`;
    expect(extractProductSlugs(html)).toEqual([]);
  });
});

describe("findRemoteImageUrl", () => {
  it("decodes the first absolute remote image behind /_next/image", () => {
    const html = `<img srcset="/_next/image?url=https%3A%2F%2Fpub-abc.r2.dev%2Fproducts%2Fa.jpg&amp;w=256&amp;q=75 256w"/>`;
    expect(findRemoteImageUrl(html, ORIGIN)).toBe("https://pub-abc.r2.dev/products/a.jpg");
  });

  it("returns null when every optimised image is root-relative", () => {
    const html = `<img src="/_next/image?url=%2Fimages%2Flogo.png&amp;w=128&amp;q=75"/>`;
    expect(findRemoteImageUrl(html, ORIGIN)).toBeNull();
  });

  it("skips images served from the target's own host", () => {
    const html = `<img src="/_next/image?url=https%3A%2F%2Fshop.example%2Fa.jpg&amp;w=128&amp;q=75"/>`;
    expect(findRemoteImageUrl(html, ORIGIN)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/smoke.test.ts`
Expected: FAIL — `Failed to resolve import "../../scripts/smoke-lib"`.

- [ ] **Step 3: Write minimal implementation**

Create `scripts/smoke-lib.ts`:

```ts
/**
 * Pure helpers for the post-deploy smoke script (scripts/smoke.ts).
 *
 * Everything here is a pure function over strings and plain objects: no fetch,
 * no filesystem, no module-scope side effects. tests/unit/smoke.test.ts imports
 * this file directly, so anything that ran at import time would run during the
 * unit suite.
 *
 * See docs/superpowers/specs/2026-09-10-g19-launch-runbook-deploy-verification-design.md
 */

const CSS_CHUNK_RE = /\/_next\/static\/css\/([a-z0-9]+)\.css/g;
const NEXT_ASSET_RE = /\/_next\/[^\s"'\\]*/g;
const PRODUCT_SLUG_RE = /\/products\/([a-z0-9][a-z0-9-]{2,})(?=["'?#\\/]|$)/g;
const IMAGE_PARAM_RE = /\/_next\/image\?url=([^"'&\s\\]+)/g;

/** Every distinct `/_next/static/css/<hash>.css` chunk hash, sorted. */
export function extractCssHashes(html: string): string[] {
  const found = new Set<string>();
  for (const match of html.matchAll(CSS_CHUNK_RE)) found.add(match[1]);
  return [...found].sort();
}

/**
 * Product slugs linked from server-rendered HTML.
 *
 * The danger being defended against: a `/_next/**` asset path that contains a
 * literal `/products/` segment would be reported as a product, turning the
 * homepage's DB-backed assertion into one that passes on an empty catalog.
 *
 * Two mechanisms do that work, and they cover different shapes. PRODUCT_SLUG_RE's
 * lookahead rejects anything followed by a file extension, which is what rules out
 * the catalog page's real chunk, `…/products/page-<hash>.js` (the `.` is not in the
 * lookahead set). Stripping `/_next/**` first covers the shapes the lookahead does
 * NOT catch — a `/products/<segment>` followed by `/`, `?`, `#` or a quote, as in
 * `/_next/static/media/products/hero-banner/1x.avif`. Both cases are tested; the
 * second one fails if the strip is removed, the first does not.
 */
export function extractProductSlugs(html: string): string[] {
  const withoutAssets = html.replace(NEXT_ASSET_RE, " ");
  const found = new Set<string>();
  for (const match of withoutAssets.matchAll(PRODUCT_SLUG_RE)) found.add(match[1]);
  return [...found].sort();
}

/**
 * The first absolute, off-origin image URL the page hands to /_next/image.
 *
 * Returns null when the page only optimises root-relative assets (the seeded
 * placeholder catalog) — the caller then skips the accept probe and says so,
 * rather than inventing a URL.
 */
export function findRemoteImageUrl(html: string, targetOrigin: string): string | null {
  let targetHost: string;
  try {
    targetHost = new URL(targetOrigin).host;
  } catch {
    return null;
  }

  for (const match of html.matchAll(IMAGE_PARAM_RE)) {
    let decoded: string;
    try {
      decoded = decodeURIComponent(match[1]);
    } catch {
      continue;
    }
    if (!/^https?:\/\//i.test(decoded)) continue;
    try {
      if (new URL(decoded).host !== targetHost) return decoded;
    } catch {
      continue;
    }
  }
  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/smoke.test.ts`
Expected: PASS, 8 tests.

Then: `npm run typecheck` — expected: clean (this file is inside the tsconfig include).

- [ ] **Step 5: Commit**

```bash
git add scripts/smoke-lib.ts tests/unit/smoke.test.ts
git commit -m "feat(g19): extraction helpers for the post-deploy smoke script"
```

---

### Task 2: Baseline state and staleness comparison

**Files:**

- Modify: `scripts/smoke-lib.ts`
- Test: `tests/unit/smoke.test.ts`

**Interfaces:**

- Consumes: nothing from Task 1.
- Produces: `type StalenessOutcome = "CHANGED" | "UNCHANGED" | "NO-BASELINE" | "NO-CSS"` · `interface SmokeState` · `compareBaseline(observed: string[], stored: string[] | null): StalenessOutcome` · `stalenessPasses(outcome: StalenessOutcome, allowMissing: boolean): boolean` · `readBaselineFor(state: SmokeState, origin: string): string[] | null` · `mergeState(state: SmokeState, origin: string, cssHashes: string[], observedAt: string): SmokeState`.

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/smoke.test.ts` (and extend the existing import from `../../scripts/smoke-lib` with `compareBaseline`, `stalenessPasses`, `readBaselineFor`, `mergeState`):

```ts
describe("compareBaseline", () => {
  it("reports CHANGED when the hash set differs", () => {
    expect(compareBaseline(["b", "c"], ["a", "b"])).toBe("CHANGED");
  });

  it("reports UNCHANGED for the same set regardless of order", () => {
    expect(compareBaseline(["b", "a"], ["a", "b"])).toBe("UNCHANGED");
  });

  it("reports NO-BASELINE for a missing or empty stored set", () => {
    expect(compareBaseline(["a"], null)).toBe("NO-BASELINE");
    expect(compareBaseline(["a"], [])).toBe("NO-BASELINE");
  });

  // An empty observed set must never reach the "sets differ → CHANGED" branch:
  // a site serving no CSS would otherwise report a passing, changed deploy.
  it("reports NO-CSS when the page served no stylesheet at all", () => {
    expect(compareBaseline([], ["a", "b"])).toBe("NO-CSS");
    expect(compareBaseline([], null)).toBe("NO-CSS");
  });
});

describe("stalenessPasses", () => {
  it("passes only on CHANGED by default", () => {
    expect(stalenessPasses("CHANGED", false)).toBe(true);
    expect(stalenessPasses("UNCHANGED", false)).toBe(false);
    expect(stalenessPasses("NO-BASELINE", false)).toBe(false);
  });

  it("lets NO-BASELINE pass only when explicitly allowed, and never UNCHANGED", () => {
    expect(stalenessPasses("NO-BASELINE", true)).toBe(true);
    expect(stalenessPasses("UNCHANGED", true)).toBe(false);
  });

  it("never passes NO-CSS, with or without --allow-missing-baseline", () => {
    expect(stalenessPasses("NO-CSS", false)).toBe(false);
    expect(stalenessPasses("NO-CSS", true)).toBe(false);
  });
});

describe("state file", () => {
  it("keys baselines by origin so a preview run cannot clobber production", () => {
    const prod = "https://shop.example";
    const preview = "https://preview-abc.vercel.app";
    let state = mergeState({}, prod, ["aaa"], "2026-09-10T00:00:00.000Z");
    state = mergeState(state, preview, ["zzz"], "2026-09-10T01:00:00.000Z");

    expect(readBaselineFor(state, prod)).toEqual(["aaa"]);
    expect(readBaselineFor(state, preview)).toEqual(["zzz"]);
  });

  it("returns null for an origin the state file has never seen", () => {
    expect(readBaselineFor({}, "https://shop.example")).toBeNull();
  });

  it("stores hashes sorted so ordering churn never reads as CHANGED", () => {
    const state = mergeState({}, "https://shop.example", ["b", "a"], "2026-09-10T00:00:00.000Z");
    expect(state["https://shop.example"].cssHashes).toEqual(["a", "b"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/smoke.test.ts`
Expected: FAIL — `compareBaseline is not a function` (or an unresolved-export error).

- [ ] **Step 3: Write minimal implementation**

Append to `scripts/smoke-lib.ts`:

```ts
export type StalenessOutcome = "CHANGED" | "UNCHANGED" | "NO-BASELINE" | "NO-CSS";

export interface SmokeStateEntry {
  cssHashes: string[];
  observedAt: string;
}

export interface SmokeState {
  [origin: string]: SmokeStateEntry;
}

/**
 * Four outcomes, and only CHANGED passes. Neither an absent baseline nor an
 * absent stylesheet is a pass: a check that cannot fail looks exactly like one
 * that passes, and this one guards a real incident (Vercel served
 * byte-identical stale CSS across two deploys).
 */
export function compareBaseline(observed: string[], stored: string[] | null): StalenessOutcome {
  // Checked FIRST. A page that served no stylesheet at all cannot be compared,
  // and calling that "CHANGED" would pass a deploy whose CSS vanished entirely —
  // the same "a check that cannot fail" trap NO-BASELINE guards, entered from
  // the observed side instead of the stored side.
  if (observed.length === 0) return "NO-CSS";
  if (stored === null || stored.length === 0) return "NO-BASELINE";
  const a = [...observed].sort().join(",");
  const b = [...stored].sort().join(",");
  return a === b ? "UNCHANGED" : "CHANGED";
}

export function stalenessPasses(outcome: StalenessOutcome, allowMissing: boolean): boolean {
  if (outcome === "CHANGED") return true;
  // NO-CSS is deliberately NOT waivable: --allow-missing-baseline excuses a
  // missing BASELINE, never a page that served no stylesheet.
  if (outcome === "NO-BASELINE") return allowMissing;
  return false;
}

export function readBaselineFor(state: SmokeState, origin: string): string[] | null {
  const entry = state[origin];
  return entry && Array.isArray(entry.cssHashes) ? entry.cssHashes : null;
}

export function mergeState(
  state: SmokeState,
  origin: string,
  cssHashes: string[],
  observedAt: string
): SmokeState {
  return { ...state, [origin]: { cssHashes: [...cssHashes].sort(), observedAt } };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/smoke.test.ts`
Expected: PASS, 18 tests (8 from Task 1 + 10 here).

Then: `npm run typecheck` — expected: clean.

- [ ] **Step 5: Commit**

```bash
git add scripts/smoke-lib.ts tests/unit/smoke.test.ts
git commit -m "feat(g19): origin-keyed baseline state with three-state staleness"
```

---

### Task 3: Probe assertions

One pure `assert*` per non-trivial row. This is what makes "force every row to fail" (Task 5) cheap: the failure paths are unit-testable without a network.

**Files:**

- Modify: `scripts/smoke-lib.ts`
- Test: `tests/unit/smoke.test.ts`

**Interfaces:**

- Consumes: `extractProductSlugs` (Task 1).
- Produces: `interface HttpResponse { status: number; headers: Record<string, string>; body: string }` · `interface ProbeResult { status: "pass" | "fail"; detail: string }` · `assertStatus(expected: number): (res: HttpResponse) => ProbeResult` · `assertHomepage(res: HttpResponse): ProbeResult` · `assertProductsApi(res: HttpResponse): ProbeResult` · `assertHealth(res: HttpResponse): ProbeResult` · `assertCategoryRedirect(res: HttpResponse): ProbeResult` · `assertFeed(res: HttpResponse): ProbeResult` · `countFeedItems(xml: string): number` · `buildLookalikeUrl(remoteImageUrl: string | null): string` · `exitCodeFor(results: ProbeResult[]): number`.

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/smoke.test.ts` (extend the import with `assertStatus`, `assertHomepage`, `assertProductsApi`, `assertHealth`, `assertCategoryRedirect`, `assertFeed`, `countFeedItems`, `buildLookalikeUrl`, `exitCodeFor`):

```ts
function res(
  status: number,
  body = "",
  headers: Record<string, string> = {}
): { status: number; headers: Record<string, string>; body: string } {
  return { status, body, headers };
}

describe("assertStatus", () => {
  it("passes on the expected status and fails otherwise", () => {
    expect(assertStatus(200)(res(200)).status).toBe("pass");
    expect(assertStatus(200)(res(500)).status).toBe("fail");
    expect(assertStatus(400)(res(200)).detail).toContain("expected 400, got 200");
  });
});

describe("assertHomepage", () => {
  it("passes when the server HTML carries a product link", () => {
    expect(assertHomepage(res(200, `<a href="/products/futbolka-mirox">F</a>`)).status).toBe(
      "pass"
    );
  });

  it("fails on 200 with no product link — a rendered but DB-empty homepage", () => {
    const result = assertHomepage(res(200, "<html><body>Mirox</body></html>"));
    expect(result.status).toBe("fail");
    expect(result.detail).toContain("no /products/<slug>");
  });

  it("fails on a non-200", () => {
    expect(assertHomepage(res(500)).status).toBe("fail");
  });
});

describe("assertProductsApi", () => {
  it("passes when data[0].slug is a non-empty string", () => {
    expect(assertProductsApi(res(200, JSON.stringify({ data: [{ slug: "x" }] }))).status).toBe(
      "pass"
    );
  });

  it("fails on an empty data array", () => {
    expect(assertProductsApi(res(200, JSON.stringify({ data: [] }))).status).toBe("fail");
  });

  it("fails when the body is not JSON", () => {
    expect(assertProductsApi(res(200, "<html>")).detail).toContain("not JSON");
  });
});

describe("assertHealth", () => {
  it("passes only when checks.database.status is ok", () => {
    const ok = JSON.stringify({ checks: { database: { status: "ok" } } });
    const bad = JSON.stringify({ checks: { database: { status: "error" } } });
    expect(assertHealth(res(200, ok)).status).toBe("pass");
    expect(assertHealth(res(200, bad)).status).toBe("fail");
  });
});

describe("assertCategoryRedirect", () => {
  it("passes on 307 to the catalog facet", () => {
    const r = res(307, "", { location: "/products?category=hudi" });
    expect(assertCategoryRedirect(r).status).toBe("pass");
  });

  // A page-level redirect() is emitted as <meta http-equiv="refresh"> on a 200,
  // not a 3xx — the exact regression the G12 routing-layer redirect exists to
  // prevent. A 200 here must fail.
  it("fails on a 200 even when the body looks like a redirect", () => {
    expect(assertCategoryRedirect(res(200, `<meta http-equiv="refresh"`)).status).toBe("fail");
  });

  it("fails on a 307 pointing somewhere else", () => {
    expect(assertCategoryRedirect(res(307, "", { location: "/" })).status).toBe("fail");
  });
});

describe("countFeedItems / assertFeed", () => {
  it("counts item elements", () => {
    expect(countFeedItems("<rss><item>a</item><item>b</item></rss>")).toBe(2);
  });

  it("fails a well-formed but empty feed", () => {
    const result = assertFeed(res(200, "<rss><channel></channel></rss>"));
    expect(result.status).toBe("fail");
    expect(result.detail).toContain("0 <item>");
  });
});

describe("buildLookalikeUrl", () => {
  it("prefixes the real CDN host so a naive endsWith allow-list would serve it", () => {
    expect(buildLookalikeUrl("https://pub-abc.r2.dev/products/a.jpg")).toBe(
      "https://pub-abc.r2.dev.evil.example/x.png"
    );
  });

  it("falls back to a literal host when nothing was discovered", () => {
    expect(buildLookalikeUrl(null)).toBe("https://cdn.example.com.evil.example/x.png");
  });
});

describe("exitCodeFor", () => {
  // Nothing verified must never read as success.
  it("fails closed on an empty result set", () => {
    expect(exitCodeFor([])).toBe(1);
  });

  it("is 0 only when every row passed", () => {
    expect(exitCodeFor([{ status: "pass", detail: "" }])).toBe(0);
    expect(
      exitCodeFor([
        { status: "pass", detail: "" },
        { status: "fail", detail: "" },
      ])
    ).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/smoke.test.ts`
Expected: FAIL — `assertStatus is not a function`.

- [ ] **Step 3: Write minimal implementation**

Append to `scripts/smoke-lib.ts`:

```ts
export interface HttpResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}

export interface ProbeResult {
  status: "pass" | "fail";
  detail: string;
}

const pass = (detail: string): ProbeResult => ({ status: "pass", detail });
const fail = (detail: string): ProbeResult => ({ status: "fail", detail });
const wrongStatus = (expected: number, got: number) => fail(`expected ${expected}, got ${got}`);

export function assertStatus(expected: number) {
  return (res: HttpResponse): ProbeResult =>
    res.status === expected ? pass(String(res.status)) : wrongStatus(expected, res.status);
}

/** The DB-backed string assertion. See spec §2.1: it lives on `/`, not `/products`. */
export function assertHomepage(res: HttpResponse): ProbeResult {
  if (res.status !== 200) return wrongStatus(200, res.status);
  const slugs = extractProductSlugs(res.body);
  return slugs.length > 0
    ? pass(`200, ${slugs.length} product link(s)`)
    : fail("200 but no /products/<slug> link in server HTML — DB-backed render missing");
}

export function assertProductsApi(res: HttpResponse): ProbeResult {
  if (res.status !== 200) return wrongStatus(200, res.status);
  let parsed: { data?: Array<{ slug?: unknown }> };
  try {
    parsed = JSON.parse(res.body);
  } catch {
    return fail("200 but the body is not JSON");
  }
  const slug = parsed.data?.[0]?.slug;
  return typeof slug === "string" && slug.length > 0
    ? pass(`200, first slug "${slug}"`)
    : fail("200 but data[0].slug is missing — the catalog query returned nothing");
}

export function assertHealth(res: HttpResponse): ProbeResult {
  if (res.status !== 200) return wrongStatus(200, res.status);
  let parsed: { checks?: { database?: { status?: unknown } } };
  try {
    parsed = JSON.parse(res.body);
  } catch {
    return fail("200 but the body is not JSON");
  }
  const db = parsed.checks?.database?.status;
  return db === "ok"
    ? pass("200, database ok")
    : fail(`200 but checks.database.status is ${JSON.stringify(db)}`);
}

/**
 * 307 specifically, and to the catalog facet specifically. A redirect() thrown
 * inside a Server Component is captured by Next's RedirectBoundary and emitted
 * as <meta http-equiv="refresh"> on a 200 — which is why this asserts the
 * status code and not the rendered body (G12).
 */
export function assertCategoryRedirect(res: HttpResponse): ProbeResult {
  if (res.status !== 307) return wrongStatus(307, res.status);
  const location = res.headers["location"];
  return location === "/products?category=hudi"
    ? pass("307 → /products?category=hudi")
    : fail(`307 but location is ${JSON.stringify(location)}`);
}

export function countFeedItems(xml: string): number {
  return (xml.match(/<item>/g) || []).length;
}

/**
 * The feed route filters with validateFeedItemSafe, which drops an invalid item
 * SILENTLY — production served a well-formed, empty, HTTP-200 feed for roughly
 * two months before G16 noticed. A status check alone would not have caught it.
 */
export function assertFeed(res: HttpResponse): ProbeResult {
  if (res.status !== 200) return wrongStatus(200, res.status);
  const count = countFeedItems(res.body);
  return count > 0
    ? pass(`200, ${count} item(s)`)
    : fail("200 but 0 <item> entries — every product was dropped from the feed");
}

const FALLBACK_CDN_HOST = "cdn.example.com";

/**
 * The lookalike host an `endsWith`-style allow-list would wrongly serve:
 * the REAL CDN host with an attacker suffix. Built from the discovered host so
 * the probe stays meaningful after the domain swap.
 */
export function buildLookalikeUrl(remoteImageUrl: string | null): string {
  let host = FALLBACK_CDN_HOST;
  if (remoteImageUrl) {
    try {
      host = new URL(remoteImageUrl).host;
    } catch {
      host = FALLBACK_CDN_HOST;
    }
  }
  return `https://${host}.evil.example/x.png`;
}

/**
 * Fails CLOSED on an empty array. Zero collected results means nothing was
 * verified, and "nothing was verified" must never read as success — the same
 * trap compareBaseline's empty-observed guard closes, one level up at the
 * aggregate gate.
 */
export function exitCodeFor(results: ProbeResult[]): number {
  return results.length > 0 && results.every((result) => result.status === "pass") ? 0 : 1;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/smoke.test.ts`
Expected: PASS, 35 tests (8 from Task 1 + 10 from Task 2 + 17 here). Task 1 carries 8, not the 7 it shipped with: the `/_next` strip's negative control added by the PR #45 review round lives in the `extractProductSlugs` describe, which Task 1 writes.

Then: `npm run typecheck` and `npm run lint` — expected: both clean.

- [ ] **Step 5: Commit**

```bash
git add scripts/smoke-lib.ts tests/unit/smoke.test.ts
git commit -m "feat(g19): probe assertions with unit-testable failure paths"
```

---

### Task 4: The CLI

**Files:**

- Create: `scripts/smoke.ts`
- Modify: `package.json` (add the `smoke` script)
- Modify: `.gitignore` (add `.smoke-state.json`)

**Interfaces:**

- Consumes: every export from `scripts/smoke-lib.ts` (Tasks 1–3).
- Produces: the `npm run smoke -- --url <target>` command. No exports — this file is an entry point.

- [ ] **Step 1: Write the implementation**

There is no unit test for this task: it is I/O, argument parsing and orchestration, all of which Task 5 verifies against the real thing. The logic worth testing was pushed into `smoke-lib.ts` precisely so this file has none left.

Create `scripts/smoke.ts`:

```ts
/**
 * Post-deploy smoke check.
 *
 *   npm run smoke -- --url https://dropshipping-test.vercel.app
 *
 * Every production deploy in this project's history was confirmed by a person
 * opening the site. The Actions "Deploy to Vercel" job is a validated no-op, so
 * a green badge proves nothing. This turns that ritual into a command that
 * exits non-zero.
 *
 * Flags:
 *   --url <target>              required; origin to probe
 *   --baseline <file>           read/write the CSS-hash baseline at this file (read at the start,
 *                               overwritten with the observed hashes at the end of the run)
 *   --save-baseline <file>      write the observed baseline here and exit 0
 *   --allow-missing-baseline    NO-BASELINE stops being a failure
 *   --json                      emit results as JSON (exit contract unchanged)
 *
 * Route paths are literals here — they are the probe definitions. What is
 * discovered from the target's own homepage at run time is the DATA: the CSS
 * chunk hashes, the product slugs, and the remote image URL the rejection
 * probes are built from. Nothing pins a product name or a CDN hostname, so the
 * script survives catalog edits and the real-domain cutover without an edit.
 * (Spec Decision 5 states the same scope.)
 *
 * See docs/deployment/launch-runbook.md and
 * docs/superpowers/specs/2026-09-10-g19-launch-runbook-deploy-verification-design.md
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import {
  assertCategoryRedirect,
  assertFeed,
  assertHealth,
  assertHomepage,
  assertProductsApi,
  assertStatus,
  buildLookalikeUrl,
  compareBaseline,
  exitCodeFor,
  extractCssHashes,
  findRemoteImageUrl,
  mergeState,
  readBaselineFor,
  stalenessPasses,
  type HttpResponse,
  type ProbeResult,
  type SmokeState,
  type StalenessOutcome,
} from "./smoke-lib";

const DEFAULT_STATE_FILE = ".smoke-state.json";
const TIMEOUT_MS = 20_000;

// One message per outcome, read by BOTH branches, so the row can never print a
// detail that disagrees with its own status.
//
// A full Record over the union — deliberately NOT Record<Exclude<…, "CHANGED">>.
// stalenessPasses() returns an opaque boolean, so a ternary cannot narrow
// `outcome` away from "CHANGED" in the fail branch; the three-key version needs
// an `as Exclude<…>` cast to compile, and that cast asserts a guarantee living
// in ANOTHER module. Change the pass rule in smoke-lib.ts and the cast silently
// indexes a missing key, printing `FAIL  CSS chunk hashes  undefined`. One
// unused entry is the cheaper trade, and the compiler still demands a message
// for every outcome added later.
const STALENESS_DETAIL: Record<StalenessOutcome, string> = {
  CHANGED: "CHANGED — the served CSS differs from the previous run",
  UNCHANGED: "UNCHANGED — the build cache may have served stale CSS; redeploy with the cache off",
  "NO-BASELINE":
    "NO-BASELINE — no stored hashes for this origin; re-run, or pass --allow-missing-baseline",
  "NO-CSS": "NO-CSS — the page served no stylesheet at all; the deploy is very likely broken",
};

interface Options {
  url: string;
  baselineFile: string;
  saveBaselineOnly: boolean;
  allowMissingBaseline: boolean;
  json: boolean;
}

function parseArgs(argv: string[]): Options {
  const flag = (name: string): string | undefined => {
    const i = argv.indexOf(`--${name}`);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const has = (name: string) => argv.includes(`--${name}`);

  const url = flag("url");
  if (!url) {
    throw new Error("--url is required, e.g. npm run smoke -- --url https://example.com");
  }
  const saveTo = flag("save-baseline");
  return {
    url: new URL(url).origin,
    baselineFile: saveTo || flag("baseline") || DEFAULT_STATE_FILE,
    saveBaselineOnly: Boolean(saveTo),
    allowMissingBaseline: has("allow-missing-baseline"),
    json: has("json"),
  };
}

async function get(url: string): Promise<HttpResponse> {
  const response = await fetch(url, {
    redirect: "manual",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { "user-agent": "mirox-smoke/1.0", "cache-control": "no-cache" },
  });
  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });
  return { status: response.status, headers, body: await response.text() };
}

function loadState(file: string): SmokeState {
  if (!existsSync(file)) return {};
  try {
    return JSON.parse(readFileSync(file, "utf8")) as SmokeState;
  } catch {
    return {};
  }
}

function imageProbeUrl(origin: string, target: string): string {
  return `${origin}/_next/image?url=${encodeURIComponent(target)}&w=640&q=75`;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const origin = options.url;

  // One fetch builds the context every other row depends on.
  const homepage = await get(`${origin}/`);
  const cssHashes = extractCssHashes(homepage.body);
  const remoteImage = findRemoteImageUrl(homepage.body, origin);

  if (options.saveBaselineOnly) {
    const state = mergeState(
      loadState(options.baselineFile),
      origin,
      cssHashes,
      new Date().toISOString()
    );
    writeFileSync(options.baselineFile, `${JSON.stringify(state, null, 2)}\n`);
    console.log(`baseline saved to ${options.baselineFile}: ${cssHashes.join(", ") || "(none)"}`);
    return;
  }

  const rows: Array<{ label: string; result: ProbeResult }> = [];
  const probe = async (label: string, url: string, assert: (r: HttpResponse) => ProbeResult) => {
    try {
      rows.push({ label, result: assert(await get(url)) });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      rows.push({ label, result: { status: "fail", detail: `request failed: ${reason}` } });
    }
  };

  rows.push({ label: "GET /", result: assertHomepage(homepage) });
  await probe("GET /products", `${origin}/products`, assertStatus(200));
  await probe("GET /api/products", `${origin}/api/products?limit=1`, assertProductsApi);
  await probe("GET /api/health", `${origin}/api/health`, assertHealth);
  await probe("GET /categories/hudi", `${origin}/categories/hudi`, assertCategoryRedirect);

  // Staleness: CHANGED passes, UNCHANGED fails, NO-BASELINE also fails.
  const state = loadState(options.baselineFile);
  const outcome = compareBaseline(cssHashes, readBaselineFor(state, origin));
  rows.push({
    label: "CSS chunk hashes",
    result: {
      status: stalenessPasses(outcome, options.allowMissingBaseline) ? "pass" : "fail",
      detail: `${STALENESS_DETAIL[outcome]}${cssHashes.length ? ` (${cssHashes.join(", ")})` : ""}`,
    },
  });

  // The accept probe FIRST: if remotePatterns came back empty at build time,
  // every remote host 400s and the three rejection rows below would go green
  // on a broken deploy. This row is what gives them meaning.
  if (remoteImage) {
    const remoteHost = new URL(remoteImage).host;
    await probe("GET /_next/image (real CDN)", imageProbeUrl(origin, remoteImage), (res) =>
      res.status === 200
        ? { status: "pass", detail: `200 — ${remoteHost}` }
        : { status: "fail", detail: `expected 200, got ${res.status}` }
    );
  } else {
    rows.push({
      label: "GET /_next/image (real CDN)",
      result: {
        status: "fail",
        detail: "no remote image found on the homepage — the rejection probes below prove nothing",
      },
    });
  }
  await probe(
    "GET /_next/image (arbitrary)",
    imageProbeUrl(origin, "https://example.invalid/x.png"),
    assertStatus(400)
  );
  await probe(
    "GET /_next/image (metadata)",
    imageProbeUrl(origin, "http://169.254.169.254/latest/meta-data/"),
    assertStatus(400)
  );
  await probe(
    "GET /_next/image (lookalike)",
    imageProbeUrl(origin, buildLookalikeUrl(remoteImage)),
    assertStatus(400)
  );

  await probe("GET /feed/google-shopping.xml", `${origin}/feed/google-shopping.xml`, assertFeed);
  await probe("GET /track", `${origin}/track`, assertStatus(200));
  await probe("GET /sitemap.xml", `${origin}/sitemap.xml`, assertStatus(200));
  await probe("GET /robots.txt", `${origin}/robots.txt`, assertStatus(200));

  const results = rows.map((row) => row.result);

  if (options.json) {
    console.log(JSON.stringify({ origin, staleness: outcome, rows }, null, 2));
  } else {
    console.log(`\n  smoke check → ${origin}\n`);
    for (const row of rows) {
      const mark = row.result.status === "pass" ? "PASS" : "FAIL";
      console.log(`  ${mark}  ${row.label.padEnd(32)} ${row.result.detail}`);
    }
    const failed = results.filter((r) => r.status === "fail").length;
    console.log(`\n  ${results.length - failed} passed, ${failed} failed\n`);
  }

  // Record the observed hashes even on failure, so the NEXT run is meaningful.
  writeFileSync(
    options.baselineFile,
    `${JSON.stringify(mergeState(state, origin, cssHashes, new Date().toISOString()), null, 2)}\n`
  );

  process.exitCode = exitCodeFor(results);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
```

- [ ] **Step 2: Wire the npm script**

In `package.json`, add after the `db:delete-test-accounts` line:

```json
    "smoke": "tsx scripts/smoke.ts",
```

- [ ] **Step 3: Ignore the state file**

Append to `.gitignore`:

```gitignore

# Post-deploy smoke baseline (per-origin CSS chunk hashes, local to one machine)
.smoke-state.json
```

- [ ] **Step 4: Verify it runs and the gates are clean**

Run: `npm run smoke -- --url https://dropshipping-test.vercel.app`
Expected: **14** result lines. (The spec's probe table has 13 numbered rows because its row 13 groups `/sitemap.xml` and `/robots.txt`; the CLI probes them separately, so it prints one more line than the table has rows.) On this first run the CSS row reports `NO-BASELINE` and the command exits non-zero — that is correct behaviour, not a defect.

Run: `npm run typecheck` — expected: clean.
Run: `npm run lint` — expected: clean.
Run: `npm run test:run` — expected: the whole suite green.

- [ ] **Step 5: Commit**

```bash
git add scripts/smoke.ts package.json .gitignore
git commit -m "feat(g19): post-deploy smoke CLI with the full probe set"
```

---

### Task 5: Live production verification

The deliverable is **evidence**, not code. A row that passed on the first try and was never observed failing is not verified — it is merely green.

**Files:**

- Modify: `docs/planning/plans/2026-09-10_g19-launch-runbook-deploy-verification.md` (paste the evidence into a Verification Log section at the end)

**Interfaces:**

- Consumes: `npm run smoke` (Task 4).
- Produces: a recorded transcript the runbook and the close-out can cite.

- [ ] **Step 1: Establish a baseline, then get a clean pass**

```bash
npm run smoke -- --url https://dropshipping-test.vercel.app --save-baseline .smoke-state.json
npm run smoke -- --url https://dropshipping-test.vercel.app
echo "exit: $?"
```

Expected: the second run reports `UNCHANGED` and exits 1 (no deploy happened between them — spec §3 documents this as the deliberate bias). Then confirm the pass path:

```bash
npm run smoke -- --url https://dropshipping-test.vercel.app --allow-missing-baseline
```

Record which rows pass on the live site.

- [ ] **Step 2: Force each failure class and confirm it fires**

Run each and record the output. Every one must exit non-zero:

```bash
# 1. Unreachable origin — request-failure path
npm run smoke -- --url https://dropshipping-test.vercel.app.invalid ; echo "exit: $?"

# 2. UNCHANGED path — no tampering needed: the script rewrites the state on
#    every run, so any second consecutive run with no deploy between reports it
npm run smoke -- --url https://dropshipping-test.vercel.app ; echo "exit: $?"

# 3. Absent baseline — the NO-BASELINE path
rm -f .smoke-state.json && npm run smoke -- --url https://dropshipping-test.vercel.app ; echo "exit: $?"
```

For the assertion rows, the unit tests in Task 3 already exercise every failure branch with fixture responses; note that in the log rather than trying to break production.

- [ ] **Step 3: Confirm the SSRF rows are not vacuous**

The point of the accept probe is that it distinguishes "allow-list is narrow" from "allow-list is empty". Verify by hand that the real-CDN row returns 200 while the three rejection rows return 400:

```bash
BASE=https://dropshipping-test.vercel.app
REAL=$(curl -s $BASE/ | grep -o 'url=https%3A%2F%2F[^"&]*' | head -1 | sed 's/^url=//')
curl -s -o /dev/null -w "real     -> %{http_code}\n" "$BASE/_next/image?url=$REAL&w=640&q=75"
curl -s -o /dev/null -w "arbitrary-> %{http_code}\n" "$BASE/_next/image?url=https%3A%2F%2Fexample.invalid%2Fx.png&w=640&q=75"
curl -s -o /dev/null -w "metadata -> %{http_code}\n" "$BASE/_next/image?url=http%3A%2F%2F169.254.169.254%2Flatest%2Fmeta-data%2F&w=640&q=75"
```

Expected: `200`, `400`, `400`.

- [ ] **Step 4: Write the Verification Log**

Append a `## Verification Log` section to this plan file with the actual command output — not a summary of it. State plainly which rows were observed failing and which were only observed passing.

- [ ] **Step 5: Commit**

```bash
git add docs/planning/plans/2026-09-10_g19-launch-runbook-deploy-verification.md
git commit -m "test(g19): verify the smoke script against live production, failures included"
```

---

### Task 6: The launch runbook

**Files:**

- Create: `docs/deployment/launch-runbook.md`
- Modify: `docs/README.md` (Deployment table row + Implementation Plans row for this plan + header date)

**Interfaces:**

- Consumes: `npm run smoke` (Task 4) — the runbook's post-deploy step invokes it by name.
- Produces: the document launch day executes.

- [ ] **Step 1: Write the runbook**

Create `docs/deployment/launch-runbook.md` with `**Last Updated**: 2026-09-10` in the header. Structure per spec §4:

**Part 1 — one-time real-domain cutover.** Numbered steps in three phases (Pre / While / Post). Every step carries an **owner** (client / owner / dev) and a **verification line** — how you know it worked, not merely that you did it. Client-gated steps are marked **⛔ BLOCKED** with the named unblocking condition, never left as a bare unticked box.

- _Pre_: domain purchased + DNS access (⛔ TASK-056 №1) · Resend SPF + DKIM verified on the real domain (⛔ №2 — state explicitly that a `vercel.app` subdomain can never be verified, Vercel owns that DNS) · `EMAIL_FROM` → `noreply@<domain>` + redeploy · `AWS_CLOUDFRONT_URL` → `https://img.<domain>` (⛔ №1a — one variable, the R2 bucket is already live) · R2 CORS rule extended to the new origin · `FEEDBACK_EMAIL` → the client's real recipient · `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_STORE_NAME` reviewed · legal pages live · **decision gate**: the 8 seeded placeholders are still active alongside the 2 real products (program spec decision 9, deliberately outstanding) — decide with the client before the domain goes public.

> **Superseded 2026-09-10 (Task 7 review).** The `⛔ №1a` parenthetical above — "one variable, the R2 bucket is already live" — is wrong: `ProductImage.url` stores an absolute URL baked in at upload time (`src/lib/s3.ts:84`), and `next.config.mjs`'s `cdnRemotePatterns()` allows exactly one remote host. Flipping `AWS_CLOUDFRONT_URL` strands every existing real-product image on the old host unless a `ProductImage.url` backfill runs in the same window — see `docs/deployment/launch-runbook.md` Step 4.

- _While_: attach the domain + confirm SSL · deploy via the **Git integration**, never the Actions job (it is a validated no-op) · confirm in the build log that `scripts/vercel-build.sh` ran `prisma migrate deploy` against `DIRECT_URL`.
- _Post_: `npm run smoke -- --url https://<domain>` · a real COD order with the confirmation e-mail landing in a real, non-owner inbox · newsletter double-opt-in round-trip · `sitemap.xml` / `robots.txt` on the new domain · GA4/GTM firing after consent · Search Console property + Google Shopping feed re-registered.

**Part 2 — every production deploy.** Run the smoke script; `UNCHANGED` after a CSS/JS-affecting change means a cache-off redeploy (`VERCEL_FORCE_NO_BUILD_CACHE=1`, or the dashboard Redeploy with the cache box unchecked); a green Actions badge is not evidence of a deploy.

**Two corrections to the source entry (spec §4.3) — both must appear in the document:**

1. **Do not re-seed production.** The 🔵 [2026-08-10] entry's "user-gated prod re-seed plan" is superseded: real product rows have been in production since 2026-09-01, `prisma/seed.ts`'s `main()` deletes the entire catalog/transactional tree before reseeding, and `SEED_ALLOW_REMOTE=1` is retired for production permanently. Remaining products are entered by the client through the admin panel.
2. **Preview never migrates.** Record it as an accepted limitation with its warning: a preview of a column-adding branch runs the new Prisma client against the unmigrated schema, and the fix is **not** to set `DIRECT_URL` for Preview — previews would then apply unmerged migrations to the production database.

- [ ] **Step 2: Add both index rows and bump the header**

`docs/README.md` needs two edits in this commit:

- Deployment table: a row for `deployment/launch-runbook.md` with `Last Updated` = `2026-09-10`.
- The index's own `**Last Updated**` must be ≥ every date it lists (already `2026-09-10`; confirm it was not lowered).

This plan's own Implementation Plans row was added when the plan was authored — the freshness linter fails the moment an unindexed `.md` lands in `docs/planning/`, so it could not wait for this task. Do not add a second row.

- [ ] **Step 3: Run the docs linter**

Run: `npx prettier --write docs/README.md docs/deployment/launch-runbook.md`
Run: `npx vitest run tests/unit/docs-freshness.test.ts`
Expected: PASS. A failure here names the exact rule broken — a missing index row, a stale header date, an unresolved relative link, or non-idempotent prettier.

- [ ] **Step 4: Re-check formatting after the commit hook**

`.husky/pre-commit` reformats staged files, so verify rather than assume:

Run: `npx prettier --check docs/README.md docs/deployment/launch-runbook.md`
Expected: "All matched files use Prettier code style!"

- [ ] **Step 5: Commit**

```bash
git add docs/deployment/launch-runbook.md docs/README.md
git commit -m "docs(g19): production launch runbook — cutover checklist + every-deploy checks"
```

---

### Task 7: Repair the superseded checklist, file the follow-up

**Files:**

- Modify: `docs/deployment/setup.md` (the `## Pre-deployment Checklist` section, currently at line 527)
- Modify: `docs/planning/BACKLOG.md`
- Modify: `docs/planning/TODO.md` (correct the TASK-056 item 1a note — see Step 2b)
- Modify: `docs/README.md` (bump setup.md's `Last Updated` row, since its content changed)

**Interfaces:**

- Consumes: `docs/deployment/launch-runbook.md` (Task 6) — the repaired checklist points at it.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Repair the stale checklist**

`setup.md`'s Pre-deployment Checklist demands "Stripe live keys configured" and "Stripe webhook secret configured". Both are dead: the Stripe payment-intent path has been dormant since G2 (2026-08-06), and checkout is no-prepayment COD. Two checklists that disagree is a doc-contradicts-code condition.

Replace the section with a short pointer to `launch-runbook.md` for the deploy-time checks, keeping only the items that are genuinely setup-time and still true (env vars present, `NEXTAUTH_SECRET` length, migrations applied, build/typecheck/tests green). Delete the two Stripe rows and the `Stripe webhook endpoint configured` line under External Services. Bump the file's `**Last Updated**` to `2026-09-10` and its `docs/README.md` row to match.

- [ ] **Step 2: File the follow-up in BACKLOG.md**

Under a `### [2026-09-10] From: G19 launch runbook + deploy verification` intake group, add one 🟤 entry (Claude-surfaced → 🟤 per the Backlog Intake Rules):

> - 🟤 **Wire the smoke script to `deployment_status` so it cannot be forgotten** — G19 ships `npm run smoke` as a CLI, which still depends on a human running it; the [2026-08-18] rider asked for a control, and this is the half that makes it one. Blocked on nothing but a production deploy to verify the event fires with the expected `environment` value from the Vercel Git integration (the Actions Deploy job is a no-op, so the event is the only signal). Deferred out of launch week deliberately: an unverified CI control is the same failure mode G19 exists to close. (Med value, Low-Med effort) `[relates-to: G19; BACKLOG 2026-08-18]`

Then mark the four subsumed riders as delivered, in place, with the standard strikethrough-plus-resolution form: the [2026-07-21] post-deploy smoke test, the [2026-08-14] served-asset staleness check, the [2026-08-18] "nothing verifies a Vercel production deploy" entry, and the [2026-09-04] "must probe rejections, not just renders" entry. The [2026-09-06] Preview-never-migrates entry is **documented, not resolved** — leave it open and note that the runbook now records it.

- [ ] **Step 2b: File the CDN-backfill finding, and correct the live doc it contradicts**

Task 6 discovered, and the controller verified at source, that the production domain swap is **not** the one-variable change this project has been recording. `src/lib/s3.ts:84` returns `publicUrl = ${CDN_URL}/${key}` — an absolute URL — and `src/app/api/admin/products/[id]/images/route.ts:90` persists it verbatim into `ProductImage.url`. `next.config.mjs`'s `cdnRemotePatterns()` derives exactly **one** allowed hostname from `AWS_CLOUDFRONT_URL`. So repointing that variable at `img.<domain>` strands every existing real-product image on the old `pub-….r2.dev` host, which is then absent from `remotePatterns`, and all of them 400 through `/_next/image`. A `ProductImage.url` backfill must run alongside the swap.

Two consequences, and the second is the one that matters most:

1. Add a 🟤 entry to the same `[2026-09-10]` intake group describing the backfill requirement, citing `s3.ts:84`, the images route, and `cdnRemotePatterns()`, and noting that the runbook's Step 4 + Step 12 pre-flight gate now carry the procedure.
2. **Correct `docs/planning/TODO.md`.** Its TASK-056 response-tracking table, row №1a, currently tells the client this is "now a one-variable swap plus a redeploy". That is a **live** doc asserting something now known false — not a frozen plan that takes a superseded note. Rewrite that cell to state the backfill requirement and point at the runbook. Leave the row's 📨 status alone; only the internal-touchpoint text is wrong.

- [ ] **Step 3: Run the docs linter**

Run: `npx prettier --write docs/deployment/setup.md docs/planning/BACKLOG.md docs/planning/TODO.md docs/README.md`
Run: `npx vitest run tests/unit/docs-freshness.test.ts`
Expected: PASS.

- [ ] **Step 4: Full gate run**

Run: `npm run typecheck && npm run lint && npm run test:run && npm run format:check`
Expected: all four clean. This is the pre-PR gate.

- [ ] **Step 5: Commit**

```bash
git add docs/deployment/setup.md docs/planning/BACKLOG.md docs/planning/TODO.md docs/README.md
git commit -m "docs(g19): repoint the superseded checklist, file the CI and CDN-backfill follow-ups"
```

---

## Notes for the executor

- **Do not push or open a PR without the user's word.** Repo convention: wait for approval.
- **The runbook cannot be dry-run.** No domain exists (TASK-056 №1 is still awaiting the client), so Part 1 ships verified by review only. Do not write a Verification Log entry implying otherwise — the asymmetry between the two halves is recorded deliberately in spec §6 and must survive into the close-out.
- **`/products` is client-rendered.** If you find yourself adding a product-content assertion there, re-read spec §2.1 first; that assertion cannot pass and its absence is intentional.

---

## Verification Log

Executed 2026-09-10 on `feat/g19-launch-runbook-deploy-verification`, against production
`https://dropshipping-test.vercel.app`. Every block below is pasted from the actual terminal
output of this session, not reconstructed. `scripts/smoke.ts` and `scripts/smoke-lib.ts` were not
edited at any point.

**Corrected once, in a fix round prompted by review.** The first pass of this log claimed more
than it had shown: it named three staleness outcomes as the complete set of what was live-reachable
and never mentioned the fourth (`NO-CSS`) at all. Nothing in Steps 1–3 below was altered to produce
the correction — the "Fix round 1" section after Step 2 is purely additive new evidence, and the
Summary/Discrepancies sections were edited in place to stop overclaiming. Both states are visible
in git history; this file only shows the corrected version.

### Step 1 — Establish a baseline, then observe the pass/fail paths

**1a. Save a fresh baseline:**

```
$ npm run smoke -- --url https://dropshipping-test.vercel.app --save-baseline .smoke-state.json

> dropshipping@0.1.0 smoke
> tsx scripts/smoke.ts --url https://dropshipping-test.vercel.app --save-baseline .smoke-state.json

baseline saved to .smoke-state.json: 143491e5ab2efd5e, 1ee63df177967359
EXIT_CODE: 0
```

**1b. Run again immediately — no deploy happened in between:**

```
$ npm run smoke -- --url https://dropshipping-test.vercel.app

> dropshipping@0.1.0 smoke
> tsx scripts/smoke.ts --url https://dropshipping-test.vercel.app


  smoke check → https://dropshipping-test.vercel.app

  PASS  GET /                            200, 4 product link(s)
  PASS  GET /products                    200
  PASS  GET /api/products                200, first slug "olimpiyka-lampasy-bila"
  PASS  GET /api/health                  200, database ok
  PASS  GET /categories/hudi             307 → /products?category=hudi
  FAIL  CSS chunk hashes                 UNCHANGED — the build cache may have served stale CSS; redeploy with the cache off (143491e5ab2efd5e, 1ee63df177967359)
  PASS  GET /_next/image (real CDN)      200
  PASS  GET /_next/image (arbitrary)     400
  PASS  GET /_next/image (metadata)      400
  PASS  GET /_next/image (lookalike)     400
  PASS  GET /feed/google-shopping.xml    200, 8 item(s)
  PASS  GET /track                       200
  PASS  GET /sitemap.xml                 200
  PASS  GET /robots.txt                  200

  13 passed, 1 failed

EXIT_CODE: 1
```

Confirmed: 14 result lines, `UNCHANGED` fires for real against production (not just in a
fixture), and the run exits 1, matching spec §3's deliberate bias.

**1c. Confirm the "pass path" with `--allow-missing-baseline`:**

```
$ npm run smoke -- --url https://dropshipping-test.vercel.app --allow-missing-baseline

> dropshipping@0.1.0 smoke
> tsx scripts/smoke.ts --url https://dropshipping-test.vercel.app --allow-missing-baseline


  smoke check → https://dropshipping-test.vercel.app

  PASS  GET /                            200, 4 product link(s)
  PASS  GET /products                    200
  PASS  GET /api/products                200, first slug "olimpiyka-lampasy-bila"
  PASS  GET /api/health                  200, database ok
  PASS  GET /categories/hudi             307 → /products?category=hudi
  FAIL  CSS chunk hashes                 UNCHANGED — the build cache may have served stale CSS; redeploy with the cache off (143491e5ab2efd5e, 1ee63df177967359)
  PASS  GET /_next/image (real CDN)      200
  PASS  GET /_next/image (arbitrary)     400
  PASS  GET /_next/image (metadata)      400
  PASS  GET /_next/image (lookalike)     400
  PASS  GET /feed/google-shopping.xml    200, 8 item(s)
  PASS  GET /track                       200
  PASS  GET /sitemap.xml                 200
  PASS  GET /robots.txt                  200

  13 passed, 1 failed

EXIT_CODE: 1
```

**Nuance, stated plainly:** this command did **not** exit 0. By this point in the sequence the
state file was not missing — 1b had just rewritten it with the same hashes — so the outcome was
still `UNCHANGED`, and per the documented contract `--allow-missing-baseline` waives
`NO-BASELINE` only, never `UNCHANGED`. The flag behaved exactly as designed; the expectation that
this command would be "the clean pass" was mine going in, not a property the script promises. The
useful evidence this step actually produced is that the 13 non-staleness rows passed live.

### Step 2 — Force each failure class

**2.1 Unreachable origin (request-failure path):**

```
$ npm run smoke -- --url https://dropshipping-test.vercel.app.invalid

> dropshipping@0.1.0 smoke
> tsx scripts/smoke.ts --url https://dropshipping-test.vercel.app.invalid

fetch failed
EXIT_CODE: 1
```

Fires for real, but in a different shape than the 13 assertion rows: the homepage `GET /` fetch
(which seeds the CSS hashes / product slugs / remote-image URL every later row depends on) runs
_before_ the per-row `probe()` try/catch exists, so a DNS failure there is caught by the top-level
`main().catch()` handler, not by any row's own error handling. The result is a single `fetch
failed` line on stderr and exit 1 — no 14-row table at all, because no row was ever pushed. This
is worth flagging: the "14 result lines" invariant holds only when the origin itself is reachable.

**2.2 UNCHANGED path again — the brief's own repeat, no tampering needed:**

```
$ npm run smoke -- --url https://dropshipping-test.vercel.app

> dropshipping@0.1.0 smoke
> tsx scripts/smoke.ts --url https://dropshipping-test.vercel.app


  smoke check → https://dropshipping-test.vercel.app

  PASS  GET /                            200, 4 product link(s)
  PASS  GET /products                    200
  PASS  GET /api/products                200, first slug "olimpiyka-lampasy-bila"
  PASS  GET /api/health                  200, database ok
  PASS  GET /categories/hudi             307 → /products?category=hudi
  FAIL  CSS chunk hashes                 UNCHANGED — the build cache may have served stale CSS; redeploy with the cache off (143491e5ab2efd5e, 1ee63df177967359)
  PASS  GET /_next/image (real CDN)      200
  PASS  GET /_next/image (arbitrary)     400
  PASS  GET /_next/image (metadata)      400
  PASS  GET /_next/image (lookalike)     400
  PASS  GET /feed/google-shopping.xml    200, 8 item(s)
  PASS  GET /track                       200
  PASS  GET /sitemap.xml                 200
  PASS  GET /robots.txt                  200

  13 passed, 1 failed

EXIT_CODE: 1
```

Third consecutive identical result — `UNCHANGED` is stable and repeatable, as expected for a
target with no deploy in between.

**2.3 Absent baseline — the NO-BASELINE path:**

```
$ rm -f .smoke-state.json && ls -la .smoke-state.json
ls: cannot access '.smoke-state.json': No such file or directory

$ npm run smoke -- --url https://dropshipping-test.vercel.app

> dropshipping@0.1.0 smoke
> tsx scripts/smoke.ts --url https://dropshipping-test.vercel.app


  smoke check → https://dropshipping-test.vercel.app

  PASS  GET /                            200, 4 product link(s)
  PASS  GET /products                    200
  PASS  GET /api/products                200, first slug "olimpiyka-lampasy-bila"
  PASS  GET /api/health                  200, database ok
  PASS  GET /categories/hudi             307 → /products?category=hudi
  FAIL  CSS chunk hashes                 NO-BASELINE — no stored hashes for this origin; re-run, or pass --allow-missing-baseline (143491e5ab2efd5e, 1ee63df177967359)
  PASS  GET /_next/image (real CDN)      200
  PASS  GET /_next/image (arbitrary)     400
  PASS  GET /_next/image (metadata)      400
  PASS  GET /_next/image (lookalike)     400
  PASS  GET /feed/google-shopping.xml    200, 8 item(s)
  PASS  GET /track                       200
  PASS  GET /sitemap.xml                 200
  PASS  GET /robots.txt                  200

  13 passed, 1 failed

EXIT_CODE: 1
```

`ls` confirms the file was genuinely gone before the run. `NO-BASELINE` is a distinct outcome from
`UNCHANGED` (different detail text, same underlying hashes) and fails without the flag, as
required.

**2.4 Addition beyond the brief's literal steps — confirm the flag actually waives NO-BASELINE
to a real exit-0 pass.**

The task context explicitly lists "`--allow-missing-baseline` waives `NO-BASELINE` only" as a
claim to confirm rather than assume. Steps 1c and 2.2 only ever showed the flag failing to waive
`UNCHANGED`, because a baseline was always present by that point (the script rewrites state on
every run, including failed ones). To actually see the flag waive something, the state file has
to be deleted immediately before a run that also carries the flag:

```
$ rm -f .smoke-state.json && npm run smoke -- --url https://dropshipping-test.vercel.app --allow-missing-baseline

> dropshipping@0.1.0 smoke
> tsx scripts/smoke.ts --url https://dropshipping-test.vercel.app --allow-missing-baseline


  smoke check → https://dropshipping-test.vercel.app

  PASS  GET /                            200, 4 product link(s)
  PASS  GET /products                    200
  PASS  GET /api/products                200, first slug "olimpiyka-lampasy-bila"
  PASS  GET /api/health                  200, database ok
  PASS  GET /categories/hudi             307 → /products?category=hudi
  PASS  CSS chunk hashes                 NO-BASELINE — no stored hashes for this origin; re-run, or pass --allow-missing-baseline (143491e5ab2efd5e, 1ee63df177967359)
  PASS  GET /_next/image (real CDN)      200
  PASS  GET /_next/image (arbitrary)     400
  PASS  GET /_next/image (metadata)      400
  PASS  GET /_next/image (lookalike)     400
  PASS  GET /feed/google-shopping.xml    200, 8 item(s)
  PASS  GET /track                       200
  PASS  GET /sitemap.xml                 200
  PASS  GET /robots.txt                  200

  14 passed, 0 failed

EXIT_CODE: 0
```

This is the only exit-0 run observed in this entire session. It required both an absent state
file and the flag together — exactly the documented contract — and it is the only run in which
all 14 rows were seen passing simultaneously.

### Fix round 1 (post-review) — witness NO-CSS live, confirm origin-keying

Review of the first version of this log found a real gap: `StalenessOutcome` has **four** members
(`CHANGED` / `UNCHANGED` / `NO-BASELINE` / `NO-CSS`), and Steps 1–2 above only ever reached three
of them live. `NO-CSS` — fired when the homepage serves zero `/_next/static/css/*.css` links, and
deliberately never waivable by `--allow-missing-baseline` — was neither exercised nor named
anywhere in the original log, while its summary claimed "the only reachable live outcomes" in a
way that silently generalised past the one outcome nobody had tried. That claim was false:
`NO-CSS` is trivially reachable by pointing the script at any reachable non-Next.js host. This
section fixes the gap by actually witnessing it, rather than by softening the summary's wording.

**1. Force `NO-CSS` — point at a host with no CSS chunk links at all:**

```
$ npm run smoke -- --url https://example.com ; echo "exit: $?"

> dropshipping@0.1.0 smoke
> tsx scripts/smoke.ts --url https://example.com


  smoke check → https://example.com

  FAIL  GET /                            200 but no /products/<slug> link in server HTML — DB-backed render missing
  FAIL  GET /products                    expected 200, got 404
  FAIL  GET /api/products                expected 200, got 404
  FAIL  GET /api/health                  expected 200, got 404
  FAIL  GET /categories/hudi             expected 307, got 404
  FAIL  CSS chunk hashes                 NO-CSS — the page served no stylesheet at all; the deploy is very likely broken
  FAIL  GET /_next/image (real CDN)      no remote image found on the homepage — the rejection probes below prove nothing
  FAIL  GET /_next/image (arbitrary)     expected 400, got 404
  FAIL  GET /_next/image (metadata)      expected 400, got 404
  FAIL  GET /_next/image (lookalike)     expected 400, got 404
  FAIL  GET /feed/google-shopping.xml    expected 200, got 404
  FAIL  GET /track                       expected 200, got 404
  FAIL  GET /sitemap.xml                 expected 200, got 404
  FAIL  GET /robots.txt                  expected 200, got 404

  0 passed, 14 failed

exit: 1
```

`NO-CSS` fired, exactly as documented — no surprise here, but it is now witnessed instead of
assumed. The other 13 rows failing too is expected noise (`example.com` has none of this site's
routes, as the brief anticipated when it warned "expect most other rows to fail as well"); the CSS
row is the one being read.

**2. Confirm the flag does not waive it — the more important half, since non-waivability is the
property with actual consequences:**

```
$ npm run smoke -- --url https://example.com --allow-missing-baseline ; echo "exit: $?"

> dropshipping@0.1.0 smoke
> tsx scripts/smoke.ts --url https://example.com --allow-missing-baseline


  smoke check → https://example.com

  FAIL  GET /                            200 but no /products/<slug> link in server HTML — DB-backed render missing
  FAIL  GET /products                    expected 200, got 404
  FAIL  GET /api/products                expected 200, got 404
  FAIL  GET /api/health                  expected 200, got 404
  FAIL  GET /categories/hudi             expected 307, got 404
  FAIL  CSS chunk hashes                 NO-CSS — the page served no stylesheet at all; the deploy is very likely broken
  FAIL  GET /_next/image (real CDN)      no remote image found on the homepage — the rejection probes below prove nothing
  FAIL  GET /_next/image (arbitrary)     expected 400, got 404
  FAIL  GET /_next/image (metadata)      expected 400, got 404
  FAIL  GET /_next/image (lookalike)     expected 400, got 404
  FAIL  GET /feed/google-shopping.xml    expected 200, got 404
  FAIL  GET /track                       expected 200, got 404
  FAIL  GET /sitemap.xml                 expected 200, got 404
  FAIL  GET /robots.txt                  expected 200, got 404

  0 passed, 14 failed

exit: 1
```

Confirmed: `--allow-missing-baseline` does **not** waive `NO-CSS` — the CSS row still reads `FAIL`
with the identical detail text, live, against a real reachable host, not merely inside a fixture.

**3. Confirm origin-keying survived — production's baseline untouched alongside the new entry:**

```
$ cat .smoke-state.json
{
  "https://dropshipping-test.vercel.app": {
    "cssHashes": [
      "143491e5ab2efd5e",
      "1ee63df177967359"
    ],
    "observedAt": "2026-09-10T06:23:23.116Z"
  },
  "https://example.com": {
    "cssHashes": [],
    "observedAt": "2026-09-10T06:42:27.227Z"
  }
}
```

Production's entry kept its original two hashes and its original `observedAt` timestamp
(`06:23:23.116Z`, last written in step 2.4, before either `example.com` run) — the two
`example.com` runs above wrote their own key and did not touch it. To confirm this isn't merely a
static read but a guarantee the next production run actually relies on:

```
$ npm run smoke -- --url https://dropshipping-test.vercel.app ; echo "exit: $?"

> dropshipping@0.1.0 smoke
> tsx scripts/smoke.ts --url https://dropshipping-test.vercel.app


  smoke check → https://dropshipping-test.vercel.app

  PASS  GET /                            200, 4 product link(s)
  PASS  GET /products                    200
  PASS  GET /api/products                200, first slug "olimpiyka-lampasy-bila"
  PASS  GET /api/health                  200, database ok
  PASS  GET /categories/hudi             307 → /products?category=hudi
  FAIL  CSS chunk hashes                 UNCHANGED — the build cache may have served stale CSS; redeploy with the cache off (143491e5ab2efd5e, 1ee63df177967359)
  PASS  GET /_next/image (real CDN)      200
  PASS  GET /_next/image (arbitrary)     400
  PASS  GET /_next/image (metadata)      400
  PASS  GET /_next/image (lookalike)     400
  PASS  GET /feed/google-shopping.xml    200, 8 item(s)
  PASS  GET /track                       200
  PASS  GET /sitemap.xml                 200
  PASS  GET /robots.txt                  200

  13 passed, 1 failed

exit: 1
```

Production reports `UNCHANGED` — not `NO-BASELINE` — with the same two hashes it has carried all
session. Had the two origins shared one flat baseline instead of being keyed separately, the
`example.com` run's empty hash set would have overwritten production's stored entry and this run
would have reported `NO-BASELINE` instead of `UNCHANGED`. It did not. Origin-keying, previously
established only by `mergeState`/`readBaselineFor`'s unit tests (Task 2), is now also a witnessed
live property, not merely an inferred one.

### Step 3 — Confirm the SSRF rows are not vacuous

Discovered the real R2 CDN URL from the live homepage, the same way the brief's snippet does:

```
$ BASE=https://dropshipping-test.vercel.app
$ REAL=$(curl -s $BASE/ | grep -o 'url=https%3A%2F%2F[^"&]*' | head -1 | sed 's/^url=//')
$ echo "$REAL"
https%3A%2F%2Fpub-444210ee6d61467894be231e22c9cd78.r2.dev%2Fproducts%2F1788304633006-photo_1_2026-08-21_13-03-41.jpg

decoded: https://pub-444210ee6d61467894be231e22c9cd78.r2.dev/products/1788304633006-photo_1_2026-08-21_13-03-41.jpg
```

Built the lookalike host the same way `buildLookalikeUrl()` does — the real host with an
`.evil.example` suffix appended — then ran all four probes by hand:

```
$ curl -s -o /dev/null -w "real      -> %{http_code}\n" "$BASE/_next/image?url=$REAL&w=640&q=75"
real      -> 200
$ curl -s -o /dev/null -w "arbitrary -> %{http_code}\n" "$BASE/_next/image?url=https%3A%2F%2Fexample.invalid%2Fx.png&w=640&q=75"
arbitrary -> 400
$ curl -s -o /dev/null -w "metadata  -> %{http_code}\n" "$BASE/_next/image?url=http%3A%2F%2F169.254.169.254%2Flatest%2Fmeta-data%2F&w=640&q=75"
metadata  -> 400
$ curl -s -o /dev/null -w "lookalike -> %{http_code}\n" "$BASE/_next/image?url=https%3A%2F%2Fpub-444210ee6d61467894be231e22c9cd78.r2.dev.evil.example%2Fx.png&w=640&q=75"
lookalike -> 400
```

Result: `200, 400, 400, 400` — matches expectation exactly on all four.

**Extra corroboration, beyond the brief** (to rule out "these are all 400 because the whole route
is broken," which would make the rejections meaningless the same way an empty allow-list would):
pulled headers/body for the real and the arbitrary case.

```
$ curl -s -D - -o /dev/null "$BASE/_next/image?url=$REAL&w=640&q=75" | grep -i -E "^HTTP|content-type"
HTTP/2 200
content-type: image/jpeg

$ curl -s -D - "$BASE/_next/image?url=https%3A%2F%2Fexample.invalid%2Fx.png&w=640&q=75" | tail -c 500
HTTP/2 400
cache-control: public, max-age=0, must-revalidate
content-type: text/plain; charset=utf-8
date: Thu, 10 Sep 2026 06:23:54 GMT
server: Vercel
strict-transport-security: max-age=63072000; includeSubDomains; preload
x-vercel-error: INVALID_IMAGE_OPTIMIZE_REQUEST
x-vercel-id: arn1::jg4ff-1789021434365-909a47ad4e89
content-length: 84

Bad request

INVALID_IMAGE_OPTIMIZE_REQUEST

arn1::jg4ff-1789021434365-909a47ad4e89
```

The 200 is genuine image bytes (`content-type: image/jpeg`); the 400 carries Vercel's own
`x-vercel-error: INVALID_IMAGE_OPTIMIZE_REQUEST` — Next's image optimizer's `remotePatterns`
allow-list rejecting the host by name, not a generic WAF/edge 400 that would reject every request
indiscriminately. That distinction is what makes the three rejection rows meaningful rather than
vacuous: a build with an empty `remotePatterns` would 400 the real CDN host too, and it does not.

### Summary — what was actually observed failing vs. only ever observed passing

**`StalenessOutcome` has four members, so the "CSS chunk hashes" row gets its own breakdown rather
than one summary-table cell** (cramming all four into one cell is exactly how the first version of
this log lost track of one of them):

| Outcome       | Witnessed live?                                 | Where                                                                              |
| ------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------- |
| `UNCHANGED`   | Yes — fails                                     | steps 1b, 1c, 2.2 (production; baseline present and hashes match)                  |
| `NO-BASELINE` | Yes — fails without the flag, passes with it    | step 2.3 (fails), step 2.4 (passes, the session's only exit-0 run)                 |
| `NO-CSS`      | Yes — fails, and the flag does **not** waive it | Fix round 1 (this log): `example.com`, with and without `--allow-missing-baseline` |
| `CHANGED`     | **No — never witnessed live**                   | requires a real deploy changing the served CSS; did not happen this session        |

| Row                                                                                                                                                                                           | Observed FAILING live, this session                                               | Observed PASSING live, this session                                                               |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| CSS chunk hashes                                                                                                                                                                              | Yes — 3 of 4 outcomes (`UNCHANGED`, `NO-BASELINE`, `NO-CSS`); see breakdown above | Yes — `NO-BASELINE` waived (step 2.4); `CHANGED` never observed either way                        |
| Whole-script unreachable-origin path (not a row — the top-level catch)                                                                                                                        | Yes — step 2.1, `fetch failed`, exit 1, no row table printed                      | n/a                                                                                               |
| Origin-keying (not a row — a property of the state file)                                                                                                                                      | n/a                                                                               | Yes — Fix round 1: production's baseline survived two `example.com` runs untouched                |
| GET / , GET /products, GET /api/products, GET /api/health, GET /categories/hudi, GET /\_next/image ×4, GET /feed/google-shopping.xml, GET /track, GET /sitemap.xml, GET /robots.txt (13 rows) | **No** — never observed failing against production in this session                | Yes — passed in all 6 live table runs against production (1b, 1c, 2.2, 2.3, 2.4, fix-round check) |

The 13 assertion rows' failure branches were **not** reproduced against production. Per the
brief's own instruction ("note that in the log rather than trying to break production"), they are
covered instead by the 34 fixture-based unit tests in `tests/unit/smoke.test.ts` (Task 3), which
call each `assert*` function directly against constructed `HttpResponse` fixtures (wrong status,
empty `data[]`, a non-JSON body, a redirect to the wrong location, a 200 that merely _looks_ like
a redirect, an empty feed, and so on) with no network involved. That is real but narrower evidence
than "observed failing live": it establishes the assertion logic is correct against constructed
inputs, not that anyone has currently made production emit those inputs. This session did not
attempt to take the site down, corrupt the feed, or break the DB connection to force those rows
red for real — doing that to production was out of scope and would have been actively harmful.

Three things were exercised end-to-end against a live target in this session, not two: the
**four**-state staleness logic (three of its four outcomes witnessed failing, one of those three
also witnessed passing when waived, the fourth — `CHANGED` — never witnessed at all; see the
breakdown above), the whole-script unreachable-origin path, and (fix round 1) origin-keying as a
live property of the state file rather than only a unit-tested one. All three held exactly as
documented, with zero edits to `scripts/smoke.ts` or `scripts/smoke-lib.ts` at any point, including
during the fix round.

### Discrepancies / anything unexpected

- Step 1c did not produce the "clean pass" the brief's step ordering seems to anticipate. Not a
  defect — see the Nuance note under 1c: `--allow-missing-baseline` did exactly what its own
  detail message and the spec say it does; my expectation was the thing that needed correcting.
- The unreachable-origin failure (2.1) does not print a 14-row table — it dies on the very first
  fetch, before any row exists, caught by `main().catch()` rather than the per-row `probe()`
  wrapper. Both paths correctly exit non-zero, but the shapes differ, which matters for anyone
  writing an alert on top of this script's output later.
- No row other than the CSS-staleness row was ever observed failing **against production**. This
  matches the brief's own expectation and is the deliberate scope of this task, not a gap. (Every
  row failed against `example.com` in the fix round, but that target was used once, deliberately,
  only to force `NO-CSS` — it says nothing about production's other 13 rows.)
- `npm run smoke -- --save-baseline <file>` takes a separate code path (`saveBaselineOnly`) that
  never builds the row table or touches `exitCodeFor` — it prints one line and exits 0 on any
  successful fetch. By design (Task 4), but worth naming: the "exits 0 only if every row passed"
  invariant applies to the probe-and-report mode, not the save-baseline mode.
- Production stayed reachable and unmodified by this session throughout (confirmed with a plain
  `curl` before starting); the only local file touched outside the plan doc was the gitignored
  `.smoke-state.json`, which this session deleted and rewrote several times per the steps above
  and left present with a valid baseline afterward.
- **`CHANGED` — the outcome a real post-deploy run is supposed to produce — was never observed
  live in this session**, and could not have been against production specifically: it requires the
  served CSS hashes to actually differ from the stored baseline, which only happens after a real
  deploy, and no deploy happened this session (out of scope — this task verifies the script, not
  the deploy pipeline). `CHANGED` is covered only by `compareBaseline`'s fixture-based unit tests
  (Task 2). The next real production deploy is the first opportunity to see it fire live, and that
  is exactly the scenario the launch runbook (Task 6) points at.
- **The `NO-CSS` gap itself was caught by review, not by this session's own self-review pass.** The
  first version of this log's self-review confirmed every _documented_ claim was backed by
  evidence, but did not check the claim's completeness against `StalenessOutcome`'s actual
  membership — a real miss, recorded here rather than smoothed over, since the point of this
  document is to be honest about what was and wasn't caught, and by whom.

### PR #45 review round — 2026-09-10

Three findings, all accepted, all in the "a comment describes behaviour the code does not have"
class. No functional change to any probe. Fixes in `01bd910`; this entry and the Step 3 snippet
correction above are the propagation half.

1. **`compareBaseline`'s docstring still opened "Three outcomes, not two"** while the function
   returned four. `NO-CSS` was added mid-branch and the final review round (`3a2f2fb`) propagated
   "four-state" into the README, the spec, this plan's prose and the runbook — the docstring
   sitting directly above the function was the one surface missed. The Step 3 implementation
   snippet in this file carried the same stale docstring above an already-updated body, and is
   corrected in the same commit as this entry.

2. **The test labelled "Load-bearing" was not.** `PRODUCT_SLUG_RE`'s lookahead already rejected the
   fixture — the segment is followed by `.js`, and `.` is not in the lookahead set — so it returned
   `[]` with _and_ without the `/_next` strip. Deleting the strip would have failed nothing: it was
   untested shipped code. The finding was about a comment; the fix went further, because the
   comment was wrong for a reason worth keeping. The existing case keeps its fixture (it guards a
   real observed input) with a comment that now names the lookahead as what rejects it, and a
   second case was added as a genuine negative control:
   `/_next/static/media/products/hero-banner/1x.avif`, whose `/products/` segment ends in `/` —
   which the lookahead _does_ admit, so only the strip stops it. Verified by neutering the strip:
   the new case fails with `["hero-banner"]` while all 34 others pass. 35 smoke tests, was 34.

3. **`smoke.ts`'s header overclaimed what is discovered at run time** — "everything except the
   category slug `hudi`" — when eight probed paths are literals. Narrowed to the scope spec
   Decision 5 already stated correctly: the route paths _are_ the probe definitions; what is
   discovered is the data (CSS hashes, product slugs, the remote image URL).

**Recorded, not fixed**, with the reasoning, so the next reader does not re-litigate them:

- **The `/_next` strip guards a shape that does not currently occur.** Every real Next asset path
  ends in an extension, so today the lookahead does all the work and the strip is defence in depth.
  Kept — the cost is one `String.replace`, the failure it prevents is a homepage assertion that
  passes on an empty catalog — but it is now honestly labelled and, for the first time, tested.
- **`scripts/smoke.ts`'s `JSON.parse(...) as SmokeState`.** An ordinary parse-result assertion on
  data the next call runtime-checks: `readBaselineFor`'s `Array.isArray(entry.cssHashes)` degrades
  a bad shape to `null` → `NO-BASELINE` → non-zero exit. Fails closed; left alone rather than
  widened in a comment-only round.
- **`CHANGED` still has never been witnessed live.** Unchanged by this round, and unchangeable
  before a real deploy — see the bullet above.

**Residual after this round:** the spec's Decision 2 still reads "three outcomes, not two", which
is correct treatment — it is a frozen design doc and carries a `Superseded 2026-09-10` note
directly beneath it. Do not "fix" it.

**Second propagation pass.** The pass above was itself incomplete, in the shape it diagnosed: a
keyword sweep finds prose but not a _count_ or a _code snippet_ quoting the old text. Three more
instances, corrected here — Task 3 Step 4's expected test count (34, now 35 after the negative
control), Task 4's embedded `scripts/smoke.ts` header snippet (still carrying the "everything
except `hudi`" overclaim finding 3 removed from the shipped file), and the PR #45 description
itself, which repeated both the old count and the overclaim. The lesson is not "sweep harder": a
doc that _quotes_ code has no keyword in common with the change that invalidates it, so the
reliable check is to diff embedded snippets against their source file rather than grep for phrases.

**Recorded, not fixed:** Task 2 Step 5's commit-message block still reads
`"feat(g19): origin-keyed baseline state with three-state staleness"`. That is a verbatim quote of
real commit `b222db2`, whose message genuinely said that — the plan records what was run, and
editing it would falsify the record rather than correct it.

**Third propagation pass — and the guard that ends the series.** The second pass fixed one count
and one snippet, then reported both embedded snippets "verified equal to their source files
programmatically". That verification was scoped to the paragraphs it had just edited, so it could
not have found what remained: **three more drifted snippets and two more stale counts.** A check
narrowed to what you already know is broken is the same "cannot fail" shape this plan has now
diagnosed three times.

Found by diffing every fenced `ts` block against the file its heading names, rather than grepping
for known-bad phrases:

- **Task 1's test snippet** still carried the `// Load-bearing:` comment and the old test name
  `it("ignores /_next chunk paths that contain /products/")` — finding 2's own text, surviving two
  passes at finding 2.
- **Task 1's `smoke-lib.ts` snippet** still carried the old `extractProductSlugs` JSDoc.
- **Task 4's `smoke.ts` snippet** predated `3a2f2fb`: the `--baseline` flag description lacked the
  read/write wording, and the real-CDN row still showed a bare `assertStatus(200)` where the
  shipped row resolves `remoteHost` and reports `200 — <host>`.
- **Two counts upstream of the one that was fixed.** The negative control lives in the
  `extractProductSlugs` describe, which **Task 1** writes — so Task 1 is 8 (was 7) and Task 2 is 18
  (was 17). The second pass credited the extra test to Task 3, whose snippet still contains 17.
  Correct breakdown: 8 + 10 + 17 = 35.

All snippet text above was copied from the source files programmatically, never retyped.

**The guard: `tests/unit/plan-snippets.test.ts`.** It parses every fenced `ts` block in
`docs/planning/plans/*.md`, resolves the source file from the heading above the fence, and asserts
every non-blank line appears verbatim in that file. Archived plans under `docs/archive/plans/` are
excluded by construction — they are frozen records and are supposed to drift. Import lines are
checked as a **subset** rather than skipped, since plans build a test file's import incrementally,
so a symbol the plan names that no longer exists still fails. A `snippets.length > 0` assertion
guards the parser itself: one that silently matched nothing would pass forever.

Mutation-tested rather than assumed. Reverting a snippet comment to its superseded wording fails
with `plan:312 not in scripts/smoke-lib.ts`; renaming an imported symbol fails with
`imports missing symbol: extractProductSlugsRenamed`; restoring both returns 8 passed. The fourth
recurrence fails CI instead of needing a reviewer to notice it.
