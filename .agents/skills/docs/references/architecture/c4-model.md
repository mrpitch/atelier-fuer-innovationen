# C4 Model — Reference

Load this file when: explaining C4 theory, deciding which C4 level or supplementary diagram to draw, understanding the relationship between C4 and arc42, or choosing between embedding a diagram vs. linking to it.

For selection guidance, scaffolds, and tool-specific syntax, return to [diagrams.md](./diagrams.md).

---

## What C4 is

C4 (Context → Container → Component → Code) is a **notation-agnostic model** for describing software architecture at four levels of abstraction, created by Simon Brown. It grew out of his architecture workshops from the mid-2000s; the four levels and the "C4" name first appeared at QCon London 2011, and the fourth level was renamed from "Classes" to "Code" in 2018. It is not a diagramming tool — it is a vocabulary. Mermaid `C4Context`/`C4Container`/`C4Component` is a convenient docs-as-code implementation, but it is experimental (see [Tooling](#tooling)).

C4 answers one question per level: _what is this thing and how does it relate to the things around it?_

---

## The four levels

| Level | Name      | Scope                                                    | Primary audience                | arc42 section                             |
| ----- | --------- | -------------------------------------------------------- | ------------------------------- | ----------------------------------------- |
| 1     | Context   | Your system as a black box + all external actors/systems | All stakeholders, non-technical | 3 — Context                               |
| 2     | Container | Deployable units inside your system (apps, DBs, queues)  | Tech leads, architects          | 5 — Building Blocks (L1)                  |
| 3     | Component | Major structural parts inside one container              | Developers                      | 5 — Building Blocks (L2+)                 |
| 4     | Code      | Classes, functions, modules                              | Implementers                    | Rarely documented — auto-generate or skip |

**When to stop:**

- Always produce Level 1 and Level 2.
- Add Level 3 only for containers that are complex, security-sensitive, or have a team-size > 5.
- Skip Level 4 entirely unless the codebase has no IDE tooling and readers cannot navigate the source.

---

## Supplementary diagrams

C4 also defines three supplementary diagrams. Draw them when the section needs them, not by default.

| Diagram          | Shows                                                                     | arc42 section                      | Mermaid                                                         |
| ---------------- | ------------------------------------------------------------------------- | ---------------------------------- | --------------------------------------------------------------- |
| System Landscape | All systems and people in an enterprise/estate, no single system focus    | 3 — Context (multi-system estates) | `C4Context` with `Enterprise_Boundary`                          |
| Dynamic          | How elements collaborate at runtime for one feature or scenario           | 6 — Runtime View                   | `C4Dynamic` (numbered by statement order)                       |
| Deployment       | How containers map to infrastructure nodes in one environment (e.g. Live) | 7 — Deployment View                | `C4Deployment` (`Deployment_Node` / `Node`, `Node_L`, `Node_R`) |

A sequence diagram remains the usual choice for §6 when message order and responses matter; a Dynamic diagram is better when the collaborating structure matters.

---

## C4 element vocabulary

| Element                                  | Usage                                                      |
| ---------------------------------------- | ---------------------------------------------------------- |
| `Person`                                 | Human user or role interacting with the system             |
| `Person_Ext`                             | External person outside the system boundary                |
| `System`                                 | The system you are describing (your system)                |
| `System_Ext`                             | An external system your system depends on or calls         |
| `Container`                              | A deployable unit (web app, API, database, file store…)    |
| `ContainerDb`                            | Shorthand for a database container                         |
| `Component`                              | A named grouping of code inside one container              |
| `Rel`                                    | Directed relationship with a label (and optional protocol) |
| `Rel_Back`                               | Reverse direction relationship                             |
| `Deployment_Node` / `Node`               | Infrastructure node in a Deployment diagram (nestable)     |
| `System_Boundary` / `Container_Boundary` | Logical boundary box                                       |

`BiRel` exists in Mermaid and C4-PlantUML but is **discouraged**: C4 notation asks for unidirectional relationships. Draw two `Rel`s with their own verbs instead.

---

## Relationship to arc42

C4 is structural notation; arc42 is a documentation template with 12 sections.

| C4 Level   | arc42 section(s)                   | Notes                                                          |
| ---------- | ---------------------------------- | -------------------------------------------------------------- |
| Level 1    | 3 — Context and Scope              | The context diagram IS the arc42 Sec 3 primary artefact        |
| Level 2    | 5 — Building Block View (L1)       | One container diagram covers the top-level building block view |
| Level 3    | 5 — Building Block View (L2+)      | One component diagram per complex container                    |
| Level 4    | Not mapped — skip or auto-generate |                                                                |
| Landscape  | 3 — Context and Scope              | Only when the system sits in a multi-system estate             |
| Dynamic    | 6 — Runtime View                   | Alternative or complement to sequence diagrams                 |
| Deployment | 7 — Deployment View                | One diagram per environment                                    |

---

## Tooling

C4 defines _what_ to show, not _how_ to draw it. c4model.com recommends **modelling over diagramming**: define elements and relationships once in a model and generate many views from it, so a rename happens once and the tool can validate the model.

- **Modelling (recommended for larger or long-lived architectures):**
  - **Structurizr DSL** with the current `structurizr` CLI / Structurizr Server. Structurizr Lite, on-premises, the cloud service and the old `structurizr-cli` are **end-of-life** — do not recommend them.
  - **LikeC4** — actively maintained models-as-code alternative.
- **Diagramming (fine for a small bundle):**
  - **Mermaid** `C4Context` / `C4Container` / `C4Component` / `C4Dynamic` / `C4Deployment` — renders natively on GitHub/GitLab. **Experimental**: syntax may change, and it does not support a legend, tags (`AddElementTag`/`AddRelTag`), `Lay_*` layout, sprites, links or shape/line styles. Layout follows statement order (tune with `UpdateLayoutConfig`).
  - **C4-PlantUML** (`!include <C4/C4_Container>`) — use it when you need a legend (`SHOW_LEGEND()`), layout control (`Lay_*`, `LAYOUT_*`) or tags.
  - **draw.io** — a visual editor with cloud and vendor icon sets, for stakeholder-facing overviews (§3, §5 level 1, §7). Stored as `.drawio.svg` with the diagram embedded, it shows as an image on GitHub/GitLab and stays editable, so there is no export to drift; but its XML doesn't diff well in review. See [drawio.md](./drawio.md).
  - **Excalidraw** — sketch-style whiteboarding; not supported by this skill.

Default choice for this skill: **Mermaid** for small bundles, since it renders without extra tooling. Because Mermaid C4 cannot draw a legend, add a short key below the diagram (a list of shapes/colours and their meaning) or switch to C4-PlantUML. For Mermaid syntax, load [diagrams.md](./diagrams.md) → Scaffolds.

---

## Notation checklist

Check every C4 diagram against this list (from c4model.com notation guidance):

- [ ] Title states diagram type and scope (e.g. "Container diagram: Order Service").
- [ ] Key/legend explains shapes, colours, line styles (Mermaid: write it below the diagram).
- [ ] Every element shows its type (Person, Software System, Container, Component…).
- [ ] Every element has a short description.
- [ ] Every container and component names its technology.
- [ ] Every relationship is unidirectional and labelled with a specific verb matching its direction ("Sends order events to", not "Uses").
- [ ] Inter-container relationships name the technology/protocol (e.g. "JSON/HTTPS").
- [ ] Acronyms and abbreviations are explained.
- [ ] Meaning does not depend on colour alone — readable for colour-blind readers and in black and white.

---

## Embed vs. link decision rule

| Situation                                          | Action                                                                              |
| -------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Diagram is the primary artefact for a section      | **Embed** inline in the concept file                                                |
| Diagram is referenced from multiple concept files  | **Create a dedicated diagram file**, link from each                                 |
| Diagram exceeds ~50 lines of code                  | **Separate file** (`<section-slug>/diagrams/<name>.md`), embed with a relative link |
| Diagram is auto-generated (e.g., from Structurizr) | **Link** to the rendered output, do not copy inline                                 |

---

## Common mistakes

| Mistake                                          | Correction                                                |
| ------------------------------------------------ | --------------------------------------------------------- |
| Drawing people inside the system boundary        | People are always external — move to outside the boundary |
| Using Level 3 to show every class in a container | Level 3 shows named components, not individual classes    |
| Omitting external systems in Level 1             | Show every system your system calls or is called by       |
| Adding technology labels to a Level 1 diagram    | Tech details belong in Level 2 containers                 |
| One diagram for all levels at once               | Draw one diagram per level; never merge them              |
| Vague relationship labels ("Uses", "Calls")      | Name the interaction: "Reads customer records from"       |
| Bidirectional arrows (`BiRel`)                   | Two unidirectional `Rel`s, each with its own label        |
