import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockSite = { announcement: "Free delivery on orders over 1000 UAH" as string | null };
vi.mock("@/content/site", () => ({
  get site() {
    return mockSite;
  },
}));

import { AnnouncementBar } from "@/components/common/AnnouncementBar";

beforeEach(() => {
  window.localStorage.clear();
  mockSite.announcement = "Free delivery on orders over 1000 UAH";
});

afterEach(() => {
  window.localStorage.clear();
});

describe("AnnouncementBar", () => {
  it("renders the configured announcement", () => {
    render(<AnnouncementBar />);
    expect(screen.getByText("Free delivery on orders over 1000 UAH")).toBeInTheDocument();
  });

  it("renders nothing when no announcement is configured", () => {
    mockSite.announcement = null;
    const { container } = render(<AnnouncementBar />);
    expect(container).toBeEmptyDOMElement();
  });

  it("stays hidden once dismissed", () => {
    window.localStorage.setItem("mirox:announcement-dismissed", "1");
    const { container } = render(<AnnouncementBar />);
    expect(container).toBeEmptyDOMElement();
  });

  it("exposes an accessible dismiss control", () => {
    render(<AnnouncementBar />);
    expect(screen.getByRole("button", { name: /dismiss/i })).toBeInTheDocument();
  });
});
