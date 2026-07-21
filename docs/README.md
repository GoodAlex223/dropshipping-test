# Documentation Index

Central index for all project documentation.

**Last Updated**: 2026-07-19

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
| [planning/WEEKLY.md](planning/WEEKLY.md)         | Current week's plan  | 2026-07-18   |
| [planning/TODO.md](planning/TODO.md)             | Active tasks         | 2026-07-20   |
| [planning/DONE.md](planning/DONE.md)             | Completed tasks      | 2026-07-18   |
| [planning/BACKLOG.md](planning/BACKLOG.md)       | Unprioritized ideas  | 2026-07-18   |
| [planning/ROADMAP.md](planning/ROADMAP.md)       | Long-term vision     | 2026-07-14   |
| [planning/GOALS.md](planning/GOALS.md)           | Objectives & metrics | 2026-01-26   |
| [planning/MILESTONES.md](planning/MILESTONES.md) | Key targets          | 2026-01-26   |

### Architecture & Design

| Document                                                                                                                                 | Purpose                                                                                                              | Last Updated |
| ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------ |
| [ARCHITECTURE.md](ARCHITECTURE.md)                                                                                                       | System design, layers, data flow                                                                                     | 2026-02-10   |
| [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md)                                                                                                 | Decisions, patterns, history                                                                                         | 2026-02-10   |
| [superpowers/specs/2026-07-14-mirox-shop-program-design.md](superpowers/specs/2026-07-14-mirox-shop-program-design.md)                   | Mirox Shop program design (v1.3 → v2.0)                                                                              | 2026-07-14   |
| [superpowers/specs/2026-07-15-task-038a-prework-design.md](superpowers/specs/2026-07-15-task-038a-prework-design.md)                     | TASK-038a prework: WebKit diagnosis, sharp, CI coverage                                                              | 2026-07-16   |
| [superpowers/specs/2026-07-16-ukraine-payments-delivery-design.md](superpowers/specs/2026-07-16-ukraine-payments-delivery-design.md)     | TASK-038b spike design: scope, gateway candidates, research methodology                                              | 2026-07-17   |
| [superpowers/specs/2026-07-16-ukraine-payments-delivery-decision.md](superpowers/specs/2026-07-16-ukraine-payments-delivery-decision.md) | **Ukraine payments & delivery decision** — gateway choice, Nova Poshta scoping, UAH strategy, TASK-048/049 blueprint | 2026-07-17   |
| [superpowers/specs/2026-07-17-mirox-design-system-design.md](superpowers/specs/2026-07-17-mirox-design-system-design.md)                 | TASK-034 design: Mirox token model, typography/logo, animation primitives, restyle scope                             | 2026-07-17   |
| [superpowers/specs/2026-07-19-task-035-homepage-design.md](superpowers/specs/2026-07-19-task-035-homepage-design.md)                     | TASK-035 design: homepage sections, content modules, bestseller definition, colour-guard extension                   | 2026-07-19   |
| [reference/client-brief.md](reference/client-brief.md)                                                                                   | **Client brief (verbatim)** — Mirox Shop requirement lists #1 and #2, RU + EN                                        | 2026-07-19   |

---

## Implementation Plans

_No active implementation plans. TASK-034 completed 2026-07-18 (PR #19) — see Archived Plans below._

### Archived Plans

| Plan                                                                                                             | Task                                | Status   | Completed  |
| ---------------------------------------------------------------------------------------------------------------- | ----------------------------------- | -------- | ---------- |
| [2026-01-05_dropshipping-mvp-plan.md](archive/plans/2026-01-05_dropshipping-mvp-plan.md)                         | Dropshipping Website MVP            | COMPLETE | 2026-01-13 |
| [2026-01-22_seo-technical-setup.md](archive/plans/2026-01-22_seo-technical-setup.md)                             | SEO Technical Setup                 | COMPLETE | 2026-01-22 |
| [2026-02-01_analytics-integration.md](archive/plans/2026-02-01_analytics-integration.md)                         | GA4 Analytics Integration           | COMPLETE | 2026-02-01 |
| [2026-02-02_task-019-social-sharing.md](archive/plans/2026-02-02_task-019-social-sharing.md)                     | Social Sharing                      | COMPLETE | 2026-02-02 |
| [2026-02-04_task-026-fix-vercel-deploy-ci.md](archive/plans/2026-02-04_task-026-fix-vercel-deploy-ci.md)         | CI/CD Deployment Pipeline           | COMPLETE | 2026-02-07 |
| [2026-02-09_task-027-dependency-audit.md](archive/plans/2026-02-09_task-027-dependency-audit.md)                 | Dependency Audit                    | COMPLETE | 2026-02-09 |
| [2026-07-14_task-033-resumption.md](archive/plans/2026-07-14_task-033-resumption.md)                             | Post-Freeze Resumption              | COMPLETE | 2026-07-14 |
| [2026-07-15_task-038a-prework.md](archive/plans/2026-07-15_task-038a-prework.md)                                 | TASK-038a Prework                   | COMPLETE | 2026-07-16 |
| [2026-07-16_task-038b-payments-delivery-spike.md](archive/plans/2026-07-16_task-038b-payments-delivery-spike.md) | TASK-038b Payments & Delivery Spike | COMPLETE | 2026-07-17 |
| [2026-07-17_task-034-design-system.md](archive/plans/2026-07-17_task-034-design-system.md)                       | TASK-034 Mirox Design System        | COMPLETE | 2026-07-18 |

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
