---
type: Agent Instructions
---

# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to the actual label strings used in this repo's issue tracker.

| Label in mattpocock/skills | Label in our tracker | Meaning                                  |
| --------------------------- | --------------------- | ----------------------------------------- |
| `needs-triage`               | `needs-triage`         | Maintainer needs to evaluate this issue   |
| `needs-info`                 | `needs-info`           | Waiting on reporter for more information  |
| `ready-for-agent`            | `afk`                  | Fully specified, ready for an AFK agent   |
| `ready-for-human`            | `hitl`                 | Requires human implementation             |
| `wontfix`                    | `wontfix`               | Will not be actioned                      |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label string from this table.

Edit the right-hand column to match whatever vocabulary you actually use.

This repo also uses the epic/afk implementation workflow (`docs/agents/implementation-workflow.md`); its `afk_label`/`hitl_label` fields default to reusing the `ready-for-agent`/`ready-for-human` strings above — edit them there, not here, if you want execution-autonomy tracked separately from triage-readiness.
