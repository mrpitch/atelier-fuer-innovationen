# Diagrams — Reference

Load this file when: generating a diagram, choosing between Mermaid and PlantUML, selecting a diagram type for an arc42 section, or scaffolding a visual from scratch.

See also:

- [c4-model.md](./c4-model.md) — C4 theory, 4 levels, supplementary diagrams, tooling, notation checklist, embed vs. link rules
- [uml-types.md](./uml-types.md) — full UML 2.x taxonomy, arc42 section → type matrix
- [mermaid-reference.md](./mermaid-reference.md) — complete Mermaid syntax for all architecture diagram types
- [plantuml-reference.md](./plantuml-reference.md) — PlantUML syntax for deployment, state, activity, component
- [diagram.md](../../operations/architecture/diagram.md) — step-by-step diagram generation process

---

## C4 model → arc42 section mapping

The C4 model (Context → Container → Component → Code) maps directly onto arc42's structural sections:

| C4 Level            | arc42 Section                            | Audience               |
| ------------------- | ---------------------------------------- | ---------------------- |
| Level 1 — Context   | 3 (Context and Scope)                    | All stakeholders       |
| Level 2 — Container | 5 (Building Block View, Level 1)         | Tech leads, architects |
| Level 3 — Component | 5 (Building Block View, Level 2+)        | Developers             |
| Level 4 — Code      | Rarely maintained — skip unless critical | Implementers only      |
| System Landscape    | 3 (multi-system estates only)            | All stakeholders       |
| Dynamic             | 6 (Runtime View)                         | Developers, architects |
| Deployment          | 7 (Deployment View)                      | Ops, architects        |

**Rule**: Always create Level 1 (sec 3) and Level 2 (sec 5). Level 3 only for complex or security-sensitive containers. Level 4: auto-generate from code or skip entirely.

---

## Diagram selection by arc42 section

| arc42 Section                         | Primary diagram                         | Secondary                                 | Tool                                                      |
| ------------------------------------- | --------------------------------------- | ----------------------------------------- | --------------------------------------------------------- |
| 3 — Context and Scope                 | C4 Context                              | C4 System Landscape, DFD Level 0          | Mermaid `C4Context`                                       |
| 5 — Building Block View               | C4 Container (L1) + C4 Component (L2+)  | UML Component                             | Mermaid `C4Container` / `C4Component`                     |
| 6 — Runtime View                      | Sequence diagram                        | C4 Dynamic, state machine (per lifecycle) | Mermaid `sequenceDiagram` / `C4Dynamic` or PlantUML       |
| 7 — Deployment View                   | C4 Deployment / infrastructure topology | Cloud architecture diagram                | Mermaid `C4Deployment` / `architecture-beta`, or PlantUML |
| 8 — Cross-cutting (domain model)      | Class diagram or ER diagram             | —                                         | Mermaid `classDiagram` or PlantUML                        |
| 9 — Architecture Decisions (optional) | Decision flowchart                      | —                                         | Mermaid `flowchart`                                       |

---

## Tool selection: Mermaid vs PlantUML

| Criterion              | Mermaid                                                                                | PlantUML                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Native rendering       | GitHub, GitLab. Confluence needs a Marketplace app; VS Code preview needs an extension | Requires server or plugin                                                 |
| Best for               | C4, flowcharts, sequence, class, ER                                                    | Deployment topology, state machines, activity                             |
| C4 diagrams            | Experimental: all five C4 types, but no legend, tags, `Lay_*` layout or sprites        | C4-PlantUML: legend (`SHOW_LEGEND()`), tags, layout control; more verbose |
| Deployment diagrams    | `C4Deployment` (nested nodes) and `architecture-beta` (groups, services, icons)        | Full node/artifact/cloud/database notation                                |
| State machines         | Limited (`stateDiagram-v2`)                                                            | Full support with guards and history states                               |
| Activity with parallel | Flowchart approximation only                                                           | Full fork/join notation                                                   |

**Default rule**: Use Mermaid unless the diagram needs PlantUML's richer notation — specifically: UML deployment notation (artifacts, stereotypes) beyond what `C4Deployment`/`architecture-beta` give, a rendered C4 legend or layout control (C4-PlantUML), state machines with guards, and activity diagrams with parallel forks.

---

## State machine vs activity diagram (arc42 sec 6)

**State machine** — models an object's lifecycle: states + event-driven transitions.

- Use when behavior depends on the object's current state.
- Examples: order lifecycle (Pending → Processing → Shipped), ticket status.
- Tool: PlantUML state diagram (`[*] -->` notation).

**Activity diagram** — models a workflow or process: steps + decisions + parallel branches.

