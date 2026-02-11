# Documentation Index

Central index for all project documentation.

**Last Updated**: 2026-02-10

---

## Quick Navigation

| I need to...                    | Go to                                        |
| ------------------------------- | -------------------------------------------- |
| See what tasks are pending      | [planning/TODO.md](planning/TODO.md)         |
| See what's been completed       | [planning/DONE.md](planning/DONE.md)         |
| See the roadmap                 | [planning/ROADMAP.md](planning/ROADMAP.md)   |
| See archived plans              | [archive/plans/](archive/plans/)             |
| Understand the architecture     | [ARCHITECTURE.md](ARCHITECTURE.md)           |
| Find project patterns/decisions | [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md)     |
| See Claude Code rules           | [../CLAUDE.md](../CLAUDE.md)                 |
| See project-specific config     | [../PROJECT.md](../PROJECT.md)               |
| View API reference              | [api/endpoints.md](api/endpoints.md)         |
| View database schema            | [database/schema.md](database/schema.md)     |
| View testing guide              | [testing/strategy.md](testing/strategy.md)   |
| View deployment guide           | [deployment/setup.md](deployment/setup.md)   |
| View manual testing checklist   | [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md) |

---

## Core Documentation

### Planning & Tasks

| Document                                         | Purpose              | Last Updated |
| ------------------------------------------------ | -------------------- | ------------ |
| [planning/README.md](planning/README.md)         | Planning overview    | 2026-01-05   |
| [planning/TODO.md](planning/TODO.md)             | Active tasks         | 2026-02-10   |
| [planning/DONE.md](planning/DONE.md)             | Completed tasks      | 2026-02-10   |
| [planning/BACKLOG.md](planning/BACKLOG.md)       | Unprioritized ideas  | 2026-02-10   |
| [planning/ROADMAP.md](planning/ROADMAP.md)       | Long-term vision     | 2026-02-10   |
| [planning/GOALS.md](planning/GOALS.md)           | Objectives & metrics | 2026-01-26   |
| [planning/MILESTONES.md](planning/MILESTONES.md) | Key targets          | 2026-01-26   |

### Architecture & Design

| Document                                 | Purpose                          | Last Updated |
| ---------------------------------------- | -------------------------------- | ------------ |
| [ARCHITECTURE.md](ARCHITECTURE.md)       | System design, layers, data flow | 2026-02-10   |
| [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) | Decisions, patterns, history     | 2026-02-10   |

---

## Implementation Plans

**Active**: [2026-02-10_task-030-documentation-finalization.md](planning/plans/2026-02-10_task-030-documentation-finalization.md) — Documentation Finalization

### Archived Plans

| Plan                                                                                                     | Task                      | Status   | Completed  |
| -------------------------------------------------------------------------------------------------------- | ------------------------- | -------- | ---------- |
| [2026-01-05_dropshipping-mvp-plan.md](archive/plans/2026-01-05_dropshipping-mvp-plan.md)                 | Dropshipping Website MVP  | COMPLETE | 2026-01-13 |
| [2026-01-22_seo-technical-setup.md](archive/plans/2026-01-22_seo-technical-setup.md)                     | SEO Technical Setup       | COMPLETE | 2026-01-22 |
| [2026-02-01_analytics-integration.md](archive/plans/2026-02-01_analytics-integration.md)                 | GA4 Analytics Integration | COMPLETE | 2026-02-01 |
| [2026-02-02_task-019-social-sharing.md](archive/plans/2026-02-02_task-019-social-sharing.md)             | Social Sharing            | COMPLETE | 2026-02-02 |
| [2026-02-04_task-026-fix-vercel-deploy-ci.md](archive/plans/2026-02-04_task-026-fix-vercel-deploy-ci.md) | CI/CD Deployment Pipeline | COMPLETE | 2026-02-07 |
| [2026-02-09_task-027-dependency-audit.md](archive/plans/2026-02-09_task-027-dependency-audit.md)         | Dependency Audit          | COMPLETE | 2026-02-09 |

See [archive/README.md](archive/README.md) for more historical plans.

---

## Domain Documentation

### API Documentation

| Document                             | Purpose                | Last Updated |
| ------------------------------------ | ---------------------- | ------------ |
| [api/endpoints.md](api/endpoints.md) | API endpoint reference | 2026-02-10   |

### Database

| Document                                 | Purpose         | Last Updated |
| ---------------------------------------- | --------------- | ------------ |
| [database/schema.md](database/schema.md) | Database schema | 2026-02-10   |

### Deployment

| Document                                   | Purpose           | Last Updated |
| ------------------------------------------ | ----------------- | ------------ |
| [deployment/setup.md](deployment/setup.md) | Environment setup | 2026-02-10   |

### Testing

| Document                                     | Purpose                  | Last Updated |
| -------------------------------------------- | ------------------------ | ------------ |
| [testing/strategy.md](testing/strategy.md)   | Testing approach         | 2026-02-10   |
| [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md) | Manual testing checklist | 2026-02-10   |

---

## How to Use This Index

### Finding Documentation

1. **Check this index first** - Most docs are listed here
2. **Use grep for specific topics**: `grep -r "topic" docs/`
3. **Check archive** for historical documentation

### Adding New Documentation

When creating new documentation:

1. Create the document in the appropriate directory
2. Add an entry to this index
3. Include "Last Updated" date in the document
4. Link from related documents

### Updating Documentation

When updating existing documentation:

1. Update the "Last Updated" date in the document
2. Update the "Last Updated" column in this index
3. If the document's purpose changed, update description here

### Archiving Documentation

When documentation is no longer actively needed:

1. Move to `archive/` directory
2. Add entry to [archive/README.md](archive/README.md)
3. Remove from this index (or move to Archive section)
4. Update any links pointing to old location

---

## Directory Structure

```
docs/
├── README.md              # This file - documentation index
├── ARCHITECTURE.md        # System design
├── PROJECT_CONTEXT.md     # Patterns, decisions
├── planning/              # Task management & strategy
│   ├── README.md          # Planning guide
│   ├── TODO.md            # Active tasks
│   ├── DONE.md            # Completed tasks
│   ├── BACKLOG.md         # Unprioritized ideas
│   ├── ROADMAP.md         # Long-term vision
│   ├── GOALS.md           # Objectives & metrics
│   └── MILESTONES.md      # Key targets
├── plans/                 # Implementation plans
│   ├── README.md          # Plans guide
│   └── YYYY-MM-DD_task.md
├── archive/               # Historical documents
│   ├── README.md          # Archive index
│   └── plans/             # Completed plans
│       └── README.md
└── [domain]/              # Domain-specific docs
    └── *.md
```

---

## Maintenance

### Monthly Review

- [ ] All active documents have current "Last Updated" dates
- [ ] No broken links in index
- [ ] Archived documents moved to archive/
- [ ] New documents added to index

### Staleness Indicators

Documents may need attention if:

- Last Updated > 3 months ago
- References deleted code/features
- Contradicts current implementation
- Marked with TODO/FIXME

---

_For Claude Code rules, see [../CLAUDE.md](../CLAUDE.md)._
_For project-specific configuration, see [../PROJECT.md](../PROJECT.md)._
