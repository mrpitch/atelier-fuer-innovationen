# docs arch validate — audit a bundle (read-only)

**Entry:** the user asks to validate, lint, check conformance, audit, review the bundle, asks what is missing or whether the docs are accurate, or wants findings listed as a backlog. Unknown bundle root: ask before running anything. Pass the bundle root, not the repo root, to the scripts. For a CI gate, see [architecture-guard.md](../../references/architecture/architecture-guard.md).

The operation runs the scripts, maps the bundle, then judges staleness, completeness, Diátaxis purity and hygiene. Output is one report: MECHANICAL · JUDGMENT · HYGIENE.

**Validate is read-only.** It changes no bundle file (diagram renders under `.renders/` are working state, not bundle content). Fixes go through [edit](./edit.md) and work items through the issue tracker, both after the user has seen the report, so the report always describes the bundle as found.

### Subagents

Steps 5 and 6 read many files. When the runtime has subagents, give those reads to read-only subagents running in parallel, on the smallest model that does the job:

| Task                                                                    | Model class    | Why                                           |
| ----------------------------------------------------------------------- | -------------- | --------------------------------------------- |
| Step 5 Diátaxis purity: one subagent per section (split sections > ~15) | mid            | Whether prose matches its type is judgment    |
| Step 6 STALE-ARTIFACT: find backticked repo paths, check each exists    | small          | Mechanical scouting: search and file checks   |
| Verdict, synthesis, report                                              | the main agent | It needs every result, and it owns the report |

- Say in the prompt that no file may change.
- Give each its return format so the answer drops into the report. Step 5: one row per file, `file | type | OK or SPLIT: <what> → <type> | description matches: yes/no`, after reading each file in full. Step 6: `checked N of M`, then `file:line → path` per missing path, found with fixed-string search (`grep -rnF`).
- Without subagents, do the same work inline, say so in the report, and keep the sample size.

## Steps

### 1. Mechanical checks

```bash
python {baseDir}/scripts/architecture/validate.py <bundle-root> --summary          # exact counts per code
python {baseDir}/scripts/architecture/validate.py <bundle-root> | grep ' CODE:'    # the messages for one code
python {baseDir}/scripts/architecture/arc42-lint.py <bundle-root>                  # take counts from its closing "N errors, N warnings" line
python {baseDir}/scripts/architecture/diagram-check.py <bundle-root> --json        # renders diagrams to <bundle-root>/.renders/
```

- `validate.py` checks frontmatter (valid YAML, `type` in the allowed set, integer `arc42_section`, well-formed v0.2 fields), reserved file names, links (relative ones resolve from the containing file, `/` ones from the bundle root; a link leaving the bundle to an existing file is `LINK_OUTSIDE_BUNDLE`, a missing target `BROKEN_LINK`), the §8 split, ADR placement and typing, orphans, the root `index.md` settings, log format and staleness. It skips dot-directories and exits 1 on errors.
- `arc42-lint.py` checks five cross-section rules: IF-xx interface IDs (§3↔§5), building-block deployment coverage (§5↔§7), Q42 tag coverage (§1↔§10), ADR risk references (§9↔§11), aspirational-scenario traceability (§10↔§11). It exits silently when the bundle has no cross-section data yet, and with 2 on a missing path.
- `diagram-check.py` renders every Mermaid and PlantUML block, draw.io file and `workspace.dsl` with the installed tools and fails on render errors. A missing tool is a `RENDERER_MISSING` warning with an install hint: report it, because those diagrams are unchecked. `validate.py` already warns about diagrams without a title and images without alt text; Step 5 judges whether complex diagrams have a text equivalent.

Script findings go into MECHANICAL as reported: counts from `--summary`, messages fetched one code at a time, no truncated output (`head`), no estimates, no cause the script did not report. Keep going when a script fails; the judgment steps still say something useful about a broken bundle.

### 2. Bundle map

Read the root `index.md` and record which arc42 sections (1–12) are present, which are `N/A` with a reason, and which are absent without explanation:

| #   | Section slug   | Status    |
| --- | -------------- | --------- |
| 1   | 01-goals       | ✓ present |
| 2   | 02-constraints | ✗ missing |
| …   | …              | …         |

Section content stays unread until a later step needs it: section `index.md`, then concept file.

### 3. Staleness (bonsai check)

Take every `STALE` warning from `validate.py` (a past `stale_after`, or a `generated.at` — legacy `updated` — older than 365 days). Read each file briefly (title, description, first paragraph) and classify:

- `UPDATE` — still relevant, needs a refresh
- `ARCHIVE` — historically accurate, no longer the current system; move to `archive/`
- `DELETE` — wrong or irrelevant; mandatory when it names a service, system or endpoint that no longer exists, or describes a superseded decision without saying so

Out-of-date docs are worse than none: a reader who trusts them decides worse than one who has nothing.

### 4. Completeness

All 12 sections are present or `N/A` with a reason in the root `index.md`. Check the six minimum-viable parts (about six index files; see [arch-doc-best-practices.md](../../references/architecture/arch-doc-best-practices.md)):

1. §3 — a C4 system context diagram
2. §5 — a container (and where useful, component) breakdown
3. §6 — at least one non-trivial runtime scenario
4. §7 — a deployment diagram
5. §9 — current decisions recorded as ADRs
6. §12 — definitions for domain and technical terms

Recommend `ADD` (missing and needed) or `DEFER` (missing, not needed yet) for each gap.

