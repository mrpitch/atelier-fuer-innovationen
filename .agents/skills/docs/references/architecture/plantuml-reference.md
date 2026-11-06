# PlantUML — Architecture Diagram Reference

Load this file when: the required diagram type is not supported by Mermaid, when full UML notation (history states, activity swimlanes with forks, UML deployment nodes and artifacts, component interfaces) is needed, or when a C4 diagram needs a legend, tags or layout control (C4-PlantUML).

For diagram selection, tool rules, and Mermaid scaffolds, return to [diagrams.md](./diagrams.md).

---

## When to use PlantUML over Mermaid

Use PlantUML — not Mermaid — for:

| Diagram need                                                    | PlantUML type |
| --------------------------------------------------------------- | ------------- |
| UML deployment (nodes, artifacts, stereotypes, icon libraries)  | Deployment    |
| C4 with legend, tags, `Lay_*` layout hints, sprites             | C4-PlantUML   |
| State machine with history states (`[H]`, `[H*]`)               | State         |
| Activity diagram with swimlanes and parallel fork/join together | Activity      |
| UML Component with provided/required interfaces                 | Component     |
| Complex sequence with `delay`, `divider`                        | Sequence      |

Mermaid covers simpler cases of several of these: `C4Deployment` and `architecture-beta` for deployment topology, guards as transition labels plus `<<fork>>`/`<<join>>` in `stateDiagram-v2`, `swimlane-beta` for lanes, `usecase-beta` for use cases (see [mermaid-reference.md](./mermaid-reference.md)). Default to Mermaid for everything else.

---

## Rendering options

| Environment    | How to render                                                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Local (any OS) | `java -jar plantuml.jar -tsvg <file.puml>` (download plantuml.jar; needs Java)                                                         |
| VS Code        | PlantUML extension (jebbs.plantuml) — preview with Alt+D                                                                               |
| GitLab         | Inline ` ```plantuml ` blocks via the PlantUML or Kroki integration (PlantUML is enabled on GitLab.com; admins enable it self-managed) |
| Kroki          | HTTP rendering service (kroki.io or self-hosted) for PlantUML, C4-PlantUML and other text diagram formats                              |
| CI (any)       | Run plantuml.jar or the `plantuml/plantuml` Docker image in a job; output SVG                                                          |
| Confluence     | PlantUML for Confluence plugin; or embed rendered SVG                                                                                  |

For docs-as-code: prefer inline rendering (GitLab PlantUML/Kroki) so the `.puml` source is the only artifact. Where the host cannot render inline (e.g. GitHub), render in CI and commit SVG — not PNG — next to the `.puml` source, and link it from the concept file.

Structurizr is not a PlantUML renderer: it is a separate C4 modelling tool (Structurizr DSL) that can export views to PlantUML and Mermaid. Structurizr Lite, on-premises and cloud service are end of life; the current offering is the free local commands plus a licensed server.

---

## C4-PlantUML (arc42 Sec 3/5/7, when Mermaid C4 is not enough)

Use C4-PlantUML when the C4 diagram needs a legend, tags or explicit layout. It also provides `C4_Dynamic` and `C4_Deployment` for dynamic and deployment views.

```
@startuml
!include <C4/C4_Container>
' The stdlib ships the last released C4-PlantUML. For the latest, include
' https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Container.puml

AddElementTag("legacy", $bgColor="#8c8c8c", $fontColor="#ffffff")

Person(user, "Customer", "Places orders")
System_Boundary(sys, "Order System") {
  Container(spa, "Web App", "TypeScript / React", "Customer UI")
  Container(api, "Order API", "Java / Spring Boot", "Business logic")
  ContainerDb(db, "Orders DB", "PostgreSQL", "Orders and invoices")
}
System_Ext(erp, "ERP", "Finance system", $tags="legacy")

Rel(user, spa, "Uses", "HTTPS")
Rel(spa, api, "Calls", "JSON/HTTPS")
Rel_R(api, db, "Reads / writes", "JDBC")
Rel_D(api, erp, "Posts invoices", "SOAP")
Lay_R(spa, api)

SHOW_LEGEND()
@enduml
```

Includes: `<C4/C4_Context>`, `<C4/C4_Container>`, `<C4/C4_Component>`, `<C4/C4_Dynamic>`, `<C4/C4_Deployment>`. `Rel_U/D/L/R` set a direction; `Lay_U/D/L/R(a, b)` positions elements without a relationship; `AddElementTag` / `AddRelTag` style elements and appear in the legend; `SHOW_LEGEND()` draws the legend from what is used.

---

## Deployment diagram (arc42 Sec 7)

```
@startuml

node "Load Balancer" as lb {
  artifact "nginx / ALB"
}

node "Application Server" as app {
  artifact "Service Name\n(Docker / K8s pod)"
}

database "Primary Database" as db {
  artifact "PostgreSQL / RDS"
}

node "Cache" as cache {
  artifact "Redis"
}

cloud "Managed Services" as cloud {
  artifact "S3 / SQS / EventBridge"
}

lb  --> app   : HTTPS
app --> db    : TCP 5432
app --> cache : TCP 6379
app --> cloud : SDK / HTTPS

