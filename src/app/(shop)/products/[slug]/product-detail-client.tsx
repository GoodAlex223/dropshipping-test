"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  ShoppingCart,
  Package,
  ArrowLeft,
  Check,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProductCard } from "@/components/products";
import { useCartStore } from "@/stores/cart.store";
import { cn } from "@/lib/utils";

interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
}

interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: string;
  stock: number;
  options: Record<string, string>;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDesc: string | null;
  price: string;
  comparePrice: string | null;
  stock: number;
  sku: string;
  isFeatured: boolean;
  category: { id: string; name: string; slug: string };
  images: ProductImage[];
  variants: ProductVariant[];
  relatedProducts: {
    id: string;
    name: string;
    slug: string;
    shortDesc: string | null;
    price: string;
    comparePrice: string | null;
    stock: number;
    isFeatured: boolean;
    category: { name: string; slug: string };
    images: { url: string; alt: string | null }[];
  }[];
}

interface ProductDetailClientProps {
  product: Product;
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const router = useRouter();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants.length > 0 ? product.variants[0] : null
  );
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const { addItem, openCart } = useCartStore();

  const currentPrice = selectedVariant
    ? parseFloat(selectedVariant.price)
    : parseFloat(product.price);

  const currentStock = selectedVariant?.stock ?? product.stock;

  const comparePrice = product.comparePrice ? parseFloat(product.comparePrice) : null;
  const hasDiscount = comparePrice && comparePrice > currentPrice;
  const discountPercent = hasDiscount
    ? Math.round(((comparePrice - currentPrice) / comparePrice) * 100)
    : 0;

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= currentStock) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async () => {
    setIsAddingToCart(true);

    await new Promise((resolve) => setTimeout(resolve, 300));

    addItem({
      productId: product.id,
      variantId: selectedVariant?.id,
      name: selectedVariant ? `${product.name} - ${selectedVariant.name}` : product.name,
      price: currentPrice,
      image: product.images[0]?.url,
      maxStock: currentStock,
      quantity,
    });

    setIsAddingToCart(false);
    setAddedToCart(true);

    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    openCart();
  };

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev === product.images.length - 1 ? 0 : prev + 1));
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev === 0 ? product.images.length - 1 : prev - 1));
  };

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <nav className="text-muted-foreground mb-6 flex items-center gap-2 text-sm">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <span>/</span>
        <Link href="/products" className="hover:text-foreground">
          Products
        </Link>
        <span>/</span>
        <Link href={`/categories/${product.category.slug}`} className="hover:text-foreground">
          {product.category.name}
        </Link>
        <span>/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      {/* Main Product Section */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image Gallery */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="bg-muted relative aspect-square overflow-hidden rounded-lg border">
            {product.images.length > 0 ? (
              <>
                <Image
                  src={product.images[selectedImageIndex]?.url}
                  alt={product.images[selectedImageIndex]?.alt || product.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
                {product.images.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="bg-background/80 hover:bg-background absolute top-1/2 left-2 -translate-y-1/2"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="bg-background/80 hover:bg-background absolute top-1/2 right-2 -translate-y-1/2"
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </>
            ) : (
              <div className="flex h-full items-center justify-center">
                <Package className="text-muted-foreground/50 h-24 w-24" />
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              {product.isFeatured && <Badge variant="default">Featured</Badge>}
              {hasDiscount && <Badge variant="destructive">-{discountPercent}%</Badge>}
              {currentStock === 0 && <Badge variant="secondary">Out of Stock</Badge>}
            </div>
          </div>

          {/* Thumbnail Strip */}
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {product.images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImageIndex(index)}
                  className={cn(
                    "relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border-2 transition-colors",
                    selectedImageIndex === index
                      ? "border-primary"
                      : "hover:border-muted-foreground/50 border-transparent"
                  )}
                >
                  <Image
                    src={image.url}
                    alt={image.alt || `${product.name} thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Category */}
          <Link
            href={`/categories/${product.category.slug}`}
            className="text-primary text-sm font-medium hover:underline"
          >
            {product.category.name}
          </Link>

          {/* Title */}
          <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold">${currentPrice.toFixed(2)}</span>
            {hasDiscount && (
              <span className="text-muted-foreground text-xl line-through">
                ${comparePrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Short Description */}
          {product.shortDesc && <p className="text-muted-foreground">{product.shortDesc}</p>}

          <Separator />

          {/* Variants */}
          {product.variants.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm font-medium">Options</div>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant) => (
                  <Button
                    key={variant.id}
                    variant={selectedVariant?.id === variant.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedVariant(variant);
                      setQuantity(1);
                    }}
                    disabled={variant.stock === 0}
                    className="min-w-[80px]"
                  >
                    {variant.name}
                    {variant.stock === 0 && " (Out)"}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Quantity</span>
              {currentStock > 0 && currentStock <= 10 && (
                <span className="text-sm text-orange-600">Only {currentStock} left in stock</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-md border">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-r-none"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1 || currentStock === 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-l-none"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= currentStock || currentStock === 0}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Add to Cart / Buy Now */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              className="flex-1"
              onClick={handleAddToCart}
              disabled={currentStock === 0 || isAddingToCart}
            >
              {isAddingToCart ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Adding...
                </span>
              ) : addedToCart ? (
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Added to Cart
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Add to Cart
                </span>
              )}
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="flex-1"
              onClick={handleBuyNow}
              disabled={currentStock === 0 || isAddingToCart}
            >
              Buy Now
            </Button>
          </div>

          {/* Stock Warning */}
          {currentStock === 0 && (
            <div className="bg-destructive/10 text-destructive flex items-center gap-2 rounded-md p-3">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">This product is currently out of stock</span>
            </div>
          )}

          {/* SKU */}
          <div className="text-muted-foreground text-sm">
            SKU: {selectedVariant?.sku || product.sku}
          </div>
        </div>
      </div>

      {/* Full Description */}
      {product.description && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold">Description</h2>
          <Separator className="my-4" />
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap">{product.description}</p>
          </div>
        </div>
      )}

      {/* Related Products */}
      {product.relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold">Related Products</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {product.relatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ProductNotFound() {
  const router = useRouter();

  return (
    <div className="container py-16">
      <div className="flex flex-col items-center justify-center text-center">
        <Package className="text-muted-foreground h-16 w-16" />
        <h1 className="mt-4 text-2xl font-bold">Product not found</h1>
        <p className="text-muted-foreground mt-2">
          The product you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Button className="mt-6" onClick={() => router.push("/products")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Button>
      </div>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="container py-8">
      {/* Breadcrumb skeleton */}
      <div className="mb-6 flex gap-2">
        {[60, 80, 100, 120].map((width, i) => (
          <div key={i} className="bg-muted h-4 animate-pulse rounded" style={{ width }} />
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image skeleton */}
        <div className="space-y-4">
          <div className="bg-muted aspect-square animate-pulse rounded-lg" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-muted h-20 w-20 animate-pulse rounded-md" />
            ))}
          </div>
        </div>

        {/* Info skeleton */}
        <div className="space-y-6">
          <div className="bg-muted h-4 w-24 animate-pulse rounded" />
          <div className="bg-muted h-9 w-3/4 animate-pulse rounded" />
          <div className="bg-muted h-8 w-32 animate-pulse rounded" />
          <div className="bg-muted h-16 w-full animate-pulse rounded" />
          <div className="bg-muted h-px" />
          <div className="space-y-2">
            <div className="bg-muted h-4 w-16 animate-pulse rounded" />
            <div className="flex gap-2">
              <div className="bg-muted h-10 w-12 animate-pulse rounded" />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="bg-muted h-12 flex-1 animate-pulse rounded" />
            <div className="bg-muted h-12 flex-1 animate-pulse rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
