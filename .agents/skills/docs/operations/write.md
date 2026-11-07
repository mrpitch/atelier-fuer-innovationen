# Write Operation

**When**: User wants to author a new piece of documentation following Diataxis principles.

## Purpose

Guide the user through writing a single document of the correct type, using the appropriate template, and validate it against type-specific guidelines. Adapt all examples and commands to the project stack — see `docs/agents/docs-context.md`.

## Execution

### Step 1: Determine Document Type

Map arguments to type:

| Argument                               | Type                  |
| --------------------------------------- | --------------------- |
| `tutorial`                             | Tutorial              |
| `how-to`, `howto`, `guide`             | How-to                |
| `reference`, `ref`, `api`              | Reference             |
| `explanation`, `explain`, `concept`    | Explanation           |
| `glossary`, `terms`, `domain-language` | Reference (Glossary)  |
| `adr`, `decision`                      | ADR                   |

If no type was provided, infer from the user's request. If still ambiguous, ask:

> What type of documentation are you writing?
>
> 1. **Tutorial** — teach a beginner through hands-on steps
> 2. **How-to guide** — solve one specific task for a practitioner
> 3. **Reference** — describe an API, config, or component factually
> 4. **Explanation** — discuss why a thing exists, the design or rationale
> 5. **Glossary** — add or update a domain term definition
> 6. **ADR** — record a decision that is hard to reverse, surprising without context, and a real trade-off

### Step 2: Gather Minimal Context

Ask only what's needed to start. Don't interrogate.

| Type        | Ask                                                                                 |
| ----------- | ----------------------------------------------------------------------------------- |
| Tutorial    | What will the reader build? Which package(s) does it touch? Roughly how long?       |
| How-to      | What single task does this solve? Who is the audience (FE dev, BE dev, ops, SRE)?   |
| Reference   | Which code unit (Lambda handler, CDK construct, hook, slice, config)? Read it now?  |
| Explanation | Which question / decision does this answer? Is there a change proposal or ADR to link to? |
| Glossary    | Which term? What's the resolved definition? Any synonyms to list under `_Avoid_`?   |
| ADR         | What was decided? What problem forced it? Which alternatives were rejected? What follows from it? |

### Step 3: Determine Target Location

Decide path:

| Scope                     | Path                          |
| ------------------------- | ----------------------------- |
| Cross-cutting / repo-wide | `docs/<type>/`                |
| Frontend-only             | `apps/frontend/docs/<type>/`  |
| Backend-only              | `apps/backend/docs/<type>/`   |
| Specific lib              | `libs/<lib>/docs/<type>/`     |
| Specific service          | `services/<svc>/docs/<type>/` |

If the chosen target lacks a Diataxis structure, run `scaffold` first (or warn and create the single subdirectory).

**Glossary is a singleton, not a per-topic file.** It always lives at `docs/reference/glossary.md`, regardless of scope — skip the scope table above. Never create a second glossary file, even for a frontend/backend/lib-specific term; add it as a new entry (grouped under a subheading if helpful) in the one file.

**ADR location is fixed, not a scope choice.** When `docs/architecture/` exists, stop here and follow [`docs arch adr`](./architecture/adr.md); it owns the MADR 4 files in `docs/architecture/09-decisions/`. Otherwise write `docs/adr/adr-NNNN-<slug>.md`, numbered one above the highest existing number in `docs/adr/` (`0001` for the first), creating `docs/adr/` when missing. Skip the scope table.

### Step 3b: Check for overlap (`docs find`)

Run [`docs find`](./find.md) on the target docs root. Inspect every entry's `title`, `description`, `tags`, and `type` for topic overlap:

- If an existing doc already covers the topic and is `status: stable`, **extend it** instead of creating a duplicate. Update `last_reviewed` after editing.
- If an existing doc is `deprecated` and the user wants a replacement, set the new doc's frontmatter to `authoritative: true` and link the new doc from the deprecated one.
- Only create a new file when no candidate matches.
- **Glossary**: check whether `docs/reference/glossary.md` exists first. If it does, always extend it — the "no candidate matches" case can never apply to a glossary entry once the file exists.
- **ADR**: never extend an accepted ADR. Change a decision by writing a new ADR and setting the old one to `status: superseded by ADR-NNNN`.

### Step 4: Generate Filename

