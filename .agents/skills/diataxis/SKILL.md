---
name: diataxis
description: 'Organize, write, or audit project documentation using the Diataxis framework (tutorials, how-to guides, reference, explanation). Use when the user wants to scaffold a docs structure, write a new doc, classify and clean up existing docs, or improve the docs/ folder.'
---

# Diataxis Documentation

## Overview

Implements the [Diataxis](https://diataxis.fr/) framework for organizing and writing project documentation. Documentation is split into four distinct types based on user need:

|                 | **Learning** (acquire) | **Working** (apply) |
| --------------- | ---------------------- | ------------------- |
| **Practical**   | Tutorials              | How-to guides       |
| **Theoretical** | Explanation            | Reference           |

Each document serves exactly one purpose. Mixing types is the most common documentation failure.

## Scope in This Repo

| Lives here                                   | Owned by Diataxis? | Notes                                    |
| -------------------------------------------- | ------------------ | ---------------------------------------- |
| `docs/` (repo root)                          | Yes                | Project docs (architecture, guides, etc) |
| `.claude/skills/**`                          | **No**             | Skill definitions, not user docs         |
| `CHANGELOG.md`, `CONTRIBUTING.md`, `LICENSE` | **No**             | Standard meta files                      |
| Excluded folders in `docs/agents/diataxis-context.md` | **No**      | Project-specific non-doc areas           |

## When to Use

- User asks to write, create, or restructure documentation in `docs/` or a package `docs/`
- User asks for a tutorial, how-to, reference, or explanation doc
- User wants to audit/clean up existing docs (e.g. `docs/concepts/`, `docs/security/`)
- A new `components/*` or `libs/*` package needs a documentation skeleton
- User says "document this", "add a tutorial", "write a how-to", "API reference", "organize the docs"

Do **not** use this skill for: change proposals / specs, agent instructions, security audit reports (these are artifacts, not Diataxis docs). Check `docs/agents/diataxis-context.md` for the project-specific list of excluded folders.

## Discovery: always start with `docs-discovery`

Before reading docs, writing a new doc, or auditing a folder, **run `docs-discovery`** for the target folder (`docs`). It returns one JSON entry per `*.md` file with `{ file, folder, hasFrontmatter, frontmatter, titleFallback }`.

- **Claude Code**: run `npx tsx .claude/skills/diataxis/scripts/generate-index.ts docs` — or just use Bash to scan frontmatter from markdown files

Use the metadata to:

1. **Shortlist** 1–5 candidate docs from frontmatter alone — do not open files yet.
2. **Rank** by, in order: exact matches on `name`/`description`/`tags` → `authoritative: true` → `status: current` → most recent `last_reviewed` → `kind` matching the question (`how-to` for tasks, `reference`/`explanation`/`adr` for design questions, `tutorial` for learning).
3. Treat `hasFrontmatter: false` or missing required fields as **lower confidence**; fall back to `titleFallback` plus folder/quadrant.
4. Only `read` the shortlisted candidates in full to answer the user's question.
5. Before writing a new doc, re-run `docs-discovery` for the target folder and **reuse or extend an existing doc** if it already covers the topic (avoid creating overlap).

## Frontmatter contract (every doc this skill writes)

Required: `name`, `description`, `tags`. Recommended: `kind`, `status`, `last_reviewed`, `authoritative`.

```yaml
---
name: How to deploy backend to dev
description: Procedure to deploy the backend Lambda + CDK stacks to the dev environment.
tags: [backend, deploy, cdk, dev-environment]
kind: how-to # tutorial | how-to | reference | explanation | onboarding | adr | api | runbook
status: current # current | draft | deprecated
last_reviewed: 2026-04-24
authoritative: false # true only when this doc must win over overlapping docs
---
```

Authoring rules:

- `name` is a clear human title (matches the H1 where possible).
- `description` is **one sentence** stating the user task, question, or purpose the doc answers.
- `tags` are user-facing keywords, not internal jargon (e.g. `[deploy, dev-environment]`, not `[internalCodenameCdkV2]`).
- `kind` aligns with the Diataxis quadrant: `tutorial`, `how-to`, `reference`, `explanation`. Use `onboarding`, `adr`, `api`, or `runbook` for non-Diataxis but still discoverable docs (audit reports remain frontmatter-less artifacts).
  - **Runbooks** (`kind: runbook`) are operator procedures tied to a specific trigger or environment — prescriptive, sequential, checklist-style. The reader executes, not learns. Lives in `docs/runbook/`. Distinct from how-to guides: no skill transfer, no judgment exercised, environment-specific. See `docs/runbook/` for examples.
  - **"Concept" docs are not a separate `kind`** — they are the Explanation quadrant. Use `kind: explanation` and add `tags: [concept, ...]` if you want them surfaced as concepts.
  - **ADRs use `kind: adr`**, not `explanation`. They are dated, numbered, immutable decision records with their own status lifecycle; keeping them separate lets agents prefer an ADR for "why did we choose X over Y" and an explanation doc for "how does X work".
- `status: current` for actively maintained docs; `draft` while in progress; `deprecated` when superseded (link the successor in the body).
- `last_reviewed` ISO `YYYY-MM-DD`, updated on substantive review.
- `authoritative: true` only when this doc must win over other overlapping docs — at most one per topic.

## Operations

Pick one based on the user's intent:

| Operation  | File                                               | When                                           |
| ---------- | -------------------------------------------------- | ---------------------------------------------- |
| `setup`    | [operations/setup.md](./operations/setup.md)       | Populate this repo's docs/agents/diataxis-context.md |
| `scaffold` | [operations/scaffold.md](./operations/scaffold.md) | Create the four-quadrant directory structure   |
| `write`    | [operations/write.md](./operations/write.md)       | Author a new doc (tutorial/how-to/ref/expl.)   |
| `audit`    | [operations/audit.md](./operations/audit.md)       | Classify existing docs, find gaps & violations |

If the user's request is ambiguous, use `question` to ask which operation they want.

### Argument parsing

```
diataxis                      → ask which operation
diataxis setup                → scan project and write docs/agents/diataxis-context.md
diataxis scaffold [path]      → scaffold (default path: docs/)
diataxis write [type] [topic] → write a doc of the given type
diataxis audit [path]         → audit (default path: docs/)
diataxis index [path]         → regenerate <path>/index.md (default: docs/)
```

Where `type` is one of `tutorial | how-to | reference | explanation`.

## Naming Conventions

All filenames are kebab-case. Use type-aligned prefixes so a glance at the filename tells you what the doc is:

| Type        | Pattern                                              | Examples                                                           |
| ----------- | ---------------------------------------------------- | ------------------------------------------------------------------ |
| Tutorial    | `getting-started-…`, `your-first-…`, `<deliverable>` | `getting-started.md`, `your-first-feature-flag.md`                 |
| How-to      | `how-to-<task>`                                      | `how-to-deploy-to-dev.md`, `how-to-rotate-sops-secrets.md`         |
| Reference   | `<entity>` or `<entity>-reference`                   | `pseudo-error-codes.md`, `cdk-constructs.md`, `environments.md`    |
| Explanation | `about-<subject>`, `understanding-<x>`, `why-<x>`    | `about-architecture.md`, `why-zustand.md`, `understanding-sops.md` |

> **Title heuristic for explanation:** the H1 should read naturally with an "About …" prefix. If it doesn't, you're probably writing a how-to or reference.

## Common Workflows

### Auditing existing documentation

1. Read each document in scope.
2. Classify into Tutorial / How-to / Reference / Explanation / Mixed.
3. Flag content that belongs in another category ("category pollution").
4. Suggest extractions or links instead of inline content.
5. Run `audit` to produce the full report at `docs/audit-reports/diataxis-audit-YYYY-MM-DD.md`.

### Writing new documentation

1. Identify the user need (learning vs working, practical vs theoretical).
2. Choose the category — and only that category.
3. Apply the matching template from [references/templates.md](./references/templates.md).
4. Use category-specific language patterns (see [references/framework.md](./references/framework.md)).
5. Validate against the cross-cutting checklist in `framework.md`.
6. Save in the correct quadrant folder.
7. Run `index` to refresh the directory's `index.md`.

### Refactoring mixed content

1. Read the mixed document and mark which sections belong in which category.
2. Create separate files in the correct quadrants.
3. Add cross-links between the new files (e.g. how-to links to the explanation, explanation links back).
4. Use `git mv` if you are renaming/moving the original (preserves history); otherwise delete it after extracting.
5. Grep the repo for the old path and update any internal links.
6. Run `index`.

### Keeping the index current

After adding, moving, or removing any doc:

```bash
npx tsx .claude/skills/diataxis/scripts/generate-index.ts docs
```

Or for a per-package docs tree:

```bash
npx tsx .claude/skills/diataxis/scripts/generate-index.ts apps/<pkg>/docs
```

## Key Principle

**Every document should serve exactly one user need.** When content serves multiple needs, split it and link the parts together. This is always better than serving multiple needs in one place.

> The first rule of teaching is: don't try to teach. Let structure and doing facilitate learning.

## Execution Flow

1. **Parse** the user's request to determine operation and target path.
2. **Locate** the right docs folder:
   - Cross-cutting topic → `docs/`
   - Package-specific topic → `apps/<pkg>/docs/` or `libs/<pkg>/docs/`
   - If unclear, ask the user.
3. **Discover** existing docs by calling `docs-discovery` on the target folder. Shortlist candidates by frontmatter only (see "Discovery" above) before opening any file.
4. **Decide**: extend an existing doc when one already covers the topic; otherwise pick the right Diataxis quadrant for a new file.
5. **Load** the matching operation file from `operations/`.
6. **Execute** the steps in that file (writes must include the frontmatter contract above).
7. **Validate** the result against the type checklist in [references/framework.md](./references/framework.md) and the frontmatter contract.
8. **Refresh the index** by running `npx tsx .claude/skills/diataxis/scripts/generate-index.ts <docs_root>` if any file was created, moved, or removed.
9. **Report** files created/changed, classification, frontmatter set, and follow-up actions.

## Project-Specific Conventions

Read `docs/agents/diataxis-context.md` for this project's:

- Format/lint command (run after writing any doc)
- Tech stack (use in code examples)
- Package manager (use in commands)
- Logging convention (use in backend code examples)
- Excluded folders (skip during audit/discovery)

General rules that apply everywhere:

- **Filenames:** kebab-case, descriptive, no dates unless the doc is dated by nature (e.g. audit reports). Examples: `getting-started.md`, `how-to-add-a-page.md`, `architecture.md`.
- **Code blocks:** Use language hints (` ```ts `, ` ```bash `, ` ```yaml `). Prefer real, runnable snippets over invented examples.
- **Internal links:** Relative paths, never absolute. Anchor-link sections within long docs.
- **Diagrams:** Prefer Mermaid in fenced code blocks (` ```mermaid `) — renders on GitHub and in most viewers without extra tooling.

If `docs/agents/diataxis-context.md` is missing, run `diataxis setup` first.

## Coexistence with Other Skills

| Skill                | Boundary                          |
| -------------------- | --------------------------------- |
| `code-review`        | Unrelated; don't trigger Diataxis |
| `code-health-review` | Unrelated; don't trigger Diataxis |
| `git-commit`         | Unrelated; don't trigger Diataxis |

## References

- [references/framework.md](./references/framework.md) — Full Diataxis framework, type details, language patterns, quality checklists
- [references/templates.md](./references/templates.md) — Ready-to-use templates for each type
- [references/anti-patterns.md](./references/anti-patterns.md) — Common documentation mistakes with examples
- [templates/project-context.md](./templates/project-context.md) — Blank schema for the project-context file; never edited directly
- `docs/agents/diataxis-context.md` — This repo's populated project-specific config (run `diataxis setup` to write it; lives in the consuming repo, not in this skill's own directory)
- [scripts/generate-index.ts](./scripts/generate-index.ts) — TypeScript index generator (run via `npx tsx`)

## External

- [Diataxis.fr](https://diataxis.fr/) — Original framework
- Project `AGENTS.md` and `CLAUDE.md` — Project-level rules that apply to all docs
