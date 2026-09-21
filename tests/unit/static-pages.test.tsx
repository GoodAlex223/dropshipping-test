import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { mockServerIntl } from "../helpers/server-intl";
import { RETURN_WINDOW_DAYS } from "@/content/legal";
import uk from "../../messages/uk.json";

mockServerIntl();

import { StaticPage } from "@/components/pages/StaticPage";

/**
 * StaticPage is an async Server Component. React 18 + RTL cannot render one
 * directly, so we await the component function to get its element tree and
 * render that — the standard vitest approach for RSC.
 */
describe("<StaticPage/>", () => {
  it("renders the catalog title and intro for a namespace", async () => {
    const ui = await StaticPage({ namespace: "pages.terms" });
    render(ui);

    // The values come from messages/uk.json, so this asserts against production
    // copy, not a fixture. Task 1's empty-sections assertion is gone by
    // construction: pages.terms now carries the real twelve-clause offer, and
    // no catalog namespace is section-less any more, so there is nothing left
    // to drive the empty branch with. The branch itself is still `?? []` in
    // StaticPage; it is simply unreachable from the catalog today.
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Публічна оферта");
    expect(screen.getByText(uk.pages.terms.intro)).toBeInTheDocument();
  });
});

/**
 * The three legal pages are the §5.3 item-9 gate: no Ukrainian payment
 * gateway onboards a merchant without a published public offer and return
 * policy. The floor per page is asserted below against the catalog's own
 * count, not `> 0` — an empty `sections` array would satisfy `> 0` on the
 * rendered side only by also emptying the expectation, which is exactly the
 * failure mode a vacuous guard hides.
 */
const LEGAL_PAGES = ["terms", "privacy", "returns"] as const;

describe.each(LEGAL_PAGES)("pages.%s", (slug) => {
  it("renders its title and at least five sections, all non-empty", async () => {
    const ui = await StaticPage({ namespace: `pages.${slug}` });
    render(ui);

    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent?.trim().length ?? 0).toBeGreaterThan(0);

    const headings = screen.getAllByRole("heading", { level: 2 });
    // Independently computed: the catalog's own section count, not `> 0`.
    const sections = uk.pages[slug].sections;
    expect(headings).toHaveLength(sections.length);
    expect(sections.length).toBeGreaterThanOrEqual(5);

    for (const heading of headings) {
      expect(heading.textContent?.trim()).not.toBe("");
    }

    // Every section must actually say something — a heading with an empty
    // body array renders as a bare <h2> and would still pass the count check.
    for (const section of sections) {
      expect(section.body.length).toBeGreaterThan(0);
      for (const paragraph of section.body) {
        expect(paragraph.trim()).not.toBe("");
      }
      // Same teeth for the optional list: `list: [""]` renders an empty <li>
      // and would otherwise sail past every assertion above.
      if ("list" in section && section.list) {
        expect(section.list.length).toBeGreaterThan(0);
        for (const item of section.list) {
          expect(item.trim()).not.toBe("");
        }
      }
    }
  });

  it("names no forbidden fact", async () => {
    const ui = await StaticPage({ namespace: `pages.${slug}` });
    const { container } = render(ui);
    const text = container.textContent ?? "";
    // TASK-056 rows 4 and 14: no invented contact data, no third-party brands,
    // no authenticity claim. These are the facts we do not hold.
    for (const forbidden of [
      "Palm Angels",
      "Polo Ralph Lauren",
      "Lacoste",
      "оригінал",
      "репліка",
      "Укрпошта",
    ]) {
      expect(text).not.toContain(forbidden);
    }
    expect(text).not.toMatch(/\+380/);
    // The requisites the client has never supplied. <SellerRequisites/> owns
    // that block and renders its null branch; the prose must never pre-empt it.
    expect(text).not.toMatch(/ЄДРПОУ|РНОКПП/);
  });
});

/**
 * RETURN_WINDOW_DAYS had no production consumer: the copy says «14 днів» as a
 * literal, because StaticPage reads sections with `t.raw()`, which performs no
 * ICU interpolation — so the constant cannot be threaded through the catalog.
 *
 * This is the tie instead. The constant is imported, so changing it to 30
 * turns these red and points whoever changed it at the prose they must change
 * with it. `дн` is the shared prefix of «днів»/«дня»/«день», so the assertion
 * survives a grammatically different rewrite of the surrounding sentence
 * without going vacuous on the number itself.
 */
describe("the return window in the catalog", () => {
  const needle = `${RETURN_WINDOW_DAYS} дн`;

  it("is stated in pages.returns", () => {
    expect(JSON.stringify(uk.pages.returns)).toContain(needle);
  });

  it("is stated in pages.terms, which summarises the same right", () => {
    expect(JSON.stringify(uk.pages.terms)).toContain(needle);
  });

  it("states no OTHER day-count as the return window", () => {
    // Guard the guard: `toContain` alone would still pass if the copy also
    // carried a stale «14 днів» next to a new «30 днів». Every day-count that
    // appears within one clause of «поверн»/«обмін» must be the constant.
    const windows = new Set(
      [uk.pages.returns, uk.pages.terms]
        .flatMap((page) => page.sections)
        .flatMap((section) => [...section.body, ...(("list" in section && section.list) || [])])
        .filter((text) => /поверн|обмін/i.test(text))
        .flatMap((text) => [...text.matchAll(/(\d+)\s+дн/g)].map((m) => Number(m[1])))
    );
    expect([...windows]).toEqual([RETURN_WINDOW_DAYS]);
  });
});
