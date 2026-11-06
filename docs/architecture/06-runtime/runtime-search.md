---
type: explanation
title: 'Runtime View — Search'
arc42_section: 6
description: 'How search works without a server: the browser downloads a prebuilt index once and queries it locally.'
tags: [architecture, runtime, search]
status: draft
generated:
  by: docs-code-to-docs/1.0.0
  at: 2026-11-05T11:16:00Z
sources:
  - resource: src/app/api/search/route.ts
  - resource: src/app/layout.tsx
  - resource: docs/reference/fumadocs/search-route.md
  - resource: out/api/search
links:
  - 06-runtime/runtime-main-flow.md
  - 08-crosscutting/static-export-strategy.md
---

# Runtime View — Search

## Scenario: Visitor searches the docs

**Trigger:** a visitor opens the search dialog and types a query.

**Actors involved:** Visitor, AWS hosting (CloudFront), AWS hosting (S3). Building blocks: the Search Index Route output and the App Shell, which configures the search provider with `type: 'static'`.

### Sequence

```mermaid
sequenceDiagram
  accTitle: Search without a server
  accDescr: On first use the browser downloads the prebuilt search index from CloudFront, which serves it from the cache or from S3. Every query after that runs locally in the browser.
  autonumber
  participant V as Visitor
  participant CF as AWS hosting (CloudFront)
  participant S3 as AWS hosting (S3)

  V->>CF: GET /api/search (first use only)
  alt cached at the edge
    CF-->>V: search index
  else cache miss
    CF->>S3: GET api/search
    S3-->>CF: search index
    CF-->>V: search index
  end
  Note over V: Builds the index in memory
  loop each query
    V->>V: Search locally
  end
```

_Figure: search, sequence._

### Notes

- The index is one file, `out/api/search`, written at build time by the Search Index Route from the same page tree as the sidebar. In the local `out/` checked on 2026-11-05 it is about 2.3 MB. See [RISK-05](../11-risks/risks-and-tech-debt.md).
- After the download, queries cost no further requests.
- **Failure mode.** If the route exports the dynamic `GET` instead of `staticGET`, `next build` still succeeds and search breaks after deploy, because no server exists to answer `/api/search`. [Static search API route](../../reference/fumadocs/search-route.md) documents the rule. Nothing in CI catches it.
- A new page appears in search only after the next deploy and cache invalidation.

## See also

- [Page view](./runtime-main-flow.md)
