---
name: docs
description: 'Project documentation in docs/. Diataxis: scaffold a docs structure, write one doc as tutorial, how-to, reference or explanation, audit or clean up existing docs, regenerate the index. Architecture (`docs arch`): arc42 architecture docs in docs/architecture/ — generate or draft sections, draw C4/sequence/deployment diagrams, record ADRs, validate, refresh after a change, check against the code. Not for README-only edits, changelogs or one-off diagram snippets.'
---

# Docs

`{baseDir}` is the directory containing this file.

Two branches share one frontmatter contract and one `docs/` tree:

- **Diataxis docs** — [Diataxis](https://diataxis.fr/) splits documentation into four types by user need. Each document serves exactly one.

  |                 | **Learning** (acquire) | **Working** (apply) |
  | --------------- | ---------------------- | ------------------- |
  | **Practical**   | Tutorials              | How-to guides       |
  | **Theoretical** | Explanation            | Reference           |

- **Architecture docs** — a git-tracked Markdown bundle in `docs/architecture/`. arc42 decides WHERE knowledge lives (12 sections), Diataxis decides WHAT KIND of content a document is, OKF v0.2 decides HOW it is stored. Every unit is an arc42 section topic, classified as one Diataxis type, written as one concept file.

## Scope

| Lives here                                                   | Owned by `docs`? | Notes                                         |
| ------------------------------------------------------------ | ---------------- | --------------------------------------------- |
| `docs/` (repo root)                                          | Yes              | Project docs                                  |
| `<pkg>/docs/` (package-level docs trees)                     | Yes              | Same layout, scoped to the package            |
| `.agents/skills/**`, `.claude/skills/**`                     | **No**           | Skill definitions, not user docs              |
| `CHANGELOG.md`, `CONTRIBUTING.md`, `LICENSE`                 | **No**           | Standard meta files                           |
| Folders under "Excluded Folders" in `docs/agents/docs-context.md` | **No**      | Project-specific non-doc areas (`docs/agents/`, `docs/research/`, `docs/audit-reports/`) |

Change proposals, specs, agent instructions and audit reports are artifacts, not docs of this skill.

## Operations

Pick one from the user's intent. When the request is ambiguous, ask which operation.

```
docs                                  → ask which operation
docs setup                            → scan project, write docs/agents/docs-context.md
docs scaffold [path]                  → create the four-quadrant structure (default: docs/)
docs write [type] [topic]             → author one doc; type: tutorial | how-to | reference | explanation | adr
docs audit [path]                     → classify, find violations and gaps (default: docs/)
docs index [path]                     → regenerate <path>/index.md (default: docs/)
docs find [path]                      → shortlist docs by frontmatter, nothing opened (default: docs/)
docs arch <operation> [args]          → architecture bundle (default root: docs/architecture/)
```

### Diataxis

| Operation  | File                                               | Use for                                           |
| ---------- | -------------------------------------------------- | ------------------------------------------------- |
| `setup`    | [operations/setup.md](./operations/setup.md)       | Populate the project context file                 |
| `scaffold` | [operations/scaffold.md](./operations/scaffold.md) | Create the four-quadrant directory structure      |
| `write`    | [operations/write.md](./operations/write.md)       | Author a tutorial, how-to, reference, explanation or ADR |
| `audit`    | [operations/audit.md](./operations/audit.md)       | Classify existing docs, find gaps and violations  |
| `index`    | [operations/index.md](./operations/index.md)       | Regenerate `index.md` after docs change           |
| `find`     | [operations/find.md](./operations/find.md)         | Shortlist docs by metadata; owns the ranking recipe |

### Architecture (`docs arch`)

| Operation      | File                                                                            | Use for                                                                                    |
| -------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `generate`     | [operations/architecture/generate.md](./operations/architecture/generate.md)     | Scaffold a new bundle: 12 section folders, stub concepts, root `index.md` and `log.md`     |
| `draft`        | [operations/architecture/draft.md](./operations/architecture/draft.md)           | Interview for one arc42 section and write its real content                                 |
| `edit`         | [operations/architecture/edit.md](./operations/architecture/edit.md)             | Change or add content; decide where new content (runbook, concept) goes                    |
| `diagram`      | [operations/architecture/diagram.md](./operations/architecture/diagram.md)       | Draw, update or pick a C4, sequence, deployment or draw.io diagram                         |
| `adr`          | [operations/architecture/adr.md](./operations/architecture/adr.md)               | Record "we decided…", or supersede an accepted decision                                    |
| `validate`     | [operations/architecture/validate.md](./operations/architecture/validate.md)     | Lint and review the bundle read-only: what is missing, inaccurate, stale                   |
| `migrate`      | [operations/architecture/migrate.md](./operations/architecture/migrate.md)       | Import docs from Confluence, Word or a wiki                                                |
| `code-to-docs` | [operations/architecture/code-to-docs.md](./operations/architecture/code-to-docs.md) | Reverse-engineer documentation from an existing codebase                              |
| `refresh`      | [operations/architecture/refresh.md](./operations/architecture/refresh.md)       | Update the bundle after a system change                                                    |
| `spot-review`  | [operations/architecture/spot-review.md](./operations/architecture/spot-review.md) | Review individual pages interactively; propagate changes to linked pages                 |
| `converge`     | [operations/architecture/converge.md](./operations/architecture/converge.md)     | Check whether the code still matches the docs (doc drift)                                  |

Findings from `validate` and `converge` become work items in the repo's configured issue tracker (`docs/agents/issue-tracker.md`) through the `to-tickets` skill, on request. Priority tiers P0–P3 classify findings in reports.

## Discovery

Before reading docs, writing one, or auditing a folder, run `docs find` on the target folder. It shortlists 1–5 candidates from frontmatter alone; only those are read in full. Before writing a new doc, re-run it on the target folder and extend an existing doc that covers the topic. The ranking recipe and script live in [operations/find.md](./operations/find.md).

## Frontmatter contract

The single dialect for every doc this skill writes: [OKF v0.2](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md) base plus Diataxis extension keys. Consumers tolerate unknown keys and types.

```yaml
---
type: how-to # tutorial | how-to | reference | explanation | adr | runbook | onboarding | api
title: How to deploy backend to dev
description: Procedure to deploy the backend Lambda + CDK stacks to the dev environment.
tags: [backend, deploy, cdk, dev-environment]
status: stable # draft | stable | deprecated
last_reviewed: 2026-04-24
authoritative: false # true only when this doc must win over overlapping docs
---
```

- **Required:** `type`, `title`, `description`. `tags` is strongly recommended — `docs find` ranks on `title`/`description`/`tags`.
- `title` is a clear human title, matching the H1 where possible. `description` is one sentence stating the task, question or purpose the doc answers. `tags` are user-facing keywords, not internal jargon.
- `type` follows the Diataxis quadrant: `tutorial`, `how-to`, `reference`, `explanation`. The rest are discoverable non-quadrant docs:
  - `adr` — dated, numbered, immutable decision record. Keeps MADR statuses in `status`: `proposed | rejected | accepted | deprecated | superseded by ADR-NNNN`.
  - `runbook` — operator procedure tied to a trigger or environment: prescriptive, sequential, executed rather than learned. Distinct from a how-to (no skill transfer, environment-specific).
  - `onboarding`, `api` — as named.
  - Concept docs are `explanation` (add `tags: [concept]` to surface them). Audit reports stay frontmatter-less.
  - Inside `docs/architecture/` only `tutorial | how-to | reference | explanation | adr` are valid.
- `status` for non-ADR docs: `stable` (maintained), `draft` (in progress), `deprecated` (superseded; link the successor in the body).
- **Extension keys (all optional):**
  - `last_reviewed` — `YYYY-MM-DD`, updated on substantive review of a plain doc.
  - `authoritative` — bool; at most one per topic.
  - `arc42_section` — integer 1–12 (architecture concepts).
  - `generated: {by, at}` — producer and time of the current content. `verified` — one `{by, at}` or a list: who confirmed the content against its sources. `last_reviewed` and `verified` coexist.
  - `sources`, `links`, `stale_after` (ISO 8601 datetime with UTC offset).
- **Actors** in `generated.by` / `verified[].by`: `<producer>/<version>` for agents, `human:<id>`, `process:<id>`.
- **Timestamps** are ISO 8601 with an explicit UTC offset.
- **Reserved files:** `index.md` carries no frontmatter except a root `okf_version`; `log.md` is an optional change history under `## YYYY-MM-DD` headings, newest first. Neither is a concept doc.

### Placement

- **ADRs:** when `docs/architecture/` exists they live only in `docs/architecture/09-decisions/` (`docs arch adr`); otherwise in `docs/adr/` (`docs write adr`).
- **Runbooks:** always `docs/runbook/` with `type: runbook`. Architecture docs link to them from the relevant section; an architecture doc is never a runbook.
- **Glossary:** always `docs/reference/glossary.md`, with or without a bundle; it is the one glossary the engineering skills read. arc42 §12 (`docs/architecture/12-glossary/`) points to it and defines only architecture-specific terms.

## Naming conventions

Filenames are kebab-case. Type-aligned prefixes make the type visible at a glance:

| Type        | Pattern                                              | Examples                                                           |
| ----------- | ---------------------------------------------------- | ------------------------------------------------------------------ |
| Tutorial    | `getting-started-…`, `your-first-…`, `<deliverable>` | `getting-started.md`, `your-first-feature-flag.md`                 |
| How-to      | `how-to-<task>`                                      | `how-to-deploy-to-dev.md`, `how-to-rotate-sops-secrets.md`         |
| Reference   | `<entity>` or `<entity>-reference`                   | `pseudo-error-codes.md`, `cdk-constructs.md`, `environments.md`    |
| Explanation | `about-<subject>`, `understanding-<x>`, `why-<x>`    | `about-architecture.md`, `why-zustand.md`, `understanding-sops.md` |
| ADR         | `adr-NNNN-<title>`                                   | `adr-0003-use-grpc.md`                                             |

The H1 of an explanation should read naturally with an "About …" prefix; if it does not, the doc is probably a how-to or reference.

No dates in filenames unless the doc is dated by nature (audit reports).

## Common workflows

### Refactoring mixed content

1. Mark which sections of the mixed document belong to which type.
2. Create one file per type in the matching quadrant.
3. Cross-link the new files (how-to → explanation, explanation → how-to).
4. Rename or move with `git mv`; otherwise delete the original after extracting.
5. Grep the repo for the old path and fix internal links.
6. Run `index`.

### Keeping the index current

After adding, moving or removing any doc, run `docs index <docs_root>` (for a package tree: `<pkg>/docs`). The command is in [operations/index.md](./operations/index.md).

## Execution flow

1. **Parse** the operation and target path. Cross-cutting topics go in `docs/`; package topics in `<pkg>/docs/`; ask when unclear.
2. **Discover** (see Discovery); extend an existing doc when one covers the topic.
3. **Load** the matching operation file and execute its steps. Writes carry the frontmatter contract.
4. **Validate** against the type checklist in [references/framework.md](./references/framework.md) and the contract.
5. **Refresh the index** when a file was created, moved or removed.
6. **Report** files created or changed, classification, frontmatter set, follow-ups.

## Key principle

**Every document serves exactly one user need.** When content serves several, split it and link the parts.

> The first rule of teaching is: don't try to teach. Let structure and doing facilitate learning.

## Project conventions

Read `docs/agents/docs-context.md` for this project's format/lint command, tech stack, package manager, logging convention, and excluded folders. If it is missing, run `docs setup` first.

General rules:

- **Code blocks** carry a language hint; prefer real, runnable snippets over invented ones.
- **Internal links** are relative paths, never absolute.
- **Diagrams** are Mermaid in fenced blocks (renders on GitHub without tooling).

## References

- [references/framework.md](./references/framework.md) — Diataxis types, language patterns, quality checklists
- [references/templates.md](./references/templates.md) — templates per type
- [references/anti-patterns.md](./references/anti-patterns.md) — common mistakes with examples
- [references/architecture/](./references/architecture/) — arc42 sections, OKF spec, detail levels, diagram references; each `docs arch` operation names the ones it needs
- [templates/project-context.md](./templates/project-context.md) — blank schema for `docs/agents/docs-context.md`; never edited directly
- [scripts/generate-index.ts](./scripts/generate-index.ts) — index generator, run through `docs index`
- [scripts/discover.ts](./scripts/discover.ts) — frontmatter scanner, run through `docs find`
- [Diataxis.fr](https://diataxis.fr/) — the framework; project `AGENTS.md` and `CLAUDE.md` rules apply to all docs
