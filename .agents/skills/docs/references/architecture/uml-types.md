# UML Diagram Types — Reference

Load this file when: selecting a UML diagram type for an arc42 section, deciding between UML and C4, or choosing between Mermaid and PlantUML for a specific diagram type.

For diagram selection, tool rules, and scaffolds, return to [diagrams.md](./diagrams.md).

---

## UML 2.x taxonomy

UML 2.x defines 14 diagram types in two categories. For architecture documentation, only a subset are routinely useful.

### Structural diagrams (static)

| Diagram type        | Architecture use                          | Relevant?          | Preferred tool                                         |
| ------------------- | ----------------------------------------- | ------------------ | ------------------------------------------------------ |
| **Class**           | Domain model, entity relationships        | Yes — Sec 8        | Mermaid `classDiagram`                                 |
| **Component**       | Internal structure, interfaces            | Yes — Sec 5        | PlantUML or Mermaid C4                                 |
| **Deployment**      | Infrastructure topology, nodes, artifacts | Yes — Sec 7        | PlantUML; Mermaid `C4Deployment` / `architecture-beta` |
| Object              | Snapshot of instances                     | Rarely needed      | Skip for arch docs                                     |
| Package             | Module / namespace grouping               | Occasionally Sec 5 | PlantUML                                               |
| Composite structure | Internal port/connector wiring            | Niche (interfaces) | PlantUML                                               |
| Profile             | UML extension mechanism                   | Not for arch docs  | —                                                      |

### Behavioural diagrams (dynamic)

| Diagram type         | Architecture use                            | Relevant?         | Preferred tool                                              |
| -------------------- | ------------------------------------------- | ----------------- | ----------------------------------------------------------- |
| **Sequence**         | Runtime call flows, API protocols           | Yes — Sec 6       | Mermaid `sequenceDiagram`                                   |
| **Activity**         | Workflows, processes, parallel flows        | Yes — Sec 6, 8    | PlantUML activity; Mermaid `swimlane-beta` for simple lanes |
| **State machine**    | Object lifecycles, event-driven systems     | Yes — Sec 6, 8    | Mermaid `stateDiagram-v2`; PlantUML for history states      |
| **Use case**         | User-system interaction overview            | Yes — Sec 3       | PlantUML; Mermaid `usecase-beta` (12.0+)                    |
| Communication        | Object collaboration (less common)          | Rarely            | Skip for arch docs                                          |
| Timing               | Real-time constraints                       | Embedded/IoT only | PlantUML timing                                             |
| Interaction overview | High-level flow combining sequence diagrams | Rarely            | PlantUML                                                    |

---

## Arc42 section → UML type matrix

| arc42 Section                 | Primary UML type                | Notes                                                                                                          |
| ----------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 3 — Context and Scope         | Use case (actors) or C4 Level 1 | Prefer C4 Context — more readable for stakeholders                                                             |
| 5 — Building Block View (L1)  | C4 Container or UML Component   | C4 is preferred; UML Component if existing standard                                                            |
| 5 — Building Block View (L2+) | C4 Component or UML Component   | UML Component shows provided/required interfaces                                                               |
| 6 — Runtime View              | Sequence diagram                | State machine for object lifecycles                                                                            |
| 6 — Object lifecycle only     | State machine                   | Mermaid handles guards (as labels), choice, fork/join; PlantUML for history states                             |
| 6 — Process / workflow        | Activity diagram                | PlantUML for swimlanes with parallel forks                                                                     |
| 7 — Deployment View           | UML Deployment diagram          | PlantUML for UML nodes/artifacts; Mermaid `C4Deployment` or `architecture-beta` for C4-style or cloud topology |
| 8 — Domain model              | Class diagram or ER diagram     | Class for OO models, ER for database schemas                                                                   |
| 8 — Cross-cutting process     | Activity diagram                | Shows cross-cutting workflow steps                                                                             |
| 9 — ADR (optional)            | Decision flowchart              | Mermaid `flowchart TD` — only if genuinely helps                                                               |

---

## Mermaid vs PlantUML capability per type

| Diagram type          | Mermaid                                                                                | PlantUML                                     | Recommendation                                                          |
| --------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------- |
| C4 Context            | Good (`C4Context`; experimental, no legend/tags/layout hints)                          | Full via C4-PlantUML (legend, tags, `Lay_*`) | **Mermaid**; C4-PlantUML when legend, tags or layout control matter     |
| C4 Container          | Good (`C4Container`)                                                                   | Full via C4-PlantUML                         | **Mermaid**; same caveat                                                |
| C4 Component          | Good (`C4Component`)                                                                   | Full via C4-PlantUML                         | **Mermaid**; same caveat                                                |
| C4 Dynamic/Deployment | Good (`C4Dynamic`, `C4Deployment`)                                                     | Full via C4-PlantUML                         | **Mermaid**; same caveat                                                |
| Sequence              | Good (`sequenceDiagram`)                                                               | Full                                         | Mermaid sufficient for most                                             |
| Class                 | Good (`classDiagram`)                                                                  | Full (interfaces, notes)                     | Mermaid for simple; PlantUML for complex                                |
| ER diagram            | Good (`erDiagram`)                                                                     | Via extension                                | **Mermaid**                                                             |
| State machine         | Good (`stateDiagram-v2`: guards as labels, choice, fork/join, concurrency; no history) | Full (incl. history states)                  | Mermaid; **PlantUML** when history states are needed                    |
| Activity / workflow   | Partial (`flowchart`; lanes via `swimlane-beta`)                                       | Full (swimlanes, fork/join)                  | **PlantUML** for parallel flows across lanes                            |
| Deployment            | Partial (`C4Deployment`, `architecture-beta`)                                          | Full (nodes, artifacts, icon libraries)      | Mermaid for C4-style or cloud topology; **PlantUML** for UML deployment |
| Use case              | Beta (`usecase-beta`, 12.0+)                                                           | Full                                         | PlantUML (or Mermaid if your renderer runs 12.x; or skip — use text)    |
| Flowchart             | Full (`flowchart`)                                                                     | Full (`activity`)                            | Mermaid for simple; PlantUML for parallel                               |

`-beta` and 12.x types depend on the host's Mermaid version — GitHub and GitLab may not render them yet (see [mermaid-reference.md](./mermaid-reference.md)).

---

## What to skip

These UML types add complexity without payoff in most architecture documentation:

- **Object diagrams** — snapshots of instances; prefer a table in a reference file
- **Package diagrams** — replaced by C4 component diagrams with better readability
- **Composite structure** — useful for complex component port wiring; only draw when the architecture genuinely requires showing provided/required interfaces
- **Communication diagrams** — sequence diagrams are always clearer
- **Timing diagrams** — only for embedded or hard real-time systems

Rule: if you need to explain how to read the diagram before the reader can use it, reconsider whether a simpler diagram type or a prose table achieves the same result.
