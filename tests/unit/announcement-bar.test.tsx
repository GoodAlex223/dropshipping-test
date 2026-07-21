import { render, screen, fireEvent } from "@testing-library/react";
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
    // Non-vacuous only because AnnouncementBar now reads the real snapshot
    // (useSyncExternalStore's getSnapshot, not a hardcoded initial state) on
    // this very first render pass under RTL's non-hydrating render() — see
    // the "proves the localStorage read is live" test below, which breaks
    // this exact read and confirms this assertion actually fails.
    window.localStorage.setItem("mirox:announcement-dismissed", "1");
    const { container } = render(<AnnouncementBar />);
    expect(container).toBeEmptyDOMElement();
  });

  it("exposes an accessible dismiss control", () => {
    render(<AnnouncementBar />);
    expect(screen.getByRole("button", { name: /dismiss/i })).toBeInTheDocument();
  });

  it("dismisses on click and persists the choice to localStorage", () => {
    render(<AnnouncementBar />);

    fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));

    expect(screen.queryByRole("button", { name: /dismiss/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Free delivery on orders over 1000 UAH")).not.toBeInTheDocument();
    expect(window.localStorage.getItem("mirox:announcement-dismissed")).toBe("1");
  });
});
