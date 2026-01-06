# Documentation Index

Central index for all project documentation.

**Last Updated**: YYYY-MM-DD

---

## Quick Navigation

| I need to...                    | Go to                                      |
| ------------------------------- | ------------------------------------------ |
| See what tasks are pending      | [planning/TODO.md](planning/TODO.md)       |
| See what's been completed       | [planning/DONE.md](planning/DONE.md)       |
| See the roadmap                 | [planning/ROADMAP.md](planning/ROADMAP.md) |
| See active implementation plans | [plans/README.md](plans/README.md)         |
| Understand the architecture     | [ARCHITECTURE.md](ARCHITECTURE.md)         |
| Find project patterns/decisions | [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md)   |
| See Claude Code rules           | [../CLAUDE.md](../CLAUDE.md)               |
| See project-specific config     | [../PROJECT.md](../PROJECT.md)             |

---

## Core Documentation

### Planning & Tasks

| Document                                         | Purpose              | Last Updated |
| ------------------------------------------------ | -------------------- | ------------ |
| [planning/README.md](planning/README.md)         | Planning overview    | YYYY-MM-DD   |
| [planning/TODO.md](planning/TODO.md)             | Active tasks         | YYYY-MM-DD   |
| [planning/DONE.md](planning/DONE.md)             | Completed tasks      | YYYY-MM-DD   |
| [planning/BACKLOG.md](planning/BACKLOG.md)       | Unprioritized ideas  | YYYY-MM-DD   |
| [planning/ROADMAP.md](planning/ROADMAP.md)       | Long-term vision     | YYYY-MM-DD   |
| [planning/GOALS.md](planning/GOALS.md)           | Objectives & metrics | YYYY-MM-DD   |
| [planning/MILESTONES.md](planning/MILESTONES.md) | Key targets          | YYYY-MM-DD   |

### Architecture & Design

| Document                                 | Purpose                          | Last Updated |
| ---------------------------------------- | -------------------------------- | ------------ |
| [ARCHITECTURE.md](ARCHITECTURE.md)       | System design, layers, data flow | YYYY-MM-DD   |
| [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) | Decisions, patterns, history     | YYYY-MM-DD   |

---

## Implementation Plans

Active and recent implementation plans.

| Plan                                                     | Task          | Status          | Created    |
| -------------------------------------------------------- | ------------- | --------------- | ---------- |
| [YYYY-MM-DD_task-name.md](plans/YYYY-MM-DD_task-name.md) | [Description] | Active/Complete | YYYY-MM-DD |

### Archived Plans

See [archive/README.md](archive/README.md) for completed historical plans.

---

## Domain Documentation

<!--
Add sections as needed for your project.
Remove or rename these examples.
-->

### API Documentation

| Document                             | Purpose                | Last Updated |
| ------------------------------------ | ---------------------- | ------------ |
| [api/endpoints.md](api/endpoints.md) | API endpoint reference | YYYY-MM-DD   |

### Database

| Document                                         | Purpose           | Last Updated |
| ------------------------------------------------ | ----------------- | ------------ |
| [database/schema.md](database/schema.md)         | Database schema   | YYYY-MM-DD   |
| [database/migrations.md](database/migrations.md) | Migration history | YYYY-MM-DD   |

### Deployment

| Document                                           | Purpose              | Last Updated |
| -------------------------------------------------- | -------------------- | ------------ |
| [deployment/setup.md](deployment/setup.md)         | Environment setup    | YYYY-MM-DD   |
| [deployment/checklist.md](deployment/checklist.md) | Deployment checklist | YYYY-MM-DD   |

### Testing

| Document                                   | Purpose            | Last Updated |
| ------------------------------------------ | ------------------ | ------------ |
| [testing/strategy.md](testing/strategy.md) | Testing approach   | YYYY-MM-DD   |
| [testing/coverage.md](testing/coverage.md) | Coverage baselines | YYYY-MM-DD   |

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
