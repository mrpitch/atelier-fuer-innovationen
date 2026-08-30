---
name: Recreate an illustration as SVG
description: How to move a raster Xeniapolis illustration to a hand-recreated SVG while keeping the original as a design reference.
tags: [xeniapolis, migration, illustration, svg, assets]
kind: how-to
type: How-To Guide
status: current
last_reviewed: 2026-08-30
authoritative: true
---

# How to recreate an illustration as SVG

`<Illu>` (`src/components/illus.tsx`) renders whichever asset `illus.json`
points its `image` field at. When that path ends in `.svg`, `<Illu>` renders
it as a plain `<img>` inside the same zoomable container raster illustrations
use, instead of routing it through `next-image-export-optimizer` (which only
processes raster formats and requires raster `width`/`height`). Follow this
convention when a raster illustration under `public/illus/` gets a
hand-recreated vector version.

## Steps

1. Move the existing raster original from `public/illus/<slug>.png` into
   `public/illus/_source/<slug>.png`, keeping the filename. This folder is
   git-tracked — the raster file stays in the repo as the recreation
   reference, it's just no longer served directly.
2. Add the new vector artwork at `public/illus/<slug>.svg`.
3. Update the matching entry in `src/data/illus.json` so `image` points at
   the new `/illus/<slug>.svg` path. Leave `slug` and `name` unchanged so
   existing `<Illu slug="...">` usages keep resolving.
4. Run `pnpm validate:content` — it resolves `image` under `public/` without
   caring which extension it is, so no config change is needed there.

## Verification

- `pnpm validate:content` passes.
- The page(s) using `<Illu slug="...">` for that illustration render the new
  SVG, in both light and dark mode, with zoom still working.
- `pnpm build` stays green.
