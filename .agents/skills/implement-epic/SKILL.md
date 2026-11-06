---
name: implement-epic
description: "Execute a unit of work end-to-end on a GitHub repo using epics, sub-issues, and afk/hitl labels: resolve the issue, branch, delegate to /implement (sandboxed or in-session), PR. Use when the user wants to work an issue in the epic/afk workflow rather than plain /implement, or to finish an epic (version bump + epic → trunk PR)."
disable-model-invocation: true
---

# Implement Epic

Wrap `/implement` with epic/sub-issue bookkeeping: resolve which issue to work, set up the right branch topology, delegate the actual implementation to `/implement` unchanged, then handle the PR and (for `afk`) the unattended-execution machinery around it.

This is a heavier alternative to `/implement`, opted into per-repo by `/setup-my-skills` (Section B). It assumes: a GitHub issue tracker (see `docs/agents/issue-tracker.md`), and optionally `docs/agents/implementation-workflow.md` for the label mapping and four pluggable extras below. Requires GitHub's native sub-issues feature.

**The rules for doing the work never change between `afk` and `hitl` — both delegate to `/implement` as-is.** The label only decides *how* that call runs (in-session vs. sandboxed) and what happens around it (whether unattended hand-back/retry machinery applies). `implement-epic` never reimplements `/implement`'s own logic.

**Terminology:** A spec/PRD issue (from `/to-spec`) IS the epic. `epic/*` branches are created from it. Its sub-issues (from `/to-tickets`, published as GitHub native sub-issues) are the individual feature issues worked on `feat/*` branches.

**Invocation:** `/implement-epic <issue-number-or-url> [--watch | --finish]`. `--watch` forces the in-session flow for an `afk` issue, so the work happens where the user can see it. `--finish` takes an epic issue and jumps straight to step 6 (finish the epic), skipping steps 1–5.

## Config — `docs/agents/implementation-workflow.md`

Absence of the file, or of a field, falls back to the defaults below — the workflow still runs in full.

- **`afk_label`** / **`hitl_label`** — the actual tracker label strings this workflow reads and writes for its two execution-gating states. Default `afk` / `hitl` (`/setup-my-skills`' default triage-label mapping — see `docs/agents/triage-labels.md` — maps the `ready-for-agent`/`ready-for-human` roles to these same two strings, so a fresh sub-issue is gated correctly with no separate labelling step, *provided* whatever created it applied the tracker's actual label string and not the bare role name). Every step below that says "the `afk` label" or "the `hitl` label" means whatever these two fields resolve to — apply the configured string, not the literal word `afk`/`hitl`, in every `gh issue edit --add-label`/`--remove-label` call.

The four pluggable extras — all optional, off when unset:

- **`sandbox_command`** — a literal shell command template (e.g. `pnpm tsx scripts/run-sandcastle.ts {issue}`) that runs an `afk` issue in an isolated sandbox. If unset, `afk` issues implement in-session — identical to `--watch`.
- **`project_status_command`** — a literal command template accepting `{issue}` and `{status}` (e.g. `./scripts/set-project-status.sh {issue} {status}`) that syncs a GitHub Project board's status field. If unset, skip every project-status step below silently.
- **`auto_merge_afk_epic_subissues`** — boolean, default `false`. Only when `true` does step 4's auto-merge path apply.
- **`version_bump_command`** — a command template (e.g. `pnpm version {level} --no-git-tag-version`) that bumps `package.json`'s version, without committing or tagging — `implement-epic` makes its own commit for the result. `{level}` is substituted with `patch`/`minor`/`major`; a template without `{level}` runs as-is. If unset, skip every version-bump sub-step. Applies only to trunk-facing PRs: a standalone issue's PR (step 4, `{level}=patch`) and the epic → trunk PR (step 6, level chosen there); never to a sub-issue PR against an epic branch.

Read this file once at the start of a run; don't re-read per step.

## Workflow

### 1. Get the issue

Take the issue number (or URL) from the invocation arguments; ask the user only if none was given. Standalone issues have no epic, so this may be a feature issue directly, or a spec/epic issue.

If the issue is not already in your context window, fetch it:

`gh issue view {N} --json number,title,body,labels`

Check whether it has sub-issues:

`gh api repos/{owner}/{repo}/issues/{N}/sub_issues --jq 'length'`

`<N>` always denotes the feature issue — the one actually being implemented — for the rest of this workflow:

