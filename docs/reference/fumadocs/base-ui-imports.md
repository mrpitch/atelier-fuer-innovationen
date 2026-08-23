---
name: "@fumadocs/base-ui import convention"
description: "All fumadocs UI/layout imports use @fumadocs/base-ui subpaths, not fumadocs-ui — the two packages have the same subpath structure but fumadocs-ui is no longer installed."
kind: reference
type: Reference
status: current
last_reviewed: 2026-08-23
tags: [fumadocs, imports, base-ui, v16]
---

# @fumadocs/base-ui import convention

This repo uses `@fumadocs/base-ui`, not `fumadocs-ui`. The packages share
identical subpaths — the switch is mechanical:

```ts
// Layouts
import { HomeLayout } from '@fumadocs/base-ui/layouts/home'
import { DocsLayout } from '@fumadocs/base-ui/layouts/docs'
import type { BaseLayoutProps } from '@fumadocs/base-ui/layouts/shared'

// Provider
import { RootProvider } from '@fumadocs/base-ui/provider/next'

// MDX
import defaultMdxComponents from '@fumadocs/base-ui/mdx'

// Components
import { Cards, Card } from '@fumadocs/base-ui/components/card'
import { Tabs, Tab } from '@fumadocs/base-ui/components/tabs'
```

- **Never write `fumadocs-ui/...`** — upstream fumadocs docs still reference it,
  but `fumadocs-ui` is not installed in this repo.
- **Always use a subpath** — `import ... from '@fumadocs/base-ui'` (bare) does
  not resolve; every export lives under a subpath.
- `fumadocs-core` imports (`fumadocs-core/source`, `fumadocs-core/toc`,
  `fumadocs-core/search/server`) are separate and were not renamed.
