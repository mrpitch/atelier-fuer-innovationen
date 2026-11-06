# Index Operation

**When**: User wants to (re)generate the `index.md` file that links every doc in a docs root.

## Purpose

Run `{baseDir}/scripts/generate-index.ts` to scan a docs root, extract the H1 title of each markdown file, and write `<docs_root>/index.md`. Run it whenever docs are added, moved, renamed, or removed.

## Execution

### Step 1: Determine Target

Default: repo-root `docs/`. Verify the target has at least one of `tutorials/`, `how-to/`, `reference/`, `explanation/`, `runbook/`, `adr/`, or `architecture/`. If not, suggest running `docs scaffold` first.

### Step 2: Run the Script

```bash
npx tsx {baseDir}/scripts/generate-index.ts <docs_root>
```

Example: `npx tsx {baseDir}/scripts/generate-index.ts docs`. For a package tree, pass `<pkg>/docs`.

The script uses only Node ≥ 22 stdlib + `tsx`. If `tsx` is not installed: `pnpm add -D tsx`.

### Step 3: Format

```bash
npx prettier --write <docs_root>/index.md
```

### Step 4: Report

Output the file path and a brief summary of how many docs were indexed per category.

## Output

- `index.md` carries frontmatter containing only `okf_version: "0.2"`.
- Sections follow the Diataxis folders (`tutorials/`, `how-to/`, `runbook/`, `reference/`, `explanation/`, `adr/`), each listing docs by H1 title.
- An **Architecture** section appears when `<docs_root>/architecture/index.md` exists: one bullet per arc42 section folder, linking that folder's `index.md`. The bundle's own `docs/architecture/index.md` is hand-maintained by the `docs arch` operations and is never touched by this script.
- The body notes that the file is generated and must not be edited by hand.

## Notes

- The script skips `README.md` and `index.md` in listings — `README.md` stays the human-curated intro, `index.md` is the generated listing. It never lists `log.md` or hidden files.
- Empty intentional folders are kept with a `.gitkeep` marker; the script renders them with "_No documents yet._".
- Folders outside the set above (e.g. `audit-reports/`, `agents/`, `research/`) are ignored.

## When to Run Automatically

Trigger after:

- `docs scaffold` (initial creation)
- `docs write` (after adding a new doc)
- `docs audit` migration (after moving files)
- `docs arch generate` (the Architecture section lists the new section folders)
- Any manual `git mv` of a doc within a `docs/` tree
