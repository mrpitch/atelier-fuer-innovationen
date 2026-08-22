---
name: "Sidebar tab icon color transform"
description: "The docs layout's tabs.transform reads source.getNodeMeta() to build a per-top-level-folder CSS color variable for sidebar tab icons, following fumadocs' own documented pattern."
kind: reference
status: current
last_reviewed: 2026-08-22
tags: [fumadocs, sidebar, tabs, theming, source-loader]
---

# Sidebar tab icon color transform

`src/app/docs/layout.tsx`:

```tsx
tabs: {
	transform(option, node) {
		const meta = source.getNodeMeta(node)
		if (!meta) return option

		const color = `var(--${PathUtils.dirname(meta.path)}-color, var(--color-fd-foreground))`

		return {
			...option,
			icon: (
				<div style={{ color, border: `1px solid color-mix(in oklab, ${color} 50%, transparent)`, /* ... */ }}>
					{node.icon}
				</div>
			),
		}
	},
},
```

- This is fumadocs' own documented sidebar-tabs pattern (see the Docs Layout guide), not a custom invention — `source.getNodeMeta(node)` + a `--<top-level-folder>-color` CSS variable with a `var(--color-fd-foreground)` fallback is the example fumadocs itself ships.
- The color variable is **opt-in per top-level content folder** (e.g. `--atelier-color`, `--xeniapolis-color` for `src/content/docs/atelier/`, `src/content/docs/xeniapolis/`). As of this writing, **no section defines one** — every tab icon currently renders with the default `--color-fd-foreground`, which is the intended fallback behavior, not a bug. To give a section its own accent color, define `--<folder>-color` in `globals.css` (or wherever theme tokens live) for that folder name.
- `PathUtils.dirname(meta.path)` derives the folder name from the node's file path — the variable name must match the top-level folder under `src/content/docs/` exactly.
- Two things moved here in the v16 upgrade, worth knowing if you're diffing against pre-upgrade code: the `tabs` option itself moved from nested `sidebar.tabs.transform` (now deprecated) to top-level `DocsLayoutProps.tabs.transform`; and `getNodeMeta()`'s return type dropped `.file.dirname` in favor of a virtualized `.path`, which is why the color derivation now goes through `PathUtils.dirname(meta.path)` from `fumadocs-core/source` instead of reading `.file.dirname` directly.
