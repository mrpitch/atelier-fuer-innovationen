# Implementation Workflow

This repo uses the **epic/afk workflow** (`/implement-epic`) instead of — or alongside — plain `/implement`. A spec issue (from `/to-spec`) is the epic; its sub-issues (from `/to-tickets`, as GitHub native sub-issues) are worked one at a time, gated `afk` (autonomous) or `hitl` (supervised).

See `.agents/skills/implement-epic/SKILL.md` for the full workflow. This file carries the label mapping plus four optional extras, and the `/release` settings at the end:

## afk / hitl labels

<!-- Default: reuse this repo's afk/hitl triage-label mapping (see docs/agents/triage-labels.md, where ready-for-agent/ready-for-human default to afk/hitl) so one label serves both triage and execution gating. Override these two fields only if you want execution-autonomy tracked separately from triage-readiness — e.g. an issue can be ready-for-agent without being cleared for unattended sandbox execution. `/setup-my-skills`'s label-ensure step keeps a GitHub label matching whatever these two resolve to. The epic-marking label used alongside this workflow, `epic`, is managed the same way but is a fixed, non-configurable name — there's no field for it here. -->

`afk_label`: `afk`
`hitl_label`: `hitl`

## Sandbox command

<!-- Leave blank to run afk issues in-session (identical to hitl). Fill in only if this repo has an isolated sandbox runner. -->

`sandbox_command`: _(none configured)_

Example: `pnpm tsx scripts/run-sandcastle.ts {issue}` — `{issue}` is substituted with the issue number. Keep it a literal template; `implement-epic` never builds it from a dynamic expression.

`implement-epic` invokes `sandbox_command` directly — unlike the `afk` `package.json` script, it does not load `.sandcastle/.env` first. The sandcastle orchestrator itself reads `.sandcastle/.env` automatically and passes its contents into the *container's* environment, so `CLAUDE_CODE_OAUTH_TOKEN` reaches the agent correctly either way. But `DOCKER_HOST` (needed to find Colima's socket on macOS) is read from the *host* Node process's environment before the container even starts — it must already be in the shell `implement-epic` runs in, not merely present in `.sandcastle/.env`. Add it to your shell profile:

```bash
export DOCKER_HOST=unix:///Users/<username>/.colima/default/docker.sock
```

## Project status command

<!-- Leave blank to skip GitHub Project board status syncing entirely. -->

`project_status_command`: _(none configured)_

Example: `./scripts/set-project-status.sh {issue} {status}` — `{issue}` and `{status}` are substituted. `implement-epic` only decides *when* to call it (issue picked up → `in-progress`, PR opened → `in-review`, auto-merged → `done`); the script itself does the syncing. `/setup-my-skills` can write a generic one for you from its own [set-project-status.sh](./set-project-status.sh) template (resolves owner/repo at runtime via `gh repo view`; only the Project number needs filling in) — re-run it if this repo doesn't have one yet, or point this field at your own script if you already do.

## Auto-merge afk epic sub-issues

`auto_merge_afk_epic_subissues`: `false`

<!-- Set to `true` only if you want afk sub-issues that clear every gate (implementation, validation, review) to squash-merge into the epic branch unattended. The epic→trunk PR always stays human-reviewed regardless of this setting. Default recommendation: leave `false`. -->

## Version bump

<!-- Leave blank to skip version bumping entirely — package.json's version is only ever changed by hand. Fill in only if a trunk-facing PR merging should carry a version bump with it, e.g. because prod deploys are cut from a version tag/release made against trunk after the fact. -->

`version_bump_command`: _(none configured)_

Example: `pnpm version {level} --no-git-tag-version` (or the npm/yarn equivalent). `{level}` is substituted with `patch`/`minor`/`major`; a command without `{level}` runs as-is.

**The command must only touch `package.json` (and the lockfile, if it updates one) — it must not commit or create a git tag.** `npm version`/`pnpm version`/`yarn version` all commit-and-tag by default; the flag above (or your own script) needs to suppress that, because `implement-epic` makes its own commit for the bump so the version change is a separate, clearly-attributed commit inside the PR rather than folded into `/implement`'s own commits or racing a tag `implement-epic` doesn't manage. Creating the actual release tag stays a separate, manual step after the PR merges — this only gets the version *number* onto trunk, not a shippable release.

It fires for the two trunk-facing PRs: a standalone issue's PR (always `patch`), and the epic → trunk PR opened by `implement-epic`'s finish step (`/implement-epic <epic-N> --finish`, or offered when the afk loop runs out of sub-issues), where the level is suggested from the epic's Conventional Commits and confirmed by the user. The bump lands on the epic branch, so it merges inside the commit the trunk deploy validates. Never for a sub-issue PR against an epic branch, since that never reaches trunk directly.

## Release

<!-- Read by `/release`. Written by `/setup-my-skills` from this repo's owner/repo; edit by hand if the repo moves. -->

`release_compare_url`: `https://github.com/REPLACE_WITH_OWNER_REPO/compare/{from}...{to}`

`{from}` and `{to}` are substituted with the previous and new tag. The link closes the release notes.

`release_deploy_note`: _(none configured)_

<!-- Leave blank if publishing a release is the end of the process. Otherwise one sentence on how a release reaches production, e.g. "Prod deploys via a manual workflow_dispatch of 'Deploy to prod' with the tag as input; it requires a published (non-draft) release." `/release` repeats it when handing back and never triggers the deploy itself. -->
