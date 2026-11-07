---
type: reference
title: Pass format, lint and typecheck before you commit
description: Every commit and every pull request must pass Prettier, ESLint with zero warnings and a full-project typecheck; the pre-commit hook and CI enforce it.
tags: [formatting, prettier, eslint, lint, typecheck, husky, code-style]
status: stable
last_reviewed: 2026-11-05
---

# Pass format, lint and typecheck before you commit

- Run `pnpm format:check`, `pnpm lint` and `pnpm typecheck` clean. CI runs all three on every push to `main` and every pull request targeting `main`, and blocks the deploy on failure.
- Don't bypass the pre-commit hook with `--no-verify`.
- Don't reformat unrelated files in a feature diff. The hook only touches staged files.
- Fix a failing `format:check` with `pnpm format`, then commit the result.
- Script commands are in [Configuration](../configuration.md#packagejson-scripts).

## Tools

- Prettier (`.prettierrc`): tabs, no semicolons, single quotes, es5 trailing commas, 80 columns. `prettier-plugin-tailwindcss` sorts classes.
- `.prettierignore` leaves out vendored skills (`.agents`, `.claude`, `skills-lock.json`), the sandbox config (`.sandcastle`), `pnpm-lock.yaml`, the published content in `src/content`, build output (`.source`, `.next`, `out`) and the generated `docs/index.md`. Anything in `.gitignore` is skipped too.
- ESLint (`eslint.config.mjs`): `eslint-config-next` core-web-vitals and typescript. `--max-warnings 0` makes a warning fail.
- `typecheck` runs `next typegen` first because `next-env.d.ts` and the route types are gitignored and generated.
- VS Code formats on save and runs ESLint fix-all (`.vscode/settings.json`).

## Pre-commit hook

- `pnpm install` runs `husky` (the `prepare` script), which points `core.hooksPath` at `.husky/_`. `.husky/pre-commit` runs `lint-staged` (`lint-staged.config.mjs`).
- Staged `.ts` and `.tsx` files: `eslint --fix --max-warnings 0`, then `prettier --write`, then one full-project `pnpm typecheck`.
- Staged `.ts` and `.tsx` files under `.agents`, `.claude` and `.sandcastle` are skipped by every step, matching `.prettierignore`.
- Every other staged file: `prettier --write --ignore-unknown`. Files matched by `.prettierignore` are left alone.
- Fixes are re-staged. A failing step aborts the commit.
- A commit with no staged `.ts` or `.tsx` file skips the typecheck.
- The hook lints only `.ts` and `.tsx`. A lint error in an `.mjs` config file passes the hook and fails `pnpm lint` in CI.

## CI

- Job `quality` in `.github/workflows/main.yml` runs the three scripts.
- Job `validate-okf` runs `pnpm test` and `pnpm validate:okf`.
- Job `validate-content` runs `pnpm validate:content`.
- Job `build-check` runs `pnpm build`, fails on the pinned missing-image warning strings in the build log, and uploads `out/` as an artefact.
- Jobs `validate-content` and `build-check` run on every push and pull request, not only when content changes.
- Job `deploy` needs all four, runs on pushes only and publishes the `out/` artefact from `build-check`. See [How to build and deploy the site](../../how-to/how-to-build-and-deploy.md).
- CI sets `HUSKY=0`, so the runner doesn't install the hook.
