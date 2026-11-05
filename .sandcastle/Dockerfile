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
# bind-mounted worktree (see run-sandcastle.ts) — git needs an identity to
# commit as. No GitHub credentials here regardless: this only covers the
# local `git commit`; push and PR creation stay host-side.
ENV GIT_AUTHOR_NAME="Sandcastle Agent"
ENV GIT_AUTHOR_EMAIL="sandcastle-agent@localhost"
ENV GIT_COMMITTER_NAME="Sandcastle Agent"
ENV GIT_COMMITTER_EMAIL="sandcastle-agent@localhost"

# Install Claude Code CLI via the official install script
RUN curl -fsSL https://claude.ai/install.sh | bash

ENV PATH="/home/agent/.local/bin:$PATH"

# In merge-to-head sandbox mode, sandcastle bind-mounts an isolated git
# worktree at /home/agent/workspace (never your own checkout), overriding
# whatever is copied in below. The COPY + install here still matter: they
# bake dependencies into the image at build time so `docker build` and a
# standalone `docker run` (no bind mount, no network) can be used to verify
# the image on its own, and they seed a warm package-manager store for
# iterations where the bind-mounted node_modules is missing or stale.
WORKDIR /home/agent/workspace
COPY --chown=${AGENT_UID}:${AGENT_GID} package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json source.config.ts ./
# source.config.ts + tsconfig.json (beyond the usual package.json/lockfile
# pair) are needed here because this repo's postinstall runs `fumadocs-mdx`,
# which reads its config directly during install rather than lazily at
# build/dev time — omitting it fails install with "Cannot find config file".
# `vite` is in optionalDependencies (not devDependencies) solely to satisfy
# fumadocs-mdx@15.3.0's postinstall: the CLI imports from its own
# dist/vite/index.js even for Next.js projects, so a clean pnpm store
# (Docker, fresh CI) fails with ERR_MODULE_NOT_FOUND unless vite is
# explicitly installed. Locally the global pnpm store leaks it in as a
# phantom dep, masking the bug — the Docker environment exposed it.
# pnpm-workspace.yaml carries the allowBuilds entries for esbuild/sharp's
# install scripts (pnpm 10+ ignores them by default otherwise) — without
# it here, install fails non-interactively with ERR_PNPM_IGNORED_BUILDS.
# .npmrc is always mounted as a build secret rather than COPYed in, so this
# Dockerfile is identical whether or not the repo has a private registry:
# empty/no-registry .npmrc → install behaves exactly like it wasn't there;
# a real one with a token never touches an image layer either way. Pass it
# at build time with `docker build --secret id=npmrc,src=.npmrc ...`
# (already wired into the `sandcastle:build` package.json script).
RUN --mount=type=secret,id=npmrc,target=/home/agent/workspace/.npmrc,uid=${AGENT_UID},gid=${AGENT_GID} \
  pnpm install --frozen-lockfile
COPY --chown=${AGENT_UID}:${AGENT_GID} . .

ENTRYPOINT ["sleep", "infinity"]
