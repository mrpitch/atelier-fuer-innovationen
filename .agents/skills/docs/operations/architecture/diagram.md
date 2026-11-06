# docs arch diagram — generate or update a diagram

**Entry:** the user wants a diagram that lives in the bundle, anchored to an arc42 section (context, building blocks, runtime, deployment, domain model); or asks which diagram type fits. A throwaway Mermaid snippet for a PR description needs no operation. Rules for every file written: [non-negotiables](../../references/architecture/non-negotiables.md).

Start from [diagrams.md](../../references/architecture/diagrams.md): selection matrix, tool rules and scaffolds. Scaffolds carry the notation and accessibility rules, so copy one instead of writing from memory. Load on demand: C4 level → [c4-model.md](../../references/architecture/c4-model.md); UML type → [uml-types.md](../../references/architecture/uml-types.md); [mermaid-reference.md](../../references/architecture/mermaid-reference.md); [plantuml-reference.md](../../references/architecture/plantuml-reference.md); draw.io → [drawio.md](../../references/architecture/drawio.md).

## Steps

1. **Pick the arc42 section and diagram type** from the user's phrasing; ask only when it is ambiguous ("context (3), building blocks (5), runtime (6) or deployment (7)?").

   | User says…                                                        | Section | Diagram type           |
   | ----------------------------------------------------------------- | ------- | ---------------------- |
   | "context diagram", "system boundary", "external actors"           | 3       | C4 Context             |
   | "building blocks", "containers", "components", "services"         | 5       | C4 Container/Component |
   | "runtime scenario", "sequence", "auth flow", "message flow"       | 6       | Sequence diagram       |
   | "lifecycle", "object states", "status transitions"                | 6       | State machine          |
   | "deployment diagram", "infrastructure", "topology", "environment" | 7       | UML Deployment         |
   | "domain model", "ER diagram", "class diagram", "entities"         | 8       | Class / ER             |
   | "decision flowchart", "ADR diagram"                               | 9       | Flowchart (optional)   |

   For §6, read _State machine vs activity diagram_ in diagrams.md first: sequence for call flows, state machine for object lifecycles.

2. **Select the tool** (rule in diagrams.md → _Tool selection_):
   - Default to **Mermaid**: it renders natively on GitHub and GitLab and its text diffs cleanly in review.
   - **PlantUML** for deployment topology (§7), state machines with guards, activity diagrams with parallel forks.
   - **draw.io** for stakeholder-facing overviews (§3 context, §5 level 1, §7 with cloud icons) that need presentation-grade layout or icon sets.
   - Sequence, state and ER diagrams stay in text: they change with the code and reviewers diff them.

3. **Scaffold.** Copy the scaffold for the section and type from diagrams.md → _Scaffolds_. Replace every example name and every `%%` / `'` hint comment with real content. Give it an accessible title: `accTitle:` and `accDescr:` right after the Mermaid diagram type (C4 diagrams also get a `title` line), or a `title` line in PlantUML; `validate.py` warns (`DIAGRAM_NO_TITLE`) without one. For draw.io, generate through the jgraph plugin or MCP server when the session has one, else through the fallbacks in drawio.md → _Generating the diagram_, and save `<name>.drawio.svg` next to the concept file. A placeholder that needs domain knowledge the user cannot supply now stays in the file and is listed in the hand-off.

4. **Embed** in the concept file:
   - Use the existing concept file for the section/topic. With none, create one from the matching type template in [templates/architecture/](../../templates/architecture/) (type per the defaults in [arc42-sections.md](../../references/architecture/arc42-sections.md)).
   - Wrap the diagram in a fenced block (` ```mermaid ` or ` ```plantuml `). A draw.io file is an image with real alt text: `![<what the diagram shows>](./<name>.drawio.svg)`; `validate.py` warns on empty alt text (`IMAGE_NO_ALT`).
   - Place it after the introductory prose, not at the top, with a one-sentence caption below the closing fence: `*Figure: <what this diagram shows and at which C4/arc42 level>*`.
   - For a complex diagram, add two or three sentences below the caption saying what it shows — the text equivalent screen readers, search and agents can use.
   - Make sure the concept file is listed in the parent `index.md`.

5. **Render and inspect.** A diagram is done once it has rendered and someone has looked at the result.
   1. Run `python {baseDir}/scripts/architecture/diagram-check.py <bundle-root>`. It renders every diagram whose tool is installed to `<bundle-root>/.renders/` and fails on render errors. In CI, follow _Renderers run repo-controlled input_ in [architecture-guard.md](../../references/architecture/architecture-guard.md) before installing a renderer.
   2. Fix any `DIAGRAM_RENDER_FAILED` for this diagram and run it again.
   3. Open this diagram's PNG and check: no overlapping or clipped labels, readable text, every arrow labelled, a title, and a legend when shapes or colours carry meaning. Fix the source and re-render until it passes.
   4. **No renderer for this diagram (`RENDERER_MISSING`):** it cannot be inspected, so it is not done. Tell the user the diagram is unchecked and name the follow-up: "render and inspect `<file>`: install `<tool>` or open it in an editor that renders it, then check labels, title and legend."

6. Apply [non-negotiables](../../references/architecture/non-negotiables.md). Log entry: `- **Update**: <section>/<file>.md — added <diagram type> diagram`.

**Done when:** `diagram-check.py` rendered the diagram without errors and you inspected the PNG (or, without a renderer, the user knows the diagram is unchecked and the follow-up is named); it has an accessible title and alt text; it is embedded in its concept file and linked from the section `index.md`; `log.md` is updated.
