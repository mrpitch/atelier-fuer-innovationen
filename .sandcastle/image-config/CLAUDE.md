# Sandcastle image configuration

This file is baked into the sandbox image at build time (see
`.sandcastle/Dockerfile`) rather than bind-mounted from the workspace, so it
reaches the agent regardless of which branch is checked out — including a
branch cut before this file existed. It lands at Claude Code's user-level
memory path (`~/.claude/CLAUDE.md`), which is loaded alongside, not instead
of, this repo's own `CLAUDE.md`.

No instructions live here yet — this file only establishes that the channel
works. Content lands in later tickets.
