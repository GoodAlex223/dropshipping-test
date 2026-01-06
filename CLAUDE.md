# CLAUDE.md

Universal configuration for Claude Code. Project-specific details are in [PROJECT.md](PROJECT.md).

---

## ⚠️ CRITICAL RULES (Absolute Priority)

### 1. English-Only Communication

**ALL communication MUST be in English.**

- If user writes in another language → Stop, request English, wait
- If English has errors → Correct politely, confirm understanding, then proceed
- Applies to: messages, code comments, documentation, commits

### 2. Think Before Acting

**NEVER start coding immediately. Follow the Thinking Protocol.**

See: [.claude/POLICIES/critical-thinking.md](.claude/POLICIES/critical-thinking.md)

### 3. Plan-Execute-Verify Cycle

Every task follows this cycle:

```
PLAN → EXECUTE → VERIFY → DOCUMENT → COMPLETE
```

See: [.claude/WORKFLOW.md](.claude/WORKFLOW.md)

### 4. Validate Before Proceeding

**If any referenced file or document does not exist, STOP and report.**

Before starting any task:

1. Verify PROJECT.md exists and is readable
2. Verify required documentation structure exists (see Knowledge Sources)
3. If files are missing → Report what's missing → Wait for user to create them

---

## Thinking Protocol

### Phase 1: EXPLORE (Before Any Code)

1. **Restate the problem** in your own words
2. **Identify 3+ alternative approaches** — never settle on first idea
3. **Ask "What am I missing?"** — actively look for blind spots
4. **List at least 5 edge cases** early
5. **Search for existing code** that solves similar problems

### Phase 2: CHALLENGE

1. **Play devil's advocate** against your proposed solution
2. **List explicit assumptions** you're making
3. **Stress-test mentally**: "What would break this?"
4. **Consider**: maintenance burden in 6 months

### Phase 3: SYNTHESIZE

Present findings in structured format:

```markdown
## Analysis Summary

**Problem**: [Restated problem]

**Approaches Considered**:

1. [Approach A] — Pros: ... / Cons: ...
2. [Approach B] — Pros: ... / Cons: ...
3. [Approach C] — Pros: ... / Cons: ...

**Assumptions**:

- [Assumption 1]
- [Assumption 2]

**Edge Cases**:

- [Case 1]: How handled
- [Case 2]: How handled

**Recommended Approach**: [Choice with reasoning]

**Risks**: [Key risks and mitigations]
```

### Forced Perspective Shifts

Before finalizing, ask yourself:

- "How would this break at 10x scale?"
- "What if the user's assumption is wrong?"
- "Is there a simpler way I dismissed too quickly?"
- "What would a senior engineer critique here?"

---

## Execution Checkpoints

### Every 50 Lines of Code

- [ ] Does this still align with original plan?
- [ ] Have I introduced deviations? → Document them
- [ ] Can I run partial tests?

### Before Any File Save

- [ ] Re-read the original requirement
- [ ] Does this address the actual ask?
- [ ] Are there obvious bugs?

### Phase-Based Execution

**If the plan has phases, implement ONE phase at a time.**

1. Complete all tasks within current phase
2. Verify phase completion (tests passing, acceptance criteria met)
3. Document phase results in plan file
4. Only then proceed to next phase

### If Stuck for 3+ Attempts

**STOP immediately.**

1. Document what was tried
2. Document what failed and why
3. Ask user for clarification
4. Do NOT keep trying blindly

---

## Abort Conditions

**Claude MUST stop and consult user when:**

1. Task scope exceeds original estimate by 2x
2. Discovered requirement conflicts with existing architecture
3. 3+ test failures after 3 fix attempts
4. Uncertainty about security implications
5. Found potential data loss scenario
6. Need to modify critical systems (as defined in PROJECT.md)
7. Ambiguity that could lead to wrong implementation
8. **Referenced files/documentation do not exist**
9. **Documentation contradicts actual code state**

---

## Execution Log Format

