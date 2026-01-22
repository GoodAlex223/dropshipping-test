import type { Metadata } from "next";
import { getProductsListingMetadata } from "@/lib/seo";
import ProductsContent from "./products-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = getProductsListingMetadata();

export default function ProductsPage() {
  return <ProductsContent />;
}
