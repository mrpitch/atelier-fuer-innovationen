---
title: Configuration
description: Every configuration file, package script, path alias and environment variable that shapes the build, the content pipeline and the CI deploy.
type: reference
status: stable
last_reviewed: 2026-11-05
tags:
  [configuration, next-config, scripts, tsconfig, pnpm, environment-variables]
---

# Configuration

## `package.json` scripts

| Script             | Command                                                     | Purpose                                                            |
| ------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------ |
| `dev`              | `next dev`                                                  | Dev server on port 3000                                            |
| `build`            | `next build && next-image-export-optimizer`                 | Static export to `out/`, then image optimization                   |
| `start`            | `npx serve@latest out`                                      | Serves the built `out/` folder                                     |
| `postinstall`      | `fumadocs-mdx`                                              | Generates `.source/` from `src/content/docs`                       |
| `test`             | `tsx --test scripts/*.test.ts`                              | Tests for the `scripts/` tooling                                   |
| `validate:okf`     | `tsx scripts/validate-okf.ts`                               | Fails if a Markdown or MDX file has no `type` frontmatter          |
| `afk`              | `tsx --env-file=.sandcastle/.env scripts/run-sandcastle.ts` | Runs the sandboxed agent on a GitHub issue                         |
| `sandcastle:build` | `docker build ... -f .sandcastle/Dockerfile .`              | Builds the Sandcastle image `sandcastle:atelier-fuer-innovationen` |
| `nuke`             | `rm -r node_modules; rm -r pnpm-lock.yaml`                  | Deletes dependencies and the lockfile                              |

## `next.config.mjs`

| Setting                            | Value                             | Effect                                             |
| ---------------------------------- | --------------------------------- | -------------------------------------------------- |
| `output`                           | `'export'`                        | Static HTML export; no Node server at runtime      |
| `reactStrictMode`                  | `true`                            |                                                    |
| `images.loader`                    | `'custom'`                        | Images are served by `next-image-export-optimizer` |
| `images.imageSizes`, `deviceSizes` | `[640, 960, 1280, 1600, 1920]`    | Widths generated for every image                   |
| `transpilePackages`                | `['next-image-export-optimizer']` |                                                    |

The config is wrapped with `createMDX()` from `fumadocs-mdx/next`.

### Image optimizer settings

Set under `env` in `next.config.mjs`. They are build-time constants, not variables you set in your shell.

| Key                                                 | Value        |
| --------------------------------------------------- | ------------ |
| `nextImageExportOptimizer_imageFolderPath`          | `public`     |
| `nextImageExportOptimizer_exportFolderPath`         | `out`        |
| `nextImageExportOptimizer_quality`                  | `75`         |
| `nextImageExportOptimizer_storePicturesInWEBP`      | `true`       |
| `nextImageExportOptimizer_exportFolderName`         | `_optimized` |
| `nextImageExportOptimizer_generateAndUseBlurImages` | `true`       |

## `source.config.ts`

`defineDocs({ dir: 'src/content/docs' })` registers the content collection. `defineConfig({ mdxOptions: {} })` carries no custom MDX options. The generated output lives in `.source/` (gitignored) and `tsconfig.json` maps `@/.source` to `.source/server.ts`.

## `tsconfig.json` path aliases

| Alias        | Target                |
| ------------ | --------------------- |
| `@/.source`  | `./.source/server.ts` |
| `@/*`        | `./src/*`             |
| `@/public/*` | `./public/*`          |

`tsconfig.json` also lists `@/app/*`, `@/lib/*`, `@/components/*` and `@/data/*`, which `@/*` already covers.

## `pnpm-workspace.yaml`

| Key                        | Value                                                | Purpose                                                                                                               |
| -------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `allowBuilds`              | `esbuild: true`, `sharp: true`                       | Allows these packages' install scripts to run                                                                         |
| `minimumReleaseAgeExclude` | `fumadocs-core@16.15.0`, `@fumadocs/base-ui@16.15.0` | Lets pnpm install two versions newer than the release-age gate. See [ADR 0001](../adr/0001-adopt-fumadocs-base-ui.md) |

## Environment variables

The site reads none at build or run time. These apply to tooling only:

| Variable                  | Where                             | Purpose                                               |
| ------------------------- | --------------------------------- | ----------------------------------------------------- |
| `CLAUDE_CODE_OAUTH_TOKEN` | `.sandcastle/.env`                | Auth for the sandboxed agent (or `ANTHROPIC_API_KEY`) |
| `DOCKER_HOST`             | `.sandcastle/.env` and your shell | Docker socket, needed with Colima on macOS            |

GitHub Actions secrets and variables for the deploy are listed in [How to build and deploy](../how-to/how-to-build-and-deploy.md).

## Where else configuration lives

| File                            | Controls                                                                     |
| ------------------------------- | ---------------------------------------------------------------------------- |
| `src/content/docs/**/meta.json` | Sidebar order and tabs; see [meta.json conventions](./fumadocs/meta-json.md) |
| `.github/workflows/main.yml`    | CI validation and deploy                                                     |
| `docs/agents/*.md`              | Agent skill configuration                                                    |
| `.sandcastle/`                  | Sandbox image, prompts and runner settings                                   |
