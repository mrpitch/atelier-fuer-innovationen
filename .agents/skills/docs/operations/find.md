# Find Operation

**When**: before reading, writing or auditing docs — shortlist the docs that answer a question from frontmatter alone, without opening any file.

## Run

```bash
npx tsx {baseDir}/scripts/discover.ts <docs_root>   # default: docs
```

Other skills call the same script by its installed path, `.claude/skills/docs/scripts/discover.ts`.

The script walks `.md` and `.mdx` files recursively and prints a JSON array, one entry per file. It skips hidden folders and the reserved `index.md` / `log.md`, so a bundle's navigation files never compete with its concept docs. It reads top-level frontmatter keys only; a nested key such as `generated.by` or `sources[].title` never replaces a top-level one, and nested values come back as `""`.

```json
{
	"file": "docs/how-to/how-to-deploy-to-dev.md",
	"folder": "docs/how-to",
	"hasFrontmatter": true,
	"frontmatter": { "type": "how-to", "title": "How to deploy backend to dev", "description": "…", "tags": ["backend", "deploy"], "status": "stable", "last_reviewed": "2026-04-24", "authoritative": false },
	"titleFallback": null
}
```

`titleFallback` holds the first `# Heading` and is set only when `hasFrontmatter` is `false`.

## Shortlist

1. **Shortlist** 1–5 candidates from frontmatter alone.
2. **Rank** by, in order: exact match on `title`, `description` or `tags` → `authoritative: true` → `status: stable` over `draft` and `deprecated` → most recent `last_reviewed` → `type` matching the question (`how-to` and `runbook` for tasks, `reference`, `explanation` and `adr` for design questions, `tutorial` for learning).
3. Treat `hasFrontmatter: false` or a missing required key (`type`, `title`, `description`) as lower confidence; judge those by `titleFallback` and folder.
4. `read` only the shortlisted candidates in full.

For an architecture bundle, `index.md` files are the second route in: read root, section, concept, one level at a time.

Without `npx tsx`, fall back to `find <docs_root> -name '*.md'` and read frontmatter directly.

**Done when:** 1–5 candidates are named, each with the metadata that ranked it, and none has been opened yet.
