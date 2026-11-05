# docs arch refresh — update docs after a system change

**Entry:** the system changed and the docs need a systematic update after a concrete trigger — not merely a staleness review ([validate](./validate.md) finds what is stale; refresh updates it). Triggers: infrastructure change (cloud migration, Kubernetes, new provider); architecture change (monolith → microservices, new integration, component split or merge); a major feature that moves the system boundary or component responsibilities; an incident post-mortem that exposed quality-goal gaps or missing constraints; an ADR superseded by a new decision. Rules for every file written: [non-negotiables](../../references/architecture/non-negotiables.md).

## Steps

1. **Scope the change.** Ask what changed, specifically, and map it to sections:

   | Change type                                      | Directly affected sections | Likely cascade                                                  |
   | ------------------------------------------------ | -------------------------- | --------------------------------------------------------------- |
   | Infrastructure change (cloud, provider, regions) | 7, 2                       | 1 (quality goals), 11 (risks)                                   |
   | New external system or integration               | 3, 5                       | 6 (runtime), 9 (ADR for integration choice)                     |
   | Component added, split, or removed               | 5                          | 3 (interfaces), 6 (runtime), 7 (deployment)                     |
   | Architectural pattern change                     | 4, 9                       | 5 (building blocks), 8 (crosscutting)                           |
   | Quality goal missed (incident post-mortem)       | 1, 10, 11                  | 9 (ADR if root cause was a bad decision)                        |
   | Constraint added or removed                      | 2                          | 4 (strategy), 9 (ADR if decision required)                      |
   | ADR superseded                                   | 9                          | 4 (strategy summary), and sections affected by the old decision |
   | New security requirement                         | 2, 8                       | 1 (quality goals if new), 10 (new scenario)                     |

   Have the user confirm which sections are in scope.

2. **Triage.** Classify each in-scope section's update and confirm the table with the user before changing anything:

   | Size            | Criteria                                                                                    | Action                                        |
   | --------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------- |
   | **TRIVIAL**     | Only a metric, value or date changed (a new AZ region, an updated uptime target)            | [edit](./edit.md) in place                    |
   | **MODERATE**    | Partial rewrite (a component added to §5, a new constraint row)                             | [edit](./edit.md) the specific concept files  |
   | **SIGNIFICANT** | Content is substantially wrong, or a new concept needs full authoring                       | [draft](./draft.md) the affected section(s)   |

   ```
   Section | Update Size | What Changes
   5 (Building Blocks) | SIGNIFICANT | OrderProcessor split into OrderService + PaymentGateway; new IF-03 interface to Stripe
   7 (Deployment) | MODERATE | Add new eu-west-1 region to deployment diagram
   9 (Decisions) | MODERATE | Create ADR-007 for the component split decision
   11 (Risks) | TRIVIAL | Update RISK-03 status to Mitigated
   ```

   When unsure between MODERATE and SIGNIFICANT, edit first; escalate to draft only when the existing content is too incomplete to patch.

3. **ADRs first.** A decision is ADR-worthy when it is hard to reverse, affects multiple components, or has non-obvious trade-offs. If so, run the [adr operation](./adr.md) before updating the affected sections: the ADR carries the rationale the other sections reference. When the user is unsure whether the change warrants an ADR, record the question ("Does {change} warrant a new ADR?") in the hand-off and continue with the other updates.

   If the change supersedes an ADR: create the new ADR first; set the old one to `superseded by ADR-NNNN` (ADRs keep MADR statuses); give concepts the change replaces outright `status: deprecated` instead of deleting them, so links to them still explain what happened; update §4 when it summarised the superseded decision.

4. **Apply updates** in this order:
   1. §9 ADRs
   2. §1, §2 — quality goals or constraints changed
   3. §3 — external interfaces changed (IF-xx IDs)
   4. §4, §5 — strategy, structure and decomposition
   5. §6 — scenarios now invalid or missing
   6. §7 — infrastructure topology
   7. §8 — patterns or security model
   8. §10, §11 — quality scenarios and risk register reflect the new reality

   Dispatch each by its triage size (step 2).

5. **Check cross-section consistency** after each section update:

   ```bash
   python {baseDir}/scripts/architecture/arc42-lint.py <bundle-root>
   ```

   The rules that most often break in a refresh:
   - **RULE-1** — IF-xx IDs changed in §3 but not in §5
   - **RULE-2** — a new or renamed §5 component missing from the §7 deployment mapping
   - **RULE-3** — a new §1 quality goal without a §10 scenario
   - **RULE-4** — a new §9 ADR creates risks not yet in §11
   - **RULE-5** — a new aspirational §10 scenario not tracked in §11

   Fix every reported error. A finding that is not auto-fixable goes to the user in the hand-off.

6. **Re-evaluate quality goals.** When the change affects observable behaviour, re-examine §1.2: are the goals still achievable with the new architecture? Did the incident show a goal being missed? Does the change add a quality concern that needs a goal? For each "yes", update §1.2, then cascade to §4 (approach), §10 (measurable scenario) and §11 (aspirational or at risk). A goal that may no longer be achievable and needs deeper analysis goes into the hand-off as "Re-evaluate §1.2 quality goal: {goal} after {change}".

7. Apply [non-negotiables](../../references/architecture/non-negotiables.md) to every file touched. Work items for open questions go to the configured issue tracker on request.

**Done when:** every triaged section is updated (TRIVIAL/MODERATE via edit, SIGNIFICANT via draft); new ADRs are recorded and superseded ones marked; `arc42-lint.py` exits 0; §1.2 reflects current reality; non-negotiables are applied; the user confirmed the refresh is complete.
