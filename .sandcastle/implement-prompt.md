# Task

You are implementing a single GitHub issue in an isolated sandbox. The host
already created and checked out a dedicated worktree branch for this run —
you are working directly in its working directory. This is a real, isolated
git worktree, not a copy: a commit you make here is a real commit, and it
gets merged onto the issue's actual branch automatically once this session
ends successfully — you never need to push or merge it yourself. This is a
one-shot run: there is no issue tracker to poll and no next issue to pick up
afterwards.

- **Issue**: #{{ISSUE_NUMBER}} — {{ISSUE_TITLE}}
- **Branch**: `{{SOURCE_BRANCH}}` (already checked out — do not create or switch branches)
- **Fixed point**: `{{FIXED_POINT}}` — the branch this work is based on. Give
  this to `/implement`'s review step. Your changes are still uncommitted at
  that point, so it's a work-in-progress review: the diff is against this
  fixed point, not a merge-base to `HEAD`.
- **Check command**: `{{CHECK_COMMAND}}` — use this for `/implement`'s
  typecheck/test verification, on top of whatever `AGENTS.md`/`CLAUDE.md`
  also documents.

## Issue body

{{ISSUE_BODY}}

## Epic notes

What earlier sub-issues of this epic learned, as pointers. Use them to skip
exploration they already did; the code on the fixed point is the authority
where they disagree.

{{EPIC_NOTES}}

## Before starting

Read `.sandcastle/efficiency-rules.md` and apply its rules for the duration of this session.

## How to work

Run `/implement` on this issue — read `.agents/skills/implement/SKILL.md` if
it isn't already loaded, and follow it as-is: explore, plan, tdd, verify,
review (against the fixed point above), commit. Don't skip its review step
or its commit step; both are expected to happen inside this sandbox now.

## Delegating read-only work

Your context grows with every file you read and every test log you page
through, and a long context makes every later turn slower. Send read-only
work to sub-agents and keep only their conclusions:

- exploring the codebase (where a seam lives, what calls what, how an
  existing feature is wired),
- diagnosing a failing test (read the failure, trace it to a cause, report
  file:line and the likely fix),
- tracing types through a library or generated declaration files.

Ask each sub-agent for a short report: file paths, line numbers and a
recommendation. Give it the exact question and the paths that matter, not
the whole issue.

You keep the decisions and every edit. Sub-agents never write: they share
this one worktree and the container's CPUs, so concurrent writes and concurrent test
runs would collide and slow each other down.

## External source material

The container has outbound internet access and a headless Chromium. When the
issue asks you to migrate or verify content from a public website (for
example xeniapolis.de), read it from the live source instead of asking for it
to be provided:

- Static pages and binary assets (images, PDFs): `timeout 30 curl -fsSL <url>`.
  Save downloaded assets into the repo where the issue says they belong.
- Pages that need rendering: load the repo's pinned Playwright from
  `node_modules/.pnpm/playwright-core@*/node_modules/playwright-core` (a bare
  `require('playwright-core')` does not resolve — it is not a direct
  dependency) and call `chromium.launch()`. The matching browser is
  preinstalled, so never run `playwright install`.
- If the issue or the epic notes name a checked-in URL index, start from it
  rather than re-crawling.
- Bound every fetch with `timeout`, and fetch each URL once: save what you
  need to disk and work from the saved copy. The source site is not under our
  control and may change or be slow.

## Rules

- Do not run `git push`, `git branch`, `git checkout`, or any `gh` command.
  Do not open, comment on, or close the issue or any pull request. `git
commit` is expected (see "How to work" above), but nothing that leaves
  this container or touches GitHub — the host handles the PR and everything
  GitHub-facing after this run completes. You have no GitHub credentials in
  this container regardless.
- Do not leave commented-out code or TODO comments in what you write.
- If you get blocked (missing context, a failing test you can't fix, an
  external dependency you don't have, or `/implement`'s review turning up
  something you can't resolve), stop and report it as a blocker rather than
  committing a broken or incomplete change.
- Wrap any command that touches the network (registry lookups via
  `npm view`/`pnpm view`, external fetches, etc.) in `timeout <seconds>`.
  An unbounded hang produces no output and silently burns the sandbox's
  idle-timeout budget until the whole run is killed with no partial
  credit — a `timeout`-wrapped command fails fast and visibly instead.
- The sandbox already ran `CI=true pnpm install --frozen-lockfile` before
  you started. Do not run `pnpm install` again to "check" the tree, and do
  not `curl` a registry. Adding a dependency to an existing package, or
  adding a new workspace package, works offline only when every dependency
  is already resolved in `pnpm-lock.yaml`. Then: add the package's importer
  block to `pnpm-lock.yaml` by copying the `specifier` and `version` lines
  from the importer of a package that already uses that dependency, and run
  `timeout 120 pnpm install --offline --filter <package-name>` once. Commit
  the lockfile change. If a dependency is not in the lockfile yet, or that
  command fails, stop and report it as a blocker. Do not retry with other
  `pnpm install` flags.
- A fresh, independent agent reviews your completed work in a follow-up
  pass with no memory of this session. Leave the tree in a state that
  review can make sense of on its own — a clear commit message covering
  _why_, not just _what_ — rather than relying on this session's own
  `/code-review` step being the only check that runs.

## Reporting the result

When you are done (or blocked), end your final message with a `<result>`
tag containing a single JSON object, and nothing else inside the tag:

```
<result>{"success": true, "summary": "...", "blockers": null, "notes": "..."}</result>
```

- `success` — `true` only if every acceptance criterion in the issue body is
  met and has evidence in `summary`, `/implement`'s review step is clean, and
  the work is committed. Evidence is the name of the test that covers the
  criterion or the `file:line` that implements it. A criterion that is
  itself a command (`pnpm check` passes) is evidenced by that exact command
  and its exit status. A criterion you cannot cite evidence for means
  `success: false`, with that criterion named in `blockers`. `false`
  otherwise.
- `summary` — a few sentences on what you changed (or attempted), then one
  line per acceptance criterion: the criterion, then its evidence.
- `blockers` — `null` on success; otherwise a short description of what's
  blocking completion, so a human knows what to look at next.
- `notes` — what the next sub-issue of this epic would otherwise have to
  rediscover, at most ten lines of pointers: files and seams you touched, the
  command that verified the work, a gotcha the issue body didn't mention, a
  decision a later sub-issue must respect. Leave out what the diff or the
  issue already says. `null` if there is nothing worth passing on.
