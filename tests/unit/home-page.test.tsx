import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
// HomePage is a server component: it calls these query functions directly
// (not via props), so they must be mocked here to avoid a real Prisma/DB call
// in a unit test — same convention as the API route test files (e.g.
// reviews-api.test.ts mocking @/lib/db before importing the route handlers).

vi.mock("@/lib/product-queries", () => ({
  getFeaturedProducts: vi.fn(),
  getBestsellers: vi.fn(),
}));

vi.mock("@/lib/review-queries", () => ({
  getTestimonials: vi.fn(),
}));

import { getFeaturedProducts, getBestsellers, type ProductCardData } from "@/lib/product-queries";
import { getTestimonials } from "@/lib/review-queries";
import HomePage from "@/app/(shop)/page";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function product(id: string): ProductCardData {
  return {
    id,
    name: `Product ${id}`,
    slug: `product-${id}`,
    shortDesc: null,
    price: "999.00",
    comparePrice: null,
    stock: 5,
    isFeatured: true,
    category: { name: "Hoodies", slug: "hoodies" },
    images: [{ url: "https://example.com/x.jpg", alt: null }],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getFeaturedProducts).mockResolvedValue([product("f1")]);
  vi.mocked(getTestimonials).mockResolvedValue([]);
});

/**
 * HomePage is an async server component, not a hook or client component: it
 * can be awaited directly to resolve the JSX tree it returns (the same thing
 * Next's own RSC renderer does under the hood), then handed to `render()`.
 * `render(<HomePage />)` would instead hand ReactDOM an unresolved Promise as
 * a child, which is not a case plain `react-dom` (used here via jsdom) knows
 * how to render.
 */
describe("HomePage bestsellers rail title", () => {
  it('renders "Bestsellers" when getBestsellers() reports real order data (source: "orders")', async () => {
    vi.mocked(getBestsellers).mockResolvedValue({ products: [product("b1")], source: "orders" });

    render(await HomePage());

    expect(screen.getByRole("heading", { name: "Bestsellers" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "New Arrivals" })).not.toBeInTheDocument();
  });

  it('still renders "Bestsellers" for source: "mixed" — topped-up real bestsellers, not deceptive', async () => {
    vi.mocked(getBestsellers).mockResolvedValue({
      products: [product("b1"), product("b2")],
      source: "mixed",
    });

    render(await HomePage());

    expect(screen.getByRole("heading", { name: "Bestsellers" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "New Arrivals" })).not.toBeInTheDocument();
  });

  it('renders "New Arrivals" instead of "Bestsellers" when the rail is entirely backfilled', async () => {
    vi.mocked(getBestsellers).mockResolvedValue({
      products: [product("n1")],
      source: "backfilled",
    });

    render(await HomePage());

    expect(screen.getByRole("heading", { name: "New Arrivals" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Bestsellers" })).not.toBeInTheDocument();
  });

  it("still renders the same products and view-all destination when backfilled", async () => {
    vi.mocked(getBestsellers).mockResolvedValue({
      products: [product("n1")],
      source: "backfilled",
    });

    render(await HomePage());

    // The rail's products and link target are unaffected by which title
    // renders — only the heading text (and its content.ts source object)
    // changes. Both rail configs happen to share this href today (see the
    // comment in src/content/home.ts), but this asserts the actually
    // rendered link, not the shared string in the abstract.
    expect(screen.getByText("Product n1")).toBeInTheDocument();
    const viewAllLinks = screen.getAllByRole("link", { name: /View all/ });
    expect(viewAllLinks.some((link) => link.getAttribute("href") === "/products?sort=newest")).toBe(
      true
    );
  });
});

// ---------------------------------------------------------------------------
// Page composition
// ---------------------------------------------------------------------------
// The tests above only ever exercise the bestsellers-rail title logic — none
// of them notice if a whole section were deleted from src/app/(shop)/page.tsx,
// since every other assertion happens to still hold with Hero, WhyChooseUs, or
// Testimonials missing. This block closes that gap: it asserts each section
// actually renders as part of the composed page, not just in its own
// component-level test file (Hero and WhyChooseUs already have those; this is
// the one place that also covers Testimonials mounting on the real page,
// since the beforeEach default above (`getTestimonials` -> `[]`) makes
// Testimonials render null everywhere else in this file).
describe("HomePage composition", () => {
  it("renders Hero, WhyChooseUs, and Testimonials as part of the page", async () => {
    vi.mocked(getBestsellers).mockResolvedValue({ products: [product("b1")], source: "orders" });
    vi.mocked(getTestimonials).mockResolvedValue([
      {
        id: "t1",
        rating: 5,
        comment: "Great fit and fast shipping.",
        authorName: "Nadiya",
        productName: "Product f1",
        productSlug: "product-f1",
        createdAt: "2026-06-10T00:00:00.000Z",
      },
    ]);

    render(await HomePage());

    // Hero renders the real src/content/home.ts copy (this file never mocks
    // @/content/home) as the page's only h1 — every other section heading
    // below is an h2.
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("STYLE.");

    // WhyChooseUs: its own heading, real content.
    expect(screen.getByRole("heading", { name: "Why choose us" })).toBeInTheDocument();

    // Testimonials only renders once getTestimonials() resolves real reviews
    // (see Testimonials.tsx) — asserting its heading and the review's author
    // both prove the section mounted, not just that the mock was called.
    expect(screen.getByRole("heading", { name: "What our customers say" })).toBeInTheDocument();
    expect(screen.getByText("Nadiya")).toBeInTheDocument();
  });
});
