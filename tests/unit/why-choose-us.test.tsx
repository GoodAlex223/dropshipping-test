import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ClientClaims } from "@/content/site";

const mockClaims: ClientClaims = {
  olxSales: "300+",
  instagramOrders: "100+",
  customerRating: null,
};

vi.mock("@/content/site", () => ({
  site: {
    get claims() {
      return mockClaims;
    },
  },
}));

vi.mock("@/content/home", () => ({
  home: {
    whyChooseUs: {
      title: "Why choose us",
      items: ["Fast delivery across Ukraine", "Secure payment"],
    },
  },
}));

import { WhyChooseUs } from "@/components/home/WhyChooseUs";

beforeEach(() => {
  mockClaims.olxSales = "300+";
  mockClaims.instagramOrders = "100+";
  mockClaims.customerRating = null;
});

describe("WhyChooseUs", () => {
  it("renders every always-true claim", () => {
    render(<WhyChooseUs />);
    expect(screen.getByText("Fast delivery across Ukraine")).toBeInTheDocument();
    expect(screen.getByText("Secure payment")).toBeInTheDocument();
  });

  it("renders configured client claims", () => {
    render(<WhyChooseUs />);
    expect(screen.getByText(/300\+/)).toBeInTheDocument();
    expect(screen.getByText(/100\+/)).toBeInTheDocument();
  });

  // Non-vacuity: the test above proves claims CAN render, so this one failing
  // to find them is meaningful rather than a component that renders nothing.
  it("omits client claims that are not configured", () => {
    render(<WhyChooseUs />);
    expect(screen.queryByText(/rating/i)).not.toBeInTheDocument();
  });

  it("omits all client claims when none are configured", () => {
    mockClaims.olxSales = null;
    mockClaims.instagramOrders = null;
    render(<WhyChooseUs />);
    expect(screen.queryByText(/300\+/)).not.toBeInTheDocument();
    expect(screen.queryByText(/100\+/)).not.toBeInTheDocument();
    // Stronger than checking the formatted figure alone: guards against a
    // regression that drops the `&&` short-circuit but keeps the template
    // literal, which would interpolate null straight into the sentence
    // ("null successful sales on OLX") instead of omitting the claim. That
    // text wouldn't match /300\+/ either, so without this the mutation would
    // slip past unnoticed — assert the topic is gone too, not just the figure.
    expect(screen.queryByText(/OLX/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Instagram/i)).not.toBeInTheDocument();
    // The always-true claims must survive.
    expect(screen.getByText("Secure payment")).toBeInTheDocument();
  });

  it("renders the customer rating claim once it is configured", () => {
    mockClaims.customerRating = "4.9";
    render(<WhyChooseUs />);
    expect(screen.getByText(/4\.9/)).toBeInTheDocument();
  });
});
