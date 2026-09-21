import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { SHOP_LINK_GROUPS } from "@/components/common/Footer";

/**
 * The no-dead-links rule (user ruling 2026-07-28) as a test.
 *
 * TASK-035 hid the footer's info links rather than ship 404s, and the rule has
 * been enforced by memory ever since. Stated conventions are not controls:
 * this walks every internal href the chrome renders and asserts a route file
 * exists for it.
 */

const APP_DIR = path.resolve(__dirname, "../../src/app");

/**
 * Header hrefs, DERIVED from the source file rather than hand-mirrored.
 *
 * Controller ruling R5: Header.tsx is "use client" and importing it drags in
 * next-auth and zustand, so a direct import is impractical — but a hand-copied
 * mirror rots silently, leaving this guard green while the header drifts,
 * which is the exact failure the guard exists to prevent. So: read the file,
 * extract its href literals, and assert the extracted set covers what we
 * expect BEFORE walking it.
 */
const HEADER_SRC = readFileSync(
  path.resolve(__dirname, "../../src/components/common/Header.tsx"),
  "utf8"
);
//
// DEVIATION FROM THE TASK-8 BRIEF, recorded here rather than silently: the
// brief's regex was `/href=\{?"(\/[^"]*)"/g`, which only matches a JSX
// literal (`href="..."` / `href={"..."}`). `navigation`'s entries are
// object-literal properties (`href: "/products"`), rendered in JSX via the
// *variable* `href={item.href}` — never a literal — so the brief's regex
// cannot see `/products`, `/products?sort=new`, `/products?sort=popular` or
// `/contact` at all, and this test fails at brief Step 4 as written (proved
// by running it before this fix). The `[:=]` class below additionally
// matches the object-literal `href: "..."` form the `navigation` array
// actually uses, which is what Step 5's third control (delete the
// `contacts` entry from the array, expect this test to go red) requires in
// order to mean anything.
const HEADER_HREFS = [...HEADER_SRC.matchAll(/href[:=]\s*\{?"(\/[^"]*)"/g)].map((m) => m[1]);

/** What the header is expected to link. Update deliberately, with the header. */
const EXPECTED_HEADER_HREFS = [
  "/products",
  "/products?sort=new",
  "/products?sort=popular",
  "/contact",
  "/categories",
];

function routeFileFor(href: string): string {
  const pathname = href.split("?")[0].replace(/\/$/, "") || "/";
  const segments = pathname === "/" ? [] : pathname.slice(1).split("/");
  return path.join(APP_DIR, "(shop)", ...segments, "page.tsx");
}

describe("navigation link integrity", () => {
  const footerHrefs = SHOP_LINK_GROUPS.flatMap((g) => g.links.map((l) => l.href));
  const allHrefs = [...EXPECTED_HEADER_HREFS, ...footerHrefs];

  it("walks a non-empty, independently counted set of links", () => {
    // Guard the guard: 5 shop + 7 info. A silently emptied SHOP_LINK_GROUPS
    // would otherwise make every assertion below vacuous.
    expect(footerHrefs).toHaveLength(12);
    expect(allHrefs).toHaveLength(17);
  });

  it("still sees every href the header source actually renders", () => {
    // R5: fails loudly if the header nav changes without this guard being
    // updated, instead of drifting green against a stale copy.
    for (const href of EXPECTED_HEADER_HREFS) {
      expect(HEADER_HREFS).toContain(href);
    }
  });

  it.each([...new Set(allHrefs)])("%s resolves to a route file", (href) => {
    const candidate = routeFileFor(href);
    const isRoot = href === "/";
    expect(isRoot || existsSync(candidate)).toBe(true);
  });
});
