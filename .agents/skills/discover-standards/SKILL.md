---
name: discover-standards
description: 'Extract tribal knowledge from the codebase into concise, Diataxis-tagged reference standards in docs/reference/. Use when the user wants to document coding patterns, conventions, or opinionated choices so other agents can inject them during planning and implementation. Requires the Diataxis domain-docs layout (docs/agents/domain.md declaring diataxis) — has no target under the flat CONTEXT.md model.'
---

# Discover Standards

Extract tribal knowledge from the codebase into concise, documented standards in `docs/reference/`.

Requires the Diataxis domain-docs layout — check `docs/agents/domain.md`. If this repo uses the flat `CONTEXT.md`/`docs/adr/` layout instead, stop and tell the user: standards discovery has no home under that model. Domain vocabulary already belongs in `CONTEXT.md` via `/domain-modeling`, and there's no `docs/reference/` folder to write into. Switch domain-docs layouts first (re-run `/setup-my-skills`) if standards discovery is wanted.

## Important Guidelines

- **Always use AskUserQuestion tool** when asking the user anything
- **Write concise standards** — Every word costs tokens. Standards are injected into AI context windows.
- **Offer suggestions** — Present options the user can confirm, choose between, or correct.

## Process

### Step 1: Surface Existing Standards

Run docs-discovery on `docs/reference/` to see what is already documented:

```bash
npx tsx .claude/skills/docs-discovery/scripts/discover.ts docs/reference
```

If the script is unavailable, fall back to:

```bash
find docs/reference -name '*.md' | sort
```

Use the result to:
- Avoid suggesting standards that already exist
- Offer to update/extend an existing file rather than creating a duplicate
- Show the user what's already covered when they pick an area

### Step 2: Determine Focus Area

Check if the user specified an area. If they did, skip to Step 3.

If no area was specified:

1. Analyze the codebase structure (folders, file types, patterns)
2. Identify 3–5 major areas. Examples:
   - **Frontend:** UI components, styling/CSS, state management, forms, routing
   - **Backend:** Server actions, database/models, authentication, background jobs
   - **Cross-cutting:** Error handling, validation, testing, naming conventions
3. Use AskUserQuestion to present the areas, noting which already have standards:

```
I've identified these areas in your codebase:

1. **Server Actions** (src/app/) — Request handling, auth, result types [already has: actions/server-action-anatomy]
2. **Database** (src/lib/data/) — Repositories, queries, soft-delete
3. **React Components** (src/components/) — UI patterns, props, state [already has: components/component-blueprint, components/compound-components]
4. **Authentication** (src/lib/auth/) — Login, sessions, permissions

Which area should we focus on? (Pick one, or suggest a different area)
```

Wait for user response before proceeding.

### Step 3: Analyze & Present Findings

Once an area is determined:

1. Read 5–10 representative files in that area
2. Also read any existing standard files in `docs/reference/` for this area (from Step 1)
3. Look for patterns that are:
   - **Unusual or unconventional** — Not standard framework/library patterns
   - **Opinionated** — Specific choices that could have gone differently
   - **Tribal** — Things a new developer wouldn't know without being told
   - **Consistent** — Patterns repeated across multiple files
4. Exclude patterns already documented in existing standards

Use AskUserQuestion to present findings:

```
I analyzed [area] and found these patterns worth documenting (excluding what's already covered):

1. **Repository Pattern** — All DB access goes through repository files, never direct prisma calls in actions
2. **Soft-delete filter** — Every query must include `deletedAt: null`
3. **Error union type** — Server actions return `{ success: true } | { success: false; error }` — never throw

Which would you like to document?

Options:
- "Yes, all of them"
- "Just 1 and 3"
- "Add: [your suggestion]"
- "Skip this area"
```

Wait for user selection before proceeding.

### Step 4: Ask Why, Then Draft Each Standard

**IMPORTANT:** For each selected standard, complete this full loop before moving to the next:

1. **Ask 1–2 clarifying questions** about the "why" behind the pattern (use AskUserQuestion)
2. **Wait for user response**
3. **Draft the standard** incorporating their answer
4. **Confirm with user** before creating the file
5. **Create the file** if approved

Example questions to ask (adapt per standard):
- "What problem does this pattern solve? Why not use the default approach?"
- "Are there exceptions where this shouldn't apply?"
- "What's the most common mistake a developer or agent makes with this?"

**Do NOT batch all questions upfront.** One standard at a time through the full loop.

### Step 5: Create the Standard File

For each standard (after completing Step 4's Q&A):

1. Determine the appropriate folder (create if needed):
   - `actions/`, `database/`, `components/`, `css/`, `forms/`, `testing/`, `global/`
2. Check if a related file already exists — append to it if so
3. Draft with Diataxis frontmatter and use AskUserQuestion to confirm:

```
Here's the draft for database/soft-delete.md:

---
---
name: "Soft-delete filter"
description: "Every Prisma query must include deletedAt: null — records are never hard-deleted."
kind: reference
status: current
last_reviewed: 2026-04-30
tags: [database, prisma, soft-delete]
---

# Soft-delete filter

Every Prisma query must include `deletedAt: null`.

\`\`\`ts
prisma.recipe.findMany({ where: { deletedAt: null } })
\`\`\`

- Records are never hard-deleted — always set `deletedAt` instead
- Omitting the filter is a silent bug: soft-deleted records silently appear in results
---

Create this file? (yes / edit: [your changes] / skip)
```

4. Create or update the file in `docs/reference/[folder]/`
5. Repeat Steps 4–5 for the next selected standard

### Step 6: Offer to Continue

Use AskUserQuestion:

```
Standards created for [area]:
- database/soft-delete.md
- database/repository-pattern.md

Would you like to discover standards in another area, or are we done?
```

---

## Output Location

Standards: `docs/reference/[folder]/[standard].md`

---

## Writing Concise Standards

Every word costs tokens. Follow these rules:

- **Lead with the rule** — State what to do first, explain why second (if needed)
- **Use code examples** — Show, don't tell
- **Skip the obvious** — Don't document what the code already makes clear
- **One standard per concept** — Don't combine unrelated patterns
- **Bullet points over paragraphs** — Scannable beats readable

**Frontmatter is required on every standard file:**

```yaml
---
name: "Human-readable title"
description: "One sentence — used by inject-standards for matching and by docs-discovery for ranking."
kind: reference
status: current
last_reviewed: YYYY-MM-DD   # today's date
tags: [area, technology, pattern]
---
```

**Good standard:**
```markdown
# Error Responses

Use error codes: `AUTH_001`, `DB_001`, `VAL_001`

\`\`\`json
{ "success": false, "error": { "code": "AUTH_001", "message": "..." } }
\`\`\`

- Always include both code and message
- Log full error server-side, return safe message to client
```

**Bad standard:**
```markdown
# Error Handling Guidelines

When an error occurs in our application, we have established a consistent pattern...
[continues for 3 more paragraphs]
```
