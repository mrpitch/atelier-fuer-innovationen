# Sandcastle session efficiency rules

Derived from post-mortem analysis of feat-33 through feat-37 sessions.
Apply these for the duration of every sandcastle run.

## 1. Context hygiene

**Never read your own log file.**
`.sandcastle/logs/*.log` is your prior tool output re-serialized. Reading it doubles tokens already paid.

**Never cat a file without confirming it is small.**
Use `wc -l` or `head` first. Reserve full `cat` for files under ~50 lines. Applies to package.json, tsconfig.json, pnpm-lock.yaml, and all compiled JS/CSS.

**Never read compiled `.js` dist files for API information.**
Read `.d.ts` declarations instead. If you must trace runtime behavior, use `grep -n "pattern"`, not `cat`.

**Never dump the full HTML DOM into context.**
Pipe `curl` output through `grep` inline in the same command:
```bash
curl -s http://localhost:PORT/path | grep -o 'role="[^"]*"' | sort -u
```
Never save raw HTML to a file and then read it.

**Always run `git diff --stat` before `git diff`.**
If the diffstat shows >200 lines changed, scope to the files you need:
`git diff FIXED_POINT -- path/to/file`

**Never poll a background task's output file.**
The harness notifies you on completion. Do not `tail`, `cat`, or `wc` a task's `.output` path — it dumps raw JSONL transcript back into context.

**Never `cat` or `tail` a running server log.**
Use `grep -q "Ready" /tmp/nextdev.log && echo "ready"` for liveness checks.
Use `grep -i "error\|warn" /tmp/nextdev.log` for problem diagnosis.

## 2. Command efficiency

**Collapse session-start orientation into one compound command.**
```bash
git status && git log --oneline -5 && cat .sandcastle/repair-context-*.md 2>/dev/null
```
Do not issue each as a separate tool call.

**Use installed package facts, not registry calls.**
`cat node_modules/pkg/package.json | grep '"version"'` is instant and offline.
`pnpm view` is a network call returning large JSON — avoid once the package is installed.

**Combine tsc and eslint into one call. Always scope eslint to source.**
```bash
timeout 120 pnpm exec tsc --noEmit && timeout 120 pnpm exec eslint 'src/**/*.{ts,tsx}'; echo "EXIT=$?"
```
Running `eslint .` without scoping picks up `.sandcastle/container-cache` and returns hundreds of false-positive errors.

**Extract JSON fields with `grep`, not full JSON dumps.**
`grep -A3 '"./components"' node_modules/pkg/package.json` over
`node -e "console.log(JSON.stringify(require('./node_modules/pkg/package.json').exports))"`.

**Always filter `ps aux` immediately.**
`ps aux | grep target-process | grep -v grep` — never unfiltered `ps aux`.

**Never `pnpm add` the same package twice without diagnosing the block.**
If `pnpm add pkg` is permission-blocked, edit `package.json` directly and run the allowlisted `pnpm install` instead.

**Wrap all network-touching commands in `timeout <seconds>`.**
`pnpm view`, external fetches, registry lookups. An unbounded hang silently burns the sandbox idle-timeout budget.

## 3. Verification strategy

**Never re-run a check that already passed without an intervening code change.**
If `tsc --noEmit` just returned exit 0, do not run it again before your next edit.

**Document the OOM once; never reproduce it.**
`pnpm build` OOM-kills at the 1.9GB sandbox ceiling — documented in commit `dd40d3b`.
Do not: re-run to confirm, run with `NODE_OPTIONS`, or `git stash/pop/install` to "verify pre-existing."
Reference the prior documentation. One build run per feature session is the maximum.

**After a mid-session build attempt, clear `.next` before the next `tsc --noEmit`.**
`rm -rf .next` — even an OOM-killed build contaminates TypeScript's incremental cache.

**If `pnpm exec tsc` prints "Already up to date," fall back once to the binary directly.**
`./node_modules/.bin/tsc --noEmit` — but only once; do not alternate between both forms.

## 4. Sub-agent / multi-agent coordination

**Do not duplicate sub-agent work in the parent.**
Once you spawn review agents, stop reading the diff yourself. Wait for their reports.

**Capture the diff once; share the file path.**
```bash
git diff FIXED_POINT > /tmp/review.diff
wc -l /tmp/review.diff
```
Pass the path to sub-agents. Do not have each agent independently run `git diff`.

**Feed sub-agents only what they need.**
Do not `cat AGENTS.md && cat CLAUDE.md` as boilerplate for every sub-agent invocation. Pass only the files relevant to the sub-agent's specific task.

**After spawning background agents, do not poll.**
Never run `Bash(true)`, `Bash(echo waiting)`, `Bash(sleep N)`, or contrived `until` loops as heartbeats. The harness notification arrives without prompting.

**When a sub-agent uses the wrong worktree, fix the invocation — do not re-feed large files.**
Diagnose the root cause (wrong working directory), correct the sub-agent prompt, and relaunch. Re-sending the same large config files to the retry costs as much as the failed run.

## 5. Dev server / build tooling

**Prefer `playwright-mcp` over curl for verifying that a page renders correctly.**
Default to `browser_navigate` (`file://` paths work directly, no base64 data URL) + `browser_snapshot`; screenshot only for a hitl run or a visual regression. Fall back to curl only if the page itself is unreachable — not just because the MCP tools needed extra steps to reach it.

**Start the dev server non-blocking with a readiness poll.**
```bash
nohup pnpm exec next dev -p PORT > /tmp/nextdev.log 2>&1 &
disown
for i in $(seq 1 30); do
  grep -q "Ready" /tmp/nextdev.log && echo "ready after ${i}s" && break
  sleep 1
done
```
Never run `next dev` as a foreground `timeout N` command — the server dies when the timeout fires.

**Issue all smoke-test curl calls in one batch immediately after "Ready" is confirmed.**
Extract only status codes and targeted attributes inline, then kill the server:
`pkill -f "next dev"`

**Never bump port numbers to work around a dead server.**
Diagnose the crash first: `grep -i "error\|kill\|oom" /tmp/nextdev.log`.
Bumping to 3418, 3419, etc. creates orphaned processes, splits logs, and obscures the failure.

**Prefer `next start` over `next dev` for smoke tests.**
`next dev` triggers JIT compilation on every page hit and fails under memory pressure.
If the goal is verifying HTTP status codes and static markup, `next start` is more stable.
If the build OOM-kills (see R14), `next dev` is the fallback — plan for its instability.

## 6. Review-specific rules

**Review agents must not run `pnpm build`.**
The implement agent's commit message documents the build result.
Verify correctness via `tsc --noEmit`, targeted source inspection, and diff analysis only.

**Review agents must not re-fetch the full diff multiple times.**
Run `git diff FIXED_POINT > /tmp/review.diff` once at the start.
Reference `/tmp/review.diff` for all subsequent analysis; do not run `git diff` again.

**Do not manufacture blocking findings for judgement calls.**
If the implementer made a reasonable choice that you would have done differently, note it at most as a nit. Reserve `issues_found` for actual defects.
