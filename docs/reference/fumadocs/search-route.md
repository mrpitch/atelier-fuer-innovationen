---
name: "Static search API route"
description: "The search route exports createFromSource(source)'s staticGET as GET, not the dynamic GET — required for this repo's static-export deployment."
kind: reference
type: Reference
status: current
last_reviewed: 2026-08-22
tags: [fumadocs, search, static-export, api-route]
---

# Static search API route

`src/app/api/search/route.ts`:

```ts
import { source } from '@/lib/source'
import { createFromSource } from 'fumadocs-core/search/server'

// output: standalone, server side api route
// export const { GET } = createFromSource(source);

// output: export, client side api route
// it should be cached forever
export const revalidate = false

export const { staticGET: GET } = createFromSource(source)
```

- Export `staticGET` renamed to `GET`, **not** the dynamic `GET` that `createFromSource` also returns. Fumadocs' own docs/examples default to showing the dynamic `GET` — copying that literally builds fine but breaks search once deployed, since this site has no server runtime to serve a dynamic API route.
- `revalidate = false` caches the generated static search index forever — correct for a build-time-static index that only changes on redeploy.
- The commented-out `export const { GET } = createFromSource(source)` above is a deliberate note, not dead code — it's the standalone/server-rendered alternative, kept as a pointer for if this site ever moves off static export.
