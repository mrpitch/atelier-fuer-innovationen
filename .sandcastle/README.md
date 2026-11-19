# Sandcastle

`afk` issues run through the shared Sandcastle runner in the Home repo:
`~/Dev/home/tools/sandcastle/` (clone from https://github.com/mrpitch/home.git if missing,
then `pnpm install` in `tools/sandcastle`). Setup, config schema, prompt overrides and
troubleshooting: `~/Dev/home/tools/sandcastle/README.md`.

This repo's part:

- `config.json`: check command and other per-repo settings for the runner.
- `Dockerfile`: sandbox image, built with `pnpm sandcastle:build`.
- `.env` (from `.env.example`): tokens and `DOCKER_HOST`; loaded by `bin/sandcastle-run`.
- `implement-prompt.md`, `efficiency-rules.md`: repo overrides of the runner's default prompts.
- `claude.json`, `container-cache/`, `logs/`, `worktrees/`, `preserved/`: runtime state, not committed.
