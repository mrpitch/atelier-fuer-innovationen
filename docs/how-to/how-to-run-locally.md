---
title: How to run the site locally
description: Install dependencies, start the dev server, run the checks and preview the static export on your machine.
type: how-to
status: stable
last_reviewed: 2026-11-05
tags: [setup, dev, pnpm, local]
---

# How to run the site locally

## Before you start

- Node.js 20.9 or newer (Next.js 16 requires it).
- pnpm. The repo pins `pnpm@11.3.0` in `package.json`; with Corepack enabled the right version is picked up automatically.

```bash
node --version
pnpm --version
```

## Start the dev server

```bash
pnpm install
pnpm dev
```

`pnpm install` also runs `fumadocs-mdx` (the `postinstall` script), which generates the `.source/` folder the site imports. If you see an error about `@/.source`, run `pnpm install` again.

Open http://localhost:3000. The home page is `/`, the content is under `/docs`.

Verify: the home page loads, and `/docs/atelier` shows the Atelier section with its sidebar.

## Run the checks

```bash
pnpm test
pnpm validate:okf
```

- `pnpm test` runs the tooling tests in `scripts/` (`tsx --test scripts/*.test.ts`).
- `pnpm validate:okf` fails if a Markdown or MDX file is missing its `type` frontmatter. CI runs both whenever a `.md` or `.mdx` file changes.

## Preview the static export

The production site is a static export, so `pnpm dev` does not show exactly what ships. To check the real output:

```bash
pnpm build
pnpm start
```

`pnpm build` writes the site to `out/`. `pnpm start` serves `out/` with `npx serve@latest`, at the address it prints. For what the build does, see [How to build and deploy](./how-to-build-and-deploy.md).

## Troubleshooting

- **An error about `@/.source`:** run `pnpm install` so the `postinstall` step regenerates `.source/`.
- **Port 3000 is busy:** run `pnpm dev -p 3001`.
- **Stale dependencies after a lockfile change:** `pnpm nuke` deletes `node_modules` and `pnpm-lock.yaml`. Use it only if you mean to re-resolve everything, because it discards the lockfile.
