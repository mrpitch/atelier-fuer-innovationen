# Mermaid — Architecture Diagram Reference

Load this file when: generating or debugging any Mermaid diagram for architecture documentation.

For diagram selection, tool rules, and scaffolds, return to [diagrams.md](./diagrams.md).

---

## Rendering environments

| Environment                  | Mermaid rendering                       | Notes                                     |
| ---------------------------- | --------------------------------------- | ----------------------------------------- |
| GitHub (README, issues, PRs) | Native — no plugin needed               | Use fenced ` ```mermaid ` blocks          |
| GitLab                       | Native since v10.3                      | Same fenced block syntax                  |
| Confluence                   | Requires Mermaid plugin                 | Alternatively use Confluence Diagrams app |
| VS Code                      | Native in the built-in Markdown preview | No extension needed                       |
| Obsidian                     | Native (core plugin)                    |                                           |
| JetBrains IDEs               | Native in Markdown preview              |                                           |
| mkdocs-material              | Native with `pymdownx.superfences`      | Common for project docs sites             |

**Hosted renderers pin their own Mermaid version.** GitHub, GitLab and IDE previews often lag the current release (12.2), so newer or `-beta` types (`architecture-beta`, `usecase-beta`, `swimlane-beta`) and Mermaid 12 defaults may not render there even when they work on mermaid.live. Check with the Mermaid CLI before committing:

```bash
python {baseDir}/scripts/architecture/diagram-check.py <bundle-root>   # renders every block with mmdc, if installed
```

The script uses `mmdc` only when it is already on `PATH`. Installing it (`@mermaid-js/mermaid-cli`, which pulls in a headless browser) is the user's or the team's call — don't `npx`-fetch it on the fly.

**Always use fenced code blocks, with an accessible title.** `accTitle` and `accDescr` work in every diagram type; put them right after the diagram type line. Use `accDescr { … }` for a description longer than one line. `validate.py` warns (`DIAGRAM_NO_TITLE`) when a block has neither `accTitle` nor a `title`:

````markdown
```mermaid
<diagram type, e.g. flowchart LR>
  accTitle: <short title a screen reader announces>
  accDescr: <one sentence: what the diagram shows>
  <diagram code here>
```
````

---

## Comments and configuration

`%%` starts a comment that runs to the end of the line. Never use HTML comments (`<!-- -->`) inside a Mermaid block — they are not Mermaid syntax and the `-->` is parsed as an arrow.

Per-diagram configuration goes in YAML frontmatter at the very top of the block:

```
---
config:
  layout: elk
  theme: neutral
---
flowchart LR
  %% Comments start with %% and run to the end of the line
  A[Client] --> B[API]
```

Mermaid 12 changed the defaults: ELK is bundled and is the default layout for flowchart, state, class, ER and other graph types, and several types (flowchart, sequence, class, ER, state, swimlane, use case) default to the `redux-color` theme and `neo` look. To keep the pre-12 appearance, set `theme: default`, `look: classic` and, if needed, `layout: dagre`.

---

## C4 Context (arc42 Sec 3)

```
C4Context
  title System Context: <System Name>

  Person(alias, "Label", "Description")
  Person_Ext(alias, "Label", "Description")

  System(alias, "Label", "Description")
  System_Ext(alias, "Label", "Description")

  Rel(from, to, "Label", "Optional: protocol")
  Rel_Back(from, to, "Label")
  BiRel(a, b, "Label")   %% discouraged: C4 notation wants unidirectional lines — use two Rel
```

These C4 blocks show call signatures, not a renderable diagram; copy a filled scaffold from [diagrams.md](./diagrams.md) instead.

Available elements: `Person`, `Person_Ext`, `System`, `System_Ext`, `System_Boundary`, `Enterprise_Boundary`.

---

## C4 Container (arc42 Sec 5, Level 1)

```
C4Container
  title Container Diagram: <System Name>

  Person(alias, "Label", "Description")

  System_Boundary(boundaryAlias, "System Name") {
    Container(alias, "Label", "Technology", "Description")
    ContainerDb(alias, "Label", "Technology", "Description")
    ContainerQueue(alias, "Label", "Technology", "Description")
  }

  System_Ext(alias, "Label", "Description")

  Rel(from, to, "Label", "Technology/Protocol")
```

---

## C4 Component (arc42 Sec 5, Level 2+)

```
C4Component
  title Component Diagram: <Container Name>

  Container_Boundary(boundaryAlias, "Container Name") {
    Component(alias, "Label", "Technology", "Description")
    ComponentDb(alias, "Label", "Technology", "Description")
  }

  Container_Ext(alias, "Label", "Technology", "Description")

  Rel(from, to, "Label")
```

Mermaid C4 is still marked experimental. It has no legend, tags, sprites or `Lay_*` layout statements — element order drives the layout, tuned with `UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")`. When you need a legend, tags or layout control, use C4-PlantUML (see [plantuml-reference.md](./plantuml-reference.md)).

---

## C4 Dynamic (arc42 Sec 6, numbered collaboration)

