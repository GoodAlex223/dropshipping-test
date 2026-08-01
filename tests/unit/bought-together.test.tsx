import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BoughtTogether } from "@/components/products/BoughtTogether";
import { useCartStore } from "@/stores/cart.store";
import type { BundleCompanion } from "@/types";

function companion(over: Partial<BundleCompanion> & { id: string }): BundleCompanion {
  return {
    name: `Product ${over.id}`,
    slug: `product-${over.id}`,
    price: "590",
    comparePrice: null,
    stock: 10,
    image: null,
    sizeVariants: [
      { id: `${over.id}-s`, value: "S", stock: 5, price: null },
      { id: `${over.id}-l`, value: "L", stock: 5, price: null },
    ],
    ...over,
  };
}

const current = companion({ id: "cur", name: "Худі Mirox Basic", price: "1290" });

beforeEach(() => {
  useCartStore.setState({ items: [], isOpen: false });
});

describe("BoughtTogether", () => {
  it("renders nothing with fewer than 2 companions", () => {
    const { container } = render(
      <BoughtTogether
        current={current}
        companions={[companion({ id: "a" })]}
        preferredSizeValue="L"
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("preselects companions to the preferred size and adds 3 sized lines", () => {
    render(
      <BoughtTogether
        current={current}
        companions={[companion({ id: "a" }), companion({ id: "b" })]}
        preferredSizeValue="L"
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "ДОДАТИ КОМПЛЕКТ У КОШИК" }));
    const items = useCartStore.getState().items;
    expect(items).toHaveLength(3);
    expect(items.every((i) => i.variantId?.endsWith("-l"))).toBe(true);
    expect(items[0].name).toBe("Худі Mirox Basic — L");
  });

  it("shows the struck sum only when comparePrices make it genuinely higher", () => {
    render(
      <BoughtTogether
        current={current}
        companions={[companion({ id: "a", comparePrice: "690" }), companion({ id: "b" })]}
        preferredSizeValue="S"
      />
    );
    // total 1290+590+590=2470; compare 1290+690+590=2570. formatPrice emits
    // NON-BREAKING spaces (uk-UA thousands + before грн) — assert via regex.
    expect(screen.getByText(/2[\s ]570[\s ]грн/)).toHaveClass("line-through");
    expect(screen.getByTestId("bundle-total")).toHaveTextContent(/2[\s ]470/);
  });
});
