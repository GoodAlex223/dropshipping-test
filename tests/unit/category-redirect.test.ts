import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

import { redirect } from "next/navigation";
import CategoryRedirectPage from "@/app/(shop)/categories/[slug]/page";

const redirectMock = redirect as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("/categories/[slug] thin 307 redirect (G12)", () => {
  it("redirects to the catalog with the category param", async () => {
    await CategoryRedirectPage({ params: Promise.resolve({ slug: "hudi" }) });
    expect(redirectMock).toHaveBeenCalledWith("/products?category=hudi");
  });

  it("URI-encodes the slug", async () => {
    await CategoryRedirectPage({ params: Promise.resolve({ slug: "a b&c" }) });
    expect(redirectMock).toHaveBeenCalledWith("/products?category=a%20b%26c");
  });
});
