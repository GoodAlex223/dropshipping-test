import { describe, it, expect } from "vitest";
import {
  extractCssHashes,
  extractProductSlugs,
  findRemoteImageUrl,
  compareBaseline,
  stalenessPasses,
  readBaselineFor,
  mergeState,
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
