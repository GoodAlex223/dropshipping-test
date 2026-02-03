/**
 * Image utility functions for blur placeholders and optimization.
 *
 * Provides blur data URL generation for use with next/image placeholder="blur".
 * Uses a lightweight shimmer effect that doesn't require external dependencies.
 */

/**
 * Default blur data URL - a simple gray shimmer effect.
 * Used as fallback when blur generation fails or for images without custom blur.
 */
export const DEFAULT_BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmM2Y0ZjYiLz48c3RvcCBvZmZzZXQ9IjUwJSIgc3RvcC1jb2xvcj0iI2U1ZTdlYiIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI2YzZjRmNiIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IGZpbGw9InVybCgjZykiIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiLz48L3N2Zz4=";

/**
 * Generate a CSS shimmer/skeleton blur effect data URL.
 * This is a lightweight alternative to generating actual blurred images.
 *
 * @param width - Width of the placeholder
 * @param height - Height of the placeholder
 * @returns Base64-encoded SVG data URL
 */
export function generateShimmerDataUrl(width: number = 400, height: number = 400): string {
  const shimmerSvg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f3f4f6"/>
          <stop offset="50%" stop-color="#e5e7eb"/>
          <stop offset="100%" stop-color="#f3f4f6"/>
        </linearGradient>
      </defs>
      <rect fill="url(#g)" width="100%" height="100%"/>
    </svg>
  `.trim();

  return `data:image/svg+xml;base64,${Buffer.from(shimmerSvg).toString("base64")}`;
}

/**
 * Generate a solid color blur placeholder.
 * Useful for product images where you want a neutral background.
 *
 * @param color - CSS color value (hex, rgb, etc.)
 * @param width - Width of the placeholder
 * @param height - Height of the placeholder
 * @returns Base64-encoded SVG data URL
 */
export function generateSolidBlurDataUrl(
  color: string = "#e5e7eb",
  width: number = 10,
  height: number = 10
): string {
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect fill="${color}" width="100%" height="100%"/></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/**
 * Props helper for next/image with blur placeholder.
 * Provides consistent blur configuration across all product images.
 *
 * @param src - Image source URL
 * @param alt - Alt text for accessibility
 * @param priority - Whether this is an above-the-fold image
 * @returns Props object compatible with next/image
 */
export function getBlurImageProps(
  src: string,
  alt: string,
  priority: boolean = false
): {
  src: string;
  alt: string;
  placeholder: "blur";
  blurDataURL: string;
  priority?: boolean;
} {
  return {
    src,
    alt,
    placeholder: "blur" as const,
    blurDataURL: DEFAULT_BLUR_DATA_URL,
    ...(priority ? { priority: true } : {}),
  };
}

/**
 * Check if an image URL is valid and accessible.
 * Useful for validating external image URLs before rendering.
 *
 * @param url - Image URL to validate
 * @returns Promise<boolean> - True if image is accessible
 */
export async function isImageUrlValid(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD" });
    const contentType = response.headers.get("content-type");
    return response.ok && (contentType?.startsWith("image/") ?? false);
  } catch {
    return false;
  }
}

/**
 * Get optimized sizes attribute for different image contexts.
 * Follows Next.js image optimization best practices.
 */
export const IMAGE_SIZES = {
  /**
   * Product card in grid layout (4 columns on desktop, 2 on tablet, 1 on mobile)
   */
  productCard: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw",

  /**
   * Product detail main image (full width on mobile, half on desktop)
   */
  productDetail: "(max-width: 1024px) 100vw, 50vw",

  /**
   * Product thumbnail in gallery
   */
  thumbnail: "80px",

  /**
   * Category card in grid
   */
  categoryCard: "(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw",

  /**
   * Hero/banner images (full width)
   */
  hero: "100vw",
} as const;
