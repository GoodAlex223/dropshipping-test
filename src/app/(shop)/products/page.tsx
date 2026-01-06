"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, Package, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProductCard } from "@/components/products";

interface Product {
  id: string;
  name: string;
  slug: string;
  shortDesc: string | null;
  price: string;
  comparePrice: string | null;
  stock: number;
  isFeatured: boolean;
  category: { id: string; name: string; slug: string };
  images: { url: string; alt: string | null }[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface PaginatedResponse {
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filter state
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "createdAt");
  const [sortOrder, setSortOrder] = useState(searchParams.get("sortOrder") || "desc");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [maxPriceLimit] = useState(1000);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", searchParams.get("page") || "1");
      params.set("limit", "12");
      if (searchParams.get("search")) params.set("search", searchParams.get("search")!);
      if (searchParams.get("category")) params.set("category", searchParams.get("category")!);
      if (searchParams.get("featured")) params.set("featured", searchParams.get("featured")!);
      if (searchParams.get("minPrice")) params.set("minPrice", searchParams.get("minPrice")!);
      if (searchParams.get("maxPrice")) params.set("maxPrice", searchParams.get("maxPrice")!);
      params.set("sortBy", searchParams.get("sortBy") || "createdAt");
      params.set("sortOrder", searchParams.get("sortOrder") || "desc");

      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) throw new Error("Failed to fetch products");

      const data: PaginatedResponse = await response.json();
      setProducts(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  }, [searchParams]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/categories?parentOnly=true");
      if (!response.ok) throw new Error("Failed to fetch categories");
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    // Sync state with URL params
    setSearch(searchParams.get("search") || "");
    setCategory(searchParams.get("category") || "");
    setSortBy(searchParams.get("sortBy") || "createdAt");
    setSortOrder(searchParams.get("sortOrder") || "desc");
  }, [searchParams]);

  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1"); // Reset to first page on filter change

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    router.push(`/products?${params}`);
    setFiltersOpen(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: search || null });
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    router.push(`/products?${params}`);
  };

  const clearFilters = () => {
    router.push("/products");
    setSearch("");
    setCategory("");
    setPriceRange([0, maxPriceLimit]);
  };

  const activeFiltersCount = [
    searchParams.get("search"),
    searchParams.get("category"),
    searchParams.get("minPrice"),
    searchParams.get("maxPrice"),
    searchParams.get("featured"),
  ].filter(Boolean).length;

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
        <p className="text-muted-foreground mt-2">
          Browse our collection of {pagination.total} products
        </p>
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex flex-1 gap-2 md:max-w-md">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>

        {/* Sort and Filter */}
        <div className="flex items-center gap-2">
          {/* Mobile Filter Button */}
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="md:hidden">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px]">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {/* Category Filter */}
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={category || "all"}
                    onValueChange={(value) => {
                      const newValue = value === "all" ? "" : value;
                      setCategory(newValue);
                      updateFilters({ category: newValue || null });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.slug}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div className="space-y-4">
                  <Label>Price Range</Label>
                  <Slider
                    value={priceRange}
                    onValueChange={(value) => setPriceRange(value as [number, number])}
                    max={maxPriceLimit}
                    step={10}
                    className="mt-2"
                  />
                  <div className="flex items-center justify-between text-sm">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() =>
                      updateFilters({
                        minPrice: priceRange[0] > 0 ? priceRange[0].toString() : null,
                        maxPrice: priceRange[1] < maxPriceLimit ? priceRange[1].toString() : null,
                      })
                    }
                  >
                    Apply Price Filter
                  </Button>
                </div>

                <Separator />

                <Button variant="outline" className="w-full" onClick={clearFilters}>
                  Clear All Filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop Category Filter */}
          <Select
            value={category || "all"}
            onValueChange={(value) => updateFilters({ category: value === "all" ? null : value })}
          >
            <SelectTrigger className="hidden w-[180px] md:flex">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.slug}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select
            value={`${sortBy}-${sortOrder}`}
            onValueChange={(value) => {
              const [newSortBy, newSortOrder] = value.split("-");
              updateFilters({ sortBy: newSortBy, sortOrder: newSortOrder });
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt-desc">Newest</SelectItem>
              <SelectItem value="createdAt-asc">Oldest</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="name-asc">Name: A to Z</SelectItem>
              <SelectItem value="name-desc">Name: Z to A</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-sm">Active filters:</span>
          {searchParams.get("search") && (
            <Badge variant="secondary" className="gap-1">
              Search: {searchParams.get("search")}
              <button onClick={() => updateFilters({ search: null })}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {searchParams.get("category") && (
            <Badge variant="secondary" className="gap-1">
              Category: {searchParams.get("category")}
              <button onClick={() => updateFilters({ category: null })}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {(searchParams.get("minPrice") || searchParams.get("maxPrice")) && (
            <Badge variant="secondary" className="gap-1">
              Price: ${searchParams.get("minPrice") || "0"} - ${searchParams.get("maxPrice") || "∞"}
              <button onClick={() => updateFilters({ minPrice: null, maxPrice: null })}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear all
          </Button>
        </div>
      )}

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-lg border">
              <div className="bg-muted aspect-square animate-pulse" />
              <div className="space-y-2 p-4">
                <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
                <div className="bg-muted h-3 w-1/2 animate-pulse rounded" />
                <div className="bg-muted h-5 w-1/3 animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Package className="text-muted-foreground h-16 w-16" />
          <h2 className="mt-4 text-xl font-semibold">No products found</h2>
          <p className="text-muted-foreground mt-2">
            Try adjusting your search or filter criteria.
          </p>
          <Button variant="outline" className="mt-4" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={!pagination.hasPrev}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous
          </Button>
          <span className="text-muted-foreground text-sm">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={!pagination.hasNext}
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function ProductsLoadingSkeleton() {
  return (
    <div className="container py-8">
      <div className="mb-8">
        <div className="bg-muted h-9 w-32 animate-pulse rounded" />
        <div className="bg-muted mt-2 h-5 w-48 animate-pulse rounded" />
      </div>
      <div className="mb-6 flex gap-4">
        <div className="bg-muted h-10 max-w-md flex-1 animate-pulse rounded" />
        <div className="bg-muted h-10 w-[180px] animate-pulse rounded" />
        <div className="bg-muted h-10 w-[160px] animate-pulse rounded" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-lg border">
            <div className="bg-muted aspect-square animate-pulse" />
            <div className="space-y-2 p-4">
              <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
              <div className="bg-muted h-5 w-1/3 animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsLoadingSkeleton />}>
      <ProductsContent />
    </Suspense>
  );
}
