# Atelier für Innovationen

A documentation site for innovation methods and knowledge sharing, built with Next.js 16, Fumadocs and TypeScript. Authors write MDX, and the build produces a static export with optimized images that is deployed to S3 behind CloudFront.

The site has two content sections, Atelier and Xeniapolis, each with its own color palette.

## Quick start

You need Node.js 20.9 or newer and pnpm. The repo pins `pnpm@11.3.0`, which Corepack picks up automatically.

```bash
git clone https://github.com/mrpitch/atelier-fuer-innovationen.git
cd atelier-fuer-innovationen
pnpm install
pnpm dev
```

Open http://localhost:3000. The content is under `/docs`.

## Scripts

| Command                        | What it does                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------- |
| `pnpm dev`                     | Dev server on port 3000                                                         |
| `pnpm build`                   | Static export to `out/`, then image optimization                                |
| `pnpm start`                   | Serves `out/` locally to preview the export                                     |
| `pnpm test`                    | Tests for the tooling in `scripts/`                                             |
| `pnpm validate:okf`            | Fails if a Markdown or MDX file has no `type` frontmatter                       |
| `pnpm validate:copy-integrity` | Fails if a protected Xeniapolis text block was edited, split, merged or deleted |
| `pnpm afk <issue>`             | Runs the sandboxed agent on a GitHub issue (see below)                          |
| `pnpm nuke`                    | Deletes `node_modules` and `pnpm-lock.yaml`                                     |

`pnpm install` also runs `fumadocs-mdx`, which generates `.source/` from the content.

## Project structure

```
src/
  app/
    (home)/          Home page route group
    _components/     Home hero and footer
    api/search/      Static search index route
    docs/            Docs route and layout
    layout.tsx       Root layout and search provider
    layout.config.tsx  Shared Fumadocs layout options
  components/        MDX components: slides, illustrations, image zoom,
                     overview cards, tabs wrapper, and ui/ (button variants)
  content/docs/      MDX pages and meta.json per section
    atelier/
    xeniapolis/
  data/              slides.json and illus.json
  lib/               source loader, styles, fonts, helpers
public/              Images, illustrations and slides
scripts/             OKF validator, Sandcastle runner, project status script
docs/                Project documentation (Diataxis)
.sandcastle/         Sandbox image, prompts and runner settings
.github/workflows/   CI and deploy
```

Generated and ignored: `.source/` (Fumadocs output), `out/` (static export), `.next/`.

## Writing content

Pages are MDX files under `src/content/docs/`. Add the file, then list its slug in the section's `meta.json` to put it in the sidebar. Each page needs `title`, `description` and `type` in its frontmatter. Custom components must be imported at the top of the page.

The live component showcase is at `/docs/components`. For step-by-step instructions, see the [tutorial](docs/tutorials/getting-started.md) and [how to add a content page](docs/how-to/how-to-add-a-content-page.md).

## Build and deploy

`pnpm build` runs `next build` (static export, `output: 'export'`) and then `next-image-export-optimizer`, which writes responsive WebP copies of every image in `public/`.

Pushing to `main` triggers `.github/workflows/main.yml`. Jobs `quality` (format, lint, typecheck) and `validate-okf` (tests, frontmatter) run first; if both pass, `deploy` builds the site, syncs `out/` to S3 and invalidates CloudFront. Pull requests targeting `main` run the two checks only. See [how to build and deploy](docs/how-to/how-to-build-and-deploy.md) for the required secrets and variables.

## Stack

- Next.js 16 (App Router, static export), React 19, TypeScript 5
- Fumadocs: `fumadocs-core`, `fumadocs-mdx`, `@fumadocs/base-ui`
- Tailwind CSS 4, `class-variance-authority`, Lucide icons
- `next-image-export-optimizer` for images, `react-medium-image-zoom` for zoom
- ESLint 9, Prettier 3

## Documentation

Project documentation lives in [`docs/`](docs/index.md), organized as tutorials, how-to guides, reference, explanation and ADRs. Start with:

- [Getting started](docs/tutorials/getting-started.md)
- [Configuration](docs/reference/configuration.md)
- [About the architecture](docs/explanation/about-architecture.md)

## Agent workflow

Issues are worked as epics with `afk` (unattended) and `hitl` (supervised) sub-issues through the `/implement-epic` skill. `afk` issues run in a Docker sandbox. See [about the epic/afk workflow](docs/explanation/about-the-epic-afk-workflow.md) and [how to run an afk sandbox](docs/how-to/how-to-run-an-afk-sandbox.md).

Agent configuration is in `AGENTS.md` and `docs/agents/`.
