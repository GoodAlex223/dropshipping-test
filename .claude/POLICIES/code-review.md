# Code Review Policy

Standards for reviewing code changes before merge.

---

## Core Principle

**Every code change benefits from review. Reviews catch bugs, improve design, and share knowledge.**

---

## Review Requirements

### When Review is Required

| Change Type   | Self-Review | Peer Review | Notes                                |
| ------------- | ----------- | ----------- | ------------------------------------ |
| Bug fix       | Required    | Recommended | Critical bugs require peer review    |
| New feature   | Required    | Required    | All new features need peer review    |
| Refactoring   | Required    | Required    | Architecture changes need review     |
| Configuration | Required    | Optional    | Security-related config needs review |
| Documentation | Required    | Optional    | Technical docs benefit from review   |
| Hotfix        | Required    | Post-merge  | Document and review after deployment |

### Self-Review Checklist

Before requesting peer review, verify:

**Functionality**

- [ ] Code does what the task requires
- [ ] Edge cases are handled
- [ ] Error conditions are handled gracefully
- [ ] No debugging code left in (print statements, console.log, etc.)

**Code Quality**

- [ ] Code follows project conventions (see PROJECT.md)
- [ ] No code duplication (DRY)
- [ ] Functions/methods are focused (single responsibility)
- [ ] Names are clear and descriptive
- [ ] Complex logic has comments explaining "why"

**Testing**

- [ ] Tests exist for new functionality
- [ ] Tests pass locally
- [ ] Edge cases have test coverage
- [ ] No skipped tests without documented reason

**Security**

- [ ] No hardcoded secrets or credentials
- [ ] User input is validated
- [ ] SQL/command injection prevented
- [ ] Sensitive data not logged

**Performance**

- [ ] No obvious performance issues
- [ ] Database queries are efficient
- [ ] No unnecessary loops or iterations
- [ ] Resources are properly released

---

## Review Process

### Submitting for Review

1. **Complete self-review** using checklist above
2. **Ensure CI passes** - All automated checks green
3. **Write clear description**:

   ```markdown
   ## Summary

   [What this change does]

   ## Changes

   - [Change 1]
   - [Change 2]

   ## Testing

   [How this was tested]

   ## Related

   - Task: [TODO.md reference or issue]
   - Plan: [Link to plan document]
   ```

4. **Request specific reviewers** if domain expertise needed

### Conducting Review

#### What to Look For

| Category            | Questions to Ask                                          |
| ------------------- | --------------------------------------------------------- |
| **Correctness**     | Does this do what it's supposed to? Are there bugs?       |
| **Design**          | Is this the right approach? Does it fit the architecture? |
| **Readability**     | Can I understand this code? Will others?                  |
| **Maintainability** | Will this be easy to modify in 6 months?                  |
| **Testing**         | Are tests sufficient? Do they test the right things?      |
| **Security**        | Are there vulnerabilities? Is data protected?             |
| **Performance**     | Will this scale? Are there bottlenecks?                   |

#### Review Depth by Risk

| Risk Level                | Review Depth       | Time Budget |
| ------------------------- | ------------------ | ----------- |
| Low (docs, config)        | Quick scan         | 5-10 min    |
| Medium (features)         | Thorough review    | 15-30 min   |
| High (security, data)     | Deep review        | 30-60 min   |
| Critical (auth, payments) | Multiple reviewers | As needed   |

#### Providing Feedback

**Use clear categories:**

```markdown
[MUST] - Blocking issue, must fix before merge
[SHOULD] - Important improvement, strongly recommended
[COULD] - Nice to have, optional improvement
[QUESTION] - Seeking clarification, not necessarily a change
[NITPICK] - Minor style issue, author's discretion
```

**Be specific and constructive:**

```markdown
❌ Bad: "This is wrong"
✅ Good: "[MUST] This will throw NullPointerException when user is None.
Consider adding a null check: `if user is not None:`"

❌ Bad: "Make this better"
✅ Good: "[SHOULD] This loop iterates 3 times over the same list.
Consider combining into a single pass for O(n) instead of O(3n)."
```

**Acknowledge good work:**

