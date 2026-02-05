import type { Metadata } from "next";

// Base site configuration
export const siteConfig = {
  name: process.env.NEXT_PUBLIC_STORE_NAME || "Store",
  description:
    "Your one-stop shop for quality products at great prices. Discover amazing deals and fast shipping.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ogImage: "/og-image.png",
  twitterHandle: "@store",
  locale: "en_US",
};

// Default metadata configuration
export function getDefaultMetadata(): Metadata {
  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: siteConfig.name,
      template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.description,
    keywords: ["online store", "e-commerce", "shopping", "deals", "products", "fast shipping"],
    authors: [{ name: siteConfig.name }],
    creator: siteConfig.name,
    publisher: siteConfig.name,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      url: siteConfig.url,
      siteName: siteConfig.name,
      title: siteConfig.name,
      description: siteConfig.description,
      images: [
        {
          url: siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: siteConfig.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: siteConfig.name,
      description: siteConfig.description,
      images: [siteConfig.ogImage],
      creator: siteConfig.twitterHandle,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    icons: {
      icon: "/favicon.ico",
      shortcut: "/favicon-16x16.png",
      apple: "/apple-touch-icon.png",
    },
    manifest: "/manifest.json",
    alternates: {
      canonical: siteConfig.url,
      languages: {
        en: siteConfig.url,
        "x-default": siteConfig.url,
      },
    },
  };
}

// Generate product metadata
export function getProductMetadata(product: {
  name: string;
  slug: string;
  description?: string | null;
  shortDesc?: string | null;
  metaTitle?: string | null;
  metaDesc?: string | null;
  price: string;
  comparePrice?: string | null;
  category?: { name: string; slug: string };
}): Metadata {
  const title = product.metaTitle || product.name;
  const description =
    product.metaDesc ||
    product.shortDesc ||
    product.description?.slice(0, 160) ||
    siteConfig.description;
  const url = `${siteConfig.url}/products/${product.slug}`;

  // Note: OG images are generated dynamically by opengraph-image.tsx (file convention).
  // Next.js automatically wires the generated image into og:image and twitter:image meta tags.
  return {
    title,
    description,
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: siteConfig.name,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: url,
    },
  };
}

// Generate category metadata
export function getCategoryMetadata(category: {
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  productCount?: number;
}): Metadata {
  const description =
    category.description ||
    `Shop ${category.name} products. ${category.productCount || "Browse"} quality items at great prices.`;
  const image = category.image || siteConfig.ogImage;
  const url = `${siteConfig.url}/categories/${category.slug}`;

  return {
    title: category.name,
    description,
    openGraph: {
      type: "website",
      url,
      title: `${category.name} | ${siteConfig.name}`,
      description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: category.name,
        },
      ],
      siteName: siteConfig.name,
    },
    twitter: {
      card: "summary_large_image",
      title: `${category.name} | ${siteConfig.name}`,
      description,
      images: [image],
    },
    alternates: {
      canonical: url,
    },
  };
}

// Generate home page metadata
export function getHomeMetadata(): Metadata {
  return {
    title: {
      absolute: `${siteConfig.name} | Quality Products, Great Prices`,
    },
    description: siteConfig.description,
    alternates: {
      canonical: siteConfig.url,
    },
  };
}

// Generate products listing page metadata
export function getProductsListingMetadata(): Metadata {
  const url = `${siteConfig.url}/products`;
  return {
    title: "All Products",
    description:
      "Browse our complete collection of quality products. Find great deals and fast shipping on everything you need.",
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `All Products | ${siteConfig.name}`,
      description: "Browse our complete collection of quality products.",
      url,
    },
  };
}

// Generate categories listing page metadata
export function getCategoriesListingMetadata(): Metadata {
  const url = `${siteConfig.url}/categories`;
  return {
    title: "Shop by Category",
    description:
      "Browse products by category. Find exactly what you're looking for in our organized collection.",
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `Categories | ${siteConfig.name}`,
      description: "Browse products by category.",
      url,
    },
  };
}

// Generate auth page metadata (login/register)
export function getAuthMetadata(type: "login" | "register"): Metadata {
  const titles = {
    login: "Sign In",
    register: "Create Account",
  };
  const descriptions = {
    login: `Sign in to your ${siteConfig.name} account to access your orders, saved items, and more.`,
    register: `Create a ${siteConfig.name} account to save your favorites, track orders, and checkout faster.`,
  };
  return {
    title: titles[type],
    description: descriptions[type],
    robots: {
      index: false,
      follow: false,
    },
  };
}

// JSON-LD for Organization
export function getOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: "English",
    },
  };
}

// JSON-LD for WebSite (with SearchAction)
export function getWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/products?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

// JSON-LD for Product
export function getProductJsonLd(product: {
  name: string;
  slug: string;
  description?: string | null;
  price: string;
  comparePrice?: string | null;
  sku: string;
  stock: number;
  images?: { url: string; alt?: string | null }[];
  category?: { name: string };
}) {
  const availability =
    product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || "",
    sku: product.sku,
    image: product.images?.map((img) => img.url) || [],
    category: product.category?.name,
    url: `${siteConfig.url}/products/${product.slug}`,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "USD",
      availability,
      url: `${siteConfig.url}/products/${product.slug}`,
      seller: {
        "@type": "Organization",
        name: siteConfig.name,
      },
    },
  };
}

// JSON-LD for Product Reviews (AggregateRating + individual reviews)
export function getReviewsJsonLd(
  product: { name: string; slug: string },
  reviews: { rating: number; comment: string | null; authorName: string; createdAt: string }[],
  averageRating: number,
  reviewCount: number
) {
  if (reviewCount === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    url: `${siteConfig.url}/products/${product.slug}`,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: averageRating.toFixed(1),
      reviewCount,
      bestRating: 5,
      worstRating: 1,
    },
    review: reviews.slice(0, 10).map((r) => ({
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.rating,
        bestRating: 5,
        worstRating: 1,
      },
      author: {
        "@type": "Person",
        name: r.authorName,
      },
      ...(r.comment && { reviewBody: r.comment }),
      datePublished: new Date(r.createdAt).toISOString().split("T")[0],
    })),
  };
}

// JSON-LD for BreadcrumbList
export function getBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
