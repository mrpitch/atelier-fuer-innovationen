---
type: reference
title: 'Quality Requirements'
arc42_section: 10
description: '<!-- One sentence: measurable quality scenarios for this system. -->'
tags: [architecture, quality]
status: draft
generated:
  by: <!-- tool/model, e.g. claude-code/claude-opus-5-5 -->
  at: <!-- YYYY-MM-DDTHH:MM:SSZ -->
links:
  - 01-goals/introduction-and-goals.md
---

# Quality Requirements

<!-- All quality requirements as testable scenarios. The top goals live in §1.2 — reference
     them here, don't restate them. §10 also holds the lesser (nice-to-have) requirements.
     Every Q42 tag used in §1.2 needs at least one scenario here (arc42-lint RULE-3). -->

## Quality Requirements Overview

| Q42 tag    | Requirement                                   | Scenarios | Priority |
| ---------- | --------------------------------------------- | --------- | -------- |
| #reliable  | <!-- §1.2 goal 1, or a lesser requirement --> | QS-01     | High     |
| #secure    | <!-- -->                                      | QS-02     | High     |
| #efficient | <!-- -->                                      | QS-03     | Medium   |

## Quality Scenarios

<!-- Q42 short form (default). THOROUGH bundles may use the SEI long form instead:
     Source, Stimulus, Environment, Artifact, Response, Response Measure.
     Kind: usage (runtime behaviour) or change (modifying the system). IDs never get renumbered. -->

### QS-01: <!-- e.g. Survive a database failover -->

**Quality property:** #reliable · **Kind:** usage · **Priority:** High

- **Context / Background:** <!-- e.g. primary database in zone A fails during business hours -->
- **Source / Stimulus:** <!-- e.g. the cloud provider terminates the primary instance -->
- **Metric / Acceptance criteria:** <!-- e.g. writes resume within 30 s, no committed payment lost -->

### QS-02: <!-- e.g. Reject unauthenticated access -->

**Quality property:** #secure · **Kind:** usage · **Priority:** High

- **Context / Background:** <!-- -->
- **Source / Stimulus:** <!-- -->
- **Metric / Acceptance criteria:** <!-- e.g. HTTP 401 within 50 ms, no data in the response -->

### QS-03: <!-- e.g. Add a payment method -->

**Quality property:** #efficient · **Kind:** change · **Priority:** Medium

- **Context / Background:** <!-- -->
- **Source / Stimulus:** <!-- -->
- **Metric / Acceptance criteria:** <!-- -->

## Aspirational scenarios

<!-- THOROUGH only. Targets that are not yet measured. Each row needs a RISK-xx entry in §11
     (arc42-lint RULE-5). Example row (replace NN with a real ID):
     | QS-NN | p99 < 200 ms at 5k req/s | not measured | RISK-NN | -->

| ID  | Target | Current state | Tracked as |
| --- | ------ | ------------- | ---------- |
