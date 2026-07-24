import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ProductCard } from "@/components/products/ProductCard";

const base = {
  id: "p1",
  name: "Mirox Hoodie",
  slug: "mirox-hoodie",
  price: 39.99,
  comparePrice: 49.99,
  stock: 5,
  images: [{ url: "https://example.com/a.jpg", alt: "Hoodie" }],
  category: { name: "Hoodies", slug: "hoodies" },
};

describe("ProductCard", () => {
  it("renders the discount badge without any destructive/red class", () => {
    const { container } = render(<ProductCard product={base} />);
    expect(screen.getByText("-20%")).toBeInTheDocument();
    // No element on the card uses the destructive (red) badge variant.
    expect(container.querySelector(".bg-destructive")).toBeNull();
  });
});
