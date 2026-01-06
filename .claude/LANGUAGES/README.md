# Language-Specific Policies

Language-specific coding standards and best practices.

---

## Overview

This directory contains language-specific policies that supplement the universal policies in `.claude/POLICIES/`.

**Every project MUST have policies for its primary languages. If missing, Claude MUST create them.**

---

## Available Policies

| Language              | File                           | Status      |
| --------------------- | ------------------------------ | ----------- |
| Python                | [python.md](python.md)         | Available   |
| TypeScript/JavaScript | [typescript.md](typescript.md) | Available   |
| Go                    | Create from template           | Not created |
| Rust                  | Create from template           | Not created |
| [Other]               | [\_template.md](_template.md)  | Template    |

---

## Mandatory Policy Creation

### When to Create

Claude MUST create a language policy when:

1. **New project setup** — Create policies for all declared languages
2. **First code in language** — Before writing first line of code in a new language
3. **Policy missing** — If writing code and no policy exists for that language
4. **User request** — When user asks to establish standards

### How to Create

1. Copy `_template.md` to `[language].md`
2. Fill in ALL sections:
   - Code style (formatter, linter)
   - Naming conventions
   - Project structure
   - Type system (if applicable)
   - Error handling patterns
   - Testing framework and conventions
   - Documentation format
   - Common patterns
   - Anti-patterns to avoid
   - Tool summary
3. Reference established style guides
4. Add link to PROJECT.md
5. Inform user that policy was created

### Policy Quality Standards

A language policy MUST include:

- [ ] Formatting tool configuration
- [ ] Linting configuration
- [ ] Naming conventions table
- [ ] Example project structure
- [ ] Error handling examples
- [ ] Test structure example
- [ ] At least 3 common patterns
- [ ] At least 3 anti-patterns

---

## For Existing Projects

When starting work on an existing project:

1. Review PROJECT.md for declared languages
2. Check which language policies exist
3. **Create missing policies** based on existing code patterns
4. Document any established conventions found in code

---

## Policy Structure

Each language policy should cover:

1. **Code Style** - Formatting, naming conventions
2. **Project Structure** - Directory organization, module layout
3. **Dependencies** - Package management, version constraints
4. **Type System** - Type annotations, strict mode settings
5. **Error Handling** - Language-specific patterns
6. **Testing** - Framework, conventions, coverage
7. **Documentation** - Docstring format, comments
8. **Common Patterns** - Idiomatic code patterns
9. **Anti-Patterns** - What to avoid
10. **Tools** - Linters, formatters, checkers

---

## Integration with PROJECT.md

After creating a language policy, add reference in PROJECT.md:

```markdown
## Language Standards

This project follows:

- [Python standards](.claude/LANGUAGES/python.md)
- [TypeScript standards](.claude/LANGUAGES/typescript.md)
```

---

## Claude's Responsibility

**Before writing any code:**

1. **Check PROJECT.md** for declared languages
2. **Verify policies exist** for each language
3. **Create missing policies** — Do not proceed without them
4. **Follow policies** when writing code
5. **Update policies** when new patterns emerge

---

_Language policies supplement, don't replace, universal policies._
