# Mirox Shop — Homepage Polish & Art Direction (Design Spec)

**Date**: 2026-07-24
**Status**: Approved direction — pending implementation plan
**Author**: Claude Code session (brainstorming + frontend-design)
**Origin**: Post-completion visual audit of the deployed TASK-035 homepage against
`docs/reference/mirox-concept-screenshot.jpg` and `docs/reference/client-brief.md`. The user observed
the live result did not match the brief; the audit confirmed it and split the gap into content-blocked
vs. buildable-now findings. This spec covers **only the buildable-now craft work** the user selected
("Polish + placeholder art direction").

---

## 1. Context & problem

The deployed homepage (`dropshipping-test.vercel.app`) passes every automated gate yet reads as a
tokenised wireframe far from the brief's "luxury minimalism, $10k, not templated." The audit produced
nine findings; this spec addresses the four that are **buildable without client-supplied assets**,
plus two deliberate placeholder treatments so the page reads premium before those assets arrive.

**In scope (this spec):**

- **F2** — the whole page below the hero renders at `opacity:0` until scrolled, because every section
  is wrapped in `FadeIn`, whose `IntersectionObserver` never fires on load for the first below-hero
  section. Reads as a blank/broken page on first paint; hostile to crawlers, social previews, and LCP.
- **F4** — discount badge uses `Badge variant="destructive"` (saturated red), violating the brief's
  explicit _"никаких ярких цветов"_ (no bright colours) monochrome palette.
- **F7** — "Why choose us" is a bare two-column checklist; "Follow us" is plain text links. The brief
  asks for "beautiful modern blocks."
- **F8** — no soft shadows, no glassmorphism, no premium material language; only `hover:shadow-lg`.
- **Hero placeholder art direction** — the no-photo hero is flat black + centred text.
- **Image fallback** — missing/broken product images render as blank gray boxes.

**Explicitly out of scope (tracked elsewhere — do not attempt here):**

- Hero photography and a real Mirox clothing catalog with working images → **TASK-056** + the
  `[2026-07-24]` BACKLOG entry ("live catalog is the old electronics seed with dead image URLs").
- UAH price formatting (cards currently hard-code USD) → **TASK-039** / the `[2026-07-21]` BACKLOG entry.
- Rich ProductCard interactions — second-image-on-hover, quick-view, quick-buy, colour swatches →
  **TASK-036** acceptance criteria.

This work builds **on** the TASK-034 token system; it introduces no parallel design system.

---

## 2. Design language

### 2.1 Reused from TASK-034 (unchanged)

Monochrome palette via semantic tokens (`--background/foreground/muted/muted-foreground/primary/
border/card`), `data-surface="dark"` section inversion, Manrope (`font-heading`) + Inter (body) with
`cyrillic-ext`, the radius scale (`--radius-sm … --radius-4xl`, storefront base `0.25rem`), and the
motion tokens `--ease-mirox` (`cubic-bezier(0.16, 1, 0.3, 1)`), `--duration-fast/base/slow`. The brief
_names_ the near-black monochrome look, so it is followed exactly; distinctiveness comes from
execution, never from an accent hue.

### 2.2 New additions (must be registered, not just defined)

Two tokens/utilities are added. **Both must be registered in the compiled design layer**, not merely
declared — an unregistered custom property yields a silent no-op class that typecheck/lint/tests cannot
see (prior lesson: "a CSS token must be registered in `@theme`"). Verify against compiled CSS, and
confirm they invert correctly under `[data-surface="dark"]`.

- **`--shadow-soft`** — a single monochrome soft shadow (e.g. layered low-opacity black), the premium
  "плавные тени" the brief asks for. Replaces ad-hoc inline `box-shadow` in `.hover-lift` usage where
  appropriate; exposed as a utility.
- **Moderate glass utility** — `backdrop-blur` + a translucent hairline border + faint translucent
  fill, applied **sparingly** (header, card hover, social tiles). "Glassmorphism (умеренно)" — moderate
  is a requirement, not a hedge; do not glass every surface.

