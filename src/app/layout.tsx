/**
 * Root layout with optimized font loading and performance features.
 *
 * Font loading strategy:
 * - Inter (primary) and JetBrains Mono (code): Always loaded, no preload delay
 * - Playfair Display (luxury theme): Loaded with display:swap, preload:false
 * - Lora (organic theme): Loaded with display:swap, preload:false
 *
 * The theme fonts use preload:false to defer their loading until the fonts
 * are actually used, saving ~60-80KB on initial load for users on default theme.
 *
 * Performance features:
 * - Resource hints for critical third-party domains
 * - Web Vitals reporting to GA4 via GTM
 * - Deferred theme font loading
 *
 * Note: force-dynamic is required because the app uses client-side contexts
 * (auth, theme) that don't work during static prerendering.
 */
export const dynamic = "force-dynamic";

import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Playfair_Display, Lora } from "next/font/google";
import { Providers } from "@/components/providers";
import { getDefaultMetadata, getOrganizationJsonLd, getWebsiteJsonLd } from "@/lib/seo";
import { PRECONNECT_DOMAINS, DNS_PREFETCH_DOMAINS } from "@/components/common/ResourceHints";
import "./globals.css";

// Primary sans-serif font (always loaded immediately)
const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Monospace font for code snippets (always loaded immediately)
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Serif font for Luxury theme headings
// preload: false - only loaded when CSS actually uses the font
// display: swap - shows fallback font while loading, prevents FOIT
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});

// Serif font for Organic theme headings
// Same optimizations as playfair
const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = getDefaultMetadata();

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationJsonLd = getOrganizationJsonLd();
  const websiteJsonLd = getWebsiteJsonLd();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Resource hints for faster third-party connections */}
        {PRECONNECT_DOMAINS.map((domain) => (
          <link key={domain} rel="preconnect" href={domain} crossOrigin="anonymous" />
        ))}
        {DNS_PREFETCH_DOMAINS.map((domain) => (
          <link key={domain} rel="dns-prefetch" href={domain} />
        ))}

        {/* JSON-LD structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd),
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${playfair.variable} ${lora.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