- kebab-case
- Type prefix only when it disambiguates (e.g. `how-to-deploy-to-dev.md`)
- Tutorials: descriptive of deliverable (`first-feature-flag.md`)
- Reference: name the entity (`cdk-constructs.md`, `pseudo-error-codes.md`)
- Explanation: name the topic or question (`why-zustand.md`, `multi-environment-strategy.md`)
- Glossary: always `glossary.md` — never per-term (see Step 3)

### Step 5: Apply Template

Read [../references/templates.md](../references/templates.md) and use the matching template. Tailor to the project's actual stack from `docs/agents/docs-context.md`:

- Use the project language (TypeScript or JavaScript) in code samples
- Use the project's package manager command in all shell commands
- Use real packages from the project — do not invent package names
- Use the project's test runner when mentioning tests
- Use the project's logging convention (see `docs/agents/docs-context.md`) in code examples

#### Required frontmatter (every doc)

Every generated file MUST start with the frontmatter block defined in [`../SKILL.md`](../SKILL.md#frontmatter-contract). Set `type` to the chosen Diataxis quadrant (`tutorial | how-to | reference | explanation`) and set `status: stable`. For an ADR set `type: adr`, `status: proposed` (`accepted` once the user confirms) and `date`. The contract also covers the `runbook | onboarding | api` types and their placement rule.

**Glossary**: use the Glossary Template in [`../references/templates.md`](../references/templates.md#reference-template--glossary) directly — append a new `**Term**` entry (or edit an existing one) rather than regenerating the file.

**ADR**: use the ADR Template in [`../references/templates.md`](../references/templates.md#adr-template).

### Step 6: Validate

Apply the type checklist from [../references/framework.md](../references/framework.md). For each violation, warn and offer a fix:

| Type        | Check                                              | Warning                                                       |
| ----------- | -------------------------------------------------- | ------------------------------------------------------------- |
| Tutorial    | No "you can also" / "alternatively" branches       | Tutorials must guide one path; move alternatives to how-to    |
| Tutorial    | Each step has a command or code block              | A step with no concrete action is probably explanation        |
| How-to      | Single task scope (one "How to …" verb)            | Split if multiple tasks                                       |
| How-to      | No multi-paragraph concept blocks                  | Move concepts to `../explanation/`                            |
| Reference   | Tables for params, no imperative ("first do …")    | Move instructions to `../how-to/`                             |
| Reference   | Format matches sibling reference docs              | Align with neighbors                                          |
| Explanation | Question or claim is stated up front               | Add framing sentence                                          |
| Explanation | At least one concrete example or diagram           | Add a snippet, diagram, or named real-world case              |
| ADR         | Context, decision and consequences are all present | An ADR records *that* and *why*, not a design; add the missing part |

Also check repo-wide rules:

- All code blocks have language hints
- Internal links are relative
- No hardcoded secrets in examples (use `process.env.X` or `<placeholder>`)
- Logging convention followed (check `docs/agents/docs-context.md` — use project logger if one is defined)
- Package manager and build commands match `docs/agents/docs-context.md`

### Step 7: Format & Lint

Run the format command from `docs/agents/docs-context.md`:

```bash
<format command> <new-file>
```

If the doc is referenced from a markdown index, also re-format the index.

### Step 8: Report

```
Created: <path>

Type:        <type>
Location:    <path>
Validations: <N> passed, <M> warnings (listed above)

Suggested follow-ups:
  - Link from <docs-or-package>/README.md
  - Add cross-links: <list>
  - Consider companion docs: <e.g. how-to needs an explanation>
```

## Called by another skill

A skill that has already resolved the doc's type, topic, target folder and facts (for example `discover-standards` after its interview) hands them over in place of the user. Then:

- Skip Steps 1–2: type, topic and facts come from the caller. Confirmation with the user stays with the caller; ask nothing more before writing.
- Step 3: the caller may name a subfolder of `docs/<type>/` (for example `docs/reference/database/`).
- Steps 3b, 4, 7 and 8 run unchanged: overlap check, filename, format, report.
- Step 5: frontmatter comes from the [contract](../SKILL.md#frontmatter-contract) and is never overridden. The body takes the caller's shape when it supplies one, otherwise the template's.
- Step 6: run the repo-wide rules always; run the type checklist only on a template-shaped body.

## Interactive Mode

If the user pastes raw notes ("here's what I know about feature flags, write something"):

1. Decide the most useful type given the content (often Reference + a separate Explanation).
2. Propose splitting if mixed.
3. Generate one doc at a time; do not concatenate types into a single file.
