---
name: 'Per-section theming via CSS custom-property scoping'
description: 'Records the decision to give the Xeniapolis content section its own full-page shadcn-style palette override, layered on a site-wide default palette, via a data-section attribute rather than separate route layouts.'
tags: [theming, shadcn, css, xeniapolis, atelier, fumadocs, design-tokens]
kind: adr
status: accepted
last_reviewed: 2026-08-22
---

# Per-section theming via CSS custom-property scoping

## Context

This site republishes two distinct things under one Next.js app: the **Xeniapolis** content section, which republishes the outside Xenia research concept, and the **Atelier** content section plus the site's shared chrome (home page, top nav, footer), which represent the Atelier für Innovationen brand identity this site is itself published under (see `docs/reference/glossary.md`).

Before this decision, the site had an existing-but-unpopulated mechanism for differentiating these sections: the docs layout's sidebar tab-icon transform reads a `--<top-level-folder>-color` CSS variable per section, falling back to the default foreground color when unset. No section had ever defined one, so every tab icon rendered identically.

Separately, issue #28 (refactoring this site's component library and adopting shadcn/ui-style theming) needed to replace Fumadocs' bundled `neutral`+`ocean` CSS presets with a hand-authored shadcn-style token palette. While resolving that work, it became clear the maintainer wanted more than a single site-wide palette: Xeniapolis should read as visually distinct from the rest of the site, not merely carry a differently-colored sidebar icon.

Two shapes of "distinct" were on the table: a single accent color feeding only the existing tab-icon mechanism, or a full section-wide re-theme (backgrounds, cards, borders, chrome — everything) that activates while browsing that section. The maintainer chose the latter, specifying two complete palettes (light + dark variants each).

## Decision

Two complete shadcn-style palettes are defined, each covering light and dark variants:

- A **default palette** (the Atelier für Innovationen identity) applied everywhere by default — the home page, shared chrome, the Atelier content section, and the docs root.
- A **Xeniapolis palette**, scoped to the Xeniapolis content section, that overrides the default across the _entire_ rendered page while browsing there — shared chrome (nav, sidebar, footer) included, not just the article body.

The scoping mechanism is a `data-section="xeniapolis"` attribute, applied high enough in the docs layout tree to wrap chrome and content alike, derived using the same `source.getNodeMeta()` + `PathUtils.dirname()` pattern the docs layout's sidebar tab-icon transform already used (previously only across the static tab list; extended here to run per-current-page). The Xeniapolis palette's token values are defined under that attribute selector (and its dark-mode compound) in the global stylesheet, redefining the same underlying `--background`/`--primary`/etc. custom properties the default palette sets at `:root`. No component code changes: every component already styles through `fd-*`/shadcn design tokens that resolve through these variables, so the override composes with the existing styling convention automatically.

Separately, the sidebar tab-switcher's own icon-coloring mechanism (`--atelier-color`/`--xeniapolis-color`) is wired explicitly to each palette's `--primary` value at the root level, independent of whichever palette is currently active on the page — so the switcher always previews both section identities, rather than every icon inheriting whatever the current page happens to be themed as.

## Alternatives Considered

| Option                                                                    | Why not                                                                                                                                                                                                                               |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Single site-wide palette, only the tab-icon accent colors differ          | Was the original, smaller-scope plan; superseded once the maintainer clarified they wanted Xeniapolis to feel like a genuinely distinct section, not just carry a differently-colored icon.                                           |
| Separate Next.js route layouts per section, each with its own theme       | A much larger structural change (splitting the shared `/docs/[[...slug]]` catch-all route) to justify for what is, mechanically, a CSS variable override; rejected in favor of reusing an existing, proven per-page-metadata pattern. |
| Content-area-only override (chrome stays in the default palette)          | Considered and rejected — a differently-colored article body inside an unchanged-color nav/sidebar reads as an inconsistency or bug, not an intentional section identity.                                                             |
| Let tab-switcher icons simply match whichever palette is currently active | Rejected — it defeats the switcher's purpose (letting a visitor tell sections apart before clicking) if every icon looks like the current page's colors instead of its own destination's colors.                                      |

## Consequences

| Aspect              | Pros                                                                                                                                        | Cons                                                                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Section identity    | Xeniapolis reads as one coherent, visually distinct section; the site's own Atelier identity is the unambiguous default elsewhere           | Two palettes to keep in sync (light/dark × two sections) instead of one                                                                                          |
| Implementation cost | No component-level code changes needed — existing `fd-*`/shadcn-token styling already composes with the scoping                             | Requires deriving section identity per-page in the docs layout, not just across the static tab list as before                                                    |
| Extensibility       | Establishes a reusable pattern (attribute-based scoping keyed to top-level content folder) for a future third section, if one is ever added | A third section is _not_ an assumed extension — it needs its own explicit decision, since this ADR only covers two                                               |
| Reversibility       | —                                                                                                                                           | Once components and content authors come to expect section-scoped theming, collapsing back to one palette is a real (if not enormous) removal, not a config flip |

This is recorded as an ADR rather than left as an implementation detail because it introduces a pattern — two coexisting, fully-scoped design-token palettes on one site — that a reader skimming the CSS or component code would not expect, and because reverting it later is materially more than trivial.
