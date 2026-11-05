---
title: 'Tabs wrapper: @/components/tabs'
description: "src/components/tabs.tsx wraps @fumadocs/base-ui's native Tabs and declares groupId, persist and updateAnchor on its own props; MDX pages import Tabs and Tab from @/components/tabs."
type: reference
status: stable
last_reviewed: 2026-11-05
tags: [fumadocs, tabs, components, v16]
---

# Tabs wrapper: @/components/tabs

`src/components/tabs.tsx` is a thin wrapper on `@fumadocs/base-ui/components/tabs`. MDX pages import from `@/components/tabs`, not from the package.

```tsx
import { Tabs, Tab } from '@/components/tabs'
```

## Exports

| Export      | Source                                     | Notes                                          |
| ----------- | ------------------------------------------ | ---------------------------------------------- |
| `Tabs`      | wrapper around the native `Tabs`           | Spreads all props through to the native `Tabs` |
| `Tab`       | re-exported from `@fumadocs/base-ui`       | Unchanged                                      |
| `TabsProps` | `BaseTabsProps` plus the three props below | Type                                           |
| `TabProps`  | re-exported from `@fumadocs/base-ui`       | Type                                           |

## Props added to `TabsProps`

The native component already implements these. The wrapper declares them on its own `TabsProps` so they are visible from this file without tracing `@fumadocs/base-ui`'s `Omit<...>` type.

| Prop           | Type      | Default | Effect                                                                                    |
| -------------- | --------- | ------- | ----------------------------------------------------------------------------------------- |
| `groupId`      | `string`  | none    | Syncs the selected tab across every `<Tabs>` block that shares the id.                    |
| `persist`      | `boolean` | `false` | Also stores the synced selection in `localStorage`. Without it, `sessionStorage` is used. |
| `updateAnchor` | `boolean` | `false` | Writes the active tab's `id` to the URL hash and restores the selection from it on load.  |

Everything else (`items`, `defaultIndex`, `label`) comes from the native component's props.

## Verified against

The behavior above comes from `node_modules/@fumadocs/base-ui/dist/components/ui/tabs.js`, which `components/tabs.js` renders and forwards unrecognized props to. If a `@fumadocs/base-ui` upgrade changes how `groupId`, `persist` or `updateAnchor` work, check that file first.

The local Radix-backed `Tabs` and `src/components/ui/tabs.tsx` no longer exist. See [ADR 0001](../../architecture/09-decisions/adr-0001-adopt-fumadocs-base-ui.md) for why the site moved to `@fumadocs/base-ui`.
