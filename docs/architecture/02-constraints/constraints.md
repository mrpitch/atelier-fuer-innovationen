---
type: reference
title: 'Architecture Constraints'
arc42_section: 2
description: 'Technical, organisational, and convention constraints that narrow the solution space.'
tags: [architecture, constraints]
status: draft
generated:
  by: docs-bootstrap/1.0.0
  at: 2026-11-05T10:56:40Z
links: []
---

# Architecture Constraints

<!-- Anything that restricts design freedom. arc42: constraints "must always be dealt with;
     they may be negotiable, though" — record why each applies and who could change it.
     Blocking: yes only if violating it must stop a merge (P0: VALIDATE reports it as merge-blocking). -->

## Technical constraints

| Constraint                     | Background                                    | Owner / can change | Blocking |
| ------------------------------ | --------------------------------------------- | ------------------ | -------- |
| <!-- e.g. Must run on AWS -->  | <!-- why: cost agreement / existing infra --> | <!-- who -->       | no       |
| <!-- e.g. Java 17 LTS only --> | <!-- why: enterprise support policy -->       | <!-- who -->       | no       |

## Organizational and political constraints

| Constraint                         | Background                 | Owner / can change | Blocking |
| ---------------------------------- | -------------------------- | ------------------ | -------- |
| <!-- e.g. Team of 4 engineers -->  | <!-- staffing decision --> | <!-- who -->       | no       |
| <!-- e.g. Data stays in the EU --> | <!-- GDPR / contract -->   | <!-- who -->       | yes      |

## Conventions

| Convention                                   | Background                     | Owner / can change | Blocking |
| -------------------------------------------- | ------------------------------ | ------------------ | -------- |
| <!-- e.g. Conventional Commits -->           | <!-- code-review agreement --> | <!-- who -->       | no       |
| <!-- e.g. English-only code and comments --> | <!-- distributed team -->      | <!-- who -->       | no       |
