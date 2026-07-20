"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { site } from "@/content/site";

const DISMISSED_KEY = "mirox:announcement-dismissed";

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
  // Start hidden and reveal after mount: reading localStorage during render
  // would desync server and client HTML and trip a hydration mismatch.
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // One-shot mount read, same pattern (and same rule exception) as the
    // `setMounted(true)` calls in CookieConsent.tsx / CartDrawer.tsx / cart
    // page.tsx: nothing external mutates this value while the component is
    // mounted, so there's no subscription to set up — just a single
    // post-hydration read.
    setDismissed(window.localStorage.getItem(DISMISSED_KEY) === "1"); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  if (!site.announcement || dismissed) return null;

  function dismiss() {
    window.localStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  }

  return (
    <div data-surface="dark" className="bg-background text-foreground">
      <div className="container flex items-center justify-center gap-4 py-2">
        <p className="text-center text-xs tracking-wide">{site.announcement}</p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss announcement"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
