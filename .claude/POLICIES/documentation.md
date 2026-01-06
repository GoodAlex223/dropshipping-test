# Documentation Policy

Requirements for maintaining project documentation and knowledge preservation.

---

## Core Principle

**Every task generates knowledge. Knowledge must be captured before it's lost.**

---

## Document Types

| Document           | Purpose                        | Location                        |
| ------------------ | ------------------------------ | ------------------------------- |
| Plan documents     | Task execution log             | `docs/plans/YYYY-MM-DD_task.md` |
| TODO.md            | Pending tasks                  | `docs/`                         |
| DONE.md            | Completed tasks                | `docs/`                         |
| PROJECT_CONTEXT.md | Architecture decisions         | `docs/`                         |
| CLAUDE.md          | AI assistant rules (universal) | Root                            |
| PROJECT.md         | Project-specific config        | Root                            |
| ARCHITECTURE.md    | System design                  | `docs/`                         |
| README.md          | Documentation index            | `docs/`                         |

---

## Plan Documents

### When Required

**Every significant task must have a plan document.**

A task is "significant" if it:

- Modifies more than one file
- Implements new functionality
- Fixes a non-trivial bug
- Involves architectural decisions

### Creation

Before starting any significant task:

```markdown
# [Task Name] - Implementation Plan

**Task Reference**: TODO.md Section X.Y.Z
**Created**: YYYY-MM-DD
**Status**: Planning
**Last Updated**: YYYY-MM-DD

## 1. Task Overview

**Goal**: [What]
**Context**: [Why]
**Success Criteria**: [How we know it's done]

## 2. Initial Plan

**Approach**: [Strategy]
**Steps**: [Numbered list]
**Files Affected**: [List]
**Risks**: [Potential issues]

## 3. Implementation Log

[Updated during execution]

## 4. Key Discoveries

[Filled after completion]

## 5. Future Improvements

[MANDATORY - filled during and after]
```

### During Execution

Log each significant action:

```markdown
### [YYYY-MM-DD HH:MM] - [Activity]

**Done**: [Description]
**Decisions**: [Choices made]
**Discoveries**: [New information]
**Challenges**: [Problems solved]
```

### After Completion

Add discoveries section:

```markdown
## 4. Key Discoveries

**Technical Insights**:

- [Insight]: [Explanation]

**Architectural Decisions**:

- [Decision]: [Rationale, alternatives considered]

**Patterns Identified**:

- [Pattern]: [When to use]

**Anti-Patterns Avoided**:

- [Anti-pattern]: [Why bad]
```

---

## ⚠️ Improvement Tracking (MANDATORY)

### Core Principle

**Every sub-item and every completed task MUST generate improvement ideas.**

This is not optional. Improvement documentation is as important as the implementation itself.

**CRITICAL: Record improvements IMMEDIATELY after each sub-item completes. Do NOT batch until task end.**

### After Each Sub-Item (Record Immediately)

**Stop and update the plan file with:**

| Field                            | What to Record                |
| -------------------------------- | ----------------------------- |
| Results obtained                 | Concrete outcomes achieved    |
| Lessons learned                  | Insights and knowledge gained |
| Problems encountered             | Issues faced and resolutions  |
| What could be done better?       | Specific improvement ideas    |
| What shortcuts were taken?       | Technical debt created        |
| What related code needs changes? | Follow-up tasks identified    |

**Format in plan file:**

```markdown
#### [YYYY-MM-DD HH:MM] — PHASE: Sub-Item Complete

- Sub-item: [what was finished]
- **Results obtained**: [achievements]
- **Lessons learned**: [insights]
- **Problems encountered**: [issues and resolutions]
- **Improvements identified**: [list]
- **Technical debt noted**: [if any]
- **Related code needing changes**: [if any]
```

### At Task Completion

**Minimum requirements:**

- [ ] 2+ enhancement ideas documented
- [ ] Technical debt identified and logged
- [ ] Performance opportunities noted
- [ ] Actionable items added to TODO.md

### Improvement Categories

```markdown
## 5. Future Improvements

### Enhancement Ideas (minimum 2)

| Idea | Rationale | Effort | Priority |
| ---- | --------- | ------ | -------- |
| [1]  | [Why]     | H/M/L  | H/M/L    |
| [2]  | [Why]     | H/M/L  | H/M/L    |

### Technical Debt

| Item | Why It Exists | Impact | Remediation |
| ---- | ------------- | ------ | ----------- |
| [1]  | [Reason]      | H/M/L  | [Approach]  |

### Performance Optimizations

| Area | Current State | Potential Gain | Effort |
| ---- | ------------- | -------------- | ------ |
| [1]  | [Now]         | [Improvement]  | H/M/L  |

### Spawned Tasks

| Task | Origin | Priority | Added to TODO.md |
| ---- | ------ | -------- | ---------------- |
| [1]  | [Step] | H/M/L    | [ ] Yes / [ ] No |
```

### Propagation to TODO.md

**All actionable improvements MUST be added to TODO.md:**

```markdown
### [ID] - [Improvement Title]

**Origin**: docs/plans/YYYY-MM-DD_task.md
**Spawned from**: [Original task]
**Priority**: H/M/L
**Description**: [What to improve and why]
```

### Why This Matters

- Captures insights while fresh in context
- Prevents knowledge loss between sessions
- Creates continuous improvement pipeline
- Documents technical debt explicitly
- Makes future work visible and plannable

---

## Task Completion Checklist

