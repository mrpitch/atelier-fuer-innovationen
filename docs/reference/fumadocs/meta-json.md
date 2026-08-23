---
name: "meta.json conventions"
description: "meta.json controls sidebar structure: root:true makes a folder a top-level tab, pages array controls order using bare slugs, ---Label--- adds separators, !slug excludes a page."
kind: reference
type: Reference
status: current
last_reviewed: 2026-08-23
tags: [fumadocs, meta, sidebar, navigation, content]
---

# meta.json conventions

Every content folder can have a `meta.json`.

## Root folders (sidebar tabs)

To make a folder appear as a top-level DocsLayout tab, set `"root": true`:

```json
{
  "title": "Atelier",
  "description": "...",
  "root": true,
  "icon": "HousePlus",
  "pages": ["index", "section-a", "section-b"]
}
```

- Without `"root": true`, the folder is a collapsible group inside the parent tab, not a top-level tab.
- `"icon"` is a Lucide icon name (resolved via `source.ts`'s `icon()` handler).

## pages array

Controls page/folder order. Entries are **bare slugs** — no `.mdx`, no leading `/`, no full path:

```json
{ "pages": ["index", "intro", "subfolder"] }
```

- **Separator lines**: `"---Label---"` inserts a labelled divider between items.
- **Exclude a page from the sidebar**: prefix with `!` — `"!impressum"` hides it without removing the file.
- Pages not listed still exist as routes but won't appear in the sidebar or determine order.

## Common mistakes

- **Full paths in pages**: `"atelier/index"` instead of `"index"` — fumadocs resolves paths relative to the folder containing `meta.json`.
- **`.mdx` extension in pages**: `"index.mdx"` instead of `"index"` — extension is implied, including it causes the entry to be ignored.
