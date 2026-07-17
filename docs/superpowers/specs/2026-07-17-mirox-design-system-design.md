# TASK-034 — Mirox Design System & Rebrand Foundation

**Status**: Design approved · ready for implementation plan
**Date**: 2026-07-17
**Task**: [TASK-034] Design system & rebrand foundation (v1.3, Priority High, Effort XL)
**Depends on**: TASK-033 (post-freeze resumption, merged)
**Program**: Mirox Shop rebrand → Ukraine launch — see `docs/superpowers/specs/2026-07-14-mirox-shop-program-design.md`
**Branch**: `feat/task-034-design-system`

---

## 1. Purpose

Establish the visual foundation for the Mirox Shop rebrand: a **black/white luxury-minimal design system** expressed as design tokens, wired into the shared UI, and built so later design files re-skin **tokens, not components**. This task ships the foundation and the shared chrome; the page-level tasks (TASK-035 home, TASK-036 catalog, TASK-037 product) build on top of it.

### Success criteria (from TODO.md acceptance criteria)

- [ ] Design tokens defined and consumed by all shared components
- [ ] Header, footer, buttons, cards restyled to the concept's direction
- [ ] Animation primitives available as reusable utilities
- [ ] No bright colors anywhere in the customer-facing theme

---

## 2. Approved decisions

Five decisions were settled during brainstorming. They are binding for this task.

| #   | Decision         | Choice                                                                                                                                                                                                                   |
| --- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **Theme model**  | One fixed Mirox theme + **per-section inversion** via a `[data-surface="dark"]` token override. Drop the storefront theme switcher and global dark-mode. Showcase keeps its bold/luxury/organic themes in its own route. |
| 2   | **Color policy** | **Monochrome + red for errors/destructive only.** No other hue anywhere customer-facing.                                                                                                                                 |
| 3   | **Typeface**     | **Manrope** for headings + logo wordmark; **Inter** for body. Both cover Ukrainian Cyrillic incl. `ҐґІіЇїЄє` and the hryvnia sign `₴`.                                                                                   |
| 4   | **Logo**         | **Code-built** — inline SVG bag-with-`M` glyph + "Mirox Shop" wordmark in Manrope, token-driven (`currentColor`), with a drop-in slot for an official SVG later.                                                         |
| 5   | **Scope**        | **Foundation + shared chrome + unscheduled pages.** Defer home/catalog/PDP color to TASK-035/036/037 (they rebuild those pages); do not restyle admin layouts or showcase visuals.                                       |

---

## 3. Architecture — theme model

### 3.1 Token mechanism (section inversion)

Mirox is a single theme defined as CSS custom properties. The **white surface is the default** on `:root`; a `[data-surface="dark"]` wrapper overrides the **same** variables to their inverted values. Any token-driven component re-skins automatically based on which wrapper it sits inside — there is no per-component dark logic.

```css
:root {
  --background: #ffffff;
  --foreground: #1a1a1a;
  --primary: #000000;
  --card: #ffffff;
  --muted: #f5f5f5;
  /* …full set in §4… */
}

[data-surface="dark"] {
  --background: #000000;
  --foreground: #ffffff;
  --primary: #ffffff;
  --card: #1a1a1a;
  --muted: #1a1a1a;
  /* …full set in §4… */
}
```

TASK-034 ships the **mechanism** and tags the shared chrome (`Header`, `Footer` → dark). Which page sections invert is decided by the page-level tasks — matching the concept, where the hero and footer are black but the product panel is white.

**Deliberately separate from `.dark`:** section inversion uses `data-surface`, **not** the `.dark` class. "This section is black" is a layout decision, not "the user prefers dark mode." Keeping them separate prevents scattered `dark:` variants from tangling with surface inversion.

### 3.2 Removing `next-themes` from the storefront

**Problem found during design:** the showcase pages (`/showcase/bold`, `/luxury`, `/organic`) call next-themes' **global** `setTheme()`, which writes `localStorage` and applies a class to `<html>`. Because next-themes persists and re-applies on every route, visiting a showcase page and navigating back would leave the **storefront** under the `bold` theme. A "fixed Mirox theme" cannot allow that contamination path.

**Resolution:**

- **Remove `next-themes` as the storefront's theming layer.** Mirox tokens live on `:root` with no class required, so the storefront is _always_ Mirox and `localStorage` cannot contaminate it.
- **Delete** the storefront `ThemeSwitcher` (blue/amber/green header swatches) and the `src/components/theme/` directory; remove its `Header` import.
- **Decouple showcase** (~15 mechanical lines): `src/app/showcase/layout.tsx` applies `bold`/`luxury`/`organic` as a **local wrapper class** on its own subtree instead of a global `<html>` switch. Showcase's visual themes are otherwise untouched. This is the only edit to showcase and is _required_ so it cannot leak into the store.
- **`ui/sonner.tsx`** currently reads `useTheme()`; it is already token-driven, so it is pinned to a fixed theme and inherits Mirox.
- **`providers.tsx`** drops `ThemeProvider`.

