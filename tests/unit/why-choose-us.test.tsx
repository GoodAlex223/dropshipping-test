import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/content/site", () => ({
  site: { claims: { olxSales: "300+", instagramOrders: "100+", customerRating: null } },
}));

import { WhyChooseUs } from "@/components/home/WhyChooseUs";

describe("WhyChooseUs", () => {
  it("renders a stat for each configured claim and omits null ones", () => {
    render(<WhyChooseUs />);
    expect(screen.getByText("300+")).toBeInTheDocument();
    expect(screen.getByText("100+")).toBeInTheDocument();
    // customerRating is null → its label must not appear.
    expect(screen.queryByText(/customer rating/i)).toBeNull();
  });

  it("renders on a dark surface", () => {
    const { container } = render(<WhyChooseUs />);
    expect(container.querySelector('[data-surface="dark"]')).not.toBeNull();
  });

  it("renders the supporting brand-voice items", () => {
    render(<WhyChooseUs />);
    expect(screen.getByText("Secure payment")).toBeInTheDocument();
  });
});