- Use when showing a process that flows automatically from step to step.
- Examples: user registration flow, payment processing pipeline.
- Tool: PlantUML activity diagram (`start / if / fork / stop`) or Mermaid `flowchart`.

**Key distinction**: state machines wait for events; activity diagrams flow automatically.

---

## Scaffolds

Paste the matching scaffold into the concept file's fenced code block. Every scaffold renders as-is: fillable slots are obviously fake example values (`Example…`, `example-…`, `EXAMPLE_…`) and hints are diagram comments (`%%` in Mermaid, `'` in PlantUML). Replace every example value and delete the hint comments — do not commit unfilled scaffolds. Never put HTML comments (`<!-- -->`) inside a diagram block: they are not Mermaid or PlantUML syntax and break rendering.

Relationship labels are specific verbs that read in the arrow's direction ("Places orders using"), never a bare "Uses". Mermaid C4 cannot render a legend — add a short key below the diagram (see [c4-model.md](./c4-model.md) → Notation checklist).

### Section 3 — Context and Scope (Mermaid C4Context)

````markdown
```mermaid
C4Context
  title System Context diagram: Example System

  %% Replace every "Example..." value. One Person/System_Ext per real actor; delete unused ones.
  Person(user, "Example User Role", "Example: places and tracks orders")
  Person_Ext(extUser, "Example External Actor", "Example: audits monthly reports")

  System(system, "Example System", "Example: one-sentence purpose of the system")

  System_Ext(extSystem1, "Example Payment Provider", "Example: authorises card payments")
  System_Ext(extSystem2, "Example Event Bus", "Example: distributes domain events")

  %% Labels: specific verb in the arrow's direction, then protocol.
  Rel(user, system, "Places orders using", "HTTPS")
  Rel(extUser, system, "Downloads audit reports from", "HTTPS")
  Rel(system, extSystem1, "Requests payment authorisation from", "REST/HTTPS")
  Rel(system, extSystem2, "Publishes order events to", "AMQP")
```
````

For a **System Landscape** view, use the same `C4Context` syntax with several `System(...)` elements inside `Enterprise_Boundary(alias, "Example Org") { ... }` and no single system in focus.

---

### Section 5 — Building Block View (Mermaid C4Container)

````markdown
```mermaid
C4Container
  title Container diagram: Example System

  Person(user, "Example User Role", "Example: places and tracks orders")

  System_Boundary(sys, "Example System") {
    %% Technology (3rd argument) is required for every container.
    Container(web, "Example Web App", "Example: React", "Example: order entry UI")
    Container(api, "Example API Service", "Example: Spring Boot", "Example: order handling logic")
    ContainerDb(db, "Example Database", "Example: PostgreSQL", "Example: stores orders")
    %% Remove the queue if the system has none.
    ContainerQueue(queue, "Example Message Queue", "Example: Kafka", "Example: buffers order events")
  }

  System_Ext(extSystem, "Example External System", "Example: authorises card payments")

  Rel(user, web, "Places orders using", "HTTPS")
  Rel(web, api, "Submits orders to", "JSON/HTTPS")
  Rel(api, db, "Reads and writes orders in", "SQL/TCP")
  Rel(api, queue, "Publishes order events to", "Kafka protocol")
  Rel(api, extSystem, "Requests payment authorisation from", "REST/HTTPS")
```
````

For a Level 3 component view inside one container, replace `C4Container` with `C4Component`, `System_Boundary(...)` with `Container_Boundary(...)` (the container being decomposed), and the inner `Container(...)` elements with `Component(...)`. Keep neighbouring containers and external systems outside the boundary.

---

### Section 6 — Runtime View (Mermaid sequence)

````markdown
```mermaid
sequenceDiagram
  accTitle: Example scenario — replace with the real scenario name
  accDescr: Sequence of calls between the example client and services.
  autonumber
  %% Replace the example participants and messages with one real scenario.
  participant U as Example Client
  participant A as Example Service A
  participant B as Example Service B
  participant DB as Example Database

  U->>A: POST /example-orders
  A->>B: Validate example payment
  B-->>A: Payment valid
  A->>DB: INSERT example order
  DB-->>A: ACK
  A-->>U: 201 Created
```
````

When the collaborating structure matters more than message order, use a C4 **Dynamic** diagram: `C4Dynamic` with the same elements as `C4Container`/`C4Component` and `Rel(...)` statements written in execution order (Mermaid numbers them by statement order).

For **object lifecycle** scenarios use a PlantUML state machine instead:

````markdown
```plantuml
@startuml
title Example object lifecycle
hide empty description
' Replace the Example* state names and the events on each transition.

[*] --> ExampleInitial

