# Non-negotiables

Every `docs arch` operation that writes a file ends with these rules, stubs included. Operation files link here instead of repeating them.

## After every write

1. **Provenance stamp** — set `generated: { by: <producer>/<version>, at: <now, UTC ISO 8601> }` on every concept you create or substantively change. Staleness detection and provenance depend on it. Keep `description` in step with the body. Actor forms are in [okf-spec.md](./okf-spec.md#actor-convention-generatedby-verifiedby); a human `generated.by` is never written on someone's behalf.
2. **Change log** — add `- **Creation** | **Update** | **Deprecation**: <path> — <one line>` under today's `## YYYY-MM-DD` heading at the top of the nearest `log.md` (create the heading when missing). The log is the team's change history; a skipped entry is an invisible gap.
3. **Formatting** — run `npx prettier --write <file>` when the repo has Prettier (a `prettier` dependency or a Prettier config file). Without Prettier, skip this step.
4. **Sources** — every concept derived from code or imported from another document carries `sources` with one `resource:` entry (repo-relative path or URL) per origin, so each claim can be traced and re-checked by [converge](../../operations/architecture/converge.md).

## Placement

- **ADRs** — when `docs/architecture/` exists, ADRs live only in `docs/architecture/09-decisions/`; otherwise in `docs/adr/`. ADR frontmatter is `type: adr` with MADR `status`.
- **Runbooks** — always in `docs/runbook/` with `type: runbook`. Link them from the relevant arc42 section (usually §7). An architecture concept is never a runbook.
- **Glossary** — always `docs/reference/glossary.md`, with or without a bundle. §12 points to it and defines only architecture-specific terms.
- **Bundle root** — default `docs/architecture/`. Bundle settings (`language`, `detail_level`, `domain_profile`) live in its root `index.md`; read them there instead of asking again.

## Findings and work items

VALIDATE, CONVERGE and SPOT_REVIEW report findings and write no work items on their own. When the user asks to turn findings into work items, file them in the repo's configured issue tracker (`docs/agents/issue-tracker.md`) through the `to-tickets` skill. Severity tiers P0–P3 classify findings in the report; see [architecture-guard.md](./architecture-guard.md#non-blocking-model-and-severity-tiers).

## Bundle gotchas

- §8 (cross-cutting concepts) holds one file per concept and per type. A single `cross-cutting.md` fails validation (`SECTION8_NOT_SPLIT`).
- `index.md` and `log.md` are reserved at every level; they never hold concept content.
- `arc42_section` is an integer 1–12; the quoted string `"3"` is rejected.
- Language is per bundle (`language:` in the root `index.md`); headings use that language only, never bilingual headings. Templates are English: translate their headings for DE bundles.
- Markdown links resolve relative to the file that contains them (`../05-building-blocks/x.md`). Pass the bundle root, not the repo root, to the scripts.
