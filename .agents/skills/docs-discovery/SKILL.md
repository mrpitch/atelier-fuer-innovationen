---
name: docs-discovery
description: 'Scan any docs folder and return YAML frontmatter metadata for every Markdown file — without reading full file contents. Use as the first step before reading, writing, or auditing docs to shortlist candidates by metadata.'
---

# docs-discovery

## Purpose

Recursively scans a folder for `.md` and `.mdx` files and returns a JSON array with one entry per file. Each entry includes the parsed YAML frontmatter (or `null` when absent) and a title fallback from the first `#` heading — giving agents a cheap way to discover and rank documents before opening any file.

Use this tool at the start of every documentation task to avoid reading files blindly.

## Usage

### Claude Code

Run the script from the project root:

```bash
npx tsx .claude/skills/docs-discovery/scripts/discover.ts docs
```

Or use Bash to scan frontmatter directly:

```bash
find docs -name '*.md' | xargs grep -l '^---' | head -20
```

For full frontmatter extraction, use the discover script — it outputs JSON with parsed frontmatter for every file. For raw frontmatter, use a quick Bash scan or read individual files.

## Output format

```json
[
	{
		"file": "docs/how-to/how-to-deploy-to-dev.md",
		"folder": "docs/how-to",
		"hasFrontmatter": true,
		"frontmatter": {
			"name": "How to deploy backend to dev",
			"description": "Procedure to deploy the backend Lambda + CDK stacks to the dev environment.",
			"tags": ["backend", "deploy", "cdk", "dev-environment"],
			"kind": "how-to",
			"status": "current",
			"last_reviewed": "2026-04-24",
			"authoritative": false
		},
		"titleFallback": null
	},
	{
		"file": "docs/explanation/about-architecture.md",
		"folder": "docs/explanation",
		"hasFrontmatter": false,
		"frontmatter": null,
		"titleFallback": "About the Application Architecture"
	}
]
```

| Field            | Type             | Description                                                       |
| ---------------- | ---------------- | ----------------------------------------------------------------- |
| `file`           | `string`         | Path relative to the project root                                 |
| `folder`         | `string`         | Parent directory of the file (relative to project root)           |
| `hasFrontmatter` | `boolean`        | `true` when a `---` frontmatter block was found and parsed        |
| `frontmatter`    | `object \| null` | Parsed YAML fields; `null` when `hasFrontmatter` is `false`       |
| `titleFallback`  | `string \| null` | Text of the first `# Heading`; `null` when frontmatter is present |

## Ranking guidance

After receiving the array, shortlist 1–5 candidates **from metadata alone** before opening any file:

1. Exact match on `frontmatter.name`, `frontmatter.description`, or `frontmatter.tags`
2. `frontmatter.authoritative: true`
3. `frontmatter.status: "current"` over `"draft"` or `"deprecated"`
4. Most recent `frontmatter.last_reviewed`
5. `frontmatter.kind` matching the intent (`how-to`/`runbook` for tasks, `reference`/`explanation`/`adr` for design questions, `tutorial` for onboarding)

Treat `hasFrontmatter: false` as lower confidence; use `titleFallback` + folder path to judge relevance.

## Source

Discovery script: [`.claude/skills/docs-discovery/scripts/discover.ts`](./scripts/discover.ts)
