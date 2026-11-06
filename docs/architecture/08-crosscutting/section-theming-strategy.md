---
type: explanation
title: 'Section Theming Strategy'
arc42_section: 8
description: 'How two complete palettes share one codebase: a data-section attribute set by the Docs Route switches the Theme for the whole page.'
tags: [architecture, crosscutting, theming]
status: draft
generated:
  by: docs-code-to-docs/1.0.0
  at: 2026-11-05T11:01:33Z
sources:
  - resource: src/app/docs/[[...slug]]/layout.tsx
  - resource: src/lib/styles/globals.css
  - resource: src/lib/styles/theme.css
links:
  - 09-decisions/adr-0002-per-section-theming.md
---

# Section Theming Strategy

## Context

The site publishes two content sections, Atelier and Xeniapolis. Xeniapolis has to look distinct across the whole page, not only in the article.

## Discussion

Two blocks cooperate. Theme defines the default palette at `:root` and `.dark`, and a Xeniapolis palette under `[data-section='xeniapolis']` that redefines the same CSS custom properties. Docs Route derives the current page's section from the page tree and puts `data-section="xeniapolis"` on a wrapper around both the layout chrome and the content. Components style through design tokens only, so none of them knows which palette is active.

The sidebar tab icons are the exception on purpose: `--atelier-color` and `--xeniapolis-color` are set outside any section scope so the switcher always previews both identities.

The decision, its rejected alternatives and its trade-offs are in [ADR-0002](../09-decisions/adr-0002-per-section-theming.md). The attribute and selector details are in [Per-section theming](../../reference/fumadocs/section-theming.md).

## Consequences

- A component that hard-codes a color instead of a token breaks the section identity on one side.
- Every palette change is made four times: two sections times light and dark.
- A third section needs its own decision. The pattern allows it, the ADR does not assume it.

## See also

- [About section theming](../../explanation/about-section-theming.md)