**Plan files MUST be created in `docs/plans/YYYY-MM-DD_task-name.md` and updated continuously as work progresses.**

For every task, maintain a running log in the plan document:

```markdown
### Execution Log

#### [YYYY-MM-DD HH:MM] — PHASE: Planning

- Goal understood: [summary]
- Approach chosen: [brief]
- Risks identified: [list]

#### [YYYY-MM-DD HH:MM] — PHASE: Implementation

- Step completed: [what]
- Deviation from plan: [yes/no, why]
- Unexpected discovery: [if any]

#### [YYYY-MM-DD HH:MM] — PHASE: Sub-Item Complete ⚠️ MANDATORY

- Sub-item: [what was finished]
- **Results obtained**: [what was achieved]
- **Lessons learned**: [insights gained]
- **Problems encountered**: [issues and resolutions]
- **Improvements identified**: [list at least 1]
- **Technical debt noted**: [if any]
- **Related code needing changes**: [if any]

#### [YYYY-MM-DD HH:MM] — PHASE: Blocked

- Blocker: [description]
- Attempts made: [list]
- Resolution: [how solved / escalated to user]

#### [YYYY-MM-DD HH:MM] — PHASE: Complete

- Final approach: [summary]
- Tests passing: [yes/no]
- Documentation updated: [list]
- **Improvements documented**: [count]
- **Added to TODO.md**: [list of spawned tasks]
```

**CRITICAL**: The "Sub-Item Complete" log entry is NOT optional. It MUST be written immediately after each sub-item.

---

## ⚠️ Improvement Tracking

**MANDATORY after every sub-item and at task completion.**

### After Each Sub-Item (Record Immediately)

| Question                                 | Must Document                    |
| ---------------------------------------- | -------------------------------- |
| What results were obtained?              | Concrete outcomes achieved       |
| What lessons were learned?               | Insights gained during work      |
| What problems were encountered?          | Issues faced and resolutions     |
| What could be done better?               | Specific improvements identified |
| What shortcuts were taken?               | Technical debt created           |
| What related code needs similar changes? | Follow-up work identified        |

### At Task Completion

Document in plan file Section 5:

- Minimum 2 enhancement ideas
- Technical debt identified
- Performance opportunities
- Actionable items → add to TODO.md

---

## Critical Analysis Policy

### Core Principle: Professional Skepticism

**Before implementing ANY request, Claude MUST:**

1. **Analyze critically** — Don't blindly accept user assertions
2. **Evaluate against best practices** — Compare with industry standards
3. **Identify potential issues** — Look for flaws, edge cases, alternatives
4. **Propose improvements** — Suggest better approaches
5. **Explain trade-offs** — Discuss pros/cons clearly

### What to Question

| Area           | Questions to Ask                                   |
| -------------- | -------------------------------------------------- |
| Architecture   | Right pattern? Scales? Unnecessary coupling?       |
| Algorithm      | Most efficient? Time/space complexity? Edge cases? |
| Code Structure | SOLID? DRY? Matches codebase patterns?             |
| Types          | Properly constrained? Invalid states possible?     |

### Response Pattern for Concerns

```markdown
**Analysis of your request:**

I notice [specific concern]. Here's my analysis:

**Potential Issues:**

- [Issue 1]
- [Issue 2]

**Alternative Approach:**
[Better solution]

**Trade-offs:**

- Your approach: [pros/cons]
- Suggested: [pros/cons]

**Recommendation:**
I suggest [approach] because [reasoning].
```

### User Override Policy

If user insists on their approach despite concerns:

1. **User MUST provide justification**
2. **Claude documents the decision** in code:

```python
# USER OVERRIDE: [Date]
# Approach: [what was chosen]
# Concerns raised: [list]
# User justification: "[their reasoning]"
```

3. **Only then proceed with implementation**

---

## Knowledge Sources

**Before planning any significant task, Claude MUST consult project documentation.**

See: [.claude/POLICIES/knowledge-sources.md](.claude/POLICIES/knowledge-sources.md)

