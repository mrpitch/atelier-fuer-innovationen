---
type: Agent Instructions
---

# Domain Docs

Project-only rules for this repo's docs. Generic Diataxis, glossary and ADR guidance lives in the `docs` skill; project settings are in `agents.yaml`.

## OKF frontmatter

Every non-exempt `.md`/`.mdx` file in this repo also carries an [Open Knowledge Format (OKF) v0.2](https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/main/okf) `type` field, layered additively on top of whichever convention already owns that file's other frontmatter. `scripts/validate-okf.ts` (run via `pnpm validate:okf`) is the single place this rule is defined and enforced; exemptions (any `README.md`, `docs/index.md`, `AGENTS.md`/`CLAUDE.md`, `.sandcastle/**`, `docs/audit-reports/**`, build/vendor output) live there, not duplicated here.

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
