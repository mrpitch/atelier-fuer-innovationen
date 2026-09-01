---
name: implement-epic
description: "Execute a unit of work end-to-end on a GitHub repo using epics, sub-issues, and afk/hitl labels: resolve the issue, branch, delegate to /implement (sandboxed or in-session), PR. Use when the user wants to work an issue in the epic/afk workflow rather than plain /implement."
disable-model-invocation: true
---

# Implement Epic

Wrap `/implement` with epic/sub-issue bookkeeping: resolve which issue to work, set up the right branch topology, delegate the actual implementation to `/implement` unchanged, then handle the PR and (for `afk`) the unattended-execution machinery around it.

This is a heavier alternative to `/implement`, opted into per-repo by `/setup-my-skills` (Section B). It assumes: a GitHub issue tracker (see `docs/agents/issue-tracker.md`), and optionally `docs/agents/implementation-workflow.md` for the label mapping and three pluggable extras below. Requires GitHub's native sub-issues feature.

**The rules for doing the work never change between `afk` and `hitl` — both delegate to `/implement` as-is.** The label only decides *how* that call runs (in-session vs. sandboxed) and what happens around it (whether unattended hand-back/retry machinery applies). `implement-epic` never reimplements `/implement`'s own logic.

**Terminology:** A spec/PRD issue (from `/to-spec`) IS the epic. `epic/*` branches are created from it. Its sub-issues (from `/to-tickets`, published as GitHub native sub-issues) are the individual feature issues worked on `feat/*` branches.

**Invocation:** `/implement-epic <issue-number-or-url> [--watch]`. `--watch` forces the in-session flow for an `afk` issue, so the work happens where the user can see it.

## Config — `docs/agents/implementation-workflow.md`

Absence of the file, or of a field, falls back to the defaults below — the workflow still runs in full.

- **`afk_label`** / **`hitl_label`** — the actual tracker label strings this workflow reads and writes for its two execution-gating states. Default `afk` / `hitl` (`/setup-my-skills`' default triage-label mapping — see `docs/agents/triage-labels.md` — maps the `ready-for-agent`/`ready-for-human` roles to these same two strings, so a fresh sub-issue is gated correctly with no separate labelling step, *provided* whatever created it applied the tracker's actual label string and not the bare role name). Every step below that says "the `afk` label" or "the `hitl` label" means whatever these two fields resolve to — apply the configured string, not the literal word `afk`/`hitl`, in every `gh issue edit --add-label`/`--remove-label` call.

The three pluggable extras — all optional, off when unset:

- **`sandbox_command`** — a literal shell command template (e.g. `pnpm tsx scripts/run-sandcastle.ts {issue}`) that runs an `afk` issue in an isolated sandbox. If unset, `afk` issues implement in-session — identical to `--watch`.
- **`project_status_command`** — a literal command template accepting `{issue}` and `{status}` (e.g. `./scripts/set-project-status.sh {issue} {status}`) that syncs a GitHub Project board's status field. If unset, skip every project-status step below silently.
- **`auto_merge_afk_epic_subissues`** — boolean, default `false`. Only when `true` does step 4's auto-merge path apply.

Read this file once at the start of a run; don't re-read per step.

## Workflow

### 1. Get the issue

Take the issue number (or URL) from the invocation arguments; ask the user only if none was given. Standalone issues have no epic, so this may be a feature issue directly, or a spec/epic issue.

If the issue is not already in your context window, fetch it:

!`gh issue view <N> --json number,title,body,labels`

Check whether it has sub-issues:

!`sub_issue_count=$(gh api repos/{owner}/{repo}/issues/<N>/sub_issues --jq 'length')`

`<N>` always denotes the feature issue — the one actually being implemented — for the rest of this workflow:

- **No sub-issues (standalone)** — the fetched issue is the feature issue; `<N>` stays as is.
- **Has sub-issues (epic)** — the fetched issue is the spec/epic; call its number `<epic-N>` from here on. Find the first unblocked sub-issue and fetch it — that sub-issue is the feature issue, and becomes `<N>` for the rest of the workflow:
 
  **List sub-issue numbers**
  !`gh api repos/{owner}/{repo}/issues/<epic-N>/sub_issues --jq '.[].number'`

  **For each, check blocked_by count (skip if > 0)**
  !`gh api repos/{owner}/{repo}/issues/<number> --jq '.issue_dependencies_summary.blocked_by'`
  !`gh issue view <N> --json number,title,body,labels`

### 2. Create branches and set status

**Branch procedure** — parametrised by `branch_name`, `base_branch`, `issue_number`; both paths below invoke it with their own values. Resolve the repo's trunk once per run, unless `docs/agents/issue-tracker.md` names a different integration branch:

