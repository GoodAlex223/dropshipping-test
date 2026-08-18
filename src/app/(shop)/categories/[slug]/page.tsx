import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// G12: /categories/<slug> is a thin 307 to the catalog — the category page
// is retired in favor of the FilterBar category facet (2026-08-18 spec).
// Deliberately unvalidated: unknown slugs land on the catalog's empty
// state. 307 (not 308) keeps the URLs reclaimable for future landing pages.
export default async function CategoryRedirectPage({ params }: PageProps) {
  const { slug } = await params;
  redirect(`/products?category=${encodeURIComponent(slug)}`);
}
