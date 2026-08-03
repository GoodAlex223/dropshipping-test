import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProductGallery } from "@/components/products/ProductGallery";

const images = [
  { url: "/images/products/a.png", alt: "Фото 1" },
  { url: "/images/products/b.png", alt: null },
  { url: "/images/products/c.png", alt: null },
];

// Stub global.ResizeObserver for jsdom
beforeEach(() => {
  if (typeof global.ResizeObserver === "undefined") {
    class MockResizeObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }
    (global as typeof globalThis & { ResizeObserver: typeof MockResizeObserver }).ResizeObserver =
      MockResizeObserver;
  }
});

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

  it("desktop thumb click syncs the hidden mobile track scroll position", () => {
    render(<ProductGallery images={images} productName="Худі Mirox Basic" />);
    const track = screen.getByLabelText(/Фотографії/);

    // Stub clientWidth and scrollTo
    Object.defineProperty(track, "clientWidth", { value: 390, writable: true });
    track.scrollTo = vi.fn();

    const thumbs = screen.getAllByRole("button", { name: /Фото \d із \d/ });
    fireEvent.click(thumbs[2]);

    // Assert scrollTo was called with index 2 (the third image) using instant behavior
    expect(track.scrollTo).toHaveBeenCalledWith({
      left: 2 * 390,
      behavior: "instant",
    });
  });

  it("mobile dot click smooth-scrolls without an instant snap from the sync effect (PR #27)", () => {
    render(<ProductGallery images={images} productName="Худі Mirox Basic" />);
    const track = screen.getByLabelText(/Фотографії/);
    Object.defineProperty(track, "clientWidth", { value: 390, writable: true });
    track.scrollTo = vi.fn();

    const dots = screen.getAllByRole("button", { name: /Перейти до фото \d/ });
    fireEvent.click(dots[2]);

    expect(track.scrollTo).toHaveBeenCalledWith({ left: 2 * 390, behavior: "smooth" });
    // The [activeIndex] effect must consume the smooth-target flag, not re-scroll instantly.
    expect(track.scrollTo).not.toHaveBeenCalledWith(
      expect.objectContaining({ behavior: "instant" })
    );
  });
});
