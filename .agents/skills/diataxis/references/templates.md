# Documentation Templates

Ready-to-use templates for each Diataxis type. Adapt placeholders to the project's actual stack and commands — see `docs/agents/diataxis-context.md`.

> **Frontmatter:** every template begins with the repo frontmatter contract. The schema, field rules, allowed `kind` values, and the concept/ADR conventions are defined once in [`../SKILL.md`](../SKILL.md#frontmatter-contract-every-doc-this-skill-writes) — do not redefine them here. The blocks in each template are concrete examples; copy and fill in `<placeholders>`.

---

## Tutorial Template

````markdown
---
name: [What You'll Build]
description: Tutorial that teaches [skill] by building [concrete deliverable].
tags: [tutorial, <area>]
kind: tutorial
status: current
last_reviewed: <YYYY-MM-DD>
---

# [What You'll Build]

Learn [skill] by building [concrete deliverable].

**Time:** ~[X] minutes
**Audience:** New contributor
**Touches:** `src/<area>`

## What You'll Learn

By the end of this tutorial, you will:

- [Concrete skill 1]
- [Concrete skill 2]
- [Concrete skill 3]

## Prerequisites

- Node.js ≥ 20 and pnpm installed
- Repo cloned: `git clone <repo>` and `pnpm install` completed

## Step 1: [First Action]

> One-sentence reason this step exists.

```bash
pnpm <command>
```
````

You should see:

```
<expected output>
```

## Step 2: [Second Action]

Create `apps/<pkg>/src/<file>.ts`:

```ts
export const example = (input: string): string => {
	return input.toUpperCase()
}
```

## Step 3: [Verify]

```bash
pnpm test:e2e
```

## What You've Built

You now have [recap of deliverable].

## Next Steps

- [How to deploy this to `dev`](../how-to/deploy-to-dev.md)
- [Reference: `<api>`](../reference/<api>.md)
- [Why we structure features this way](../explanation/feature-structure.md)

````

---

## How-to Guide Template

```markdown
---
name: How to [Accomplish Specific Task]
description: Procedure for [task].
tags: [how-to, <area>]
kind: how-to
status: current
last_reviewed: <YYYY-MM-DD>
---

# How to [Accomplish Specific Task]

[One sentence describing what this guide does and when to reach for it.]

## Prerequisites

- [Pre-condition, e.g. "Backend deployed to `dev`"]
- [Pre-condition]

## Steps

### 1. [Action verb phrase]

```bash
pnpm <command>
````

### 2. [Action verb phrase]

```ts
// concrete snippet
export const example = (input: string): string => {
	return input.toUpperCase()
}
```

### 3. [Action verb phrase]

```bash
pnpm build
```

## Verify It Worked

```bash
pnpm check
```

Expected:

```
✓ No errors
```

## Troubleshooting

### `<error message>`

**Cause:** [Why this happens]
**Fix:** [How to resolve]

### `<another error>`

**Cause:** …
**Fix:** …

## See Also

- [Related how-to](./other.md)
- [Reference](../reference/<x>.md)
- [Explanation: Why …](../explanation/<x>.md)

````

---

## Reference Template — TypeScript Function / Hook

```markdown
---
name: '`<functionName>`'
description: Reference for the `<functionName>` function/hook (signature, params, returns, errors).
tags: [reference, api, <package>]
kind: reference
status: current
last_reviewed: <YYYY-MM-DD>
---

# `<functionName>`

[One-line description.]

## Synopsis

```ts
function functionName(arg: ArgType, opts?: Options): ReturnType
````

## Description

[Two or three sentences of factual description. No instructions.]

## Parameters

| Name   | Type      | Required | Default | Description |
| ------ | --------- | -------- | ------- | ----------- |
| `arg`  | `ArgType` | Yes      | —       | …           |
| `opts` | `Options` | No       | `{}`    | …           |

### `Options`

| Field  | Type      | Required | Default | Description |
| ------ | --------- | -------- | ------- | ----------- |
| `flag` | `boolean` | No       | `false` | …           |

## Returns

**Type:** `ReturnType`

[Description of the returned value.]

## Examples

### Basic usage

```ts
const result = functionName('hello')
```

### With options

```ts
const result = functionName('hello', { flag: true })
```

## Errors

| Error             | Condition              | Resolution                 |
| ----------------- | ---------------------- | -------------------------- |
| `ValidationError` | Input fails Zod schema | Fix input shape per schema |

## Notes

- [Edge case]
- [Performance consideration]

## See Also

- [How to use `functionName`](../how-to/use-<x>.md)
- [Explanation: Why `functionName` returns …](../explanation/<x>.md)

````

---

## Reference Template — React Component

```markdown
---
name: '`<ComponentName>`'
description: Reference for the `<ComponentName>` React component (props, examples, accessibility).
tags: [reference, frontend, component, <package>]
kind: reference
status: current
last_reviewed: <YYYY-MM-DD>
---

# `<ComponentName>`

[One-line description.]

## Import

```tsx
import { ComponentName } from '@/components/<ComponentName>';
````

## Props

| Prop       | Type                      | Required | Default | Description |
| ---------- | ------------------------- | -------- | ------- | ----------- |
| `value`    | `string`                  | Yes      | —       | …           |
| `onChange` | `(value: string) => void` | Yes      | —       | …           |
| `disabled` | `boolean`                 | No       | `false` | …           |

## Examples

### Basic

```tsx
<ComponentName value={value} onChange={setValue} />
```

### With form integration

```tsx
import { useForm } from 'react-hook-form'

const { register } = useForm()

;<ComponentName {...register('field')} />
```

## Accessibility

- [ARIA roles used]
- [Keyboard interactions supported]

## See Also

- [How to add a new field](../how-to/<x>.md)
- [Explanation: form architecture](../explanation/forms.md)

````

---

## Reference Template — Configuration File

```markdown
---
name: '`<file>` Reference'
description: Reference for the `<file>` configuration (options, env vars, per-environment defaults).
tags: [reference, config, <area>]
kind: reference
status: current
last_reviewed: <YYYY-MM-DD>
---

# `<file>` Reference

[What this configures.]

## Location

````

<relative/path/to/file>

````

## Format

```yaml
# example
key: value
````

## Options

### `option_name`

**Type:** `string`
**Default:** `"default"`
**Required:** No

[What this option controls.]

**Allowed values:**

- `"a"` — …
- `"b"` — …

**Example:**

```yaml
option_name: a
```

### `another_option`

**Type:** `number`
**Range:** `1`–`1000`
**Default:** `100`
**Required:** No

[What it controls.]

## Environment Variables

| Variable           | Overrides     | Description |
| ------------------ | ------------- | ----------- |
| `<PREFIX>_OPTION_NAME` | `option_name` | …           |

## Per-Environment Defaults

Fill in environments from `docs/agents/diataxis-context.md`.

| Env       | `option_name` | `another_option` |
| --------- | ------------- | ---------------- |
| `local`   | `a`           | `100`            |
| `staging` | `b`           | `500`            |
| `prod`    | `b`           | `1000`           |

## See Also

- [How to configure for a new environment](../how-to/<x>.md)
- [Explanation: multi-environment strategy](../explanation/multi-environment.md)

````

---

## Reference Template — Glossary

Singleton file — there is only ever one, at `docs/reference/glossary.md`. Extend it; never create a second glossary file.

````markdown
---
name: Glossary
description: Canonical definitions for domain terms — the shared vocabulary used by the codebase, docs, and AI agents.
tags: [glossary, domain, language]
kind: reference
status: current
last_reviewed: <YYYY-MM-DD>
authoritative: true
---

# Glossary

## [Group heading when clusters emerge]

**[Term]**
One or two sentence definition. What it IS, not what it does.
_Avoid_: [synonym1], [synonym2]

**[Another Term]**
…
_Avoid_: …
````

**Rules:**

- **Be opinionated.** When multiple words exist for the same concept, pick the best one and list the others under `_Avoid_`.
- **Keep definitions tight.** One or two sentences max. Define what it IS, not what it does.
- **Only include terms specific to this domain.** General programming concepts don't belong even if the project uses them extensively.
- **Group terms under subheadings** when natural clusters emerge. A flat list is fine when all terms belong to a single cohesive area.

## See Also

- [ADR: \<decision that introduced/renamed a term\>](../adr/<NNNN>-<slug>.md)

---

## Explanation Template

```markdown
---
name: [Topic / Question]
description: Explains [the why behind topic] — background, alternatives, trade-offs.
tags: [explanation, <area>]
kind: explanation
status: current
last_reviewed: <YYYY-MM-DD>
---

# [Topic / Question]

[Opening sentence framing the question this doc answers.]

## Background

[Where this came from, when, why. Link the OpenSpec change if relevant: `../../openspec/changes/<id>/proposal.md`.]

## [Core Concept]

[The "why" — the central narrative.]

### [Aspect 1]

…

### [Aspect 2]

…

## How It Works (high-level)

```mermaid
flowchart LR
  Client -->|HTTPS| ApiGateway
  ApiGateway --> Lambda
  Lambda --> DynamoDB
````

[Prose around the diagram. Keep at conceptual level — implementation lives in tutorials/how-to/reference.]

## Alternatives Considered

| Option          | Why not |
| --------------- | ------- |
| [Alternative A] | …       |
| [Alternative B] | …       |

## Trade-offs

| Aspect      | Pros | Cons |
| ----------- | ---- | ---- |
| Current     | …    | …    |
| Alternative | …    | …    |

## Implications

- For **contributors**: …
- For **operators**: …
- For **security**: …

## Common Misconceptions

### "[Misconception]"

[Why it's wrong; what's actually true.]

## Further Reading

- [OpenSpec change](../../openspec/changes/<id>/)
- [Tutorial](../tutorials/<x>.md)
- [Reference](../reference/<x>.md)
- [External resource](https://…)

````

---

## README / Index Template

```markdown
# <Project / Package> Documentation

[One-paragraph description of what this package or project does.]

## Quick Start

New here? Start with:

1. [Getting Started Tutorial](tutorials/getting-started.md)
2. [How to deploy to `dev`](how-to/deploy-to-dev.md)

## Documentation

### [Tutorials](tutorials/)

Learn by doing:

- [Getting Started](tutorials/getting-started.md)
- [Build Your First Feature Flag](tutorials/first-feature-flag.md)

### [How-to Guides](how-to/)

Solve specific tasks:

- [Deploy to `dev`](how-to/deploy-to-dev.md)
- [Rotate SOPS secrets](how-to/rotate-sops-secrets.md)
- [Add an interface contract](how-to/add-interface-contract.md)

### [Reference](reference/)

Look up technical facts:

- [Environment matrix](reference/environments.md)
- [Pseudo error codes](reference/pseudo-error-codes.md)
- [Interface contracts](reference/contracts.md)
- [CDK constructs](reference/cdk-constructs.md)

### [Explanation](explanation/)

Understand the why:

- [Architecture](explanation/architecture.md)
- [Security model](explanation/security-model.md)
- [Why Zustand](explanation/why-zustand.md)

## Other Documentation in This Repo

- [`AGENTS.md`](../AGENTS.md) — agent and contributor guidance
- [`docs/audit-reports/`](audit-reports/) — dated audit artifacts
- _Add any project-specific folders here (see `docs/agents/diataxis-context.md`)_

## Getting Help

- File an issue in the project repo
- Reach out to the project team
````
