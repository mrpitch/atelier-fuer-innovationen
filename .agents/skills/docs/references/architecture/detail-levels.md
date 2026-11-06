# Detail Levels — Reference

arc42 is intentionally lean: all sections are optional, and even required sections have a wide range of acceptable depth. This reference defines three named depth levels so teams can make a single upfront scope decision rather than debating per-section depth throughout.

These levels are a toolkit convention — they are not part of the official arc42 template.

---

## The Three Levels

### LEAN — Agile / Minimal

**Best for:** Agile teams, time-constrained projects, evolving systems, early-stage products.

- 1–3 pages per section maximum
- Essential information only — "dare to leave gaps"
- Favour decisions over descriptions; link to code rather than duplicating it
- Diagrams: only where a picture replaces a substantial prose explanation

**Minimum viable set at LEAN:**

| Section             | What to include                                                |
| ------------------- | -------------------------------------------------------------- |
| 1 — Goals           | Section 1.2 quality goals table only (mandatory at all levels) |
| 3 — Context         | Business context diagram + external interfaces table           |
| 5 — Building blocks | Level-1 diagram + component table                              |
| 9 — Decisions       | One ADR per significant, hard-to-reverse decision              |
| 12 — Glossary       | Architecture terms + abbreviations; domain terms stay in `docs/reference/glossary.md` |

All other sections: mark `N/A` with a one-sentence reason in the root `index.md`, or omit entirely with a comment in the root `index.md`.

---

### ESSENTIAL — Core Information

**Best for:** Most production systems — the recommended default.

- Non-negotiable minimum for systems with cross-team consumers, compliance requirements, or long expected lifespans
- Includes all LEAN content plus: requirements overview, stakeholder list, black-box descriptions for all Level-1 components, alternatives in ADRs, quality requirements overview
- Diagrams: Level-1 building blocks + context diagram; production deployment diagram
- The `arc42-lint.py` script consistency rules are meaningful at this level (IF-xx IDs, Q42 tag traceability, RISK-xx links)

**What ESSENTIAL adds over LEAN per section:**

