# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
  git curl jq ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable

# Build-args for UID/GID alignment: the scaffolded `sandcastle:build`
# package.json script passes these as the host user's UID/GID (via `id -u`/
# `id -g`) so image-built files and bind-mounted files share an owner
# without runtime chown.
ARG AGENT_UID=1000
ARG AGENT_GID=1000

RUN groupmod -o -g $AGENT_GID node \
  && usermod -o -u $AGENT_UID -g $AGENT_GID -d /home/agent -m -l agent node

# Install Playwright Chromium + system dependencies before switching to the
# non-root user — browser installation and apt-get both require root.
# PLAYWRIGHT_BROWSERS_PATH bakes the binary at a fixed, world-readable path
# so the agent user can reach it at runtime without write access to root-owned
# directories.
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN npx --yes playwright install --with-deps chromium \
  && chmod -R o+rx /ms-playwright

USER ${AGENT_UID}:${AGENT_GID}

# /implement's own flow ends with a commit, run inside this container on the
# bind-mounted repo (see run-sandcastle.ts) — git needs an identity to commit
# as. No GitHub credentials here regardless: this only covers the local
# `git commit`; push and PR creation stay host-side.
ENV GIT_AUTHOR_NAME="Sandcastle Agent"
ENV GIT_AUTHOR_EMAIL="sandcastle-agent@localhost"
ENV GIT_COMMITTER_NAME="Sandcastle Agent"
ENV GIT_COMMITTER_EMAIL="sandcastle-agent@localhost"

# Install Claude Code CLI via the official install script
RUN curl -fsSL https://claude.ai/install.sh | bash

ENV PATH="/home/agent/.local/bin:$PATH"

# In head-branch sandbox mode, sandcastle bind-mounts the host's already
# checked-out git worktree at /home/agent/workspace, overriding whatever is
# copied in below. The COPY + install here still matter: they bake
# dependencies into the image at build time so `docker build` and a
# standalone `docker run` (no bind mount, no network) can be used to verify
# the image on its own, and they seed a warm package-manager store for
# iterations where the bind-mounted node_modules is missing or stale.
WORKDIR /home/agent/workspace
COPY --chown=${AGENT_UID}:${AGENT_GID} package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# @mrpitch/sandcastle is a GitHub git dependency — inject the GitHub token as
# a BuildKit secret so pnpm can clone it without baking the token into a layer.
# Pass at build time via: --secret id=github_token,env=GITHUB_TOKEN
# mode=0444 makes the secret readable by the non-root agent user inside this
# RUN layer; it is never written to any image layer.
RUN --mount=type=secret,id=github_token,mode=0444 \
  git config --global url."https://$(cat /run/secrets/github_token)@github.com/".insteadOf "https://github.com/" \
  && pnpm install --frozen-lockfile \
  && git config --global --unset url."https://$(cat /run/secrets/github_token)@github.com/".insteadOf
COPY --chown=${AGENT_UID}:${AGENT_GID} . .

ENTRYPOINT ["sleep", "infinity"]
