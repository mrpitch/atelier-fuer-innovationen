---
type: reference
title: Originals in public/<kind>/, optimized copies are build output
description: Commit source images under public/slides, illus or images with a JSON entry; never commit or edit public/**/_optimized/ or the hashes file.
tags: [assets, images, public, slides, illustrations, gitignore]
status: stable
last_reviewed: 2026-11-07
---

# Originals in `public/<kind>/`, optimized copies are build output

| Folder                  | Holds                                                               | Registered in                           |
| ----------------------- | ------------------------------------------------------------------- | --------------------------------------- |
| `public/slides/`        | slide `.jpg`/`.png`/`.svg`, optional same-basename `.pdf`           | `src/data/slides.json` (`image`, `url`) |
| `public/illus/`         | illustration `.png` or `.svg`; the copy that is served              | `src/data/illus.json`                   |
| `public/illus/_source/` | raster originals at source resolution, git-tracked reference copies | not registered                          |
| `public/images/`        | site images (logo, hero)                                            | referenced directly in code             |

- Filenames are kebab-case ASCII, see [Slugs and filenames](../content/slugs-and-filenames.md).
- Every slide and illustration image needs a JSON entry. A file without one is unreachable from content, except under `_source/`.
- `.svg` files render as a plain `<img>` and are not optimized, see [image components](image-components.md#svg-exception). Raster files get the optimizer's copies.
- `_source/` holds the raster original of an illustration recreated as SVG (moved there), and a mirror of narrative raster art that stays served from `public/illus/` (`illustration-ansicht`, `illustration-ateliers-fuer-innovatoren`, `illustration-aufbruch-zum-kontinent-der-loesungen`). Nothing syncs the two copies. See `public/illus/_source/README.md` and [ADR-0003](../../architecture/09-decisions/adr-0003-vector-icon-and-illustration-conventions.md).
- `public/**/_optimized/` and `public/next-image-export-optimizer-hashes.json` are gitignored build output. Never commit or edit them.
- No size limit on originals. The optimizer resizes to 640, 960, 1280, 1600 and 1920 px wide.
