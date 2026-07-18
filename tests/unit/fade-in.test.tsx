import { render, screen, act } from "@testing-library/react";
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
      // Deliberately does NOT fire the callback here (unlike the previous
      // version of this test, which fired synchronously inside observe() and
      // made it impossible to ever assert the pre-intersection state).
      observe() {}
      disconnect() {}
    };
    mockMatchMedia(false);

    render(<FadeIn>World</FadeIn>);
    const el = screen.getByText("World");

    // Pre-intersection: still hidden. A FadeIn gutted to always render
    // opacity-100 would fail this half of the test.
    expect(el).toHaveClass("opacity-0");
    expect(el).toHaveClass("translate-y-4");
    expect(el).not.toHaveClass("opacity-100");

    act(() => {
      cb?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    });

    // Post-intersection: revealed.
    expect(el).toHaveClass("opacity-100");
    expect(el).toHaveClass("translate-y-0");
  });
});
