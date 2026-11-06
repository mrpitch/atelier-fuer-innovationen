---
type: explanation
title: 'Static Export Strategy'
arc42_section: 8
description: 'Why every building block must work without a server at request time, and the constraints that follow for search, images and routing.'
tags: [architecture, crosscutting, static-export, nextjs]
status: draft
generated:
  by: docs-code-to-docs/1.0.0
  at: 2026-11-05T11:01:33Z
sources:
  - resource: next.config.mjs
  - resource: src/app/api/search/route.ts
  - resource: src/app/layout.tsx
  - resource: src/app/docs/[[...slug]]/page.tsx
  - resource: package.json
links:
  - 07-deployment/deployment-topology.md
  - 08-crosscutting/security-strategy.md
---

# Static Export Strategy

## Context

`next.config.mjs` sets `output: 'export'`. `next build` writes HTML, JSON and assets to `out/` and nothing else. This is the one structural decision every building block inherits, and it is not recorded as an ADR; the rationale below is from [About the architecture](../../explanation/about-architecture.md).

## Discussion

The rule is: nothing may need a server at request time. Four building blocks carry the consequences:

| Building block     | What the rule forces                                                                                                                                                                         |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Docs Route         | `generateStaticParams` returns every slug from the page tree, so each page exists as a file. A slug that is not in the page tree has no file.                                                |
| Search Index Route | The route exports `staticGET` and `revalidate = false`. The root layout configures the search provider with `type: 'static'`, so the browser downloads the whole index and searches locally. |
| Image Pipeline     | The default Next.js image optimizer needs a server. `images.loader: 'custom'` with `next-image-export-optimizer` resizes at build time instead.                                              |
| App Shell          | Providers must work in the browser alone. Nothing may read cookies, headers or request data.                                                                                                 |

The same rule fixes what the deploy is: a file sync plus a cache invalidation, with no process to run or patch (see [Deployment View](../07-deployment/deployment-topology.md)).

## Consequences

- No server-side API routes, middleware, redirects configured in Next.js, or request-time rendering. Redirects and headers have to live at the CDN.
- The search index grows with the content and every visitor downloads all of it. [INFERENCE] This is fine for the current page count and needs a second look if the content grows by an order of magnitude; see [RISK-05](../11-risks/risks-and-tech-debt.md).
- Images added to `public/` only appear in `out/_optimized/` after `pnpm build` runs; a bare `next build` leaves them out.
- A feature that needs per-visitor state (accounts, comments, forms) cannot be added inside this architecture. It needs an external service or a decision to drop the static export.

## See also

- [About the architecture](../../explanation/about-architecture.md)
- [Search route](../../reference/fumadocs/search-route.md)
