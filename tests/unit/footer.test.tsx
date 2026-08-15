import { screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { renderWithIntl } from "../helpers/render-with-intl";

vi.mock("@/components/common/NewsletterSignup", () => ({
  NewsletterSignup: () => <div data-testid="newsletter" />,
}));

import { Footer } from "@/components/common/Footer";

describe("Footer", () => {
  it("uses the Mirox tagline, not the generic template copy", () => {
    renderWithIntl(<Footer />);
    expect(screen.queryByText(/one-stop shop for quality products/i)).not.toBeInTheDocument();
    expect(screen.getByText(/цінує якість і мінімалізм/)).toBeInTheDocument();
  });

  it("links to the social profiles", () => {
    renderWithIntl(<Footer />);
    expect(screen.getByRole("link", { name: /Instagram/ })).toBeInTheDocument();
  });

  it("links only to routes that exist, and still contains real navigation", () => {
    renderWithIntl(<Footer />);
    const dead = ["/contact", "/faq", "/shipping", "/returns", "/about", "/privacy", "/terms"];
    const links = screen.getAllByRole("link");
    const hrefs = links
      .map((link) => link.getAttribute("href"))
      .filter((href): href is string => href !== null);

    // Guard against a vacuous pass: a footer with zero (or gutted) links would
    // trivially satisfy "contains none of the dead routes" below. Assert the
    // real links we expect to survive the rewrite are actually there.
    expect(hrefs.length).toBeGreaterThan(0);
    expect(hrefs).toContain("/products");
    expect(hrefs).toContain("/categories");

    for (const route of dead) {
      expect(hrefs).not.toContain(route);
    }
  });

  it("uses the Ukrainian copyright-row link labels", () => {
    renderWithIntl(<Footer />);
    expect(screen.getByRole("link", { name: "Каталог" })).toHaveAttribute("href", "/products");
    expect(screen.getByRole("link", { name: "Категорії" })).toHaveAttribute("href", "/categories");
    expect(screen.getByRole("link", { name: "Новинки" })).toHaveAttribute(
      "href",
      "/products?sortBy=createdAt&sortOrder=desc"
    );
    expect(screen.getByRole("link", { name: "Зворотний зв'язок" })).toHaveAttribute(
      "href",
      "/feedback"
    );
  });

  it("invites visitors to follow along on social", () => {
    renderWithIntl(<Footer />);
    expect(screen.getByText("Слідкуйте за нами")).toBeInTheDocument();
  });
});