Before marking ANY task complete:

### Documentation Updates

- [ ] Task removed from TODO.md
- [ ] Task added to DONE.md with implementation details
- [ ] Plan document marked complete
- [ ] Architectural decisions added to PROJECT_CONTEXT.md
- [ ] New patterns/policies added to relevant docs (if applicable)
- [ ] docs/README.md updated (if new docs created)

### Verification

- [ ] All tests passing
- [ ] Pre-commit hooks passing
- [ ] Manual testing approved
- [ ] Code reviewed against policies

---

## TODO.md Format

```markdown
## [Category]

### [Task ID] - [Task Name]

**Priority**: High | Medium | Low
**Estimated effort**: [Hours/Days]
**Dependencies**: [Other tasks]
**Description**: [What needs to be done]
**Acceptance criteria**:

- [ ] [Criterion 1]
- [ ] [Criterion 2]
```

---

## DONE.md Format

```markdown
## [Date] - [Task Name]

**Task Reference**: TODO.md [ID]
**Plan Document**: [Link]
**Duration**: [Actual time]

**Implementation**:
[Brief description of what was actually done]

**Key Decisions**:

- [Decision 1]: [Why]

**Lessons Learned**:

- [Lesson]

**Follow-up Tasks**:

- [If any spawned new tasks]
```

---

## docs/README.md Format

The documentation index MUST list all project documentation:

```markdown
# Documentation Index

**Last Updated**: YYYY-MM-DD

## Planning & Tasks

| Document                                   | Purpose          | Last Updated |
| ------------------------------------------ | ---------------- | ------------ |
| [planning/TODO.md](planning/TODO.md)       | Active tasks     | YYYY-MM-DD   |
| [planning/DONE.md](planning/DONE.md)       | Completed tasks  | YYYY-MM-DD   |
| [planning/ROADMAP.md](planning/ROADMAP.md) | Long-term vision | YYYY-MM-DD   |

## Architecture

| Document                                 | Purpose             | Last Updated |
| ---------------------------------------- | ------------------- | ------------ |
| [ARCHITECTURE.md](ARCHITECTURE.md)       | System design       | YYYY-MM-DD   |
| [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) | Decisions, patterns | YYYY-MM-DD   |

## Domain Documentation

| Document                   | Purpose     | Last Updated |
| -------------------------- | ----------- | ------------ |
| [path/doc.md](path/doc.md) | Description | YYYY-MM-DD   |

## Implementation Plans

| Plan                                           | Task        | Status          |
| ---------------------------------------------- | ----------- | --------------- |
| [YYYY-MM-DD_task.md](plans/YYYY-MM-DD_task.md) | Description | Complete/Active |

## Archive

See [archive/README.md](archive/README.md) for historical documents.
```

---

## Code Documentation

### Function/Method Documentation

Required for all public functions:

```python
def calculate_score(
    tags: List[str],
    preferences: Dict[str, float]
) -> float:
    """
    Calculate recommendation score for a post.

    Args:
        tags: Post tags to evaluate
        preferences: User preference weights by tag

    Returns:
        Score between 0.0 and 1.0

    Raises:
        ValueError: If tags is empty

    Example:
        >>> calculate_score(["cat", "dog"], {"cat": 0.8})
        0.8
    """
```

### Inline Comments

Use for non-obvious code:

```python
# Sort by score descending, then by date for ties
# This ensures consistent ordering across runs
posts.sort(key=lambda p: (-p.score, p.date))
```

### Override Comments

When user overrides Claude recommendation:

```python
# USER OVERRIDE: 2025-01-15
# Approach: Using global variable
# Concerns: Thread safety, testing difficulty
# Justification: "Single-threaded app, refactor scope too large"
# Revisit: v2.0 migration
global_state = {}
```

### Manual Testing Fix Comments

When fixing issues found during testing:

```python
# Manual testing fix (2025-01-15): Handle empty input
# Found during testing: crash when user sends empty message
# Root cause: No null check before accessing .text
if not message or not message.text:
    return
```

---

## Commit Messages

Format:

```
[type]: [Short description]

[Body: What and why, not how]

Refs: #[issue] or TODO.md [section]
```

Types:

- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructuring
- `docs`: Documentation only
- `test`: Test changes
- `chore`: Maintenance

Example:

```
feat: Add post filtering by rating

Implements rating filter for recommendation engine.
Users can now filter posts by safe/questionable/explicit.

- Added filter_by_rating() to PostList
- Updated recommendation algorithm to apply filter
- Added tests for all rating types

Refs: TODO.md 2.3.1
```

---

## Knowledge Propagation

When completing a task, evaluate what should propagate:

| Discovery Type              | Propagate To            |
| --------------------------- | ----------------------- |
| Architectural decision      | PROJECT_CONTEXT.md      |
| New development pattern     | CLAUDE.md or PROJECT.md |
| Reusable code pattern       | Code comments + docs    |
| Bug fix pattern             | Regression test + docs  |
| Project-specific convention | PROJECT.md              |

---

## Timestamps

Always include timestamps on:

- Plan document creation/updates
- Decision records
- Override comments
- Manual testing fixes
- "Last Updated" in all docs

Format: `YYYY-MM-DD` or `YYYY-MM-DD HH:MM` for precision.

---

_See [../WORKFLOW.md](../WORKFLOW.md) for how documentation integrates with development phases._
_See [knowledge-sources.md](knowledge-sources.md) for document structure and maintenance._
