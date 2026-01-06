# Knowledge Sources Policy

**Purpose**: Ensure Claude Code uses project documentation as a knowledge base before planning and during task execution.

**Last Updated**: YYYY-MM-DD

---

## 1. Pre-Task Documentation Review

### Mandatory Reading Order

**Before starting ANY significant task, read documents in this order:**

```
1. CLAUDE.md           → Universal rules (this is mandatory for every task)
2. PROJECT.md          → Project-specific context
3. docs/README.md      → Documentation index (find relevant docs)
4. docs/planning/TODO.md        → Active tasks, check for related work
5. Domain-specific docs → As identified in the index
6. Existing code       → Only after understanding context
```

**CRITICAL**: If any of these files do not exist, STOP and report to user. Do not proceed with assumptions.

### Task Type → Required Documents

| Task Type            | Must Read                                 | Should Read                       |
| -------------------- | ----------------------------------------- | --------------------------------- |
| **New Feature**      | TODO.md, docs/ARCHITECTURE.md             | PROJECT_CONTEXT.md, related plans |
| **Bug Fix**          | TODO.md, related module docs              | Past similar bug fixes            |
| **Refactoring**      | ARCHITECTURE.md, PROJECT_CONTEXT.md       | Existing refactoring plans        |
| **Database Changes** | ARCHITECTURE.md (data layer), schema docs | Migration history                 |
| **Testing**          | Testing policy, existing test patterns    | Coverage reports                  |
| **Documentation**    | docs/README.md, style guides              | All docs in relevant section      |
| **Deployment**       | Deployment docs, environment configs      | Previous deployment notes         |

---

## 2. Document Discovery Protocol

### Step 1: Consult the Index

Always start with `docs/README.md` to find:

- Which documents exist
- Where they are located
- What topics they cover

### Step 2: Search for Related Content

Use these patterns to find relevant documentation:

```bash
# Find docs mentioning a topic
grep -r "topic_name" docs/

# Find plan files for similar work
ls docs/plans/*topic*

# Check archive for historical context
grep -r "topic_name" docs/archive/
```

### Step 3: Follow Links

Documentation should be interconnected. Follow links within documents to discover related content.

### Step 4: Validate Currency

Check "Last Updated" dates. If documentation appears stale:

- Verify against actual code
- Note discrepancies
- Update documentation as part of task

---

## 3. Document Maintenance Responsibilities

### During Task Execution

| Event                         | Required Action                               |
| ----------------------------- | --------------------------------------------- |
| Find outdated information     | Note in plan file, fix before task completion |
| Discover undocumented pattern | Add to PROJECT_CONTEXT.md                     |
| Create new file/module        | Document in relevant docs                     |
| Complete a plan               | Move insights to PROJECT_CONTEXT.md           |
| **Find contradiction**        | STOP, report to user, wait for resolution     |

### After Task Completion

1. **Update "Last Updated"** date on any modified documentation
2. **Index new docs** in docs/README.md
3. **Archive completed plans** if they only contain historical value
4. **Extract learnings** to permanent documentation

---

## 4. Archive Decision Tree

```
Is the document still actively referenced?
├── YES → Keep in main docs/
└── NO → Continue...

Does it contain guidance for future work?
├── YES → Keep in main docs/
└── NO → Continue...

Is it >3 months old without updates?
├── YES → Review for archiving
└── NO → Keep in main docs/

Does it document completed work only?
├── YES → Move to docs/archive/
└── NO → Keep in main docs/
```

### Archive Process

1. Move file to `docs/archive/`
2. Add entry to `docs/archive/README.md`
3. Remove from `docs/README.md` main sections
4. Update any links pointing to the old location

---

## 5. Knowledge Extraction Protocol

### When Completing Tasks

Before marking a task complete, extract knowledge to permanent docs:

| Discovery Type          | Propagate To                          |
| ----------------------- | ------------------------------------- |
| Patterns discovered     | PROJECT_CONTEXT.md                    |
| Architectural decisions | ARCHITECTURE.md or PROJECT_CONTEXT.md |
| Bug fix patterns        | Relevant docs + regression test       |
| Testing insights        | Testing documentation                 |
| Workflow improvements   | CLAUDE.md or .claude/WORKFLOW.md      |
| Project-specific rules  | PROJECT.md                            |

### Plan File Lifecycle

