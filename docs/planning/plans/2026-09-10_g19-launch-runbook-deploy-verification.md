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
- **Three-state staleness (spec Decision 2)**: `CHANGED` passes · `UNCHANGED` fails · `NO-BASELINE` fails unless `--allow-missing-baseline`. A missing state file must never make the check silently inconclusive.
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

  // Load-bearing: /products ships a chunk path containing the literal
  // "/products/page-<hash>.js". Counting that as a product would make the
  // homepage's DB-backed assertion pass on a page with no products at all.
  it("ignores /_next chunk paths that contain /products/", () => {
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
 * `/_next/**` is stripped FIRST and deliberately: the catalog page ships a
 * chunk named `/_next/static/chunks/app/(shop)/products/page-<hash>.js`, which
 * a naive match would report as the product "page-<hash>" — turning the
 * homepage's DB-backed assertion into one that passes on an empty catalog.
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
Expected: PASS, 7 tests.

Then: `npm run typecheck` — expected: clean (this file is inside the tsconfig include).

- [ ] **Step 5: Commit**

```bash
git add scripts/smoke-lib.ts tests/unit/smoke.test.ts
git commit -m "feat(g19): extraction helpers for the post-deploy smoke script"
```

---

### Task 2: Baseline state and three-state staleness

**Files:**

- Modify: `scripts/smoke-lib.ts`
- Test: `tests/unit/smoke.test.ts`

**Interfaces:**

- Consumes: nothing from Task 1.
- Produces: `type StalenessOutcome = "CHANGED" | "UNCHANGED" | "NO-BASELINE"` · `interface SmokeState` · `compareBaseline(observed: string[], stored: string[] | null): StalenessOutcome` · `stalenessPasses(outcome: StalenessOutcome, allowMissing: boolean): boolean` · `readBaselineFor(state: SmokeState, origin: string): string[] | null` · `mergeState(state: SmokeState, origin: string, cssHashes: string[], observedAt: string): SmokeState`.

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
 * Three outcomes, not two. An absent baseline is NOT a pass: a check that
 * cannot fail looks exactly like one that passes, and this one guards a real
 * incident (Vercel served byte-identical stale CSS across two deploys).
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
Expected: PASS, 17 tests (7 from Task 1 + 10 here).

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
Expected: PASS, 34 tests (7 from Task 1 + 10 from Task 2 + 17 here).

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
 *   --baseline <file>           read the CSS-hash baseline from this file
 *   --save-baseline <file>      write the observed baseline here and exit 0
 *   --allow-missing-baseline    NO-BASELINE stops being a failure
 *   --json                      emit results as JSON (exit contract unchanged)
 *
 * Everything except the category slug `hudi` (row 5, a route-shape assertion)
 * is discovered from the target's own homepage at run time, so the script
 * survives catalog edits and the real-domain cutover without an edit.
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
    await probe(
      "GET /_next/image (real CDN)",
      imageProbeUrl(origin, remoteImage),
      assertStatus(200)
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

- [ ] **Step 3: Run the docs linter**

Run: `npx prettier --write docs/deployment/setup.md docs/planning/BACKLOG.md docs/README.md`
Run: `npx vitest run tests/unit/docs-freshness.test.ts`
Expected: PASS.

- [ ] **Step 4: Full gate run**

Run: `npm run typecheck && npm run lint && npm run test:run && npm run format:check`
Expected: all four clean. This is the pre-PR gate.

- [ ] **Step 5: Commit**

```bash
git add docs/deployment/setup.md docs/planning/BACKLOG.md docs/README.md
git commit -m "docs(g19): repoint the superseded pre-deployment checklist, file the CI follow-up"
```

---

## Notes for the executor

- **Do not push or open a PR without the user's word.** Repo convention: wait for approval.
- **The runbook cannot be dry-run.** No domain exists (TASK-056 №1 is still awaiting the client), so Part 1 ships verified by review only. Do not write a Verification Log entry implying otherwise — the asymmetry between the two halves is recorded deliberately in spec §6 and must survive into the close-out.
- **`/products` is client-rendered.** If you find yourself adding a product-content assertion there, re-read spec §2.1 first; that assertion cannot pass and its absence is intentional.
