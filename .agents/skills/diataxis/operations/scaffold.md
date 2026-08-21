# Scaffold Operation

**When**: User wants to create a Diataxis documentation structure for the repo root or for a package subdirectory.

## Purpose

Creates the standard four-quadrant directory structure with README templates. Adapt the generated content to fit the project's actual scope and toolchain — see `docs/agents/diataxis-context.md`.

## Execution

### Step 1: Determine Target Location

Ask (or infer from arguments) whether scaffolding is for:

1. **Repo root** → `docs/`
2. **A specific package** → `<pkg>/docs/` (e.g. `apps/frontend/docs/`, `libs/core/docs/`)

Then check what already exists:

```bash
find <target> -name '*.md' | head -20
```

Scenarios:

| State                                        | Action                                                                       |
| -------------------------------------------- | ---------------------------------------------------------------------------- |
| Target empty / does not exist                | Create the full structure                                                    |
| Target has Diataxis subdirs already          | Stop and report; offer `audit` instead                                       |
| Target has flat docs                         | Run `audit` first, then propose moves; only scaffold the _missing_ quadrants |

Default behavior: **add the four Diataxis subdirectories alongside** existing folders, not delete them. Migration is left to `audit`.

### Step 2: Create Directory Structure

```bash
mkdir -p <target>/{tutorials,how-to,reference,explanation}
```

### Step 3: Create or Update Top-Level README

Write `<target>/README.md` (only if it does not already exist; otherwise propose an edit and ask):

```markdown
# Documentation

This directory uses the [Diataxis](https://diataxis.fr/) framework.

## Quick Links

| Type                        | Purpose                 | Start Here          |
| --------------------------- | ----------------------- | ------------------- |
| [Tutorials](tutorials/)     | Learn by doing          | New contributors    |
| [How-to Guides](how-to/)    | Solve a specific task   | Day-to-day work     |
| [Reference](reference/)     | Look up technical facts | API / config lookup |
| [Explanation](explanation/) | Understand the "why"    | Onboarding, design  |

## Finding What You Need

- **New here?** Start with [tutorials](tutorials/) and the root [`AGENTS.md`](../AGENTS.md).
- **Need to ship a change?** See [how-to guides](how-to/).
- **Looking up an API, config, or data model?** See [reference](reference/).
- **Want context on architecture or design decisions?** See [explanation](explanation/).

## Contributing

When adding documentation, pick exactly one type. If a doc seems to need two,
split it. Every doc must start with the frontmatter contract (`name`,
`description`, `tags`, plus `kind`, `status`, `last_reviewed`) — agents use
`docs-discovery` to find and rank docs, so weak frontmatter makes your doc
harder to find.
```

### Step 4: Create Section READMEs

Write each section README using the templates below. Adapt the wording to the package being scaffolded (root, frontend, backend, lib). Use the package manager and toolchain from `docs/agents/diataxis-context.md` in commands.

**`<target>/tutorials/README.md`:**

```markdown
# Tutorials

**Learning-oriented**, hands-on lessons that take a beginner from zero to first success.

## Guidelines

- Pick one concrete deliverable (e.g. "Add a new feature end-to-end").
- Use the project toolchain exactly as a real contributor would.
- Always provide commands the reader can copy-paste verbatim.
- Test the tutorial end-to-end on a clean clone before merging.

## Structure

1. What you'll build / learn
2. Prerequisites
3. Step-by-step actions with code blocks and expected output
4. What you've built (recap)
5. Next steps (link to how-to / reference / explanation)

## Avoid

- Offering choices ("you can use X or Y")
- Explaining concepts at length (link to `../explanation/`)
- Skipping verification steps
```

**`<target>/how-to/README.md`:**

```markdown
# How-to Guides

**Task-oriented** recipes for practitioners who already know what they want to do.

## Guidelines

- Title starts with "How to …" and names the task, not the feature.
- One problem per guide. Split if it grows.
- Always include a verification step.
- Add a Troubleshooting section for known failure modes.

## Avoid

- Concept explanations (link to `../explanation/`)
- API tables (those belong in `../reference/`)
- Multiple unrelated tasks in one guide
```

**`<target>/reference/README.md`:**

```markdown
# Reference

**Information-oriented** technical descriptions. Dry, accurate, comprehensive.

## Guidelines

- Structured around the code: one doc per module, component, hook, config file, or entity.
- Consistent format across siblings — copy the template, do not invent a new layout.
- TypeScript signatures in fenced code blocks.
- Tables for parameters, return values, errors, env vars.
- No instructions — link to `../how-to/` instead.

## Avoid

- Step-by-step instructions
- Background or rationale (that's `../explanation/`)
- Inconsistent formatting between sibling docs
```

**`<target>/explanation/README.md`:**

```markdown
# Explanation

**Understanding-oriented** discussion. Clarify the _why_ behind decisions.

## Guidelines

- Frame each doc with the question it answers ("Why this library?", "Why this architecture?").
- Provide context: when the decision was made, what alternatives were rejected.
- Use diagrams (Mermaid) for architecture or data-flow topics.

## Avoid

- Step-by-step instructions (link to `../how-to/`)
- API parameter lists (`../reference/`)
- Pure rhetoric without concrete examples or diagrams
```

### Step 5: Run Formatter

After writing files, run the project's format command from `docs/agents/diataxis-context.md`:

```bash
<format command> <target>/README.md <target>/*/README.md
```

### Step 6: Report

Output a summary like:

```
Scaffolded Diataxis structure at: <target>/

Created:
  <target>/README.md
  <target>/tutorials/README.md
  <target>/how-to/README.md
  <target>/reference/README.md
  <target>/explanation/README.md

Pre-existing folders left in place: <list>

Next steps:
  1. Review and edit the section READMEs to fit this package's scope
  2. Run `diataxis audit <target>` to classify existing docs
  3. Move/rename existing docs into the new quadrants (audit will propose)
```

## Error Handling

| Condition                                              | Response                                               |
| ------------------------------------------------------ | ------------------------------------------------------ |
| Target already has Diataxis subdirs                    | Stop, suggest `diataxis audit <target>` instead        |
| `<target>/README.md` already exists                    | Do not overwrite — show diff and ask whether to update |
| Target is inside a folder listed in docs/agents/diataxis-context.md as excluded | Refuse — these are not Diataxis territory  |
| Not in a git repo                                      | Warn but continue                                      |
