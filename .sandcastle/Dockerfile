# syntax=docker/dockerfile:1
FROM node:24-alpine

RUN apk add --no-cache git curl jq bash \
  && corepack enable

# Build-args for UID/GID alignment: `sandcastle docker build-image`
# defaults these to the host user's UID/GID so image-built files and
# bind-mounted files share an owner without runtime chown.
ARG AGENT_UID=1000
ARG AGENT_GID=1000

# Rename the base image's "node" user to "agent" and align UID/GID.
# (shadow is installed just long enough to run groupmod/usermod, then
# removed — Alpine's busybox tools don't support UID/GID reassignment.)
RUN apk add --no-cache shadow \
  && groupmod -o -g $AGENT_GID node \
  && usermod -o -u $AGENT_UID -g $AGENT_GID -d /home/agent -m -l agent node \
  && apk del shadow

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
COPY --chown=${AGENT_UID}:${AGENT_GID} package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json source.config.ts ./
# source.config.ts + tsconfig.json (beyond the usual package.json/lockfile
# pair) are needed here because this repo's postinstall runs `fumadocs-mdx`,
# which reads its config directly during install rather than lazily at
# build/dev time — omitting it fails install with "Cannot find config file".
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