!`base_branch=$(gh repo view --json defaultBranchRef --jq .defaultBranchRef.name)`

1. Create the branch — `gh issue develop` resolves the repo node ID and base branch OID itself; Development-sidebar linking is preserved:
   !`gh issue develop <issue_number> --name <branch_name> --base <base_branch>`
2. Check out:
   !`git fetch origin <branch_name> && git checkout <branch_name>`

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

The rules for doing the work are the same either way — understand the task, plan, tdd, validate, review, commit — all of it is `/implement`'s job. Its own review step needs a **fixed point** to diff against, which `/implement` doesn't carry itself: use `origin/epic/<epic-N>-<slug>` for an epic sub-issue, `origin/<trunk>` for a standalone issue (both from step 2). Only *how* the call runs, and how that fixed point reaches it, differs:

#### `hitl`, or `afk` with no `sandbox_command` configured

`implement` carries `disable-model-invocation: true` deliberately, so Claude never runs it unprompted in an unrelated session — but that same flag blocks a Skill-tool call to it from *any* context, including from inside this workflow. So don't invoke it through the Skill tool: read `.agents/skills/implement/SKILL.md` directly and follow it as-is on this issue, telling it the fixed point above for its `/code-review` step. This is a reference, not a fork — don't copy its instructions into this file or modify what it says, just follow the file's current content each run.

`--watch` (see Invocation) forces this path even for an `afk` issue, treating it as `hitl` for this run without editing its labels.

#### `afk` with `sandbox_command` configured

The label is the authorization: sandbox the implementation without asking.

Write the fixed point to a well-known path before invoking the sandbox — a literal path keeps `sandbox_command`'s own invocation unchanged (see below); an inlined value would not:

!`echo "<fixed point>" > .sandcastle/base-branch.txt`

Then invoke the configured command, substituting `{issue}` for `<N>` and nothing else:

!`<sandbox_command with {issue}=<N>>`

**Keep this command literal.** Its fixed shape is what lets the Bash permission check match it against an allowlist rule; arguments built from `$(...)` are opaque to that check, so it would prompt a human every run and an afk run could never start unattended.

The sandbox reads `.sandcastle/base-branch.txt` and runs `/implement` itself — same rules and same fixed point as the in-session path — and is expected to print one JSON line to stdout: `{ "success": boolean, "summary": string, "blockers": string | null, "reviewReport"?: string | null }`. `reviewReport`, when present and non-null, is a report from a review pass the sandbox command ran on the implementation — carry it forward to step 4's PR-comment audit trail as-is; not every `sandbox_command` produces one, so its absence isn't itself a problem. Parse the line:

- **`success: true`** — proceed to step 4.
- **`success: false`** (includes an exhausted iteration cap) — run the **hand-back procedure** with `gate_report` = the run's `summary` and `blockers`.
- **The command exits non-zero, or prints nothing parseable as the JSON line above** — this is a crash, not a gate failure: something died before it could self-report (a timeout, a container error, an unhandled exception). Treat it exactly like `success: false` and run the **hand-back procedure**, with `gate_report` built from whatever the command printed (stderr, a stack trace, anything) — there may be no `summary`/`blockers` to extract cleanly, so include the raw output verbatim rather than leaving `gate_report` empty. **Do not re-invoke `sandbox_command` directly to retry** — that pays the sandbox's full orientation cost again with no more information than the first attempt had, for no better odds. The hand-back procedure's own one repair pass is the retry; let it happen through that path, where the failure gets carried forward as context instead of discarded.

This applies identically whether `<N>` is a standalone `feat/*` issue or a sub-issue picked up mid-epic — only this step is affected. Sub-issue selection (step 1) and the epic coordination in step 2 (epic branch, project status) never route through the sandbox.

#### `afk` without a sandbox

Same as the `hitl` case above — read and follow `implement/SKILL.md` in-session — but still held to the unattended standard the `afk` label promises: no human is necessarily watching in real time. Treat `/implement` failing to converge (repeated red/typecheck failures it can't resolve, or its own review turning up hard violations it can't clear) as `success: false` for the same **hand-back procedure**, with `gate_report` summarizing what went wrong. A `hitl` run has no equivalent failure path — a human is assumed present, so it just keeps working the tree until `/implement` finishes.

### 4. Pull-Request

> **Development section linking:** Because `gh issue develop` was used, the PR opened from that branch automatically appears in the Development sidebar alongside the branch — no `Closes #N` keyword or issue body edit is required for this. Keep `Closes #<N>` in the PR body so the issue closes automatically when the PR eventually merges into the trunk.

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