| Section | ESSENTIAL additions                                                                           |
| ------- | --------------------------------------------------------------------------------------------- |
| 1       | Requirements overview (1.1) + stakeholder list (1.3)                                          |
| 2       | All four constraint categories documented; empty ones explicitly note "None identified"       |
| 3       | Per-interface detail descriptions; technical context if teams integrate externally            |
| 4       | Decomposition strategy section + key architectural patterns                                   |
| 5       | Black-box descriptions for each Level-1 component; source code locations                      |
| 6       | C4 sequence diagram per scenario (numbered steps only at LEAN)                                |
| 7       | Production deployment diagram                                                                 |
| 8       | Error handling, persistence, communication patterns (adds to LEAN's security + observability) |
| 9       | Alternatives Considered table + Implications cross-references                                 |
| 10      | Quality requirements overview table                                                           |
| 11      | Individual RISK-xx detail sections (matrix only at LEAN)                                      |
| 12      | Ambiguous terms table                                                                         |

---

### THOROUGH — Comprehensive

**Best for:** Critical systems, regulated environments, audit requirements, large distributed teams.

- Complete documentation across all sections
- Detailed scenarios, multiple diagram levels, extensive validation
- Full Q42 quality scenario coverage including aspirational scenarios (Section 10.3)
- Technical debt section with remediation plans (Section 11.3)
- Level-2 building block diagrams for complex components
- Per-environment deployment diagrams
- ADR validation criteria + stakeholder sign-off tracking

**What THOROUGH adds over ESSENTIAL:**

| Section | THOROUGH additions                                                                           |
| ------- | -------------------------------------------------------------------------------------------- |
| 1       | Quality goal selection rationale; stakeholders grouped by category                           |
| 2       | Architectural impact column in constraint tables                                             |
| 4       | Rejected alternatives (high-level); explicit ADR references per decision                     |
| 5       | Level-2 whiteboxes for complex components; fulfilled requirements per component              |
| 6       | Error and alternative flows in sequence diagrams                                             |
| 7       | Per-environment deployment diagrams; network/security detail; quality goal realisation table |
| 8       | Domain model (if entities cross component boundaries); testing strategy table                |
| 9       | Stakeholder sign-off + validation criteria per ADR                                           |
| 10      | Aspirational scenarios table (Section 10.3); testability notes per scenario                  |
| 11      | Technical debt detail sections (DEBT-xx) with remediation plans                              |
| 12      | Synonyms/aliases column; translations table for multi-language projects                      |

---

## Choosing a Level

Answer three questions upfront:

1. **Who will read this?** External teams or auditors → ESSENTIAL minimum. Internal team only → LEAN is fine.
2. **How long will the system live?** > 2 years in production → ESSENTIAL minimum. Short-lived experiment → LEAN.
3. **What is the consequence of misunderstanding?** Safety-critical, regulated, or high-cost-of-change → THOROUGH. Low stakes → LEAN.

When in doubt, start LEAN and upgrade a section to ESSENTIAL/THOROUGH when you notice the section is being misunderstood or causing rework.

---

## Level Mixing

Different sections can use different levels. Common pattern:

| Section     | Level     | Rationale                                                               |
| ----------- | --------- | ----------------------------------------------------------------------- |
| 1, 3, 5, 9  | ESSENTIAL | Core structural sections — always worth the investment                  |
| 10, 12      | ESSENTIAL | Quality and vocabulary are cheap to maintain, high value                |
| 6, 7        | LEAN      | Infrastructure and runtime change frequently; keep lightweight          |
| 2, 4, 8, 11 | As needed | Upgrade if the team repeatedly has questions answered by these sections |

Store the chosen level in the root `index.md` frontmatter as `detail_level: lean | essential | thorough`. The `DRAFT` operation reads this and generates content at the appropriate depth.

---

## Relationship to the Bonsai Principle

The Bonsai principle ([arch-doc-best-practices.md](./arch-doc-best-practices.md)) defines the absolute minimum viable documentation: context diagram, container breakdown, one runtime scenario, deployment topology, active ADRs, glossary. This maps to LEAN with Sections 3, 5, 6, 7, 9, and 12.

LEAN extends Bonsai by adding the Section 1.2 quality goals table — the one addition that makes all other sections coherent and traceable.

---

## Domain Profiles

Domain profiles are named presets that combine a `detail_level` with section priority
guidance for common system archetypes. They are optional — teams that already know
their depth level can skip them. When used, store the profile in the root `index.md`
frontmatter as `domain_profile:` alongside `detail_level:`.

| Profile            | `detail_level` | Priority sections           | Thin / skip                      |
| ------------------ | -------------- | --------------------------- | -------------------------------- |
| `startup-mvp`      | LEAN           | §1, §3, §4, §9              | §2 thin; §10, §11 thin; §12 skip |
| `microservice`     | ESSENTIAL      | §3, §5, §6, §7              | §8 one concept only; §11 thin    |
| `platform-service` | THOROUGH       | §1, §3, §5, §6, §7, §9, §10 | no sections skipped              |
| `data-pipeline`    | ESSENTIAL      | §5, §6, §7, §11             | §3 thin; §12 domain-terms only   |

### Profile guidance

**`startup-mvp`** — Use during the zero-to-one phase when requirements still change
weekly. Focus on the why (§1), the boundary (§3), the key bets (§4), and the decisions
you've made (§9). Everything else is noise until the system stabilises.

**`microservice`** — Use for a single, independently deployed service with a clear
API boundary. The boundary (§3), structure (§5), runtime behaviour (§6), and deployment
topology (§7) are the highest-value sections. Cross-cutting concepts (§8) rarely need
more than one file (e.g., error handling or auth delegation).

**`platform-service`** — Use for a horizontal capability consumed by many other teams
(e.g., an auth service, an event bus, a data platform). Because misunderstanding has
wide blast radius, THOROUGH depth is warranted across all structural and quality sections.

**`data-pipeline`** — Use for ETL/ELT systems, stream processors, or ML pipelines.
The building block view (§5), runtime flows (§6), deployment (§7), and risk register
(§11) dominate; context (§3) can stay thin if the pipeline's inputs and outputs are
obvious from the interface tables.

### Mixing profiles and level mixing

Profiles are a starting point. If a section is being repeatedly misunderstood or
causing rework, upgrade it to ESSENTIAL or THOROUGH regardless of the profile — see
[Level Mixing](#level-mixing) above. The `domain_profile:` field is descriptive, not
a constraint.
