import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IMAGE_SIZES } from "@/lib/image-utils";
import { formatPrice } from "@/lib/format";
import { ProductImage } from "./ProductImage";

interface ProductVariantOption {
  name: string;
  value: string;
}

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    shortDesc?: string | null;
    price: string | number;
    comparePrice?: string | number | null;
    stock: number;
    isFeatured?: boolean;
    category?: { name: string; slug: string };
    images: { url: string; alt?: string | null }[];
    // Optional: category pages, search API results, and other ProductCard
    // callers besides src/lib/product-queries.ts may not supply variants at
    // all — the size row below just doesn't render in that case.
    variants?: ProductVariantOption[];
  };
  showCategory?: boolean;
}

/** Canonical display order; any other Size value (e.g. "One size") is appended after, in first-seen order. */
const SIZE_ORDER = ["S", "M", "L", "XL", "XXL"] as const;

/** Dedupes Size-variant values and orders them S · M · L · XL · XXL; returns null when there are none. */
function getSizeLabel(variants: ProductVariantOption[] | undefined): string | null {
  const sizeValues = variants?.filter((v) => v.name === "Size").map((v) => v.value) ?? [];
  if (sizeValues.length === 0) return null;

  const unique = Array.from(new Set(sizeValues));
  const ranked = SIZE_ORDER.filter((s) => unique.includes(s));
  const extras = unique.filter((v) => !(SIZE_ORDER as readonly string[]).includes(v));
  return [...ranked, ...extras].join(" · ");
}

export function ProductCard({ product, showCategory = true }: ProductCardProps) {
  const price = typeof product.price === "string" ? parseFloat(product.price) : product.price;
  const comparePrice = product.comparePrice
    ? typeof product.comparePrice === "string"
      ? parseFloat(product.comparePrice)
      : product.comparePrice
    : null;

  const discount =
    comparePrice && comparePrice > price
      ? Math.round(((comparePrice - price) / comparePrice) * 100)
      : null;

  const isOutOfStock = product.stock <= 0;
  const sizeLabel = getSizeLabel(product.variants);

  return (
    <Card
      className="group hover-lift overflow-hidden shadow-[var(--shadow-soft)]"
      data-testid="product-card"
    >
      {/* Whole card is one link, per the design handoff (its product card is
          a single <a>) — no separate footer CTA, no nested category link
          (nesting an <a> inside this one would be invalid HTML). aria-label
          pins the link's accessible name to just the product name; without
          it, the computed name would be the concatenation of every nested
          text node (category, description, both prices, size row) — a much
          noisier announcement than a screen reader needs for "go to this
          product's page". */}
      <Link href={`/products/${product.slug}`} className="block" aria-label={product.name}>
        <div className="bg-muted relative aspect-square overflow-hidden">
          <ProductImage
            src={product.images[0]?.url}
            alt={product.images[0]?.alt || product.name}
            sizes={IMAGE_SIZES.productCard}
          />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {discount && (
              <Badge
                variant="secondary"
                className="border-border-strong text-foreground rounded-full px-2.5 py-1 text-[10.5px] font-extrabold"
              >
                -{discount}%
              </Badge>
            )}
            {isOutOfStock && (
              <Badge variant="secondary" className="text-xs">
                Out of Stock
              </Badge>
            )}
          </div>
        </div>

        <CardContent className="p-4">
          {showCategory && product.category && (
            <p className="text-muted-foreground text-xs">{product.category.name}</p>
          )}

          <h3 className="group-hover:text-primary mt-1 line-clamp-2 leading-tight font-medium">
            {product.name}
          </h3>

          {product.shortDesc && (
            <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">{product.shortDesc}</p>
          )}

          <div className="mt-2 flex items-center gap-2">
            <span className="text-lg font-bold">{formatPrice(price)}</span>
            {comparePrice && comparePrice > price && (
              <span className="text-muted-foreground text-sm line-through">
                {formatPrice(comparePrice)}
              </span>
            )}
          </div>

          {sizeLabel && (
            <p className="text-muted-foreground mt-2 text-[11.5px] font-semibold">{sizeLabel}</p>
          )}
        </CardContent>
      </Link>
    </Card>
  );
}
