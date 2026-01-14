// Visual theme definitions
export const VISUAL_THEMES = [
  {
    id: "default",
    name: "Default",
    description: "Clean, minimal design",
    previewColor: "bg-neutral-900 dark:bg-neutral-100",
  },
  {
    id: "bold",
    name: "Bold & Vibrant",
    description: "Energetic, modern feel",
    previewColor: "bg-blue-500",
  },
  {
    id: "luxury",
    name: "Luxury",
    description: "Sophisticated elegance",
    previewColor: "bg-amber-600",
  },
  {
    id: "organic",
    name: "Organic",
    description: "Natural, calming tones",
    previewColor: "bg-green-600",
  },
] as const;

// Color mode definitions
export const COLOR_MODES = [
  { id: "light", name: "Light" },
  { id: "dark", name: "Dark" },
] as const;

export type VisualThemeId = (typeof VISUAL_THEMES)[number]["id"];
export type ColorModeId = (typeof COLOR_MODES)[number]["id"];

// Parse theme string into visual theme and color mode
export function parseTheme(theme: string | undefined): {
  visualTheme: VisualThemeId;
  colorMode: ColorModeId;
} {
  if (!theme || theme === "light") {
    return { visualTheme: "default", colorMode: "light" };
  }

  if (theme === "dark") {
    return { visualTheme: "default", colorMode: "dark" };
  }

  // Parse themes like "bold", "bold-dark", "luxury", "luxury-dark"
  if (theme.endsWith("-dark")) {
    const visual = theme.replace("-dark", "");
    const validVisuals: VisualThemeId[] = ["default", "bold", "luxury", "organic"];
    if (validVisuals.includes(visual as VisualThemeId)) {
      return {
        visualTheme: visual as VisualThemeId,
        colorMode: "dark",
      };
    }
  }

  // Light mode visual themes: "bold", "luxury", "organic"
  const validVisuals: VisualThemeId[] = ["bold", "luxury", "organic"];
  if (validVisuals.includes(theme as VisualThemeId)) {
    return {
      visualTheme: theme as VisualThemeId,
      colorMode: "light",
    };
  }

  return { visualTheme: "default", colorMode: "light" };
}

// Build theme string from visual theme and color mode
export function buildTheme(visualTheme: VisualThemeId, colorMode: ColorModeId): string {
  if (visualTheme === "default") {
    return colorMode; // "light" or "dark"
  }

  if (colorMode === "dark") {
    return `${visualTheme}-dark`; // e.g., "bold-dark"
  }

  return visualTheme; // e.g., "bold" (light mode)
}
