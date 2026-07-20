"use client";

import { useSyncExternalStore } from "react";
import { X } from "lucide-react";
import { site } from "@/content/site";

const DISMISSED_KEY = "mirox:announcement-dismissed";

// `dismissed` is external mutable state: it lives in localStorage, which can
// change from the dismiss button below, from devtools, or from another tab —
// so it's read via useSyncExternalStore instead of mirrored into local state
// with `useEffect` + `setState`. (This file used to do the latter, justified
// by a comment claiming "nothing external mutates this value while the
// component is mounted" — that's false for a localStorage-backed flag, which
// is exactly why it's wired up properly here. Same idiom as FadeIn.tsx's
// `matchMedia` subscription.)
//
// `listeners` is module-scoped rather than component-scoped because
// AnnouncementBar mounts exactly once, in the shop layout
// (src/app/(shop)/layout.tsx) — there's one logical subscriber, and keeping
// the pub/sub set at module scope means `dismiss()` can notify it without a
// ref back to "the" mounted instance. A Set (not a single slot) still
// degrades correctly if that assumption ever changes — e.g. Fast Refresh's
// double-mount, or a second placement of the bar — since each mount adds and
// removes only its own listener.
const listeners = new Set<() => void>();

function subscribeDismissed(onChange: () => void) {
  listeners.add(onChange);

  // The native `storage` event fires in every OTHER tab/window when
  // localStorage changes, but never in the tab that made the write — so this
  // covers cross-tab propagation, while `dismiss()` below covers the
  // same-tab case the browser deliberately won't. It's one listener for the
  // lifetime of the one mount, so adding it costs nothing worth skipping.
  function onStorage(event: StorageEvent) {
    if (event.key === DISMISSED_KEY) onChange();
  }
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function getDismissedSnapshot(): boolean {
  return window.localStorage.getItem(DISMISSED_KEY) === "1";
}

function getDismissedServerSnapshot(): boolean {
  // Stay hidden during SSR/first paint: reading localStorage during render
  // would desync server and client HTML and trip a hydration mismatch. The
  // real value resolves once useSyncExternalStore reconciles post-hydration,
  // which pops the bar in and nudges content down — a small accepted CLS
  // cost shared with CookieConsent/CartDrawer's post-mount reveal, inherent
  // to SSR + localStorage-gated UI. Not "fixed" with a blocking inline
  // script — this codebase deliberately moved away from that class of trick
  // when it dropped next-themes (TASK-034).
  return true;
}

function dismiss() {
  window.localStorage.setItem(DISMISSED_KEY, "1");
  listeners.forEach((listener) => listener());
}

/**
 * Top announcement bar (client brief list #2 item 13).
 *
 * Deliberately NOT sticky: the header below it is `sticky top-0`, so leaving
 * this unpinned lets it scroll away instead of permanently eating viewport on
 * mobile. Cookie consent is bottom-anchored, so the two never stack.
 *
 * The admin-managed version of this banner is TASK-047.
 */
export function AnnouncementBar() {
  const dismissed = useSyncExternalStore(
    subscribeDismissed,
    getDismissedSnapshot,
    getDismissedServerSnapshot
  );

  if (!site.announcement || dismissed) return null;

  return (
    <div data-surface="dark" className="bg-background text-foreground">
      <div className="container flex items-center justify-center gap-4 py-2">
        <p className="text-center text-xs tracking-wide">{site.announcement}</p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss announcement"
          className="text-muted-foreground hover:text-foreground -m-2 p-2 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
