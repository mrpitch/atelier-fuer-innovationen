# docs arch migrate — import existing documentation

**Entry:** the user has documentation in another form — Confluence export, Word or Google Doc, wiki pages, flat Markdown or README files, plain-text notes — and wants it in the arc42 bundle. A bundle root exists (else run [generate](./generate.md) first) and the source is accessible (pasted, a path, or a URL). Source material that is code, not prose, belongs to [code-to-docs](./code-to-docs.md). Rules for every file written: [non-negotiables](../../references/architecture/non-negotiables.md).

## Steps

1. **Identify the source.** Ask: the source format; single document or many pages; a full architecture write-up or partial ("a README and a deployment runbook").

2. **Parse and classify.** Work silently through all three parts, then present one complete mapping table. Ask nothing before step 3.
   1. *arc42 section* for each heading or major block, using the defaults in [arc42-sections.md](../../references/architecture/arc42-sections.md). When ambiguous, pick the best fit and note the uncertainty.
   2. *Type* for each block with the 2-axis classifier in [framework.md](../../references/framework.md): why choices were made → explanation; options, values, configurations → reference; guides a task → how-to; teaches from scratch → tutorial (rare in arch docs). Decisions with context and alternatives → `adr`. Operator procedures tied to a trigger → `runbook`.
   3. *Path*: architecture content `<section-slug>/<kebab-title>.md`; ADRs per the ADR placement rule; runbooks `docs/runbook/<name>.md`. A block that does not clearly map gets `<!-- UNCERTAIN: arc42 section — suggest [N] -->` and a proposed placement.

3. **Present the mapping table and wait.** Show every row, then ask: "Does this mapping look right? Anything you'd place differently before I create the files?" Write no file until the user confirms.

   ```
   Source heading                 → section         → type        → path
   "System Overview"              → 01-goals        → explanation → 01-goals/system-overview.md
   "Infrastructure Requirements"  → 02-constraints  → reference   → 02-constraints/infra-constraints.md
   "Deployment to Production"     → 07-deployment   → how-to      → 07-deployment/deploy-to-production.md
   "Why we chose PostgreSQL"      → 09-decisions    → adr         → 09-decisions/adr-0001-postgresql.md
   "Failover procedure"           → runbook         → runbook     → docs/runbook/db-failover.md
   "Data Pipeline (unclear)"      → ??? 05-building-blocks? → reference → 05-building-blocks/data-pipeline.md ⚠
   ```

4. **Create the files.** For each confirmed row:
   1. Create the file with frontmatter:

      ```yaml
      ---
      type: explanation | how-to | reference | tutorial | adr   # `runbook` only for files under docs/runbook/
      title: <title from source heading>
      description: <one-sentence summary of content>
      arc42_section: <integer 1–12>   # architecture content only
      status: draft
      generated:
        by: <producer>/<version>
        at: <now, UTC ISO 8601>
      sources:
        - resource: <URL or path of the source page/document>
          title: <source title>
      ---
      ```

   2. Write the source content as the body, cleaned up: drop format artefacts (Confluence macros, HTML tags, Word formatting), convert tables and lists to clean Markdown, keep diagrams as image references or flag them `<!-- DIAGRAM NEEDED -->`.
   3. Uncertain placements get `<!-- UNCERTAIN: type unconfirmed — may need reclassification -->` at the top; for an uncertain arc42 section, list the question in the hand-off.
   4. ADRs go through the [adr operation](./adr.md): restructure into MADR, keep all original rationale text.
   5. Link each file from its section `index.md`, creating the `index.md` when missing.
   6. Log: `- **Creation**: <path> — migrated "<title>" from <source format>`.

5. **Check.** Every created file has `generated` and a `sources` entry pointing at its origin. Run `python {baseDir}/scripts/architecture/validate.py <bundle-root>` and fix frontmatter or link errors; run `python {baseDir}/scripts/architecture/arc42-lint.py <bundle-root>` when the bundle has enough content for cross-section checks (sections 3, 5, 9, 10, 11).

6. **Flag gaps.** Deliver an explicit list:
   - arc42 sections that received no content (still stubs);
   - sections with sparse coverage (§5 has a component list but no descriptions, §9 has no alternatives);
   - source content that could not be placed, each with the question "Where should this go, or should it be discarded?" (work items for them go to the issue tracker on request).

   Close with: "These sections still need manual authoring — the migration could not derive this content from the source: [list]."

**Done when:** the user confirmed the mapping table before any file was written; all confirmed source content exists at its mapped path with `sources` and a `generated` stamp; `validate.py` exits 0; the gap list is delivered; non-negotiables are applied.