```
C4Dynamic
  title Dynamic: Sign-in flow

  Container(spa, "Web App", "TypeScript / React")
  Container_Boundary(api, "Order API") {
    Component(ctrl, "Sign-in Controller", "Spring MVC")
    Component(sec, "Security Component", "Spring Bean")
  }
  ContainerDb(db, "Orders DB", "PostgreSQL")

  RelIndex(1, spa, ctrl, "Submits credentials", "JSON/HTTPS")
  RelIndex(2, ctrl, sec, "Calls isAuthenticated()")
  RelIndex(3, sec, db, "Reads user record", "JDBC")
```

Mermaid ignores the `RelIndex` number and numbers relationships in statement order, so write them in sequence. Use a sequence diagram when timing, replies or alternatives matter.

---

## C4 Deployment (arc42 Sec 7)

```
C4Deployment
  title Deployment: <System Name> - Production

  Deployment_Node(region, "Cloud region", "AWS eu-central-1") {
    Deployment_Node(k8s, "Kubernetes cluster", "EKS") {
      Container(api, "Order API", "Java / Spring Boot", "Serves the REST API")
    }
    Deployment_Node(rds, "Managed database", "Amazon RDS") {
      ContainerDb(db, "Orders DB", "PostgreSQL", "Stores orders")
    }
  }
  Node(browser, "Customer browser", "Chrome / Firefox / Safari") {
    Container(spa, "Web App", "TypeScript / React", "UI")
  }

  Rel(spa, api, "Calls", "JSON/HTTPS")
  Rel(api, db, "Reads / writes", "JDBC")
```

Node elements: `Deployment_Node`, `Node` (short form), `Node_L`, `Node_R` (left/right aligned). Nest nodes for region → cluster → runtime; place containers inside the node that runs them.

---

## Architecture (arc42 Sec 7, cloud / infrastructure topology)

`architecture-beta` (Mermaid 11.1+) draws services and groups with icons — the closest Mermaid gets to a cloud deployment diagram.

```
architecture-beta
  group vpc(cloud)[Production VPC]
  group private(server)[Private subnet] in vpc

  service lb(internet)[Load balancer] in vpc
  service api(server)[Order API] in private
  service worker(server)[Worker] in private
  service db(database)[PostgreSQL] in private
  junction fanout in private

  lb:R --> L:api
  api:B -- T:fanout
  fanout:L --> R:worker
  fanout:R --> L:db
```

- `group id(icon)[Title] in parent` and `service id(icon)[Title] in group` — `in` nests.
- Edges name the side of each end: `a:R --> L:b` (ports `T`, `B`, `L`, `R`); `--` without arrowheads, `-->` / `<--` / `<-->` for direction. `a{group}:B --> T:b{group}` connects groups.
- `junction id` is a 4-way split point for fan-out edges.
- Built-in icons: `cloud`, `database`, `disk`, `internet`, `server`. Vendor logos (e.g. `logos:aws-s3`) need an iconify pack registered by the renderer — GitHub/GitLab do not, so stick to built-ins there.

---

## Block diagram (arc42 Sec 5, layered / logical view)

```
block
  columns 3
  ui["Presentation layer"]:3
  app["Application services"]:2 integ["Integrations"]
  dom["Domain model"]:3
  db[("Database")]:3

  ui --> app
  app --> dom
  dom --> db
```

`columns N` sets the grid width; `:N` after a block spans N columns. The keyword is `block` (older versions used `block-beta`). Use it for layer and building-block overviews where author-controlled placement matters more than auto-layout.

---

## Sequence diagram (arc42 Sec 6, call flows)

```
sequenceDiagram
  autonumber
  actor U as User
  participant A as Service A
  participant B as Service B
  participant DB as Database

  U->>A: Request
  activate A
  A->>B: Call
  B-->>A: Response
  deactivate A
  A->>DB: Persist
  DB-->>A: OK
  A-->>U: Response

  alt success case
    A-->>U: 200 OK
  else error case
    A-->>U: 500 Error
  end

  loop retry
    A->>B: Retry call
  end

  par notify
    A-)B: Publish event
  and audit
    A-)U: Push notification
  end

  Note over A,B: Optional annotation
```

Arrows: `->>` synchronous, `-->>` return, `-)` / `--)` async (open arrowhead), `-x` / `--x` message lost, `<<->>` / `<<-->>` bidirectional (v11+), `->` / `-->` line without arrowhead.

Blocks: `alt`/`else`, `opt`, `loop`, `par`/`and`, `critical`/`option`, `break` (exit the flow), `rect <color>` (background highlight), `box <label> ... end` around participant declarations (groups lifelines). `create participant X` before the first message to X and `destroy X` before the last one show lifecycle.

---

## State diagram (arc42 Sec 6, object lifecycle)

