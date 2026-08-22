---
name: "RootProvider: framework entrypoint + static search"
description: "RootProvider must be imported from fumadocs-ui/provider/next and configured with search.options.type: 'static' for this repo's statically-exported site."
kind: reference
status: current
last_reviewed: 2026-08-22
tags: [fumadocs, provider, search, static-export, v16]
---

# RootProvider: framework entrypoint + static search

`RootProvider` lives at `src/app/layout.tsx`.

```tsx
import { RootProvider } from 'fumadocs-ui/provider/next'

<RootProvider
	search={{
		options: {
			type: 'static',
		},
	}}
>
	{children}
</RootProvider>
```

- Import from `fumadocs-ui/provider/next`, never the bare `fumadocs-ui/provider` — **v16 removed the generic entrypoint entirely** and split it per framework (`/next`, `/react-router`, `/tanstack`, `/waku`, `/astro`), each with different internals (e.g. the Astro variant needs `pathname`/`params`/`navigate` props, Tanstack needs `HeadContent`/`Scripts`). The bare import will fail to resolve.
- `search.options.type` must stay `'static'`. This site builds via `next export`/static output (see `docs/reference` on the search route) — there's no server to run a dynamic search API in production. Leaving this at the default (`'fetch'`) builds and runs fine locally under `next dev` but **silently breaks search in the deployed static site** — no error, just an empty/failing search UI, since the client tries to hit an endpoint that isn't there.
