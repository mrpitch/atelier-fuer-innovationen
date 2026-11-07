# `public/illus/_source/`

Git-tracked home for raster illustration originals at source resolution.
Two cases land here:

- An illustration recreated as a hand-authored SVG: the raster original is
  moved here (see
  [How to recreate an illustration as SVG](../../../docs/how-to/recreate-illu-as-svg.md)).
- An illustration that stays raster (maintainer's call): a copy of the
  source-resolution original is kept here as the design reference for
  recreating _other_ assets as SVG, while the same file continues to be
  served from `public/illus/<slug>.png` via `illus.json`.

Either way, the file at `_source/<slug>.png` is the highest-resolution copy
available from the source material — check there before re-scanning or
re-requesting an asset. Nothing enforces that `_source/<slug>.png` and
`public/illus/<slug>.png` stay byte-identical over time; `validate-content.ts`
only checks that `illus.json` entries resolve under `public/`. Treat
`_source/` as a manually maintained archive, not an automated mirror.
