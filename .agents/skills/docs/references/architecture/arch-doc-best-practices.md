# Architecture Documentation Best Practices

Load this file when: advising on documentation strategy, reviewing an existing bundle for quality, explaining the "why" behind the arc42+Diátaxis+OKF approach, or helping a team establish a documentation culture.

---

## The Bonsai principle (minimum viable documentation)

"Bonsai principle" is this skill's metaphor, not an established term. The upstream ideas behind it are arc42's lean, economical documentation and Diátaxis's "always complete, never finished".

A good architecture document is like a bonsai: **alive, shaped, and trimmed** — not overgrown, not dead.

- **Alive**: updated when the system changes; stale docs are worse than no docs (they mislead).
- **Shaped**: structured so a reader can navigate to exactly what they need without reading everything.
- **Trimmed**: no dead branches — archive or delete content that no longer describes the system.

Minimum viable coverage for any production system:

1. System context (who uses it and what external systems it depends on)
2. Top-level container/component breakdown
3. At least one non-trivial runtime scenario
4. Deployment topology
5. Active ADRs (decisions still in force)
6. Glossary of domain terms

If you have these six, you have a viable bundle. Everything else is enrichment.

---

## Docs-as-code

Architecture documentation belongs in the same repository as the code it describes:

- Reviewed in pull requests (architecture decisions get peer review)
- Versioned alongside the code that reflects them
- Structured as plain Markdown — no proprietary tools required to read or write
- CI-validated for structural conformance (e.g., `validate.py`)

Optional docs-as-code CI baseline on top of `validate.py` / `arc42-lint.py`: markdownlint (Markdown style), Vale (prose style and glossary terminology), lychee (external links — `validate.py` checks only internal links), a mermaid-cli (`mmdc`) render check for diagrams, and Prettier (formatting). See [architecture-guard.md](./architecture-guard.md).

Practical rules:

- Never store architecture diagrams as binary files (Visio, PowerPoint) — use text-based formats (Mermaid, PlantUML)
- Require doc updates in the same PR as the code changes they document
- Treat a broken doc link the same as a broken import

---

## Views

Every architecture has multiple concerns that cannot be shown in a single diagram. Two established catalogues describe this:

- _Views and Beyond_ (Clements et al., _Documenting Software Architectures_) groups views into three viewtypes: **module**, **component-and-connector**, and **allocation**.
- _Views and Perspectives_ (Rozanski & Woods, _Software Systems Architecture_) defines viewpoints plus cross-cutting **perspectives** (security, performance, evolution, ...) applied across views.

A complete documentation bundle covers at least three views:

| View           | What it shows                                 | arc42 sections      |
| -------------- | --------------------------------------------- | ------------------- |
| **Structural** | Static decomposition — what components exist  | 5 (Building Blocks) |
| **Dynamic**    | Runtime behaviour — how components interact   | 6 (Runtime View)    |
| **Deployment** | Physical/cloud mapping — where components run | 7 (Deployment)      |

Optional (add when stakeholder concerns require it):

| View               | What it shows                                         | arc42 sections    |
| ------------------ | ----------------------------------------------------- | ----------------- |
| Data / information | How data flows and is stored                          | 8 (Cross-cutting) |
| Security           | Trust boundaries, data classification, access control | 8 (Cross-cutting) |
| Quality / fitness  | How quality scenarios are addressed                   | 10 (Quality)      |

---

## ISO/IEC/IEEE 42010:2022 viewpoints

ISO/IEC/IEEE 42010:2022 (which replaced the 2011 edition) formalises the "views and viewpoints" approach:

- **Entity of interest**: the thing being described (the 2011 edition said "system of interest")
- **Stakeholder concern**: something a stakeholder needs to understand about the entity of interest
- **Stakeholder perspective** and **aspect**: a way of looking at the entity, and a characteristic of it that concerns address
- **Viewpoint**: conventions for constructing a view that frames one or more concerns
- **View**: the realised documentation for a specific entity; made of **view components**, each governed by a **model kind**
- **Architecture description (AD)**: the views plus **AD elements** and the **correspondences** between them
- **Architecture description framework (ADF)**: a reusable set of conventions for ADs (replaces "architecture framework"); arc42 plus C4 plays this role in this skill

Practical takeaway: before drawing any diagram, ask _which stakeholder concern does this address?_ If you cannot name one, the diagram may not be necessary.

---

## Staleness signals

A document is showing staleness when:

