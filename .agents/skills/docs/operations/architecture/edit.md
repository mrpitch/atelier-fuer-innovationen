# docs arch edit — change or add content in an existing bundle

**Entry:** the user wants to update, correct or extend an existing bundle, or asks where new content belongs (a runbook, a concept, a procedure). Rules for every file written: [non-negotiables](../../references/architecture/non-negotiables.md).

## Steps

1. **Locate** the concept through the `index.md` files: root, then section, then concept (progressive disclosure; never load the whole bundle).
2. **Change** it. A reference to a file, service or endpoint that no longer exists is reported to the user, never fixed silently — they may know it is coming back.
3. **New file?** Decide where it lives and what it is, then confirm both with the user:
   - Architecture content: arc42 section from the defaults in [arc42-sections.md](../../references/architecture/arc42-sections.md), and one type (`tutorial | how-to | reference | explanation`) per [framework.md](../../references/framework.md).
   - An ADR: hand over to the [adr operation](./adr.md).
   - An operator procedure tied to a trigger (failover, rollback): `docs/runbook/<name>.md` with `type: runbook`, linked from the relevant section (usually §7). It is not an architecture concept.

   Create `<section-slug>/<kebab-title>.md`: body structure from the matching type template in [templates.md](../../references/templates.md), frontmatter from the section template `arc42-NN-*.md` in [templates/architecture/](../../templates/architecture/) (pre-filled `arc42_section`, `tags`, `generated`). Link it from the parent `index.md`, and cross-link it from related concepts.
4. Update the affected `index.md` when files were added or removed.

Example: "Here's our incident runbook for database failover." → `docs/runbook/db-failover.md`, `type: runbook`, linked from `07-deployment/deployment-topology.md`.

**Done when:** the change is made, non-negotiables are applied, new files are linked from their parent `index.md` and from related concepts, and stale references are reported.
