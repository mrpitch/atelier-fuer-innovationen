---
name: release
description: "Cut a release from trunk: detect an unreleased version in package.json, create and push the v* tag, publish the GitHub release with grouped notes. Use when the user says release, tag, publish a release, or when a deploy fails on a missing tag or GitHub release."
disable-model-invocation: true
---

# Release

Turn a version bump already merged to trunk into a `v*` tag and a published GitHub release.

The version bump itself is not this skill's job. `/implement-epic` bumps `package.json` on a standalone issue's PR, and on the epic branch before the epic → trunk PR (`--finish`). This skill starts after that PR merges.

## Config

Read once at the start:

- **Trunk** — the repo's default branch (`gh repo view --json defaultBranchRef --jq .defaultBranchRef.name`), unless `docs/agents/issue-tracker.md` names a different integration branch. `<trunk>` below means this.
- **`release_compare_url`** and **`release_deploy_note`** — the `## Release` section of `docs/agents/implementation-workflow.md`, written by `/setup-my-skills`. Without a `release_compare_url`, build it from `gh repo view --json url --jq .url` + `/compare/{from}...{to}`. Without a `release_deploy_note`, publishing is the last step.

## 1. Check there is something to release

```bash
git fetch origin --tags --quiet
version=$(git show origin/<trunk>:package.json | node -p "JSON.parse(require('fs').readFileSync(0,'utf8')).version")
latest=$(git tag --list 'v*' --sort=-v:refname | head -1)
```

Read the version from `origin/<trunk>`, not the working tree. The checkout may sit on another branch with a different version.

Stop and tell the user if any of these hold:

- `v$version` already exists locally or on the remote. Say which, and whether a release exists too (`gh release view v$version`). A tag without a release only needs step 4.
- `$version` is not greater than `$latest` (compare as semver). The bump is missing.
- `origin/<trunk>` has no commits since `$latest`. Nothing to release.

Report `$latest` → `$version` and the commit count before going on.

## 2. Pick the commit

Tag `origin/<trunk>`'s tip. Confirm it is the commit that set the version: `git log -1 --format=%H -S"\"version\": \"$version\"" origin/<trunk> -- package.json` should be at or before the tip. If trunk has moved past the bump with unreleased work, say so and ask whether to tag the tip or the bump commit. The tag decides what ships.

## 3. Write the notes

List what merged since the last tag:

```bash
gh pr list --state merged --base <trunk> --search "merged:>=$(git log -1 --format=%cI $latest)" --json number,title,author,url --limit 100
```

An epic lands as one squashed PR, so it shows as one entry. Its body lists the sub-issues and their PRs; use those as line items when one line would hide what changed:

```bash
gh pr view <epic-pr> --json body --jq .body
```

Group by Conventional Commit type:

- **Features** for `feat`
- **Fixes** for `fix` and security patches
- **Other changes** for `refactor`, `perf`, `docs`, `chore`, `ci`. Drop the version bump and sandbox tooling lines unless they are the whole release.

One plain line per change, written for someone who runs the app. Strip the `type(scope):` prefix, keep the PR link. Skip empty groups. Finish with the compare link, `release_compare_url` with `{from}=$latest` and `{to}=v$version`:

```
**Full changelog:** <release_compare_url>
```

Write the notes to the scratchpad directory with the Write tool, so `gh release create --notes-file` can read a literal path.

## 4. Confirm, then publish

Print the version, the target SHA, and the full notes. Wait for a yes. A tag push and a published release are visible to everyone and may trigger workflows, so approval for one release does not cover the next.

```bash
git tag v$version <sha>
git push origin v$version
gh release create v$version --verify-tag --title "v$version" --notes-file <notes-path>
```

`--verify-tag` makes the release fail instead of silently creating a tag from the default branch if the push did not land.

Check both landed:

```bash
git ls-remote --tags origin v$version
gh release view v$version --json url,isDraft --jq '.url, .isDraft'
```

`isDraft` must be `false`: a draft is invisible to anything that checks for a published release.

## 5. Hand back

Give the release URL. If `release_deploy_note` is set, repeat it. Trigger a deploy only when the user asks.
