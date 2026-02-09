import { NextRequest } from "next/server";

/**
 * Create a NextRequest for testing API route handlers.
 */
export function createNextRequest(options: {
  url: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: Record<string, unknown>;
  searchParams?: Record<string, string>;
}): NextRequest {
  const { url, method = "GET", body, searchParams } = options;

  const fullUrl = new URL(url, "http://localhost:3000");
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      fullUrl.searchParams.set(key, value);
    });
  }

  return new NextRequest(fullUrl, {
    method,
    ...(body && {
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    }),
  });
}

/**
 * Create route params for Next.js 14 dynamic segments.
 * Next.js 14 passes params as Promise<{ id: string }>.
 */
export function createRouteParams<T extends Record<string, string>>(
  params: T
): { params: Promise<T> } {
  return { params: Promise.resolve(params) };
}