- Point out clever solutions
- Recognize good test coverage
- Note improvements to existing code

---

## Review Checklist by Category

### Functionality Review

- [ ] Code accomplishes stated objective
- [ ] Logic is correct
- [ ] Edge cases handled
- [ ] Error handling appropriate
- [ ] No regressions to existing functionality

### Security Review

- [ ] Authentication/authorization correct
- [ ] Input validation present
- [ ] No injection vulnerabilities
- [ ] Sensitive data protected
- [ ] Secrets not exposed
- [ ] HTTPS/encryption used where needed

### Performance Review

- [ ] No N+1 queries
- [ ] Appropriate data structures used
- [ ] No unnecessary computation
- [ ] Caching considered where appropriate
- [ ] Memory leaks prevented
- [ ] Resources closed/released

### Code Quality Review

- [ ] Follows project style guide
- [ ] Clear naming conventions
- [ ] Appropriate abstraction level
- [ ] No dead code
- [ ] Comments where needed (but not excessive)
- [ ] Type hints/annotations present

### Testing Review

- [ ] Unit tests for new code
- [ ] Integration tests where needed
- [ ] Test names describe behavior
- [ ] Tests are deterministic (not flaky)
- [ ] Mocking used appropriately
- [ ] Edge cases covered

### Documentation Review

- [ ] Public APIs documented
- [ ] Complex logic explained
- [ ] README updated if needed
- [ ] Architecture docs updated for significant changes
- [ ] Breaking changes documented

---

## Responding to Review

### As Author

1. **Read all feedback** before responding
2. **Address every comment** - resolve or discuss
3. **Don't take it personally** - reviews improve code
4. **Ask for clarification** if feedback unclear
5. **Thank reviewers** for their time

### Handling Disagreements

```
1. Discuss the technical merits
2. Consider the reviewer's perspective
3. If still disagree, explain your reasoning
4. Escalate to team lead if needed
5. Document the decision either way
```

### Making Changes

- Fix all [MUST] items
- Seriously consider [SHOULD] items
- Use judgment on [COULD] and [NITPICK]
- Re-request review after significant changes

---

## Special Review Types

### Security-Sensitive Changes

Additional requirements:

- [ ] Reviewed by someone with security knowledge
- [ ] Threat model considered
- [ ] Attack vectors evaluated
- [ ] Follows OWASP guidelines

### Database Changes

Additional requirements:

- [ ] Migration tested both directions
- [ ] Performance impact evaluated
- [ ] Backward compatibility verified
- [ ] Rollback plan documented

### API Changes

Additional requirements:

- [ ] Breaking changes identified
- [ ] Versioning considered
- [ ] Documentation updated
- [ ] Client impact assessed

### Configuration Changes

Additional requirements:

- [ ] No secrets in code
- [ ] Environment-specific values externalized
- [ ] Defaults are safe
- [ ] Validation present

---

## Review Metrics

### Healthy Review Indicators

| Metric               | Target                                                 |
| -------------------- | ------------------------------------------------------ |
| Time to first review | < 24 hours                                             |
| Review iterations    | 1-3 rounds                                             |
| Comments per review  | 3-10 (too few = rubber stamp, too many = too large PR) |
| PR size              | < 400 lines changed                                    |

### Warning Signs

- Reviews taking > 48 hours
- Same issues repeatedly found
- Large PRs (> 1000 lines)
- Reviews with 0 comments
- Frequent "LGTM" without substance

---

## Claude's Role in Reviews

When Claude is asked to review code:

1. **Follow this checklist** systematically
2. **Be thorough but constructive**
3. **Categorize feedback** using [MUST]/[SHOULD]/[COULD]
4. **Explain reasoning** for each comment
5. **Suggest specific fixes** where possible
6. **Acknowledge good patterns** observed

When Claude's code is being reviewed:

1. **Accept feedback gracefully**
2. **Make requested changes**
3. **Ask for clarification** if needed
4. **Document decisions** in code comments

---

_See [../WORKFLOW.md](../WORKFLOW.md) for how reviews fit into development workflow._
_See [security.md](security.md) for security-specific review requirements._
