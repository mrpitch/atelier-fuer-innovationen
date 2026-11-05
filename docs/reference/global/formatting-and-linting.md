---
type: reference
title: Format and lint files you touch
description: Prettier and ESLint are configured but nothing runs them automatically, so run both on every file you change until a pre-commit hook exists.
tags: [formatting, prettier, eslint, lint, code-style]
status: stable
last_reviewed: 2026-11-05
---

# Format and lint files you touch

Run both on the files you change:

```bash
npx prettier --write <files>
npx eslint <files>
```

- Prettier (`.prettierrc`): tabs, no semicolons, single quotes, es5 trailing commas, 80 columns. `prettier-plugin-tailwindcss` sorts classes.
- ESLint (`eslint.config.mjs`): `eslint-config-next` core-web-vitals and typescript.
- No `format` or `lint` script, git hook or CI step exists. VS Code formats on save and runs ESLint fix-all (`.vscode/settings.json`).
- Don't reformat unrelated files in a feature diff.
- Typecheck with `npx tsc --noEmit`.
- A pre-commit hook and CI check are tracked in [#128](https://github.com/mrpitch/atelier-fuer-innovationen/issues/128). Update this file when they land.
