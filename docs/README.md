# Documentation

This directory uses the [Diataxis](https://diataxis.fr/) framework.

## Quick Links

| Type                        | Purpose                        | Start Here                    |
| --------------------------- | ------------------------------ | ----------------------------- |
| [Tutorials](tutorial/)      | Learn by doing                 | New contributors              |
| [How-to Guides](how-to/)    | Solve a specific task          | Day-to-day work               |
| [Reference](reference/)     | Look up technical facts        | API / config lookup           |
| [Explanation](explanation/) | Understand the "why"           | Onboarding, design            |
| [ADRs](adr/)                | Architectural decision records | Understanding a past decision |

## Finding What You Need

- **New here?** Start with [tutorials](tutorial/) and the root [`AGENTS.md`](../AGENTS.md).
- **Need to ship a change?** See [how-to guides](how-to/).
- **Looking up a component, config, or the domain glossary?** See [reference](reference/) (start with [`reference/glossary.md`](reference/glossary.md)).
- **Want context on architecture or design decisions?** See [explanation](explanation/) and [adr](adr/).

## Not part of this documentation tree

`src/content/docs/` is the site's published product content (the Fumadocs-rendered Atelier/Xeniapolis pages) — it is not contributor/agent documentation and is out of scope for this `docs/` tree. See `docs/agents/diataxis-context.md`.

## Contributing

When adding documentation, pick exactly one type. If a doc seems to need two,
split it. Every doc must start with the frontmatter contract (`name`,
`description`, `tags`, plus `kind`, `status`, `last_reviewed`) — agents use
`docs-discovery` to find and rank docs, so weak frontmatter makes your doc
harder to find.
