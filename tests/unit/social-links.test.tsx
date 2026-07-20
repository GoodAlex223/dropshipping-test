import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

const mockSocials = [
  { platform: "instagram", label: "Instagram", href: "https://instagram.com/x", followers: null },
  { platform: "tiktok", label: "TikTok", href: "https://tiktok.com/@x", followers: 12500 },
  { platform: "telegram", label: "Telegram", href: "https://t.me/x", followers: 0 },
];
vi.mock("@/content/site", () => ({
  site: {
    get socials() {
      return mockSocials;
    },
  },
}));

import { SocialLinks } from "@/components/common/SocialLinks";

describe("SocialLinks", () => {
  it("renders a link per configured platform", () => {
    render(<SocialLinks />);
    expect(screen.getByRole("link", { name: /Instagram/ })).toHaveAttribute(
      "href",
      "https://instagram.com/x"
    );
    expect(screen.getByRole("link", { name: /TikTok/ })).toBeInTheDocument();
  });

  it("shows a counter only for platforms with a real follower count", () => {
    render(<SocialLinks />);
    // TikTok has 12500 and renders formatted; Instagram has null and renders none;
    // Telegram has 0 (a real value) and renders as "0".
    expect(screen.getByText("12.5K")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.queryByText("null")).not.toBeInTheDocument();
  });

  it("opens external profiles safely", () => {
    render(<SocialLinks />);
    const link = screen.getByRole("link", { name: /Instagram/ });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });
});

describe("formatFollowers boundary values", () => {
  const testCases = [
    { followers: 0, expected: "0" },
    { followers: 999, expected: "999" },
    { followers: 1000, expected: "1K" },
    { followers: 1500, expected: "1.5K" },
    { followers: 999_949, expected: "999.9K" },
    { followers: 999_950, expected: "1M" },
    { followers: 999_999, expected: "1M" },
    { followers: 1_000_000, expected: "1M" },
  ];

  testCases.forEach(({ followers, expected }) => {
    it(`formats ${followers.toLocaleString()} followers as "${expected}"`, () => {
      const originalSocials = mockSocials.slice();
      mockSocials.length = 0;
      mockSocials.push({
        platform: "instagram",
        label: "Instagram",
        href: "https://instagram.com/test",
        followers,
      });

      const { unmount } = render(<SocialLinks />);
      expect(screen.getByText(expected)).toBeInTheDocument();
      unmount();

      mockSocials.length = 0;
      mockSocials.push(...originalSocials);
    });
  });
});