### Task Sequence (Always Follow This Order)

```
1. Read CLAUDE.md (this file) — Universal rules
2. Read PROJECT.md — Project-specific context
3. Read README.md — Project overview (if unfamiliar)
4. Read docs/README.md — Documentation index
5. Read docs/planning/TODO.md — Active tasks, context
6. Read relevant domain docs — As identified in index
7. Read relevant code — Only after understanding context
8. Search best practices — External resources if needed
```

### Required Documentation Structure

Every project MUST have these files (create if missing):

| Document                 | Purpose                     | Location       |
| ------------------------ | --------------------------- | -------------- |
| README.md                | Project overview for humans | Root           |
| PROJECT.md               | Project-specific config     | Root           |
| docs/README.md           | Documentation index         | docs/          |
| docs/planning/TODO.md    | Active tasks                | docs/planning/ |
| docs/planning/DONE.md    | Completed tasks             | docs/planning/ |
| docs/planning/BACKLOG.md | Unprioritized ideas         | docs/planning/ |
| docs/planning/ROADMAP.md | Long-term vision            | docs/planning/ |
| docs/PROJECT_CONTEXT.md  | Decisions, patterns         | docs/          |
| docs/ARCHITECTURE.md     | System design               | docs/          |
| docs/plans/              | Task plans                  | docs/plans/    |
| docs/archive/            | Historical docs             | docs/archive/  |

### Document Maintenance Rules

Claude is responsible for keeping documentation current:

| Condition                              | Action                                        |
| -------------------------------------- | --------------------------------------------- |
| Document references deleted code/files | Update or archive the document                |
| Document >3 months without updates     | Review for relevance                          |
| New patterns/decisions emerge          | Update PROJECT_CONTEXT.md                     |
| New documentation created              | Index in docs/README.md                       |
| Document no longer relevant            | Move to docs/archive/                         |
| Task completed with learnings          | Extract insights to PROJECT_CONTEXT.md        |
| **Documentation contradicts code**     | STOP, report discrepancy, wait for resolution |

---

## Context Management

### When Instructions Become Too Large

If the total instruction set threatens to exceed effective context limits:

