---
type: reference
title: 'Interface Table'
arc42_section: 3
description: 'External interfaces of the site with IF-xx IDs: protocol, data format and direction for each.'
tags: [architecture, context]
status: draft
generated:
  by: docs-code-to-docs/1.0.0
  at: 2026-11-05T11:01:33Z
sources:
  - resource: .github/workflows/main.yml
  - resource: next.config.mjs
  - resource: src/lib/styles/fonts/index.ts
  - resource: package.json
links:
  - 03-context/context-and-scope.md
  - 05-building-blocks/building-blocks-level1.md
---

# Interface Table

External interfaces of the site. The `IF-xx` IDs are reused in [§5](../05-building-blocks/building-blocks-level1.md); do not renumber them.

## External interfaces

| ID    | External system  | Interface / Protocol                                     | Data format                               | Direction |
| ----- | ---------------- | -------------------------------------------------------- | ----------------------------------------- | --------- |
| IF-01 | Visitor          | HTTPS `GET` to the CloudFront distribution               | HTML, JSON search index, WebP, PDF        | ← System  |
| IF-02 | GitHub           | `git push` to `main`                                     | Source files (MDX, JSON, TypeScript, CSS) | → System  |
| IF-03 | AWS hosting (S3) | `aws s3 sync ./out/ s3://<bucket>` over the S3 API       | Static files from `out/`                  | ← System  |
| IF-04 | AWS hosting (CF) | `aws cloudfront create-invalidation --paths "/*"`        | Invalidation request                      | ← System  |
| IF-05 | Google Fonts     | HTTPS download by `next/font/google` during `next build` | Font files                                | → System  |
| IF-06 | Package registry | HTTPS from `pnpm install`                                | npm packages and lockfile-pinned tarballs | → System  |

Direction is relative to the system: `→ System` data flows in, `← System` data flows out.

## Notes

- **IF-01** is the only run-time interface. The site sends no requests of its own to other systems after the page has loaded; search runs against an index the browser downloads once from the same origin.
- **IF-03 and IF-04** authenticate with the secrets `AWS_S3_ACCESS_KEY_ID`, `AWS_S3_SECRET_ACCESS_KEY` and `AWS_CF_DISTRIBUTION_ID`. The bucket name and region come from the variables `AWS_S3_BUCKET_NAME` and `AWS_S3_REGION`. See [Security conventions](../08-crosscutting/security-conventions.md).
- **IF-05** is build-time only. `next/font/google` downloads the files and Next.js serves them from the site's own origin afterwards. A visitor never contacts Google.
- **IF-06** applies to local installs, CI and the agent sandbox alike.

## See also

- [Context and Scope](./context-and-scope.md)
- [How to build and deploy the site](../../how-to/how-to-build-and-deploy.md)
