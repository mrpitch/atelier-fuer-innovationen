---
name: setup-my-skills
description: Configure this repo for the personal engineering skill set — set up its GitHub issue tracker, triage label vocabulary, domain doc layout (flat CONTEXT.md or Diataxis), and the epic/afk implementation workflow. Run once before first use of the other engineering skills, as an alternative to setup-matt-pocock-skills.
disable-model-invocation: true
---

# Setup My Skills

Scaffold the per-repo configuration this personal skill set assumes. A superset of `setup-matt-pocock-skills` — run this one instead, not both.

- **Issue tracker** — GitHub only; this skillset doesn't support GitLab or local-markdown tracking
- **Triage labels** — the strings used for the five canonical triage roles; `ready-for-agent`/`ready-for-human` default to `afk`/`hitl`
- **Domain docs** — where domain vocabulary and decisions live: the four-quadrant Diataxis layout by default, or flat `CONTEXT.md` + `docs/adr/` as a fallback
- **Implementation workflow** — always the epic/afk workflow (`/implement-epic`)

This is a prompt-driven skill, not a deterministic script. Explore, present what you found, confirm with the user, then write.

## Getting this skill set onto a target repo

Install this skill (and the rest of this repo's custom/forked set, plus the
curated `mattpocock/skills` subset it builds on) at **project level** in the
target repo — never globally. Claude Code resolves a same-named skill
conflict by "personal overrides project" (its own skills docs, "When skills
share the same name"), so a globally-installed copy would silently shadow
any project-specific fork the target repo later wants to make. Configuration
(`docs/agents/*.md`, written by the process below) is per-project anyway, so
a shared global copy buys nothing a local fork couldn't override.

From inside the target repo, before running this skill:

1. Pull in the curated `mattpocock/skills` subset via this repo's own lock
   file:

   ```bash
   gh api repos/mrpitch/myskills/contents/skills-lock.json --jq '.content' | base64 --decode > skills-lock.json
   npx skills experimental_install
   ```

   `experimental_install` only writes `.agents/skills/`; symlink
   `.claude/skills/` for each newly-added skill by hand (see
   `scripts/restore-vendored-skills.sh` in this repo for the loop) — it
   deliberately excludes Claude Code from its target agents.

2. Pull in this repo's own custom/forked skills — this step creates the
   `.claude/skills/` symlinks itself:

   ```bash
   npx skills add mrpitch/myskills --all -y --agent claude-code
   ```

   Always include `--agent claude-code`. Omitting it lets `-y` + `--all`
   fall back to installing to all ~77 agents the CLI knows about (including
   a spurious `agent/skills/` dir for an unrelated tool, "Eve") whenever the
   command runs somewhere that can't see the normal home directory — e.g.
   invoked via an agent's sandboxed shell, which is the common case here.
   See [about-the-mattpocock-fork-split.md](../../../docs/explanation/about-the-mattpocock-fork-split.md)
   for why.

Then run `/setup-my-skills`, i.e. the process below.

## Process

### 1. Explore

Look at the current repo to understand its starting state. Read whatever exists; don't assume:

- `git remote -v` and `.git/config` — confirm this is a GitHub repo, and which one (`owner/repo`) — this skillset only supports GitHub.
- `AGENTS.md` and `CLAUDE.md` at the repo root — does either exist? Is there already an `## Agent skills` section in either?
- `CONTEXT.md` and `CONTEXT-MAP.md` at the repo root
- `docs/adr/` and any `src/*/docs/adr/` directories
- `docs/{tutorial,how-to,reference,explanation}/` — signs the Diataxis layout is already in use
- `docs/agents/` — does this skill's prior output already exist?
- Which skills are installed (a folder alongside this one, or present in your available skills): `triage`, `diataxis`, `docs-discovery`, `discover-standards`, `to-tickets`, `to-spec`. These gate Sections B, C, and D below. `implement-epic` ships together with this skill, so Section B's implementation-workflow question always runs — no need to check for it.
- The target repo's current labels — `gh label list --json name,description,color` — needed later in Section B to check `epic`, `afk`, `hitl` (or whatever `afk_label`/`hitl_label` resolve to) against what's already there.
- Monorepo signals — a `pnpm-workspace.yaml`, a `workspaces` field in `package.json`, or a populated `packages/*` with its own `src/`. Present only in a genuinely large multi-package repo; their absence means single-context, which is almost every repo.
- A `.sandcastle/` directory at the repo root — the scaffold marker `@ai-hero/sandcastle` itself creates (via `npx @ai-hero/sandcastle init`). Feeds Section B item 1's sandbox-command default. If present, also check `package.json` for a script whose command references `.sandcastle` or `sandcastle`. The repo's lockfile (`pnpm-lock.yaml`, `package-lock.json`, or `yarn.lock`) determines which package-manager commands Section B item 1's scaffold templates use. If the resolved package manager is pnpm, also check `package.json` for a `packageManager` field — feeds the packageManager-pin check in Section B item 1. Also check the root `package.json`'s `type` field — feeds the `scripts/package.json` ESM-scoping check in Section B item 1, needed because `@ai-hero/sandcastle` is ESM-only.
- A private package registry indicator — a `.npmrc` or `.yarnrc.yml` with a registry line for a non-default host (`registry=`/`@scope:registry=` pointing somewhere other than the public npm/yarn registry) followed by an auth token. If that token is a literal value (not an env-var reference like `${TOKEN}`) and the file is tracked by git (`git ls-files --error-unmatch <file>`), flag it: Section B item 1's Sandcastle scaffold ends in a `COPY . .` that would otherwise bake that live token into an image layer permanently. Feeds Section B item 1's install-step and secret-hygiene handling below.

### 2. Present findings and ask

Summarise what's present and what's missing. Then take the sections in order — one section, one answer, then the next.

Lead each section with the recommended answer so the user can accept it in a word. Give a one-line explainer only when the choice genuinely branches; skip individual questions when exploration already settled it (Section B's triage-label question when `triage` isn't installed, Section D when `discover-standards` isn't installed).

**Section A — Issue tracker.** Always GitHub — this skillset doesn't support GitLab or local-markdown tracking, so there's no question to ask. Confirm from `git remote -v` that the repo points at GitHub. If it doesn't (no remote, or a non-GitHub remote), tell the user and ask them to point the repo at GitHub, or give the `owner/repo` directly, before continuing — there's nothing to fall back to.

Record the choice in `docs/agents/issue-tracker.md` from the [issue-tracker-github.md](./templates/issue-tracker-github.md) template. It carries a "PRs as a request surface" flag, defaulted **off** — leave it off and don't raise it; a user who wants external PRs in the triage queue can flip the flag in the file later.

**Section B — Labels & implementation workflow.** Skip the triage-label question if `triage` isn't installed. The implementation-workflow extras always run — `implement-epic` ships with this skill and the tracker (Section A) is always GitHub, so adoption isn't a per-repo choice; there's no yes/no question to ask, only the three extras below.

*Triage labels.* If `triage` is installed, ask exactly one question:

> Do you want to keep the default triage labels? (recommended: **yes**)

The defaults are the five canonical roles: `needs-triage`, `needs-info`, `afk`, `hitl`, `wontfix` — `ready-for-agent` and `ready-for-human` map to `afk`/`hitl` by default (not to their own role names), since this skillset always runs the epic/afk workflow and a single label should serve both triage and execution gating. On **yes**, write them as-is. Only if the user says no — usually because their tracker already uses other names — collect the overrides so `triage` applies existing labels instead of creating duplicates.

*Implementation workflow.* No yes/no question — go straight to the three extras from `implementation-workflow-epics.md`, one at a time, each defaulting to "none/off" — accept a blank answer as "leave it off":

1. Sandbox command for `afk` execution — default depends on what the explore step found under `.sandcastle/`:
   - **No `.sandcastle/` at all** — ask whether to scaffold one, default **no**: "This repo has no Sandcastle sandbox set up. Scaffold one for `afk` execution? (default: no — requires Docker and an `@ai-hero/sandcastle` install)". On **no** (or blank), behavior is unchanged from before this item existed: blank default, `afk` runs in-session. On **yes**, write `.sandcastle/Dockerfile` from this skill's [sandcastle-dockerfile](./templates/sandcastle/sandcastle-dockerfile) template (substituting `REPLACE_WITH_INSTALL_COMMAND`/`REPLACE_WITH_LOCKFILE_COPY` placeholders for the repo's package-manager commands, resolved from the lockfile found during explore — `pnpm-lock.yaml` → `pnpm`, `package-lock.json` → `npm`, `yarn.lock` → `yarn`; default to `pnpm`), then run `pnpm add -D github:mrpitch/myskills#path:packages/sandcastle` to install `@mrpitch/sandcastle` and copy config files from the installed package: `node_modules/@mrpitch/sandcastle/config/mcp.json` → repo-root `.mcp.json` (merge into `mcpServers` if `.mcp.json` already exists rather than overwriting), `node_modules/@mrpitch/sandcastle/config/.dockerignore` → repo-root `.dockerignore` (merge patterns if exists — without it the Dockerfile's `COPY . .` can pull stray `.env` or credentials files into the image), `node_modules/@mrpitch/sandcastle/config/.sandcastle.gitignore` → `.sandcastle/.gitignore`, `node_modules/@mrpitch/sandcastle/.env.example` → `.sandcastle/.env.example`, `node_modules/@mrpitch/sandcastle/config/sandcastle-readme.md` → `.sandcastle/README.md` (write fresh; if already exists, skip and note it in the step-3 draft); implement and review prompts and efficiency rules are bundled in the package and loaded by the sandcastle runner automatically — plus `scripts/run-sandcastle.ts` from [run-sandcastle.ts](./templates/sandcastle/run-sandcastle.ts) (a 5-line thin wrapper; only `REPLACE_WITH_CHECK_COMMAND` needs substituting). `sandbox_command` becomes `pnpm tsx scripts/run-sandcastle.ts {issue}` (swap `pnpm` for the resolved package manager's runner). Also add `@mrpitch/sandcastle`, `tsx`, and `@playwright/mcp` to `package.json`'s `devDependencies` (skip any already present) and run the resolved package manager's install once so the lockfile picks them up — `@playwright/mcp` must be installed because `.mcp.json` invokes it with `npx --no-install`, which fails if it isn't in `node_modules`. `@mrpitch/sandcastle` only exposes an `import` export condition (no `require`) — if the repo root's `package.json` doesn't already have `"type": "module"`, tsx treats `run-sandcastle.ts` as CommonJS. Check the root `package.json`'s `type` field: if it's already `"module"`, nothing extra is needed; otherwise write `scripts/package.json` with `{"type": "module"}` (skip if that file already exists with the field set) — this scopes ESM resolution to just `scripts/` without touching the root config. Also add two convenience scripts to `package.json`'s `scripts`: `"afk": "tsx --env-file=.sandcastle/.env scripts/run-sandcastle.ts"` — a human-facing wrapper for manual `<pm> run afk <issue>` invocation, loading the sandbox's env vars, unlike `sandbox_command` itself, which relies on the calling Claude Code session's own environment already carrying them — and `"sandcastle:build": "DOCKER_BUILDKIT=1 GITHUB_TOKEN=$(gh auth token) docker build --secret id=github_token,env=GITHUB_TOKEN --build-arg AGENT_UID=$(id -u) --build-arg AGENT_GID=$(id -g) -t sandcastle:<repo-slug> -f .sandcastle/Dockerfile ."` (`<repo-slug>` from `package.json`'s `name` field, lowercased and non-alphanumeric characters replaced with `-`, or the repo directory name if `name` is missing). `GITHUB_TOKEN=$(gh auth token)` is always included because `@mrpitch/sandcastle` is always a GitHub git dependency — the Dockerfile template's install `RUN` step always uses `--mount=type=secret,id=github_token,mode=0444` to pull it. Building through this script rather than `npx sandcastle docker build-image` matters even without a private registry — it's the one place the `--secret` flag below can be added without inventing a second build path later. If either script already exists, show the diff in the step-3 draft instead of silently overwriting — the repo may have deliberately customized it.
   - **`.sandcastle/` present, with exactly one `package.json` script matching it** — judge whether that script's own argument parsing needs only the issue number (optionally a `--repair-context <path>` flag), matching `implement-epic`'s `sandbox_command` contract (substitutes `{issue}` and nothing else; a configured command should support `--repair-context <path>` for repair passes). This is a read-the-script judgment call, like the label look-alike matching in the label-ensure step below — not a formal parser.
     - **Fits** — propose `sandbox_command` built from that script, substituting `{issue}`.
     - **Doesn't fit** (needs more than the issue number, e.g. a script taking `<issueNumber> <issueTitle> <issueBody> <targetBranch>`) — do not guess a broken command. Propose leaving `sandbox_command` blank, explain the mismatch (what the script actually needs vs. what `implement-epic` will pass it), and in the same turn offer the scaffold from the no-`.sandcastle/` case above as a fix-forward alternative — reusing the existing `.sandcastle/Dockerfile` if present rather than overwriting it, writing only `scripts/run-sandcastle.ts`, installing `@mrpitch/sandcastle` if not already installed, and copying whichever config files from `node_modules/@mrpitch/sandcastle/config/` and `.env.example` are actually missing (including `config/sandcastle-readme.md` → `.sandcastle/README.md`), plus the `afk`/`sandcastle:build` `package.json` scripts, the `@mrpitch/sandcastle`/`tsx`/`@playwright/mcp` `devDependencies`, and the `scripts/package.json` ESM fix, all described above — whichever aren't already present.
   - **`.sandcastle/` present, with more than one matching script** — surface the ambiguity and list the candidates rather than silently picking one; the user still confirms or overrides.
   - **`.sandcastle/` present, no matching script found** — offer to scaffold `scripts/run-sandcastle.ts` alone from the [run-sandcastle.ts](./templates/sandcastle/run-sandcastle.ts) template (same placeholder substitution as above), reusing whatever `.sandcastle/` assets already exist rather than guessing a generic invocation of an entrypoint that may not exist in the shape assumed. Also offer installing `@mrpitch/sandcastle` and copying its config files (`.mcp.json`, `.dockerignore`, `.sandcastle/.gitignore`, `.sandcastle/.env.example`, `config/sandcastle-readme.md` → `.sandcastle/README.md`) from `node_modules/@mrpitch/sandcastle/`, the `afk`/`sandcastle:build` `package.json` scripts, and the `@mrpitch/sandcastle`/`tsx`/`@playwright/mcp` `devDependencies` — whichever don't already exist.
   - **Private registry found** (the explore step's check flagged a live token in a tracked `.npmrc`/`.yarnrc.yml`) — whenever this item writes or touches `.sandcastle/Dockerfile`, additionally propose all three of: (a) writing the install `RUN` step as the `--mount=type=secret` variant documented inline in the [sandcastle-dockerfile](./templates/sandcastle/sandcastle-dockerfile) template, substituting the actual credentials filename, instead of a plain `RUN REPLACE_WITH_INSTALL_COMMAND`; (b) adding that filename to the target repo's root `.gitignore` and running `git rm --cached <file>` on it — the working file stays on disk, only the tracked copy drops; (c) inserting `--secret id=npmrc,src=<file>` into the `sandcastle:build` script written above, right after `DOCKER_BUILDKIT=1 docker build` — `npx sandcastle docker build-image` doesn't support passing a secret through, which is exactly why this item writes its own build script rather than delegating to that command. Each of the three is a proposal in the step-3 draft, not an auto-applied change — the live token itself still needs rotating on the registry's side, which this skill cannot do.
   - **packageManager pin missing** (the explore step found pnpm resolved with no `packageManager` field in `package.json`) — whenever this item writes `.sandcastle/Dockerfile`, propose adding `"packageManager": "pnpm@<version>"` to `package.json`, using the host's currently active version (`pnpm --version`). Without the pin, `corepack enable` inside the container has nothing authoritative to prepare and can resolve a different pnpm version than the host, producing install drift the host never sees.
   - Either way, this stays a proposed default, not an auto-applied value — the user can clear it to keep `sandbox_command` blank, same as every other item here.
2. GitHub Project board status-sync — ask for the Project **number** (blank = skip project-status syncing entirely, and skip the rest of this item). If given, check whether `scripts/set-project-status.sh` already exists:
   - **Doesn't exist** — offer to write it from this skill's [set-project-status.sh](./scripts/set-project-status.sh) template, substituting the given number for `REPLACE_WITH_PROJECT_NUMBER` (owner/repo are resolved at runtime, nothing else to fill in). On accept, write it and `chmod +x` it; `project_status_command` becomes `./scripts/set-project-status.sh {issue} {status}`.
   - **Already exists** — ask whether to point `project_status_command` at it as-is (most likely — the repo already has status-sync automation) or overwrite with the template.
   - If the user declines the template entirely, ask for their own `project_status_command` (a literal command template using `{issue}` and `{status}`) instead.
3. Auto-merge afk epic sub-issues into the epic branch once every gate passes (default **no**)

Then, without asking, resolve `afk_label`/`hitl_label`: reuse whatever tracker label strings this section resolved for `ready-for-agent`/`ready-for-human` (the triage-label answer just collected, if that question ran; otherwise the literal defaults `afk`/`hitl`). This is a default, not a question — a user who wants execution-autonomy tracked separately from triage-readiness can override the two fields directly in the `docs/agents/implementation-workflow.md` draft at step 3.

Write `docs/agents/implementation-workflow.md` from the [implementation-workflow-epics.md](./workflow/implementation-workflow-epics.md) template, filled in with their answers to the three extras.

*Label-ensure.* No question — a check and, where needed, a proposal, run unconditionally right after `afk_label`/`hitl_label` are resolved above. Using the label list fetched in step 1, classify each of the three roles — `epic` (always the fixed name `epic`), `afk` (named by the resolved `afk_label`), `hitl` (named by the resolved `hitl_label`) — into one of three states:

- **Exact name match already exists** → no action, but surface its current color/description in the step-3 draft so a same-name-different-meaning collision (e.g. an unrelated `epic` label already used for sizing) is visible before it's assumed correct.
- **No exact match, but a look-alike exists** (e.g. `automated`/`no-human-needed` for `afk`; `needs-human`/`human-required` for `hitl`; `tracking-issue`/`parent-issue` for `epic`) → for `epic`, propose consolidating it via `gh label edit <old-name> --name epic --color <color> --description <description>`. For `afk`/`hitl`, prefer proposing a config update instead — set `afk_label`/`hitl_label` to the look-alike's existing name rather than renaming the live label — with the rename offered as an alternative for a maintainer who wants standardized names across repos. Either way this is a judgment call from label names/descriptions, proposed in the step-3 draft, never applied silently. If the user declines the proposed consolidation — the look-alike actually means something else in this repo — fall back to the no-match case: create the canonical label fresh, alongside the existing one, rather than merging them.
- **No match at all** → propose `gh label create <name> --color <color> --description "<description>"`, under the resolved name.

Canonical color/description (name is fixed for `epic`, resolved for `afk`/`hitl`):

- `epic` — `#5319E7` — "A spec/PRD issue whose sub-issues are worked as an epic (implement-epic)"
- `afk` — `#1D76DB` — "Safe for autonomous execution in implement-epic"
- `hitl` — `#D93F0B` — "Requires human-in-the-loop supervision in implement-epic"

A `gh label edit --name` rename preserves the label's existing issue/PR associations — nothing needs re-labeling. A config-update proposal touches no label at all — only `afk_label`/`hitl_label` in `docs/agents/implementation-workflow.md` change. This step is idempotent: re-running it when all three already match their resolved names is a no-op. If a `gh label create`/`gh label edit` call fails (e.g. insufficient repo permissions), surface the error immediately rather than continuing Section B silently — a label that fails to materialize here breaks `implement-epic` step 1 later, at a far less debuggable moment.

If the user edits `afk_label`/`hitl_label` in the step-3 draft's `implementation-workflow.md` content after this classification already ran against the old values, re-run the `afk`/`hitl` classification against the edited names before step 4 writes anything — the draft shown to the user must reflect the names actually being written, not the ones resolved before their edit.

*Skill hygiene.* No question — a check, only relevant if `docs/agents/triage-labels.md` was written above (i.e. `triage` is installed and the triage-label question ran). `to-tickets` and `to-spec` both apply the label for the `ready-for-agent` role when publishing to the tracker; older copies of those skill files hardcode the literal string `ready-for-agent` instead of resolving it against `docs/agents/triage-labels.md`, which silently mislabels tickets whenever the mapping resolves `ready-for-agent` to something else (as it now does by default — `afk`). If `to-tickets` and/or `to-spec` are installed, check their `SKILL.md` for this pattern:

- `to-tickets/SKILL.md` — a literal `--label "ready-for-agent"` in the `gh issue create` example, "Apply the `ready-for-agent` triage label..." in prose, and `**Status:** ready-for-agent` in the local-ticket template.
- `to-spec/SKILL.md` — "Apply the `ready-for-agent` triage label..." in prose.

If found, patch it in place to resolve against the mapping instead of hardcoding the role name — the fix already applied to this skillset's own copies of both files is the reference: "Apply the triage label mapped to the `ready-for-agent` role (see `docs/agents/triage-labels.md`)" in prose, and `--label "<ready-for-agent's label string, from docs/agents/triage-labels.md>"` in the command example. If the pattern isn't found (already fixed, or the skill isn't installed), skip silently. Include the diff in the confirm-and-edit draft (step 3) alongside everything else this skill writes.

Separately, `to-spec` should also apply the `epic` label — specs it produces are usually large enough to become one, split into sub-issues later via `/to-tickets` — defaulting to yes and asking the user only when it suspects this spec isn't one. If `to-spec` is installed, check its `SKILL.md`'s publish step (step 3 of its Process) for any mention of the `epic` label; if absent, patch in "Specs from this skill are usually large enough to become an epic (split into sub-issues later via `/to-tickets`), so apply the `epic` label by default. Ask the user only when you suspect this one isn't — e.g. it's already scoped to a single atomic ticket — and skip the label if they confirm it isn't." right after the `ready-for-agent` sentence. If already present, skip silently. Include this diff in the same confirm-and-edit draft as the hardcoded-label fix above.

**Section C — Domain docs.** Default to the **four-quadrant Diataxis layout** (`docs/{tutorial,how-to,reference,explanation,adr}/`, frontmatter-tagged) when `diataxis` and `docs-discovery` are both installed (exploration told you) — write it without asking, no question. If either isn't installed, Diataxis isn't usable here, so fall back to flat `CONTEXT.md` + `docs/adr/` at the repo root instead — also without asking.

- **Multi-context** — a root `CONTEXT-MAP.md` pointing to per-context `CONTEXT.md` files, in place of a single `CONTEXT.md` — only when exploration found monorepo signals *and* the flat-`CONTEXT.md` fallback applies (`diataxis`/`docs-discovery` aren't installed). Confirm which layout they want; this is the one branch in this section still worth a question, since it turns on a structural fact about the repo, not a style preference.

If Diataxis is chosen and `docs/` doesn't already have the quadrant folders, mention that `diataxis scaffold` (run separately, or on first use of `/grill-with-docs`) creates them lazily — don't scaffold them yourself here, this skill only writes config.

**Section D — Standards discovery.** Informational only, no question. If `discover-standards` is installed and Diataxis was chosen in Section C, mention in the final summary (step 5) that `/discover-standards` is available to mine `docs/reference/` standards from the codebase. If Diataxis wasn't chosen, mention that `/discover-standards` needs the Diataxis layout to be useful here.

### 3. Confirm and edit

Show the user a draft of:

- The `## Agent skills` block for the canonical file, and the stub content for the other (see step 4 for selection rules)
- The contents of `docs/agents/issue-tracker.md`, `docs/agents/domain.md`, `docs/agents/implementation-workflow.md`, and `docs/agents/triage-labels.md` (the last only when `triage` is installed) — `implementation-workflow.md`'s `afk_label`/`hitl_label` fields are the one place to override the default triage-label reuse
- `scripts/set-project-status.sh` (only when Section B's project-status item wrote it)
- `scripts/run-sandcastle.ts` and `.sandcastle/Dockerfile` with package-manager placeholders substituted (only when Section B's sandbox-command item accepted a scaffold offer, full or fix-forward); list which config files will be copied from `node_modules/@mrpitch/sandcastle/` (`.mcp.json`, `.dockerignore`, `.sandcastle/.gitignore`, `.sandcastle/.env.example`, `.sandcastle/README.md`) and whether each will be merged or written fresh
- The `package.json` `scripts.afk`/`scripts["sandcastle:build"]` additions (or their diff, if either name already existed), the `@mrpitch/sandcastle`/`tsx`/`@playwright/mcp` `devDependencies` additions, and `scripts/package.json` if the root `package.json` needed the ESM scoping fix
- When Section B item 1's private-registry or packageManager-pin checks fired: the `--mount=type=secret` `Dockerfile` variant, the `.gitignore`/`git rm --cached` proposal, the `sandcastle:build` script's `--secret` addition, and/or the `package.json` `packageManager` addition
- The diff for `to-tickets/SKILL.md` and/or `to-spec/SKILL.md` (only when Section B's skill-hygiene check found the hardcoded-label pattern and/or, for `to-spec`, the missing `epic`-label step)
- Section B's label-ensure proposals — for each of `epic`/`afk`/`hitl`: create, rename-from-X, config-update-to-X, or already-present — before any `gh label create`/`gh label edit` call runs or a config-update changes `afk_label`/`hitl_label` in the `implementation-workflow.md` draft above
- The `.claude/settings.json` `permissions.allow` additions (always included — implement-epic's `!` commands need these to pass the skill pre-check; `settings.local.json` is not read by the pre-check). Show the full block to be merged, with the sandbox and project-status entries conditionally included based on Section B's answers. If the file already exists, show a diff rather than the full file.

Let them edit before writing.

### 4. Write

**Pick the file(s) to edit:** this skillset always keeps both `AGENTS.md` and `CLAUDE.md` present — one canonical (carries the full `## Agent skills` block), the other a one-line stub pointing at it.

- **Neither exists** — create both: `AGENTS.md` canonical, `CLAUDE.md` a stub (`See \`AGENTS.md\` for this repo's agent skill configuration.`).
- **Exactly one exists** — that file stays (or becomes) canonical; write/update the `## Agent skills` block there. Create the other as a stub pointing to it, unless a stub already exists.
- **Both exist** — whichever already carries the `## Agent skills` block is canonical; update it in-place. If neither carries the block yet, ask the user which one should be canonical — don't guess when both are real pre-existing files.

If an `## Agent skills` block already exists in the canonical file, update its contents in-place rather than appending a duplicate. Don't overwrite user edits to the surrounding sections.

The block:

```markdown
## Agent skills

### Issue tracker

[one-line summary of where issues are tracked]. See `docs/agents/issue-tracker.md`.

### Triage labels

[one-line summary of the label vocabulary]. See `docs/agents/triage-labels.md`.

### Domain docs

[one-line summary of layout — "single-context", "multi-context", or "Diataxis"]. See `docs/agents/domain.md`.

### Implementation workflow

[one-line summary — "epic/afk workflow via /implement-epic" and whether sandbox/project-status/auto-merge are on]. See `docs/agents/implementation-workflow.md`.
```

Include the `### Triage labels` sub-block, and write `docs/agents/triage-labels.md`, only when `triage` is installed and Section B's triage-label question ran; omit both when it isn't. The `### Implementation workflow` sub-block and `docs/agents/implementation-workflow.md` are always included.

Then write the docs files using the seed templates in this skill folder as a starting point:

- [issue-tracker-github.md](./templates/issue-tracker-github.md) — GitHub issue tracker
- [triage-labels.md](./templates/triage-labels.md) — label mapping (only if `triage` is installed)
- [domain-diataxis.md](./templates/domain-diataxis.md) — domain doc consumer rules, Diataxis layout (default)
- [domain-context-adr.md](./templates/domain-context-adr.md) — domain doc consumer rules, flat `CONTEXT.md`/ADR layout (fallback when `diataxis`/`docs-discovery` aren't installed)
- [implementation-workflow-epics.md](./workflow/implementation-workflow-epics.md) — epic/afk workflow config (always written)
- [set-project-status.sh](./scripts/set-project-status.sh) — generic GitHub Project status-sync script, written to `scripts/set-project-status.sh` (only if the user accepted it in Section B's project-status item); fill in the Project number, then `chmod +x` it
- [run-sandcastle.ts](./templates/sandcastle/run-sandcastle.ts) — 5-line thin wrapper, written to `scripts/run-sandcastle.ts` (only if the user accepted a scaffold offer in Section B's sandbox-command item); substitute `REPLACE_WITH_CHECK_COMMAND` before writing
- [sandcastle-dockerfile](./templates/sandcastle/sandcastle-dockerfile) — written to `.sandcastle/Dockerfile` (same condition as `run-sandcastle.ts`; skip if already exists); substitute `REPLACE_WITH_INSTALL_COMMAND`/`REPLACE_WITH_LOCKFILE_COPY` placeholders before writing
- After writing the Dockerfile, run `pnpm add -D github:mrpitch/myskills#path:packages/sandcastle` (or the resolved package manager's equivalent) to install `@mrpitch/sandcastle`, then copy config files from the installed package:
  - `node_modules/@mrpitch/sandcastle/config/mcp.json` → repo-root `.mcp.json` (merge `playwright` entry into `mcpServers` if `.mcp.json` already exists; write fresh otherwise)
  - `node_modules/@mrpitch/sandcastle/config/.dockerignore` → repo-root `.dockerignore` (merge patterns if exists; write fresh otherwise)
  - `node_modules/@mrpitch/sandcastle/config/.sandcastle.gitignore` → `.sandcastle/.gitignore` (skip if already exists)
  - `node_modules/@mrpitch/sandcastle/.env.example` → `.sandcastle/.env.example` (skip if already exists)
- If Section B item 1's private-registry check fired, apply the `--mount=type=secret` Dockerfile variant, the `.gitignore` addition plus `git rm --cached <file>`, and the `sandcastle:build` script's `--secret` addition, all as confirmed in step 3. If the packageManager-pin check fired, add the confirmed `packageManager` field to `package.json`.
- `package.json`'s `scripts.afk` and `scripts["sandcastle:build"]` (same condition as `run-sandcastle.ts`) — parse the file, add or update just these two keys, leave every other key untouched, and re-serialize preserving the file's existing indentation. Same condition, add `@mrpitch/sandcastle`, `tsx`, and `@playwright/mcp` to `devDependencies` (skip any already present), then run the resolved package manager's install command once so the lockfile is updated to match — `@playwright/mcp` must be in `node_modules` because `.mcp.json` invokes it with `npx --no-install`, which fails if it isn't already installed. Same condition, if the root `package.json` doesn't have `"type": "module"`, write `scripts/package.json` with `{"type": "module"}` — skip this if `scripts/package.json` already exists with that field set.

Both domain templates write to the same target path, `docs/agents/domain.md` — pick whichever one matches the Section C answer.

**`.claude/settings.json` permissions** — always write, regardless of whether sandcastle was scaffolded. Read the file if it exists; merge the entries below into `permissions.allow` (skip any already present); write it back preserving the existing shape. Create it if absent:

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
      "Bash(git push *)"
    ]
  }
}
```

If `sandbox_command` was configured (Section B item 1), additionally merge:
```json
"Bash(pnpm run sandcastle:build)",
"Bash(pnpm tsx scripts/run-sandcastle.ts *)"
```
(swap the second pattern to match the actual `sandbox_command` runner if it differs from `pnpm tsx scripts/run-sandcastle.ts`).

If `project_status_command` was configured (Section B item 2), additionally merge:
```json
"Bash(./scripts/set-project-status.sh *)"
```

These go into `.claude/settings.json` (committed), not `.claude/settings.local.json`. The skill pre-check that validates `!` command templates reads `settings.json`; it does not read `settings.local.json`.

Execute the confirmed label-ensure actions from Section B: run the accepted `gh label create`/`gh label edit` calls (`epic` only ever gets a rename or a create, never a config update, since it has no config field; `afk`/`hitl` get a rename or create only when that was chosen over a config update). A config-update proposal needs no separate action here — it's already reflected in the `afk_label`/`hitl_label` values being written into `docs/agents/implementation-workflow.md` above. Where the label-ensure classification found an exact match, there's nothing to execute for that label.

### 5. Done

Tell the user the setup is complete and which engineering skills will now read from these files. Mention:

- They can edit `docs/agents/*.md` directly later — re-running this skill is only necessary if they want to switch domain-docs layouts or the implementation workflow, or restart from scratch.
- The Section D note on `/discover-standards`, if applicable.
- If Diataxis was chosen and `docs/` doesn't yet have the quadrant folders, that `/diataxis scaffold` (or the first `/grill-with-docs` write) creates them lazily.
- **Claude Code Bash permissions were written to `.claude/settings.json`** — implement-epic's `!` commands are validated against `settings.json` (the committed project file) before Claude processes them; `settings.local.json` is not read by that pre-check. Step 4 already merged the needed rules into `.claude/settings.json`. Confirm they landed: the file's `permissions.allow` array should contain `Bash(gh *)`, the git entries, and (if configured) the sandcastle and project-status entries.

- **If Section B item 1's Sandcastle scaffold offer was accepted, `afk` isn't runnable yet** — two additional manual steps remain:
  1. Copy `.sandcastle/.env.example` to `.sandcastle/.env` and fill in `CLAUDE_CODE_OAUTH_TOKEN` (or `ANTHROPIC_API_KEY`).
  2. Build the sandbox image once — `<pm> run sandcastle:build` (the script this skill just wrote), run from the repo root, requires Docker running.
- **`playwright-mcp` runs inside the sandbox container** — Chromium is baked into the Docker image (`PLAYWRIGHT_BROWSERS_PATH=/ms-playwright`). No host browser installation is required. The `sandcastle:build` step bakes it in at image build time.
- **If Section B item 1's private-registry check fired, the underlying token still needs rotating on the registry's side** — untracking the credentials file and gitignoring it stops future commits from re-leaking it, but it was already committed and is still live in git history; this skill can't rewrite history or revoke the token, so tell the user to do it directly (e.g. GitHub Packages → Settings → Developer settings → regenerate the token, then update the local credentials file with the new value).
- **If Section B item 1's private-registry check fired, `sandcastle:build` now needs the credentials file to exist on disk, even empty, or the build fails before it starts** — `docker build --secret id=npmrc,src=<file>` errors immediately ("secret file not found") if `<file>` is missing, regardless of whether its contents actually matter yet. Since this file was just untracked and gitignored, anyone with a fresh clone (including the current one, if `git rm --cached` ran) won't have it until they recreate it locally — with real credentials to actually install from the registry, or `touch <file>` as a placeholder if they don't need that yet and just want the build to proceed.
