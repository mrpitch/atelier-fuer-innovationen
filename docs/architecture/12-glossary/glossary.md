---
type: reference
title: 'Glossary'
arc42_section: 12
description: 'Architecture-specific terms and abbreviations; domain vocabulary lives in docs/reference/glossary.md.'
tags: [architecture, glossary]
status: draft
generated:
  by: docs-code-to-docs/1.0.0
  at: 2026-11-05T11:01:33Z
sources:
  - resource: README.md
  - resource: source.config.ts
  - resource: src/lib/source.ts
  - resource: next.config.mjs
links:
  - ../../reference/glossary.md
---

# Glossary

Domain vocabulary (Xenia, Wissensstadt, Stadtviertel and the rest) lives in the single glossary, [`docs/reference/glossary.md`](../../reference/glossary.md). This section holds only architecture terms and never redefines one from that glossary.

## Architecture terms

| Term           | Definition                                                                                                                             | Where used                                                                 |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `.source/`     | Folder `fumadocs-mdx` generates from `src/content/docs/` at install and build time. Never edited by hand and never committed.          | [Content Pipeline](../05-building-blocks/building-blocks-level1.md)        |
| `data-section` | HTML attribute the Docs Route sets on the page wrapper for Xeniapolis pages. The Theme keys the Xeniapolis palette on it.              | [Section Theming Strategy](../08-crosscutting/section-theming-strategy.md) |
| Loader         | The Fumadocs `loader()` call in `src/lib/source.ts` that turns the generated collection into a page tree under the base URL `/docs`.   | [Content Pipeline](../05-building-blocks/building-blocks-level1.md)        |
| `meta.json`    | File in a content folder that sets the sidebar title, icon and page order. With `"root": true` the folder becomes a top-level tab.     | [Content Conventions](../08-crosscutting/content-conventions.md)           |
| OKF            | Open Knowledge Format. Here only its one required key matters: every Markdown or MDX file needs a non-empty `type` in its frontmatter. | [Content Conventions](../08-crosscutting/content-conventions.md)           |
| Page tree      | The ordered tree of pages and folders the Loader builds. Sidebar, `generateStaticParams` and the search index all read it.             | [Static Export Strategy](../08-crosscutting/static-export-strategy.md)     |
| Static export  | The build output of `output: 'export'`: HTML, JSON and assets in `out/`, with no server code.                                          | [Static Export Strategy](../08-crosscutting/static-export-strategy.md)     |

## Abbreviations

| Abbreviation | Full form                                                                |
| ------------ | ------------------------------------------------------------------------ |
| ADR          | Architecture Decision Record                                             |
| CDN          | Content delivery network (here CloudFront)                               |
| CI/CD        | Continuous integration and deployment (GitHub Actions)                   |
| IF-xx        | External interface ID, defined in [§3](../03-context/interface-table.md) |
| MDX          | Markdown with embedded JSX                                               |
| RISK-xx      | Risk ID in [§11](../11-risks/risks-and-tech-debt.md)                     |
| TD-xx        | Technical debt ID in [§11](../11-risks/risks-and-tech-debt.md)           |
