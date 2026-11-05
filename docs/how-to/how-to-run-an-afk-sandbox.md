---
title: How to run an afk sandbox
description: Set up Docker and credentials once, build the Sandcastle image, and run the sandboxed agent on a GitHub issue from the command line.
type: how-to
status: stable
last_reviewed: 2026-11-05
tags: [sandcastle, afk, docker, agents, github-issues]
---

# How to run an afk sandbox

This runs the implement and review agents on one GitHub issue inside a Docker container. Normally `/implement-epic` calls it for you; run it by hand to retry or debug a single issue. For why it exists, see [About the epic/afk workflow](../explanation/about-the-epic-afk-workflow.md).

## Before you start

- Docker. On macOS this repo uses Colima: `colima start`.
- The GitHub CLI, logged in (`gh auth status`). The runner reads the issue with `gh issue view`.
- You are on a branch named `feat/<issue-number>-<slug>`. The runner refuses to start on any other branch.
- For an issue in an epic, `.sandcastle/base-branch.txt` must exist. `/implement-epic` writes it before it calls the sandbox. If you run the sandbox by hand, create it with the epic's fixed point, for example `origin/epic/12-my-epic`, or for a standalone issue `origin/main`.

## One-time setup

1. Create the environment file and fill in one credential.

   ```bash
   cp .sandcastle/.env.example .sandcastle/.env
   ```

   Set `CLAUDE_CODE_OAUTH_TOKEN` (get one with `claude setup-token`) or `ANTHROPIC_API_KEY`. On macOS with Colima, also set `DOCKER_HOST=unix:///Users/<username>/.colima/default/docker.sock`. `.sandcastle/.env` is gitignored.

2. Build the image. Repeat after any change to `.sandcastle/Dockerfile`.

   ```bash
   pnpm run sandcastle:build
   ```

   The build needs a `.npmrc` file in the repo root. The repo keeps an empty one, so the build works unchanged.

## Run it

```bash
pnpm run afk <issue-number>
```

Example: `pnpm run afk 57`.

The script loads `.sandcastle/.env`, creates an isolated worktree under `.sandcastle/worktrees/`, runs the implement pass, then the review pass. Your own checkout is not touched while it runs. The last line on stdout is a JSON result with `success`, `summary`, `blockers`, `reviewReport` and `notes`.

To continue after a failed gate, pass the report from the failed run:

```bash
pnpm run afk <issue-number> --repair-context .sandcastle/repair-context.md
```

## Verify

- The JSON result has `"success": true`.
- The agent logs are in `.sandcastle/logs/<branch>-<implement|review>-<timestamp>.log`, each with a `.timing.json` next to it.
- The commits landed on your `feat/` branch: `git log --oneline -5`.

## Troubleshooting

- **`Expected .sandcastle/base-branch.txt to exist`:** create the file as described above.
- **`Expected the host repo to be checked out on a "feat/<n>-*" branch`:** check out the issue's branch first.
- **Docker errors before the container starts:** Colima is not running, or `DOCKER_HOST` is unset in the shell. `implement-epic` reads it from your shell, not from `.sandcastle/.env`.
- **Install fails with a lockfile error inside the container:** the cached `node_modules` is stale after a lockfile change. Run `rm -rf .sandcastle/container-cache/node_modules` and start again.
- **A crashed run left work behind:** look in `.sandcastle/preserved/` for a `<n>-<worktree>.patch` file and apply it with `git apply`.
- **Claude Code ignores the permission rules:** `.sandcastle/claude.json` must exist with the workspace trusted. The runner recreates it if it is missing.

More detail on each file is in `.sandcastle/README.md`.
