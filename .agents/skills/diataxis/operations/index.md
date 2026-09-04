# Index Operation

**When**: User wants to (re)generate the `index.md` file that links every Diataxis-categorized doc in a directory.

## Purpose

Run `scripts/generate_index.py` to scan a docs root, extract H1 titles from each markdown file, and produce a categorized index. Run this whenever docs are added, moved, renamed, or removed.

## Execution

### Step 1: Determine Target

Default: repo-root `docs/`. Verify the target has at least one of `tutorials/`, `how-to/`, `reference/`, `explanation/`. If not, suggest running `diataxis scaffold` first.

### Step 2: Run the Script

```bash
npx tsx .claude/skills/diataxis/scripts/generate-index.ts <docs_root>
```

Examples:

```bash
npx tsx .claude/skills/diataxis/scripts/generate-index.ts docs
```

The script uses only Node ≥ 22 stdlib + `tsx`. If `tsx` is not installed: `pnpm add -D tsx`.

### Step 3: Format

```bash
npx prettier --write <docs_root>/index.md
```

### Step 4: Report

Output the file path and a brief summary of how many docs were indexed per category.

## Notes

- The script skips `README.md` and `index.md` itself in subfolder listings — `README.md` stays as the human-curated intro, `index.md` is the generated machine listing.
- Empty intentional folders are kept by adding a `.gitkeep` marker; the script renders them with "_No documents yet._".
- Folders not in the four-quadrant set (e.g. `audit-reports/`, `contracts/`) are ignored.
- The generated index has a header noting it is generated and should not be edited by hand.

## When to Run Automatically

Trigger after the following operations:

- `diataxis scaffold` (initial creation)
- `diataxis write` (after adding a new doc)
- `diataxis audit` migration (after moving files)
- Any manual `git mv` of a doc within a `docs/` tree
