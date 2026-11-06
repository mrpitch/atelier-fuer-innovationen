# Domain-docs reader patches

Upstream `mattpocock/skills` versions of these skills hardcode `CONTEXT.md` and `docs/adr/`. Each replacement below sends the skill to `docs/agents/domain.md`, the file step 4 writes, which names the layout in use (flat or Diataxis) and what to read. Without that file the replacement falls back to the flat paths, so flat-layout repos behave as before.

Apply the replacement text exactly. Every replacement contains the string `docs/agents/domain.md`: that is how Section F recognises a patched copy. Match the **Find** sentence verbatim; if upstream reworded it but a sentence of the same meaning is present, replace that sentence instead. If neither exists, leave the skill alone and report it.

## `tdd` — `SKILL.md`

Find:

```
When exploring the codebase, read `CONTEXT.md` (if it exists) so test names and interface vocabulary match the project's domain language, and respect ADRs in the area you're touching.
```

Replace with:

```
When exploring the codebase, read the project's domain docs as `docs/agents/domain.md` directs (without that file: `CONTEXT.md` and `docs/adr/`, if they exist) so test names and interface vocabulary match the project's domain language, and respect the ADRs in the area you're touching.
```

## `diagnosing-bugs` — `SKILL.md`

Find:

```
When exploring the codebase, read `CONTEXT.md` (if it exists) to get a clear mental model of the relevant modules, and check ADRs in the area you're touching.
```

Replace with:

```
When exploring the codebase, read the project's domain docs as `docs/agents/domain.md` directs (without that file: `CONTEXT.md` and `docs/adr/`, if they exist) to get a clear mental model of the relevant modules, and check ADRs in the area you're touching.
```

## `wait-what` — `SKILL.md`

Find:

```
and use the ubiquitous language from `CONTEXT.md`.
```

Replace with:

```
and use the ubiquitous language from the project's domain glossary (`docs/agents/domain.md` names it; `CONTEXT.md` without that file).
```

## `codebase-design` — `DESIGN-IT-TWICE.md`

Find:

```
Include both [SKILL.md](SKILL.md) vocabulary and CONTEXT.md vocabulary in the brief
```

Replace with:

```
Include both [SKILL.md](SKILL.md) vocabulary and the project's domain glossary vocabulary (`docs/agents/domain.md` names it; `CONTEXT.md` without that file) in the brief
```

Only `DESIGN-IT-TWICE.md` is patched. The "Glossary" in `SKILL.md` is the skill's own architecture vocabulary.

## `triage` — `SKILL.md`

Find:

```
sharpening domain terms and updating `CONTEXT.md`/ADRs inline as decisions land.
```

Replace with:

```
sharpening domain terms and updating the glossary and ADRs inline as decisions land (`/domain-modeling` writes them in the layout `docs/agents/domain.md` names).
```

## `improve-codebase-architecture` — `SKILL.md`

Five replacements. Find each sentence, replace it with the text after it.

1. Find: ``- The domain language in `CONTEXT.md` gives names to good seams; ADRs in `docs/adr/` record decisions this command should not re-litigate.``

   Replace with: ``- The domain language in the project's glossary gives names to good seams; ADRs record decisions this command should not re-litigate. `docs/agents/domain.md` names where both live: `CONTEXT.md` and `docs/adr/` in the flat layout, `docs/reference/glossary.md` and `docs/adr/` (or `docs/architecture/09-decisions/`) in the Diataxis layout.``

2. Find: ``Read the project's domain glossary (`CONTEXT.md`) and any ADRs in the area you're touching first.``

   Replace with: ``Read the project's domain glossary and any ADRs in the area you're touching first (locations per `docs/agents/domain.md`, see above).``

3. Find: ``**Use CONTEXT.md vocabulary for the domain, and the `/codebase-design` vocabulary for the architecture.** If `CONTEXT.md` defines "Order,"``

   Replace with: ``**Use the glossary's vocabulary for the domain, and the `/codebase-design` vocabulary for the architecture.** If the glossary defines "Order,"``

4. Find: ``- **Naming a deepened module after a concept not in `CONTEXT.md`?** Add the term to `CONTEXT.md`. Create the file lazily if it doesn't exist.``

   Replace with: ``- **Naming a deepened module after a concept not in the glossary?** Add the term to the glossary through `/domain-modeling`, which creates the file lazily if it doesn't exist.``

5. Find: ``- **Sharpening a fuzzy term during the conversation?** Update `CONTEXT.md` right there.``

   Replace with: ``- **Sharpening a fuzzy term during the conversation?** Update the glossary right there, through `/domain-modeling`.``

## Not patched

`domain-modeling` carries the layout logic itself (it decides where glossary terms and ADRs are written), so this skill set ships it as a fork through install step 2. A `domain-modeling` without `docs/agents/domain.md` in it means step 2 has not been run.
