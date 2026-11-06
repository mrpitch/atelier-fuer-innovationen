---
type: reference
title: Import with @/ aliases, export by name
description: Import project modules through @/ aliases, never relative paths, and use named exports except in Next route files and tool config files.
tags: [imports, exports, aliases, typescript, code-style]
status: stable
last_reviewed: 2026-11-05
---

# Import with @/ aliases, export by name

```ts
import { cn } from '@/lib/cn'
import { ImageZoom } from '@/components/image-zoom'
```

- No relative imports (`../`, `./`) between TypeScript modules. `src` has none. Files can move without rewriting imports, and each module has one import path.
- Exception: a colocated stylesheet may be relative (`import './image-zoom.css'` in `image-zoom.tsx`).
- Named exports everywhere. Default exports only where a framework or tool requires them: Next `layout.tsx` and `page.tsx` files, and tool config files (`eslint.config.mjs`, `lint-staged.config.mjs`, `postcss.config.mjs`).
- Aliases are listed in [Configuration](../configuration.md#tsconfigjson-path-aliases). `@/*` covers `src/`.
