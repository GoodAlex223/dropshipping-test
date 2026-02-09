# TASK-027: Dependency Audit & Security Patches

**Status**: Complete
**Date**: 2026-02-09
**Estimated effort**: 2-3 hours
**Actual effort**: ~1.5 hours

---

## 1. Objective

Run security audit on all dependencies, update vulnerable packages, and ensure lock file is clean. Freeze week task — stability and cleanup only, no new features.

---

## 2. Security Audit Findings

### Vulnerabilities Found

| Package                         | Severity | Issue                                  | Advisory            | Resolution                                |
| ------------------------------- | -------- | -------------------------------------- | ------------------- | ----------------------------------------- |
| `fast-xml-parser` (via AWS SDK) | **HIGH** | RangeError DoS via numeric entities    | GHSA-xxxx           | Fixed — AWS SDK updated 3.965.0 → 3.985.0 |
| `next` 14.2.35                  | **HIGH** | DoS via Image Optimizer remotePatterns | GHSA-9g9p-9gw9-jx7f | Deferred — requires Next.js 16 (breaking) |
| `next` 14.2.35                  | **HIGH** | HTTP request deserialization DoS       | GHSA-h25m-26qc-wcjf | Deferred — requires Next.js 16 (breaking) |

### Post-Update Audit Status

- **Fixed**: 1 vulnerability (fast-xml-parser via AWS SDK)
- **Remaining**: 1 package with 2 HIGH vulnerabilities (next@14.2.35) — requires major version upgrade, deferred to post-freeze

---

## 3. Packages Updated

### Patch/Minor Updates (28 packages via `npm update`)

| Package                            | From     | To       | Type         |
| ---------------------------------- | -------- | -------- | ------------ |
| `@aws-sdk/client-s3`               | 3.965.0  | 3.985.0  | Security fix |
| `@aws-sdk/s3-request-presigner`    | 3.965.0  | 3.985.0  | Security fix |
| `@playwright/test`                 | 1.57.0   | 1.58.2   | Dev          |
| `@prisma/adapter-neon`             | 7.2.0    | 7.3.0    | Patch        |
| `@prisma/client`                   | 6.19.1   | 6.19.2   | Patch        |
| `@stripe/react-stripe-js`          | 5.4.1    | 5.6.0    | Minor        |
| `@stripe/stripe-js`                | 8.6.1    | 8.7.0    | Minor        |
| `@testing-library/react`           | 16.3.1   | 16.3.2   | Patch        |
| `@types/node`                      | 20.19.27 | 20.19.33 | Patch        |
| `@types/react`                     | 19.2.7   | 19.2.13  | Patch        |
| `@typescript-eslint/eslint-plugin` | 8.52.0   | 8.54.0   | Minor        |
| `@typescript-eslint/parser`        | 8.52.0   | 8.54.0   | Minor        |
| `@vitejs/plugin-react`             | 5.1.2    | 5.1.3    | Patch        |
| `@vitest/coverage-v8`              | 4.0.16   | 4.0.18   | Patch        |
| `bullmq`                           | 5.66.4   | 5.67.3   | Minor        |
| `dotenv`                           | 17.2.3   | 17.2.4   | Patch        |
| `ioredis`                          | 5.9.0    | 5.9.2    | Patch        |
| `pg`                               | 8.16.3   | 8.18.0   | Minor        |
| `prettier`                         | 3.7.4    | 3.8.1    | Minor        |
| `prisma`                           | 6.19.1   | 6.19.2   | Patch        |
| `react-dropzone`                   | 14.3.8   | 14.4.0   | Minor        |
| `react-hook-form`                  | 7.70.0   | 7.71.1   | Minor        |
| `resend`                           | 6.6.0    | 6.9.1    | Minor        |
| `stripe`                           | 20.1.2   | 20.3.1   | Minor        |
| `vitest`                           | 4.0.16   | 4.0.18   | Patch        |
| `zod`                              | 4.3.5    | 4.3.6    | Patch        |
| `zustand`                          | 5.0.9    | 5.0.11   | Patch        |

### Explicit Version Bumps (2 packages)

