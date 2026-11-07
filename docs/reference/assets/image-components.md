---
type: reference
title: Raster images go through ExportedImage; SVGs render as plain <img>
description: Render raster images with ExportedImage, directly or through ImageZoom, Slide and Illu, because the static export has no image server; only .svg assets use a plain img inside SvgFrame.
tags: [images, assets, next-image-export-optimizer, mdx, static-export]
status: stable
last_reviewed: 2026-11-07
---

# Raster images go through ExportedImage; SVGs render as plain `<img>`

In MDX, catalog first: register the image in `src/data/slides.json` or `illus.json` and use `<Slide slug>` or `<Illu slug>`. For one-offs use `ImageZoom`:

```mdx
import { ImageZoom } from '@/components/image-zoom'

<ImageZoom src="/images/home-1.jpg" width={1900} height={1080} alt="..." />
```

In app code use `ExportedImage` from `next-image-export-optimizer`.

- Raster images (`.png`, `.jpg`) never use `next/image`, `<img>` or markdown `![](...)`. `images.loader` is `custom` and there is no image server, so only `ExportedImage` gets build-time WebP copies and blur placeholders.
- Content images are zoomable through `ImageZoom`. `Slide` and `Illu` use it.
- `src` is the path under `public/` with a leading slash. Always pass `width` and `height` to raster images.
- Run `pnpm build`, not `next build`, to produce the optimized files.

## SVG exception

`next-image-export-optimizer` only processes raster formats, so an `image` ending in `.svg` in `slides.json` or `illus.json` renders through `SvgFrame` (`src/components/svg-frame.tsx`), wrapped in `ImageZoom`. By default that is a plain `<img>`. With `"themed": true` on the entry, `SvgFrame` inlines the file's markup instead so `currentColor` and `var(--color-fd-*)` follow the theme, see [Components](../components.md#illu). `SvgFrame` carries the one allowed `eslint-disable` for `@next/next/no-img-element`, and `isSvg(src)` from the same file is the only extension check. Don't write another raw `<img>`. An SVG shown as `<img>` must declare `width` and `height` on its root `<svg>`, see [Components](../components.md#slide).

## sizes and dimensions

- `ImageZoom` sets `sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 900px"` by default. Don't copy it. Override `sizes` only for a different layout.
- `ExportedImage` used directly (home hero) repeats that string. Reuse the value, or switch to `ImageZoom`.
- `width` and `height` are the intended display box, not the file's pixel size: Slide 1920×1080, Illu 640×480, hero 1900×1080.
- The largest generated variant is 1920 px wide.
