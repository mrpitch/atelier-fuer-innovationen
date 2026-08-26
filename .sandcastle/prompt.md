# Task

You are implementing a single GitHub issue in an isolated sandbox. The host
already created and checked out the target branch — you are working directly
in that branch's working directory, which is a bind mount of the real repo,
not a copy: a commit you make here lands in the actual repo. This is a
one-shot run: there is no issue tracker to poll and no next issue to pick up
afterwards.

- **Issue**: #{{ISSUE_NUMBER}} — {{ISSUE_TITLE}}
- **Branch**: `{{TARGET_BRANCH}}` (already checked out — do not create or switch branches)
- **Fixed point**: `{{FIXED_POINT}}` — the branch this work is based on. Give
  this to `/implement`'s review step. Your changes are still uncommitted at
  that point, so it's a work-in-progress review: the diff is against this
  fixed point, not a merge-base to `HEAD`.
- **Check command**: `pnpm exec tsc --noEmit && pnpm exec eslint .` — use this
  for `/implement`'s typecheck/test verification, on top of whatever
  `AGENTS.md`/`CLAUDE.md` also documents.

## Issue body

{{ISSUE_BODY}}

## Efficiency rules

Apply these for the duration of this session. Templated in host-side from
trunk — not read from this branch's own working tree, so they reach you
even if this branch's copy of the file is stale, edited, or missing:

{{EFFICIENCY_RULES}}

## How to work

Run `/implement` on this issue — read `.agents/skills/implement/SKILL.md` if
it isn't already loaded, and follow it as-is: explore, plan, tdd, verify,
review (against the fixed point above), commit. Don't skip its review step
or its commit step; both are expected to happen inside this sandbox now.

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
- A fresh, independent agent reviews your completed work in a follow-up
  pass with no memory of this session. Leave the tree in a state that
  review can make sense of on its own — a clear commit message covering
  *why*, not just *what* — rather than relying on this session's own
  `/code-review` step being the only check that runs.

## Reporting the result

When you are done (or blocked), end your final message with a `<result>`
tag containing a single JSON object, and nothing else inside the tag:

```
<result>{"success": true, "summary": "...", "blockers": null}</result>
```

- `success` — `true` only if the issue is fully implemented, `/implement`'s
  review step is clean, and the work is committed. `false` otherwise.
- `summary` — a few sentences on what you changed (or attempted).
- `blockers` — `null` on success; otherwise a short description of what's
  blocking completion, so a human knows what to look at next.
