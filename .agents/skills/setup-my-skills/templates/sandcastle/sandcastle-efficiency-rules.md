# Sandcastle session efficiency rules

Apply these for the duration of every sandcastle run.

## 1. Context hygiene

**Never read your own log file.**
`.sandcastle/logs/*.log` is your prior tool output re-serialized. Reading it doubles tokens already paid.

**Never cat a file without confirming it is small.**
Use `wc -l` or `head` first. Reserve full `cat` for files under ~50 lines. Applies to package.json, tsconfig.json, lockfiles, and all compiled JS/CSS.

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
Use `grep -q "Ready" /tmp/devserver.log && echo "ready"` for liveness checks.
Use `grep -i "error\|warn" /tmp/devserver.log` for problem diagnosis.

## 2. Command efficiency

**Collapse session-start orientation into one compound command.**
```bash
git status && git log --oneline -5 && cat .sandcastle/repair-context-*.md 2>/dev/null
```
Do not issue each as a separate tool call.

**Use installed package facts, not registry calls.**
`cat node_modules/pkg/package.json | grep '"version"'` is instant and offline.
A package manager's `view`/`show`/`info` command is a network round trip — avoid it once the package is already installed.

**Combine your typecheck and lint checks into one call. Always scope lint to source.**
```bash
timeout 120 REPLACE_WITH_CHECK_COMMAND; echo "EXIT=$?"
```
Running lint unscoped can pick up `.sandcastle/container-cache` and other build artifacts, returning hundreds of false-positive errors.

**Extract JSON fields with `grep`, not full JSON dumps.**
`grep -A3 '"./components"' node_modules/pkg/package.json` over
`node -e "console.log(JSON.stringify(require('./node_modules/pkg/package.json').exports))"`.

**Always filter `ps aux` immediately.**
`ps aux | grep target-process | grep -v grep` — never unfiltered `ps aux`.

**Never repeat a blocked dependency-install command without diagnosing the block.**
If adding a dependency is permission-blocked, edit `package.json` directly and run the allowlisted install command instead.

**Wrap all network-touching commands in `timeout <seconds>`.**
Registry lookups, external fetches. An unbounded hang silently burns the sandbox idle-timeout budget.

## 3. Verification strategy

**Never re-run a check that already passed without an intervening code change.**
If a typecheck just returned exit 0, do not run it again before your next edit.

**Document an expensive, reproducible failure once; never reproduce it.**
If a build or test run fails for a documented, pre-existing reason (an environment ceiling, a known flaky suite), reference the earlier documentation rather than re-running it to "confirm." One run of an expensive check per session is the maximum unless code actually changed.

**After a mid-session build attempt, clear the build cache before the next typecheck.**
An interrupted or failed build can leave stale incremental-compilation state that contaminates the next check's results.

**If a tool reports "nothing to do" when you know code changed, fall back to invoking its binary directly once — but don't alternate between both forms.**

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
This scaffold wires `playwright-mcp` into every sandcastle run by default — `.mcp.json` connects it over CDP to a real Chrome `run-sandcastle.ts` launches on the host for this run, not a hypothetical "if available" tool. Confirm the `playwright` MCP tools are actually present before assuming so (a missing host Chrome install fails the run before the container even starts, rather than silently falling back). curl only ever sees pre-render HTML, never the post-JS DOM a real browser produces. Default to `browser_navigate` + `browser_snapshot` (its accessibility-tree snapshot) as the routine render check — it's structured, cheap, and reflects the actual rendered page. Use `browser_take_screenshot` for a hitl run, or when checking for a purely visual regression (layout, CSS, a broken image) that a semantic snapshot wouldn't surface. `chrome-devtools-mcp` is not wired into this scaffold — it's a documented follow-up for deep escalation (console exceptions, failed/4xx network requests, performance regressions) once this connection is proven, not something to reach for here. Fall back to the curl-based rules below only if the `playwright` MCP tools are genuinely unavailable this session.

**Start the dev server non-blocking with a readiness poll.**
```bash
nohup <dev-server-command> > /tmp/devserver.log 2>&1 &
disown
for i in $(seq 1 30); do
  grep -q "<ready-marker>" /tmp/devserver.log && echo "ready after ${i}s" && break
  sleep 1
done
```
Never run the dev server as a foreground `timeout N` command — the server dies when the timeout fires.

**Without a browser-automation MCP, issue all smoke-test curl calls in one batch immediately after readiness is confirmed.**
Extract only status codes and targeted attributes inline, then kill the server:
`pkill -f "<dev-server-process-name>"`

**Never bump port numbers to work around a dead server.**
Diagnose the crash first: `grep -i "error\|kill\|oom" /tmp/devserver.log`.
Bumping ports creates orphaned processes, splits logs, and obscures the failure.

**If the framework offers a production/start mode alongside its dev mode, prefer the production mode for smoke tests.**
Dev mode's JIT/hot-reload behavior is typically less stable under memory pressure. If only HTTP status codes and static markup need verifying, the production mode is more stable — fall back to dev mode only if a production build isn't feasible in the sandbox.

## 6. Review-specific rules

**Review agents must not run the project's full build.**
The implement agent's commit message documents the build result. Verify correctness via a typecheck, targeted source inspection, and diff analysis only.

**Review agents must not re-fetch the full diff multiple times.**
Run `git diff FIXED_POINT > /tmp/review.diff` once at the start.
Reference `/tmp/review.diff` for all subsequent analysis; do not run `git diff` again.

**Do not manufacture blocking findings for judgement calls.**
If the implementer made a reasonable choice you would have done differently, note it at most as a nit. Reserve `issues_found` for actual defects.
