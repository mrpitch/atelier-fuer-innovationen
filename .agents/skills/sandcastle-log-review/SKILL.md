---
name: sandcastle-log-review
description: "Analyse sandcastle session logs to identify token-heavy patterns, then refine .sandcastle/efficiency-rules.md with any new findings. Human-invoked only — not for autonomous agents."
disable-model-invocation: true
---

Analyse one or more sandcastle session logs, cross-reference findings against the existing efficiency rules, and propose refinements. This is a human-in-the-loop skill: every proposed change to `.sandcastle/efficiency-rules.md` is shown to the user for approval before writing.

## Input

The user may pass:
- A specific log file path
- A directory path (defaults to `.sandcastle/logs/`)
- Nothing (defaults to `.sandcastle/logs/`)

If a directory is given, analyse all `.log` files in it.

## Process

### 1. Inventory the logs

```bash
ls -lh .sandcastle/logs/*.log
```

List files with sizes. If the user passed a specific file, confirm it exists. Note the total size — files over ~80KB should be split across parallel sub-agents (one sub-agent per ~80KB of log content).

### 2. Load the current rules

Read `.sandcastle/efficiency-rules.md` in full. This is the baseline — every finding you surface will either be covered by an existing rule (a recurrence) or a gap (a new rule candidate).

### 3. Analyse the logs in parallel sub-agents

Spawn one sub-agent per log file (or per ~80KB chunk of a very large file). Keep them parallel — do not wait for one before launching the next.

**Sub-agent prompt template:**

> Read the log file at `<path>`. It is a sandcastle session transcript: each line is either a tool call (Bash, Read, Edit, etc.) or a narration line from the agent. Your job is to find every pattern that wastes tokens or tool-call budget.
>
> Look for:
> - Commands that return large output and dump it entirely into the LLM context (full HTML from curl, full git diffs without --stat, cat of large files, full server logs, full JSON dumps, full compiled JS)
> - The same or near-identical command run 2+ times without an intervening code change
> - No-op tool calls used as heartbeats (echo hello, sleep N, Bash(true), contrived until loops)
> - The agent reading its own log file
> - pnpm build run to confirm a pre-existing OOM
> - eslint or tsc run more times than necessary
> - Polling a background task's .output file instead of waiting for the harness notification
> - Full ps aux output captured without immediate filtering
> - Sub-agent work duplicated in the parent
> - Sub-agents fed large config files (AGENTS.md, CLAUDE.md) as boilerplate
> - Port-bumping to work around a dead server instead of diagnosing the crash
> - pnpm add retried multiple times after a permission block
>
> For each finding: note the line number(s), quote the command, name the pattern, estimate waste as low/medium/high.
> Report as a plain bullet list. Be terse — one bullet per finding, under 80 chars each.

### 4. Aggregate findings

Collect all sub-agent reports. Deduplicate: if the same pattern appears in multiple logs, note how many times it recurred (recurrence count matters — it signals which rules are least effective or missing entirely).

Group findings into two buckets:

**A. Already covered by an existing rule** — note the rule ID and how many times it was violated. A high recurrence against an existing rule suggests the rule is worded poorly or buried — flag it for rewording/elevation.

**B. Not covered** — new pattern candidates. These become new rule proposals.

### 5. Propose rule changes

For each gap (bucket B) and each poorly-adhered-to rule (bucket A, high recurrence), draft a proposed change:

- **New rule**: write it in the same imperative style as the existing rules. Assign it to the most fitting category section. Include a concrete command example where relevant.
- **Reword/elevate existing rule**: show the before/after diff of the rule text. If recurrence suggests the rule belongs in a more prominent position (e.g. moved to a "critical" block at the top), say so.

Present all proposals to the user as a numbered list — one proposal per item, with a short rationale. Do **not** write to `.sandcastle/efficiency-rules.md` yet.

### 6. Confirm and apply

Ask the user: "Apply all N proposals? Or select which ones to apply (list the numbers)."

Wait for the user's response. Apply only the approved proposals. After writing, show a `git diff .sandcastle/efficiency-rules.md` for final confirmation before the user commits.

## Output contract

- Do not commit anything — leave that to the user.
- Do not modify any file other than `.sandcastle/efficiency-rules.md`.
- Do not add findings that are already covered by an existing rule unless the rule is demonstrably ineffective (high recurrence in recent logs).
- If no gaps and no high-recurrence violations are found, report that explicitly: "No new patterns found. Existing rules appear to be covering the sessions analysed."