**Rejected fallback:** keep `ThemeProvider` and force the `(shop)` layout to Mirox on every route while hiding the switcher. It works but fights the library and leaves the contamination path one bug away. Clean removal chosen.

**Files touched (§3):** `globals.css`, `providers.tsx`, `showcase/layout.tsx`, `ui/sonner.tsx`, delete `components/theme/*`, `Header.tsx` (remove import + usage).

---

## 4. Design tokens

### 4.1 Brand anchors + neutral ramp

The client brief specifies four colors. Four values cannot build a UI (borders, secondary text, disabled states need mid-greys), so the system is **four anchors + a small achromatic ramp** — every value chroma-zero, so the "no bright colors" rule holds.

| Ramp token     | Hex       | Role                                              |
| -------------- | --------- | ------------------------------------------------- |
| `neutral-0`    | `#FFFFFF` | white anchor                                      |
| `neutral-50`   | `#F5F5F5` | light-grey anchor — muted fills, skeleton         |
| `neutral-200`  | `#E5E5E5` | borders on white                                  |
| `neutral-500`  | `#666666` | secondary text on white                           |
| `neutral-800`  | `#262626` | borders on black                                  |
| `neutral-900`  | `#1A1A1A` | dark-grey anchor — body text, elevated dark cards |
| `neutral-1000` | `#000000` | black anchor — buttons, emphasis                  |

Intermediate greys (`neutral-400 #999999` disabled/placeholder, `dark` surface muted-fg `#A1A1A1`) are added as needed; all chroma-zero.

### 4.2 Semantic token mapping

The inversion is **not** a pure flip — two tokens need contrast-tuned values (marked ⚠) to meet WCAG AA on their surface.

| Token                      | `:root` (white) | `[data-surface="dark"]` (black)      |
| -------------------------- | --------------- | ------------------------------------ |
| `--background`             | `#FFFFFF`       | `#000000`                            |
| `--foreground`             | `#1A1A1A`       | `#FFFFFF`                            |
| `--primary`                | `#000000`       | `#FFFFFF`                            |
| `--primary-foreground`     | `#FFFFFF`       | `#000000`                            |
| `--secondary`              | `#F5F5F5`       | `#1A1A1A`                            |
| `--secondary-foreground`   | `#1A1A1A`       | `#FFFFFF`                            |
| `--muted`                  | `#F5F5F5`       | `#1A1A1A`                            |
| `--muted-foreground` ⚠     | `#666666`       | `#A1A1A1` (`#666` fails AA on black) |
| `--accent`                 | `#F5F5F5`       | `#1A1A1A`                            |
| `--accent-foreground`      | `#000000`       | `#FFFFFF`                            |
| `--card`                   | `#FFFFFF`       | `#1A1A1A`                            |
| `--card-foreground`        | `#1A1A1A`       | `#FFFFFF`                            |
| `--popover`                | `#FFFFFF`       | `#1A1A1A`                            |
| `--popover-foreground`     | `#1A1A1A`       | `#FFFFFF`                            |
| `--border`                 | `#E5E5E5`       | `#262626`                            |
| `--input`                  | `#E5E5E5`       | `#262626`                            |
| `--ring`                   | `#1A1A1A`       | `#FFFFFF`                            |
| `--destructive` ⚠          | `#B91C1C`       | `#F87171`                            |
| `--destructive-foreground` | `#FFFFFF`       | `#000000`                            |

**`--destructive` is the one surviving hue.** A single red cannot meet AA (≥4.5:1 for text) against both `#FFFFFF` and `#000000`, so it splits into two surface-tuned reds: a darker red on white, a lighter red on black. Representative values above; exact values finalized against a contrast check at implementation, holding the AA rule as the constraint. Red is reserved for genuine error/destructive states (form errors, payment declines, delete actions, `CANCELLED`/`FAILED`/`REFUNDED` order statuses) — never decoration.

### 4.3 Shape & motion tokens

