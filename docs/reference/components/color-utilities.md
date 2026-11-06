---
type: reference
title: Color utilities use fd-* tokens
description: Components style color with Tailwind fd-* utilities (bg-fd-primary, text-fd-muted-foreground), never literal colors, so section palettes apply.
tags: [components, tailwind, theming, tokens, xeniapolis]
status: stable
last_reviewed: 2026-11-05
---

# Color utilities use fd-\* tokens

Use `fd-*` utilities for color: `bg-fd-primary`, `text-fd-muted-foreground`, `border`.

```tsx
<div className="bg-fd-card text-fd-muted-foreground border" />
```

- Never use literal colors (`#hex`, `oklch()`) or palette classes (`bg-purple-500`). They ignore the `[data-section='xeniapolis']` palette.
- Don't mix vocabularies in one file. Shadcn-name utilities (`text-primary-foreground`) also resolve through `@theme inline`, but only `src/app/_components/footer.tsx` uses them. Migrate it when touching it.
- Tokens are defined in `src/lib/styles/theme.css`. See [Per-section theming](../fumadocs/section-theming.md).