- **No sub-issues (standalone)** — the fetched issue is the feature issue; `<N>` stays as is.
- **Has sub-issues (epic)** — the fetched issue is the spec/epic; call its number `<epic-N>` from here on. Find the first unblocked sub-issue and fetch it — that sub-issue is the feature issue, and becomes `<N>` for the rest of the workflow:
 
  **List sub-issue numbers**
  `gh api repos/{owner}/{repo}/issues/{epic-N}/sub_issues --jq '.[].number'`

  **For each, check blocked_by count (skip if > 0)**
  `gh api repos/{owner}/{repo}/issues/{number} --jq '.issue_dependencies_summary.blocked_by'`
  `gh issue view {N} --json number,title,body,labels`

### 2. Create branches and set status

**Branch procedure** — parametrised by `branch_name`, `base_branch`, `issue_number`; both paths below invoke it with their own values. Resolve the repo's trunk once per run, unless `docs/agents/issue-tracker.md` names a different integration branch:

`gh repo view --json defaultBranchRef --jq .defaultBranchRef.name`

1. Create the branch — `gh issue develop` resolves the repo node ID and base branch OID itself; Development-sidebar linking is preserved:
   `gh issue develop {issue_number} --name {branch_name} --base {base_branch}`
2. Check out:
   `git fetch origin {branch_name} && git checkout {branch_name}`

**Project status** — only if `project_status_command` is configured:

```bash
<project_status_command with {issue}=<N> {status}=in-progress>
```

Each site below sets status for a specific issue number and status value — substitute accordingly. Skip every one of these sub-steps if `project_status_command` is not configured.

---

#### If the issue has NO sub-issues (standalone feature)

Run the branch procedure: `branch_name=feat/<N>-<slug>`, `issue_number=<N>`.

Set project status to "In progress" for issue `<N>` (canonical example above).

---

#### If the issue HAS sub-issues (epic)

**Epic branch** — check if `epic/<epic-N>-*` exists locally or on remote; if not, run the branch procedure: `branch_name=epic/<epic-N>-<slug>`, `issue_number=<epic-N>`.

**Feature branch** — `<N>`, the first unblocked sub-issue, was already identified in step 1. Check if `feat/<N>-*` exists; if not, run the branch procedure: `branch_name=feat/<N>-<slug>`, `base_branch=epic/<epic-N>-<slug>`, `issue_number=<N>`.

Set project status to "In progress" for the feature issue `<N>` (canonical example above).

Also set the epic issue `<epic-N>` to "In progress" if it is not already (i.e. this is the first sub-issue being picked up) — only if `project_status_command` is configured.

### 3. Implement

Check `<N>`'s labels for `afk_label`/`hitl_label`. If neither is present, ask the user which applies before proceeding — treat their answer as if the label were already applied (apply it via `gh issue edit <N> --add-label <afk_label|hitl_label>` for the record).

The rules for doing the work are the same either way — understand the task, plan, tdd, validate, review, commit — all of it is `/implement`'s job. Its own review step needs a **fixed point** to diff against, which `/implement` doesn't carry itself: use `origin/epic/<epic-N>-<slug>` for an epic sub-issue, `origin/<trunk>` for a standalone issue (both from step 2). Only *how* the call runs, and how that fixed point reaches it, differs.

For an epic sub-issue, both paths also read and extend the epic's **notes** — see [Epic notes](#epic-notes).

#### `hitl`, or `afk` with no `sandbox_command` configured

`implement` carries `disable-model-invocation: true` deliberately, so Claude never runs it unprompted in an unrelated session — but that same flag blocks a Skill-tool call to it from *any* context, including from inside this workflow. So don't invoke it through the Skill tool: read `.agents/skills/implement/SKILL.md` directly and follow it as-is on this issue, telling it the fixed point above for its `/code-review` step. For an epic sub-issue, read `.epic-notes/<epic-N>.md` first if it exists, and append this sub-issue's entry once `/implement` has committed or failed. This is a reference, not a fork — don't copy its instructions into this file or modify what it says, just follow the file's current content each run.

`--watch` (see Invocation) forces this path even for an `afk` issue, treating it as `hitl` for this run without editing its labels.

#### `afk` with `sandbox_command` configured

The label is the authorization: sandbox the implementation without asking.

Write the fixed point to a well-known path before invoking the sandbox — a literal path keeps `sandbox_command`'s own invocation unchanged (see below); an inlined value would not. Use the Write tool, not a shell redirect: the Write tool's literal path is transparent to the permission check where `>` redirection is not (same reasoning as the repair-pass write in step 4):

