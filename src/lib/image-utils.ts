/**
 * Image utility: blur placeholder and responsive sizes for next/image.
 */

export const DEFAULT_BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmM2Y0ZjYiLz48c3RvcCBvZmZzZXQ9IjUwJSIgc3RvcC1jb2xvcj0iI2U1ZTdlYiIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI2YzZjRmNiIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IGZpbGw9InVybCgjZykiIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiLz48L3N2Zz4=";

export const IMAGE_SIZES = {
  productCard: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw",
  productDetail: "(max-width: 1024px) 100vw, 50vw",
  thumbnail: "80px",
  categoryCard: "(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw",
  hero: "100vw",
} as const;
