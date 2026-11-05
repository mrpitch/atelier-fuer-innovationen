---
type: reference
title: Originals in public/<kind>/, optimized copies are build output
description: Commit source images under public/slides, illus or images with a JSON entry; never commit or edit public/**/_optimized/ or the hashes file.
tags: [assets, images, public, slides, illustrations, gitignore]
status: stable
last_reviewed: 2026-11-05
---

# Originals in `public/<kind>/`, optimized copies are build output

| Folder           | Holds                                              | Registered in                           |
| ---------------- | -------------------------------------------------- | --------------------------------------- |
| `public/slides/` | slide `.jpg`/`.png`, optional same-basename `.pdf` | `src/data/slides.json` (`image`, `url`) |
| `public/illus/`  | illustration `.png`                                | `src/data/illus.json`                   |
| `public/images/` | site images (logo, hero)                           | referenced directly in code             |

- Filenames are kebab-case ASCII, see [Slugs and filenames](../content/slugs-and-filenames.md).
- Every slide and illustration image needs a JSON entry. A file without one is unreachable from content.
- `public/**/_optimized/` and `public/next-image-export-optimizer-hashes.json` are gitignored build output. Never commit or edit them.
- No size limit on originals. The optimizer resizes to 640, 960, 1280, 1600 and 1920 px wide.
