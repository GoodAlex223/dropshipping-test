import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Truck } from "lucide-react";

const defaultHeroImage = { src: "/hero-placeholder-ai.jpg", alt: "Model wearing a black hoodie" };

const mockHero = {
  eyebrow: "NEW COLLECTION",
  headline: ["STYLE.", "QUALITY.", "CONFIDENCE."],
  subtitle: "Mirox Shop — modern clothing for those who value quality and minimalism.",
  primaryCta: { label: "Shop the Catalog", href: "/products" },
  secondaryCta: { label: "New Arrivals", href: "/products?sort=newest" },
  image: defaultHeroImage as { src: string; alt: string } | null,
};

vi.mock("@/content/home", () => ({
  home: {
    get hero() {
      return mockHero;
    },
    benefits: [{ icon: Truck, title: "Fast delivery", description: "1–3 days" }],
  },
}));

import { Hero } from "@/components/home/Hero";

// mockHero.image is mutated by the two tests below to exercise both hero
// layouts. Reset it before every test (same precedent as AnnouncementBar's
// mockSite reset) so the outcome never depends on run order — e.g. a failed
// assertion inside "still renders a complete hero..." must not leave `image`
// as null for whatever test happens to run next.
beforeEach(() => {
  mockHero.image = defaultHeroImage;
});

describe("Hero", () => {
  it("renders all three slogan lines", () => {
    render(<Hero />);
    expect(screen.getByText("STYLE.")).toBeInTheDocument();
    expect(screen.getByText("QUALITY.")).toBeInTheDocument();
    expect(screen.getByText("CONFIDENCE.")).toBeInTheDocument();
  });

  it("renders the slogan as a single h1 for document outline", () => {
    render(<Hero />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("STYLE.");
    expect(heading).toHaveTextContent("CONFIDENCE.");
  });

  it("renders both CTAs pointing at the briefed destinations", () => {
    render(<Hero />);
    expect(screen.getByRole("link", { name: "Shop the Catalog" })).toHaveAttribute(
      "href",
      "/products"
    );
    expect(screen.getByRole("link", { name: "New Arrivals" })).toHaveAttribute(
      "href",
      "/products?sort=newest"
    );
  });

  it("sits on an inverted surface", () => {
    const { container } = render(<Hero />);
    expect(container.querySelector('[data-surface="dark"]')).not.toBeNull();
  });

  it("renders the photo when one is configured", () => {
    mockHero.image = defaultHeroImage;
    render(<Hero />);
    expect(screen.getByAltText("Model wearing a black hoodie")).toBeInTheDocument();
  });

  it("still renders a complete hero when no photo is configured", () => {
    mockHero.image = null;
    render(<Hero />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Shop the Catalog" })).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("shows the ghosted brand watermark only in the no-photo hero", () => {
    mockHero.image = null;
    const { rerender } = render(<Hero />);
    expect(screen.getByTestId("hero-watermark")).toBeInTheDocument();

    // With a photo, the art-directed backdrop (and its watermark) gives way to
    // the two-column image layout.
    mockHero.image = defaultHeroImage;
    rerender(<Hero />);
    expect(screen.queryByTestId("hero-watermark")).not.toBeInTheDocument();
  });

  it("staggers the headline lines with an entrance animation", () => {
    render(<Hero />);
    expect(screen.getByText("STYLE.")).toHaveClass("animate-fade-up");
  });
});
