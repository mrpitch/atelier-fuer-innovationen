---
title: Components
description: The MDX components available to content pages, which ones live in src/components and which come from @fumadocs/base-ui, with their props and import paths.
type: reference
status: stable
last_reviewed: 2026-11-05
tags: [components, mdx, slides, illustrations, image-zoom, tabs]
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

`Slide`, `Slides`, `Illu` and `Illus` are async server components.

### `Slide`

Renders the slide image through `ImageZoom` at 1920 by 1080. When the slide has a `url`, a "Download" link with the slide name follows the image and opens in a new tab. An unknown `slug` renders nothing.

```mdx
import { Slide } from '@/components/slides'

<Slide slug="slide-1" />
```

Slides are defined in `src/data/slides.json`:

| Field   | Required | Meaning                                                 |
| ------- | -------- | ------------------------------------------------------- |
| `slug`  | yes      | Identifier used in `<Slide slug="…" />`                 |
| `name`  | yes      | Used as the image alt text and link label               |
| `image` | yes      | Path under `public/`, for example `/slides/slide-1.jpg` |
| `url`   | no       | Download link, for example a PDF in `public/slides/`    |

### `Illu`

Renders one illustration through `ImageZoom` at 640 by 480, with `name` as the alt text. An unknown `slug` renders nothing.

```mdx
import { Illu } from '@/components/illus'

<Illu slug="illustration-ansicht" />
```

Illustrations are defined in `src/data/illus.json` with `slug`, `name` and `image`, all required. Images live in `public/illus/`.

### Register slides and illustrations before using them

Add the JSON entry and the image first, then reference the slug.

1. Put the image in `public/slides/` or `public/illus/`.
2. Add the entry to `src/data/slides.json` or `src/data/illus.json`.
3. Use `<Slide slug="…" />` or `<Illu slug="…" />`.
4. Open the page locally and check the image renders.

- A slug missing from the JSON renders nothing, and `pnpm build` still passes.
- A typo in the slug and an image without a JSON entry fail the same silent way.
- No check catches this. Also check `url`: it must point to a file in `public/`. A missing file gives a dead Download link; `slide-1` to `slide-3` currently point to PDFs that do not exist.
- Verify: `grep -c 'slides/<name>' out/docs/<page>.html` is above 0 after `pnpm build`.

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
