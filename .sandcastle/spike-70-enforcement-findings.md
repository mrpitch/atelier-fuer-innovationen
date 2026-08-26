# Spike #70: harness enforcement-mechanism questions, settled empirically

Parent: #64. All three tests below were run live, in this session, inside
the same headless sandcastle sandbox the answers are meant to describe — not
inferred from documentation, and not run interactively. Test artifacts
(temporary `permissions.deny`/`allow` entries, `/tmp` scratch files) were
reverted/removed after each test; `git status` and `diff` against the
pre-test copies confirmed a clean restore.

## 1. Do background-task completion notifications arrive in a headless run?

**Answer: Yes.**

Test: from this same non-interactive sandcastle session, ran

```
Bash({ command: "sleep 25 && echo SPIKE_Q1_MARKER_notification_fired", run_in_background: true })
```

then continued with unrelated work (the deny-rule tests below) without
tailing, `cat`-ing, or otherwise checking the task's output file. ~25s later
a `<task-notification>` for that task ID arrived unprompted, reporting
`status=completed` and the exit code — no polling loop, no heartbeat, no
interactive session involved.

**Implication for the blocklist: keep the heartbeat/anti-polling entries.**
The agent does have a legal, working way to wait for background work while
headless; polling would be pure waste, not a rational workaround for a
missing signal. The premise behind those blocklist entries holds.

## 2. Do deny rules survive permission-bypass mode?

**Answer: Yes.**

This session runs with permissions bypassed: dozens of Bash invocations this
session (`mkdir -p ... && cp ...`, `find docs -maxdepth 3 ...`, `wc -l ...`,
`cat .sandcastle/image-config/settings.json`, `env | grep ...`, `diff ... &&
rm -rf ...`) start with a command word that matches no `Bash(<prefix>*)`
allow entry in either `.claude/settings.json` or `.claude/settings.local.json`
(whose allow list is `mkdir`/`cp`/`find`/`wc`/`cat`/`env`/`diff`/`rm`-free —
it covers things like `git *`, `grep *`, `pnpm *`, `node *`, `gh *`), and yet
all of them ran with no prompt. That's only possible if the ordinary
allow/ask path is being bypassed.

Test: added a temporary rule to the tracked `.claude/settings.json`:

```json
"permissions": { "deny": ["Bash(echo SPIKE_DENY_MARKER_70*)"] }
```

then ran `echo SPIKE_DENY_MARKER_70_test_value`. The call was rejected:

```
Permission to use Bash with command echo SPIKE_DENY_MARKER_70_test_value has been denied.
```

The edit took effect immediately, mid-session, with no restart — so
`permissions.deny` is read live and enforced as a hard block even when the
session's overall permission mode is bypass. (Rule removed afterward;
`.claude/settings.json` diffs clean against its committed content.)

**Caveat that changes what this buys us:** deny entries match by prefix
against the literal command string (`Bash(<prefix>*)`). The issue's own note
holds up under this test — a majority of recorded real-world commands in
this repo's session logs are compound (`a && b`, pipelines, `bash -c "..."`),
and a prefix rule only matches when the denied command *is* that prefix. It
does not see into the right-hand side of `&&`/`;`/`|`, or into a `-c`
argument.

**Answer to "deny rules or a shell guard": both, for different jobs.**
For an unambiguous, standalone command that's dangerous regardless of
context (e.g. a specific destructive CLI invocation issued as a full,
non-compound command), a deny rule is the safer instrument — declarative,
no shell process to fail open, no single point of failure in a wrapper
script. For catching a dangerous substring anywhere inside a compound or
chained command, a deny rule's prefix match is insufficient by construction;
that job still needs a shell-level guard that inspects the whole resolved
command string. Given most recorded commands are compound, the shell guard
remains necessary for coverage — deny rules should be layered in
additionally for the specific unambiguous single-command patterns where
they can be a strictly better (harder to bypass) instrument.

## 3. Can local settings remove a deny rule from tracked settings?

**Answer: No.**

Test: with the tracked deny rule from test 2 still in place, added a
contradicting `allow` entry for the exact same pattern to the untracked
`.claude/settings.local.json`:

```json
"permissions": { "allow": ["Bash(echo SPIKE_DENY_MARKER_70*)", "..."] }
```

Re-ran `echo SPIKE_DENY_MARKER_70_test_value`. Still denied, same message as
before. Permission arrays merge as a union across sources rather than one
source's list replacing another's, and deny takes precedence over allow
regardless of which settings file each rule came from — so an untracked
local file cannot silently cancel a tracked deny by re-allowing the same
pattern, and (by the same union logic) can't do it by omission either, since
omitting a rule in one source doesn't subtract it from the merged set.

Also confirmed directly (not just per the issue's framing): neither this
repo's own `.gitignore` nor `.git/info/exclude` mention
`.claude/settings.local.json` — `git check-ignore -v` on it returns nothing
in this sandbox. It's kept out of version control only via the *user's*
personal global `core.excludesFile`, which doesn't exist in this container.
So a fresh clone would track it as untracked-but-visible same as here, and
the bind mount carries it through regardless of ignore rules.

**Net effect: a tracked-settings deny strategy is not defeated by local
settings.** The worst a local file can do is add more restrictions, not
remove existing ones — the failure mode the issue worried about
(local settings silently neutralizing a tracked deny) does not reproduce.

## Cleanup

- `.claude/settings.json`: deny rule added then removed; diffs clean against
  the committed version.
- `.claude/settings.local.json`: allow entry added then removed; restored
  from a pre-test copy, diffed clean.
- `/tmp/spike70` scratch directory (pre-test backups): removed.
- No other files were touched for these tests.
