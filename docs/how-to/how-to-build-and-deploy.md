---
title: How to build and deploy the site
description: Build the static export with optimized images, preview it locally and understand what the GitHub Actions workflow publishes to S3 and CloudFront.
type: how-to
status: stable
last_reviewed: 2026-11-05
tags: [build, deploy, static-export, images, github-actions, aws]
---

# How to build and deploy the site

Deploys happen from CI when `main` changes. You rarely deploy by hand, but you build locally to check what will ship.

## Build locally

```bash
pnpm build
```

This runs `next build && next-image-export-optimizer`:

1. `next build` produces the static export in `out/` (`output: 'export'` in `next.config.mjs`).
2. `next-image-export-optimizer` reads every image in `public/`, writes resized WebP copies to `public/**/_optimized/`, and copies them into `out/_optimized/`. It also generates blur placeholders.

Verify: `out/index.html` exists, and `out/_optimized/` holds files named after your images with a width suffix.

Preview the result:

```bash
pnpm start
```

`pnpm start` serves `out/` with `npx serve@latest`.

## What CI does

`.github/workflows/main.yml` runs on every push to `main` and on every pull request targeting `main`:

1. **`quality`** runs `pnpm format:check`, `pnpm lint` and `pnpm typecheck`.
2. **`validate-okf`** runs `pnpm test` and `pnpm validate:okf`.
3. **`validate-content`** runs `pnpm validate:content`: every `<Illu>`/`<Slide>` slug, registry asset, `meta.json` entry and relative image or link in the content must resolve.
4. **`build-check`** runs `pnpm build`, fails if the build log contains a pinned missing-image warning string (the list lives in the workflow step), and uploads `out/` as an artefact.
5. **`deploy`** runs on pushes only, once the four jobs above have passed. It downloads the `out/` artefact from `build-check`, syncs it to an S3 bucket with `aws s3 sync`, then creates a CloudFront invalidation for `/*`. It doesn't build again.

All jobs run on every push and pull request; none is skipped by a path filter.

The workflow reads these from the repository settings:

| Kind     | Name                       |
| -------- | -------------------------- |
| Secret   | `AWS_S3_ACCESS_KEY_ID`     |
| Secret   | `AWS_S3_SECRET_ACCESS_KEY` |
| Secret   | `AWS_CF_DISTRIBUTION_ID`   |
| Variable | `AWS_S3_REGION`            |
| Variable | `AWS_S3_BUCKET_NAME`       |

A failure in any of the four check jobs stops the deploy, and the live site keeps the previous version. A pull request never deploys.

## Deploy by hand

Only if CI is unavailable. With AWS credentials in your environment:

```bash
pnpm build
aws s3 sync ./out/ s3://<bucket-name>
aws cloudfront create-invalidation --distribution-id <id> --paths "/*"
```

## Troubleshooting

- **Images are missing from `out/`:** `pnpm build` was replaced by a bare `next build`. The second half of the script copies the optimized images in.
- **Old content still shows after deploy:** the CloudFront invalidation has not finished. It can take a few minutes.
- **A new image is missing from the optimized folder:** optimization runs during `pnpm build`. Run it again after adding images to `public/`.
