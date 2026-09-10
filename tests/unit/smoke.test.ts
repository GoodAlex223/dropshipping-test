import { describe, it, expect } from "vitest";
import {
  extractCssHashes,
  extractProductSlugs,
  findRemoteImageUrl,
  compareBaseline,
  stalenessPasses,
  readBaselineFor,
  mergeState,
  assertStatus,
  assertHomepage,
  assertProductsApi,
  assertHealth,
  assertCategoryRedirect,
  assertFeed,
  countFeedItems,
  buildLookalikeUrl,
  exitCodeFor,
} from "../../scripts/smoke-lib";

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
