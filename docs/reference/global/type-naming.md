---
type: reference
title: 'Type names: I-prefix for data, Props suffix for components'
description: Data shapes loaded from JSON are interfaces with an I prefix; exported component props types end in Props.
tags: [typescript, naming, interfaces, props, code-style]
status: stable
last_reviewed: 2026-11-05
---

# Type names: I-prefix for data, Props suffix for components

```ts
interface ISlide {
	slug: string
	name: string
	image: string
	url?: string
}

export interface TabsProps extends BaseTabsProps {
	groupId?: string
}
```

- Data shapes (JSON entries in `src/data/`): `interface I<Name>`, kept unexported in the component file (`ISlide`, `IIllu`).
- Exported component props: `<Component>Props` (`TabsProps`, `ImageZoomProps`), `interface` or `type`.
- Tiny components type props inline: `({ slug }: { slug: string })`.
- Only four local types exist, so this is a convention that ESLint does not enforce.
