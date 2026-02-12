"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Package, ArrowLeft, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Separator } from "@/components/ui/separator";
import { ProductCard } from "@/components/products";
import { trackViewItemList, trackSelectItem, type GA4Item } from "@/lib/analytics";

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

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parent: { id: string; name: string; slug: string } | null;
  children: { id: string; name: string; slug: string }[];
  _count?: { products: number };
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

interface CategoryClientProps {
  category: Category;
}

export function CategoryClient({ category }: CategoryClientProps) {
  const [products, setProducts] = useState<Product[]>([]);
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
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [appliedPriceRange, setAppliedPriceRange] = useState<[number, number] | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const maxPriceLimit = 1000;

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams();
      queryParams.set("category", selectedSubcategory || category.slug);
      queryParams.set("page", currentPage.toString());
      queryParams.set("limit", "12");
      queryParams.set("sortBy", sortBy);
      queryParams.set("sortOrder", sortOrder);

      if (appliedPriceRange) {
        if (appliedPriceRange[0] > 0) {
          queryParams.set("minPrice", appliedPriceRange[0].toString());
        }
        if (appliedPriceRange[1] < maxPriceLimit) {
          queryParams.set("maxPrice", appliedPriceRange[1].toString());
        }
      }

      const response = await fetch(`/api/products?${queryParams}`);
      if (!response.ok) throw new Error("Failed to fetch products");

      const data: PaginatedResponse = await response.json();
      setProducts(data.data);
      setPagination(data.pagination);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setIsLoading(false);
    }
  }, [category.slug, currentPage, sortBy, sortOrder, appliedPriceRange, selectedSubcategory]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // GA4: Track category product list view (once per product set)
  const listTracked = useRef(false);
  useEffect(() => {
    listTracked.current = false;
  }, [currentPage, sortBy, sortOrder, appliedPriceRange, selectedSubcategory]);
  useEffect(() => {
    if (products.length > 0 && !isLoading && !listTracked.current) {
      listTracked.current = true;
      const ga4Items: GA4Item[] = products.map((p, index) => ({
        item_id: p.id,
        item_name: p.name,
        item_category: category.name,
        price: parseFloat(p.price),
        quantity: 1,
        index,
      }));
      trackViewItemList(ga4Items, `category_${category.slug}`, category.name);
    }
  }, [products, isLoading, category.slug, category.name]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleSortChange = (value: string) => {
    const [newSortBy, newSortOrder] = value.split("-");
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setCurrentPage(1);
  };

  const applyPriceFilter = () => {
    setAppliedPriceRange(priceRange);
    setCurrentPage(1);
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    setPriceRange([0, maxPriceLimit]);
    setAppliedPriceRange(null);
    setSelectedSubcategory("");
    setCurrentPage(1);
    setFiltersOpen(false);
  };

  const activeFiltersCount = [appliedPriceRange, selectedSubcategory].filter(Boolean).length;

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <nav className="text-muted-foreground mb-6 flex items-center gap-2 text-sm">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <span>/</span>
        <Link href="/categories" className="hover:text-foreground">
          Categories
        </Link>
        {category.parent && (
          <>
            <span>/</span>
            <Link href={`/categories/${category.parent.slug}`} className="hover:text-foreground">
              {category.parent.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-foreground">{category.name}</span>
      </nav>

      {/* Category Header */}
      <div className="mb-8">
        {category.image && (
          <div className="relative mb-6 aspect-[21/9] overflow-hidden rounded-lg">
            <Image
              src={category.image}
              alt={category.name}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6">
              <h1 className="text-3xl font-bold text-white md:text-4xl">{category.name}</h1>
              {category.description && (
                <p className="mt-2 max-w-2xl text-white/80">{category.description}</p>
              )}
            </div>
          </div>
        )}

        {!category.image && (
          <>
            <h1 className="text-3xl font-bold tracking-tight">{category.name}</h1>
            {category.description && (
              <p className="text-muted-foreground mt-2">{category.description}</p>
            )}
          </>
        )}

        <p className="text-muted-foreground mt-4 text-sm">
          {pagination.total} {pagination.total === 1 ? "product" : "products"}
        </p>
      </div>

      {/* Subcategories */}
      {category.children.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            variant={selectedSubcategory === "" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setSelectedSubcategory("");
              setCurrentPage(1);
            }}
          >
            All
          </Button>
          {category.children.map((child) => (
            <Button
              key={child.id}
              variant={selectedSubcategory === child.slug ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setSelectedSubcategory(child.slug);
                setCurrentPage(1);
              }}
            >
              {child.name}
            </Button>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="mb-6 flex items-center justify-between gap-4">
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
                <Button variant="outline" size="sm" className="w-full" onClick={applyPriceFilter}>
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

        {/* Active Filters */}
        {activeFiltersCount > 0 && (
          <div className="hidden flex-wrap items-center gap-2 md:flex">
            {appliedPriceRange && (
              <Badge variant="secondary" className="gap-1">
                Price: ${appliedPriceRange[0]} - ${appliedPriceRange[1]}
                <button onClick={() => setAppliedPriceRange(null)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}

        {/* Sort */}
        <Select value={`${sortBy}-${sortOrder}`} onValueChange={handleSortChange}>
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

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-lg border">
              <div className="bg-muted aspect-square animate-pulse" />
              <div className="space-y-2 p-4">
                <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
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
            Try adjusting your filters or check back later.
          </p>
          {activeFiltersCount > 0 && (
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product, index) => (
            <div
              key={product.id}
              onClick={() =>
                trackSelectItem(
                  {
                    item_id: product.id,
                    item_name: product.name,
                    item_category: category.name,
                    price: parseFloat(product.price),
                    quantity: 1,
                    index,
                  },
                  `category_${category.slug}`,
                  category.name
                )
              }
            >
              <ProductCard product={product} />
            </div>
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

export function CategoryNotFound() {
  const router = useRouter();

  return (
    <div className="container py-16">
      <div className="flex flex-col items-center justify-center text-center">
        <Package className="text-muted-foreground h-16 w-16" />
        <h1 className="mt-4 text-2xl font-bold">Category not found</h1>
        <p className="text-muted-foreground mt-2">
          The category you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Button className="mt-6" onClick={() => router.push("/categories")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Categories
        </Button>
      </div>
    </div>
  );
}