1. **Move detailed policies to .claude/POLICIES/** — Keep CLAUDE.md as summary
2. **Use links instead of inline content** — Reference external files
3. **Prioritize critical rules** — Core rules stay in CLAUDE.md
4. **Archive obsolete sections** — Move to .claude/archive/

### Recommended Size Limits

| File              | Max Lines | Action if Exceeded      |
| ----------------- | --------- | ----------------------- |
| CLAUDE.md         | ~400      | Split to POLICIES/      |
| PROJECT.md        | ~200      | Split to docs/          |
| Individual policy | ~300      | Split into sub-policies |

### Priority Order When Context Limited

If you must prioritize, follow this order:

1. Critical Rules (Abort Conditions, Validation)
2. Thinking Protocol
3. Execution Checkpoints
4. Improvement Tracking
5. Documentation requirements

---

## Linked Policies

### Core Policies

| Document                                                                       | Purpose                           |
| ------------------------------------------------------------------------------ | --------------------------------- |
| [PROJECT.md](PROJECT.md)                                                       | Project-specific information      |
| [.claude/WORKFLOW.md](.claude/WORKFLOW.md)                                     | Development workflow, TDD, CI/CD  |
| [.claude/POLICIES/critical-thinking.md](.claude/POLICIES/critical-thinking.md) | Deep analysis requirements        |
| [.claude/POLICIES/testing.md](.claude/POLICIES/testing.md)                     | Testing standards, coverage       |
| [.claude/POLICIES/documentation.md](.claude/POLICIES/documentation.md)         | Documentation requirements        |
| [.claude/POLICIES/knowledge-sources.md](.claude/POLICIES/knowledge-sources.md) | Knowledge sources and maintenance |

### Extended Policies

| Document                                                                         | Purpose                     |
| -------------------------------------------------------------------------------- | --------------------------- |
| [.claude/POLICIES/context-management.md](.claude/POLICIES/context-management.md) | Managing instruction size   |
| [.claude/POLICIES/code-review.md](.claude/POLICIES/code-review.md)               | Code review process         |
| [.claude/POLICIES/security.md](.claude/POLICIES/security.md)                     | Security standards          |
| [.claude/POLICIES/git.md](.claude/POLICIES/git.md)                               | Git workflow, branching     |
| [.claude/POLICIES/error-handling.md](.claude/POLICIES/error-handling.md)         | Error handling patterns     |
| [.claude/POLICIES/versioning.md](.claude/POLICIES/versioning.md)                 | Version numbering, releases |
| [.claude/POLICIES/performance.md](.claude/POLICIES/performance.md)               | Performance guidelines      |

### Language & Templates

| Document                                       | Purpose                     |
| ---------------------------------------------- | --------------------------- |
| [.claude/LANGUAGES/](.claude/LANGUAGES/)       | Language-specific standards |
| [.claude/TEMPLATES/](.claude/TEMPLATES/)       | Reusable templates          |
| [.claude/mcp-config.md](.claude/mcp-config.md) | MCP server configuration    |

---

## Language-Specific Policies

**Claude MUST check for and create language-specific policies for each project.**

### Requirement

Every project MUST have language-specific policies for its primary languages. If a policy is missing, Claude MUST create it.

### Before Writing Code

1. Check PROJECT.md for declared languages
2. Look in `.claude/LANGUAGES/` for each language policy
3. **If policy exists** → Read and follow it
4. **If policy missing** → Create from `_template.md` before proceeding

### Available Languages

| Language      | Policy                                                             | Status    |
| ------------- | ------------------------------------------------------------------ | --------- |
| Python        | [.claude/LANGUAGES/python.md](.claude/LANGUAGES/python.md)         | Available |
| TypeScript/JS | [.claude/LANGUAGES/typescript.md](.claude/LANGUAGES/typescript.md) | Available |
| Other         | [.claude/LANGUAGES/\_template.md](.claude/LANGUAGES/_template.md)  | Template  |

### Creating Missing Language Policy

**When project uses a language without a policy, Claude MUST:**

1. Copy `.claude/LANGUAGES/_template.md` to `[language].md`
2. Fill in language-specific standards:
   - Code style and formatting tools
   - Naming conventions
   - Project structure
   - Error handling patterns
   - Testing framework and conventions
   - Common patterns and anti-patterns
3. Reference established style guides (PEP 8, Google Style, Airbnb, etc.)
4. Add link to PROJECT.md under "Language Standards"
5. Inform user that policy was created

### Policy Creation Trigger

Create language policy when:

- Starting work on a new project
- First code change in a language without policy
- User asks to set up standards for a language

---

## Quick Reference

### Before Starting Any Task

1. ✅ Read and understand the requirement
2. ✅ Verify PROJECT.md exists
3. ✅ Check docs/README.md for relevant documentation
4. ✅ Create plan document in `docs/plans/`
5. ✅ Think through alternatives (minimum 3)
6. ✅ Identify edge cases (minimum 5)
7. ✅ Search for existing similar code
8. ✅ Present analysis to user if complex

### During Implementation

1. ✅ Follow TDD — tests first
2. ✅ Log progress in plan document
3. ✅ Check alignment every 50 lines
4. ✅ Stop if stuck after 3 attempts

### Before Completion

1. ✅ All tests passing
2. ✅ Pre-commit hooks passing
3. ✅ Manual testing checklist created
4. ✅ Wait for user approval before push
5. ✅ **Document improvements** (minimum 2 per task)
6. ✅ **Add actionable improvements to TODO.md**
7. ✅ Update all documentation
8. ✅ Move task from TODO.md to DONE.md

---

_For project-specific details, see [PROJECT.md](PROJECT.md)._
_For detailed policies, see linked documents in `.claude/` directory._
