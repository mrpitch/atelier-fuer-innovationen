# docs arch generate — scaffold a new bundle

**Entry:** the user wants architecture documentation and no bundle exists at the target directory (default `docs/architecture/`). Rules for every file written: [non-negotiables](../../references/architecture/non-negotiables.md).

## Steps

1. Ask once for:
   - project name
   - target directory (default `docs/architecture/`)
   - language: EN or DE (headings and body use that language only)
   - detail level: LEAN / ESSENTIAL / THOROUGH (default ESSENTIAL; see [detail-levels.md](../../references/architecture/detail-levels.md))
   - domain profile, optional: `startup-mvp` / `microservice` / `platform-service` / `data-pipeline` (per-profile section priorities are in detail-levels.md)
   - destination: 2–4 sentences on who reads the bundle and what a reader should be able to answer without pinging the team

2. Run the scaffolder. It is the single source of the bundle layout, so generate, [code-to-docs](./code-to-docs.md) and [draft](./draft.md) agree on file names:

   ```bash
   python {baseDir}/scripts/architecture/bootstrap.py --project-name "<name>" --output-dir <dir> \
     --language <en|de> --detail-level <lean|essential|thorough> [--domain-profile <profile>]
   ```

   It writes the root `index.md` (`okf_version`, `language`, `detail_level`, `domain_profile`), the root `log.md`, all 12 section directories with their `index.md`, and one stub concept file per expected document (`status: draft`, headings in the bundle language). Each section's main stub follows that section's template (MADR 4 ADR, QS-xx and RISK-xx rows). The script stamps `generated` (`docs-bootstrap/<version>`) and writes the root log entry itself. It never overwrites existing files and exits 1 when everything already existed — then stop and ask the user before touching the directory.

3. Write the destination statement into a `## Destination` section in the root `index.md` body.
4. Run `python {baseDir}/scripts/architecture/validate.py <dir>` — it must exit 0.
5. Refresh the docs index: `npx tsx {baseDir}/scripts/generate-index.ts <docs_root>` (it adds the Architecture section once `<docs_root>/architecture/index.md` exists).
6. Show the user the resulting tree and name the next step: replace the `<!-- ... -->` placeholders section by section with `docs arch draft <section>`. Per-section work items go to the configured issue tracker through `to-tickets`, only when the user asks.

**Done when:** `bootstrap.py` exited 0, `validate.py` exits 0, the destination is recorded in the root `index.md`, and the user has seen the tree. Drafting is a separate act.
