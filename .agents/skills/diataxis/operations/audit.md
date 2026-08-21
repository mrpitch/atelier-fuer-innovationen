# Audit Operation

**When**: User wants to analyze and reorganize existing documentation against Diataxis categories.

## Purpose

Scan markdown documentation, classify each file by Diataxis type, flag mixed-type and misplaced docs, identify gaps, and propose an actionable migration plan.

## Execution

### Step 1: Discover Documentation

Default scope: `docs/`. If the user names a package, scope to `<pkg>/docs/`.

**Always start with `docs-discovery`** for the target folder — it returns one entry per `*.md` with `{ file, folder, hasFrontmatter, frontmatter, titleFallback }`. This gives you a complete catalogue (path, title, declared `kind`, `status`, `tags`, `last_reviewed`, `authoritative`) without reading any file.

Use the result to:

- group docs by `frontmatter.kind` (or quadrant folder where `kind` is missing) for a first-pass classification,
- flag every entry with `hasFrontmatter: false` or missing required fields (`name`, `description`, `tags`) as **High** severity ("missing/weak frontmatter"),
- pick which files actually need to be opened in Step 2 (mixed-type heuristics need the body; pure-frontmatter docs can often be classified from metadata alone).

Fall back to `find <scope> -name '*.md'` only if `docs-discovery` is unavailable.

Also catalogue (informational only — do **not** classify these as Diataxis):

- `README.md` (root and per-package) — these are indexes
- `AGENTS.md`, `CONTRIBUTING.md`, `CHANGELOG.md` — meta files
- Folders listed in `docs/agents/diataxis-context.md` as excluded (e.g. `openspec/`, `.github/instructions/`, `docs/audit-reports/`) — skip

### Step 2: Read & Classify

For each candidate file, read it and assign a type using these signals:

| Signal in document                                                          | Type          |
| --------------------------------------------------------------------------- | ------------- |
| Numbered "Step 1 / Step 2" + beginner-oriented + concrete deliverable       | Tutorial      |
| Title "How to …" + numbered actions + verification + troubleshooting        | How-to        |
| Tables of params/options, type signatures, "Returns", consistent format     | Reference     |
| "Why", "Background", "Trade-offs", architectural narrative, no instructions | Explanation   |
| Multiple of the above clearly present                                       | Mixed (split) |
| Doesn't fit (changelog, contributing, meeting notes)                        | Uncategorized |

Record for each file: path, type, confidence (high/medium/low), issues.

### Step 3: Detect Issues

For each classified document, check:

| Severity | Issue                                         | How to detect                                                                |
| -------- | --------------------------------------------- | ---------------------------------------------------------------------------- |
| 🔴 High  | Missing or invalid frontmatter                | `hasFrontmatter: false`, or any of `name`/`description`/`tags` missing       |
| 🔴 High  | Mixed types in one file                       | More than one type signal present                                            |
| 🔴 High  | How-to addressing >1 unrelated tasks          | Multiple top-level "How to …" headings                                       |
| 🟡 Med   | `kind` does not match Diataxis quadrant       | E.g. `kind: how-to` living in `reference/` (or vice versa)                   |
| 🟡 Med   | Multiple `authoritative: true` for same topic | Tag/description overlap with another `authoritative: true` doc               |
| 🟡 Med   | Stale `last_reviewed` (> 12 months)           | Compare ISO date against today                                               |
| 🟡 Med   | Tutorial offering choices                     | Phrases like "alternatively", "you can also", "Option A / Option B"          |
| 🟡 Med   | How-to with multi-paragraph concept sections  | Long prose between steps                                                     |
| 🟡 Med   | Reference containing instructions             | Imperative verbs ("first do …", "then run …")                                |
| 🟢 Low   | Inconsistent reference format vs. siblings    | Compare structure with peer docs in same folder                              |
| 🟢 Low   | Misplaced file (right type, wrong folder)     | Type ≠ parent directory's quadrant                                           |
| 🟡 Med   | Dead internal link                            | Resolve every relative link; flag missing targets                            |
| 🟢 Low   | No language hint on code blocks               | Triple-backtick blocks without a language                                    |
| 🔴 High  | Hardcoded secret or credential in example     | Strings matching obvious secret patterns (API keys, JWTs, passwords, `sk-…`) |
| 🟡 Med   | Logging convention violation                  | Check `docs/agents/diataxis-context.md` for the project logger — flag bare `console.log` if a custom logger is required |
| 🟡 Med   | Outdated tooling references                   | Commands that no longer match the project's package manager or scripts       |

### Step 4: Coverage Matrix

Build a matrix per major topic area found in the codebase. Derive the rows by scanning the project's `src/` (or equivalent) for major feature areas — do not use a fixed list. Example structure:

