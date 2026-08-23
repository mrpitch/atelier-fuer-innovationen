---
name: "Per-section theming: data-section scoping"
description: "The Xeniapolis section overrides the full-page palette via data-section='xeniapolis' on the docs layout wrapper — not just the content slot — so chrome (nav, sidebar, footer) re-themes too."
kind: reference
type: Reference
status: current
last_reviewed: 2026-08-23
tags: [fumadocs, theming, sections, xeniapolis, css]
---

# Per-section theming: data-section scoping

Two hand-authored shadcn-style palettes coexist in `globals.css`:

- **Atelier (default)** — applied at `:root`/`.dark`, covers the home page,
  shared chrome, the Atelier content section, and the docs root.
- **Xeniapolis (override)** — defined under `[data-section='xeniapolis']`,
  overrides all shadcn tokens including `--sidebar-*` so the entire page
  re-themes, not just the article body.

`--atelier-color` and `--xeniapolis-color` are set at `:root`/`.dark` (never
inside any section scope) so the sidebar tab-switcher icon transform always
shows both section identities regardless of the current page. See
[Sidebar tab icon color transform](./sidebar-tab-colors.md).

---

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