| Package              | From    | To      | Reason                                                       |
| -------------------- | ------- | ------- | ------------------------------------------------------------ |
| `lucide-react`       | 0.562.0 | 0.563.0 | 0.x semver requires explicit bump; low risk (icon additions) |
| `eslint-config-next` | 16.1.1  | 16.1.6  | Patch update within 16.x; keeps lint rules current           |

### Code Changes Required by Updates

| File                | Change                                                    | Reason                                           |
| ------------------- | --------------------------------------------------------- | ------------------------------------------------ |
| `src/lib/stripe.ts` | API version `"2025-12-15.clover"` → `"2026-01-28.clover"` | Stripe SDK 20.3.1 expects new API version string |

---

## 4. Packages Intentionally Kept at Older Versions

| Package                     | Current       | Latest           | Reason                                                                                                         |
| --------------------------- | ------------- | ---------------- | -------------------------------------------------------------------------------------------------------------- |
| `next`                      | 14.2.35       | 16.1.6           | Pinned at 14.x for React 18 compatibility. Major upgrade requires React 19 migration. Deferred to post-freeze. |
| `react` / `react-dom`       | 18.3.1        | 19.2.4           | Pinned at 18.x. React 19 requires Next.js upgrade first. `React.cache` not available in 18.                    |
| `next-auth`                 | 5.0.0-beta.30 | 4.24.13 (stable) | Using v5 beta for App Router support. Stable v4 doesn't support Next.js App Router.                            |
| `prisma` / `@prisma/client` | 6.19.2        | 7.3.0            | Major version requiring migration guide. `package.json#prisma.seed` deprecated in v7.                          |
| `eslint`                    | 9.39.2        | 10.0.0           | Major version with breaking config changes. Low priority during freeze.                                        |
| `jsdom`                     | 27.4.0        | 28.0.0           | Major version. Dev-only dependency, low risk but unnecessary during freeze.                                    |
| `@types/node`               | 20.19.33      | 25.2.2           | Pinned at 20.x to match Node.js LTS version in use.                                                            |

---

## 5. Verification Results

| Check               | Result                                                            |
| ------------------- | ----------------------------------------------------------------- |
| `npm run lint`      | Pass (0 errors, 23 pre-existing warnings)                         |
| `npm run typecheck` | Pass                                                              |
| `npm run test:run`  | Pass (87/87 tests)                                                |
| `npm run build`     | Pass (production build successful)                                |
| `npm audit`         | 1 remaining vulnerability (next@14.2.35 — intentionally deferred) |
| `npm outdated`      | 9 packages outdated (all intentionally held at current major)     |

---

## 6. Key Discoveries

- Stripe SDK minor updates can change the expected `apiVersion` type string, requiring code changes in `stripe.ts`
- `nodemailer` peer dependency conflict between `next-auth` v5 beta and `@auth/core` — cosmetic warning, not a functional issue
- Prisma 7 deprecates `package.json#prisma.seed` config in favor of `prisma.config.ts` — will need migration when upgrading

---

## 7. Future Improvements

1. **Next.js 16 + React 19 upgrade** — Required to fix 2 HIGH security vulnerabilities in Next.js. Major effort (~1-2 days) due to breaking changes. Should be prioritized post-freeze.
2. **Prisma 7 migration** — Follow major version upgrade guide. Includes migrating `prisma.seed` from `package.json` to `prisma.config.ts`.
3. **Automated dependency monitoring** — Consider adding Dependabot or Renovate for automated PR creation on dependency updates.

---

## Execution Log

#### [2026-02-09 08:00] — PHASE: Planning

- Goal: Run security audit, update safe packages, document findings
- Approach: Conservative (patch/minor only, defer major versions)
- Risks: Stripe API version mismatch (handled), Next.js vulnerabilities (documented and deferred)

#### [2026-02-09 08:05] — PHASE: Implementation

- `npm audit fix` fixed AWS SDK / fast-xml-parser vulnerability
- `npm update` updated 28 packages within semver ranges
- Explicit bumps for lucide-react and eslint-config-next
- Stripe API version updated in code to match new SDK

#### [2026-02-09 08:15] — PHASE: Verification

- typecheck initially failed on Stripe API version — fixed
- All checks pass: lint, typecheck, tests (87/87), build

#### [2026-02-09 08:20] — PHASE: Complete

- Final approach: Conservative update with documentation
- Tests passing: yes (87/87)
- Build passing: yes
- User approval: received
