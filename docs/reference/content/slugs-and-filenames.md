---
type: reference
title: Slugs and filenames are ASCII
description: Page, folder and data slugs use lowercase ASCII kebab-case with umlauts transliterated (ae, oe, ue); only titles and labels keep umlauts.
tags: [content, slugs, mdx, meta-json, urls]
status: stable
last_reviewed: 2026-11-05
---

# Slugs and filenames are ASCII

Slugs, filenames and folder names are lowercase ASCII kebab-case. Transliterate umlauts: `ä` → `ae`, `ö` → `oe`, `ü` → `ue`.

| Where                       | Value                |
| --------------------------- | -------------------- |
| Filename                    | `kurzuebersicht.mdx` |
| Folder                      | `wertschoepfung/`    |
| `meta.json` slug            | `"kurzuebersicht"`   |
| `title` frontmatter         | `Kurzübersicht`      |
| `meta.json` separator label | `"---Annäherung---"` |

- Titles, descriptions and `meta.json` labels keep the real umlauts.
- Applies to every page, folder and slug in `src/data/*.json`. No exceptions.
- Why: umlauts get percent-encoded in URLs and S3 keys, and break across operating systems and CI tooling.
- A slug is the URL. Renaming a published page changes its address.
