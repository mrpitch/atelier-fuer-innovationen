This repo's agent skill configuration, imported here so every agent — parent
or sub-agent — has it in context automatically, without a separate read:

@AGENTS.md

## Sandcastle session invariants

These apply to every agent working in this repo, parent or sub-agent. They
are judgement calls, not mechanical rules — the long-form rationale and the
mechanical rules live in `.sandcastle/efficiency-rules.md`; read that file
directly if you need the detail behind any of these.

- **Don't duplicate a sub-agent's work.** Once you've delegated a task to a
  sub-agent, wait for its report instead of independently re-doing the same
  analysis yourself.
- **Scope what you hand a sub-agent to what it actually needs.** Don't pass
  full instruction files or unrelated context as boilerplate — pass the
  specific files or facts its task depends on.
- **Trust prior documented investigation.** If a failure or result is
  already diagnosed and written down (in this session or a past commit),
  reference that instead of reproducing it "to be sure" — recognizing that a
  new symptom matches an old, already-understood one is a judgement call.
- **Fix the setup, not the symptom.** If a sub-agent failed because of how
  it was invoked (wrong directory, wrong worktree, missing context), correct
  the invocation and retry — don't compensate by re-sending more data.
- **In review, a defect blocks; a difference of judgement doesn't.** Only
  raise something as blocking if it's actually wrong, not because you'd have
  made a different reasonable choice.
