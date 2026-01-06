# Archived Plans

Completed implementation plans.

---

## What Goes Here

Plans are moved here after ALL of the following are true:

1. ✅ All implementation steps marked complete
2. ✅ All tests passing
3. ✅ "Key Discoveries" section filled in
4. ✅ "Future Improvements" section has minimum 2 items
5. ✅ Improvements extracted to BACKLOG.md
6. ✅ Task summary added to `docs/planning/DONE.md`

---

## File Naming

Keep original filename: `YYYY-MM-DD_task-name.md`

---

## Complete Archive Process

### Step 1: Verify Plan Completion

Before archiving, confirm ALL criteria above are met:

- [ ] All implementation steps marked `[x]` complete
- [ ] All tests passing
- [ ] "Key Discoveries" section is filled in
- [ ] "Future Improvements" section has **minimum 2 items**
- [ ] Execution log contains "Sub-Item Complete" entries for all sub-items

### Step 2: Extract Improvements to BACKLOG.md

Review the plan's "Future Improvements" and "Key Discoveries" sections:

1. **Open** [../../planning/BACKLOG.md](../../planning/BACKLOG.md)
2. **Categorize each improvement** into the appropriate section:
   - **Feature Ideas** → New functionality concepts
   - **Enhancements** → Improvements to existing features
   - **Technical Debt** → Issues to address later
   - **Research Topics** → Areas needing investigation
3. **Add entries** with Value/Effort estimates and source ("Plan: YYYY-MM-DD_task-name")
4. **Update** the "Last Updated" date in BACKLOG.md

### Step 3: Add Summary to DONE.md

1. **Open** [../../planning/DONE.md](../../planning/DONE.md)
2. **Add entry** under the current month section:

```markdown
### [Date] - [Task Name]

**Task Reference**: TODO.md TASK-XXX
**Plan Document**: [docs/archive/plans/YYYY-MM-DD_task.md](../archive/plans/YYYY-MM-DD_task.md)
**Duration**: [Actual time]

**Implementation**:
[Brief description of what was actually done]

**Key Decisions**:

- [Decision 1]: [Why]

**Lessons Learned**:

- [Lesson from the plan]

**Follow-up Tasks**:

- [Link to any new TODO.md items spawned]
```

1. **Update** the "Last Updated" date

### Step 4: Move Plan to Archive

```bash
# Move completed plan from active to archive
mv docs/plans/YYYY-MM-DD_task-name.md docs/archive/plans/

# Also delete .claude/plans/ copy if exists
rm .claude/plans/YYYY-MM-DD_task-name.md
```

### Step 5: Update Documentation Index

1. **Update** [../plans/README.md](../plans/README.md) — remove from "Current Plans" table
2. **Update** [../README.md](../README.md) — add to "Completed Plans" table
3. **Update** [../../README.md](../../README.md) — if plan was listed in "Implementation Plans"

---

## Quick Checklist

```text
□ Plan completion verified (all steps done, tests pass)
□ Improvements extracted to BACKLOG.md (categorized appropriately)
□ Summary added to DONE.md (with lessons learned)
□ Plan moved to docs/archive/plans/
□ .claude/plans/ copy deleted (if exists)
□ docs/plans/README.md updated
□ docs/archive/README.md updated
```

---

## Finding Plans

To find a specific archived plan:

- By date: Look for files starting with date
- By feature: Use `grep -r "keyword" docs/archive/plans/`

---

_Archived plans serve as historical reference for decisions and patterns._
