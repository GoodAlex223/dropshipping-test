"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ElementType,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

// Hydration-safe reduced-motion read (same useSyncExternalStore idiom as
// useIsMounted in src/app/showcase/layout.tsx): getServerSnapshot returns
// false so the client's first render matches the server-rendered HTML,
// then useSyncExternalStore reconciles to the real value post-mount and
// keeps it live if the OS preference changes while mounted.
function subscribeReducedMotion(onChange: () => void) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }
  const mql = window.matchMedia(REDUCED_MOTION_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getReducedMotionSnapshot(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia(REDUCED_MOTION_QUERY).matches
  );
}

function getReducedMotionServerSnapshot(): boolean {
  return false;
}

interface FadeInProps {
  children: ReactNode;
  className?: string;
  /** Extra delay before the reveal transition, in ms. */
  delay?: number;
  /** Element/tag to render as. Defaults to "div". */
  as?: ElementType;
}

export function FadeIn({ children, className, delay = 0, as: Component = "div" }: FadeInProps) {
  const ref = useRef<HTMLElement | null>(null);
  const prefersReduced = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );
  const [inView, setInView] = useState(false);

  useEffect(() => {
    // Reduced motion is derived straight from prefersReduced below, so there's
    // nothing to observe: bail out without creating an IntersectionObserver.
    if (prefersReduced || typeof IntersectionObserver === "undefined") return;

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [prefersReduced]);

  const visible = prefersReduced || inView;

  return (
    <Component
      ref={ref}
      className={cn(
        "transition-all duration-[var(--duration-slow)] ease-[var(--ease-mirox)] motion-reduce:opacity-100 motion-reduce:transition-none",
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        className
      )}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Component>
  );
}
