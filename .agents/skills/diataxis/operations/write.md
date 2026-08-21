# Write Operation

**When**: User wants to author a new piece of documentation following Diataxis principles.

## Purpose

Guide the user through writing a single document of the correct type, using the appropriate template, and validate it against type-specific guidelines. Adapt all examples and commands to the project stack — see `docs/agents/diataxis-context.md`.

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

If no type was provided, infer from the user's request. If still ambiguous, ask:

> What type of documentation are you writing?
>
> 1. **Tutorial** — teach a beginner through hands-on steps
> 2. **How-to guide** — solve one specific task for a practitioner
> 3. **Reference** — describe an API, config, or component factually
> 4. **Explanation** — discuss why a thing exists, the design or rationale
> 5. **Glossary** — add or update a domain term definition

### Step 2: Gather Minimal Context

Ask only what's needed to start. Don't interrogate.

| Type        | Ask                                                                                 |
| ----------- | ----------------------------------------------------------------------------------- |
| Tutorial    | What will the reader build? Which package(s) does it touch? Roughly how long?       |
| How-to      | What single task does this solve? Who is the audience (FE dev, BE dev, ops, SRE)?   |
| Reference   | Which code unit (Lambda handler, CDK construct, hook, slice, config)? Read it now?  |
| Explanation | Which question / decision does this answer? Is there a change proposal or ADR to link to? |
| Glossary    | Which term? What's the resolved definition? Any synonyms to list under `_Avoid_`?   |

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

### Step 3b: Check for overlap (`docs-frontmatter`)

Call `docs-frontmatter` on the target docs root. Inspect every entry's `name`, `description`, `tags`, and `kind` for topic overlap:

- If an existing doc already covers the topic and is `status: current`, **extend it** instead of creating a duplicate. Update `last_reviewed` after editing.
- If an existing doc is `deprecated` and the user wants a replacement, set the new doc's frontmatter to `authoritative: true` and link the new doc from the deprecated one.
- Only create a new file when no candidate matches.
- **Glossary**: check whether `docs/reference/glossary.md` exists first. If it does, always extend it — the "no candidate matches" case can never apply to a glossary entry once the file exists.

### Step 4: Generate Filename

- kebab-case
- Type prefix only when it disambiguates (e.g. `how-to-deploy-to-dev.md`)
- Tutorials: descriptive of deliverable (`first-feature-flag.md`)
- Reference: name the entity (`cdk-constructs.md`, `pseudo-error-codes.md`)
- Explanation: name the topic or question (`why-zustand.md`, `multi-environment-strategy.md`)
- Glossary: always `glossary.md` — never per-term (see Step 3)

### Step 5: Apply Template

Read [../references/templates.md](../references/templates.md) and use the matching template. Tailor to the project's actual stack from `docs/agents/diataxis-context.md`:

- Use the project language (TypeScript or JavaScript) in code samples
- Use the project's package manager command in all shell commands
- Use real packages from the project — do not invent package names
- Use the project's test runner when mentioning tests
- Use the project's logging convention (see `docs/agents/diataxis-context.md`) in code examples

#### Required frontmatter (every doc)

