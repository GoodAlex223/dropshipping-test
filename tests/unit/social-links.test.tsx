import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

const mockSocials = [
  { platform: "instagram", label: "Instagram", href: "https://instagram.com/x", followers: null },
  { platform: "tiktok", label: "TikTok", href: "https://tiktok.com/@x", followers: 12500 },
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
    // TikTok has 12500 and renders formatted; Instagram has null and renders none.
    expect(screen.getByText("12.5K")).toBeInTheDocument();
    expect(screen.queryByText("null")).not.toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("opens external profiles safely", () => {
    render(<SocialLinks />);
    const link = screen.getByRole("link", { name: /Instagram/ });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });
});
