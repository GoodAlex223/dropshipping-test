import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IMAGE_SIZES } from "@/lib/image-utils";
import { formatPrice } from "@/lib/format";
import { isNewProduct } from "@/lib/product-badges";
import { cn } from "@/lib/utils";
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
    createdAt?: string | Date;
    category?: { name: string; slug: string };
    images: { url: string; alt?: string | null }[];
    // Optional: category pages, search API results, and other ProductCard
    // callers besides src/lib/product-queries.ts may not supply variants at
    // all — the size row below just doesn't render in that case.
    variants?: ProductVariantOption[];
  };
  showCategory?: boolean;
  /**
   * When provided, a hover overlay renders two quick-action buttons.
   * `focusSizes: true` on «В кошик» tells the consumer to open the quick
   * view already focused on size selection; `false` on «Швидкий перегляд»
   * just opens it. Omitted entirely on server-rendered rails (homepage),
   * where there is no client-side quick view to open.
   */
  onQuickView?: (opts: { focusSizes: boolean }) => void;
}

/** Canonical display order; any other Size value (e.g. "One size") is appended after, in first-seen order. */
export const SIZE_ORDER = ["S", "M", "L", "XL", "XXL"] as const;

const COLOR_SWATCH_CLASSES: Record<string, string> = {
  Чорний: "bg-black border-border-strong",
  Білий: "bg-[#f5f5f5] border-border",
};

/** Dedupes Size-variant values and orders them S · M · L · XL · XXL; returns null when there are none. */
function getSizeLabel(variants: ProductVariantOption[] | undefined): string | null {
  const sizeValues = variants?.filter((v) => v.name === "Size").map((v) => v.value) ?? [];
  if (sizeValues.length === 0) return null;

  const unique = Array.from(new Set(sizeValues));
  const ranked = SIZE_ORDER.filter((s) => unique.includes(s));
  const extras = unique.filter((v) => !(SIZE_ORDER as readonly string[]).includes(v));
  return [...ranked, ...extras].join(" · ");
}

export function ProductCard({ product, showCategory = true, onQuickView }: ProductCardProps) {
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
  const hasHoverImage = Boolean(product.images[1]?.url);

  const colorValues = Array.from(
    new Set(product.variants?.filter((v) => v.name === "Color").map((v) => v.value) ?? [])
  ).filter((value) => value in COLOR_SWATCH_CLASSES);

  // Single badge max — precedence is discount > НОВИНКА > out-of-stock (spec §4).
  const badge = discount
    ? { label: `-${discount}%`, className: "bg-secondary border-border-strong text-foreground" }
    : product.createdAt && isNewProduct(product.createdAt)
      ? { label: "НОВИНКА", className: "bg-white text-black border-transparent" }
      : isOutOfStock
        ? { label: "Немає в наявності", className: "bg-secondary text-foreground" }
        : null;

  return (
    <Card
      className="group hover-lift relative overflow-hidden shadow-[var(--shadow-soft)]"
      data-testid="product-card"
    >
      {/* Whole card is one link, per the design handoff (its product card is
          a single <a>) — no separate footer CTA, no nested category link
          (nesting an <a> inside this one would be invalid HTML). aria-label
          pins the link's accessible name to just the product name; without
          it, the computed name would be the concatenation of every nested
          text node (category, description, both prices, size row) — a much
          noisier announcement than a screen reader needs for "go to this
          product's page". The quick-action overlay buttons live outside this
          Link as Card siblings — buttons nested inside an <a> are invalid
          HTML. */}
      <Link href={`/products/${product.slug}`} className="block" aria-label={product.name}>
        <div className="bg-muted relative aspect-square overflow-hidden">
          <ProductImage
            src={product.images[0]?.url}
            alt={product.images[0]?.alt || product.name}
            sizes={IMAGE_SIZES.productCard}
            className={cn(hasHoverImage && "transition-opacity duration-300 group-hover:opacity-0")}
          />
          {hasHoverImage && (
            <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <ProductImage
                src={product.images[1]!.url}
                alt={product.images[1]!.alt || product.name}
                sizes={IMAGE_SIZES.productCard}
              />
            </div>
          )}

          {/* Badge */}
          {badge && (
            <div className="pointer-events-none absolute top-2 left-2 flex flex-col gap-1">
              <Badge
                variant="secondary"
                className={cn(
                  "rounded-full px-2.5 py-1 text-[10.5px] font-extrabold",
                  badge.className
                )}
              >
                {badge.label}
              </Badge>
            </div>
          )}
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

          {colorValues.length > 0 && (
            <div className="mt-2 flex gap-1.5">
              {colorValues.map((value) => (
                <span
                  key={value}
                  role="img"
                  aria-label={`Колір: ${value}`}
                  title={value}
                  className={cn("h-4 w-4 rounded-full border", COLOR_SWATCH_CLASSES[value])}
                />
              ))}
            </div>
          )}

          {sizeLabel && (
            <p className="text-muted-foreground mt-2 text-[11.5px] font-semibold">{sizeLabel}</p>
          )}
        </CardContent>
      </Link>

      {onQuickView && (
        <div className="pointer-events-none absolute inset-x-0 top-0 hidden aspect-square items-end justify-center gap-2 p-3 opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100 md:flex">
          <button
            type="button"
            onClick={(e) => {
              // Card sits inside catalog/rail wrappers with their own click
              // handlers (e.g. GA4 select_item tracking) — opening quick
              // view isn't a product-page navigation, so it must not bubble.
              e.stopPropagation();
              onQuickView({ focusSizes: false });
            }}
            className="border-border-strong pointer-events-auto rounded-[10px] border bg-black/80 px-3 py-2 text-[12px] font-bold backdrop-blur-sm hover:border-white"
          >
            Швидкий перегляд
          </button>
          {!isOutOfStock && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onQuickView({ focusSizes: true });
              }}
              className="pointer-events-auto rounded-[10px] bg-white px-3 py-2 text-[12px] font-extrabold text-black hover:bg-[#e5e5e5]"
            >
              В кошик
            </button>
          )}
        </div>
      )}
    </Card>
  );
}
