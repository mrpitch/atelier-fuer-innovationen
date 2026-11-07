---
type: adr
title: 'ADR-0003: Vector icon and illustration conventions for `<Illu>`'
arc42_section: 9
description: 'Records the decision to render Xeniapolis district icons as inlined currentColor SVG (so they retheme under ADR-0002) while full illustrations stay opaque SVG/raster, with raster originals preserved under `_source/` once recreated as SVG.'
tags: [illustrations, svg, icons, theming, xeniapolis, assets]
status: accepted
date: 2026-11-06
decision-makers: []
consulted: []
informed: []
blocking: false
generated:
  by: claude-sonnet-5/sandcastle
  at: 2026-11-06T15:30:00Z
sources:
  - resource: src/components/illus.tsx
  - resource: src/components/svg-frame.tsx
  - resource: public/illus/icon-viertel-annaeherung.svg
  - resource: public/illus/vector-showcase.svg
  - resource: docs/reference/components.md
  - resource: docs/how-to/recreate-illu-as-svg.md
links: []
---

# ADR-0003: Vector icon and illustration conventions for `<Illu>`

## Context and Problem Statement

Migrating xeniapolis.de's artwork raised two different needs that the single `<Illu>` component (`src/components/illus.tsx`) has to serve: full illustrations that should look identical to the hand-drawn source scans, and small per-district header icons (recreating `gifs/b_icons/*bild.gif`) that must pick up whichever foreground color the current page happens to be using. The latter requirement only exists because of ADR-0002: the site now has two full section palettes (default, Xeniapolis) in light and dark mode, so a fixed-color icon asset would look wrong under at least one combination. A flat-color raster image can't retheme at all, and — less obviously — neither can an `<img>`-embedded SVG: `<img>` renders its document in an isolated image context that cannot see the page's `color`, so a `fill`/`stroke="currentColor"` inside it always resolves to black regardless of the active palette. A convention was needed for which rendering path a given SVG takes, and for how a raster original stays recoverable once it is replaced by a hand-authored SVG.

## Decision Drivers

- Icons must inherit the active section palette's foreground color (ADR-0002) in both light and dark mode, without a separate icon asset per palette.
- Full illustrations must keep the source scans' own full-colour artwork unchanged — they are not meant to invert or retint.
- A raster illustration recreated as a hand-authored SVG should not lose its original scan; it needs a reviewable, recoverable reference.
- One `<Illu>` component should serve both needs rather than forking into per-asset-kind components.

## Considered Options

- `variant="icon"` inlines the SVG markup so `currentColor` resolves against the page (chosen for icons)
- Render every SVG uniformly as a plain `<img src="...svg">`
- CSS `mask-image` + `background-color` on a wrapper element instead of inlined markup
- Keep per-district icons as raster images and accept that they can't retheme
- Give full illustrations a themed/invertible palette (e.g. `dark:invert`) instead of their own fixed colors

## Decision Outcome

Chosen: inline SVG for icons, opaque SVG/raster for illustrations, raster originals preserved under `_source/`.

