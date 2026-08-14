import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useTranslations } from "next-intl";
import { createElement } from "react";
import { renderWithIntl } from "../helpers/render-with-intl";
import uk from "../../messages/uk.json";
import ru from "../../messages/ru.json";

type Tree = { [k: string]: string | Tree };

function leaves(tree: Tree, prefix = ""): Array<[string, string]> {
  return Object.entries(tree).flatMap(([k, v]) =>
    typeof v === "string" ? [[`${prefix}${k}`, v] as [string, string]] : leaves(v, `${prefix}${k}.`)
  );
}

/**
 * Render probe for the brief's Step 4 fallback: `createTranslator` is NOT
 * actually exported from "next-intl" in the installed v4.13.6 — confirmed by
 * grepping node_modules/next-intl/dist for the symbol, which only turns up
 * inside the server-only, react-server-conditioned internals (unreachable
 * from Vitest, which resolves next-intl's client build regardless of
 * "use client"/async status — Vitest has no concept of the React Server
 * Components module graph Next's own bundler builds). So every assertion
 * below that needs a REAL next-intl render (not just a plain JSON value
 * read) goes through `NextIntlClientProvider` via `renderWithIntl` and this
 * probe component instead. The assertion this guards — rendered output
 * equals the verbatim string — is unchanged from the brief's stated intent.
 */
function Probe({
  namespace,
  msgKey,
  values,
}: {
  namespace: string;
  msgKey: string;
  values?: Record<string, string | number>;
}) {
  const t = useTranslations(namespace);
  return createElement("span", null, t(msgKey, values));
}

describe("message catalogs", () => {
  it("ru contains no orphan keys (every ru key path exists in uk — uk is the schema)", () => {
    const ukKeys = new Set(leaves(uk as Tree).map(([k]) => k));
    const orphans = leaves(ru as Tree)
      .map(([k]) => k)
      .filter((k) => !ukKeys.has(k));
    expect(orphans).toEqual([]);
  });

  it("never advertises retracted services in any locale (G8/site.ts retraction rulings)", () => {
    const all = [...leaves(uk as Tree), ...leaves(ru as Tree)]
      .map(([, v]) => v)
      .join(" ")
      .toLowerCase();
    expect(all).not.toMatch(
      /обмін розміру|обмен размера|безкоштовна доставка|бесплатная доставка|free delivery|size exchange/
    );
  });

  it("renders apostrophe-bearing UA copy through ICU unchanged", () => {
    renderWithIntl(createElement(Probe, { namespace: "site", msgKey: "announcement.linkLabel" }));
    expect(screen.getByText("Розкажіть нам через форму зворотного зв'язку")).toBeInTheDocument();
  });

  // Controller-added (closes a deferral noted in Task 3's report): the 11-14
  // teen exception must land on "many", not "few" — a naive "ends in 1 → one"
  // or "ends in 2-4 → few" implementation would mis-render 11 specifically.
  it("hits the ICU many-branch for the 11-14 teen exception (cart.itemsCount, count=11)", () => {
    renderWithIntl(
      createElement(Probe, { namespace: "cart", msgKey: "itemsCount", values: { count: 11 } })
    );
    expect(screen.getByText("11 товарів")).toBeInTheDocument();
  });

  it("wraps the slogan into exactly two lines (client brief's three-line split was not used)", () => {
    expect(uk.home.hero.headline1).toBe("СТИЛЬ. ЯКІСТЬ.");
    expect(uk.home.hero.headline2).toBe("ВПЕВНЕНІСТЬ.");
  });

  it("provides the six always-true why-choose-us claims, plus a non-empty intro", () => {
    expect(Object.keys(uk.home.whyChooseUs.items)).toHaveLength(6);
    expect(uk.home.whyChooseUs.intro.length).toBeGreaterThan(0);
  });

  // Supersedes content.test.ts's former "site header content" describe block
  // (site.header.search.viewAll/noResults no longer exist on the trimmed
  // content module — the functions moved to ICU {query} templates here).
  it("wraps search queries in Ukrainian guillemets with the query interpolated", () => {
    renderWithIntl(
      createElement(Probe, {
        namespace: "header",
        msgKey: "search.viewAll",
        values: { query: "test" },
      })
    );
    expect(screen.getByText("Всі результати для «test»")).toBeInTheDocument();

    renderWithIntl(
      createElement(Probe, {
        namespace: "header",
        msgKey: "search.noResults",
        values: { query: "test" },
      })
    );
    expect(screen.getByText("Нічого не знайдено за запитом «test»")).toBeInTheDocument();
  });
});
