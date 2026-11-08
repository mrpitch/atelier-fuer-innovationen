---
title: How to build and deploy the site
description: Build the static export with optimized images, preview it locally and understand what the GitHub Actions workflow publishes to S3 and CloudFront.
type: how-to
status: stable
last_reviewed: 2026-11-08
tags: [build, deploy, static-export, images, github-actions, aws]
---

# How to build and deploy the site

Deploys happen from CI when `main` changes. You rarely deploy by hand, but you build locally to check what will ship.

## Build locally

```bash
pnpm build
```

This runs `next build && next-image-export-optimizer`:

1. `next build` produces the static export in `out/` (`output: 'export'` in `next.config.mjs`). `trailingSlash: true` makes every route a directory: `/docs/xeniapolis` is written as `out/docs/xeniapolis/index.html`. It also writes `out/sitemap.xml`, listing every page.
2. `next-image-export-optimizer` reads every image in `public/`, writes resized WebP copies to `public/**/_optimized/`, and copies them into `out/_optimized/`. It also generates blur placeholders.

Verify: `out/index.html` and `out/docs/index.html` exist, and `out/_optimized/` holds files named after your images with a width suffix.

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
4. **`validate-stadtviertel`** runs `pnpm validate:stadtviertel`: `src/data/stadtviertel.json` is the canonical list of the eight Stadtviertel, and each Stadtviertel's `meta.json`, the order in `xeniapolis/meta.json` and the icon names must agree with it.
5. **`validate-copy-integrity`** runs `pnpm validate:copy-integrity`: every protected Xeniapolis text block recorded in `scripts/copy-integrity-baseline.json` must still exist verbatim somewhere in `src/content/docs/xeniapolis/` (see [glossary](../reference/glossary.md#protected-copy-and-editorial-text)).
6. **`build-check`** runs `pnpm build`, fails if the build log contains a pinned missing-image warning string (the list lives in the workflow step), and uploads `out/` as an artefact.
7. **`deploy`** runs on pushes only, once the six jobs above have passed. It downloads the `out/` artefact from `build-check`, syncs it to an S3 bucket with `aws s3 sync`, creates a CloudFront invalidation for `/*` and waits until it has completed. It doesn't build again.
8. **`verify-deploy`** runs after `deploy` and runs `pnpm check:deployed`: it requests `/sitemap.xml` and every address in it on the live host, plus `/favicon.ico`, and fails on anything but a 200.

All jobs run on every push and pull request; none is skipped by a path filter.

The workflow reads these from the repository settings:

| Kind     | Name                       |
| -------- | -------------------------- |
| Secret   | `AWS_S3_ACCESS_KEY_ID`     |
| Secret   | `AWS_S3_SECRET_ACCESS_KEY` |
| Secret   | `AWS_CF_DISTRIBUTION_ID`   |
| Variable | `AWS_S3_REGION`            |
| Variable | `AWS_S3_BUCKET_NAME`       |

The IAM user behind the access key needs `cloudfront:CreateInvalidation` and `cloudfront:GetInvalidation` (the wait step polls it).

A failure in any of the six check jobs stops the deploy, and the live site keeps the previous version. A pull request never deploys. A failure in `verify-deploy` means the site is already live with a broken address: read the failing URLs in the job log.

## Deploy by hand

Only if CI is unavailable. With AWS credentials in your environment:

```bash
pnpm build
aws s3 sync ./out/ s3://<bucket-name>
aws cloudfront create-invalidation --distribution-id <id> --paths "/*"
```

## Check the live site

```bash
pnpm check:deployed [baseUrl]
```

`baseUrl` defaults to the production origin in `src/lib/site.ts`. The script reads `<baseUrl>/sitemap.xml`, requests each listed path on `baseUrl` and exits 1 if any answer is not 200.

## Why `trailingSlash: true`

The CloudFront distribution runs the Function `RewriteSPAUrls` on every viewer request. It appends `/index.html` to a path without a file extension. The origin is the S3 REST endpoint, which answers 403 AccessDenied for a key that does not exist. Without `trailingSlash`, Next.js writes `out/docs/xeniapolis.html`, so `/docs/xeniapolis` was rewritten to the missing key `docs/xeniapolis/index.html` and answered 403. Only the `.html` addresses worked. React hydration error #418 appeared on every page load of those `.html` addresses and on none of the extensionless ones in a local run of the exported site. [INFERENCE] The browser path `/docs/xeniapolis.html` matches no route, so the client render differs from the prerendered HTML.

Keep `trailingSlash: true` as long as that Function is attached. Pages from earlier deploys (`docs/xeniapolis.html`) stay in the bucket, because the sync runs without `--delete`.

## Troubleshooting

- **A page answers 403 after a deploy:** the file is not at `<path>/index.html` in `out/`. Check `next.config.mjs` for `trailingSlash: true`, and run `pnpm check:deployed` to see every failing address.
- **A link in the content logs a failed request in the console:** `next/link` prefetches every internal href. Point content links at real routes (`/docs/...`) and link files with a plain `<a>`, as `<Slide>` does for PDFs.
- **Images are missing from `out/`:** `pnpm build` was replaced by a bare `next build`. The second half of the script copies the optimized images in.
- **Old content still shows after deploy:** the CloudFront invalidation has not finished. It can take a few minutes.
- **A new image is missing from the optimized folder:** optimization runs during `pnpm build`. Run it again after adding images to `public/`.