Write `.sandcastle/base-branch.txt` containing `<fixed point>`

The host repo must already be checked out on `feat/<N>-*` at this point (step 2 created and checked it out) — `sandbox_command` reads the host's current branch to authorize the sandboxed run, so if this step is ever re-entered after a context loss, re-check `git rev-parse --abbrev-ref HEAD` against `feat/<N>-*` before proceeding; a resumed run on the epic branch or trunk fails the sandbox's own precondition check rather than doing anything unsafe, but wastes a full sandbox invocation finding that out.

Then invoke the configured command, substituting `{issue}` for `<N>` and nothing else:

`{sandbox_command with {issue}={N}}`

**Keep this command literal.** Its fixed shape is what lets the Bash permission check match it against an allowlist rule; arguments built from `$(...)` are opaque to that check, so it would prompt a human every run and an afk run could never start unattended.

The sandbox reads `.sandcastle/base-branch.txt` and runs `/implement` itself — same rules and same fixed point as the in-session path — and is expected to print one JSON line to stdout: `{ "success": boolean, "summary": string, "blockers": string | null, "reviewReport"?: string | null, "notes"?: string | null }`. `reviewReport`, when present and non-null, is a report from a review pass the sandbox command ran on the implementation — carry it forward to step 4's PR-comment audit trail as-is; not every `sandbox_command` produces one, so its absence isn't itself a problem. `notes`, when present and non-null, is this sub-issue's entry for the epic's notes file — append it as described in [Epic notes](#epic-notes), on success and failure alike. Parse the line:

- **`success: true`** — proceed to step 4.
- **`success: false`** (includes an exhausted iteration cap) — run the **hand-back procedure** with `gate_report` = the run's `summary` and `blockers`.
- **The command exits non-zero, or prints nothing parseable as the JSON line above** — this is a crash, not a gate failure: something died before it could self-report (a timeout, a container error, an unhandled exception). Treat it exactly like `success: false` and run the **hand-back procedure**, with `gate_report` built from whatever the command printed (stderr, a stack trace, anything) — there may be no `summary`/`blockers` to extract cleanly, so include the raw output verbatim rather than leaving `gate_report` empty. **Do not re-invoke `sandbox_command` directly to retry** — that pays the sandbox's full orientation cost again with no more information than the first attempt had, for no better odds. The hand-back procedure's own one repair pass is the retry; let it happen through that path, where the failure gets carried forward as context instead of discarded.

This applies identically whether `<N>` is a standalone `feat/*` issue or a sub-issue picked up mid-epic — only this step is affected. Sub-issue selection (step 1) and the epic coordination in step 2 (epic branch, project status) never route through the sandbox.

#### `afk` without a sandbox

Same as the `hitl` case above — read and follow `implement/SKILL.md` in-session — but still held to the unattended standard the `afk` label promises: no human is necessarily watching in real time. Treat `/implement` failing to converge (repeated red/typecheck failures it can't resolve, or its own review turning up hard violations it can't clear) as `success: false` for the same **hand-back procedure**, with `gate_report` summarizing what went wrong. A `hitl` run has no equivalent failure path — a human is assumed present, so it just keeps working the tree until `/implement` finishes.

### 4. Pull-Request

> **Development section linking:** Because `gh issue develop` was used, the PR opened from that branch automatically appears in the Development sidebar alongside the branch — no `Closes #N` keyword or issue body edit is required for this. Keep `Closes #<N>` in the PR body so the issue closes automatically when the PR eventually merges into the trunk.

**Version bump — only when the issue had no sub-issues, and only if `version_bump_command` is configured.** Run it with `{level}=patch` right before opening the trunk-facing PR below, so the bump is the last commit and merges atomically with the rest of the change once a human approves the PR:

```bash
<version_bump_command with {level}=patch>
git add package.json <lockfile, if version_bump_command updated one>
if ! git diff --cached --quiet; then
  git commit -m "chore: bump version to $(node -p "require('./package.json').version")"
fi
```

Skip this entirely if `version_bump_command` is unset, or if the issue had sub-issues — a sub-issue PR targets the epic branch below, not trunk, so bumping there would be premature.

**If the issue had NO sub-issues** — PR targets the trunk (`base_branch` from step 2):

```bash
pr_url=$(gh pr create --base <trunk> --title "..." --body "...

Closes #<N>")
```

**If the issue had sub-issues** — PR targets the epic branch:

```bash
pr_url=$(gh pr create --base epic/<epic-N>-<slug> --title "..." --body "...

Closes #<N>")
```

**afk runs:** post a code-review report as a PR comment for the audit trail, if one is available — sandboxed, that's `reviewReport` from `sandbox_command`'s JSON output (step 3); in-session, it's whatever `/implement`'s own `/code-review` step produced directly in this context. Either way, without this step the only record of what review actually found is a sandbox log file on the machine that ran it, which nothing keeps and no one else can read — this is the durable copy:

```bash
gh pr comment "$pr_url" --body "$(cat <<'EOF'
## Code-review gate report

<review report>
EOF
)"
```

#### Auto-merge — afk epic sub-issues only, and only if `auto_merge_afk_epic_subissues` is `true`

When `<N>` is an afk sub-issue of an epic and auto-merge is enabled, the gate is already green by construction if the run reached this step: `/implement` completed cleanly — any failure that survived its repair pass handed the issue back before this step. Whether "completed cleanly" means self-review only or self-review plus an independent check is entirely down to what `sandbox_command` (or the in-session path) treats as `success: true` — this workflow doesn't second-guess that signal, so make sure whatever produces it is a gate you're actually willing to auto-merge on unattended. Squash-merge the PR into the epic branch and sync the local checkout:

`gh pr merge "$pr_url" --squash --delete-branch`
`git fetch origin epic/{epic-N}-{slug} && git checkout -B epic/{epic-N}-{slug} origin/epic/{epic-N}-{slug}`

**Sync with `fetch` + `checkout -B`, never `git pull`.** An enterprise-managed permission layer can force `git pull`, `git merge`, and `git rebase` to prompt regardless of what the repo's own allowlist says, stalling an unattended afk loop on every iteration. `git fetch` and `git checkout` are not gated that way. The two are equivalent here because the tree is clean at both sync points; `checkout -B` refuses rather than silently discards if that ever stops being true.

If `auto_merge_afk_epic_subissues` is not `true` (including the default), skip this — every PR waits for human review regardless of gate outcome.

**Never auto-merge** — these always wait for human review, afk-labelled or not:

- Standalone `feat/*` → trunk PRs (that is the trunk-facing merge).
- `epic/*` → trunk PRs.

#### Project status

Only if `project_status_command` is configured:

- Auto-merged afk epic sub-issue → set status "Done" for `<N>` (canonical example in step 2).
- Every other run → set status "In review" for `<N>`.

### 5. Epic loop (afk only)

Runs once `<N>` — an afk sub-issue of an epic — reaches an outcome, whether that is a step-4 auto-merge or a hand-back. Standalone and hitl runs end at step 4 as before. Skip this step entirely if `auto_merge_afk_epic_subissues` is not `true` — without auto-merge there is no unattended outcome to loop on.

**Iteration cap: 5 sub-issues per session**, counting auto-merges and hand-backs alike. The cap bounds a runaway session's token spend — a systemically broken epic spends its iterations on hand-backs and stops at the same bound. Change it only when the user explicitly asks.

**Return to the epic branch.** After an auto-merge it is already checked out and synced (step 4). After a hand-back, check it out now — the hand-back committed the attempted work, so the tree is clean:

`git fetch origin epic/{epic-N}-{slug} && git checkout -B epic/{epic-N}-{slug} origin/epic/{epic-N}-{slug}`

Find the next sub-issue as in step 1's epic path: list `<epic-N>`'s sub-issues, skip closed or blocked ones, and take the first unblocked **`afk`** one. Skip an unblocked sub-issue without the `afk` label (`hitl`, or unlabelled) and record it for the session summary: human-decision work is never picked up autonomously, and it holds back only the sub-issues that name it in `blocked_by`, which the blocked rule already skips. `/to-tickets` writes every dependency as a native `blocked_by` edge, so sub-issue order carries no dependency of its own.

**GitHub's issue-closing and `blocked_by` recompute after a merge are asynchronous — don't trust a query taken immediately after `gh pr merge`.** In practice the just-merged sub-issue's `state` and a dependent's `issue_dependencies_summary.blocked_by` can still reflect the pre-merge state for a few seconds after the merge call returns, even when the merge target was the epic branch rather than trunk. A dependent read this way looks falsely blocked. Before concluding a dependent is genuinely blocked, or ending the loop on stop reason 1 ("no unblocked afk sub-issues remain"), re-run the blocked-by query once after a short pause (a few seconds) and trust that result over the first one.

**Keep a session-local list of every sub-issue whose iteration finished — merged or handed back — and skip those, whatever state GitHub reports.** Never lean on a merged sub-issue being closed to exclude it: if a `Closes #<N>` keyword only fires on merges into the default branch, and these merge into the epic branch, a merged sub-issue can stay open and this session-local list is the only thing stopping the loop from re-picking work it already merged.

A hand-back needs no extra dependency check: the handed-back issue stays open, so anything depending on it still reports `blocked_by > 0` and the existing skip rule holds it back.

- **It exists and the cap is not reached** — it becomes the new `<N>`. Fetch it (step 1), then repeat the cycle from step 2's feature-branch creation onward (2 → 3 → 4 → 5).
- **Anything else — stop the loop** and report the session summary. Stop reasons:
  1. No unblocked `afk` sub-issues remain (unblocked `hitl` ones may still be waiting).
  2. The iteration cap is reached.

**Session summary** — report to the user on every stop:

- Sub-issues merged this session: issue number → PR URL for each.
- Sub-issues handed back: issue number → the branch holding the attempted work.
- Sub-issues waiting on a human: every unblocked `hitl` sub-issue skipped this session, issue number → title.
- What stopped the loop: "no unblocked afk sub-issues" or "cap reached".
- Epic branch state: tip SHA and how many commits it is ahead of the trunk.
- Next step for the epic: on stop reason 1 with no `hitl` sub-issue waiting and no sub-issue still blocked, offer step 6 (finish the epic). Otherwise, note that `/implement-epic <epic-N> --finish` closes it out once the remaining sub-issues are done.
- If host context grew noticeably large across iterations, note it here rather than degrading; a follow-up can address handoff.

### 6. Finish the epic (manual)

Bumps the version on the epic branch and opens the epic → trunk PR. Entered two ways:

- **Loop end** — step 5 stopped on reason 1 with nothing left open (see its session summary). Ask the user whether to finish the epic now; on no, end the session.
- **`--finish`** — invoked directly with an epic issue. Resolve `<epic-N>`, its branch `epic/<epic-N>-<slug>`, and the trunk as in steps 1–2.

A human confirms every run of this step: it pushes to a shared branch and opens a trunk-facing PR. The PR itself is never auto-merged (step 4).

**1. Check the epic is complete.** A sub-issue is done when it is closed or a merged PR into the epic branch carries `Closes #<sub>`:

```bash
gh api repos/{owner}/{repo}/issues/{epic-N}/sub_issues --jq '.[] | "\(.number) \(.state)"'
gh pr list --base epic/<epic-N>-<slug> --state merged --limit 200 --json number,body
gh pr list --base epic/<epic-N>-<slug> --state open --json number,title
```

Every sub-issue done and no open PRs into the epic branch → continue. Otherwise list what is outstanding and ask whether to finish anyway.

**2. Sync the epic branch** — `git fetch origin <trunk> epic/<epic-N>-<slug> && git checkout -B epic/<epic-N>-<slug> origin/epic/<epic-N>-<slug>`. Then, only if `version_bump_command` is configured, compare versions:

```bash
git show origin/<trunk>:package.json | node -p "JSON.parse(require('fs').readFileSync(0,'utf8')).version"
node -p "require('./package.json').version"
```

If they differ, trunk has moved past the epic's base (a standalone bump merged since). Bumping now would reuse a version and conflict on `package.json`. Tell the user and offer to merge trunk into the epic branch first (`git merge origin/<trunk>`, then `git push origin HEAD`; on conflicts use `/resolving-merge-conflicts`). Continue only once the versions match.

**3. Choose the level** — only if `version_bump_command` is configured. Read the epic's commits since trunk:

`git log --format='%s%n%b' origin/<trunk>..HEAD`

Suggest `major` if any subject has `!:` or any body has `BREAKING CHANGE`, else `minor` if any subject starts with `feat`, else `patch`. Ask the user to confirm the level and the resulting version in one question, together with the go-ahead to push and open the PR.

**4. Bump and push:**

```bash
<version_bump_command with {level}=<level>>
git add package.json <lockfile, if version_bump_command updated one>
if ! git diff --cached --quiet; then
  git commit -m "chore: bump version to $(node -p "require('./package.json').version")"
fi
git push origin HEAD
```

**5. Open the PR.** If an open epic → trunk PR already exists (`gh pr list --head epic/<epic-N>-<slug> --base <trunk> --state open`), the push above updated it; report its URL. Otherwise:

```bash
pr_url=$(gh pr create --base <trunk> --head epic/<epic-N>-<slug> --title "feat: <epic title> (#<epic-N>)" --body "...

Closes #<epic-N>
Closes #<sub-1>
Closes #<sub-2>")
```

The body summarises the epic and lists each sub-issue with its merged PR. Add a `Closes` line for the epic and for every sub-issue still open: sub-issue PRs merged into the epic branch, not the default branch, so their own `Closes` keywords never fired.

**6. Project status** — only if `project_status_command` is configured: set "In review" for `<epic-N>`.

Without `version_bump_command`, step 4 is just `git push origin HEAD` (nothing new to push is fine).

**Done when** the epic branch carries the bump commit (if configured), the epic → trunk PR is open with a `Closes` line for the epic and every open sub-issue, and its URL is reported to the user.

## Epic notes

`.epic-notes/<epic-N>.md` carries what one sub-issue's run learned that the next would otherwise rediscover, so each run spends less on exploration. It lives on the host and outlives sessions. It is never committed: on the first append, also write `.epic-notes/.gitignore` containing `*`, so the directory ignores itself and the hand-back's `git add -A` never picks it up.

**Entry** — one per sub-issue, appended under `## #<N> <title>`, at most ten lines, written as **pointers**: files and seams the work touched, the command that verified it, a gotcha the issue body didn't mention, a decision a later sub-issue must respect. What the diff, the issue or the repo docs already say stays out.

**Reading** — before `/implement` starts on an epic sub-issue: in-session, read the file; sandboxed, `sandbox_command` reads it itself from the fixed point's epic number and hands it to the agent.

**Writing** — this workflow is the only writer: after each run (merged or handed back), append the entry with the Write or Edit tool — in-session from what this context learned, sandboxed from the JSON line's `notes`. A missing file means no run has written one yet.

## Hand-back procedure

An `afk` issue's `/implement` call failing — sandboxed or in-session — fails into this procedure, parametrised by `gate_report`: the sandboxed run's `summary`/`blockers`, or a summary of what went wrong in-session.

### 1. Repair pass

**If `sandbox_command` is configured:** write `gate_report` to a file, then re-invoke the sandbox pointing at it — the exact mechanism depends on what the configured command supports (a `--repair-context <path>` flag, an environment variable, etc.; follow whatever the repo's own sandbox script documents). Write the report with the Write tool, not a shell heredoc: the path is a literal the permission check can see through, where an inlined report would not be.

**If no `sandbox_command` is configured (in-session):** the session is already live — incorporate `gate_report` directly as feedback and continue working the same tree. There is no separate wrapper to re-invoke.

Either way, re-enter step 3 on the repaired tree, same rules and same fixed point as the first attempt.

**One repair pass per issue.** A repair pass that still fails means the pass did not clear it — hand back.

### 2. Hand back

The issue becomes human work.

1. Preserve the tree — the next iteration needs a clean checkout, and the human needs the attempted work.

   First bring in what a crashed run left behind. With `sandbox_command`, the runner saves the work from a crashed run's worktree as `.sandcastle/preserved/<N>-<worktree>.patch` and removes the worktree (see the repo's sandbox docs). List the patches for this issue, newest first: `ls -t .sandcastle/preserved/<N>-*.patch`. If any exist, apply only the first one with `git apply <that literal path>`. An older patch is an earlier attempt, and the newest one is built on whatever the branch held when its run started, so applying it alone is correct. If `git apply` fails, leave the patch where it is and name its path in the comment (step 3) rather than forcing it. No patch means the run did not crash or left nothing behind.

   Then commit and push:
   ```bash
   git add -A
   if ! git diff --cached --quiet; then
     git commit -m "chore(#<N>): wip — implementation gate hand-back"
     git push -u origin HEAD
   fi
   ```
2. Swap the label:
   `gh issue edit {N} --remove-label {afk_label} --add-label {hitl_label}`
3. Comment what was tried and what is blocking it:
   ```bash
   gh issue comment <N> --body "$(cat <<'EOF'
   Handed back after /implement failed twice (initial run + repair pass).

   **Branch:** `feat/<N>-<slug>` — the attempted work is committed there.

   <If a preserved patch was applied, say which file. If one could not be applied, give its path and say it still needs applying by hand. Leave this out when there was none.>

   <gate_report>
   EOF
   )"
   ```

There is no PR (step 4) for a handed-back issue — `/implement` never reaches its own commit step on a failed run; the wip commit above is a separate, deliberate exception. **Standalone run** — report to the user and stop. **Epic run** — the hand-back is a completed iteration, not a stop; continue at step 5.
