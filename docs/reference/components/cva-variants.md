---
type: reference
title: 'Variants: pass color and size, extend with cn()'
description: buttonVariants and linkVariants have no defaultVariants, so pass color and size on every call and add one-off classes with cn().
tags: [components, cva, variants, tailwind, button]
status: stable
last_reviewed: 2026-11-05
---

# Variants: pass color and size, extend with cn()

`buttonVariants` and `linkVariants` (`src/components/ui/button.tsx`) define no `defaultVariants`. Pass `color` and `size` every time. Add one-off classes with `cn()`.

```tsx
import { cn } from '@/lib/cn'
import { buttonVariants } from '@/components/ui/button'
;<Link
	href="/docs"
	className={cn(
		buttonVariants({ color: 'outline', size: 'lg' }),
		'rounded-full'
	)}
/>
```

- Omitting `color` or `size` renders the base classes only, with no error.
- Defaults were never added. Add them in `button.tsx` if you change this.
- `home-hero.tsx` also passes `className` inside the variant call. Prefer `cn()` for new code.
