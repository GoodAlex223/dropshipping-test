import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";
import { siteConfig } from "@/lib/seo";

export const alt = "Product";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    select: {
      name: true,
      price: true,
      images: {
        select: { url: true },
        orderBy: { position: "asc" as const },
        take: 1,
      },
    },
  });

  if (!product) {
    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          color: "white",
          fontSize: 48,
          fontWeight: 700,
        }}
      >
        {siteConfig.name}
      </div>,
      { ...size }
    );
  }

  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(product.price));

  const imageUrl = product.images[0]?.url;
  const displayName = product.name.length > 80 ? product.name.slice(0, 77) + "..." : product.name;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
        padding: 60,
      }}
    >
      {/* Product image */}
      {imageUrl ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 420,
            height: 510,
            background: "white",
            borderRadius: 16,
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          <img
            src={imageUrl}
            alt={product.name}
            width={380}
            height={380}
            style={{ objectFit: "contain" }}
          />
        </div>
      ) : null}

      {/* Text content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          marginLeft: imageUrl ? 60 : 0,
          flex: 1,
        }}
      >
        <div style={{ fontSize: 28, color: "#94a3b8", fontWeight: 600 }}>{siteConfig.name}</div>

        <div
          style={{
            fontSize: 48,
            color: "white",
            fontWeight: 700,
            lineHeight: 1.2,
            marginTop: 20,
            overflow: "hidden",
          }}
        >
          {displayName}
        </div>

        <div
          style={{
            fontSize: 64,
            color: "#22c55e",
            fontWeight: 800,
            marginTop: 24,
          }}
        >
          {formattedPrice}
        </div>
      </div>
    </div>,
    { ...size }
  );
}
