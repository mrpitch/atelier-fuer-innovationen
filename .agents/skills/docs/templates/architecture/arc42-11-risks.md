---
type: explanation
title: 'Risks and Technical Debts'
arc42_section: 11
description: '<!-- One sentence: current risk and tech-debt landscape for this system. -->'
tags: [architecture, risks]
status: draft
generated:
  by: <!-- tool/model, e.g. claude-code/claude-opus-5-5 -->
  at: <!-- YYYY-MM-DDTHH:MM:SSZ -->
links: []
---

# Risks and Technical Debts

<!-- A living document. Update after significant architectural events or discoveries.
     Order by priority (likelihood × impact) and give each item a suggested measure.
     Every RISK-xx named in a §9 ADR's "Risks created" line must exist here (arc42-lint RULE-4).
     Be honest — this is internal documentation. -->

## Risk register

| ID      | Risk                                                  | Likelihood   | Impact       | Suggested measure        | Status         |
| ------- | ----------------------------------------------------- | ------------ | ------------ | ------------------------ | -------------- |
| RISK-01 | <!-- e.g. Single point of failure in auth service --> | high/med/low | high/med/low | <!-- mitigation plan --> | open/mitigated |
| RISK-02 | <!-- e.g. No automated rollback -->                   | med          | high         | <!-- mitigation plan --> | open           |

## Technical debts

| ID    | Debt item                                                | Affected building block (§5) | Estimated effort | Priority     |
| ----- | -------------------------------------------------------- | ---------------------------- | ---------------- | ------------ |
| TD-01 | <!-- e.g. Missing integration tests for payment flow --> | <!-- payments -->            | <!-- 2 days -->  | high/med/low |
| TD-02 | <!-- e.g. Hard-coded config values in three services --> | <!-- ops -->                 | <!-- 1 day -->   | med          |

## Mitigations in progress

<!-- What is actively being worked on? Link to issues/tickets where available. -->

- <!-- RISK-01: redundant auth service deployment — tracked in #123 -->
