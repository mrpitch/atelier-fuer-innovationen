---
title: Components
description: The MDX components available to content pages, which ones live in src/components and which come from @fumadocs/base-ui, with their props and import paths.
type: reference
status: stable
last_reviewed: 2026-11-07
tags: [components, mdx, slides, illustrations, image-zoom, tabs, tour]
---

# Components

The docs route registers only `@fumadocs/base-ui/mdx`'s default components (`src/app/docs/[[...slug]]/page.tsx`). Every component below must be imported at the top of the MDX page that uses it. The live showcase is `src/content/docs/components.mdx`, published at `/docs/components`.

## Local components (`src/components/`)

| Component       | Import                                                        | Props                                                                        |
| --------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `Slide`         | `import { Slide } from '@/components/slides'`                 | `slug: string`                                                               |
| `Slides`        | `import { Slides } from '@/components/slides'`                | none; lists the names of all slides                                          |
| `Illu`          | `import { Illu } from '@/components/illus'`                   | `slug: string`                                                               |
| `Illus`         | `import { Illus } from '@/components/illus'`                  | none; lists the names of all illustrations                                   |
| `ImageZoom`     | `import { ImageZoom } from '@/components/image-zoom'`         | `next-image-export-optimizer` image props, plus `zoomInProps`, `rmiz`, `alt` |
| `OverviewCards` | `import { OverviewCards } from '@/components/overview-cards'` | `children`; a responsive grid, 1 column on mobile, 2 from `md`, 3 from `lg`  |
| `Tabs`, `Tab`   | `import { Tabs, Tab } from '@/components/tabs'`               | See [Tabs wrapper](./fumadocs/tabs-wrapper.md)                               |
| `Tour`          | `import { Tour } from '@/components/tour'`                    | `tour: string`, `station: string`                                            |

`Slide`, `Slides`, `Illu` and `Illus` are async server components.

### `Tour`

Step counter ("Station n von N") and previous/next controls for one station of a Stadtrundgang or a Kontexte slide series. `tour` selects an entry in `src/data/tours.ts` by slug; `station` is the current page's own absolute URL (one of that entry's `stations`). Use it once near the top and once near the bottom of a station page — each render is independent, so both instances just need the same `tour`/`station` pair.

```mdx
import { Tour } from '@/components/tour'

<Tour
	tour="kurzuebersicht"
	station="/docs/xeniapolis/annaeherung/kondratieffs-zyklen"
/>
```

The previous/next label text ("Zurück"/"Nächste") is fixed chrome; the `aria-label` on the working control also names the destination page (read from its frontmatter `title` via `source.getPage`), so the accessible name doesn't rely on surrounding context. At the first station of a tour, "Zurück" renders as a disabled, non-interactive placeholder instead of a dead link. At the last station, "Nächste" does the same — unless the tour definition sets `exit`, in which case it links there instead (the `ewelt1`/`ewelt3` Kontexte series use this to continue into the next, unrelated page their last slide originally linked to). The `ewelt1`/`ewelt3` station pages also keep a plain link back to their series overview page next to `Tour`, carried over unchanged from the hand-written text — `Tour` has no concept of a series overview.

`src/data/tours.ts` is the one place a tour's station order is defined, including the two Kurzübersicht stations that live under `fuehrung/` instead of `annaeherung/` (see `annaeherung/index.mdx`). An unknown `tour` slug, or a `station` not listed in that tour, renders nothing.

### `Slide`

Renders the slide image through `ImageZoom` at 1920 by 1080. When `image` ends in `.svg`, it instead renders through `SvgFrame` (`src/components/svg-frame.tsx`), a `bg-fd-card border p-4` frame shared with `<Illu>`: a plain `<img>`, or the inlined markup when the entry sets `themed`. This is because `next-image-export-optimizer` only processes raster formats. When the slide has a `url`, a "Download" link with the slide name follows the image and opens in a new tab — this is how the PDF export of a redrawn SVG slide stays downloadable. An unknown `slug` renders nothing.

