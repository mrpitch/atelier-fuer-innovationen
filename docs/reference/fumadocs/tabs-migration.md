---
name: "Tabs migration: local Radix Tabs to @fumadocs/base-ui"
description: "src/components/tabs.tsx is now a thin wrapper on @fumadocs/base-ui's native Tabs, which implements groupId/persist/updateAnchor natively — verified against the installed package source."
kind: reference
status: current
last_reviewed: 2026-08-22
tags: [fumadocs, tabs, components, migration, v16]
---

# Tabs migration: local Radix Tabs to @fumadocs/base-ui

`src/components/tabs.tsx` is now a thin wrapper on `@fumadocs/base-ui/components/tabs`:

```tsx
import {
	Tabs as BaseTabs,
	Tab,
	type TabsProps as BaseTabsProps,
	type TabProps,
} from '@fumadocs/base-ui/components/tabs';

export interface TabsProps extends BaseTabsProps {
	groupId?: string;
	persist?: boolean;
	updateAnchor?: boolean;
}

export function Tabs(props: TabsProps) {
	return <BaseTabs {...props} />;
}
```

The formerly-local `groupId`/`persist`/`updateAnchor` re-implementation (see git history for the pre-migration `src/components/tabs.tsx`) and its Radix-backed primitive at `src/components/ui/tabs.tsx` were deleted. Content pages keep importing from `@/components/tabs` unchanged.

## Parity verification

The reference doc this one replaces, `custom-tabs.md`, assumed the installed `@fumadocs/base-ui`'s public `Tabs` docs/types only expose `items`, `defaultIndex`, and `label` — matching what a first pass at this migration found and shipped as a straight re-export of the raw component, dropping `groupId`/`persist`/`updateAnchor` behavior as a result. That was wrong, caught in review, and traced back to the installed package source (`node_modules/@fumadocs/base-ui/dist/components/`) rather than external docs:

- `@fumadocs/base-ui/components/tabs`'s `Tabs` (`dist/components/tabs.js`) renders `@fumadocs/base-ui/components/ui/tabs`'s `Tabs` (`dist/components/ui/tabs.js`) underneath, spreading any props it doesn't recognize (`...props`) straight through to it.
- `components/ui/tabs.js` **is** the `groupId`/`persist`/`updateAnchor` implementation — it registers group listeners keyed by `groupId` in a module-level `Map`, writes to `sessionStorage` always and additionally to `localStorage` when `persist` is set, and reads/writes `window.location.hash` (plus a `hashchange` listener) when `updateAnchor` is set. This is functionally equivalent to (and, for the hash case, a strict improvement over — it also listens for `hashchange`) the old local implementation.
- `components/tabs.d.ts`'s exported `TabsProps` is `Omit<ComponentProps<typeof Tabs$1 /* ui/tabs's Tabs */>, 'value' | 'onValueChange'>`, i.e. it inherits `groupId`, `persist`, and `updateAnchor` from the underlying primitive's prop type — they just aren't visible from a shallow read of `components/tabs.d.ts` alone, since they arrive via the `extends Omit<...>` clause.

Confirmed with a throwaway probe file passing `groupId`/`persist`/`updateAnchor`/`defaultIndex` to the native `Tabs` and running `pnpm exec tsc --noEmit` (accepted), and a second probe with a bogus prop under `@ts-expect-error` (rejected, proving the file was actually type-checked).

## Why keep a wrapper at all

Given the native component already implements the required behavior, `src/components/tabs.tsx` re-declares `groupId`/`persist`/`updateAnchor` explicitly on its own `TabsProps` rather than relying on the inherited-via-`Omit` type from `@fumadocs/base-ui`. That keeps the three props this repo's content authors rely on visible from this file directly, without needing to trace through `@fumadocs/base-ui`'s internals to discover they're supported.
