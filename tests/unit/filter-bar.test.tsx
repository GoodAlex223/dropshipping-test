import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FilterBar, type CatalogFilters } from "@/app/(shop)/products/filter-bar";

// jsdom has no ResizeObserver; opening the Фільтри sheet (R5 tests below)
// mounts the sheet's PriceRange section, which uses Radix Slider —
// Radix's internal useSize hook needs ResizeObserver and otherwise throws.
// No other test in this file (or the pre-existing ones above) opens the
// sheet, so this is scoped to this file rather than the global test setup.
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as unknown as { ResizeObserver: typeof ResizeObserverMock }).ResizeObserver =
  ResizeObserverMock;

const filters: CatalogFilters = {
  size: null,
  color: null,
  brand: null,
  inStock: false,
  minPrice: null,
  maxPrice: null,
  search: null,
  category: null,
  sort: "new",
};

describe("FilterBar", () => {
  it("toggles a size chip on and off", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <FilterBar filters={filters} brands={[]} onChange={onChange} onClearAll={vi.fn()} />
    );
    fireEvent.click(screen.getByRole("button", { name: "M" }));
    expect(onChange).toHaveBeenCalledWith({ size: "M" });
    rerender(
      <FilterBar
        filters={{ ...filters, size: "M" }}
        brands={[]}
        onChange={onChange}
        onClearAll={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "M" }));
    expect(onChange).toHaveBeenLastCalledWith({ size: null });
  });

  it("renders all five size chips S–XXL", () => {
    render(<FilterBar filters={filters} brands={[]} onChange={vi.fn()} onClearAll={vi.fn()} />);
    for (const s of ["S", "M", "L", "XL", "XXL"]) {
      expect(screen.getByRole("button", { name: s })).toBeInTheDocument();
    }
  });

  it("emits sort selection from the sort buttons", () => {
    const onChange = vi.fn();
    render(<FilterBar filters={filters} brands={[]} onChange={onChange} onClearAll={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Ціна ↑" }));
    expect(onChange).toHaveBeenCalledWith({ sort: "price-asc" });
    fireEvent.click(screen.getByRole("button", { name: "Популярні" }));
    expect(onChange).toHaveBeenCalledWith({ sort: "popular" });
  });

  it("marks the active sort button with aria-pressed", () => {
    render(
      <FilterBar
        filters={{ ...filters, sort: "popular" }}
        brands={[]}
        onChange={vi.fn()}
        onClearAll={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: "Популярні" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: "Новинки" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  it("shows a removable chip for an active search", () => {
    const onChange = vi.fn();
    render(
      <FilterBar
        filters={{ ...filters, search: "худі" }}
        brands={[]}
        onChange={onChange}
        onClearAll={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /скинути пошук/i }));
    expect(onChange).toHaveBeenCalledWith({ search: null });
  });
});

describe("FilterBar — R5 mobile: filters + sort live only in the sheet", () => {
  it("hides the inline trigger chips and sort row below md via class contract", () => {
    // jsdom doesn't evaluate media queries, so this can't assert actual
    // visibility — it locks in the `hidden ... md:*` class contract the
    // mobile-only-sheet behavior depends on. See the E2E isMobile branch in
    // tests/e2e/products.spec.ts for the real behavioral proof.
    render(
      <FilterBar filters={filters} brands={["Mirox"]} onChange={vi.fn()} onClearAll={vi.fn()} />
    );

    const brandTrigger = screen.getByRole("button", { name: "Бренд ▾" });
    const colorTrigger = screen.getByRole("button", { name: "Колір ▾" });
    const availTrigger = screen.getByRole("button", { name: "Наявність ▾" });
    const priceTrigger = screen.getByRole("button", { name: "Ціна ▾" });
    for (const el of [brandTrigger, colorTrigger, availTrigger, priceTrigger]) {
      expect(el.className.split(/\s+/)).toContain("hidden");
      expect(el.className.split(/\s+/)).toContain("md:inline-flex");
    }

    const sizeTrigger = screen.getByRole("button", { name: "M" }).closest("div")!;
    expect(sizeTrigger.className.split(/\s+/)).toContain("hidden");
    expect(sizeTrigger.className.split(/\s+/)).toContain("md:flex");

    const sortRow = screen.getByText("Сортування:").closest("div")!;
    expect(sortRow.className.split(/\s+/)).toContain("hidden");
    expect(sortRow.className.split(/\s+/)).toContain("md:flex");

    // Фільтри itself is never hidden — it's the only mobile-visible control.
    const filtersTrigger = screen.getByRole("button", { name: /Фільтри/ });
    expect(filtersTrigger.className.split(/\s+/)).not.toContain("hidden");
  });

  it("opens the Фільтри sheet with a Сортування section offering the same 4 URL-equivalent options", () => {
    const onChange = vi.fn();
    render(
      <FilterBar
        filters={{ ...filters, sort: "popular" }}
        brands={[]}
        onChange={onChange}
        onClearAll={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Фільтри/ }));
    const dialog = screen.getByRole("dialog");

    expect(within(dialog).getByRole("button", { name: "Популярні" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(within(dialog).getByRole("button", { name: "Новинки" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );

    fireEvent.click(within(dialog).getByRole("button", { name: "Ціна ↑" }));
    expect(onChange).toHaveBeenCalledWith({ sort: "price-asc" });
  });

  it("opens the Фільтри sheet with a Розмір size chip that emits the same size param", () => {
    const onChange = vi.fn();
    render(<FilterBar filters={filters} brands={[]} onChange={onChange} onClearAll={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /Фільтри/ }));
    const dialog = screen.getByRole("dialog");

    fireEvent.click(within(dialog).getByRole("button", { name: "M" }));
    expect(onChange).toHaveBeenCalledWith({ size: "M" });
  });
});
