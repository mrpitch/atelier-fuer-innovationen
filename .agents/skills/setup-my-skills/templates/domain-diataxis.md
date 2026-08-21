# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase. This repo uses the **Diataxis** layout — see the `diataxis` skill for the full framework.

## Before exploring, run this first

Run `docs-discovery` on `docs/` to shortlist candidates by frontmatter before reading any file in full:

```bash
npx tsx .claude/skills/docs-discovery/scripts/discover.ts docs
```

Then read whichever of these are relevant to the topic:

- **`docs/reference/glossary.md`** — the authoritative glossary. Domain vocabulary lives here, not in a bare `CONTEXT.md`.
- **`docs/explanation/about-*.md`** — the *why* behind a concept or decision.
- **`docs/adr/`** — architectural decision records. Read ADRs that touch the area you're about to work in.
- **`docs/reference/`** (other subfolders) — coding standards and conventions, written by `/discover-standards`.

If any of these don't exist yet, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. `/grill-with-docs` (which delegates to `/diataxis` under this layout) creates them lazily when terms or decisions actually get resolved.

## File structure

```
docs/
├── tutorial/       ← learning-oriented, practical
├── how-to/         ← task-oriented, practical
├── reference/       ← theoretical, information-oriented
│   └── glossary.md  ← domain vocabulary (the CONTEXT.md equivalent)
├── explanation/     ← theoretical, understanding-oriented
└── adr/             ← architectural decision records
```

Every doc carries Diataxis frontmatter (`name`, `description`, `tags`, `kind`, `status`, `last_reviewed`, `authoritative`) — see the `diataxis` skill for the full contract.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `docs/reference/glossary.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/grill-with-docs`).

## Flag ADR conflicts

If your output contradicts an existing ADR in `docs/adr/`, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders) — but worth reopening because…_
