import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin(); // default path: ./src/i18n/request.ts

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone for Docker/Vercel deployment
  output: "standalone",
  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
  },
  // Performance optimizations
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
    // The PDP OG route reads public/images/og-logo-ghost.png via
    // fs.readFileSync at module scope (data-URI embedding for Satori), but
    // Vercel's function bundle doesn't trace public/ assets — prod 500'd with
    // ENOENT /var/task/public/images/og-logo-ghost.png. Force-include it for
    // the products subtree (route key is a glob; the OG route's generated
    // name carries a hash suffix, so match the whole subtree rather than a
    // brittle exact path).
    outputFileTracingIncludes: {
      "/products/**": ["./public/images/og-logo-ghost.png"],
    },
  },
  // Compression
  compress: true,
  // PoweredBy header removal for security
  poweredByHeader: false,
};

export default withNextIntl(nextConfig);
