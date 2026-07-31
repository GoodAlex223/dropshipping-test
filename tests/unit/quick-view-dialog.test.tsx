import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/analytics", () => ({ trackAddToCart: vi.fn() }));

import { QuickViewDialog } from "@/components/products/QuickViewDialog";
import { useCartStore } from "@/stores/cart.store";
import { trackAddToCart } from "@/lib/analytics";

const product = {
  id: "p1",
  name: "Худі Mirox Basic",
  slug: "hudi-mirox-basic",
  price: "1290",
  comparePrice: null,
  stock: 42,
  category: { name: "Худі", slug: "hudi" },
  images: [{ url: "https://example.com/a.jpg", alt: "front" }],
  variants: [
    { id: "v-s", name: "Size", value: "S", stock: 5, price: null },
    { id: "v-m", name: "Size", value: "M", stock: 8, price: null },
    { id: "v-black", name: "Color", value: "Чорний", stock: 30, price: null },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  useCartStore.setState({ items: [], isOpen: false });
});

describe("QuickViewDialog", () => {
  it("requires a size before adding to cart", () => {
    render(<QuickViewDialog product={product} focusSizes={false} onOpenChange={vi.fn()} />);
    const addButton = screen.getByRole("button", { name: /додати в кошик/i });
    expect(addButton).toBeDisabled();
  });

  it("adds the selected size variant to the cart, tracks GA4, opens the drawer", () => {
    const onOpenChange = vi.fn();
    render(<QuickViewDialog product={product} focusSizes onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByRole("button", { name: "M" }));
    fireEvent.click(screen.getByRole("button", { name: /додати в кошик/i }));

    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      productId: "p1",
      variantId: "v-m",
      name: "Худі Mirox Basic — M",
      price: 1290,
      maxStock: 8,
      quantity: 1,
    });
    expect(useCartStore.getState().isOpen).toBe(true);
    expect(trackAddToCart).toHaveBeenCalledWith(
      expect.objectContaining({ item_id: "p1", item_variant: "M", price: 1290, quantity: 1 })
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("disables out-of-stock size chips", () => {
    const oos = {
      ...product,
      variants: [{ id: "v-s", name: "Size", value: "S", stock: 0, price: null }],
    };
    render(<QuickViewDialog product={oos} focusSizes={false} onOpenChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "S" })).toBeDisabled();
  });

  it("allows adding without size selection when the product has no Size variants", () => {
    const sizeless = { ...product, variants: [] };
    render(<QuickViewDialog product={sizeless} focusSizes={false} onOpenChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /додати в кошик/i }));
    expect(useCartStore.getState().items[0]).toMatchObject({
      productId: "p1",
      variantId: undefined,
      maxStock: 42,
    });
  });

  it("uses the variant price when the variant has its own", () => {
    const priced = {
      ...product,
      variants: [{ id: "v-l", name: "Size", value: "L", stock: 3, price: "1390" }],
    };
    render(<QuickViewDialog product={priced} focusSizes={false} onOpenChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "L" }));
    fireEvent.click(screen.getByRole("button", { name: /додати в кошик/i }));
    expect(useCartStore.getState().items[0].price).toBe(1390);
  });

  it("renders a PDP link «Детальніше»", () => {
    render(<QuickViewDialog product={product} focusSizes={false} onOpenChange={vi.fn()} />);
    expect(screen.getByRole("link", { name: /детальніше/i })).toHaveAttribute(
      "href",
      "/products/hudi-mirox-basic"
    );
  });
});
