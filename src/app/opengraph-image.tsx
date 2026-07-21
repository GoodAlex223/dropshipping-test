import { ImageResponse } from "next/og";
import { BRAND_NAME, BRAND_META_SUFFIX, BRAND_TAGLINE } from "@/content/brand";

// Site-wide share card, generated with code instead of a static PNG so the
// rebrand can never drift from src/content/brand.ts again (the old
// public/og-image.png rendered the literal word "Store" — see BACKLOG.md).
// Same file convention as src/app/(shop)/products/[slug]/opengraph-image.tsx;
// this one lives at the app root so it covers every route that doesn't
// declare a more specific opengraph-image of its own — the product page's
// still wins for /products/[slug] since a more specific segment always
// overrides a less specific one.
//
// Deliberately monochrome (Mirox tokens: #000000 / #ffffff, the same
// dark-surface pair `[data-surface="dark"]` uses in globals.css) with no
// custom font fetch — next/og's default sans already reads as a plain
// geometric face at this weight/tracking, and fetching a font file over the
// network for a build-time image adds a fragile dependency for a purely
// stylistic gain.
export const alt = BRAND_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#000000",
        color: "#ffffff",
      }}
    >
      <div
        style={{
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: 6,
          textTransform: "uppercase",
          color: "#a3a3a3",
        }}
      >
        {BRAND_META_SUFFIX}
      </div>

      <div
        style={{
          display: "flex",
          fontSize: 96,
          fontWeight: 800,
          letterSpacing: -2,
          marginTop: 20,
        }}
      >
        {BRAND_NAME}
      </div>

      <div
        style={{
          display: "flex",
          marginTop: 28,
          width: 120,
          height: 2,
          background: "#ffffff",
        }}
      />

      <div
        style={{
          display: "flex",
          fontSize: 26,
          color: "#d4d4d4",
          marginTop: 28,
          maxWidth: 820,
          textAlign: "center",
          justifyContent: "center",
        }}
      >
        {BRAND_TAGLINE}
      </div>
    </div>,
    { ...size }
  );
}
