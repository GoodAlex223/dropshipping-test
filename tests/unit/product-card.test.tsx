import { render, screen, fireEvent } from "@testing-library/react";
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

  it("shows the branded fallback when an image fails to load", () => {
    render(<ProductCard product={base} />);
    const img = screen.getByAltText("Hoodie");
    fireEvent.error(img);
    expect(screen.getByTestId("product-image-fallback")).toBeInTheDocument();
  });

  it("shows the branded fallback when no image is provided", () => {
    render(<ProductCard product={{ ...base, images: [] }} />);
    expect(screen.getByTestId("product-image-fallback")).toBeInTheDocument();
  });
});
