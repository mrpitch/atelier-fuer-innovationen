---
okf_version: '0.2'
language: en
detail_level: ESSENTIAL
---

# Atelier für Innovationen — Architecture Documentation

A Next.js and Fumadocs documentation site that builds MDX content into a static export and publishes it to S3 behind CloudFront. It has two content sections, Atelier and Xeniapolis, with their own palettes.

## Destination

This bundle is for contributors and coding agents working on the Atelier für Innovationen documentation site (Next.js static export, Fumadocs, S3 + CloudFront). A reader should be able to answer without asking the team: how content becomes a static site, how the Atelier and Xeniapolis sections differ, how a change is built and deployed, and which decisions constrain future changes.

## Sections

- [01. Introduction and Goals](./01-goals/index.md)
- [02. Architecture Constraints](./02-constraints/index.md)
- [03. Context and Scope](./03-context/index.md)
- [04. Solution Strategy](./04-strategy/index.md)
- [05. Building Block View](./05-building-blocks/index.md)
- [06. Runtime View](./06-runtime/index.md)
- [07. Deployment View](./07-deployment/index.md)
- [08. Cross-cutting Concepts](./08-crosscutting/index.md)
- [09. Architecture Decisions](./09-decisions/index.md)
- [10. Quality Requirements](./10-quality/index.md)
- [11. Risks and Technical Debts](./11-risks/index.md)
- [12. Glossary](./12-glossary/index.md)

## How to navigate

Start with [03 Context and Scope](./03-context/index.md) and [05 Building Block View](./05-building-blocks/index.md) for the shape of the system. [08 Cross-cutting Concepts](./08-crosscutting/index.md) holds the rules that apply across blocks, starting with the static export rule. Follow the links between files or use each section's `index.md`.

## Open gaps

Sections 1, 2, 4 and 10 are `draft` stubs. The code cannot supply their content, so none was written. Close them with `docs arch draft <section>`.

| Section       | What is missing                                                                  |
| ------------- | -------------------------------------------------------------------------------- |
| 1 Goals       | Business goals, quality goals and stakeholders                                   |
| 2 Constraints | Organisational, regulatory and contractual constraints; which ones block a merge |
| 4 Strategy    | Why the stack and the static export were chosen; no ADR records the export       |
| 10 Quality    | Measurable quality scenarios; needs the §1.2 quality goals first                 |

Also unknown to the code: its error-page and cache settings, IAM scope and GitHub branch protection. Recorded as unconfirmed in [§6](./06-runtime/runtime-main-flow.md), [§7](./07-deployment/deployment-topology.md) and [Security conventions](./08-crosscutting/security-conventions.md).

## Attribution

This bundle follows the section structure of the [arc42](https://arc42.org) template, © Dr. Gernot Starke and Dr. Peter Hruschka, licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). The architecture content is this project's own. See [THIRD_PARTY_NOTICES.md](https://github.com/mrpitch/atelier-fuer-innovationen/blob/main/THIRD_PARTY_NOTICES.md).
