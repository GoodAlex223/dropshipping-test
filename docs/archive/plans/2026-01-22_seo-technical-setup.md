# TASK-017: SEO Technical Setup - Completion Plan

**Status**: Complete
**Created**: 2026-01-22
**Task**: Complete remaining SEO technical foundation

---

## 1. Summary

Most SEO infrastructure already exists. This plan completes the remaining gaps:

- Add metadata to 5 pages missing custom meta tags
- Add hreflang tags for i18n preparation
- Wire up unused `metaTitle`/`metaDesc` Product fields
- Create missing asset files (og-image, manifest, favicons)

---

## 2. Implementation Phases

### Phase 1: Extend SEO Library

**File**: `src/lib/seo.ts`

Add new helper functions:

- `getHomeMetadata()` - Home page with absolute title
- `getProductsListingMetadata()` - Products listing page
- `getCategoriesListingMetadata()` - Categories listing page
- `getAuthMetadata(type)` - Login/register pages (noindex)

Update existing:

- `getDefaultMetadata()` - Add `alternates.languages` for hreflang (`en`, `x-default`)
- `getProductMetadata()` - Accept optional `metaTitle`/`metaDesc` with fallbacks

### Phase 2: Add Metadata to Pages

| Page       | File                                 | Change                                                                                          |
| ---------- | ------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Home       | `src/app/(shop)/page.tsx`            | Add `export const metadata` using `getHomeMetadata()`                                           |
| Products   | `src/app/(shop)/products/page.tsx`   | Refactor: extract client content to `products-content.tsx`, create server wrapper with metadata |
| Categories | `src/app/(shop)/categories/page.tsx` | Add `export const metadata` using `getCategoriesListingMetadata()`                              |
| Login      | `src/app/(auth)/login/page.tsx`      | Refactor: extract client content to `login-form.tsx`, create server wrapper with metadata       |
| Register   | `src/app/(auth)/register/page.tsx`   | Same pattern as login                                                                           |

### Phase 3: Wire Up metaTitle/metaDesc

**File**: `src/app/(shop)/products/[slug]/page.tsx`

- Add `metaTitle`, `metaDesc` to `getProduct()` select query
- Pass to `getProductMetadata()` call

### Phase 4: Create Asset Files

| File                          | Spec                                 |
| ----------------------------- | ------------------------------------ |
| `public/og-image.png`         | 1200x630, simple branded placeholder |
| `public/manifest.json`        | PWA manifest with basic app info     |
| `public/favicon-16x16.png`    | 16x16 favicon variant                |
| `public/apple-touch-icon.png` | 180x180 Apple touch icon             |

---

## 3. Files to Modify

### Modify

- `src/lib/seo.ts` - Add helper functions, hreflang, metaTitle/metaDesc support
- `src/app/(shop)/page.tsx` - Add metadata export
- `src/app/(shop)/products/page.tsx` - Refactor to server wrapper
- `src/app/(shop)/categories/page.tsx` - Add metadata export
- `src/app/(auth)/login/page.tsx` - Refactor to server wrapper
- `src/app/(auth)/register/page.tsx` - Refactor to server wrapper
- `src/app/(shop)/products/[slug]/page.tsx` - Add metaTitle/metaDesc to query

### Create

- `src/app/(shop)/products/products-content.tsx` - Client content extracted
- `src/app/(auth)/login/login-form.tsx` - Client content extracted
- `src/app/(auth)/register/register-form.tsx` - Client content extracted
- `public/og-image.png` - OG image placeholder
- `public/manifest.json` - PWA manifest
- `public/favicon-16x16.png` - Small favicon
- `public/apple-touch-icon.png` - Apple touch icon

---

## 4. Verification

1. **Build**: `npm run build` - No TypeScript errors
2. **Type check**: `npm run typecheck`
3. **Lint**: `npm run lint`
4. **Manual verification**:
   - Visit each page, inspect `<head>` for meta tags
   - Check `/sitemap.xml` still works
   - Check `/robots.txt` still works
   - Test OG preview with browser dev tools
5. **Asset check**: Verify all referenced files exist in `/public`

---

## 5. Future Improvements

1. **Replace placeholder assets with branded images** - Current og-image.png, favicon-16x16.png, and apple-touch-icon.png are simple text-on-color placeholders. Should be replaced with properly designed branded assets.

2. **Add dynamic OG image generation** - Use Next.js `opengraph-image.tsx` convention to generate product-specific OG images dynamically instead of relying on product images which may not be optimized for social sharing (1200x630).

3. **Add category metaTitle/metaDesc fields** - Similar to Product, Category model could have custom meta fields for SEO optimization of category pages.

4. **Implement proper i18n with hreflang** - Current hreflang setup is preparation only (just `en`). When i18n is implemented, need to update to point to actual language variants.

---

## 6. Notes

- Auth pages get `robots: { index: false }` - shouldn't be indexed
- Home page uses `title.absolute` to avoid "Home | Store" template
- hreflang set at root level via `getDefaultMetadata()` for simplicity
- Asset files are placeholders - can be replaced with branded versions later

---

## 7. Execution Log

### 2026-01-22 — Phase 1: SEO Library

- Added hreflang support to `getDefaultMetadata()` with `en` and `x-default`
- Updated `getProductMetadata()` to accept optional `metaTitle`/`metaDesc`
- Created 4 new helper functions: `getHomeMetadata()`, `getProductsListingMetadata()`, `getCategoriesListingMetadata()`, `getAuthMetadata()`

### 2026-01-22 — Phase 2: Page Metadata

- Home page: Added metadata export
- Products listing: Refactored to server wrapper + client content
- Categories listing: Added metadata export
- Login page: Refactored to server wrapper + client form
- Register page: Refactored to server wrapper + client form

### 2026-01-22 — Phase 3: Product metaTitle/metaDesc

- Added fields to Prisma select query
- Updated Product interface with optional fields
- Passed to `getProductMetadata()` in generateMetadata

### 2026-01-22 — Phase 4: Asset Files

- Created `og-image.png` (1200x630) with ImageMagick
- Created `apple-touch-icon.png` (180x180)
- Created `favicon-16x16.png` (16x16)
- Created `manifest.json` with PWA configuration

### 2026-01-22 — Verification

- TypeScript: PASS
- ESLint: PASS
- Build: PASS (37 pages compiled)
