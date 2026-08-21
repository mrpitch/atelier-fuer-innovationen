# Implementation Workflow

This repo uses the **epic/afk workflow** (`/implement-epic`) instead of — or alongside — plain `/implement`. A spec issue (from `/to-spec`) is the epic; its sub-issues (from `/to-tickets`, as GitHub native sub-issues) are worked one at a time, gated `afk` (autonomous) or `hitl` (supervised).

See `.agents/skills/implement-epic/SKILL.md` for the full workflow. This file carries the label mapping plus three optional extras:

## afk / hitl labels

<!-- Default: reuse this repo's afk/hitl triage-label mapping (see docs/agents/triage-labels.md, where ready-for-agent/ready-for-human default to afk/hitl) so one label serves both triage and execution gating. Override these two fields only if you want execution-autonomy tracked separately from triage-readiness — e.g. an issue can be ready-for-agent without being cleared for unattended sandbox execution. `/setup-my-skills`'s label-ensure step keeps a GitHub label matching whatever these two resolve to. The epic-marking label used alongside this workflow, `epic`, is managed the same way but is a fixed, non-configurable name — there's no field for it here. -->

`afk_label`: `afk`
`hitl_label`: `hitl`

## Sandbox command

<!-- Leave blank to run afk issues in-session (identical to hitl). Fill in only if this repo has an isolated sandbox runner. -->

`sandbox_command`: `pnpm tsx scripts/run-sandcastle.ts {issue}`

## Project status command

<!-- Leave blank to skip GitHub Project board status syncing entirely. -->

`project_status_command`: `./scripts/set-project-status.sh {issue} {status}`

Syncs to GitHub Project #11 (`https://github.com/users/mrpitch/projects/11`).

## Auto-merge afk epic sub-issues

`auto_merge_afk_epic_subissues`: `true`

<!-- Set to `true` only if you want afk sub-issues that clear every gate (implementation, validation, review) to squash-merge into the epic branch unattended. The epic→trunk PR always stays human-reviewed regardless of this setting. -->