### 2.3 Signature motif — the Mirox "M"

The brief: _"use the Mirox logo as the basis of the brand identity."_ The single memorable element is
the **M monogram** (already in `src/components/common/Logo.tsx`), used in monochrome three ways:

1. an oversized, very-low-contrast ghosted mark bleeding off one edge of the hero (texture, not
   decoration);
2. the branded fallback for any missing/broken product image (§4.6);
3. optionally, a quiet section marker.

**One** motion signature accompanies it: a restrained staggered reveal of the STYLE / QUALITY /
CONFIDENCE lockup on load. Boldness is spent here; everything else stays quiet (Chanel rule — one
accessory removed).

---

## 3. Motion architecture (F2) — invariants, not implementation

The current `FadeIn` initialises `inView = false` → renders `opacity-0 translate-y-4`, and only reveals
when an `IntersectionObserver` (`threshold: 0.1`) fires. On a tall page the first below-hero rail
(~700px, top ~855px in a 900px viewport) never crosses the 10% threshold on load, so it stays invisible
until the user scrolls. The fix is a **philosophy flip: content is visible by default; motion only
adds an entrance.** The exact refactor belongs in the implementation plan; this spec fixes the
**invariants** any implementation must satisfy:

- **I1 — No-JS / pre-hydration safe.** The server-rendered HTML contains no `opacity:0` content. With
  JavaScript disabled or before hydration, the full page is visible.
- **I2 — Nothing stuck hidden.** After load, any element within the initial viewport is visible
  immediately, with no scroll required. No element is ever left at `opacity:0` waiting on an observer
  that did not fire.
- **I3 — Reduced motion.** `prefers-reduced-motion: reduce` disables transforms/animation entirely;
  content is fully visible (already honoured by `.animate-fade-up` / `.hover-lift`; preserve it).
- **I4 — Reveal, not gate.** On-load / near-fold sections use a CSS-driven entrance (runs on paint, no
  observer); genuinely below-fold sections may scroll-reveal, but degrade to visible per I1/I2 and
  reveal slightly _before_ entering view (via `rootMargin`) so no blank gap appears mid-scroll.
- **I5 — Hydration signal preserved.** The `[data-testid='product-card']` readiness signal the E2E
  suite depends on (`tests/e2e/products.spec.ts`) must remain valid. Making cards visible-by-default
  _reduces_ the WebKit pre-hydration `fill()` race (documented in TASK-038a) rather than reintroducing
  it; do not remove the testid.

---

## 4. Per-section specification

### 4.1 Hero (`src/components/home/Hero.tsx`) — `!hasImage` branch

Keep the two-layout structure (the `hasImage` two-column branch is untouched, ready for TASK-056
photography). Upgrade the `!hasImage` branch from flat black to deliberate art direction on the existing
`data-surface="dark"` section:

- Layered background: near-black → `#1A1A1A` gradient with subtle grain (CSS, no external asset).
- The ghosted oversized M watermark (§2.3), bleeding off one edge, very low contrast, `aria-hidden`.
- STYLE / QUALITY / CONFIDENCE lockup with the staggered on-load reveal (§2.3), refined tracking.
- Subtitle, primary + secondary CTAs, and the existing `BenefitStrip` — unchanged in content.

### 4.2 Discount badge (`src/components/products/ProductCard.tsx`)

Replace `Badge variant="destructive"` (line ~73) with a monochrome pill: `bg-foreground text-background`,
`text-xs`, uppercase, tight tracking, e.g. `-20%`. Must invert correctly on dark surfaces. Out-of-stock
badge stays neutral (`secondary`). No colour is introduced.

### 4.3 "Why choose us" (`src/components/home/WhyChooseUs.tsx`)

Re-conceive as a **dark "by the numbers" block** (`data-surface="dark"`):