Every generated file MUST start with the frontmatter block defined in [`../SKILL.md`](../SKILL.md#frontmatter-contract-every-doc-this-skill-writes). Set `kind` to the chosen Diataxis quadrant (`tutorial | how-to | reference | explanation`). See the skill for the full schema, the `onboarding | adr | api | runbook` extensions, and the concept/ADR conventions.

**Glossary**: use the Glossary Template in [`../references/templates.md`](../references/templates.md#reference-template--glossary) directly — append a new `**Term**` entry (or edit an existing one) rather than regenerating the file.

#### Type-specific micro-templates

````markdown
# [What You'll Build]

Learn how to [outcome] by building [concrete deliverable].

**Time:** ~[X] minutes
**Audience:** New contributor

## What You'll Learn

- [Skill 1]
- [Skill 2]

## Prerequisites

- Repo cloned and `<setup command from docs/agents/diataxis-context.md>` run
- [Any other specific prerequisites]

## Step 1: …

> One-sentence reason this step exists.

```bash
pnpm …
```
````

You should see:

```
…
```

## Step 2: …

…

## What You've Built

[Recap]

## Next Steps

- [Link to a how-to]
- [Link to reference]
- [Link to explanation]

````

**How-to skeleton:**

```markdown
# How to [Task]

[One-sentence goal — when you'd reach for this guide.]

## Prerequisites

- [Pre-condition 1]
- [Pre-condition 2]

## Steps

### 1. [Action verb phrase]

```bash
pnpm …
````

### 2. [Action verb phrase]

```ts
// short, real snippet
```

## Verify It Worked

```bash
<test command from docs/agents/diataxis-context.md>
```

Expected:

```
…
```

## Troubleshooting

### `<error message>`

**Cause:** …
**Fix:** …

## See Also

- [Related how-to](./other.md)
- [Reference](../reference/<x>.md)
- [Explanation: Why …](../explanation/<x>.md)

````

**Reference skeleton (API / construct / hook):**

```markdown
# `<Name>`

[One-line description.]

## Synopsis

```ts
function name(arg: Type): ReturnType
// or
class ConstructName extends Construct
// or
const useThing = (opts: Options) => Result
````

## Description

[Two or three sentences of factual description. No instructions.]

## Parameters / Props

| Name  | Type     | Required | Default | Description |
| ----- | -------- | -------- | ------- | ----------- |
| `foo` | `string` | Yes      | —       | …           |

## Returns

**Type:** `ReturnType`

[Description.]

## Examples

```ts
// minimal example
```

## Errors

| Error             | Condition | Resolution |
| ----------------- | --------- | ---------- |
| `ValidationError` | …         | …          |

## See Also

- [How to use `<Name>`](../how-to/<x>.md)
- [Why `<Name>` exists](../explanation/<x>.md)

````

**Reference skeleton (config):**

```markdown
# `<file>` Reference

[What this configures.]

## Location

````

<relative/path>

````

## Options

### `option_name`

**Type:** `string`
**Default:** `"…"`
**Required:** No

[What it controls.]

**Example:**

```yaml
option_name: value
````

## Environment Variables

| Variable                | Overrides     | Description |
| ----------------------- | ------------- | ----------- |
| `<PREFIX>_OPTION_NAME`  | `option_name` | …           |

## See Also

- [How to configure …](../how-to/<x>.md)

````

**Explanation skeleton:**

```markdown
# [Topic / Question]

[Opening sentence that frames the question being answered.]

## Background

[Where this came from, when, by whom (link OpenSpec change if any).]

## [Core Concept]

[The "why."]

### [Aspect]

…

## How It Works (high-level)

[Mermaid diagram or short prose. Implementation belongs elsewhere.]

```mermaid
flowchart LR
  A --> B
````

## Alternatives Considered

| Option | Why not |
| ------ | ------- |
| …      | …       |

## Trade-offs

| Aspect  | Pros | Cons |
| ------- | ---- | ---- |
| Current | …    | …    |

## Implications

[What this means for contributors, ops, security.]

## Further Reading

- [Change proposal / ADR](../../<change-proposals>/…) _(if applicable)_
- [Tutorial](../tutorials/…)
- [Reference](../reference/…)

````

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

Also check repo-wide rules:

- All code blocks have language hints
- Internal links are relative
- No hardcoded secrets in examples (use `process.env.X` or `<placeholder>`)
- Logging convention followed (check `docs/agents/diataxis-context.md` — use project logger if one is defined)
- Package manager and build commands match `docs/agents/diataxis-context.md`

### Step 7: Format & Lint

Run the format command from `docs/agents/diataxis-context.md`:

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

## Interactive Mode

If the user pastes raw notes ("here's what I know about feature flags, write something"):

1. Decide the most useful type given the content (often Reference + a separate Explanation).
2. Propose splitting if mixed.
3. Generate one doc at a time; do not concatenate types into a single file.
