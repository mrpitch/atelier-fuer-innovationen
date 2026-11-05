# Sandcastle session efficiency rules

Apply these for the duration of every sandcastle run.

## 1. Sub-agent / multi-agent coordination

**After spawning the review agents, wait for their reports, then verify every finding.**
Check each finding against the file and line it cites, and drop any finding the code contradicts. Report only what survives that check.

**Capture the diff once; share the file path.**
```bash
git diff FIXED_POINT > /tmp/review.diff
wc -l /tmp/review.diff
```
Pass the path to sub-agents. Do not have each agent independently run `git diff`.

**Feed sub-agents only what they need.**
Do not `cat AGENTS.md && cat CLAUDE.md` as boilerplate for every sub-agent invocation. Pass only the files relevant to the sub-agent's specific task.

## 2. Dev server / build tooling

**`playwright-mcp` is bundled inside this container — always prefer it over curl.**
Use `browser_navigate` + `browser_snapshot` as the routine render check — it reflects the actual rendered page, not pre-JS HTML. Use `browser_take_screenshot` only when verifying a visual regression that a semantic snapshot wouldn't surface.

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

**Never bump port numbers to work around a dead server.**
Diagnose the crash first: `grep -i "error\|kill\|oom" /tmp/devserver.log`.

**If the framework offers a production/start mode alongside its dev mode, prefer it for smoke tests.**
Dev mode's hot-reload behavior is typically less stable under memory pressure.

## 3. Review-specific rules

**Review agents must not run the project's full build.**
The implement agent's commit message documents the build result. Verify correctness via a typecheck, targeted source inspection, and diff analysis only.

**Review agents must not re-fetch the full diff multiple times.**
Run `git diff FIXED_POINT > /tmp/review.diff` once at the start. Reference `/tmp/review.diff` for all subsequent analysis.

**Do not manufacture blocking findings for judgement calls.**
If the implementer made a reasonable choice you would have done differently, note it at most as a nit. Reserve `issues_found` for actual defects.