```
stateDiagram-v2
  [*] --> Pending
  state check <<choice>>
  Pending --> check : orderPlaced
  check --> Processing : [paymentValid]
  check --> Rejected : [else]
  Processing --> Processing : retryPayment [retryCount < 3] / backoff

  state split <<fork>>
  state merged <<join>>
  Processing --> split
  split --> AllocatingStock
  split --> SendingConfirmation
  AllocatingStock --> merged
  SendingConfirmation --> merged
  merged --> Shipped

  state Shipped {
    [*] --> InTransit
    InTransit --> Delivered : delivered
    --
    [*] --> Unbilled
    Unbilled --> Invoiced : invoiceSent
  }

  Shipped --> [*]
  Rejected --> [*]
```

- Transition labels are free text, so UML `event [guard] / action` renders as written.
- Pseudostates: `<<choice>>` (decision), `<<fork>>` / `<<join>>` (parallel split and merge).
- `--` inside a composite state separates concurrent regions.

**Limitation**: no history states (`H`, `H*`). Use PlantUML for state machines that need them — see [plantuml-reference.md](./plantuml-reference.md).

---

## Class diagram (arc42 Sec 8, domain model)

```
classDiagram
  class EntityA {
    +UUID id
    +String name
    +methodA() ReturnType
    -privateField String
  }

  class EntityB {
    +Long id
  }

  class InterfaceC {
    <<interface>>
    +methodX() void
  }

  EntityA "1" --> "N" EntityB : owns
  EntityA ..|> InterfaceC : implements
  EntityA o-- ValueObject : contains
  EntityB <|-- SpecialB : extends
```

Relationships: `-->` association, `--o` aggregation, `--*` composition, `..|>` realization, `<|--` inheritance, `..>` dependency.

Stereotypes: `<<interface>>`, `<<abstract>>`, `<<enum>>`, `<<service>>`.

---

## ER diagram (arc42 Sec 8, database schema)

```
erDiagram
  TABLE_A {
    UUID id PK
    String name
    Long fk_table_b FK
  }

  TABLE_B {
    Long id PK
    String value
  }

  TABLE_A ||--o{ TABLE_B : "has many"
  TABLE_A }|--|{ TABLE_C : "many-to-many"
```

Cardinality: `||` exactly one, `|o` zero or one, `}|` one or more, `}o` zero or more.

---

## Flowchart (arc42 Sec 9, decision flows; Sec 8, process overview)

```
flowchart TD
  A([Start]) --> B{Decision}
  B -- Yes --> C[Action C]
  B -- No --> D[Action D]
  C --> E([End])
  D --> E

  subgraph group1 [Group Label]
    C
    D
  end
```

Directions: `TD` top-down, `LR` left-right, `BT` bottom-top, `RL` right-left.

Node shapes: `[rectangle]`, `(rounded)`, `{diamond}`, `([stadium])`, `[[subroutine]]`, `[(cylinder)]`, `((circle))`.

---

## Gitgraph (optional — for branching strategy docs)

```
gitGraph
  commit id: "Initial"
  branch feature
  checkout feature
  commit id: "Feature work"
  checkout main
  merge feature id: "Merge"
  commit id: "Hotfix"
```

Use only in Sec 8 (cross-cutting concepts) if the team's branching strategy is a documented architectural concern.

---

## Newer types worth knowing

Check renderer support first (see Rendering environments) — these are recent or `-beta`.

- **`usecase-beta`** (12.0+) — UML use case: `actor`, `systemBoundary "Name" ... end`, `Actor --> UseCase`.
- **`swimlane-beta`** (11.16+) — process lanes: `swimlane-beta LR`, one `subgraph Lane ... end` per lane, edges cross lanes.
- **`requirementDiagram`** — requirements traced to elements (arc42 Sec 1/10).
- **`packet`** — protocol/frame layouts in reference docs.

```
swimlane-beta LR
  subgraph Customer
    Pay[Pay]
  end
  subgraph Warehouse
    Ship[Ship order]
  end
  Pay --> Ship
```

---

## Known limitations

| Feature                                     | Mermaid support                                                         | Use instead                                |
| ------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------ |
| UML deployment (nodes, artifacts, sprites)  | C4-style via `C4Deployment`; cloud topology via `architecture-beta`     | PlantUML deployment                        |
| C4 legend, tags, `Lay_*` layout hints       | Not supported (Mermaid C4 is experimental)                              | C4-PlantUML                                |
| State machine history states (`H`, `H*`)    | Not supported (guards work as label text)                               | PlantUML state                             |
| Activity diagram with fork/join + swimlanes | Partial: fork/join in `stateDiagram-v2`; lanes in `swimlane-beta`       | PlantUML activity                          |
| Sequence diagram async/response delays      | Limited                                                                 | PlantUML sequence with `delay`             |
| Diagram-level notes / callouts              | `Note over`                                                             | PlantUML `note`                            |
| UML component with ports/interfaces         | Not supported (`architecture-beta` ports are edge sides, not UML ports) | PlantUML component                         |
| `-beta` / 12.x types on GitHub or GitLab    | Depends on the host's pinned Mermaid version                            | Render with `mmdc` in CI and embed the SVG |

When you hit a Mermaid limitation, switch that diagram to PlantUML — see [plantuml-reference.md](./plantuml-reference.md) for the appropriate diagram type.
