---
type: Agent Instructions
---

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

## OKF frontmatter

Every non-exempt `.md`/`.mdx` file in this repo also carries an [Open Knowledge Format (OKF) v0.2](https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/main/okf) `type` field, layered additively on top of whichever convention already owns that file's other frontmatter. `scripts/validate-okf.ts` (run via `pnpm validate:okf`) is the single place this rule is defined and enforced; exemptions (any `README.md`, `docs/index.md`, `docs/agents/diataxis-context.md`, `AGENTS.md`/`CLAUDE.md`, `.claude/skills/**`, `.agents/skills/**`, `.sandcastle/**`, build/vendor output) live there, not duplicated here.

### `docs/**`: `type` is derived from `kind`

Diataxis's own fields (`name`, `kind`, `status`, `last_reviewed`, …) are untouched; `type` is added alongside `kind`, one line below it:

| `kind`        | `type`             |
| ------------- | ------------------ |
| `tutorial`    | `Tutorial`         |
| `how-to`      | `How-To Guide`     |
| `reference`   | `Reference`        |
| `explanation` | `Explanation`      |
| `adr`         | `ADR`              |
| `onboarding`  | `Onboarding Guide` |
| `api`         | `API Reference`    |
| `runbook`     | `Runbook`          |

`docs/agents/*.md` sits outside the Diataxis quadrants (no `kind` field) and gets `type: Agent Instructions` directly.

### `src/content/docs/**`: a fixed site-content vocabulary

Fumadocs' own fields (`title`, `description`, `icon`) are untouched; `type` plus OKF's own `status` vocabulary (`draft | stable | deprecated`) are added net-new. Every Atelier/Xeniapolis page today is `status: draft` Lorem-ipsum placeholder content. The `type` a new page should pick, by where it lives:

| Path pattern                                  | `type`         |
| ---------------------------------------------- | -------------- |
| `atelier/story-example-*/**` (any file)        | `Story`        |
| any `*/konzepte/*.mdx`                         | `Concept`      |
| any `*/guides/*.mdx`                           | `Guide`        |
| any `index.mdx` (not already matched above)    | `Overview`     |
| `impressum.mdx`                                | `Legal Notice` |
| `components.mdx`                               | `Reference`    |
| everything else (standalone pages, `seite-*`)  | `Article`      |

Patterns are checked in the order listed — e.g. an `index.mdx` inside `story-example-1/chapter-1/` is `Story`, not `Overview`, because the story-example rule matches first.
