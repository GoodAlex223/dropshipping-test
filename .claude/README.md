# .claude Directory

Configuration files for Claude Code. These files define universal development rules, workflows, and policies.

---

## Structure

```
.claude/
├── README.md              # This file
├── settings.local.json    # Permissions and hooks
├── WORKFLOW.md            # Development workflow
├── mcp-config.md          # MCP server configuration guide
├── POLICIES/              # Detailed policies
│   ├── critical-thinking.md
│   ├── documentation.md
│   ├── testing.md
│   ├── knowledge-sources.md
│   ├── context-management.md
│   ├── code-review.md
│   ├── security.md
│   ├── git.md
│   ├── error-handling.md
│   ├── versioning.md
│   └── performance.md
├── LANGUAGES/             # Language-specific standards
│   ├── README.md
│   ├── python.md
│   ├── typescript.md
│   └── _template.md
└── TEMPLATES/             # Reusable templates
    ├── README.md
    ├── plan.md
    ├── pull-request.md
    ├── bug-report.md
    ├── feature-request.md
    ├── adr.md
    ├── incident-report.md
    └── release-notes.md
```

---

## File Purposes

### Core Files

| File                | Purpose                                      |
| ------------------- | -------------------------------------------- |
| settings.local.json | Claude Code permissions and automation hooks |
| WORKFLOW.md         | Plan-Execute-Verify-Document cycle           |
| mcp-config.md       | MCP server configuration guide and templates |

### Policies

| File                           | Purpose                                            |
| ------------------------------ | -------------------------------------------------- |
| POLICIES/critical-thinking.md  | Analysis requirements, questioning user assertions |
| POLICIES/documentation.md      | Documentation standards, improvement tracking      |
| POLICIES/testing.md            | TDD workflow, coverage requirements                |
| POLICIES/knowledge-sources.md  | Document structure, validation, maintenance        |
| POLICIES/context-management.md | Managing instruction size and priority             |
| POLICIES/code-review.md        | Code review checklist and process                  |
| POLICIES/security.md           | Security standards, secrets management             |
| POLICIES/git.md                | Git workflow, branching, commit messages           |
| POLICIES/error-handling.md     | Error handling patterns and practices              |
| POLICIES/versioning.md         | Semantic versioning, changelogs, releases          |
| POLICIES/performance.md        | Performance guidelines and optimization            |

### Language Standards

| File                    | Purpose                           |
| ----------------------- | --------------------------------- |
| LANGUAGES/python.md     | Python coding standards           |
| LANGUAGES/typescript.md | TypeScript/JavaScript standards   |
| LANGUAGES/\_template.md | Template for adding new languages |

### Templates

| File                         | Purpose                      |
| ---------------------------- | ---------------------------- |
| TEMPLATES/plan.md            | Task implementation plan     |
| TEMPLATES/pull-request.md    | Pull request description     |
| TEMPLATES/bug-report.md      | Bug report format            |
| TEMPLATES/feature-request.md | Feature request format       |
| TEMPLATES/adr.md             | Architecture Decision Record |
| TEMPLATES/incident-report.md | Post-incident report         |
| TEMPLATES/release-notes.md   | Release announcement         |

---

## Relationship to Other Files

```
Root/
├── CLAUDE.md              # Core rules (references .claude/)
├── PROJECT.md             # Project-specific (complements CLAUDE.md)
├── .claude/               # This directory
└── docs/                  # Project documentation
    └── README.md          # Documentation index
```

### Reading Order

1. **CLAUDE.md** - Core universal rules
2. **PROJECT.md** - Project-specific configuration
3. **.claude/WORKFLOW.md** - Development workflow (when doing tasks)
4. **.claude/POLICIES/** - Detailed policies (as needed)

---

## Universal vs Project-Specific

| Type             | Location            | Examples                                        |
| ---------------- | ------------------- | ----------------------------------------------- |
| Universal        | CLAUDE.md, .claude/ | Thinking protocol, TDD, documentation standards |
| Project-specific | PROJECT.md, docs/   | Tech stack, commands, deployment                |

---

## Customization

### Adding Project-Specific Rules

Add to `PROJECT.md`, not to files in `.claude/`.

### Adding Universal Policies

1. Create new file in `.claude/POLICIES/`
2. Link from `CLAUDE.md` or relevant existing policy
3. Keep under 300 lines

### Modifying Hooks

Edit `settings.local.json` to add:

- Automation hooks for common tasks
- Permission rules for Claude Code

---

## Maintenance

### When to Update

- After discovering new patterns that should be universal
- When policies become too long (split them)
- When existing policies are unclear or incomplete

### What NOT to Add Here

- Project-specific configuration (use PROJECT.md)
- Domain-specific documentation (use docs/)
- Temporary or experimental rules

---

## Full Project Structure

This directory fits into the overall project structure:

```
project/
├── README.md              # Project overview (for humans)
├── CLAUDE.md              # Claude Code entry point
├── PROJECT.md             # Project-specific configuration
├── docs/                  # Documentation (standard location)
│   ├── README.md
│   ├── ARCHITECTURE.md
│   ├── PROJECT_CONTEXT.md
│   ├── planning/          # Task management & strategy
│   │   ├── TODO.md
│   │   ├── DONE.md
│   │   ├── BACKLOG.md
│   │   ├── ROADMAP.md
│   │   ├── GOALS.md
│   │   └── MILESTONES.md
│   ├── plans/
│   └── archive/
└── .claude/               # This directory (config & policies)
    ├── POLICIES/
    ├── LANGUAGES/
    └── TEMPLATES/
```

---

_See [../CLAUDE.md](../CLAUDE.md) for core rules._
_See [POLICIES/context-management.md](POLICIES/context-management.md) for size guidelines._
