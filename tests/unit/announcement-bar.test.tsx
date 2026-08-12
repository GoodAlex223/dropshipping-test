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
  linkLabel: "Розкажіть нам →",
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

  it("renders the text plain and the label as the link when linkLabel is set", () => {
    render(<AnnouncementBar />);
    const link = screen.getByRole("link", { name: "Розкажіть нам →" });
    expect(link).toHaveAttribute("href", "/feedback");
    // The announcement text itself is NOT inside the link (the link's own
    // content is only the label — text and link are rendered as siblings
    // under a shared wrapper, not text-inside-anchor).
    expect(link.textContent).not.toContain(LAUNCH.text);
  });

  it("falls back to linking the whole text when linkLabel is null", () => {
    mockSite.announcement = { ...LAUNCH, linkLabel: null };
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
    expect(dupe!.textContent).toContain("Розкажіть нам →");
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
    // The link's accessible name is the linkLabel (not the full text) now
    // that LAUNCH carries a linkLabel — see the "renders the text plain..."
    // case above for that split.
    expect(screen.getByRole("link", { name: LAUNCH.linkLabel! })).toBeInTheDocument();
  });

  it("dismisses via the UA-labelled control and persists under the id-scoped key", () => {
    render(<AnnouncementBar />);

    fireEvent.click(screen.getByRole("button", { name: "Приховати оголошення" }));

    expect(screen.queryByText(LAUNCH.text)).not.toBeInTheDocument();
    expect(window.localStorage.getItem("mirox:announcement-dismissed:launch-2026-08")).toBe("1");
  });
});
