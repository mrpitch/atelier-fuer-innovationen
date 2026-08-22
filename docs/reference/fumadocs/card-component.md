---
name: "Card component: fumadocs-core/link + fd-* tokens"
description: "src/components/card.tsx uses fumadocs-core/link (not next/link) for automatic internal/external href handling, and styles via fumadocs' fd-* design-token classes."
kind: reference
type: Reference
status: current
last_reviewed: 2026-08-22
tags: [fumadocs, card, link, theming]
---

# Card component: fumadocs-core/link + fd-* tokens

`src/components/card.tsx`:

```tsx
import Link from 'fumadocs-core/link'

const E = props.href ? Link : 'div'
```

- Use `Link` from `fumadocs-core/link`, not `next/link`, for any content-embedded link component. It wraps the framework's own `Link` but auto-detects internal vs. external `href` values — external links automatically get `rel="noreferrer noopener" target="_blank"`, internal ones render as a normal client-side navigation. `external` can be passed to override the auto-detection.
- Styling uses fumadocs' `fd-*` design-token utility classes (`bg-fd-card`, `text-fd-card-foreground`, `text-fd-muted-foreground`, `hover:bg-fd-accent/80`, etc.) rather than this repo's own color tokens — keep new content-embedded components consistent with this so they inherit fumadocs' light/dark theme automatically instead of needing separate dark-mode handling.
