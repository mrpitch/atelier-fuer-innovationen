# draw.io — Reference

Load this file when the [diagram operation](../../operations/architecture/diagram.md) picks draw.io: a stakeholder-facing overview that has to look presentation-grade, use cloud or vendor icon sets, or be edited by people who don't write diagram code.

---

## When to choose draw.io

| Use draw.io for                                                       | Keep it in text (Mermaid / PlantUML) for            |
| --------------------------------------------------------------------- | --------------------------------------------------- |
| §3 context overview shown to stakeholders                             | Sequence, state and ER diagrams (any section)       |
| §5 level-1 building-block overview                                    | §5 level 2 and deeper — they change with the code   |
| §7 deployment overview with cloud icons (AWS, Azure, GCP, Kubernetes) | Diagrams reviewers should diff line by line in a PR |
| Diagrams non-developers edit                                          | Anything generated from code or regenerated often   |

Text formats stay the default because a text diff shows what changed. A draw.io file is XML that is hard to review in a diff, so use it only where its layout and icons pay for that.

---

## Store as `.drawio.svg`

Save every draw.io diagram as `<name>.drawio.svg` next to the concept file that uses it, e.g. `03-context/context-overview.drawio.svg`. That one file is:

- an SVG image, so GitHub, GitLab and every Markdown viewer display it;
- a draw.io document (the diagram is embedded in the SVG), so draw.io desktop, app.diagrams.net and the VS Code draw.io extension open it for editing;
- the only copy — there is no separate export that can drift out of date.

Embed it with alt text and a caption:

```markdown
![System context: the payment gateway between web shops, card schemes and the acquirer bank](./context-overview.drawio.svg)

_Figure: System context (C4 level 1) for §3._
```

Never commit a `.drawio` file plus an exported PNG of it: the PNG goes stale the first time someone edits the source.

---

## Generating the diagram

Use the best tool the session already has. Don't install a plugin or add an MCP server without asking — the hosted MCP endpoint is an external service, and the diagram's content leaves the machine.

1. **The official jgraph tooling** (github.com/jgraph/drawio-mcp), if present:
   - **Claude Code plugin `drawio`** — installed with `/plugin marketplace add jgraph/drawio-mcp` and `/plugin install drawio@drawio`. It writes native `.drawio` files and can export PNG/SVG/PDF with the XML embedded. Ask it for an SVG export with the diagram embedded, and save the result as `.drawio.svg`.
   - **MCP app server** (`https://mcp.draw.io/mcp`) — tools `create_diagram` (draw.io XML or Mermaid, shown inline), `search_shapes` (icon libraries: AWS, Azure, GCP, Kubernetes, …) and `get_drawio_reference` (generation guidance). Use `search_shapes` for real cloud icons instead of guessing style names.
   - **MCP tool server** (npm `@drawio/mcp`) — opens XML, CSV or Mermaid in the draw.io editor.

   jgraph maintains its own guidance on generating good draw.io XML; follow it instead of the fallback below.

2. **Fallback: Mermaid through the draw.io CLI.** Write the diagram as Mermaid (`<name>.mmd`, a scaffold from [diagrams.md](./diagrams.md)), then let draw.io desktop convert it into editable shapes:

   ```bash
   drawio -x -f svg -e -o 03-context/context-overview.drawio.svg context-overview.mmd
   ```

   `-e` embeds the diagram, which is what makes the SVG editable. Delete the `.mmd` afterwards, or keep it as the text source and say so in the concept file — not both silently.

3. **Fallback: minimal draw.io XML** when neither is available. Write `<name>.drawio` by hand and convert it the same way (`drawio -x -f svg -e -o <name>.drawio.svg <name>.drawio`):

   ```xml
   <mxfile>
     <diagram name="Context" id="context">
       <mxGraphModel>
         <root>
           <mxCell id="0" />
           <mxCell id="1" parent="0" />
           <mxCell id="shop" value="Web shop" style="rounded=1;whiteSpace=wrap;" vertex="1" parent="1">
             <mxGeometry x="40" y="40" width="160" height="60" as="geometry" />
           </mxCell>
           <mxCell id="gateway" value="Payment Gateway" style="rounded=1;whiteSpace=wrap;" vertex="1" parent="1">
             <mxGeometry x="480" y="40" width="160" height="60" as="geometry" />
           </mxCell>
           <mxCell id="r1" value="Sends card payments to [HTTPS]" style="endArrow=block;html=1;" edge="1" parent="1" source="shop" target="gateway">
             <mxGeometry relative="1" as="geometry" />
           </mxCell>
         </root>
       </mxGraphModel>
     </diagram>
   </mxfile>
   ```

Without draw.io desktop none of the conversions run. Write the source file, tell the user the diagram is unchecked, and name "export and inspect" as the open follow-up (see [diagram.md](../../operations/architecture/diagram.md) step 5).

---

## Render and inspect

`diagram-check.py` exports every `.drawio`, `.drawio.svg` and `.drawio.png` in the bundle to PNG under `<bundle>/.renders/` (`drawio -x -f png -o <out>.png <file>`) and fails on files draw.io can't open. Open the PNG and check it the same way as any other diagram: labels readable and not overlapping, every arrow labelled, a title, and a legend when shapes or colours carry meaning.

---

## Notation and accessibility

- Follow the C4 notation checklist in [c4-model.md](./c4-model.md): one direction per relationship, a specific verb and the technology on every arrow, element types, a title and a legend.
- Don't encode meaning in colour alone — pair it with a shape, an icon or a label, and keep the palette colour-blind safe.
- Give the page a meaningful name (it becomes the diagram's title) and write real alt text in the Markdown image: the alt text is what a screen reader, search and an AI agent get.
- For a complex overview, add two or three sentences below the figure that say what it shows. That text equivalent is the part of the diagram an agent navigating the bundle can actually read.