The plain `<img>` carries no `width`/`height` props, so its rendered size depends entirely on the SVG file: every slide/illustration `.svg` must declare `width` and `height` on the root `<svg>` matching its `viewBox` (not `viewBox` alone). Tailwind's preflight (`img { max-width: 100%; height: auto }`) then scales that intrinsic size down to the frame while preserving the aspect ratio — a `viewBox`-only SVG has no intrinsic size and renders at an unpredictable size in an `<img>`.

```mdx
import { Slide } from '@/components/slides'

<Slide slug="slide-1" />
```

Slides are defined in `src/data/slides.json`:

| Field    | Required | Meaning                                                                                                   |
| -------- | -------- | --------------------------------------------------------------------------------------------------------- |
| `slug`   | yes      | Identifier used in `<Slide slug="…" />`                                                                   |
| `name`   | yes      | Used as the image alt text and link label                                                                 |
| `image`  | yes      | Path under `public/`, for example `/slides/slide-1.jpg`                                                   |
| `url`    | no       | Download link, for example a PDF in `public/slides/`                                                      |
| `themed` | no       | `.svg` only: inline the markup so `currentColor` and `--color-fd-*` follow the theme, see [`Illu`](#illu) |

### `Illu`

Renders one illustration through `ImageZoom` at 640 by 480, with `name` as the alt text. An unknown `slug` renders nothing.

```mdx
import { Illu } from '@/components/illus'

<Illu slug="illustration-ansicht" />
```

Illustrations are defined in `src/data/illus.json` with `slug`, `name` and `image`, all required. Images live in `public/illus/`.

An entry may set `"themed": true` on a `.svg` that uses `currentColor` or `var(--color-fd-*, <light fallback>)` (`foreground`, `background`, `card`, `muted`, `border`; see the comment in `src/components/image-zoom.css`). `SvgFrame` then reads the file and inlines its markup inside the same `bg-fd-card border p-4` frame and `ImageZoom`, so the colours follow the site's light and dark theme, also in the zoom modal. An `<img>`-embedded SVG cannot see the page's `color`, the `.dark` class or the CSS variables, and `prefers-color-scheme` inside it would ignore the site's theme toggle. Without `themed` the SVG renders as a plain `<img>` and keeps its own colours. If the file can't be read, the `<img>` is used. `slides.json` entries take the same flag, see [`Slide`](#slide).

`<Illu slug="…" variant="icon" />` renders a `.svg` entry's markup inline
(`dangerouslySetInnerHTML`, no `ImageZoom`, no `mb-8` block) instead of as an
`<img>`. Use this for small icons that must pick up the page's current text
color — an `<img>`-embedded SVG renders in an isolated image context that
cannot see the page's `color`, so `fill`/`stroke="currentColor"` would
otherwise always resolve to black regardless of the active palette (ADR-0002
[Per-section theming](../architecture/09-decisions/adr-0002-per-section-theming.md)).
The default `variant`, `"illustration"`, is unchanged.

#### Xeniapolis district header icons

Nine `variant="icon"` entries recreate xeniapolis.de's
`gifs/b_icons/{ann,mar,kon,ins,zuk,wer,pot,fue}bild.gif` + `platz.gif` as
neutral, `currentColor`-only SVGs (see
`src/content/docs/xeniapolis/annaeherung/die-stadtviertel-der-wissensstadt.mdx`
for their use next to each Stadtviertel/Zentrum heading):

| Slug                          | Stadtviertel / Zentrum   | Source                      |
| ----------------------------- | ------------------------ | --------------------------- |
| `icon-viertel-annaeherung`    | Annäherung               | `lucide-react` `Signpost`   |
| `icon-viertel-maerkte`        | Märkte und Kooperation   | `lucide-react` `Store`      |
| `icon-viertel-kontexte`       | Kontexte                 | `lucide-react` `Globe`      |
| `icon-viertel-inszenierung`   | Inszenierung             | `lucide-react` `Drama`      |
| `icon-viertel-zukunft`        | Zukunft                  | `lucide-react` `Rocket`     |
| `icon-viertel-wertschoepfung` | Wertschöpfung            | `lucide-react` `Sprout`     |
| `icon-viertel-potenziale`     | Potenziale               | `lucide-react` `Hexagon`    |
| `icon-viertel-fuehrung`       | Führung                  | `lucide-react` `Crown`      |
| `icon-zentrum`                | Zentrum der Wissensstadt | bespoke (hub with 8 spokes) |

The eight district icons reuse an existing `lucide-react` icon whose stock
meaning already matches the Viertel's concept (signpost for the first-contact
"Annäherung", globe for the "eine Welt" context icon, crown for "Führung",
etc. — each also echoes the hand-drawn motif in the source GIF where one was
obvious). `icon-zentrum` is bespoke because the source `platz.gif` is a full
city-map collage, not a single-motif badge like the others, and no
`lucide-react` icon depicts "a hub coordinating 8 radiating points" — the
one shape specific to this site's own radial Stadtviertel layout described in
`die-stadtviertel-der-wissensstadt.mdx`.

### Register slides and illustrations before using them

Add the JSON entry and the image first, then reference the slug.

1. Put the image in `public/slides/` or `public/illus/`.
2. Add the entry to `src/data/slides.json` or `src/data/illus.json`.
3. Use `<Slide slug="…" />` or `<Illu slug="…" />`.
4. Open the page locally and check the image renders.

- A slug missing from the JSON renders nothing, and `pnpm build` still passes.
- A typo in the slug and an image without a JSON entry fail the same silent way.
- No check catches this. Also check `url`: it must point to a file in `public/`. A missing file gives a dead Download link; `slide-1` to `slide-3` currently point to PDFs that do not exist.
- Verify: `grep -c 'slides/<name>' out/docs/<page>/index.html` is above 0 after `pnpm build`.

### `ImageZoom`

Click-to-zoom wrapper around `ExportedImage` from `next-image-export-optimizer`, using `react-medium-image-zoom`. It is a client component.

| Prop                                                     | Type                                  | Default | Meaning                                                         |
| -------------------------------------------------------- | ------------------------------------- | ------- | --------------------------------------------------------------- |
| `src`, `width`, `height` and other `ExportedImage` props |                                       |         | Passed to the image                                             |
| `alt`                                                    | `string`                              | `''`    | Alt text                                                        |
| `zoomInProps`                                            | `ImgHTMLAttributes<HTMLImageElement>` | none    | Props for the zoomed image                                      |
| `rmiz`                                                   | `UncontrolledProps`                   | none    | Props for `react-medium-image-zoom`; zoom margin defaults to 20 |

The default `sizes` attribute is `(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 900px`.

## Components from `@fumadocs/base-ui`

Imported from the package, not from `src/components/`:

| Component                 | Import path                               |
| ------------------------- | ----------------------------------------- |
| `Accordions`, `Accordion` | `@fumadocs/base-ui/components/accordion`  |
| `Banner`                  | `@fumadocs/base-ui/components/banner`     |
| `Cards`, `Card`           | `@fumadocs/base-ui/components/card`       |
| `InlineTOC`               | `@fumadocs/base-ui/components/inline-toc` |
| `Steps`, `Step`           | `@fumadocs/base-ui/components/steps`      |

For their props, see the Fumadocs documentation. `components.mdx` shows each in use.

## Not for MDX

- `src/components/ui/button.tsx` exports `buttonVariants` and `linkVariants` (class-variance-authority variants). `Slide` uses `linkVariants` for its download link.
- `src/app/_components/` holds the home page hero and the footer.
