import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import type { Testimonial } from "@/lib/review-queries";

vi.mock("@/content/home", () => ({
  home: { testimonials: { title: "What our customers say" } },
}));

import { Testimonials } from "@/components/home/Testimonials";

const testimonials: Testimonial[] = [
  {
    id: "r1",
    rating: 3,
    comment: "Excellent quality, fits perfectly.",
    authorName: "Oleksandr",
    productName: "Mirox Basic Hoodie",
    productSlug: "mirox-basic-hoodie",
    createdAt: "2026-06-01T00:00:00.000Z",
  },
];

describe("Testimonials", () => {
  it("renders each testimonial with author and product", () => {
    const { container } = render(<Testimonials testimonials={testimonials} />);
    expect(screen.getByText(/Excellent quality/)).toBeInTheDocument();
    expect(screen.getByText("Oleksandr")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Mirox Basic Hoodie/ })).toHaveAttribute(
      "href",
      "/products/mirox-basic-hoodie"
    );

    // Verify the correct number of stars are filled. We count elements with the
    // `fill-foreground` class rather than querying by role or text because StarRating
    // uses the same aria-label for all stars regardless of value, so there is no
    // accessible name to distinguish them. Class-based counting is the reliable signal.
    const filledStars = container.querySelectorAll(".fill-foreground");
    expect(filledStars).toHaveLength(testimonials[0].rating);
  });

  it("renders nothing when no reviews qualify", () => {
    const { container } = render(<Testimonials testimonials={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
