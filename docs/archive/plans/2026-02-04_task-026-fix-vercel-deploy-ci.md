# TASK-026: Fix Vercel Deploy in CI

**Status**: Complete
**Created**: 2026-02-04
**Branch**: feat/task-026-fix-vercel-deploy-ci
**PR**: #6

---

## Problem

The "Deploy to Vercel" job in the CI deploy workflow failed on every push to main. Root cause: no GitHub Actions secrets were configured (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`). The workflow defaulted to running the Vercel deploy job (since `DEPLOYMENT_TARGET` was unset), but the Vercel CLI failed with "No existing credentials found."

## Solution

Added a validation-first deployment pattern:

1. **Validate Vercel configuration** step checks all 4 required secrets (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `DATABASE_URL`)
2. If secrets are missing and `DEPLOYMENT_TARGET` is unset → **skip gracefully** (CI stays green)
3. If secrets are missing and `DEPLOYMENT_TARGET=vercel` → **fail with clear error**
4. All subsequent steps gated with `if: steps.validate.outputs.skip != 'true'`
5. Added `VERCEL_ORG_ID`/`VERCEL_PROJECT_ID` as job-level env vars (Vercel CLI reads these automatically)
6. Added VPS secret validation for consistency
7. Improved notify job to distinguish real deployment from graceful skip via job output

## Key Decisions

- **Step output + if guards** over early exit: GitHub Actions `exit 0` does not skip subsequent steps
- **Job-level env vars** for Vercel IDs: Vercel CLI auto-reads `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` from environment
- **DATABASE_URL in validation**: Prevents silent migration failure after successful deploy
- **VPS hard fail only**: VPS deployment is always explicit (`DEPLOYMENT_TARGET=vps`), so missing secrets should fail, not skip

## Files Modified

- `.github/workflows/deploy.yml` — Added validation steps, if guards, env vars, improved notify
- `docs/deployment/setup.md` — Updated secrets docs, added validation section, troubleshooting entries
- `CLAUDE.md` — Auto-updated with deployment patterns

## Future Improvements

1. **Vercel deploy preview on PRs**: Add preview deployment for pull requests (separate from production deploy on main)
2. **Deploy status badge**: Add a workflow status badge to README.md for deployment visibility
3. **Slack/Discord notifications**: Implement actual notification delivery in the notify job (currently just echo)
