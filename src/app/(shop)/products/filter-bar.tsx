"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SIZE_ORDER } from "@/components/products/ProductCard";

export type CatalogSort = "new" | "popular" | "price-asc" | "price-desc";

export interface CatalogFilters {
  size: string | null;
  color: string | null;
  brand: string | null;
  inStock: boolean;
  minPrice: number | null;
  maxPrice: number | null;
  search: string | null;
  category: string | null;
  sort: CatalogSort;
}

interface FilterBarProps {
  filters: CatalogFilters;
  brands: string[];
  /** null deletes the param; page resets to 1 (handled by the caller). */
  onChange: (updates: Record<string, string | null>) => void;
  onClearAll: () => void;
}

const PRICE_MAX = 2000;
const PRICE_STEP = 10;

/** Fixed per the design spec — not sourced from the API (only Size varies by product). */
const COLORS = ["Чорний", "Білий"] as const;
const COLOR_SWATCH_CLASSES: Record<string, string> = {
  Чорний: "bg-black border-[#333]",
  Білий: "bg-[#f5f5f5] border-[#333]",
};

const SORT_OPTIONS: { value: CatalogSort; label: string }[] = [
  { value: "new", label: "Новинки" },
  { value: "popular", label: "Популярні" },
  { value: "price-asc", label: "Ціна ↑" },
  { value: "price-desc", label: "Ціна ↓" },
];

/** Shared "white when active" pill styling for dropdown-trigger chips. Inactive
 *  chips get the mock's hover language (border #262626/#333 → #666, text
 *  #a3a3a3 → white); active (white) chips are unchanged by hover (R4). */
function chipClasses(isActive: boolean) {
  return cn(
    "shrink-0 rounded-[10px] border px-4 py-2.5 text-[13px] font-semibold transition-colors",
    isActive
      ? "border-white bg-white text-black"
      : "border-[#262626] text-[#a3a3a3] hover:border-[#666] hover:text-white"
  );
}

/** Shared inactive-row hover styling for popover/sheet option rows (R4). */
const INACTIVE_ROW_HOVER = "hover:border-[#666] hover:text-white";

function PriceRange({
  minPrice,
  maxPrice,
  onApply,
}: {
  minPrice: number | null;
  maxPrice: number | null;
  onApply: (min: number | null, max: number | null) => void;
}) {
  const [range, setRange] = useState<[number, number]>([minPrice ?? 0, maxPrice ?? PRICE_MAX]);

  return (
    <div className="space-y-4">
      <Slider
        value={range}
        onValueChange={(value) => setRange(value as [number, number])}
        min={0}
        max={PRICE_MAX}
        step={PRICE_STEP}
      />
      <div className="flex items-center justify-between text-[13px] text-[#a3a3a3]">
        <span>{formatPrice(range[0])}</span>
        <span>{formatPrice(range[1])}</span>
      </div>
      <button
        type="button"
        onClick={() =>
          onApply(range[0] > 0 ? range[0] : null, range[1] < PRICE_MAX ? range[1] : null)
        }
        className="w-full rounded-[10px] bg-white px-4 py-2.5 text-[13px] font-bold text-black hover:bg-[#e5e5e5]"
      >
        Застосувати
      </button>
    </div>
  );
}

