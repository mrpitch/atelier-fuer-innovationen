---
name: "Per-section theming: data-section scoping"
description: "The Xeniapolis section overrides the full-page palette via data-section='xeniapolis' on the docs layout wrapper — not just the content slot — so chrome (nav, sidebar, footer) re-themes too."
kind: reference
status: current
last_reviewed: 2026-08-23
tags: [fumadocs, theming, sections, xeniapolis, css]
---

# Per-section theming: data-section scoping

`src/app/docs/[[...slug]]/layout.tsx` wraps the entire page in a
`<div data-section="xeniapolis">` when the current page is in the
Xeniapolis content section:

```tsx
export default async function Layout({ children, params }) {
  const { slug } = await params
  const page = source.getPage(slug)
  const isXeniapolis = page ? getPageSection(page.url) === 'xeniapolis' : false

  return (
    <div {...(isXeniapolis ? { 'data-section': 'xeniapolis' } : {})}>
      <DocsLayout {...docsOptions}>{children}</DocsLayout>
      <Footer />
    </div>
  )
}
```

`getPageSection()` derives the section from the page tree:

```ts
function getPageSection(url: string): string | undefined {
  const treeNodes = findPath(
    source.pageTree.children,
    (node) => node.type === 'page' && node.url === url
  )
  const rootFolder = treeNodes?.find(
    (node): node is Folder => node.type === 'folder' && Boolean(node.root)
  )
  if (!rootFolder) return undefined
  const meta = source.getNodeMeta(rootFolder)
  return meta ? PathUtils.dirname(meta.path) : undefined
}
```

The `[data-section='xeniapolis']` CSS scope in `globals.css` redefines
`--background`, `--primary`, `--sidebar`, and all shadcn tokens — so the
entire palette switches, not just the content area.

## Traps

- **Don't scope `data-section` too narrowly** (e.g. on `DocsBody` or the
  article slot). The wrapper must enclose `DocsLayout` *and* `Footer` so
  chrome (nav, sidebar, footer) re-themes alongside the content.
- **Don't define `--atelier-color` or `--xeniapolis-color` inside
  `[data-section='xeniapolis']`.** These two variables feed the sidebar
  tab-switcher icon transform and must reflect *both* section identities
  at all times. They live at `:root`/`.dark` only — never inside a section
  scope.

## Adding a third section

Add a new `[data-section='<folder>']` block in `globals.css` with its own
token overrides, and extend `getPageSection()`'s return values to cover it.
Do not add a new `--<folder>-color` unless you also wire it up in the
`tabs.transform` in `layout.tsx` and define it at `:root`/`.dark` (not
inside the section scope).
