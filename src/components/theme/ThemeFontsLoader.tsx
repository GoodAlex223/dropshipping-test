"use client";

/**
 * Placeholder component for future conditional font loading.
 *
 * Note: Due to Next.js restrictions on using next/font/google in client components
 * during static generation, theme fonts (Playfair, Lora) are loaded in the root
 * layout with `display: "swap"` and `preload: false` for optimized loading.
 *
 * This component is kept as a placeholder for potential future enhancements
 * such as:
 * - Dynamic font loading based on user preferences stored in localStorage
 * - Font preloading hints when user hovers over theme switcher
 */

export function ThemeFontsLoader() {
  // Currently no-op - fonts handled in root layout with preload: false
  return null;
}
