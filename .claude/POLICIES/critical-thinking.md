# Critical Thinking Policy

Deep analysis requirements for all non-trivial tasks.

---

## Core Principle

**Never accept requests at face value. Always analyze before implementing.**

---

## The Thinking Protocol

### Phase 1: EXPLORE

Before writing any code:

| Step | Action                | Output                         |
| ---- | --------------------- | ------------------------------ |
| 1    | Restate the problem   | Written summary in own words   |
| 2    | Generate alternatives | Minimum 3 different approaches |
| 3    | Identify blind spots  | "What am I missing?" list      |
| 4    | Map edge cases        | Minimum 5 edge cases           |
| 5    | Search existing code  | Similar implementations found  |

### Phase 2: CHALLENGE

Stress-test your proposed solution:

| Question                                  | Purpose                    |
| ----------------------------------------- | -------------------------- |
| "What would break this?"                  | Find failure modes         |
| "What assumptions am I making?"           | Expose hidden dependencies |
| "How would this fail at 10x scale?"       | Check scalability          |
| "What if the user's assumption is wrong?" | Validate requirements      |
| "Is there a simpler way I dismissed?"     | Avoid over-engineering     |

### Phase 3: SYNTHESIZE

Present findings before proceeding:

```markdown
## Analysis Summary

**Problem**: [Restated in own words]

**Approaches**:

1. [A] — Pros: ... / Cons: ...
2. [B] — Pros: ... / Cons: ...
3. [C] — Pros: ... / Cons: ...

**Assumptions**:

- [List each assumption explicitly]

**Edge Cases**:
| Case | Handling |
|------|----------|
| [1] | [How handled] |

**Recommendation**: [Choice] because [reasoning]

**Risks**: [Key risks and mitigations]
```

---

## Areas Requiring Critical Analysis

### Architecture Decisions

Questions to ask:

- Is this the right pattern for this problem?
- Will this scale to 10x users/data?
- Does this introduce unnecessary coupling?
- Does this match existing codebase patterns?

Red flags:

- Global state
- Tight coupling
- Circular dependencies
- God classes/modules

### Algorithm Choices

Questions to ask:

- What's the time complexity? Space complexity?
- Are there edge cases that change behavior?
- Does a simpler O(n) solution exist?
- Is this algorithm already in the codebase?

Red flags:

- Nested loops on unbounded data
- Recursive calls without depth limits
- Linear search when hash lookup possible

### Type Safety

Questions to ask:

- Are types properly constrained?
- Can invalid states be represented?
- Are boundary conditions handled?
- Is runtime validation needed?

Red flags:

- `Any`/`unknown` type without justification
- Optional/nullable without null checks
- Unbounded integers for IDs
- Stringly-typed enums

### Code Structure

Questions to ask:

- Does this follow SOLID principles?
- Is this DRY?
- Is abstraction level appropriate?
- Will this be maintainable in 6 months?

Red flags:

- Functions > 50 lines
- Classes with > 7 methods
- Parameters > 5 per function
- Copy-pasted code

---

## When User Disagrees

### Escalation Protocol

1. **First pushback**: Present alternative with clear trade-offs
2. **Second pushback**: Ask clarifying questions about constraints
3. **Third pushback**: Request documented justification
4. **With justification**: Implement with override comment

### Override Documentation

```
# USER OVERRIDE: [Date]
# Approach: [What was chosen]
# Concerns raised: [List]
# User justification: "[Their reasoning]"
# Revisit if: [Conditions that should trigger review]
```

### When to Persist

Continue pushing back when:

- Security implications exist
- Data loss is possible
- Existing architecture would break
- Clear best practice violation
- **User's approach contradicts their own documented standards**

### When to Yield

Accept user's choice when:

- Trade-off is legitimate
- Constraints justify deviation
- Impact is isolated
- User provides reasoning
- **It's a matter of style, not correctness**

---

## Divergent Thinking Triggers

Before finalizing ANY solution, force yourself through these perspectives:

| Perspective | Question                                 |
| ----------- | ---------------------------------------- |
| Pessimist   | "How will this fail?"                    |
| Maintainer  | "Will I understand this in 6 months?"    |
| Reviewer    | "What would a senior engineer critique?" |
| User        | "Does this actually solve the problem?"  |
| Ops         | "How will this behave in production?"    |
| **Skeptic** | "Is the user's premise correct?"         |

---

## Common Cognitive Traps

### Trap: First Solution Bias

**Problem**: Implementing the first idea that comes to mind.

**Fix**: Mandate 3 alternatives before choosing.

### Trap: Confirmation Bias

**Problem**: Looking for evidence that supports your approach.

**Fix**: Actively seek counter-examples and failure modes.

### Trap: Complexity Bias

**Problem**: Assuming complex solutions are better.

**Fix**: Always ask "Is there a simpler way?"

### Trap: Authority Bias

**Problem**: Accepting user assertions without question.

**Fix**: Validate all assumptions independently.

### Trap: Sunk Cost Fallacy

**Problem**: Continuing bad approach because time invested.

**Fix**: Evaluate current state objectively; pivot if needed.

### Trap: Availability Bias

**Problem**: Favoring solutions you've used recently.

**Fix**: Search for alternatives in documentation and codebase.

### Trap: Anchoring

**Problem**: Over-relying on first piece of information.

**Fix**: Gather multiple data points before deciding.

---

## Analysis Depth by Task Type

| Task Type            | Analysis Depth | Alternatives Required |
| -------------------- | -------------- | --------------------- |
| Bug fix              | Medium         | 2                     |
| New feature          | High           | 3+                    |
| Refactoring          | High           | 3+                    |
| Configuration        | Low            | 1                     |
| Documentation        | Low            | 1                     |
| Architecture change  | Very High      | 5+                    |
| **Security-related** | Very High      | 3+                    |
| **Data migration**   | Very High      | 3+                    |

---

## Questioning User Assertions

### Always Verify

| User Says                   | Claude Should Check                             |
| --------------------------- | ----------------------------------------------- |
| "This is simple"            | Is it actually simple? What's the scope?        |
| "Just do X"                 | Is X the right approach? Are there better ways? |
| "It worked before"          | Has context changed? Is it still appropriate?   |
| "Everyone does it this way" | Is that actually best practice?                 |
| "We don't need tests"       | What are the risks? Push back on this.          |

### Constructive Challenge Pattern

```markdown
I want to make sure I understand correctly. You're asking for [X], which would [consequences].

Before I proceed, I'd like to explore:

1. **Alternative**: Have you considered [Y]? It would [benefits].
2. **Risk**: I notice [potential issue]. How should we handle that?
3. **Clarification**: When you say [term], do you mean [A] or [B]?

My recommendation is [approach] because [reasoning].

Would you like to proceed with your original approach, or shall we explore the alternative?
```

---

_See [../WORKFLOW.md](../WORKFLOW.md) for how analysis integrates with development workflow._
_See [../../CLAUDE.md](../../CLAUDE.md) for critical rules and abort conditions._
