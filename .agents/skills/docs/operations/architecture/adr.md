# docs arch adr — record an architecture decision

**Entry:** the user states a decision ("we decided to use X", "log our choice of Y"), changes one ("X is deprecated", "Y supersedes Z"), or extends an existing record. One decision is one file in [MADR 4](https://adr.github.io/madr/) format. Accepted ADRs are immutable: update the status, never rewrite the rationale. Rules for every file written: [non-negotiables](../../references/architecture/non-negotiables.md), including its ADR placement rule.

## Steps

1. **Identify the trigger.**

   | User says…                                                        | Action                                                   |
   | ----------------------------------------------------------------- | -------------------------------------------------------- |
   | "record a decision", "we decided to use X", "log our choice of Y" | Create a new ADR                                         |
   | "we changed our mind", "X is deprecated", "Y supersedes Z"        | Update the old ADR's status and create the superseding ADR |
   | "add context to ADR-007", "expand the alternatives"               | Update the existing ADR                                  |

   A status-only change edits the frontmatter `status:` and `date:` of the existing ADR and nothing else.

2. **Number and slug.** List the ADR folder (placement rule in non-negotiables: `docs/architecture/09-decisions/` when a bundle exists, else `docs/adr/`), take the highest number and add 1 (`adr-0008-…`). Derive a short kebab-case slug (4–6 words): "Use PostgreSQL as primary database" → `adr-0008-use-postgresql-as-primary-database.md`. Keep the file-name prefix the folder already uses. A missing `09-decisions/` is created with an `index.md` first.

3. **Fill the template.** Copy [arc42-09-adr.md](../../templates/architecture/arc42-09-adr.md) to the ADR folder as `<slug>.md`. It is MADR 4 plus two extensions of this skill:
   - `**Risks created:**` — the RISK-xx IDs this decision introduces. `arc42-lint.py` Rule 4 checks that each exists in §11; write `none` rather than deleting the line.
   - `blocking: true` — set when violating the decision must block a merge. VALIDATE reports such violations as P0; no script reads the flag.

   Rules:
   - `type: adr`; inside a bundle also `arc42_section: 9`.
   - `status:` is `proposed | rejected | accepted | deprecated | superseded by ADR-NNNN` (MADR vocabulary, never `draft | stable`). New ADRs start `proposed` unless the user says the decision is already made.
   - `date:` is when the decision was last updated; `decision-makers`, `consulted`, `informed` name people or roles. Ask for them; never invent names.
   - List every option seriously considered, at least one besides the chosen one, so the record shows what was rejected and why.
   - Fill **Decision Drivers** from §1.2 quality goals (Q42 tags, QS-xx) and §2 constraints, and **Confirmation** with the check that enforces the decision (ArchUnit / dependency-cruiser fitness function, CI rule, review step).
   - Keep optional MADR sections (Decision Drivers, Consequences, Confirmation, Pros and Cons, More Information) only when they carry content.
   - After drafting, prompt for implications: which §1.2 quality goals it supports or compromises (see [q42-quality-model.md](../../references/architecture/q42-quality-model.md)) and which RISK-xx entries it creates in §11. When the user cannot say, leave that item as a placeholder and list the question in the hand-off ("Which §1.2 quality goals does ADR-NNNN support or compromise?").

4. **Index and log.** Add the ADR to the ADR folder's `index.md` as `- [ADR-XXXX: Title](adr-xxxx-<slug>.md) — \`accepted\` — <the ADR's description>`, then log `- **Creation**: <folder>/adr-xxxx-<slug>.md — ADR-XXXX <title>`. Outside a bundle, refresh the docs index instead (`npx tsx {baseDir}/scripts/generate-index.ts <docs_root>`).

5. **Link.**
   - Superseding an ADR: set the old ADR's `status:` to `superseded by ADR-XXXX`, update its `date:`, and add a link to the new ADR under its **More Information**; its rationale stays untouched.
   - A decision that shapes a specific arc42 section (say, a technology choice in the deployment view): add a cross-reference in that section's concept file.

6. Apply [non-negotiables](../../references/architecture/non-negotiables.md) to every file touched.

**Done when:** the ADR sits in the ADR folder with `type: adr`, a MADR `status`, and every option and consequence filled; it is linked from that folder's `index.md`; a superseded ADR carries `superseded by ADR-XXXX`; non-negotiables are applied.
