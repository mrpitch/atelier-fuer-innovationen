---
type: reference
title: cn() is tailwind-merge, not clsx
description: cn() from @/lib/cn is bare twMerge, so write conditionals with && and ternaries; object syntax is not supported.
tags: [components, tailwind, cn, tailwind-merge]
status: stable
last_reviewed: 2026-11-05
---

# cn() is tailwind-merge, not clsx

`@/lib/cn` re-exports `twMerge` as `cn`. Later Tailwind classes win over earlier conflicting ones.

```tsx
import { cn } from '@/lib/cn'

cn('p-2 text-sm', active && 'bg-fd-accent', wide ? 'w-full' : 'w-auto')
```

- Conditionals: `&&` and ternaries. Object syntax (`cn({ 'bg-fd-accent': active })`) is a type error.
- Arrays, `false`, `null` and `undefined` are accepted.
- Kept as bare `twMerge` to match the Fumadocs convention. No `clsx`.