- The three _real_ claims from `site.claims` (300+ OLX sales, 100+ Instagram orders, customer rating)
  as large typographic stats — big-number treatment is earned here because the data is real proof.
  **Gated exactly as today**: each stat renders only if its `site.claims` figure is configured (no
  fabricated numbers). If none are configured, the block degrades to the supporting grid alone.
- The 7 brand-voice items (`home.whyChooseUs.items`) become a quieter supporting grid beneath, with
  hairline dividers and generous spacing.

### 4.4 "Follow us" (homepage social section in `src/app/(shop)/page.tsx`)

Elevate from inline text links to a proper social block: larger icon tiles with restrained glass hover
(§2.2). Differentiate visually from the footer's inline `SocialLinks` so the same handles don't read as
an accidental double-render (addresses the existing `[2026-07-21]` BACKLOG note). Copy unchanged.

### 4.5 Material language (F8)

Apply `--shadow-soft` and `hover-lift` to product cards; apply moderate glass to header, card hover, and
social tiles only. Radius from existing tokens. Restraint is the requirement.

### 4.6 Product-image fallback (`src/components/products/ProductCard.tsx`)

When `images[0]` is absent **or** the image fails to load, render the branded M-mark placeholder on
`--muted` (subtle texture) instead of blank gray or the generic `Package` icon. A 404 on a present URL
currently yields blank, so this needs a client-side `onError` path. **`ProductCard` is currently a
server component; keep it that way** — implement the fallback as a small `"use client"` image
sub-component (image + `onError` → placeholder) that the server `ProductCard` renders, rather than
converting the whole card to a client component. This makes the (data-level, backlogged) broken images
look deliberate; it does **not** fix the underlying dead URLs (TASK-056).

---

## 5. Acceptance criteria

- [ ] **Visual-fidelity gate (self-referential improvement):** the deployed/preview homepage is
      screenshotted section-by-section at desktop + mobile and compared to
      `mirox-concept-screenshot.jpg`; a human signs off on the comparison. This gate is the direct
      remedy for the audit's Q3 root cause and is a required, non-automated step.
- [ ] **F2/I1–I5:** with JS disabled, the full page is visible; on load with JS, no section is stuck at
      `opacity:0`; the first below-hero section is visible without scrolling; reduced-motion shows
      everything with no animation; `[data-testid='product-card']` still gates the E2E suite.
- [ ] **F4:** no `destructive`/red anywhere on the homepage; discount badge is monochrome and legible on
      both light and dark surfaces.
- [ ] **F7:** "Why choose us" renders the real gated stats + supporting grid; "Follow us" renders tiled
      social with glass hover, visually distinct from the footer.
- [ ] **F8:** soft-shadow token and glass utility are **registered** (verified against compiled CSS) and
      invert under `[data-surface="dark"]`; applied with restraint.
- [ ] **Hero:** `!hasImage` branch is art-directed (gradient + grain + ghosted M + kinetic headline);
      the `hasImage` branch is unchanged and still correct.
- [ ] **Image fallback:** a broken/missing image renders the branded M placeholder, not blank gray.
- [ ] **Quality floor:** responsive to mobile, visible keyboard focus, reduced motion respected, no
      new colour introduced. `npm run lint`, `typecheck`, `test:run`, `build` all pass.

---

## 6. Testing

- Unit: badge renders monochrome (no `destructive` class); image fallback renders the M placeholder on
  `onError`; `WhyChooseUs` renders/omits each stat per `site.claims` configuration (assert both
  branches, non-vacuously — prior lesson: guards need teeth).
- E2E: preserve the `products.spec.ts` `[data-testid='product-card']` wait; add an assertion that a
  below-hero section is visible on load without scrolling (guards against F2 regressing). Run WebKit +
  chromium (WebKit catches the pre-hydration class the audit is adjacent to).
- Manual/visual: the §5 screenshot-vs-concept comparison.

---

## 7. Risk

A **purely achromatic** page — zero accent hue — carries all hierarchy on value, type scale, space, and
the M motif. Harder than a safe accent, and exactly what the brief demands. If any section reads flat,
the remedy is more contrast/space/type, **never** a colour.
