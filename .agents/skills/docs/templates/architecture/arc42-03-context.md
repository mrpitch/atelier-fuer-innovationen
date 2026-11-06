---
type: explanation
title: 'Context and Scope'
arc42_section: 3
description: '<!-- One sentence: what is inside this system and what is outside. -->'
tags: [architecture, context]
status: draft
generated:
  by: <!-- tool/model, e.g. claude-code/claude-opus-5-5 -->
  at: <!-- YYYY-MM-DDTHH:MM:SSZ -->
links:
  - 03-context/interface-table.md
---

# Context and Scope

<!-- What is inside the system boundary? What is outside?
     Two perspectives: business (domain language) and technical (protocols). -->

## Business context

<!-- Diagram or description of the system and its external actors/systems
     using domain language only — no protocols, no technologies. -->

| External entity           | Communication            | Direction |
| ------------------------- | ------------------------ | --------- |
| <!-- User -->             | <!-- uses the portal --> | → System  |
| <!-- Payment provider --> | <!-- payment status -->  | ← System  |

## Technical context

<!-- Communication channels and interfaces with technology details.
     If substantial, extract to a separate reference file:
     [Interface table](./interface-table.md) -->

<!-- Give every interface a stable IF-xx ID; §5 must reference the same IDs (arc42-lint RULE-1). -->

| ID    | External system       | Interface / Protocol | Data format          | Direction |
| ----- | --------------------- | -------------------- | -------------------- | --------- |
| IF-01 | <!-- Auth service --> | <!-- REST/HTTPS -->  | <!-- JWT -->         | ↔         |
| IF-02 | <!-- Message bus -->  | <!-- AMQP -->        | <!-- JSON events --> | ←         |

## System boundary notes

<!-- What is explicitly out of scope? Why? -->
