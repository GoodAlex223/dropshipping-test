import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FilterBar, type CatalogFilters } from "@/app/(shop)/products/filter-bar";

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
