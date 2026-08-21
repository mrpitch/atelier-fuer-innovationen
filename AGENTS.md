## Agent skills

### Issue tracker

GitHub issues via the `gh` CLI; PRs are not treated as a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical roles (`needs-triage`, `needs-info`, `afk`, `hitl`, `wontfix`); `ready-for-agent`/`ready-for-human` map to `afk`/`hitl`. See `docs/agents/triage-labels.md`.

### Domain docs

Diataxis four-quadrant layout under `docs/` (tutorial/how-to/reference/explanation/adr), scaffolded lazily. See `docs/agents/domain.md`.

### Implementation workflow

Epic/afk workflow via `/implement-epic`; sandboxed `afk` execution via Sandcastle, GitHub Project #11 status sync, auto-merge of afk sub-issues enabled. See `docs/agents/implementation-workflow.md`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
