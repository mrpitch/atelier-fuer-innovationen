---
name: "Theming: shadcn.css token names"
description: "This repo uses @fumadocs/base-ui/css/shadcn.css, so CSS tokens are shadcn names (--background, --primary) — not the --color-fd-* names shown in upstream fumadocs theming docs."
kind: reference
status: current
last_reviewed: 2026-08-23
tags: [fumadocs, theming, css, shadcn, tokens]
---

# Theming: shadcn.css token names

`globals.css` imports:

```css
@import '@fumadocs/base-ui/css/shadcn.css';
@import '@fumadocs/base-ui/css/preset.css';
```

CSS tokens use **shadcn names**, not `--color-fd-*`:

```css
:root {
  --background: oklch(…);
  --primary: var(--atelier-primary);
  --sidebar: oklch(…);
}
```

- `shadcn.css` bridges fumadocs' internal variables onto shadcn token names — chosen here both because the project already used shadcn tokens and because the two-section theming (Atelier/Xeniapolis) needed the full shadcn surface (`--sidebar-*`, `--card`, `--popover`, etc.) to override all chrome.
- **Don't follow upstream fumadocs theming docs literally** — they default to `neutral.css` with `--color-fd-*` variables. Adding `--color-fd-background` etc. here will have no effect; the correct token to change is `--background`.
- **Both `shadcn.css` and `preset.css` are required.** `shadcn.css` maps token names; `preset.css` provides fumadocs layout variables (`--fd-layout-width`, etc.) that `shadcn.css` doesn't include.
