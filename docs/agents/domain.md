---
type: Agent Instructions
---

# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase. This repo uses the **Diataxis** layout — see the `docs` skill for the full framework.

## Before exploring, run this first

Run `docs find` on `docs/` to shortlist candidates by frontmatter before reading any file in full:

```bash
npx tsx .claude/skills/docs/scripts/discover.ts docs
```

Then read whichever of these are relevant to the topic:

- **`docs/reference/glossary.md`** — the authoritative glossary. Domain vocabulary lives here, not in a bare `CONTEXT.md`.
- **`docs/explanation/about-*.md`** — the _why_ behind a concept or decision.
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

Every doc carries the `docs` skill's frontmatter contract: `type` (lowercase quadrant), `title` and `description`, plus `tags`, `status` (`draft | stable | deprecated`) and optionally `last_reviewed` and `authoritative`. See the `docs` skill for the full contract.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `docs/reference/glossary.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/grill-with-docs`).

## Flag ADR conflicts

If your output contradicts an existing ADR (in `docs/architecture/09-decisions/` or `docs/adr/`), surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders) — but worth reopening because…_

## OKF frontmatter

Every non-exempt `.md`/`.mdx` file in this repo also carries an [Open Knowledge Format (OKF) v0.2](https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/main/okf) `type` field, layered additively on top of whichever convention already owns that file's other frontmatter. `scripts/validate-okf.ts` (run via `pnpm validate:okf`) is the single place this rule is defined and enforced; exemptions (any `README.md`, `docs/index.md`, `docs/agents/docs-context.md`, `AGENTS.md`/`CLAUDE.md`, `.claude/skills/**`, `.agents/skills/**`, `.sandcastle/**`, `docs/audit-reports/**`, build/vendor output) live there, not duplicated here.

### `docs/**`: `type` is the lowercase Diataxis quadrant

`type` is one of `tutorial`, `how-to`, `reference`, `explanation`, `adr`, `runbook`, `onboarding` or `api`. This is both the `docs` skill's quadrant field and the OKF `type`, so `pnpm validate:okf` needs nothing else. `status` is `stable`, `draft` or `deprecated`; ADRs use their decision lifecycle instead (`proposed`, `accepted`, `rejected`, `deprecated`, `superseded by ADR-NNNN`). `docs/audit-reports/**` stays frontmatter-less.

`docs/agents/*.md` sits outside the Diataxis quadrants and gets `type: Agent Instructions` directly.

### `src/content/docs/**`: a fixed site-content vocabulary

Fumadocs' own fields (`title`, `description`, `icon`) are untouched; `type` plus OKF's own `status` vocabulary (`draft | stable | deprecated`) are added net-new. Every Atelier/Xeniapolis page today is `status: draft` Lorem-ipsum placeholder content. The `type` a new page should pick, by where it lives:

| Path pattern                                  | `type`         |
| --------------------------------------------- | -------------- |
| `atelier/story-example-*/**` (any file)       | `Story`        |
| any `*/konzepte/*.mdx`                        | `Concept`      |
| any `*/guides/*.mdx`                          | `Guide`        |
| any `index.mdx` (not already matched above)   | `Overview`     |
| `impressum.mdx`                               | `Legal Notice` |
| `components.mdx`                              | `Reference`    |
| everything else (standalone pages, `seite-*`) | `Article`      |

Patterns are checked in the order listed — e.g. an `index.mdx` inside `story-example-1/chapter-1/` is `Story`, not `Overview`, because the story-example rule matches first.
