---
name: "Custom Tabs component (legacy)"
description: "src/components/tabs.tsx is a ~1.5-year-old local reimplementation of Tabs features fumadocs-ui now covers natively — prefer the built-in Tabs going forward."
kind: reference
type: Reference
status: current
last_reviewed: 2026-08-22
tags: [fumadocs, tabs, components, migration, tech-debt]
---

# Custom Tabs component (legacy)

`src/components/tabs.tsx` exports a local `Tabs`/`Tab` pair built directly on this repo's `src/components/ui/tabs.tsx` Radix primitives, reimplementing:

- `groupId` + `persist` — synced tab selection across multiple `<Tabs>` blocks on a page, persisted to `sessionStorage` (or `localStorage` with `persist`).
- `updateAnchor` — writes the active tab's `id` to the URL hash, and reads it back on mount.

**This was built ~1.5 years ago because fumadocs-ui's own `Tabs` didn't support this at the time.** As of the current fumadocs-ui (v16), the built-in `Tabs` component (`fumadocs-ui/components/tabs` or similar) now supports the same `groupId`, `persist`, and `updateAnchor` props natively.

- **Prefer fumadocs-ui's built-in `Tabs` for any new usage** rather than this local component.
- Migrating existing usages of `src/components/tabs.tsx` to the built-in component is a worthwhile follow-up cleanup, not done as part of this standard — verify prop-for-prop parity against the current fumadocs-ui docs before swapping, since exact persistence/hash-sync semantics should be checked rather than assumed identical.
- The v16 upgrade also moved this file's `useEffectEvent` import from the polyfill at `fumadocs-core/utils/use-effect-event` (removed in v16) to React 19.2's own native `useEffectEvent` — a fumadocs-adjacent change to this exact file, separate from the migration-to-built-in-Tabs question above.
