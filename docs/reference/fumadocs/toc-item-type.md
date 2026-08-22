---
name: "TOCItemType import path (v16)"
description: "TOCItemType is imported from fumadocs-core/toc in v16, not fumadocs-core/server — the old path no longer exports it."
kind: reference
status: current
last_reviewed: 2026-08-22
tags: [fumadocs, toc, types, v16]
---

# TOCItemType import path (v16)

`src/components/inline-toc.tsx`:

```tsx
import type { TOCItemType } from 'fumadocs-core/toc'
```

- `TOCItemType` moved to `fumadocs-core/toc` in v16. `fumadocs-core/server` (the pre-v16 location) no longer exports it — importing from there fails to resolve.
- Any new component that needs a page's table-of-contents shape (e.g. consuming `page.data.toc`) should type against this same `fumadocs-core/toc` export, not re-declare an ad hoc shape.
