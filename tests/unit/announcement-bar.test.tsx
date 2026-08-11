import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { SiteAnnouncement } from "@/content/site";

const mockSite = {
  announcement: null as SiteAnnouncement | null,
  announcementDismiss: "Приховати оголошення",
};
vi.mock("@/content/site", () => ({
  get site() {
    return mockSite;
  },
}));

import { AnnouncementBar } from "@/components/common/AnnouncementBar";

const LAUNCH: SiteAnnouncement = {
  id: "launch-2026-08",
  text: "Ми відкрилися! Розкажіть нам про проблеми",
  href: "/feedback",
  marquee: true,
};

beforeEach(() => {
  window.localStorage.clear();
  mockSite.announcement = { ...LAUNCH };
});

afterEach(() => {
  window.localStorage.clear();
});

describe("AnnouncementBar", () => {
  it("renders nothing when no announcement is configured", () => {
    mockSite.announcement = null;
    const { container } = render(<AnnouncementBar />);
    expect(container).toBeEmptyDOMElement();
  });

  it("links the announcement text to its href", () => {
    render(<AnnouncementBar />);
    expect(screen.getByRole("link", { name: LAUNCH.text })).toHaveAttribute("href", "/feedback");
  });

  it("renders an aria-hidden, link-free duplicate for the marquee loop", () => {
    const { container } = render(<AnnouncementBar />);
    expect(container.querySelector(".animate-marquee")).not.toBeNull();
    const dupe = container.querySelector(".marquee-duplicate");
    expect(dupe).not.toBeNull();
    expect(dupe!.getAttribute("aria-hidden")).toBe("true");
    // The copy is visual-only: a second link would add a hidden tab stop.
    expect(dupe!.querySelector("a")).toBeNull();
  });

  it("renders the static centered variant without a duplicate when marquee is off", () => {
    mockSite.announcement = { ...LAUNCH, marquee: false };
    const { container } = render(<AnnouncementBar />);
    expect(container.querySelector(".animate-marquee")).toBeNull();
    expect(container.querySelector(".marquee-duplicate")).toBeNull();
    expect(screen.getByText(LAUNCH.text)).toBeInTheDocument();
  });

  it("stays hidden when the id-scoped dismissal key is set", () => {
    // Non-vacuous only because AnnouncementBar reads the real snapshot
    // (useSyncExternalStore's getSnapshot) on this very first render pass
    // under RTL's non-hydrating render().
    window.localStorage.setItem("mirox:announcement-dismissed:launch-2026-08", "1");
    const { container } = render(<AnnouncementBar />);
    expect(container).toBeEmptyDOMElement();
  });

  it("ignores a different announcement's dismissal (id scoping)", () => {
    window.localStorage.setItem("mirox:announcement-dismissed:old-promo", "1");
    render(<AnnouncementBar />);
    expect(screen.getByRole("link", { name: LAUNCH.text })).toBeInTheDocument();
  });

  it("dismisses via the UA-labelled control and persists under the id-scoped key", () => {
    render(<AnnouncementBar />);

    fireEvent.click(screen.getByRole("button", { name: "Приховати оголошення" }));

    expect(screen.queryByText(LAUNCH.text)).not.toBeInTheDocument();
    expect(window.localStorage.getItem("mirox:announcement-dismissed:launch-2026-08")).toBe("1");
  });
});
