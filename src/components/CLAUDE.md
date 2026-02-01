# Module: Components

<!-- AUTO-MANAGED: module-description -->

## Purpose

Shared React components organized by domain: admin panel, checkout flow, common layout, product display, shop interactions, multi-theme showcase, theme configuration, and shadcn/ui primitives.

<!-- END AUTO-MANAGED -->

<!-- AUTO-MANAGED: architecture -->

## Module Architecture

```
components/
├── admin/                 # Admin panel components
│   ├── AdminSidebar.tsx   # Navigation sidebar (collapsible)
│   ├── ImageUploader.tsx  # S3 image upload with drag-and-drop
│   ├── ProductForm.tsx    # Product create/edit form (react-hook-form + zod)
│   ├── ProductImportDialog.tsx  # CSV import dialog
│   └── index.ts           # Barrel exports
├── checkout/
│   ├── PaymentForm.tsx    # Stripe Elements payment form
│   └── index.ts
├── common/
│   ├── Header.tsx         # Site header with nav, cart, auth
│   ├── Footer.tsx         # Site footer
│   └── index.ts
├── products/
│   ├── ProductCard.tsx    # Product card (used in grids)
│   └── index.ts
├── shop/
│   ├── CartDrawer.tsx     # Slide-out cart drawer (Sheet)
│   └── index.ts
├── showcase/              # Multi-theme showcase system
│   ├── bold/              # Bold theme components (Hero, Features, Categories, ProductGrid, CTA)
│   ├── luxury/            # Luxury theme components (same structure)
│   ├── organic/           # Organic theme components (same structure)
│   ├── types.ts           # Shared showcase types
│   ├── data-fetchers.ts   # Server-side data fetching for showcase
│   └── index.ts
├── theme/
│   ├── theme-config.ts    # Theme configuration and variants
│   ├── theme-switcher.tsx # Theme toggle component
│   └── index.ts
├── ui/                    # shadcn/ui primitives (DO NOT modify directly)
│   ├── button.tsx, card.tsx, dialog.tsx, form.tsx, input.tsx, ...
│   └── (20+ Radix-based components with Tailwind styling)
└── providers.tsx          # App-wide context providers (theme, auth, toast)
```

<!-- END AUTO-MANAGED -->

<!-- AUTO-MANAGED: conventions -->

## Module-Specific Conventions

- **Naming**: PascalCase for component files (`ProductCard.tsx`), kebab-case for non-component files (`data-fetchers.ts`, `theme-config.ts`)
- **Client directive**: Interactive components use `"use client"` at file top
- **Barrel exports**: Each subdirectory has `index.ts` re-exporting public components
- **UI primitives**: `ui/` directory contains shadcn/ui components — regenerate with CLI rather than editing directly
- **Styling**: Tailwind CSS classes with `cn()` utility for conditional class merging (clsx + tailwind-merge)
- **CVA**: Class Variance Authority for component variants (button, badge, etc.)
- **Forms**: react-hook-form + @hookform/resolvers/zod for form state and validation
- **Icons**: lucide-react for all iconography
- **Showcase pattern**: Each theme variant (bold, luxury, organic) has identical component structure: Hero, Features, Categories, ProductGrid, CTA

<!-- END AUTO-MANAGED -->

<!-- AUTO-MANAGED: dependencies -->

## Key Dependencies

- `react`, `react-dom` (v18) — Core UI library
- `@radix-ui/*` — Headless UI primitives (dialog, dropdown, select, tabs, etc.)
- `class-variance-authority` — Component variant system
- `clsx` + `tailwind-merge` — Conditional class composition
- `lucide-react` — Icon library
- `react-hook-form` + `@hookform/resolvers` — Form management
- `zustand` — Cart state (consumed by CartDrawer, Header)
- `@stripe/react-stripe-js` — Payment form elements
- `react-dropzone` — File upload (ImageUploader)
- `sonner` — Toast notifications
- `next-themes` — Dark/light theme switching

<!-- END AUTO-MANAGED -->

<!-- MANUAL -->

## Notes

<!-- END MANUAL -->
