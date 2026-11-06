---
type: reference
title: Page headings start at H2
description: The frontmatter title renders the page's only H1, so MDX bodies start at ## and never contain a top-level #.
tags: [content, mdx, headings, accessibility]
status: stable
last_reviewed: 2026-11-05
---

# Page headings start at H2

The frontmatter `title` is rendered as the page's `<h1>`. Start the body at `##`.

```mdx
---
title: Kurzübersicht
description: ...
type: Article
status: draft
---

## Kondratieff´s Zyklen

### Sub-topic
```

- Never write `# Heading` in the body: it adds a second `<h1>`.
- Don't skip levels (`##` then `####`).
- Verify: the built page has one `<h1>`: `grep -c '<h1' out/docs/<page>.html`.
