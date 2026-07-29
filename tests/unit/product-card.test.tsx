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
  it("renders the discount badge with the handoff pill classes, no destructive/red class", () => {
    const { container } = render(<ProductCard product={base} />);
    const badge = screen.getByText("-20%");
    expect(badge.className).toContain("bg-secondary");
    expect(badge.className).toContain("border-border-strong");
    expect(badge.className).toContain("rounded-full");
    expect(badge.className).toContain("text-foreground");
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

  it("renders the whole card as a single link, with no separate View Product/Details button", () => {
    render(<ProductCard product={base} />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "/products/mirox-hoodie");
    expect(screen.queryByText(/View Product/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/View Details/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders the whole card as a single link even when out of stock", () => {
    render(<ProductCard product={{ ...base, stock: 0 }} />);
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByText("Out of Stock")).toBeInTheDocument();
  });

  it("renders deduped Size-variant values in canonical S/M/L/XL/XXL order", () => {
    render(
      <ProductCard
        product={{
          ...base,
          variants: [
            { name: "Size", value: "L" },
            { name: "Size", value: "S" },
            { name: "Size", value: "XL" },
            { name: "Size", value: "S" }, // duplicate — must not repeat in the row
            { name: "Color", value: "White" }, // non-Size — must not appear in the row
          ],
        }}
      />
    );
    expect(screen.getByText("S · L · XL")).toBeInTheDocument();
    expect(screen.queryByText(/White/)).not.toBeInTheDocument();
  });

  it("renders no sizes row when variants are absent", () => {
    render(<ProductCard product={base} />);
    expect(screen.queryByText(/·/)).not.toBeInTheDocument();
  });

  it("renders no sizes row when variants exist but none are Size", () => {
    render(<ProductCard product={{ ...base, variants: [{ name: "Color", value: "Чорний" }] }} />);
    expect(screen.queryByText(/·/)).not.toBeInTheDocument();
  });
});
