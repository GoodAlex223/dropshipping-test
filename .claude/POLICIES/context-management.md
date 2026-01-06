# Context Management Policy

Guidelines for managing Claude Code instructions when they become too large or complex.

---

## Core Problem

Large Language Models have limited effective context windows. When instructions become too long:

- Model attention degrades
- Important rules may be ignored
- Quality of output decreases
- Response time increases

This policy defines how to structure and manage instructions to maintain effectiveness.

---

## Recommended File Sizes

| File              | Target      | Maximum    | Action if Exceeded      |
| ----------------- | ----------- | ---------- | ----------------------- |
| CLAUDE.md         | ~300 lines  | 400 lines  | Split to POLICIES/      |
| PROJECT.md        | ~150 lines  | 200 lines  | Split to docs/          |
| Individual policy | ~200 lines  | 300 lines  | Split into sub-policies |
| Total .claude/    | ~1000 lines | 1500 lines | Review and consolidate  |

**Measurement**: Line counts are approximate guides, not hard limits. The goal is maintaining model attention, not hitting exact numbers.

---

## File Hierarchy

Instructions are organized in a hierarchy of importance:

```
PRIORITY 1 (Always Read)
├── CLAUDE.md              # Core rules, abort conditions, thinking protocol
└── PROJECT.md             # Project-specific essentials

PRIORITY 2 (Read for Tasks)
├── .claude/WORKFLOW.md    # Development workflow
└── docs/README.md         # Documentation index

PRIORITY 3 (Read When Relevant)
├── .claude/POLICIES/      # Detailed policies
├── docs/planning/TODO.md           # Active tasks
└── docs/PROJECT_CONTEXT.md # Patterns, decisions

PRIORITY 4 (Reference Material)
├── docs/ARCHITECTURE.md   # System design
├── docs/plans/            # Task plans
└── Domain-specific docs   # As needed
```

---

## Splitting Guidelines

### When to Split

Split instructions when:

- File exceeds recommended size
- Content serves different purposes (rules vs. examples)
- Some content is rarely needed
- Topic is self-contained

### How to Split

1. **Identify the section** to extract
2. **Create new file** in appropriate location:
   - Core policies → `.claude/POLICIES/`
   - Project docs → `docs/`
   - Archived content → `.claude/archive/` or `docs/archive/`
3. **Add link** in original file
4. **Keep summary** in original (1-2 lines max)

### Example Split

**Before** (in CLAUDE.md):

```markdown
## Testing Policy

### TDD Workflow

[50 lines of TDD details]

### Coverage Requirements

[30 lines of coverage details]

### Mocking Guidelines

[40 lines of mocking details]
```

**After** (in CLAUDE.md):

```markdown
## Testing Policy

Follow TDD workflow. See [.claude/POLICIES/testing.md](.claude/POLICIES/testing.md) for details.
```

---

## Link Management

### Required Links in CLAUDE.md

| Section           | Must Link To                          |
| ----------------- | ------------------------------------- |
| Thinking Protocol | .claude/POLICIES/critical-thinking.md |
| Workflow          | .claude/WORKFLOW.md                   |
| Testing           | .claude/POLICIES/testing.md           |
| Documentation     | .claude/POLICIES/documentation.md     |
| Knowledge Sources | .claude/POLICIES/knowledge-sources.md |
| Project Config    | PROJECT.md                            |

### Link Format

Always use relative paths:

```markdown
See [.claude/POLICIES/testing.md](.claude/POLICIES/testing.md)
```

### Broken Link Handling

If Claude encounters a broken link:

1. **STOP** - Do not proceed with assumptions
2. **Report** - Tell user which file is missing
3. **Wait** - User must create the file or update the link

---

## Priority Rules

### When Context is Limited

If you must prioritize which instructions to follow most carefully:

1. **Critical Rules** (Never Skip)
   - Abort conditions
   - Validation requirements
   - English-only communication

2. **Core Process** (Essential)
   - Thinking protocol (at minimum: restate problem, consider alternatives)
   - Plan-Execute-Verify cycle
   - User approval gates

3. **Quality Standards** (Important)
   - Improvement tracking
   - Documentation updates
   - Testing requirements

4. **Style Guidelines** (Flexible)
   - Formatting preferences
   - Naming conventions
   - Comment style

### Minimum Viable Instructions

Even under context pressure, Claude MUST always:

1. ✅ Restate the problem before implementing
2. ✅ Consider at least one alternative
3. ✅ Stop when stuck after 3 attempts
4. ✅ Wait for user approval before destructive actions
5. ✅ Document what was done

---

## Consolidation Guidelines

### When to Consolidate

Consolidate instructions when:

- Multiple files cover overlapping topics
- Policies contradict each other
- Navigation becomes confusing
- Files are rarely accessed separately

### How to Consolidate

1. **Identify overlap** between files
2. **Merge** into single authoritative document
3. **Remove duplicates** - keep only one version
4. **Update links** throughout
5. **Archive** original files if needed

---

## Archiving

### When to Archive

Move to archive when:

- Content is historical only (no active guidance)
- Document hasn't been referenced in 3+ months
- Superseded by newer documentation
- Completed work with no ongoing relevance

### Archive Locations

| Content Type            | Archive Location |
| ----------------------- | ---------------- |
| Old policies            | .claude/archive/ |
| Completed plans         | docs/archive/    |
| Historical project docs | docs/archive/    |

### Archive Process

1. Move file to archive directory
2. Add entry to archive README
3. Remove from active index
4. Update any remaining links

---

## Monitoring Instruction Size

### Periodic Review

Every month (or after major changes), check:

- [ ] CLAUDE.md under 400 lines?
- [ ] PROJECT.md under 200 lines?
- [ ] Individual policies under 300 lines?
- [ ] Total .claude/ under 1500 lines?
- [ ] All links working?
- [ ] No duplicate content?

### Tools for Measurement

```bash
# Count lines in CLAUDE.md
wc -l CLAUDE.md

# Count total lines in .claude/
find .claude -name "*.md" -exec cat {} + | wc -l

# Find large files
find .claude -name "*.md" -exec wc -l {} + | sort -n

# Find potential duplicates (similar content)
grep -r "specific phrase" .claude/
```

---

## Best Practices

### Writing Concise Instructions

1. **Use tables** for structured information
2. **Use bullet points** sparingly (prefer prose)
3. **Link, don't inline** - reference details instead of including them
4. **One concept per section** - split mixed content
5. **Examples separate** - move lengthy examples to dedicated files

### Avoiding Bloat

- Don't repeat instructions across files
- Don't include examples for obvious concepts
- Don't document standard language features
- Don't keep outdated alternatives "for reference"
- Remove TODO comments once implemented

### Maintaining Clarity

- Clear, descriptive headers
- Logical section order
- Cross-references where helpful
- "Last Updated" dates on all documents

---

## Adding New Instructions

When adding new rules or policies:

1. **Check existing files** - Does this belong in an existing document?
2. **Evaluate necessity** - Is this rule actually needed?
3. **Consider placement** - Where in the hierarchy does it belong?
4. **Check total size** - Will this cause overflow?
5. **Add links** - Connect to related content

### Decision Tree for New Content

```
Is this project-specific?
├── YES → Add to PROJECT.md or docs/
└── NO → Continue...

Is this a critical rule?
├── YES → Add to CLAUDE.md
└── NO → Continue...

Is this detailed guidance?
├── YES → Add to .claude/POLICIES/
└── NO → Add to appropriate existing file
```

---

_This policy ensures Claude Code instructions remain effective and manageable._
_See [knowledge-sources.md](knowledge-sources.md) for documentation structure._
