---
title: How to add a content page
description: Create an MDX page under src/content/docs, add it to its section's sidebar and check that it renders.
type: how-to
status: stable
last_reviewed: 2026-11-05
tags: [content, mdx, sidebar, meta-json, fumadocs]
---

# How to add a content page

Content pages are MDX files under `src/content/docs/`. Each top-level folder (`atelier/`, `xeniapolis/`) is a section with its own `meta.json`.

## Steps

1. Create the file in the section folder. The file name becomes the URL slug.

   ```mdx
   ---
   title: Hello world
   description: One sentence that says what the page is about.
   type: Article
   status: draft
   ---

   Page content in Markdown.
   ```

   - `title` and `description` are required by Fumadocs and shown in the page header and the page metadata.
   - `type` is required by `pnpm validate:okf`. Pick it from the table in [Domain Docs](../agents/domain.md) (`Article` for a standalone page, `Guide`, `Concept`, `Overview`, `Story`).
   - `status` is `draft`, `stable` or `deprecated`.
   - `icon` is optional and takes a Lucide icon name.

2. Add the slug to the `pages` array in the section's `meta.json`, without the `.mdx` extension. Order in the array is the sidebar order.

   ```json
   {
   	"pages": ["index", "a-whales-tale", "hello-world"]
   }
   ```

   A page that is not listed still gets a route, but does not appear in the sidebar. Entries are bare slugs; see [meta.json conventions](../reference/fumadocs/meta-json.md) for separators, hiding pages and the common mistakes.

3. If the page uses a custom component, import it at the top of the MDX file. The docs route registers only the Fumadocs default components, so imports are not optional.

   ```mdx
   import { Slide } from '@/components/slides'

   <Slide slug="slide-1" />
   ```

   The available components are listed in [Components](../reference/components.md).

## Verify

```bash
pnpm dev
```

Open `/docs/<section>/<slug>`. The page renders and appears in the sidebar. Then run:

```bash
pnpm validate:okf
```

It reports `OKF conformance: OK` when every file has a `type`.

## Troubleshooting

- **The page is a 404:** the file is outside `src/content/docs/`, or the URL does not match the file path (`atelier/hello-world.mdx` is `/docs/atelier/hello-world`).
- **The page renders but is missing from the sidebar:** the slug is not in `pages`, or it is written with `.mdx` or a path. See the common mistakes in [meta.json conventions](../reference/fumadocs/meta-json.md).
- **`validate:okf` names the file:** the `type` line is missing or empty.
