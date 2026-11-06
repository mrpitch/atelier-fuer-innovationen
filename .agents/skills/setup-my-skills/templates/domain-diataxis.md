# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase. This repo uses the **Diataxis** layout — see the `docs` skill for the full framework.

## Before exploring, run this first

Run `docs find` on `docs/` to shortlist candidates by frontmatter before reading any file in full:

```bash
npx tsx .claude/skills/docs/scripts/discover.ts docs
```

Then read whichever of these are relevant to the topic:

- **`docs/reference/glossary.md`** — the authoritative glossary. Domain vocabulary lives here, not in a bare `CONTEXT.md`.
- **`docs/explanation/about-*.md`** — the *why* behind a concept or decision.
- **`docs/architecture/09-decisions/`** (or **`docs/adr/`** when `docs/architecture/` doesn't exist) — architectural decision records. Read ADRs that touch the area you're about to work in.
- **`docs/architecture/`** (when it exists) — the arc42 bundle. Read `index.md`, then the section for your area: §2 constraints, §5 building blocks, §6 runtime, §8 cross-cutting concepts.
- **`docs/reference/`** (other subfolders) — coding standards and conventions, written by `/discover-standards`.

If any of these don't exist yet, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. `/domain-modeling` (reached via `/grill-with-docs`, `/triage` and `/improve-codebase-architecture`) writes through `/docs` under this layout and creates them lazily when terms or decisions actually get resolved.

## File structure

```
docs/
├── tutorials/       ← learning-oriented, practical
├── how-to/          ← task-oriented, practical
├── runbook/         ← operator procedures tied to a trigger
├── reference/       ← theoretical, information-oriented
│   └── glossary.md  ← domain vocabulary (the CONTEXT.md equivalent)
├── explanation/     ← theoretical, understanding-oriented
├── adr/             ← architectural decision records (absent when architecture/ exists)
└── architecture/    ← optional arc42 bundle; its ADRs live in 09-decisions/
```

Every doc carries `type`, `title` and `description`, plus `tags` and `status`; `last_reviewed` and `authoritative` are optional — see the `docs` skill for the full contract.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `docs/reference/glossary.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/grill-with-docs`).

## Flag ADR conflicts

If your output contradicts an existing ADR (in `docs/architecture/09-decisions/` or `docs/adr/`), surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders) — but worth reopening because…_
