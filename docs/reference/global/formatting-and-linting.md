---
type: reference
title: Format, lint and typecheck
description: Prettier, ESLint and the typecheck run through package scripts, a pre-commit hook on staged files and a CI job that gates the deploy.
tags: [formatting, prettier, eslint, lint, typecheck, husky, code-style]
status: stable
last_reviewed: 2026-11-05
---

# Format, lint and typecheck

| Script              | Runs                           | Use                                       |
| ------------------- | ------------------------------ | ----------------------------------------- |
| `pnpm format`       | `prettier --write .`           | Rewrite every file Prettier covers        |
| `pnpm format:check` | `prettier --check .`           | Fail on any unformatted file (CI)         |
| `pnpm lint`         | `eslint . --max-warnings 0`    | Fail on any lint warning or error (CI)    |
| `pnpm typecheck`    | `next typegen && tsc --noEmit` | Generate route types, then typecheck (CI) |

- Prettier (`.prettierrc`): tabs, no semicolons, single quotes, es5 trailing commas, 80 columns. `prettier-plugin-tailwindcss` sorts classes.
- `.prettierignore` leaves out vendored skills (`.agents`, `.claude`, `skills-lock.json`), the sandbox config (`.sandcastle`), `pnpm-lock.yaml`, the published content in `src/content`, build output (`.source`, `.next`, `out`) and the generated `docs/index.md`. Anything in `.gitignore` is skipped too.
- ESLint (`eslint.config.mjs`): `eslint-config-next` core-web-vitals and typescript.
- `typecheck` runs `next typegen` first because `next-env.d.ts` and the route types are gitignored and generated.
- VS Code formats on save and runs ESLint fix-all (`.vscode/settings.json`).

## Pre-commit hook

`pnpm install` runs `husky` (the `prepare` script), which points `core.hooksPath` at `.husky/_`. `.husky/pre-commit` runs `lint-staged`, configured in `lint-staged.config.mjs`:

- Staged `.ts` and `.tsx` files: `eslint --fix --max-warnings 0`, then `prettier --write`, then one full-project `pnpm typecheck`.
- Every other staged file: `prettier --write --ignore-unknown`. Files matched by `.prettierignore` are left alone.
- Fixes are re-staged. A failing step aborts the commit.
- A commit with no staged `.ts` or `.tsx` file skips the typecheck.

Don't bypass the hook with `--no-verify`; CI runs the same scripts and blocks the deploy.

## CI

Job `quality` in `.github/workflows/main.yml` runs `pnpm format:check`, `pnpm lint` and `pnpm typecheck` on every push to `main` and every pull request targeting `main`. CI sets `HUSKY=0`, so the runner doesn't install the hook. Job `deploy` needs `quality` and `validate-okf` and runs on pushes only. See [How to build and deploy the site](../../how-to/how-to-build-and-deploy.md).

## Rules

- Don't reformat unrelated files in a feature diff. The hook only touches staged files.
- If `format:check` fails in CI, run `pnpm format` and commit the result.
