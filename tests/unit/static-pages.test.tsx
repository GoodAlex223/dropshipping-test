import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { mockServerIntl } from "../helpers/server-intl";

mockServerIntl();

import { StaticPage } from "@/components/pages/StaticPage";

/**
 * StaticPage is an async Server Component. React 18 + RTL cannot render one
 * directly, so we await the component function to get its element tree and
 * render that — the standard vitest approach for RSC.
 */
describe("<StaticPage/>", () => {
  it("renders the catalog title for a namespace that has no sections yet", async () => {
    const ui = await StaticPage({ namespace: "pages.terms" });
    render(ui);

    // The value comes from messages/uk.json, so this asserts against production
    // copy, not a fixture. Task 1 seeded pages.terms with an empty sections
    // array, so this also pins the empty-state path: no <h2>, no crash.
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Публічна оферта");
    expect(screen.queryAllByRole("heading", { level: 2 })).toHaveLength(0);
  });
});
