---
type: reference
title: Catalog components read src/data/*.json by slug
description: Reusable assets live in src/data/<name>.json and render through async server components that look entries up by slug and return null when missing.
tags: [components, data, json, slides, illustrations, server-components]
status: stable
last_reviewed: 2026-11-05
---

# Catalog components read src/data/\*.json by slug

Reusable assets (slides, illustrations) are catalogued once in `src/data/<name>.json` and referenced by slug from many pages. A new catalog copies the shape of `slides.tsx` and `illus.tsx`:

```tsx
const getThingsData = async () => {
	try {
		const data = await import('@/data/things.json')
		return data.things as IThing[]
	} catch (error) {
		console.error('Error loading things:', error)
		return [] as IThing[]
	}
}

export const Thing = async ({ slug }: { slug: string }) => {
	const thing = (await getThingsData()).find((t) => t.slug === slug)
	if (!thing) return null
	// render
}
```

- JSON file `src/data/<name>.json` with a top-level array key. The entry interface lives in the component file, `I`-prefixed (`ISlide`, `IIllu`).
- Two exports per catalog: `Thing` (one, by `slug`) and `Things` (lists names).
- Async server components, no `'use client'`. Images render through `ImageZoom`.
- Load errors and unknown slugs never fail the build. They log or render nothing, so check the page output. See [Register slides and illustrations before using them](../components.md#register-slides-and-illustrations-before-using-them).
