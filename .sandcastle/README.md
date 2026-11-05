# Sandcastle

Sandcastle runs Claude Code agents inside a Docker container to implement GitHub issues autonomously. This directory holds its configuration.

## Prerequisites

- Docker (via [Colima](https://github.com/abiosoft/colima) on macOS, or Docker Desktop)
- A Claude Code OAuth token (`claude setup-token`) or an Anthropic API key

---

## 1. Sandbox environment — `.sandcastle/.env`

The `.env` file is for **runtime** secrets loaded into the running container. Copy `.sandcastle/.env.example` to `.sandcastle/.env` and fill in the values:

```bash
cp .sandcastle/.env.example .sandcastle/.env
```

At minimum you need one of:

- `CLAUDE_CODE_OAUTH_TOKEN` — get one by running `claude setup-token` on your host
- `ANTHROPIC_API_KEY` — an Anthropic API key

On macOS with Colima, also set:

```bash
DOCKER_HOST=unix:///Users/<your-username>/.colima/default/docker.sock
```

`.sandcastle/.env` is excluded from git via `.sandcastle/.gitignore`.

**If you route through a local LLM proxy** (e.g. `ANTHROPIC_BASE_URL` pointing at a `litellm` instance): the container cannot reach `localhost` — `localhost` inside the container resolves to the container itself, not the host. Use `http://host.docker.internal:<port>` instead. If the proxy process isn't actually running when the sandbox starts, the agent fails immediately with `API Error: Connection refused` rather than falling back to direct auth — start the proxy first, or unset `ANTHROPIC_BASE_URL` to use `CLAUDE_CODE_OAUTH_TOKEN`/`ANTHROPIC_API_KEY` directly.

---

## 2. Claude Code permissions

The `implement-epic` workflow drives everything through `!` inline commands. Without allowlist rules in Claude Code's settings, every command pauses for manual approval — unattended `afk` runs are impossible.

Add the following to `.claude/settings.json` (committed project settings) under `permissions.allow`. The skill pre-check that validates `!` command templates reads `settings.json` — it does not read `settings.local.json`, so permissions placed there will be ignored by the pre-check and every `!` command will still prompt. The `/setup-my-skills` skill writes these automatically; the `/update-config` skill can add them manually if asked.

**Always required — implement-epic core workflow:**
```json
"Bash(gh *)",
"Bash(git fetch *)",
"Bash(git checkout *)",
"Bash(git pull *)",
"Bash(git add *)",
"Bash(git diff *)",
"Bash(git commit *)",
"Bash(git push *)"
```

`Bash(gh *)` covers all GitHub CLI calls the workflow makes: `gh issue view`, `gh api` (sub-issue listing, blocked-by checks), `gh repo view` (default branch resolution), `gh issue develop` (branch creation), `gh issue edit` (label swaps), `gh pr create`, `gh pr comment`, and `gh pr merge`.

**Required with Sandcastle (`sandbox_command` configured):**
```json
"Bash(pnpm run sandcastle:build)",
"Bash(pnpm tsx scripts/run-sandcastle.ts *)"
```

Swap the second pattern to match your actual `sandbox_command` runner. `sandcastle:build`'s own internal `docker build` call needs no separate rule — the permission check matches what Claude types, not what the script internally invokes.

**Required if `project_status_command` is configured:**
```json
"Bash(./scripts/set-project-status.sh *)"
```

A minimal `.claude/settings.json` for a repo with Sandcastle and no project-status sync:

```json
{
  "permissions": {
    "allow": [
      "Bash(gh *)",
      "Bash(git fetch *)",
      "Bash(git checkout *)",
      "Bash(git pull *)",
      "Bash(git add *)",
      "Bash(git diff *)",
      "Bash(git commit *)",
      "Bash(git push *)",
      "Bash(pnpm run sandcastle:build)",
      "Bash(pnpm tsx scripts/run-sandcastle.ts *)"
    ]
  }
}
```

---

## 3. Claude Code workspace trust — `.sandcastle/claude.json`

`.claude/settings.json`'s `permissions.allow` (section 2) only takes effect in a workspace Claude Code considers **trusted**. Trust is normally granted by accepting an interactive dialog the first time Claude Code opens a directory — there's no interactive terminal inside the sandbox container to accept it. Without a pre-accepted trust record, the agent fails immediately:

```
Ignoring 11 permissions.allow entries from .claude/settings.json: this workspace has not been trusted.
Run Claude Code interactively here once and accept the trust dialog,
or set projects["/home/agent/workspace"].hasTrustDialogAccepted: true in /home/agent/.claude.json.
```

`setup-my-skills` seeds `.sandcastle/claude.json` for you (`{"projects":{"/home/agent/workspace":{"hasTrustDialogAccepted":true}}}`), and `buildDockerSandbox()` in `scripts/run-sandcastle.ts` bind-mounts it to `/home/agent/.claude.json` inside the container on every run. If the file is somehow missing when a run starts (e.g. this scaffold predates the mount), `runSandcastle()` seeds it itself with the same minimal JSON before invoking Docker — a bind-mount whose host source doesn't exist gets created by Docker as an empty *directory*, not a file, which would silently break the trust mount instead of erroring.

**This file is not static — leave it alone once it exists.** After the first sandboxed run, Claude Code overwrites it with its own feature-flag cache data (several hundred lines). That's expected and correct: the `hasTrustDialogAccepted` key survives the overwrite, which is the only part that matters here. Do not regenerate this file from the seed template once a real one exists — you'd be discarding the cache for no benefit.

`.sandcastle/claude.json` is excluded from git via `.sandcastle/.gitignore` — never commit it, seeded or overwritten.

---

## 4. Running sandcastle

Start Colima before any Docker operation:

```bash
colima start
```

Build the image (first time and after Dockerfile changes):

```bash
pnpm run sandcastle:build
```

Run an agent on a GitHub issue — from a `feat/<issueNumber>-*` branch:

```bash
pnpm run afk <issueNumber>
```

The `afk` script loads `.sandcastle/.env` and passes the issue number to the sandcastle runner. The `sandbox_command` in `docs/agents/implementation-workflow.md` uses this same script via `implement-epic`.

Each `afk` run works in its own isolated git worktree under `.sandcastle/worktrees/` (`branchStrategy: 'merge-to-head'`, not a bind-mount of your own checkout) — your host repo's checked-out branch is never touched mid-run; the implementer's commit is merged onto it automatically once the run succeeds.

### Timing summaries

Each pass writes its agent log to `.sandcastle/logs/<branch>-<implement|review>-<timestamp>.log` (the branch with `/` replaced by `-`) and, next to it, `<same name>.timing.json`. A one-line version goes to stderr. The summary is written even when the pass throws. Timestamps are when the host received each stream line. Fields:

- `wallSeconds`: first to last agent stream event. Container start and the install hook are outside it.
- `toolSeconds`: top-level tool calls other than sub-agents, overlapping calls counted once.
- `subagentSeconds`: from each spawn until the sub-agent's last own turn, so a background sub-agent counts while it runs.
- `modelSeconds`: the rest of the wall time, the parent's own turns and API latency.
- `toolResultToModelSeconds`: the part of model time from the last tool result to the parent's next model output, summed over the pass. `null` without `tool_result` lines.
- `toolCalls`, `subagentSpawns`: top-level counts.
- `bashCallsAfterSubagentSpawn`: Bash calls the parent made after its first sub-agent spawn.
- `heartbeatBashCalls`: of those, calls that only waited (`true`, `sleep`, `echo` without redirect or expansion).
- `finalContextTokens`: context size of the last top-level model turn.
- `toolEndSource`: how a call's end was measured. `tool_result` is the tool's result line. `next-event-gap` means no result line arrived in the whole run, so each call ends at the next raw stream line and the split is rough. `null` means the pass made no tool calls.
- `caveat`: why the split is missing or rough (no stream events at all, or the `next-event-gap` fallback). `null` when it was measured.

---

## 5. Refreshing the container-cache after a lockfile change

`.sandcastle/container-cache/node_modules` is a bind-mounted cache reused across runs so a warm install is a no-op. It goes stale whenever `pnpm-lock.yaml` changes — a stale cache surfaces as `CI=true pnpm install --frozen-lockfile` failing inside the container with exit code 1.

Refresh it by clearing the cache directory and letting the next run reinstall from scratch:

```bash
rm -rf .sandcastle/container-cache/node_modules
```

The next `afk`/`hitl` run's `onSandboxReady` hook (`CI=true pnpm install --frozen-lockfile`) repopulates it inside the container, writing straight back into the bind-mounted cache directory.

**Do not use `docker cp` to refresh the cache.** Copying `node_modules` out of a stopped container (`docker cp container:/home/agent/workspace/node_modules/. .sandcastle/container-cache/node_modules/`) follows pnpm's symlinks instead of preserving them, and silently corrupts the host's cache. If this happens, recovery is to delete `.pnpm-workspace-state-v1.json` and run `pnpm install` on the host to rebuild all symlinks from scratch.

---

## 6. File map

| File | Purpose |
|---|---|
| `.sandcastle/Dockerfile` | Container image — built once, reused per run |
| `.sandcastle/.env` | Runtime secrets loaded into the container (not in git) |
| `.sandcastle/.env.example` | Template for `.env` — safe to commit |
| `.sandcastle/claude.json` | Pre-accepted workspace-trust record, bind-mounted into the container (not in git — see section 3) |
| `.sandcastle/.gitignore` | Excludes logs, cache, worktrees, preserved patches, env, claude.json, base-branch.txt, and repair-context.md |
| `.sandcastle/container-cache/` | Bind-mounted `node_modules` cache between runs |
| `.sandcastle/logs/` | Agent log per pass and its `.timing.json` summary (section 4) — not in git |
| `.sandcastle/worktrees/` | Isolated git worktrees Sandcastle creates per run (`merge-to-head`) — transient, never committed |
| `.sandcastle/preserved/` | `<N>-<worktree>.patch` files `run-sandcastle.ts` writes when a crashed run leaves a worktree with uncommitted or unmerged work; apply with `git apply` — never committed |
| `.sandcastle/base-branch.txt` | Fixed point written by `implement-epic` before each `sandbox_command` call — transient, never committed |
| `.epic-notes/<epic-N>.md` | Epic notes kept by `implement-epic` on the host; `run-sandcastle.ts` reads them into the implement prompt and passes the agent's `notes` back. Self-ignoring via `.epic-notes/.gitignore` |
| `.sandcastle/repair-context.md` | Written by the hand-back repair-pass procedure when re-invoking the sandbox — transient, never committed |
| `.sandcastle/implement-prompt.md`, `.sandcastle/review-prompt.md`, `.sandcastle/efficiency-rules.md` | Prompt templates `scripts/run-sandcastle.ts` reads at runtime |

**Treat `.sandcastle/.gitignore` as a protected file.** If it's ever deleted (e.g. accidentally, in a merge), every subsequent sandcastle run writes untracked files straight into working-tree paths that `git add -A` would happily pick up — including full agent transcripts under `.sandcastle/logs/`, which can carry prompts or other sensitive content into git history. If a run ever adds `.sandcastle/logs/`, `.sandcastle/container-cache/`, `.sandcastle/worktrees/`, `.sandcastle/preserved/`, `.sandcastle/.env`, `.sandcastle/claude.json`, `.sandcastle/base-branch.txt`, or `.sandcastle/repair-context.md` as tracked/staged files, that's a signal `.gitignore` is missing or was edited — restore it before committing anything else.

**`base-branch.txt` needs a one-time untracking guard.** Because it's written to the working tree *before* `.sandcastle/.gitignore` necessarily exists there (first-ever run, or right after a `.gitignore` restore), it's easy for it to get swept into a commit once, after which the ignore rule stops suppressing it — git keeps tracking a file it already tracks regardless of `.gitignore`. If `git status` ever shows `base-branch.txt` as tracked, fix it once with:

```bash
git rm --cached .sandcastle/base-branch.txt 2>/dev/null || true
```

The `2>/dev/null || true` makes this safe to run unconditionally (e.g. as a one-off setup step) even when the file was never tracked in the first place. The file itself must still exist on disk after this — only its tracked copy is removed.