ExampleInitial --> ExampleNext : example triggering event
ExampleNext --> ExampleSuccess : example success event
ExampleNext --> ExampleError : example error / timeout
ExampleSuccess --> [*]
ExampleError --> [*]
@enduml
```
````

---

### Section 7 — Deployment View (Mermaid C4Deployment)

````markdown
```mermaid
C4Deployment
  title Deployment diagram: Example System - Live
  accTitle: Deployment, Example System, live
  accDescr: Gateway, API service and database inside one cloud region.

  %% One diagram per environment. Nest Deployment_Node for region > cluster > runtime.
  Deployment_Node(cloud, "Example Cloud Region", "Example: AWS eu-central-1") {
    Deployment_Node(lbNode, "Example Load Balancer", "Example: ALB") {
      Container(lb, "Example Gateway", "Example: ALB listener", "Example: terminates TLS")
    }
    Deployment_Node(cluster, "Example Cluster", "Example: EKS") {
      Container(app, "Example API Service", "Example: Docker image", "Example: order handling logic")
    }
    Deployment_Node(dbNode, "Example Managed Database", "Example: RDS") {
      ContainerDb(db, "Example Database", "Example: PostgreSQL 16", "Example: stores orders")
    }
  }

  Rel(lb, app, "Forwards requests to", "HTTPS")
  Rel(app, db, "Reads and writes orders in", "TCP 5432")
```
````

### Section 7 — Deployment View (Mermaid architecture-beta)

For an infrastructure view with icons, `architecture-beta` (Mermaid 11.1+) draws groups, services and edges between `T`/`B`/`L`/`R` ports. Built-in icons: `cloud`, `database`, `disk`, `internet`, `server`; registered iconify packs add vendor icons. Its edges carry no documented labels, so name protocols and ports in the building-block mapping table instead. Syntax: https://mermaid.js.org/syntax/architecture.html.

````markdown
```mermaid
architecture-beta
  accTitle: Example infrastructure — replace with the real environment
  accDescr: Requests enter through the load balancer, reach the app cluster and are stored in the database.

  %% One diagram per environment. Groups are network zones or accounts; services are infrastructure elements.
  service internet(internet)[Example Internet]
  group region(cloud)[Example Cloud Region]
  service lb(server)[Example Load Balancer] in region
  service app(server)[Example App Cluster] in region
  service db(database)[Example Database] in region

  internet:R --> L:lb
  lb:R --> L:app
  app:R --> L:db
```
````

When you need full UML deployment notation (artifacts, stereotypes), use PlantUML:

````markdown
```plantuml
@startuml
title Example deployment — replace with the real environment
' Replace every "Example ..." name and every example protocol/port.

node "Example Load Balancer" as lb {
  artifact "Example: Nginx"
}

node "Example Application Server" as app {
  artifact "Example: order-service (Docker)"
}

database "Example Primary Database" as db {
  artifact "Example: PostgreSQL"
}

node "Example Cache" as cache {
  artifact "Example: Redis"
}

cloud "Example Managed Services" as cloud {
  artifact "Example: S3 / SQS"
}

lb  --> app   : "Forwards requests to (HTTPS)"
app --> db    : "Reads and writes orders in (TCP 5432)"
app --> cache : "Caches sessions in (TCP 6379)"
app --> cloud : "Stores documents in (SDK/HTTPS)"
@enduml
```
````

---

### Section 8 — Cross-cutting: domain model (Mermaid class diagram)

````markdown
```mermaid
classDiagram
  accTitle: Domain model — replace with the real domain
  accDescr: The core domain entities and their relationships.
  %% Replace the Example* classes, attributes and types with real domain concepts.
  class ExampleEntityA {
    +UUID id
    +String exampleField
    +exampleMethod() ExampleReturnType
  }

  class ExampleEntityB {
    +UUID id
    +String exampleField
  }

  class ExampleValueObject {
    +String exampleField
  }

  ExampleEntityA "1" --> "*" ExampleEntityB : owns
  ExampleEntityA --> ExampleValueObject : contains
```
````

For a **database schema** view, use a Mermaid ER diagram instead:

````markdown
```mermaid
erDiagram
  accTitle: Data model — replace with the real schema
  accDescr: Tables and the keys that link them.
  %% Replace the EXAMPLE_* tables, columns and types with the real schema.
  EXAMPLE_TABLE_A {
    uuid id PK
    string example_column
    uuid example_table_b_id FK
  }

  EXAMPLE_TABLE_B {
    uuid id PK
    string example_column
  }

  EXAMPLE_TABLE_B ||--o{ EXAMPLE_TABLE_A : "is referenced by"
```
````
