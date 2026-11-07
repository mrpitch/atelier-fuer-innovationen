# arc42 Sections — Reference

Source: [arc42.org](https://arc42.org) and [docs.arc42.org](https://docs.arc42.org) — template **v9.0 (EN, July 2025)** / **v9.1 (DE, December 2025)**. The 12 sections are unchanged since v8; sub-structure changed mainly in §5, §7 and §10. Headings below give the DE / EN names; a bundle uses one language only.

arc42 is a template for communicating and documenting software architectures. It defines 12 sections that together cover all topics a technical audience needs to understand, evaluate, and evolve a system. The template is intentionally lean — use only what adds value; mark unused sections `N/A` with a one-sentence reason.

---

## Section map

### 1. Einführung und Ziele / Introduction and Goals

**Diátaxis default:** explanation

What the system exists to do: business goals, key quality requirements (top 3–5), and stakeholders with their concerns. Keep it short — one page is the right size. This is the entry point; every other section links back to something stated here.

Sub-topics: requirements overview, quality goals table, stakeholder list.

### 2. Randbedingungen / Architecture Constraints

**Diátaxis default:** reference

Anything that restricts the architects' freedom: chosen tech stack, regulatory requirements, team agreements, budget limits. arc42 v9: constraints "must always be dealt with; they may be negotiable, though" — record who could change each one. Constraints narrow the solution space; document them so future readers understand why certain options were ruled out.

Sub-topics: technical constraints, organizational and political constraints, conventions. Mark a constraint `Blocking: yes` only when violating it must stop a merge (P0); everything else is a normal finding.

### 3. Kontextabgrenzung / Context and Scope

**Diátaxis default:** explanation (+ reference for interface tables)

The system's boundary: what is inside vs. outside. Show neighbouring systems and communication channels. Two views work well together:

- Business context (domain language, no technology)
- Technical context (protocols, data formats)

Interface tables fit reference; the narrative explaining the boundary fits explanation. Split into two files when both are substantial.

### 4. Lösungsstrategie / Solution Strategy

**Diátaxis default:** explanation

A brief, high-level summary of the fundamental design decisions: technology choices, decomposition approach, how quality goals are addressed. Three to five key decisions with one-paragraph rationale each. This is the most-read section; keep it current.

### 5. Bausteinsicht / Building Block View

**Diátaxis default:** reference (+ explanation for overview narrative)

The system's static structure: components, modules, packages, and their relationships. Typically presented in levels (Level 1 = top-level subsystems; Level 2 = internals of one subsystem). The structural diagram is reference; the narrative explaining why the decomposition was chosen is explanation.

Sub-topics: level-1 whitebox of the overall system (black boxes + important interfaces), level-2 and level-3 whiteboxes only for subsystems that need them, interface descriptions. The context diagram belongs to §3.

### 6. Laufzeitsicht / Runtime View

**Diátaxis default:** explanation

Important runtime scenarios: how building blocks collaborate at runtime for key use cases. Focus on non-obvious interactions (startup, error paths, high-load scenarios). Each scenario is a small explanation document.

Sub-topics: one file per scenario (e.g. `runtime-auth-flow.md`, `runtime-batch-job.md`).

### 7. Verteilungssicht / Deployment View

**Diátaxis default:** reference (+ how-to for deployment procedures that teach a task)

Infrastructure topology: hardware, cloud environments, containers, and how software maps onto them. Static topology is reference; a step-by-step procedure that teaches a task is how-to; an operator procedure tied to a trigger is a runbook.

Sub-topics (arc42 v9): **Infrastructure Level 1** — the overall infrastructure with motivation, quality and performance features, and the mapping of building blocks onto it; **Infrastructure Level 2** — internals of selected infrastructure elements; environment descriptions (dev/staging/prod). Operator runbooks (deploy, failover, rollback) live in `docs/runbook/` with `type: runbook`; link them from this section — an architecture concept is never a runbook.

### 8. Querschnittliche Konzepte / Cross-cutting Concepts

**Diátaxis default:** mixed — split by type into separate concept files

Overarching principles and patterns, often relevant to several building blocks (some only to a few): security model, logging strategy, error handling, internationalisation, domain model, persistence approach. arc42 advises to pick only the most-needed topics rather than attempting all of them. Forms: concept papers, example implementations, model excerpts or scenarios. Each concept is a separate file — one mega-document can't be one Diátaxis type.

Typical breakdown:

- `security-model.md` → explanation (why these choices)
- `logging-conventions.md` → reference (what fields, what levels)
- `how-to-add-structured-log.md` → how-to (task guide)
- `domain-model.md` → reference

### 9. Architekturentscheidungen / Architecture Decisions

**Type:** `adr` (one file per decision; the file stays in §9, see _ADR placement_ in [non-negotiables.md](./non-negotiables.md))

arc42 allows ADRs, a list/table, or one section per decision, and decisions may also be documented locally in a building block's whitebox. This skill uses **one ADR per file in [MADR 4](https://adr.github.io/madr/) format** (template: `templates/architecture/arc42-09-adr.md`). Avoid redundancy with §4: §4 summarises the strategy and links here for the full rationale. Accepted decisions are history — don't rewrite their rationale; supersede them with a new ADR.

File naming: `adr-NNNN-kebab-title.md` (zero-padded four digits).

MADR 4 frontmatter: `status` (`proposed | rejected | accepted | deprecated | superseded by ADR-NNNN`), `date`, `decision-makers`, `consulted`, `informed`. Sections: Context and Problem Statement, Decision Drivers, Considered Options, Decision Outcome (with Consequences and Confirmation), Pros and Cons of the Options, More Information. This skill adds a `**Risks created:**` line (RULE-4) and an optional `blocking: true`.

Write an ADR for decisions that are hard to reverse, have significant cost or performance implications, set cross-team precedents, or affect multiple services. **Do not write ADRs for**: library version choices, coding style rules (use linters), minor refactorings, or decisions already captured in the codebase itself.

### 10. Qualitätsanforderungen / Quality Requirements

**Diátaxis default:** reference

All quality requirements as concrete, testable scenarios. The top goals are already in §1.2 and are only referenced here; §10 also holds the lesser (nice-to-have) requirements.

Sub-topics (arc42 v9):

- **10.1 Quality Requirements Overview** — a table (or mind-map) of the requirements grouped by Q42 tag. The "quality tree" is deprecated upstream.
- **10.2 Quality Scenarios** — one `QS-xx` per scenario, each with a Q42 tag. Default form (Q42 short form): Context/Background, Source/Stimulus, Metric/Acceptance criteria. THOROUGH may use the SEI long form: Source, Stimulus, Environment, Artifact, Response, Response Measure. Distinguish **usage scenarios** (runtime behaviour) from **change scenarios** (modifications to the system).
- **10.3 Aspirational scenarios** (THOROUGH) — targets not yet measured; each one is tracked as a risk in §11 (RULE-5).

### 11. Risiken und technische Schulden / Risks and Technical Debts

**Diátaxis default:** explanation

Known risks (`RISK-xx`) and technical debts (`TD-xx`), ordered by priority (likelihood × impact), each with suggested measures and mitigation status. This section is a living document — update it after each significant architectural event.

Sub-topics: risk register, tech-debt backlog, mitigations in progress.

### 12. Glossar / Glossary

**Diátaxis default:** reference

Architecture-specific terms and abbreviations only: pattern names, building-block and technology names a new developer would misunderstand. Domain vocabulary lives in the single glossary `docs/reference/glossary.md`; §12 points to it and never redefines its terms. Cross-link to the concept files where terms are most thoroughly explained. Bilingual entries (DE / EN) where the system uses both languages.

---

## Bundle directory mapping

Recommended directory slugs:

| #   | Slug                 |
| --- | -------------------- |
| 1   | `01-goals`           |
| 2   | `02-constraints`     |
| 3   | `03-context`         |
| 4   | `04-strategy`        |
| 5   | `05-building-blocks` |
| 6   | `06-runtime`         |
| 7   | `07-deployment`      |
| 8   | `08-crosscutting`    |
| 9   | `09-decisions`       |
| 10  | `10-quality`         |
| 11  | `11-risks`           |
| 12  | `12-glossary`        |

---

## Quality Checklists

Per-section minimum requirements. Use after the DRAFT operation, after MIGRATE, or during VALIDATE to verify that a section meets basic quality standards. Reference `references/q42-quality-model.md` for Q42 tag guidance.

### Section 1 — Introduction and Goals

- [ ] 3–5 quality goals present (3 is ideal; more than 5 is a red flag)
- [ ] Every goal has a Q42 property tag (`#reliable`, `#efficient`, etc.)
- [ ] Every goal has a concrete, measurable scenario with specific numbers — reject "fast", "reliable", "secure" without a metric
- [ ] Goals are ordered by priority
- [ ] Stakeholder sign-off responsibility is named (who approves Section 1.2?)
- [ ] Requirements overview stays within 1–2 pages
- [ ] Business value is explained, not just features listed

### Section 2 — Constraints

- [ ] Every constraint has a reason and names who could change it (constraints may be negotiable)
- [ ] Only constraints whose violation must stop a merge are marked `Blocking: yes`
- [ ] No constraint is actually a design decision — test: does overriding it require a business, legal, or organisational change? If not, move to Section 9
- [ ] No constraint is actually a quality goal (e.g. "must be secure") — those belong in Section 1.2
- [ ] ESSENTIAL/THOROUGH: empty categories explicitly note "None identified" rather than being silently omitted
- [ ] No constraint contradicts a decision in Section 9

### Section 3 — Context and Scope

- [ ] System is shown as a single element with no internal components visible in the context diagram
- [ ] Every external actor and system has an explicit data-flow direction (one-way or bidirectional stated)
- [ ] All external interfaces have **IF-xx IDs** (IF-01, IF-02…) — these must match Section 5 exactly (RULE-1)
- [ ] No technical details in the business context diagram (no protocols or ports)
- [ ] System boundary is unambiguous — clear what is inside vs. outside
- [ ] Section 1.3 stakeholders map to external actors here

### Section 4 — Solution Strategy

- [ ] Every quality goal from Section 1.2 has a corresponding architectural approach in 4.3
- [ ] All major technology choices have a rationale beyond "it's popular"
- [ ] No decision has more than 2–3 sentences of rationale here — longer rationale belongs as an ADR in Section 9
- [ ] Component names in 4.2 are consistent with Section 5 building blocks
- [ ] No technology choice violates a constraint from Section 2
- [ ] ADR-worthy decisions have been flagged (hard to reverse, affects multiple components, non-obvious trade-offs)

### Section 5 — Building Block View

- [ ] Level-1 diagram and component table are present (mandatory at all detail levels)
- [ ] All external interfaces from Section 3 appear at Level-1 with matching **IF-xx IDs** (RULE-1)
- [ ] No circular dependencies between components
- [ ] ESSENTIAL/THOROUGH: every Level-1 component has a black-box description
- [ ] ESSENTIAL/THOROUGH: source code locations are specified for every component
- [ ] No building block maps to an individual file, class, or function (too granular)
- [ ] Level-2 only present for components explicitly identified as complex

### Section 6 — Runtime View

- [ ] 3–5 scenarios present (not fewer, not more)
- [ ] At least one happy-path scenario
- [ ] At least one error or recovery scenario
- [ ] At least one scenario connects to a quality goal from Section 1.2
- [ ] Every component referenced exists in Section 5
- [ ] Every external actor or system referenced exists in Section 3
- [ ] Trigger is explicit for each scenario — scenario cannot start without one
- [ ] Error handling is documented for scenarios on the critical path

### Section 7 — Deployment View

- [ ] Every Level 1 building block from Section 5 appears in the software-to-infrastructure mapping (RULE-2)
- [ ] Production environment is fully described before other environments
- [ ] No infrastructure choice violates a constraint from Section 2
- [ ] At least one `#reliable`, `#efficient`, or `#operable` goal from Section 1.2 has a corresponding infrastructure mechanism
- [ ] TLS termination point is identified
- [ ] Public vs. private network boundary is clear
- [ ] ESSENTIAL/THOROUGH: production deployment diagram present

### Section 8 — Crosscutting Concepts

- [ ] Every documented concept is relevant beyond a single building block, or explains why it lives here rather than in that block's §5 whitebox
- [ ] No subsection contains generic industry advice without system-specific content
- [ ] Skill convention (not an arc42 rule): LEAN covers security and observability; ESSENTIAL adds error handling, persistence, communication patterns — skip any that genuinely don't apply, and say why
- [ ] `#secure`, `#reliable`, `#operable`, or `#flexible` goals not addressed in Sections 4 or 7 are covered here
- [ ] Entity names in domain model match names used in Section 5

### Section 9 — Architecture Decisions

- [ ] Every decision flagged by Section 4 has a corresponding ADR
- [ ] Only architecturally significant decisions are documented
- [ ] No accepted rationale has been rewritten — superseded decisions carry `status: superseded by ADR-XXXX`
- [ ] Every ADR has a context section explaining WHY a decision was needed
- [ ] Consequences include both positive and negative (every decision has trade-offs)
- [ ] At least one option besides the chosen one is listed, with a concrete reason it lost
- [ ] Confirmation names how compliance is checked (fitness function, CI rule, or review step)
- [ ] Risks created by the decision are linked to Section 11 using **RISK-xx IDs** (RULE-4)
- [ ] `status` and `date` are set in the frontmatter of every ADR

### Section 10 — Quality Requirements

- [ ] Every quality goal from Section 1.2 has at least one quality scenario (RULE-3)
- [ ] Every scenario has a quantified, testable metric / acceptance criterion — no vague criteria
- [ ] §1.2 goals are referenced, not restated
- [ ] Every scenario has an explicit environment context (normal / peak / degraded)
- [ ] Every scenario has a priority (High / Medium / Low)
- [ ] At least one degraded-mode or failure scenario present
- [ ] If `#secure` is a quality goal, at least one security scenario present
- [ ] Q42 property tags match those used in Section 1.2 exactly
- [ ] QS IDs are stable — never renumber existing IDs
- [ ] THOROUGH: aspirational scenarios in Section 10.3 are referenced in Section 11 (RULE-5)

### Section 11 — Risks and Technical Debt

- [ ] Every `RISK-xx` referenced in Section 9 ADRs "Risks created" appears here (RULE-4)
- [ ] Every aspirational scenario from Section 10.3 has a corresponding risk entry (RULE-5)
- [ ] Risks and debts ordered by priority (Critical → High → Medium → Low), each with a suggested measure
- [ ] No risk is marked "Mitigated" without a concrete mitigation strategy
- [ ] No known risk omitted to make the architecture look better
- [ ] ESSENTIAL/THOROUGH: individual RISK-xx detail sections present
- [ ] Every debt item references a specific component from Section 5
- [ ] Deliberate debt items trace to an ADR in Section 9

### Section 12 — Glossary

- [ ] All Section 5 component names that are not plain English have a glossary entry
- [ ] All Section 3 external actor/system names that require explanation have an entry
- [ ] All architecture pattern names from Section 4 have a system-specific definition
- [ ] All domain entity names from Section 8 are defined in `docs/reference/glossary.md`, and §12 points to it
- [ ] No definition is a generic dictionary entry — every definition is specific to this system
- [ ] No circular definitions (term not used in its own definition)
- [ ] Preferred terms match Section 5 component names exactly
- [ ] Terms are sorted alphabetically within each table
