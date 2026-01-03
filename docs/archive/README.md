# Archive

Historical documents that are no longer actively used but preserved for reference.

**Last Updated**: YYYY-MM-DD

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

| Plan | Original Task | Archived Date |
|------|---------------|---------------|
| [YYYY-MM-DD_task.md](plans/YYYY-MM-DD_task.md) | [Task description] | YYYY-MM-DD |

### Deprecated Documentation

| Document | Superseded By | Archived Date |
|----------|---------------|---------------|
| [doc.md](doc.md) | [New document] | YYYY-MM-DD |

### Historical Context

| Document | Purpose | Archived Date |
|----------|---------|---------------|
| [doc.md](doc.md) | [What it documented] | YYYY-MM-DD |

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

*Parent: [../README.md](../README.md)*
