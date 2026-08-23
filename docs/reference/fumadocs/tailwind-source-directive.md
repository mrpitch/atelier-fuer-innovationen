---
name: "Tailwind v4 @source directive for fumadocs"
description: "@source must point at @fumadocs/base-ui dist files so Tailwind v4 generates CSS for fumadocs components — omitting it silently breaks layout in production."
kind: reference
type: Reference
status: current
last_reviewed: 2026-08-23
tags: [fumadocs, tailwind, css, build, v4]
---

# Tailwind v4 @source directive for fumadocs

`globals.css`:

```css
@source '../../../node_modules/@fumadocs/base-ui/dist/**/*.js';
```

- Tailwind v4 only scans files reachable from the project source tree by default. Fumadocs component files live in `node_modules` — without `@source`, Tailwind never sees their utility classes and purges them from the build output.
- Symptom when missing: layout looks correct in `next dev` (Tailwind doesn't purge in dev) but breaks silently in production — sidebar, nav, and layout spacing collapse.
- The relative path (`../../../node_modules/...`) is resolved from `globals.css`'s location (`src/lib/styles/`). If `globals.css` moves, update the path.
