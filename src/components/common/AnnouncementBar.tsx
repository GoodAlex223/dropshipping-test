"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { site } from "@/content/site";

// Dismissal is id-scoped (G8): a new announcement (new id) resurfaces for
// users who dismissed a previous one. Computed per call, not module scope —
// the content module is mocked per-test, and a module-scope key would freeze
// the first mock's id.
function dismissedKey(): string {
  return `mirox:announcement-dismissed:${site.announcement?.id ?? ""}`;
}

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
    if (event.key === dismissedKey()) onChange();
  }
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function getDismissedSnapshot(): boolean {
  return window.localStorage.getItem(dismissedKey()) === "1";
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
  window.localStorage.setItem(dismissedKey(), "1");
  listeners.forEach((listener) => listener());
}

/**
 * Top announcement bar (client brief list #2 item 13).
 *
 * Sticky WITH the header since the 2026-08-12 gate ruling: the shop layout
 * wraps this bar and the Header in one `sticky top-0 z-50` container, so the
 * launch announcement stays visible on scroll (mobile viewport cost accepted
 * by the user, superseding the TASK-035-era not-sticky decision). Cookie
 * consent is bottom-anchored, so the two never stack.
 *
 * The admin-managed version of this banner is TASK-047.
 */
export function AnnouncementBar() {
  const dismissed = useSyncExternalStore(
    subscribeDismissed,
    getDismissedSnapshot,
    getDismissedServerSnapshot
  );

  const announcement = site.announcement;
  if (!announcement || dismissed) return null;

  const label = announcement.linkLabel;
  const linkClass = "font-medium underline underline-offset-4 hover:no-underline";
  const content =
    announcement.href && label ? (
      <>
        {announcement.text}{" "}
        <Link href={announcement.href} className={linkClass}>
          {label}
        </Link>
      </>
    ) : announcement.href ? (
      <Link href={announcement.href} className="underline-offset-4 hover:underline">
        {announcement.text}
      </Link>
    ) : (
      announcement.text
    );

  return (
    <div className="bg-background text-foreground">
      <div className="flex w-full items-center gap-3 py-2 pr-3">
        {announcement.marquee ? (
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="animate-marquee">
              <span className="pr-12 text-xs tracking-wide">{content}</span>
              {/* Visual-only copy for the seamless loop: aria-hidden and
                  link-free so it adds no tab stop or duplicate accname. */}
              <span className="marquee-duplicate pr-12 text-xs tracking-wide" aria-hidden="true">
                {announcement.text}
                {label ? <span className={`ml-1 ${linkClass}`}>{label}</span> : null}
              </span>
            </div>
          </div>
        ) : (
          <p className="flex-1 text-center text-xs tracking-wide">{content}</p>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label={site.announcementDismiss}
          className="text-muted-foreground hover:text-foreground -m-2 p-2 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
