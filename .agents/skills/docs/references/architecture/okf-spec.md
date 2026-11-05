# OKF v0.2 in this skill

Official spec: [OKF v0.2 SPEC.md](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md). Read it for the full format; this file records what the skill relies on and where its contract goes beyond OKF.

Open Knowledge Format (OKF) stores structured knowledge as a git-tracked tree of Markdown files with YAML frontmatter. No SDK, database or build step: humans, agents and standard text tools read a bundle directly.

## What OKF itself requires

- Every concept file has a `type`. That is the only required key.
- Consumers tolerate unknown keys and unknown `type` values, and tolerate broken links.
- `index.md` carries no frontmatter, except the bundle-root `index.md`, which may carry `okf_version`.
- `log.md` is optional; entries sit under `## YYYY-MM-DD` headings, newest first.
- Every timestamp is ISO 8601 with an explicit UTC offset (`2026-10-15T14:30:00Z`).

## Bundle structure

```
docs/architecture/          ← bundle root
  index.md                  ← root listing: okf_version + bundle settings
  log.md                    ← change history
  <section>/
    index.md                ← section listing (no frontmatter)
    <concept>.md            ← concept file
```

- **Concept ID** = the file path relative to the bundle root, without `.md` (`03-context/interface-table`). Renaming a file changes its identity and breaks links to it.
- `index.md` and `log.md` are **reserved names** at every level and never hold concept content.
- Navigate one level at a time (progressive disclosure): root `index.md`, section `index.md`, concept, its links. Token cost stays proportional to the task, not to the bundle.

## Concept frontmatter

| Key             | Level this skill sets | Meaning                                                                                       |
| --------------- | --------------------- | --------------------------------------------------------------------------------------------- |
| `type`          | required              | `tutorial \| how-to \| reference \| explanation \| adr` inside the architecture bundle        |
| `title`         | required              | Human-readable display name                                                                   |
| `description`   | required              | One sentence; index entries reuse it                                                          |
| `tags`          | strongly recommended  | YAML list; discovery ranks on `title`, `description` and `tags`                               |
| `resource`      | recommended           | URI of the underlying asset, when the concept describes one                                   |
| `status`        | optional              | `draft \| stable \| deprecated`; absent means `stable`. ADRs use MADR statuses (see below)    |
| `arc42_section` | extension             | Integer 1–12 (a quoted `"3"` is invalid)                                                      |
| `generated`     | extension             | `{ by: <actor>, at: <ISO 8601> }`: who or what produced the current content, and when         |
| `verified`      | extension             | One `{ by, at }` mapping or a list of them: who confirmed the content against its sources     |
| `sources`       | extension             | List of `{ resource (required), id, title, author, usage_count, last_modified }`              |
| `links`         | extension             | Related concept paths; SPOT_REVIEW and REFRESH use them to propagate changes                  |
| `stale_after`   | extension             | ISO 8601 instant after which the content counts as stale                                      |

Absence carries meaning: no `verified` means unverified. A concept without the optional keys is still valid.

```yaml
---
type: reference
title: Interface table
description: External interfaces of the payment gateway, with IF-xx IDs.
tags: [context, interfaces]
arc42_section: 3
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-10-15T14:30:00Z
verified:
  - by: human:jane.doe
    at: 2026-10-16T09:00:00Z
sources:
  - id: wiki
    resource: https://confluence.example.com/display/PAY/Interfaces
    title: Payment interfaces (old wiki)
---
```

### Actor convention (`generated.by`, `verified[].by`)

- `<producer>/<version>` — an agent or tool, e.g. `claude-code/claude-opus-5-5`, `docs-bootstrap/1.0.0`.
- `human:<id>` — a person, e.g. `human:jane.doe`. A person's review is a `verified` entry; a human `generated.by` is never written on someone's behalf.
- `process:<id>` — an automated process, e.g. `process:nightly-sync`.

