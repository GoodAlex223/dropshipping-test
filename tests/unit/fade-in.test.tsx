import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FadeIn } from "@/components/common/FadeIn";

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe("FadeIn", () => {
  it("renders children visible and constructs no observer under reduced motion", () => {
    const ctor = vi.fn();
    // @ts-expect-error jsdom lacks IntersectionObserver
    global.IntersectionObserver = class {
      constructor() {
        ctor();
      }
      observe() {}
      disconnect() {}
    };
    mockMatchMedia(true);

    render(<FadeIn>Hello</FadeIn>);

    const el = screen.getByText("Hello");
    expect(el).toBeInTheDocument();
    expect(el).toHaveClass("opacity-100");
    expect(ctor).not.toHaveBeenCalled();
  });

  it("reveals children when scrolled into view", () => {
    let cb: IntersectionObserverCallback | undefined;
    // @ts-expect-error jsdom lacks IntersectionObserver
    global.IntersectionObserver = class {
      constructor(c: IntersectionObserverCallback) {
        cb = c;
      }
      observe() {
        cb?.(
          [{ isIntersecting: true } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver
        );
      }
      disconnect() {}
    };
    mockMatchMedia(false);

    render(<FadeIn>World</FadeIn>);

    expect(screen.getByText("World")).toHaveClass("opacity-100");
  });
});