### 5. Diátaxis purity and description accuracy

Read every concept in full: inline in a small bundle, through the Step 5 subagents in one over ~50 concepts. With no subagents, read at least one concept from every section in full and state the sample size in the report. Frontmatter and headings alone are not a read.

- Does the file do exactly one thing, and does its prose match its `type:`? `how-to`: imperative, scannable steps. `explanation`: background, concepts, trade-offs. `reference`: tables and lists, terse. `tutorial`: learning by doing, with the expected result of each step. `adr`: one decision in MADR shape. Type definitions: [framework.md](../../references/framework.md).
- Does its `description:` still match the body?
- Does every complex diagram have a short text equivalent below it, and does each image's alt text say what it shows?

Flag each mixed file `SPLIT`, naming what to extract into which type.

### 6. Hygiene

Check every category and report it by finding type. A category without findings says "none": an empty category and an unchecked one must look different.

| Category                                                                 | Finding type   |
| ------------------------------------------------------------------------ | -------------- |
| Code artifact referenced in docs no longer exists                        | STALE-ARTIFACT |
| Concept file not linked from any `index.md`                              | ORPHAN-DOC     |
| Concept body still contains a `<!-- ... -->` placeholder                 | UNFILLED-STUB  |
| Concept body contains a `TODO:` or `FIXME:` marker                       | TODO-MARKER    |
| Two or more concept files cover the same scope                           | DUPLICATE-DOC  |
| `generated.at` unchanged although the body was clearly edited (git diff) | DATE-DRIFT     |

STALE-ARTIFACT checks every backticked path that starts with a repo directory (through the Step 6 scout when subagents exist) and cites the doc file, line and artifact path. ORPHAN-DOC confirms the file is absent from every `index.md`.

### 7. Report

```
## Validation report: <bundle-root>

**Verdict:** PASS | FAIL — N errors (validate N · lint N · diagrams N)

### MECHANICAL
#### Errors
- <CODE> × N — grouped by resolved target or cause, as the script reports it
#### Warnings
- <CODE> × N — …
- v0.1 frontmatter: <CODE × N, …> — see okf-spec.md § Migrating a v0.1 bundle
- Install <tool> to check N <kind> diagrams

### JUDGMENT
#### Bundle map
<table from Step 2>
#### Staleness
- <file> — UPDATE | ARCHIVE | DELETE — reason
#### Completeness
<one row per minimum-viable part; "Evidence" is the file you opened>
| Part                 | Evidence | OK / ADD / DEFER |
| -------------------- | -------- | ---------------- |
| §3 system context    | <file>   |                  |
| §5 containers        | <file>   |                  |
| §6 runtime scenario  | <file>   |                  |
| §7 deployment        | <file>   |                  |
| §9 current ADRs      | <file>   |                  |
| §12 glossary         | <file>   |                  |
#### Diátaxis purity (read N of M concepts)
<one row per section, at least; every file read gets a row>
| §   | File read | type | OK / SPLIT: <what to extract> → <type> |
| --- | --------- | ---- | -------------------------------------- |

### HYGIENE
- STALE-ARTIFACT: checked N of M path citations — <file:line → missing path>, … | none
- ORPHAN-DOC: … | none
- UNFILLED-STUB: … | none
- TODO-MARKER: … | none
- DUPLICATE-DOC: … | none
- DATE-DRIFT: … | none

### SUMMARY
- Merge-blocking (P0): N — <list>
- Errors to fix: N · files to update: <list> · to archive or delete: <list>
- Missing sections: <list>
- Recommended next step: <the single most important action>

Not checked: <anything really not checked, and why> | nothing
```

- **Verdict** is FAIL when any script reported an error, PASS otherwise; it is the only verdict in the report. Every count is exact, SUMMARY included: count it or leave the number out.
- **MECHANICAL** groups findings by code with exact counts, then by resolved target or cause. All `LEGACY_*` codes, `ROOT_INDEX_OKF_VERSION_LEGACY` and `LEGACY_LOG_FORMAT` collapse into the single v0.1 line. Report `RENDERER_MISSING` as "Install <tool> to check N <kind> diagrams", using the install hint from the message.
- **P0** counts only violations of a `blocking: true` ADR or a §2 constraint marked blocking (tiers: [architecture-guard.md](../../references/architecture/architecture-guard.md#non-blocking-model-and-severity-tiers)). Always check: search `02-*/` and `09-*/` for `blocking: true`, then judge each finding against what you found. With nothing marked, write "P0: 0 — nothing is marked `blocking: true`". P0 is not a verdict: P0 0 with a FAIL verdict still fails CI.
- **Not checked** is one closing line, not a subsection of disclaimers. JUDGMENT never says "not assessed": Steps 4 and 5 are required, and an empty Evidence or File read cell means the step is not done. Write "none" only for a category checked in full; a partial check reports its N of M.

Keep findings and actions apart, so the report can be pasted into a ticket or PR as it is.

### 8. Offer work items

Offer to turn the findings into work items in the configured issue tracker through `to-tickets` (see _Findings and work items_ in [non-negotiables](../../references/architecture/non-negotiables.md)): P0 is reported as merge-blocking, the rest is proposed as a table, and only the rows the user approves are filed.

**Done when:** all three scripts ran (failures and unchecked diagrams reported, not hidden), every judgment and hygiene check is reported (a category without findings says "none"), the report is delivered as MECHANICAL · JUDGMENT · HYGIENE, and the work-item offer was made.