| Signal                                                                 | Action              |
| ---------------------------------------------------------------------- | ------------------- |
| `generated.at` older than 365 days, or `stale_after` passed            | VALIDATE or ARCHIVE |
| Document references a service, endpoint, or team that no longer exists | UPDATE or DELETE    |
| The system description contradicts the current codebase                | UPDATE immediately  |
| No one on the current team knows if the document is still accurate     | Schedule a review   |
| ADR status is `proposed` but the decision was made months ago          | UPDATE status       |

Run `validate.py` to surface staleness automatically. The LLM judgment pass in the VALIDATE operation handles semantic staleness that the script cannot detect.

---

## Common failure modes

| Failure mode                     | Description                                                                | Correction                                                                      |
| -------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **Diagrams-only**                | Architecture "documentation" is a slide deck of boxes and arrows, no prose | Add explanation for each diagram: context, decisions, consequences              |
| **Prose-only**                   | Long narrative documents with no diagrams                                  | Add at least C4 Level 1 and Level 2 diagrams                                    |
| **Hero knowledge**               | One person knows the architecture; nothing is written down                 | Scaffold a bundle with `docs arch generate`, populate iteratively               |
| **Outdated-but-unchallengeable** | Old docs are treated as authoritative because updating them is awkward     | Enforce `generated` + `log.md` discipline; run a staleness review quarterly     |
| **Over-documentation**           | Every class, method, and config value documented                           | Apply Bonsai principle — document decisions and structures, not implementations |
| **Drift without detection**      | Code changes; docs do not                                                  | Add doc update as PR checklist item; run validate.py in CI                      |
| **Wrong audience**               | Developer-level detail in a stakeholder-facing view                        | Apply Diátaxis + C4 audience mapping per view                                   |
| **One-doc-for-all**              | A single 50-page document tries to cover all concerns                      | Split by arc42 section and Diátaxis type                                        |

---

## Decision record discipline (ADRs)

Architecture Decision Records are the single highest-value documentation artefact per word written:

- One decision = one file in MADR 4 format: frontmatter `status`, `date`, `decision-makers`, `consulted`, `informed`; sections _Context and Problem Statement_, _Decision Drivers_, _Considered Options_, _Decision Outcome_ (with _Consequences_ and _Confirmation_)
- Status must be kept current (MADR): `proposed` → `accepted` (or `rejected`) → `deprecated` or `superseded by ADR-NNNN`
- Fill _Confirmation_ with how compliance is checked — ideally an automated fitness function (see below)
- Never edit the rationale of an accepted ADR — if the decision changes, create a new ADR that supersedes the old one
- Link the superseding ADR from the superseded one via `links:` frontmatter

See [adr.md](../../operations/architecture/adr.md) for the creation process.

---

## Architecture fitness functions

Doc linting checks the documentation; fitness functions (Ford, Parsons & Kua, _Building Evolutionary Architectures_, 2nd ed.) check the code against the decisions. Typical tools: ArchUnit (Java) / ArchUnitTS (TypeScript), dependency-cruiser (JS/TS), import-linter (Python). Write one test per enforceable ADR (layering, forbidden dependencies, module boundaries) and reference it in that ADR's _Confirmation_ section, so the decision and its check stay linked. See [architecture-guard.md](./architecture-guard.md) for where the job sits in CI.

---

## Agent entry points

Point coding agents at the bundle: add a line to the repository's `AGENTS.md` (open format, https://agents.md/; the nearest file to the edited code wins) or `CLAUDE.md` that names the bundle root `index.md` and the rules in [non-negotiables.md](./non-negotiables.md). If the docs are also published as a site, optionally publish an `llms.txt` (https://llmstxt.org/: H1, blockquote summary, H2 link lists, `## Optional`) derived from the `index.md` files.

---

## Audience-first writing

Every document has a primary audience. Match the content to what _that_ audience needs:

| Audience              | What they need                                   | Diátaxis type           |
| --------------------- | ------------------------------------------------ | ----------------------- |
| Executive / business  | What the system does, key constraints, risks     | explanation             |
| Product / QA          | Quality scenarios, acceptance criteria, glossary | reference               |
| Developer (new)       | How to navigate the codebase, key concepts       | tutorial + explanation  |
| Developer (active)    | How to deploy, debug, extend                     | how-to                  |
| Architect / tech lead | Decisions, tradeoffs, structural decomposition   | explanation + reference |
| Security reviewer     | Trust boundaries, data flows, threat model       | reference               |
