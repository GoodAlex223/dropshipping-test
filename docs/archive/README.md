# Archive

Historical documents that are no longer actively used but preserved for reference.

**Last Updated**: 2026-02-10

---

## Structure

```
archive/
├── README.md           # This file
├── plans/              # Completed implementation plans
│   └── README.md       # Plan archive guidelines
└── [other docs]        # Other archived documentation
```

---

## Archive Contents

### Completed Plans

Plans are archived in `plans/` subdirectory after completion.

See: [plans/README.md](plans/README.md)

| Plan                                                                                             | Original Task             | Archived Date |
| ------------------------------------------------------------------------------------------------ | ------------------------- | ------------- |
| [2026-01-05_dropshipping-mvp-plan.md](plans/2026-01-05_dropshipping-mvp-plan.md)                 | Dropshipping Website MVP  | 2026-01-13    |
| [2026-01-22_seo-technical-setup.md](plans/2026-01-22_seo-technical-setup.md)                     | SEO Technical Setup       | 2026-01-22    |
| [2026-02-01_analytics-integration.md](plans/2026-02-01_analytics-integration.md)                 | GA4 Analytics Integration | 2026-02-01    |
| [2026-02-02_task-019-social-sharing.md](plans/2026-02-02_task-019-social-sharing.md)             | Social Sharing            | 2026-02-02    |
| [2026-02-04_task-026-fix-vercel-deploy-ci.md](plans/2026-02-04_task-026-fix-vercel-deploy-ci.md) | CI/CD Deployment Pipeline | 2026-02-07    |
| [2026-02-09_task-027-dependency-audit.md](plans/2026-02-09_task-027-dependency-audit.md)         | Dependency Audit          | 2026-02-09    |

### Deprecated Documentation

_No deprecated documentation yet._

### Historical Context

_No historical context documents yet._

---

## Archive Criteria

Documents are archived when:

1. **Plans complete** - All steps done, improvements documented
2. **Superseded** - Replaced by newer documentation
3. **No longer relevant** - Historical context only
4. **Stale** - Not referenced in 6+ months

---

## Plan Archive Process

**Plans follow a specific lifecycle:**

```text
docs/plans/YYYY-MM-DD_task.md  →  docs/archive/plans/YYYY-MM-DD_task.md
```

Before archiving a plan, verify:

- [ ] All steps marked complete
- [ ] "Key Discoveries" section filled
- [ ] "Future Improvements" has 2+ items
- [ ] **Improvements extracted to BACKLOG.md** (categorized appropriately)
- [ ] Summary added to docs/planning/DONE.md
- [ ] .claude/plans/ copy deleted (if exists)

**See [plans/README.md](plans/README.md) for complete step-by-step archive process.**

---

## Using Archived Documents

Archived documents may be useful for:

- Understanding historical decisions
- Finding patterns from past work
- Recovering lost context
- Reference for similar future tasks

**Note**: Archived documents may contain outdated information. Always verify against current codebase.

---

## Restoring from Archive

If a document becomes relevant again:

1. Move back to main `docs/` directory (or `docs/plans/` for plans)
2. Update content as needed
3. Add to [../README.md](../README.md) index
4. Remove from this archive index

---

_Parent: [../README.md](../README.md)_