```
1. CREATED: docs/plans/YYYY-MM-DD_task-name.md
2. ACTIVE: Updated during task execution
3. COMPLETE: All work done, learnings extracted
4. ARCHIVED: Move to docs/archive/ if only historical value remains
```

---

## 6. Document Freshness Indicators

### Check These Dates

Every document should have a "Last Updated" date. Documents need attention if:

| Age        | Action                                       |
| ---------- | -------------------------------------------- |
| < 1 month  | Current, no action needed                    |
| 1-3 months | Verify still accurate                        |
| 3-6 months | Review for updates or archiving              |
| > 6 months | Strong candidate for archive or major update |

### Staleness Signals

- References to deleted files/functions
- Mentions removed features
- Contradicts current codebase
- Links to archived documents
- **Code patterns described don't match actual implementation**

**When staleness is detected**: Note in plan file, update before or during task, or report to user if major discrepancy.

---

## 7. Integration with Task Workflow

### Plan Phase

```
1. Read CLAUDE.md and PROJECT.md
2. Read docs/README.md (documentation index)
3. Read docs/planning/TODO.md (find task, check context)
4. Read docs/PROJECT_CONTEXT.md (understand patterns)
5. Read domain-specific docs
6. Check docs/plans/ for similar completed work
7. Create plan with documentation references
```

### Execute Phase

```
1. Update plan file with progress
2. Note any documentation issues found
3. Update docs if code changes affect them
4. STOP if documentation contradicts code
```

### Complete Phase

```
1. Extract learnings to permanent docs
2. Update "Last Updated" on modified docs
3. Index any new documentation
4. Archive plan if appropriate
5. Update TODO.md and DONE.md
```

---

## 8. Standard Documentation Structure

### Required Files (Create if Missing)

```
project/
├── README.md              # Project overview
├── CLAUDE.md              # Universal Claude Code rules
├── PROJECT.md             # Project-specific configuration
└── docs/
    ├── README.md          # Documentation index
    ├── PROJECT_CONTEXT.md # Decisions, patterns, history
    ├── ARCHITECTURE.md    # System design
    ├── planning/          # Task management & strategy
    │   ├── TODO.md        # Active tasks
    │   ├── DONE.md        # Completed tasks
    │   ├── BACKLOG.md     # Unprioritized ideas
    │   ├── ROADMAP.md     # Long-term vision
    │   ├── GOALS.md       # Objectives & metrics
    │   └── MILESTONES.md  # Key targets
    ├── plans/             # Task implementation plans
    │   └── YYYY-MM-DD_task-name.md
    └── archive/           # Historical documents
        └── README.md      # Archive index
```

### Optional Subdirectories

Add as needed for your project:

```
docs/
├── api/           # API documentation
├── database/      # Schema, migrations
├── deployment/    # Deployment guides
├── testing/       # Testing strategies
└── [domain]/      # Domain-specific docs
```

---

## 9. Validation Rules

### Before Starting Work

Claude MUST verify:

- [ ] CLAUDE.md exists and is readable
- [ ] PROJECT.md exists and describes this project
- [ ] docs/README.md exists
- [ ] docs/planning/TODO.md exists
- [ ] Referenced documentation exists

**If any validation fails**: STOP, report missing files, wait for user to create them.

### During Work

Claude MUST check:

- [ ] Documentation matches code behavior
- [ ] Referenced files exist
- [ ] Links are not broken

**If validation fails**: STOP, report discrepancy, wait for user resolution.

---

## 10. Quick Reference

### Document Locations (Standard)

| Content Type         | Location                |
| -------------------- | ----------------------- |
| Universal rules      | CLAUDE.md               |
| Project config       | PROJECT.md              |
| Doc index            | docs/README.md          |
| Active tasks         | docs/planning/TODO.md   |
| Completed tasks      | docs/planning/DONE.md   |
| Project patterns     | docs/PROJECT_CONTEXT.md |
| Architecture         | docs/ARCHITECTURE.md    |
| Implementation plans | docs/plans/\*.md        |
| Historical docs      | docs/archive/\*.md      |

### Commands

```bash
# List all docs
ls docs/

# Search for topic
grep -r "topic" docs/

# List plans
ls docs/plans/

# List archived
ls docs/archive/
```

---

_This policy ensures Claude Code maintains accurate, current documentation and uses project knowledge effectively._
_For project-specific documentation structure, see [PROJECT.md](../../PROJECT.md)._
