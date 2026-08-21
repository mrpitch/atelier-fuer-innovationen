## Agent skills

### Issue tracker

GitHub issues via the `gh` CLI; PRs are not treated as a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical roles (`needs-triage`, `needs-info`, `afk`, `hitl`, `wontfix`); `ready-for-agent`/`ready-for-human` map to `afk`/`hitl`. See `docs/agents/triage-labels.md`.

### Domain docs

Diataxis four-quadrant layout under `docs/` (tutorial/how-to/reference/explanation/adr), scaffolded lazily. See `docs/agents/domain.md`.

### Implementation workflow

Epic/afk workflow via `/implement-epic`; sandboxed `afk` execution via Sandcastle, GitHub Project #11 status sync, auto-merge of afk sub-issues enabled. See `docs/agents/implementation-workflow.md`.