!`gh pr merge "$pr_url" --squash --delete-branch`
!`git checkout epic/<epic-N>-<slug> && git pull origin epic/<epic-N>-<slug>`

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

**Return to the epic branch.** After an auto-merge it is already checked out and pulled (step 4). After a hand-back, check it out now — the hand-back committed the attempted work, so the tree is clean:

!`git checkout epic/<epic-N>-<slug> && git pull origin epic/<epic-N>-<slug>`

Find the next sub-issue exactly as in step 1's epic path: list `<epic-N>`'s sub-issues, skip closed or blocked ones, take the first unblocked.

**GitHub's issue-closing and `blocked_by` recompute after a merge are asynchronous — don't trust a query taken immediately after `gh pr merge`.** In practice the just-merged sub-issue's `state` and a dependent's `issue_dependencies_summary.blocked_by` can still reflect the pre-merge state for a few seconds after the merge call returns, even when the merge target was the epic branch rather than trunk. A dependent read this way looks falsely blocked. Before concluding a dependent is genuinely blocked, or ending the loop on stop reason 1 ("no unblocked sub-issues remain"), re-run the blocked-by query once after a short pause (a few seconds) and trust that result over the first one.

**Keep a session-local list of every sub-issue whose iteration finished — merged or handed back — and skip those, whatever state GitHub reports.** Never lean on a merged sub-issue being closed to exclude it: if a `Closes #<N>` keyword only fires on merges into the default branch, and these merge into the epic branch, a merged sub-issue can stay open and this session-local list is the only thing stopping the loop from re-picking work it already merged.

A hand-back needs no extra dependency check: the handed-back issue stays open, so anything depending on it still reports `blocked_by > 0` and the existing skip rule holds it back.

- **It exists, is `afk`, and the cap is not reached** — it becomes the new `<N>`. Fetch it (step 1), then repeat the cycle from step 2's feature-branch creation onward (2 → 3 → 4 → 5).
- **Anything else — stop the loop** and report the session summary. Stop reasons:
  1. No unblocked sub-issues remain.
  2. The next unblocked sub-issue is `hitl` by design — human-decision work is never picked up autonomously. Do not skip past it to a later afk sub-issue; sub-issue order encodes dependencies.
  3. The iteration cap is reached.

**Session summary** — report to the user on every stop:

- Sub-issues merged this session: issue number → PR URL for each.
- Sub-issues handed back: issue number → the branch holding the attempted work.
- What stopped the loop: the sub-issue and reason, or "backlog empty" / "cap reached".
- Epic branch state: tip SHA and how many commits it is ahead of the trunk.
- Reminder that the epic→trunk PR remains HITL.
- If host context grew noticeably large across iterations, note it here rather than degrading; a follow-up can address handoff.

## Hand-back procedure

An `afk` issue's `/implement` call failing — sandboxed or in-session — fails into this procedure, parametrised by `gate_report`: the sandboxed run's `summary`/`blockers`, or a summary of what went wrong in-session.

### 1. Repair pass

**If `sandbox_command` is configured:** write `gate_report` to a file, then re-invoke the sandbox pointing at it — the exact mechanism depends on what the configured command supports (a `--repair-context <path>` flag, an environment variable, etc.; follow whatever the repo's own sandbox script documents). Write the report with the Write tool, not a shell heredoc: the path is a literal the permission check can see through, where an inlined report would not be.

**If no `sandbox_command` is configured (in-session):** the session is already live — incorporate `gate_report` directly as feedback and continue working the same tree. There is no separate wrapper to re-invoke.

Either way, re-enter step 3 on the repaired tree, same rules and same fixed point as the first attempt.

**One repair pass per issue.** A repair pass that still fails means the pass did not clear it — hand back.

### 2. Hand back

The issue becomes human work.

1. Preserve the tree — the next iteration needs a clean checkout, and the human needs the attempted work:
   ```bash
   git add -A
   if ! git diff --cached --quiet; then
     git commit -m "chore(#<N>): wip — implementation gate hand-back"
     git push -u origin HEAD
   fi
   ```
2. Swap the label:
   !`gh issue edit <N> --remove-label <afk_label> --add-label <hitl_label>`
3. Comment what was tried and what is blocking it:
   ```bash
   gh issue comment <N> --body "$(cat <<'EOF'
   Handed back after /implement failed twice (initial run + repair pass).

   **Branch:** `feat/<N>-<slug>` — the attempted work is committed there.

   <gate_report>
   EOF
   )"
   ```

There is no PR (step 4) for a handed-back issue — `/implement` never reaches its own commit step on a failed run; the wip commit above is a separate, deliberate exception. **Standalone run** — report to the user and stop. **Epic run** — the hand-back is a completed iteration, not a stop; continue at step 5.