| Token             | Value                           | Note                                                                                                                                      |
| ----------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--radius`        | `0.25rem`                       | Near-square, matching the concept's crisp buttons. The existing `calc(var(--radius) − …)` derivations land buttons at ~2px automatically. |
| `--ease-mirox`    | `cubic-bezier(0.16, 1, 0.3, 1)` | Refined ease-out for reveals/hovers.                                                                                                      |
| `--duration-fast` | `150ms`                         | hovers, small state changes                                                                                                               |
| `--duration-base` | `250ms`                         | default transitions                                                                                                                       |
| `--duration-slow` | `400ms`                         | reveals                                                                                                                                   |

### 4.4 Implementation note

Tokens live in `src/app/globals.css` under the existing Tailwind v4 `@theme` / `:root` structure. Values expressed as hex (chroma-zero anchors); the existing oklch tokens are replaced, not appended. Bright showcase-only tokens under `.bold`/`.luxury`/`.organic` remain untouched and scoped to the showcase route.

---

## 5. Typography & logo

### 5.1 Font wiring

- **Manrope** → `--font-heading` (weights 500 / 700 / 800). `h1–h6` already consume `--font-heading`; only the variable's value changes.
- **Inter** stays body (`--font-sans` / existing `--font-geist-sans`).
- **Both** loaded via `next/font/google` with `subsets: ["latin", "cyrillic", "cyrillic-ext"]`. `cyrillic-ext` is **required** — it is the only subset carrying `₴` (U+20B4). Inter currently ships `latin` only, so `₴` silently falls back today; this fixes it.
- **Playfair Display / Lora** stay as-is for the showcase route (already `preload: false`, ~0 cost on the storefront). Not loaded on customer pages.

### 5.2 Logo component

New `src/components/common/Logo.tsx`:

- Inline SVG **shopping-bag-with-`M`** glyph + "Mirox Shop" wordmark set in Manrope.
- All strokes/fills use `currentColor`, so the logo inverts with its surface automatically (white on the black header, black on white sections).
- Props: `{ size?: "sm" | "md" | "lg"; showText?: boolean }`.
- Replaces the literal `"Store"` text in `Header.tsx` (brand span, ~L296) and `Footer.tsx` (brand ~L32 + copyright ~L86).
- Structured so an official client SVG drops into the same component slot without call-site changes.

---

## 6. Animation primitives

All primitives are gated behind `@media (prefers-reduced-motion: reduce)` and **no-op** (render final/visible state) when reduced motion is requested.

1. **`<FadeIn>`** — `src/components/common/FadeIn.tsx`. IntersectionObserver scroll-reveal wrapper (the brief's "fade-in blocks"). Props `{ delay?, as? }`. Under reduced motion, renders children immediately visible (no observer, no transform).
2. **CSS utilities** in `globals.css`: `.animate-fade-up` (translateY + fade on enter), `.hover-lift` (card hover translate + token shadow), keyframes `@keyframes mirox-fade-up`. Driven by `--duration-*` / `--ease-mirox`.
3. **Skeleton loaders** — the existing `src/components/ui/skeleton.tsx` (+ `tw-animate-css`) is already token-driven (`bg-muted`); it re-skins for free. No new work beyond confirming it consumes the new `--muted`.
4. **Transitions** — buttons/cards keep `transition-*` with the new duration/ease tokens.

---

## 7. Shared component restyle

| Component                                                   | Change                                                                                                                 |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `common/Header.tsx`                                         | `data-surface="dark"` (black bar); `<Logo/>` replaces "Store"; drop `ThemeSwitcher` import + usage; nav/menu → tokens. |
| `common/Footer.tsx`                                         | `data-surface="dark"`; `<Logo/>`; replace `bg-muted/40`, literal "Store", copyright text → tokens.                     |
| `ui/button.tsx`                                             | Strip stray `dark:` variants; confirm token-only fills; near-square radius via `--radius`.                             |
| `ui/card.tsx`                                               | Already 100% token-driven → re-skins free; optionally add `.hover-lift`.                                               |
| `ui/badge.tsx`                                              | Variants → monochrome; destructive variant → red.                                                                      |
| overlays `ui/dialog.tsx` · `ui/sheet.tsx` · `ui/drawer.tsx` | Replace baked `bg-black/xx` scrims and any fixed hues → tokens.                                                        |
| `ui/slider.tsx`                                             | Track/range/thumb → tokens.                                                                                            |
| `ui/sonner.tsx`                                             | Pin fixed theme (see §3.2); confirm token colors.                                                                      |
| `reviews/StarRating`                                        | The 2-line reskin: yellow star fill → `foreground` (monochrome).                                                       |

`CartDrawer` re-skins automatically via tokens; its one hardcoded low-stock orange is **deferred to TASK-043** with the rest of the cart rebuild.

---

## 8. Shared order-status style module

`src/lib/order-status.ts` becomes the **single source** for status→style, currently duplicated ~4× across storefront order pages and admin. It encodes the color policy in one place:

- Statuses render as **monochrome** chips (grey, token-driven).
- Only `CANCELLED` / `FAILED` / `REFUNDED` use `--destructive` red.
- Exposes a typed map `status → { label, className }` consumed by both storefront and admin.

**Admin impact (accepted):** admin imports this module, so admin status badges go **monochrome**. This is treated as admin _inheriting the design system_ (still legible, text-labelled) — not an admin redesign. Rejected alternative: keep a separate colored copy for admin (violates single-source, no real benefit for an internal tool).

---

## 9. Scope boundaries

| ✅ In TASK-034                                                 | ⏭️ Deferred (owning task)         | 🚫 Out of scope                      |
| -------------------------------------------------------------- | --------------------------------- | ------------------------------------ |
| Tokens, typography, logo, motion                               | Home page color → **TASK-035**    | Admin _layout_ redesign              |
| Shared chrome (Header, Footer)                                 | Catalog page color → **TASK-036** | Showcase _visual_ themes             |
| Shared UI primitives (§7)                                      | Product page color → **TASK-037** | i18n copy translation → **TASK-039** |
| `StarRating`, order-status module                              | Cart drawer orange → **TASK-043** | Real content / photography           |
| account/orders, checkout, newsletter, 404 color neutralization |                                   |                                      |

**Unscheduled pages neutralized in this task** (no rebuild task owns them, so they would orphan stray color): `account/orders` + order detail (via the status module), `checkout` (Stripe Elements `appearance` → Mirox), `newsletter/confirm` + `newsletter/unsubscribe` (success-green / error hues → monochrome + red), `not-found` (404).

---

## 10. Testing

### 10.1 Automated

- **Unit** (`tests/unit/`):
  - `order-status.ts` — status→style mapping (monochrome for normal statuses, red for `CANCELLED`/`FAILED`/`REFUNDED`).
  - `<Logo/>` — renders wordmark + glyph; respects `showText={false}`.
  - `<FadeIn>` — renders children **visible** under `prefers-reduced-motion` (no hidden/transform state).
  - Existing **246** unit tests stay green.
- **Regression guard (AC-4 enforcement):** a test that greps the in-scope customer-facing files for reintroduced bright utilities (`bg-blue-`, `text-green-`, `bg-amber-`, …) and fails on any hit. The sanctioned `--destructive` red is token-based, not a utility, so it passes.
- **Gates:** `npm run typecheck`, `npm run lint`, `npm run build`, `npm run format:check` all green.

### 10.2 Manual (per POLICIES/manual-testing.md)

- Header / Footer / buttons / cards render correctly on **both** surfaces (white section + `data-surface="dark"` section).
- **Ukrainian text + `₴`** render in Manrope (headings) and Inter (body) with no tofu/fallback.
- Reduced-motion OS setting disables `<FadeIn>` and hover animations.
- Visiting `/showcase/bold` then returning to the storefront leaves the storefront **Mirox** (contamination path closed).
- E2E baseline **84/85** held (the 1 known intermittent chromium navigation flake is pre-existing and unrelated).

### 10.3 Acceptance-criteria mapping

| AC                                                   | Satisfied by                                                                                 |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Tokens defined & consumed by all shared components   | §4 tokens + §7 components consuming them                                                     |
| Header, footer, buttons, cards restyled              | §7                                                                                           |
| Animation primitives available as reusable utilities | §6 (`<FadeIn>`, `.animate-fade-up`, `.hover-lift`)                                           |
| No bright colors anywhere customer-facing            | §4 monochrome tokens + §9 neutralized pages + §10.1 grep guard; deferred pages tracked in §9 |

---

## 11. Risks & mitigations

| Risk                                             | Mitigation                                                                                                                                        |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Removing `next-themes` breaks showcase or toasts | Showcase decoupled to local wrapper (§3.2); sonner pinned to fixed theme; both covered by manual checks (§10.2).                                  |
| `₴` / Ukrainian glyphs miss the font subset      | `cyrillic-ext` subset explicitly required for both fonts (§5.1); manual glyph check (§10.2).                                                      |
| `--destructive` fails AA on one surface          | Two surface-tuned reds (§4.2); values finalized against a contrast check with AA as the hard constraint.                                          |
| Admin status badges change unexpectedly          | Explicitly accepted in §8; documented as inheritance, not redesign.                                                                               |
| Token change has wide blast radius               | Token-driven components re-skin predictably; scope table (§9) bounds what is verified this task; deferred surfaces tracked, not silently changed. |
| Bright color reintroduced later                  | Grep regression guard (§10.1) fails the build.                                                                                                    |

---

## 12. Out-of-scope / future

- Page-level restyles: TASK-035 (home), TASK-036 (catalog), TASK-037 (product), TASK-043 (cart).
- i18n / Ukrainian copy: TASK-039 (also a payments prerequisite).
- Admin panel visual redesign (only inherits tokens here).
- Official client logo SVG and real photography (client-supplied; drop-in slots provided).
