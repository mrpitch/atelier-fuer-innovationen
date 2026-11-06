# docs arch converge — check whether the code matches the documentation

**Entry:** the user asks whether the code still matches the architecture docs: "converge docs", "our docs say Redis but we switched to Valkey", "does the code match", "doc drift", "verify docs against code". Reads the bundle's verifiable structural claims and probes the code to find gaps. Rules for files written (verified stamps, log entry): [non-negotiables](../../references/architecture/non-negotiables.md).

## Gap taxonomy

| Gap type       | Meaning                                                                                    | Default tier |
| -------------- | ------------------------------------------------------------------------------------------ | ------------ |
| `GHOST`        | Documented but absent from code (removed component, changed interface, dropped dependency) | P1           |
| `UNDOCUMENTED` | Present in code but not in docs (new module, new external dep, new deployment target)      | P2           |
| `DRIFTED`      | Documented but inaccurately (wrong name, wrong tech, changed endpoint path)                | P1           |
| `UNVERIFIABLE` | Claim can't be checked statically (SLA, runtime behavior, external system property)        | P3           |

Severity: `CRITICAL` (structural claim entirely wrong — a whole component or interface; reported as P0, merge-blocking) · `HIGH` (named claim clearly wrong) · `MEDIUM` (partial drift — outdated version, minor interface mismatch) · `LOW` (trivial naming inconsistency). Tier definitions: [architecture-guard.md](../../references/architecture/architecture-guard.md#non-blocking-model-and-severity-tiers).

## Steps

1. **Load the bundle, scoped.** Read the root `index.md` for `detail_level` and `domain_profile`, then only the sections that hold verifiable structural claims:

   | arc42 section      | Content to extract                                        |
   | ------------------ | --------------------------------------------------------- |
   | §3 Context         | External systems, IF-xx interface IDs, actor names        |
   | §4 Strategy        | Tech stack, key frameworks, architectural approach        |
   | §5 Building blocks | Component/module names, responsibilities, interfaces      |
   | §7 Deployment      | Environments, deployment targets, infrastructure          |
   | §8 Cross-cutting   | Patterns in use (auth, logging, error handling, i18n)     |
   | §9 ADRs            | Accepted decisions — what technology/approach was adopted |

   Skip §1, §6, §10, §11, §12: goals, scenarios and glossary terms cannot be verified from code.

2. **Build the claims inventory.** One claim per verifiable statement, each with: `id` (stable key, e.g. `§3/IF-01`, `§5/PaymentService`, `§4/postgresql`), `section`, `claim` (the exact doc statement), `artifact` (what in the code should reflect it: path pattern, package name, config key). Bound the scope strictly to what the docs assert: named components and explicit technology references. Present the inventory before probing:

   ```
   ## Claims Inventory

   | ID | Section | Claim | Expected artifact |
   |----|---------|-------|-------------------|
   ```

3. **Probe the codebase** within the scope set by the bundle's paths and component names:

   | Claim type                 | Verification method                                                |
   | -------------------------- | ------------------------------------------------------------------ |
   | Component / module         | grep for class/function/directory name; check import graph         |
   | External interface (IF-xx) | grep for endpoint URL, client library, env var name                |
   | Technology / dependency    | check package.json / requirements.txt / go.mod / pom.xml / Gemfile |
   | Deployment target / env    | check Dockerfile, Helm values, CI env vars, .env.example           |
   | Cross-cutting pattern      | grep for logging library name, auth middleware, i18n framework     |
   | ADR adoption               | verify the decided technology is actually imported/used            |

   Mark each claim `VERIFIED` · `GHOST` · `UNDOCUMENTED` · `DRIFTED` · `UNVERIFIABLE`. For `UNDOCUMENTED`, scan for code-level structures (modules, dependencies, deployment targets) present in the code and absent from the sections read in step 1, and add them as findings.

4. **Present findings; write nothing yet.**

   ```
   ## Convergence Findings

   | ID | Section | Gap Type | Severity | Claim | Evidence |
   |----|---------|----------|----------|-------|----------|

   ## Summary

   - Claims checked: N
   - Verified: N
   - GHOST: N
   - DRIFTED: N
   - UNDOCUMENTED: N
   - UNVERIFIABLE: N
   - CRITICAL: N  HIGH: N  MEDIUM: N  LOW: N
   ```

5. **Stamp confirmed concepts** (after the user has reviewed the findings; skip when the user only wanted the report). For every concept whose claims all came back `VERIFIED`, add or extend `verified` with `{ by: <producer>/<version>, at: <now, UTC ISO 8601> }` — a machine confirmation against the code. `generated` stays untouched because the content did not change.

6. **Offer work items.** Fixing a gap goes through [edit](./edit.md): GHOST and DRIFTED correct or remove the claim, UNDOCUMENTED adds the missing content, UNVERIFIABLE marks the claim unverifiable or removes it, as the user decides. When the user wants the gaps tracked, file the approved rows in the configured issue tracker through `to-tickets`, using this question or task per gap:

   | Gap type       | Question / task                                                              |
   | -------------- | ---------------------------------------------------------------------------- |
   | `GHOST`        | "Does this still exist, or should the documentation be updated?"             |
   | `DRIFTED`      | "Is the documented claim correct, or has the implementation changed?"        |
   | `UNDOCUMENTED` | "Generate a stub for this component/interface at the correct arc42 section." |
   | `UNVERIFIABLE` | "Can this claim be verified and how?"                                        |

   A `CRITICAL` gap is reported as merge-blocking (P0), not filed as an optional item. After any write, log `- **Update**: CONVERGE — N gaps found (G ghost, D drifted, U undocumented, UV unverifiable)` in the bundle `log.md`.

**Done when:** the claims inventory was presented, every claim was probed, the findings table and summary metrics were delivered, and the user decided on the `verified` stamps and the work items; whatever they confirmed was written (stamps, tracker items, `log.md`).
