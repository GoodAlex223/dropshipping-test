import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ProductRail } from "@/components/home/ProductRail";
import type { ProductCardData } from "@/lib/product-queries";

const products: ProductCardData[] = [
  {
    id: "a",
    name: "Mirox Basic Hoodie",
    slug: "mirox-basic-hoodie",
    shortDesc: null,
    price: "1290.00",
    comparePrice: null,
    stock: 7,
    isFeatured: true,
    category: { name: "Hoodies", slug: "hoodies" },
    images: [{ url: "https://example.com/a.jpg", alt: null }],
  },
  {
    id: "b",
    name: "Mirox Relaxed Tee",
    slug: "mirox-relaxed-tee",
    shortDesc: null,
    price: "690.00",
    comparePrice: null,
    stock: 12,
    isFeatured: false,
    category: { name: "T-Shirts", slug: "t-shirts" },
    images: [{ url: "https://example.com/b.jpg", alt: null }],
  },
];

describe("ProductRail", () => {
  it("renders the heading and the view-all link", () => {
    render(
      <ProductRail
        title="Bestsellers"
        products={products}
        viewAllHref="/products?sort=newest"
        viewAllLabel="View all"
      />
    );
    expect(screen.getByRole("heading", { name: "Bestsellers" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View all/ })).toHaveAttribute(
      "href",
      "/products?sort=newest"
    );
  });

  it("renders a card per product", () => {
    const { container } = render(
      <ProductRail
        title="Featured"
        products={products}
        viewAllHref="/products"
        viewAllLabel="View all"
      />
    );
    // Fixture has two products with distinct names — a fixture of one can't
    // tell "renders a card per product" apart from "renders at most one
    // card", e.g. a stray `.slice(0, 1)` would still pass. Assert both names
    // render AND that the rendered card count matches the input count.
    expect(screen.getByText("Mirox Basic Hoodie")).toBeInTheDocument();
    expect(screen.getByText("Mirox Relaxed Tee")).toBeInTheDocument();
    expect(container.querySelectorAll('[data-testid="product-card"]')).toHaveLength(
      products.length
    );
  });

  it("renders nothing at all when there are no products", () => {
    const { container } = render(
      <ProductRail title="Featured" products={[]} viewAllHref="/products" viewAllLabel="View all" />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