1. **Icon variant → inline SVG + `currentColor`.** The nine district/Zentrum icons (`icon-viertel-*.svg`, `icon-zentrum.svg`) use a 24×24 lucide-style `viewBox`, `stroke="currentColor"`, `fill="none"`. `<Illu variant="icon">` reads the file and inlines its markup via `dangerouslySetInnerHTML` instead of rendering an `<img>`, specifically so `currentColor` resolves against the page's own color instead of being trapped inside an isolated image context.
2. **Illustration variant → SVG or raster, opaque by default; `themed` SVG inline.** Full illustrations keep their own fixed, hand-picked `viewBox` and literal fill/stroke colors rather than `currentColor`. A raster illustration renders through `ImageZoom` and `ExportedImage`. An SVG illustration renders as a plain `<img>` inside `ImageZoom` through the shared `SvgFrame` (`src/components/svg-frame.tsx`), because `next-image-export-optimizer` only processes raster formats. The exception is an SVG whose `illus.json` or `slides.json` entry sets `"themed": true`: it uses `currentColor` or `var(--color-fd-*, <light fallback>)` (`foreground`, `background`, `card`, `muted`, `border`, see the comment in `src/components/image-zoom.css`), and `SvgFrame` reads the file and inlines its markup inside the same `bg-fd-card` frame and `ImageZoom`. An `<img>` SVG can't read the `.dark` class, `currentColor` or the page's CSS variables, and `prefers-color-scheme` inside it would ignore the site's theme toggle, so inlining is the only theme hook that keeps colour artwork intact. `react-medium-image-zoom` finds the inline `svg` and clones it into the zoom modal, where the same variables resolve. If a themed file can't be read, `SvgFrame` falls back to the plain `<img>`. Entries without `themed` keep their own colours.
3. **`_source/` keeps the raster original.** When a raster illustration is recreated as a hand-authored SVG, its PNG moves to `public/illus/_source/<slug>.png` (git-tracked) instead of being deleted, giving the recreation a durable, reviewable reference. Narrative raster art that stays raster (`illustration-ansicht`, `illustration-ateliers-fuer-innovatoren`, `illustration-aufbruch-zum-kontinent-der-loesungen`) is different: the served copy stays in `public/illus/`, because `next-image-export-optimizer` reads from there, and a byte-identical copy is mirrored in `_source/` as the untouched reference. Nothing enforces that the two stay identical.

### Consequences

- Good, because icons render correctly under both ADR-0002 palettes, in light and dark mode, without maintaining per-palette icon duplicates.
- Good, because the raster-to-vector migration stays auditable through a plain file-move convention, without a separate asset-history tool.
- Bad, because "SVG under `public/illus/`" now means two different internal conventions (themed icons and illustrations using `currentColor`/`--color-fd-*` vs. opaque/fill illustrations) depending on `variant` and the `themed` flag — a contributor adding a new asset must know which one applies before choosing its `viewBox` and colors.
- Bad, because `dangerouslySetInnerHTML` on a server-read file means icon and themed SVG markup is trusted input: it must only ever come from a file committed to this repo, never from user-supplied content.

**Risks created:** none

### Confirmation

No automated check enforces the `viewBox`/color convention; it is reviewed at PR time against this ADR and against `docs/reference/components.md`, which documents both `<Illu>` variants and the bespoke-vs-`lucide-react` table for the nine icons. `docs/how-to/recreate-illu-as-svg.md` is the step-by-step for moving a raster illustration into `_source/` and registering its SVG replacement.

## Pros and Cons of the Options

### `variant="icon"` inlines SVG markup

- Good, because it is the only option that lets `currentColor` reach the icon while keeping the source as a plain, hand-editable `.svg` file.
- Bad, because it requires a file read and trusts the SVG's contents at render time.

### Render every SVG as a plain `<img>`

- Bad, because it is the status quo this decision moves away from for icons: an `<img>`-embedded SVG cannot see the page's `color`, so a themed icon would always render black.

### CSS `mask-image` + `background-color`

- Bad, because it needs a wrapper element and a fixed intrinsic size per icon in CSS, duplicating information already in the SVG's own `viewBox`, for no behavior the inline-markup approach doesn't already provide.

### Keep icons as raster images

- Bad, because it reintroduces exactly the problem this decision solves — a flat-color asset can't retheme under either ADR-0002 palette.

### Theme full illustrations too (e.g. `dark:invert`)

- Bad, because the source scans are already full-colour; inverting or retinting them would no longer match the original artwork the illustration is recreating. `themed` SVGs avoid the problem by using theme tokens instead of a filter.

## More Information

Related: [ADR-0002](adr-0002-per-section-theming.md) (the palette mechanism icons thread through). Reference: [Components](../../reference/components.md#illu). How-to: [Recreate an illustration as SVG](../../how-to/recreate-illu-as-svg.md).