@enduml
```

For multiple environments, wrap each in a separate `node "Environment Name" {}` block. For AWS icons, add `!include <awslib20/AWSCommon>` plus the service files you use (e.g. `!include <awslib20/Compute/EC2>`).

---

## State machine (arc42 Sec 6, object lifecycle with guards)

```
@startuml
hide empty description

[*] --> Pending

Pending --> Processing : orderPlaced [paymentValid]
Pending --> Cancelled : cancelRequested

Processing --> Shipped : stockAllocated [carrierConfirmed]
Processing --> Failed : stockUnavailable
Processing --> Processing : retryPayment [retryCount < 3]

Shipped --> Delivered : deliveryConfirmed
Shipped --> Returned : returnRequested

Delivered --> [*]
Cancelled --> [*]
Failed --> [*]
Returned --> [*]

state Processing {
  [*] --> ValidatingPayment
  ValidatingPayment --> AllocatingStock : paymentOK
  AllocatingStock --> [*]
}

@enduml
```

Guard syntax: `Event [condition]` on a transition. History states: `[H]` (shallow), `[H*]` (deep) inside a composite state.

---

## Activity diagram with swimlanes (arc42 Sec 6 / Sec 8, workflows)

```
@startuml

|User|
start
:Submit order;

|Payment Service|
:Validate payment;

if (Payment valid?) then (yes)
  :Charge card;
  |Inventory Service|
  fork
    :Allocate stock;
  fork again
    :Send confirmation email;
  end fork
  |User|
  :Receive confirmation;
  stop
else (no)
  |User|
  :Show error;
  stop
endif

@enduml
```

Swimlane syntax: `|Lane Name|` switches the current lane. `fork` / `fork again` / `end fork` creates parallel branches.

---

## Component diagram with interfaces (arc42 Sec 5)

```
@startuml

package "Order Service" {
  [OrderController] as ctrl
  [OrderService] as svc
  [OrderRepository] as repo
}

interface "IOrderService" as IOS
interface "IOrderRepository" as IOR

ctrl -( IOS
svc - IOS
svc -( IOR
repo - IOR

database "PostgreSQL" as db
repo --> db : SQL

@enduml
```

Provided interface: `Component - InterfaceName` (lollipop). Required interface: `Component -( InterfaceName` (socket).

---

## Sequence diagram (arc42 Sec 6, when Mermaid is insufficient)

```
@startuml

actor User as U
participant "API Gateway" as GW
participant "Auth Service" as Auth
participant "Order Service" as OS
database "DB" as DB

U -> GW: POST /orders
GW -> Auth: validateToken(jwt)
Auth --> GW: {userId, roles}

group happy path
  GW -> OS: createOrder(request, userId)
  OS -> DB: INSERT order
  DB --> OS: OK
  OS --> GW: {orderId, status}
  GW --> U: 201 Created
end

group auth failure
  GW -> Auth: validateToken(invalid)
  Auth --> GW: 401 Unauthorized
  GW --> U: 401 Unauthorized
end

note over OS, DB
  Wrapped in a database transaction.
  Rolled back on any error.
end note

@enduml
```

---

## Use case diagram (arc42 Sec 3, stakeholder interactions)

```
@startuml

left to right direction

actor Customer
actor "Payment Provider" as PP
actor Admin

rectangle "Order Management System" {
  usecase "Browse products" as UC1
  usecase "Place order" as UC2
  usecase "Process payment" as UC3
  usecase "Manage inventory" as UC4
  usecase "View reports" as UC5
}

Customer --> UC1
Customer --> UC2
UC2 ..> UC3 : <<include>>
PP --> UC3
Admin --> UC4
Admin --> UC5

@enduml
```

Prefer C4 Context over use case diagrams for stakeholder-facing overviews — use case diagrams are useful when the interaction detail matters more than the system boundary.

---

## Common PlantUML gotchas

| Issue                            | Cause                                                    | Fix                                                                                    |
| -------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Diagram renders blank            | Missing `@startuml` / `@enduml`                          | Always wrap the full diagram                                                           |
| `fork` or swimlanes not accepted | Diagram uses legacy activity syntax (`(*)`, `===bar===`) | Write the new syntax only — `start`, `:action;`, `stop` — and do not mix the two       |
| Activity lands in the wrong lane | The `\|Lane\|` switch comes after the activity           | Put the `\|Lane Name\|` switch before the first activity of that lane                  |
| Tangled or diagonal edges        | Default spline routing                                   | Add `skinparam linetype ortho`; for C4-PlantUML use `Rel_*` / `Lay_*` directions       |
| Cloud icons missing              | Icon library not included                                | Add `!include <awslib20/AWSCommon>` plus the service file (Azure, GCP: `azure`, `gcp`) |
| C4 macros unknown                | C4-PlantUML not included                                 | Add `!include <C4/C4_Container>` (or Context/Component/Dynamic/Deployment)             |
| Comment breaks the diagram       | HTML comment `<!-- -->` inside the diagram               | Use `'` for line comments, `/' ... '/` for block comments                              |
