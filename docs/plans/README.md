# Active Plans

Implementation plans for tasks currently in progress.

---

## Creating a Plan

1. Use template: `.claude/TEMPLATES/plan.md`
2. Save as: `YYYY-MM-DD_task-name.md`
3. Fill in all required sections before starting work

### If Created in /root/.claude/plans/

**Immediately copy to this directory.** This is the source of truth.

---

## During Execution

- Mark completed steps with `[x]`
- Add implementation log entries with timestamps
- Document discoveries and deviations
- Update "Files Affected" as changes are made

---

## After Completion

Move to archive when ALL are true:

- [ ] All steps marked `[x]` complete
- [ ] Tests passing
- [ ] "Key Discoveries" filled in
- [ ] "Future Improvements" has 2+ items
- [ ] **Improvements extracted to BACKLOG.md** (categorized appropriately)
- [ ] Summary added to `../planning/DONE.md`

**See [../archive/plans/README.md](../archive/plans/README.md) for complete step-by-step archive process.**

Quick reference:

```bash
mv docs/plans/YYYY-MM-DD_task.md docs/archive/plans/
```

---

## Current Plans

| Plan                     | Task               | Status      | Started    |
| ------------------------ | ------------------ | ----------- | ---------- |
| [example.md](example.md) | [Task description] | In Progress | YYYY-MM-DD |

---

_Template: [../../.claude/TEMPLATES/plan.md](../../.claude/TEMPLATES/plan.md)_
_Archive: [../archive/plans/](../archive/plans/)_
