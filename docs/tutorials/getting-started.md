---
title: Getting started
description: Clone the repository, run the site locally and publish your first page in the Atelier section.
type: tutorial
status: stable
last_reviewed: 2026-11-05
tags: [getting-started, onboarding, setup, first-page]
---

# Getting started

In this tutorial you run the site on your machine and add a page of your own. It takes about ten minutes.

You need Node.js 20.9 or newer, pnpm and Git.

## 1. Get the code

```bash
git clone https://github.com/mrpitch/atelier-fuer-innovationen.git
cd atelier-fuer-innovationen
pnpm install
```

The install ends with a line from `fumadocs-mdx`. It generates the `.source/` folder the site reads its content from.

## 2. Start the site

```bash
pnpm dev
```

Open http://localhost:3000. You see the home page. Open http://localhost:3000/docs/atelier to see the Atelier section with its sidebar on the left.

Leave the dev server running.

## 3. Create a page

Create `src/content/docs/atelier/hello-world.mdx` with this content:

```mdx
---
title: Hello world
description: My first page on the site.
type: Article
status: draft
---

This is my first page.
```

Open http://localhost:3000/docs/atelier/hello-world. The page renders with your title and text. It is not in the sidebar yet.

## 4. Put it in the sidebar

Open `src/content/docs/atelier/meta.json`. Add `"hello-world"` to the end of the `pages` array:

```json
{
	"pages": [
		"index",
		"a-whales-tale",
		"story-example-1",
		"story-example-2",
		"hello-world"
	]
}
```

Save the file. "Hello world" now appears in the Atelier sidebar.

## 5. Run the checks

Open a second terminal in the same folder:

```bash
pnpm validate:okf
```

It prints `OKF conformance: OK`. The check passes because your page has a `type`.

## What you built

You cloned the site, ran it locally and added a page that shows up in the navigation. Pages are MDX files, and each section's `meta.json` controls the sidebar.

Remove the page again before you commit, unless you want to keep it: delete `hello-world.mdx` and the `"hello-world"` entry in `meta.json`.

## Next steps

- [How to add a content page](../how-to/how-to-add-a-content-page.md) covers the frontmatter fields and custom components.
- [How to run the site locally](../how-to/how-to-run-locally.md) covers tests and the static preview.
- [About the architecture](../explanation/about-architecture.md) explains how the pieces fit together.
