---
name: grill-with-docs
description: A relentless interview to sharpen a plan or design, which also creates docs (ADR's and glossary) as we go.
disable-model-invocation: true
---

Run a `/grilling` session. Check `docs/agents/domain.md` for the active domain-docs layout, then write live as decisions crystallise:

- **Flat `CONTEXT.md` / `docs/adr/`** (default — no `docs/agents/domain.md`, or it doesn't mention Diataxis) — use the `/domain-modeling` skill for the whole session: glossary terms and ADRs both go through it, exactly as before.
- **Diataxis** (`docs/agents/domain.md` names the Diataxis layout) — use the `/diataxis` skill instead: a resolved term is `diataxis write glossary <term>`, a resolved concept worth more than a definition is `diataxis write explanation <concept>`, and an ADR still needs all three of hard-to-reverse, surprising without context, and a real trade-off before it's offered — written to `docs/adr/` either way.