```
Area                    | Tutorial | How-to | Reference | Explanation
------------------------|----------|--------|-----------|-------------
Local dev setup         |    ?     |   ?    |     ?     |     ?
[Feature area 1]        |    ?     |   ?    |     ?     |     ?
[Feature area 2]        |    ?     |   ?    |     ?     |     ?
[Core data model]       |    ?     |   ?    |     ?     |     ?
[Key integrations]      |    ?     |   ?    |     ?     |     ?
[Deployment / ops]      |    ?     |   ?    |     ?     |     ?
[Security / auth]       |    -     |   ?    |     ?     |     ?
```

Mark `✓` (exists & passes), `△` (exists but needs work), `○` (missing), `-` (not applicable).

### Step 5: Identify Gaps

Prioritize missing docs by likely user impact:

**Critical (block onboarding / common operations)**

- Getting-started tutorial for a new contributor
- How to run the project locally
- Reference for key configuration options
- Reference for the data model / API

**High**

- How to deploy to each environment
- How to run and write tests
- Explanation: architecture overview

**Medium**

- Advanced tutorials for common extension points
- Reference for internal utilities / helpers
- Explanation of major library/framework choices

### Step 6: Map Existing Files to Quadrants

Inspect the actual files found in `docs/` and propose moves based on their content and classification from Step 2. Do not use a fixed mapping — derive it from what you find.

For each file, propose:

| From | Proposed location | Reason |
|------|-------------------|--------|
| `docs/<file>.md` | `docs/<quadrant>/<file>.md` | `<classification and reason>` |

Always confirm proposed moves with the user — moving files breaks external links.

### Step 7: Generate Report

Write the audit report to `docs/audit-reports/diataxis-audit-YYYY-MM-DD.md`. Use this layout:

```markdown
# Diataxis Documentation Audit — <YYYY-MM-DD>

## Scope

Scanned: `<path>` (`<N>` markdown files)

## Summary

| Type          | Count | Notes                 |
| ------------- | ----- | --------------------- |
| Tutorial      | …     | …                     |
| How-to        | …     | …                     |
| Reference     | …     | …                     |
| Explanation   | …     | …                     |
| Mixed         | …     | Need splitting        |
| Uncategorized | …     | Meta files, artifacts |

Diataxis structure present: **Yes / No / Partial**

## Coverage Matrix

[Insert the matrix from Step 4.]

## Issues

### 🔴 High

| File | Issue                      | Recommended action                               |
| ---- | -------------------------- | ------------------------------------------------ |
| `…`  | Mixed tutorial + reference | Split into `tutorials/x.md` and `reference/x.md` |

### 🟡 Medium

| File | Issue                            | Recommended action                       |
| ---- | -------------------------------- | ---------------------------------------- |
| `…`  | How-to with embedded explanation | Extract to `explanation/x.md`, link back |

### 🟢 Low

| File | Issue                         | Recommended action        |
| ---- | ----------------------------- | ------------------------- |
| `…`  | Inconsistent reference format | Align with sibling format |

## Gaps (missing docs)

### Critical

- [ ] `docs/tutorials/getting-started.md`
- [ ] `docs/how-to/run-locally.md`
- [ ] `docs/reference/configuration.md`

### High

- [ ] `docs/explanation/architecture.md`

### Medium

- [ ] …

## Proposed Migration

[List of file moves/splits — confirm before executing.]

| From            | To                               |
| --------------- | -------------------------------- |
| `docs/setup.md` | `docs/how-to/run-locally.md`     |
| …               | …                                |

## Next Steps

1. Confirm the migration table above
2. Run `diataxis scaffold` if missing quadrants
3. Move files (use `git mv` to preserve history)
4. Update internal links (run a grep for old paths)
5. Address 🔴 High issues before next release
6. File backlog tickets for missing docs
```

### Step 8: Offer Migration

After presenting the report, ask:

> Would you like me to:
>
> 1. **Apply** the proposed migration (uses `git mv`, updates internal links)
> 2. **Apply** _only_ high-severity fixes
> 3. **Stop** — let a human review the report first

If applying:

1. Run `scaffold` for any missing quadrant directories
2. `git mv <old> <new>` for each move
3. Grep the repo for the old path and update markdown links
4. Run the project format command on all moved/edited files
5. Output a final list of what changed

### Step 9: Per-File Deep Dive (interactive)

If the user asks about a single document instead of a full audit:

```
Analyzing: <path>

Type:           <classification>
Confidence:     <high|medium|low>
Belongs in:     docs/<quadrant>/
Current path:   <path>

Issues:
  - <severity> <issue> (lines <a>-<b>)

Recommended actions:
  1. <action>
  2. <action>

Companion docs to consider:
  - <e.g. add a how-to to complement this reference>
```
