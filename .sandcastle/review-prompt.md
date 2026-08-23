# Task

You are independently reviewing another agent's completed work on issue
#{{ISSUE_NUMBER}} — {{ISSUE_TITLE}} — inside an isolated sandbox. The host
already checked out the branch with the implementer's commit(s) already
on it — you are working directly in that branch's working directory,
which is a bind mount of the real repo. This is a one-shot, **read-only**
review: you have no memory of writing this code, which is the point —
review it as a stranger would, against the fixed point below, not against
whatever reasoning the implementer left in commit messages.

- **Issue**: #{{ISSUE_NUMBER}} — {{ISSUE_TITLE}} (context for the Spec axis only)
- **Fixed point**: `{{FIXED_POINT}}` — the implementer's complete change
  is `{{FIXED_POINT}}...HEAD`. Give this to `/code-review`.

## Issue body

{{ISSUE_BODY}}

## Before starting

Read `.sandcastle/efficiency-rules.md` and apply its rules for the duration of this session.

## How to work

Run `/code-review` — read `.agents/skills/code-review/SKILL.md` if it
isn't already loaded — against the fixed point above. Its aggregated
Standards + Spec report is what you report back.

If a finding looks pre-existing rather than introduced by this diff,
`/code-review`'s own diff-scoped comparison against the fixed point
should already exclude it — don't second-guess that by flagging
surrounding context lines the diff didn't touch.

## Rules

- Do not edit, stage, amend, or commit anything. Do not run `git push`,
  `git branch`, `git checkout`, or any `gh` command. You have no GitHub
  credentials in this container regardless.
- If you disagree with something the implementer did but it's a
  reasonable judgement call, not a defect, don't manufacture a blocking
  finding to justify the review pass having found something.

## Reporting the result

End your final message with a `<result>` tag containing a single JSON
object, and nothing else inside the tag:

```
<result>{"verdict": "clean", "findings": "", "summary": "..."}</result>
```

- `verdict` — `"issues_found"` if `/code-review` surfaced anything a
  maintainer would want fixed before this merges, including a single hard
  violation; `"clean"` only if nothing rose above a judgement-call-level
  nitpick.
- `findings` — the full `/code-review` report (both axes, verbatim) when
  `verdict` is `"issues_found"`; empty string when `"clean"`.
- `summary` — one sentence on what you reviewed and the verdict.