function PricePopover({
  minPrice,
  maxPrice,
  onChange,
}: {
  minPrice: number | null;
  maxPrice: number | null;
  onChange: FilterBarProps["onChange"];
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "hidden md:inline-flex",
            chipClasses(minPrice !== null || maxPrice !== null)
          )}
        >
          Ціна ▾
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 border-[#262626] bg-[#0d0d0d] text-white">
        <PriceRange
          minPrice={minPrice}
          maxPrice={maxPrice}
          onApply={(min, max) => {
            onChange({
              minPrice: min !== null ? String(min) : null,
              maxPrice: max !== null ? String(max) : null,
            });
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

function BrandPopover({
  brand,
  brands,
  onChange,
}: {
  brand: string | null;
  brands: string[];
  onChange: FilterBarProps["onChange"];
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={cn("hidden md:inline-flex", chipClasses(brand !== null))}>
          Бренд ▾
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 border-[#262626] bg-[#0d0d0d] p-2 text-white">
        <div className="flex flex-col gap-1">
          {brands.length === 0 && (
            <p className="px-3 py-2 text-[13px] text-[#737373]">Немає брендів</p>
          )}
          {brands.map((b) => {
            const isActive = brand === b;
            return (
              <button
                key={b}
                type="button"
                aria-pressed={isActive}
                onClick={() => {
                  onChange({ brand: isActive ? null : b });
                  setOpen(false);
                }}
                className={cn(
                  "rounded-[8px] border px-3 py-2 text-left text-[13px] font-semibold transition-colors",
                  isActive
                    ? "border-white bg-white text-black"
                    : cn("border-transparent text-[#a3a3a3]", INACTIVE_ROW_HOVER)
                )}
              >
                {b}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ColorPopover({
  color,
  onChange,
}: {
  color: string | null;
  onChange: FilterBarProps["onChange"];
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={cn("hidden md:inline-flex", chipClasses(color !== null))}>
          Колір ▾
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 border-[#262626] bg-[#0d0d0d] p-2 text-white">
        <div className="flex flex-col gap-1">
          {COLORS.map((c) => {
            const isActive = color === c;
            return (
              <button
                key={c}
                type="button"
                aria-pressed={isActive}
                onClick={() => {
                  onChange({ color: isActive ? null : c });
                  setOpen(false);
                }}
                className={cn(
                  "flex items-center gap-2 rounded-[8px] border px-3 py-2 text-left text-[13px] font-semibold transition-colors",
                  isActive
                    ? "border-white text-white"
                    : cn("border-transparent text-[#a3a3a3]", INACTIVE_ROW_HOVER)
                )}
              >
                <span className={cn("h-4 w-4 rounded-full border", COLOR_SWATCH_CLASSES[c])} />
                {c}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function AvailabilityPopover({
  inStock,
  onChange,
}: {
  inStock: boolean;
  onChange: FilterBarProps["onChange"];
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={cn("hidden md:inline-flex", chipClasses(inStock))}>
          Наявність ▾
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 border-[#262626] bg-[#0d0d0d] p-2 text-white">
        <div className="flex flex-col gap-1">
          <button
            type="button"
            aria-pressed={!inStock}
            onClick={() => {
              onChange({ inStock: null });
              setOpen(false);
            }}
            className={cn(
              "rounded-[8px] border px-3 py-2 text-left text-[13px] font-semibold transition-colors",
              !inStock
                ? "border-white bg-white text-black"
                : cn("border-transparent text-[#a3a3a3]", INACTIVE_ROW_HOVER)
            )}
          >
            Всі товари
          </button>
          <button
            type="button"
            aria-pressed={inStock}
            onClick={() => {
              onChange({ inStock: "true" });
              setOpen(false);
            }}
            className={cn(
              "rounded-[8px] border px-3 py-2 text-left text-[13px] font-semibold transition-colors",
              inStock
                ? "border-white bg-white text-black"
                : cn("border-transparent text-[#a3a3a3]", INACTIVE_ROW_HOVER)
            )}
          >
            В наявності
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SizeGroup({
  size,
  onChange,
}: {
  size: string | null;
  onChange: FilterBarProps["onChange"];
}) {
  return (
    <div className="hidden shrink-0 items-center gap-1.5 rounded-[10px] border border-[#262626] px-2 py-[5px] md:flex">
      <span className="px-1.5 text-[13px] font-semibold text-[#a3a3a3]">Розмір:</span>
      {SIZE_ORDER.map((s) => {
        const isActive = size === s;
        return (
          <button
            key={s}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange({ size: isActive ? null : s })}
            className={cn(
              "rounded-[7px] border px-3 py-1.5 text-[12.5px] font-bold transition-colors",
              isActive
                ? "border-white bg-white text-black"
                : cn("border-[#333] text-[#a3a3a3]", INACTIVE_ROW_HOVER)
            )}
          >
            {s}
          </button>
        );
      })}
    </div>
  );
}

function FiltersSheet({
  filters,
  brands,
  onChange,
  onClearAll,
}: {
  filters: CatalogFilters;
  brands: string[];
  onChange: FilterBarProps["onChange"];
  onClearAll: FilterBarProps["onClearAll"];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-2 rounded-[10px] border border-[#333] px-4 py-2.5 text-[13px] font-bold transition-colors hover:border-[#666]"
        >
          <SlidersHorizontal className="h-[15px] w-[15px]" />
          Фільтри
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[300px] overflow-y-auto border-[#262626] bg-black text-white"
      >
        <SheetHeader>
          <SheetTitle className="text-white">Фільтри</SheetTitle>
        </SheetHeader>
        <div className="mt-4 flex flex-col gap-6 px-4 pb-8">
          <div>
            <p className="mb-2 text-[13px] font-semibold text-[#a3a3a3]">Ціна</p>
            <PriceRange
              minPrice={filters.minPrice}
              maxPrice={filters.maxPrice}
              onApply={(min, max) => {
                onChange({
                  minPrice: min !== null ? String(min) : null,
                  maxPrice: max !== null ? String(max) : null,
                });
                setOpen(false);
              }}
            />
          </div>

          <div>
            <p className="mb-2 text-[13px] font-semibold text-[#a3a3a3]">Бренд</p>
            <div className="flex flex-col gap-1">
              {brands.length === 0 && <p className="text-[13px] text-[#737373]">Немає брендів</p>}
              {brands.map((b) => {
                const isActive = filters.brand === b;
                return (
                  <button
                    key={b}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => {
                      onChange({ brand: isActive ? null : b });
                      setOpen(false);
                    }}
                    className={cn(
                      "rounded-[8px] border px-3 py-2 text-left text-[13px] font-semibold transition-colors",
                      isActive
                        ? "border-white bg-white text-black"
                        : cn("border-[#262626] text-[#a3a3a3]", INACTIVE_ROW_HOVER)
                    )}
                  >
                    {b}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[13px] font-semibold text-[#a3a3a3]">Розмір</p>
            <div className="flex flex-wrap gap-2">
              {SIZE_ORDER.map((s) => {
                const isActive = filters.size === s;
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => onChange({ size: isActive ? null : s })}
                    className={cn(
                      "rounded-[7px] border px-3 py-2 text-[12.5px] font-bold transition-colors",
                      isActive
                        ? "border-white bg-white text-black"
                        : cn("border-[#333] text-[#a3a3a3]", INACTIVE_ROW_HOVER)
                    )}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[13px] font-semibold text-[#a3a3a3]">Колір</p>
            <div className="flex flex-col gap-1">
              {COLORS.map((c) => {
                const isActive = filters.color === c;
                return (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => onChange({ color: isActive ? null : c })}
                    className={cn(
                      "flex items-center gap-2 rounded-[8px] border px-3 py-2 text-[13px] font-semibold transition-colors",
                      isActive
                        ? "border-white text-white"
                        : cn("border-[#262626] text-[#a3a3a3]", INACTIVE_ROW_HOVER)
                    )}
                  >
                    <span className={cn("h-4 w-4 rounded-full border", COLOR_SWATCH_CLASSES[c])} />
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[13px] font-semibold text-[#a3a3a3]">Наявність</p>
            <div className="flex flex-col gap-1">
              <button
                type="button"
                aria-pressed={!filters.inStock}
                onClick={() => onChange({ inStock: null })}
                className={cn(
                  "rounded-[8px] border px-3 py-2 text-left text-[13px] font-semibold transition-colors",
                  !filters.inStock
                    ? "border-white bg-white text-black"
                    : cn("border-[#262626] text-[#a3a3a3]", INACTIVE_ROW_HOVER)
                )}
              >
                Всі товари
              </button>
              <button
                type="button"
                aria-pressed={filters.inStock}
                onClick={() => onChange({ inStock: "true" })}
                className={cn(
                  "rounded-[8px] border px-3 py-2 text-left text-[13px] font-semibold transition-colors",
                  filters.inStock
                    ? "border-white bg-white text-black"
                    : cn("border-[#262626] text-[#a3a3a3]", INACTIVE_ROW_HOVER)
                )}
              >
                В наявності
              </button>
            </div>
          </div>

          {/* R5: below md this is the ONLY place sort options live — the
              inline "Сортування" row (bottom of the desktop bar) is hidden
              below md via `hidden md:flex`. Same 4 options, same URL
              semantics (onChange({ sort: value })), white-active styling
              matching every other row in this sheet. */}
          <div>
            <p className="mb-2 text-[13px] font-semibold text-[#a3a3a3]">Сортування</p>
            <div className="flex flex-col gap-1">
              {SORT_OPTIONS.map((opt) => {
                const isActive = filters.sort === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => onChange({ sort: opt.value })}
                    className={cn(
                      "rounded-[8px] border px-3 py-2 text-left text-[13px] font-semibold transition-colors",
                      isActive
                        ? "border-white bg-white text-black"
                        : cn("border-[#262626] text-[#a3a3a3]", INACTIVE_ROW_HOVER)
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onClearAll();
              setOpen(false);
            }}
            className="rounded-[10px] border border-[#333] px-4 py-2.5 text-[13px] font-bold text-[#a3a3a3] transition-colors hover:border-[#666] hover:text-white"
          >
            Скинути все
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function FilterBar({ filters, brands, onChange, onClearAll }: FilterBarProps) {
  return (
    <div className="mb-8">
      <div className="flex flex-nowrap items-center gap-2.5 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible md:pb-0">
        <FiltersSheet
          filters={filters}
          brands={brands}
          onChange={onChange}
          onClearAll={onClearAll}
        />
        <PricePopover minPrice={filters.minPrice} maxPrice={filters.maxPrice} onChange={onChange} />
        <BrandPopover brand={filters.brand} brands={brands} onChange={onChange} />
        <SizeGroup size={filters.size} onChange={onChange} />
        <ColorPopover color={filters.color} onChange={onChange} />
        <AvailabilityPopover inStock={filters.inStock} onChange={onChange} />

        {/* R5: sort lives only in the Фільтри sheet below md — this row
            (and every trigger above it besides FiltersSheet) is hidden
            below md and only re-appears at md+. */}
        <div className="hidden shrink-0 items-center gap-1.5 md:ml-auto md:flex">
          <span className="text-[13px] font-semibold whitespace-nowrap text-[#737373]">
            Сортування:
          </span>
          {SORT_OPTIONS.map((opt) => {
            const isActive = filters.sort === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={isActive}
                onClick={() => onChange({ sort: opt.value })}
                className={cn(
                  "shrink-0 rounded-[9px] border px-3.5 py-[9px] text-[12.5px] font-bold transition-colors",
                  isActive
                    ? "border-white bg-white text-black"
                    : cn("border-[#333] text-[#a3a3a3]", INACTIVE_ROW_HOVER)
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {(filters.search || filters.category) && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {filters.search && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#262626] py-1.5 pr-2 pl-3 text-[12.5px] font-medium text-[#a3a3a3]">
              Пошук: {filters.search}
              <button
                type="button"
                aria-label="Скинути пошук"
                onClick={() => onChange({ search: null })}
                className="rounded-full p-0.5 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.category && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#262626] py-1.5 pr-2 pl-3 text-[12.5px] font-medium text-[#a3a3a3]">
              Категорія: {filters.category}
              <button
                type="button"
                aria-label="Скинути категорію"
                onClick={() => onChange({ category: null })}
                className="rounded-full p-0.5 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
