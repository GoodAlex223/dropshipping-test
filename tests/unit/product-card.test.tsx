import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
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

  it("gives the whole-card link an accessible name equal to just the product name", () => {
    render(<ProductCard product={base} />);
    // aria-label overrides the link's nested text content (category, price,
    // size row, ...) as its accessible name — this specifically proves a
    // screen reader announces "Mirox Hoodie", not the entire card's text.
    const link = screen.getByRole("link", { name: base.name });
    expect(link).toHaveAttribute("href", "/products/mirox-hoodie");
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("renders the whole card as a single link even when out of stock", () => {
    // comparePrice cleared: TASK-036's single-badge precedence (discount >
    // НОВИНКА > out-of-stock) would otherwise show the discount badge
    // instead of the out-of-stock label this test is asserting on.
    render(<ProductCard product={{ ...base, stock: 0, comparePrice: null }} />);
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByText("Немає в наявності")).toBeInTheDocument();
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

const now = Date.now();
const DAY_MS = 24 * 60 * 60 * 1000;

describe("ProductCard — TASK-036 upgrades", () => {
  it("shows НОВИНКА for a fresh product without discount", () => {
    render(
      <ProductCard
        product={{
          ...base,
          comparePrice: null,
          createdAt: new Date(now - 5 * DAY_MS).toISOString(),
        }}
      />
    );
    expect(screen.getByText("НОВИНКА")).toBeInTheDocument();
  });

  it("discount badge wins over НОВИНКА (one badge max)", () => {
    render(
      <ProductCard product={{ ...base, createdAt: new Date(now - 5 * DAY_MS).toISOString() }} />
    );
    expect(screen.getByText("-20%")).toBeInTheDocument();
    expect(screen.queryByText("НОВИНКА")).not.toBeInTheDocument();
  });

  it("renders no НОВИНКА badge for an old product", () => {
    render(
      <ProductCard
        product={{
          ...base,
          comparePrice: null,
          createdAt: new Date(now - 60 * DAY_MS).toISOString(),
        }}
      />
    );
    expect(screen.queryByText("НОВИНКА")).not.toBeInTheDocument();
  });

  it("renders display-only colour swatches from Color variants", () => {
    render(
      <ProductCard
        product={{
          ...base,
          variants: [
            { name: "Color", value: "Чорний" },
            { name: "Color", value: "Білий" },
            { name: "Color", value: "Чорний" }, // duplicate — one swatch only
          ],
        }}
      />
    );
    expect(screen.getByLabelText("Колір: Чорний")).toBeInTheDocument();
    expect(screen.getByLabelText("Колір: Білий")).toBeInTheDocument();
    expect(screen.getAllByLabelText(/^Колір:/)).toHaveLength(2);
  });

  it("renders quick-action buttons only when onQuickView is provided", () => {
    const onQuickView = vi.fn();
    render(<ProductCard product={base} onQuickView={onQuickView} />);
    fireEvent.click(screen.getByRole("button", { name: "Швидкий перегляд" }));
    expect(onQuickView).toHaveBeenCalledWith({ focusSizes: false });
    fireEvent.click(screen.getByRole("button", { name: "В кошик" }));
    expect(onQuickView).toHaveBeenCalledWith({ focusSizes: true });
    // still a single link — buttons are siblings of the anchor, not nested in it
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("keeps quick-action buttons pointer-events-none until hover/focus-within makes the overlay visible", () => {
    // Regression test (Task 10 E2E finding): an unconditional
    // pointer-events-auto on these buttons let the invisible (opacity-0)
    // overlay sit on top of the card's <a> and intercept clicks meant for
    // the product link — reproduced via Playwright as "subtree intercepts
    // pointer events" on the "can view product details" E2E test. jsdom
    // doesn't do real hit-testing, so this asserts the class contract
    // directly: pointer-events must start "none" and only flip to "auto"
    // via the group-hover/group-focus-within variants that also drive the
    // overlay's opacity, never as a bare unconditional utility.
    render(<ProductCard product={base} onQuickView={vi.fn()} />);
    for (const name of ["Швидкий перегляд", "В кошик"]) {
      const classes = screen.getByRole("button", { name }).className.split(/\s+/);
      expect(classes).not.toContain("pointer-events-auto");
      expect(classes).toContain("pointer-events-none");
      expect(classes).toContain("group-hover:pointer-events-auto");
      expect(classes).toContain("group-focus-within:pointer-events-auto");
    }
  });

  it("hides «В кошик» (but keeps quick view) when out of stock", () => {
    render(<ProductCard product={{ ...base, stock: 0 }} onQuickView={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Швидкий перегляд" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "В кошик" })).not.toBeInTheDocument();
  });

  it("stops quick-action clicks bubbling to a wrapping click handler (card link area still bubbles)", () => {
    const wrapperClick = vi.fn();
    render(
      <div onClick={wrapperClick}>
        <ProductCard product={base} onQuickView={vi.fn()} />
      </div>
    );

    fireEvent.click(screen.getByRole("button", { name: "Швидкий перегляд" }));
    expect(wrapperClick).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "В кошик" }));
    expect(wrapperClick).not.toHaveBeenCalled();

    // Control assertion: the card's link area is expected to bubble — proves
    // the wrapper's click handler is actually wired up and would have fired
    // for the buttons above if they hadn't stopped propagation.
    fireEvent.click(screen.getByRole("link", { name: base.name }));
    expect(wrapperClick).toHaveBeenCalledTimes(1);
  });

  it("renders a second image element only when images[1] exists", () => {
    const two = {
      ...base,
      images: [
        { url: "https://example.com/a.jpg", alt: "front" },
        { url: "https://example.com/b.jpg", alt: "back" },
      ],
    };
    const { unmount } = render(<ProductCard product={two} />);
    expect(screen.getByAltText("back")).toBeInTheDocument();
    expect(screen.getAllByRole("img")).toHaveLength(2); // front + hover image
    unmount();
    render(<ProductCard product={base} />);
    expect(screen.getAllByRole("img")).toHaveLength(1); // no hover layer without images[1]
  });
});