The actors imply trust tiers: **unverified** (no `verified`), **machine-confirmed** (only tool or process verifiers), **human-reviewed** (at least one `human:` verifier).

### `generated` vs `verified`

Independent: content can change without re-confirmation, and be re-confirmed without changing. Set `generated` on every substantive edit; add `verified` only when someone actually confirmed the content.

### `sources` and claim attribution

List the material a concept derives from: a wiki page, a document, the code paths it was extracted from. An entry's `id` lets the body attribute a single claim with a Markdown footnote: `Latency stays under 200 ms.[^wiki]` and `[^wiki]: Payment interfaces (old wiki)`.

## Index files and `log.md`

- Index body: one or more headings, then entries `- [Title](path) — description`, with the description taken from the linked concept's `description`.
- The root `index.md` carries `okf_version: "0.2"` plus the bundle settings `language`, `detail_level`, `domain_profile`. Only the root index has frontmatter.
- `log.md` groups entries under `## YYYY-MM-DD` headings, newest first. Add to the heading for today, or insert a new heading at the top:

```markdown
# Change log

## 2026-10-16

- **Update**: 03-context/interface-table.md — added IF-07 (fraud service)

## 2026-10-15

- **Creation**: Initial bundle scaffold (12 arc42 sections)
```

## Links

Relationships are plain Markdown links in the body. Relative links (`./x.md`, `../05-building-blocks/x.md`) resolve from the file that contains them; links starting with `/` resolve from the bundle root and survive moves. Pass the bundle root, not the repo root, to the scripts.

## How this skill extends OKF

| Rule                                                                                                   | OKF says                              | Why the skill does this                                                  |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------- | ------------------------------------------------------------------------ |
| `type` is one of `tutorial \| how-to \| reference \| explanation \| adr`; `title` and `description` are required | `type` free-form; the rest optional   | Each document is exactly one type; indexes and discovery read the rest   |
| A root `index.md` with `okf_version: "0.2"` is required; the scaffold also writes a root `log.md`      | optional                              | Bundles are generated; a missing root means a broken scaffold            |
| Broken links are validation **errors**                                                                 | consumers tolerate them               | The skill produces the docs and must fix its own links                   |
| Extension keys on concepts: `arc42_section`, `links`, `generated`, `verified`, `sources`, `stale_after` | extension keys allowed                | Section placement, provenance and cross-section propagation              |
| Extension keys on the root `index.md`: `language`, `detail_level`, `domain_profile`                    | index frontmatter: only `okf_version` | Bundle settings every operation reads instead of re-asking               |
| ADRs keep MADR's `status` (`proposed \| rejected \| accepted \| deprecated \| superseded by ADR-NNNN`) | `draft \| stable \| deprecated`       | One YAML key can't hold two vocabularies; ADR status drives the workflow |
| Dot-directories (e.g. `.renders/`, the diagram render output) are working state, not bundle content   | —                                     | `validate.py` skips them                                                 |

## Migrating a v0.1 bundle

`validate.py` accepts v0.1 bundles and reports what to change as warnings:

| v0.1                                           | v0.2                                                   | Warning                         |
| ---------------------------------------------- | ------------------------------------------------------ | ------------------------------- |
| `okf_version: "0.1"`                           | `okf_version: "0.2"`                                   | `ROOT_INDEX_OKF_VERSION_LEGACY` |
| `updated: 2026-06-24`                          | `generated: { by: <actor>, at: 2026-06-24T00:00:00Z }` | `LEGACY_UPDATED_FIELD`          |
| `summary: '…'`                                 | `description: '…'`                                     | `LEGACY_SUMMARY_FIELD`          |
| `2026-06-24 — summary` lines, newest at bottom | `## 2026-06-24` headings, newest first                 | `LEGACY_LOG_FORMAT`             |
| `title` / `updated` in the root index          | the H1 carries the title; settings keys only           | `ROOT_INDEX_UNKNOWN_KEY`        |

Migrate a file when you next touch it; a big-bang rewrite adds nothing.
