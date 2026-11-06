# Section Interviews

Per-section pre-flight reads, questions and output contracts for the [draft operation](../../operations/architecture/draft.md). Read only the entry for the section being drafted. File names match what `bootstrap.py` scaffolds: when a stub with that name exists, fill it instead of creating a new file.

| Section | Title                     | Entry                                                |
| ------- | ------------------------- | ---------------------------------------------------- |
| 1       | Introduction and Goals    | [Section 1](#section-1--introduction-and-goals)      |
| 2       | Constraints               | [Section 2](#section-2--constraints)                 |
| 3       | Context and Scope         | [Section 3](#section-3--context-and-scope)           |
| 4       | Solution Strategy         | [Section 4](#section-4--solution-strategy)           |
| 5       | Building Block View       | [Section 5](#section-5--building-block-view)         |
| 6       | Runtime View              | [Section 6](#section-6--runtime-view)                |
| 7       | Deployment View           | [Section 7](#section-7--deployment-view)             |
| 8       | Crosscutting Concepts     | [Section 8](#section-8--crosscutting-concepts)       |
| 9       | Architecture Decisions    | [Section 9](#section-9--architecture-decisions)      |
| 10      | Quality Requirements      | [Section 10](#section-10--quality-requirements)      |
| 11      | Risks and Technical Debts | [Section 11](#section-11--risks-and-technical-debts) |
| 12      | Glossary                  | [Section 12](#section-12--glossary)                  |

Diagrams in the output contracts are produced through the [diagram operation](../../operations/architecture/diagram.md) and embedded in the concept file; this catalogue only says which diagram a section needs.

---

## Section 1 — Introduction and Goals

**Pre-flight:** Check if Section 3 or 9 exists — they inform quality goals and stakeholders.

**Questions:**

1. System name and purpose — what is it called and what does it do in 1–2 sentences?
2. Business problem — what real-world problem does it solve, and who benefits?
3. Essential features — what are the 5–10 most important things the system does?
4. Quality goals — what are the 3–5 most important quality properties? Use the 9 Q42 tags to guide the answer: `#efficient`, `#flexible`, `#maintainable`, `#operable`, `#reliable`, `#safe`, `#secure`, `#suitable`, `#usable` (example requirements per tag: quality.arc42.org/requirements). For each goal: push for a concrete measurable scenario with specific numbers. See [q42-quality-model.md](./q42-quality-model.md).
5. Stakeholders — who are the key stakeholders? For each: role, contact, and what they need from the documentation.
6. Existing requirements — is there a backlog or spec to reference?
7. Detail level override (if different from bundle default): LEAN / ESSENTIAL / THOROUGH?

**Output contract:** `01-goals/introduction-and-goals.md` (type: explanation, arc42_section: 1). Must contain: requirements overview (1.1), quality goals table with Q42 tags and measurable scenarios (1.2), stakeholder table (1.3).

---

## Section 2 — Constraints

**Pre-flight:** Check if Section 4 or 9 exists — constraints must be consistent with those decisions.

**Questions:**

1. Technical constraints — mandated languages, frameworks, platforms, databases, existing systems to integrate?
2. Organisational/political constraints — team size, release cadence, budget, vendor contracts, parent-org decisions?
3. Regulatory/compliance constraints — GDPR, HIPAA, PCI-DSS, sector standards?
4. Conventions — coding standards, API design rules, naming conventions, documentation standards?
5. For each constraint: what would need to change for this to be removed? (If the answer is "we could just decide differently" — it belongs in Section 9, not here.)
6. Which constraints must block a merge when violated? Mark those `Blocking: yes` (P0); see [architecture-guard.md](./architecture-guard.md).

**Output contract:** `02-constraints/constraints.md` (type: reference, arc42_section: 2). Must contain: tables for each non-empty category (technical, organisational, regulatory, conventions) with reason column.

---

## Section 3 — Context and Scope

**Pre-flight:** Check if Section 1.3 exists (stakeholders map to external actors). Check if Section 5 exists (IF-xx IDs must match at Level-1).

**Questions:**

1. System name.
2. External human actors — users, administrators, operators, auditors.
3. External non-human actors — external systems (upstream/downstream), scheduled jobs, message brokers, monitoring systems.
4. Data flows — for each external partner: what data goes IN, what goes OUT? Is it one-way or bidirectional?
5. System boundary — what is explicitly NOT part of this system?
6. Technical context needed? (Yes if: interfaces use different protocols; external teams implement against them; detail level is THOROUGH.) If yes: protocols, formats, endpoints, authentication per interface.

**Output contract:**

- `03-context/context-and-scope.md` (type: explanation, arc42_section: 3) — narrative plus the C4 Context diagram
- `03-context/interface-table.md` (type: reference, arc42_section: 3) — external interfaces table with **IF-xx IDs** (IF-01, IF-02…)

External interfaces MUST use `IF-xx` IDs — these are referenced in Section 5 (Rule 1 of `arc42-lint.py`).

---

## Section 4 — Solution Strategy

**Pre-flight:** Must have Section 1.2 quality goals. Check if Section 2 (constraints) and Section 9 (decisions) exist.

**Questions:**

1. Technology choices — fundamental stack decisions (language, framework, platform, database, messaging). For each: why this over the alternatives?
2. Decomposition strategy — how is the system structured at top level (monolith, microservices, layered, event-driven)? Why?
3. Approaches to quality goals — for each goal from Section 1.2, what is the primary architectural mechanism that achieves it? (e.g. `#reliable` → active-passive failover)
4. Key architectural patterns applied system-wide (CQRS, Saga, Repository, Circuit Breaker)? Where and why?
5. Organisational fit — does the architecture reflect team boundaries (Conway's Law)?

**Output contract:** `04-strategy/solution-strategy.md` (type: explanation, arc42_section: 4). Must contain: technology decisions table, decomposition strategy, quality goal approach mapping. After generating: identify which decisions need a full ADR in Section 9 and tell the user explicitly.

---

## Section 5 — Building Block View

**Pre-flight:** Must have Section 3 IF-xx IDs. Check if Section 4 decomposition strategy exists. Check Section 6 and 7 for name consistency.

**Questions:**

1. Top-level components — what are the main building blocks? For each: one sentence on its sole responsibility.
2. External interfaces — which IF-xx IDs from Section 3 connect to which components? (Reuse exact Section 3 IDs — no new IDs for the same interface.)
3. Component dependencies — which depends on which? Any circular dependencies? Flag a circle immediately and report it as an open question in the hand-off ("Resolve circular dependency between {A} and {B}").
4. Communication style — REST, gRPC, events/messages, shared DB, in-process calls?
5. Source code locations — directory or module paths per component.
6. Level-2 candidates — which components are complex enough to need an internal breakdown?

**Output contract:** `05-building-blocks/building-blocks-level1.md` (type: reference, arc42_section: 5) — Level-1 diagram (C4 Container) + component table with IF-xx IDs + black-box descriptions (ESSENTIAL+).

Level-1 is mandatory at all detail levels. IF-xx IDs in the component table must match Section 3 exactly — `arc42-lint.py` Rule 1 enforces this.

---

## Section 6 — Runtime View

**Pre-flight:** Must have Section 5 component names. Must have Section 3 external actor names. Should have Section 1.2 quality goals.

**Questions:** for 3–5 scenarios — mandatory mix: ≥1 happy path, ≥1 error/recovery, ≥1 that demonstrates a quality goal.

Per scenario:

1. Name and trigger — what starts this scenario (user action, external event, scheduled job)?
2. Participants — which Section 5 components and Section 3 external actors are involved?
3. Sequence — step-by-step: who sends what to whom?
4. Failure handling — what can go wrong at each step, and how is it handled?
5. Quality goal illustrated — which Section 1.2 goal does this demonstrate?

**Output contract:** One file per scenario at `06-runtime/runtime-<scenario-name>.md` (type: explanation, arc42_section: 6); the scaffold's `runtime-main-flow.md` is the first. Include a sequence diagram (ESSENTIAL+). All component and actor names must match Sections 3 and 5 exactly.

---

## Section 7 — Deployment View

**Pre-flight:** Must have Section 5 component names. Check Section 2 for infrastructure constraints. Check Section 1.2 for `#reliable`, `#efficient`, `#operable` goals.

**Questions:**

1. Infrastructure type — cloud (provider + region), on-premise, hybrid?
2. Environments — what environments exist (dev, CI, staging, prod, DR)? Purpose of each?
3. Infrastructure components in production — compute, data layer, networking, managed services.
4. Software-to-infrastructure mapping — which Section 5 components run where? Instance count? Containerised?
5. Network and security topology — public vs. private boundary, TLS termination point, certificate management.
6. Replication and scaling — which components are replicated? Auto-scaling configured?
7. Quality goal realisation — for each `#reliable`, `#efficient`, `#operable` goal: what specific infrastructure mechanism achieves it?
8. Environment differences — what changes between environments (infrastructure tier, data isolation, scaling)?

**Output contract:**

- `07-deployment/deployment-topology.md` (type: reference, arc42_section: 7) — infrastructure table + **software-to-infrastructure mapping** covering ALL Section 5 components (Rule 2 of `arc42-lint.py`) + deployment diagram (ESSENTIAL+)
- Procedures that teach a deployment task → `07-deployment/how-to-<task>.md` (type: how-to)
- Operator procedures tied to a trigger (failover, rollback) → `docs/runbook/<name>.md` (type: runbook), linked from `deployment-topology.md`

---

## Section 8 — Crosscutting Concepts

**Pre-flight:** Check Section 5 component names. Check Section 1.2 for `#secure`, `#reliable`, `#operable`, `#flexible` goals. Check Section 4 for patterns to reference.

**Crosscutting test:** Before accepting any concept, confirm it applies to 2+ building blocks. Single-component concerns belong in Section 5 black-box description instead.

**Questions** (ask per topic — only include what the user confirms as significant):

1. Domain model — central domain entities shared across multiple components?
2. Security — authentication protocol, authorisation model, data protection at rest and in transit, secrets management?
3. Persistence and data access — ORM/repository pattern, CQRS/event sourcing, data ownership, transaction strategy?
4. Error handling and resilience — error propagation, retry strategy, circuit breaking, what users see vs. what is logged?
5. Observability — logging format/levels/retention, metrics tooling, distributed tracing, alerting thresholds?
6. Communication patterns — synchronous (REST/gRPC, versioning), asynchronous (message format, ordering, dead-letter)?
7. Testing strategy — test types, tooling, coverage expectations?
8. Additional concepts — internationalisation, caching, configuration management, multi-tenancy?

**Output contract:** One file per confirmed concept at `08-crosscutting/<concept-name>.md`. Never merge into one file. Each file's type is determined individually — security model → explanation; logging conventions → reference; how to add structured logging → how-to.

---

## Section 9 — Architecture Decisions

**Pre-flight:** Check Section 4 for flagged ADR candidates. Check Section 2 for constraint-driven decisions. Check Sections 1.2 and 5 for quality goals and component names to use in implications.

**Decision criteria** (share with the user before asking them to identify decisions): hard to reverse, affects multiple components, non-obvious trade-offs, constrained future choices, directly impacts quality goals.

**For each decision, gather:**

1. Architectural category — style, technology stack, data strategy, integration pattern, build vs. buy, security?
2. Context — what problem required a decision?
3. The decision — what was decided, specifically?
4. Alternatives seriously considered — at least one must be named with a concrete rejection reason.
5. Positive consequences.
6. Negative consequences / trade-offs — be honest, every decision has some.
7. Risks created — any risks or technical debt this introduces (use RISK-xx IDs if Section 11 will follow toolkit format).
8. Quality goals supported — which Section 1.2 goals does this help achieve?
9. Date and status.

**Output contract:** One file per ADR at `09-decisions/adr-<NNNN>-<kebab-title>.md` (type: adr, arc42_section: 9), created through the [adr operation](../../operations/architecture/adr.md). MADR format. The `Risks created` line must use RISK-xx IDs if Section 11 will be written (Rule 4 of `arc42-lint.py`).

---

## Section 10 — Quality Requirements

**Pre-flight:** Must have Section 1.2 quality goals and Q42 tags. Check Section 7 (infrastructure mechanisms) and Section 8 (crosscutting concepts) — scenarios verify those, not re-describe them. Check Section 9 for quality-related constraints from ADR consequences.

**Scenario coverage mandate:** Every Q42 tag from Section 1.2 must have ≥1 quality scenario (Rule 3 of `arc42-lint.py`).

**Per quality goal, gather:**

1. Most important scenario — what stimulus, in what environment, with what measurable threshold?
2. Degraded-mode scenario — what happens when a key dependency fails?
3. For `#secure`: authentication failure, privilege escalation attempt scenario?
4. For `#efficient`: peak load + response time target?
5. For `#operable`: deployment time, recovery time, alert latency?
6. Aspirational scenarios — quality targets agreed upon but not yet achieved. What is the current state vs. target?

**Metric coaching rule:** Push back on vague answers. "Fast" and "reliable" are not metrics. Demand a number or a concrete condition.

**Output contract:** `10-quality/quality-scenarios.md` (type: reference, arc42_section: 10), following [the §10 template](../../templates/architecture/arc42-10-quality.md). Must contain: a Quality Requirements Overview table (10.1); one `### QS-xx:` block per scenario (10.2) with a `**Quality property:** #tag` line (what Rule 3 reads), kind (usage or change), and the Q42 short form — Context/Background, Source/Stimulus, Metric/Acceptance criteria (THOROUGH may use the SEI long form). Every §1.2 tag is covered; extra tags for lesser requirements are fine. Aspirational scenarios (THOROUGH) go in 10.3 and must be tracked in Section 11 (Rule 5 of `arc42-lint.py`).

---

## Section 11 — Risks and Technical Debts

**Pre-flight:** Scan Section 9 ADRs for "Risks created" fields — those are pre-identified RISK-xx candidates. Scan Section 10.3 aspirational scenarios — each unmet quality target is a risk. Check Section 5 component names for debt item references.

**Questions** (work through categories systematically):

1. Architecture risks — single points of failure, unproven technology, scalability limits, tight coupling.
2. Dependency risks — third-party without viable replacement, weak SLAs, bus factor.
3. Security risks — known unpatched vulnerabilities, missing controls, unencrypted data paths.
4. Data and compliance risks — GDPR residency gaps, backup untested to RTO/RPO.
5. Integration risks — external behaviour outside team control, missing circuit breakers.
6. Technical debt — for each: type (Accidental / Deliberate / Legacy), affected component from Section 5, impact if unaddressed, remediation effort.

**Output contract:** `11-risks/risks-and-tech-debt.md` (type: explanation, arc42_section: 11). Must contain: risk summary matrix with RISK-xx IDs. Every RISK-xx referenced in Section 9 ADR "Risks created" lines must appear here (Rule 4). Every aspirational Section 10 scenario must be referenced here (Rule 5).

---

## Section 12 — Glossary

**Pre-flight:** Scan all existing sections for: component names from Section 5, pattern names from Section 4, domain entity names from Section 8, external actor/system names from Section 3, ADR technology names from Section 9. Present the collected terms to the user before asking questions.

**Questions:**

1. Domain terms — business entities, processes, roles, events, states that a new developer would misunderstand. These go to `docs/reference/glossary.md` through `docs write glossary`, not into §12.
2. Abbreviations and acronyms — project-specific only (REST, HTTP do not need definition unless used non-standardly).
3. Ambiguous terms — terms that mean different things to developers vs. business vs. ops.
4. Synonyms — concepts referred to by multiple names. Which is the canonical term? Aliases must be noted.

**Precision rule:** Every definition must be system-specific. Reject generic dictionary definitions. Ask: "What does this mean specifically in your system?"

**Output contract:** `12-glossary/glossary.md` (type: reference, arc42_section: 12). Must contain: a pointer to `docs/reference/glossary.md` (the single domain glossary; never redefine its terms), an architecture-terms table and an abbreviations table. Preferred terms here must match Section 5 component names exactly.
