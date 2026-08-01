import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProductGallery } from "@/components/products/ProductGallery";

const images = [
  { url: "/images/products/a.png", alt: "Фото 1" },
  { url: "/images/products/b.png", alt: null },
  { url: "/images/products/c.png", alt: null },
];

describe("ProductGallery", () => {
  it("renders a thumb per image and marks the first active", () => {
    render(<ProductGallery images={images} productName="Худі Mirox Basic" />);
    const thumbs = screen.getAllByRole("button", { name: /Фото \d із \d/ });
    expect(thumbs).toHaveLength(3);
    expect(thumbs[0]).toHaveAttribute("aria-current", "true");
  });

  it("thumb click switches the active image", () => {
    render(<ProductGallery images={images} productName="Худі Mirox Basic" />);
    const thumbs = screen.getAllByRole("button", { name: /Фото \d із \d/ });
    fireEvent.click(thumbs[2]);
    expect(thumbs[2]).toHaveAttribute("aria-current", "true");
    expect(thumbs[0]).toHaveAttribute("aria-current", "false");
  });

  it("renders mobile dots for multi-image products", () => {
    render(<ProductGallery images={images} productName="Худі Mirox Basic" />);
    expect(screen.getAllByRole("button", { name: /Перейти до фото \d/ })).toHaveLength(3);
  });

  it("zero images → single branded fallback, no thumbs or dots", () => {
    render(<ProductGallery images={[]} productName="Худі Mirox Basic" />);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.getAllByTestId("product-image-fallback").length).toBeGreaterThan(0);
  });
});
