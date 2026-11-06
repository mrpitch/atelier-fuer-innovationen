# Documentation Audit — 2026-11-04

## Scope

Scanned: `docs/` (25 markdown files). Skipped as non-classifiable: `docs/agents/*` (5, agent config), `docs/index.md` (reserved), 5 `README.md` files (quadrant indexes). 14 docs were classified: 2 ADRs, 1 explanation, 11 reference.

## Summary

| Type          | Count | Notes                                                  |
| ------------- | ----- | ------------------------------------------------------ |
| Tutorial      | 0     | `docs/tutorial/` holds only a README                   |
| How-to        | 0     | `docs/how-to/` holds only a README                     |
| Reference     | 11    | 10 in `reference/fumadocs/`, plus `glossary.md`        |
| Explanation   | 1     | `about-section-theming.md`                             |
| ADR           | 2     | `adr/0001`, `adr/0002`                                 |
| Mixed         | 0     | `tabs-migration.md` leans toward explanation (see Low) |
| Uncategorized | 11    | READMEs, `index.md`, `docs/agents/*`                   |

Diataxis structure present: **Partial** (reference, explanation and ADRs are populated; tutorial and how-to are empty).

## Coverage Matrix

Rows come from the feature areas in `src/` and the repo's tooling.

| Area                                   | Tutorial | How-to | Reference | Explanation |
| -------------------------------------- | :------: | :----: | :-------: | :---------: |
| Local dev setup                        |    ○     |   ○    |     ○     |      -      |
| Content authoring (`src/content/docs`) |    ○     |   ○    |     △     |      ○      |
| Fumadocs integration (imports, search) |    -     |   ○    |     ✓     |      △      |
| Theming and per-section palettes       |    -     |   ○    |     ✓     |      ✓      |
| Components (`src/components`)          |    -     |   ○    |     △     |      -      |
| Build and image optimization           |    -     |   ○    |     ○     |      ○      |
| Deploy / static export                 |    -     |   ○    |     ○     |      ○      |
| Agent workflow (afk, Sandcastle)       |    -     |   ○    |     ✓     |      ○      |

`✓` exists and passes, `△` exists but needs work, `○` missing, `-` not applicable. The agent-workflow reference is `docs/agents/*`, which sits outside the Diataxis quadrants.

## Issues

### 🔴 High

| File                                                                                                                  | Issue                                                                                                                                                                               | Recommended action                                                                                                            |
| --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 14 docs: both ADRs, `explanation/about-section-theming.md`, the 10 `reference/fumadocs/*.md`, `reference/glossary.md` | **Fixed 2026-11-04.** Legacy frontmatter keys. All carry `name` and `kind`; none has `title`. `type` is Title Case OKF (`Reference`, `ADR`), not the contract's lowercase quadrant. | Rename `name`→`title`, `kind`→`type` (lowercase), and drop the OKF `type`. **Conflicts with the repo's own rule**, see below. |
| 12 docs: `about-section-theming.md`, 10 `reference/fumadocs/*.md`, `glossary.md`                                      | **Fixed 2026-11-04.** `status: current`                                                                                                                                             | Changed to `status: stable`.                                                                                                  |

**Resolution.** The repo's old rule (`name`/`kind` plus a Title Case `type`) conflicted with the `docs` skill contract. The repo moved to the skill contract: in all 14 docs `name`→`title`, the `kind` line was removed, `type` now holds the lowercase quadrant, and `status: current` became `stable`. `scripts/validate-okf.ts` only checks for a non-empty `type`, so it needed no change beyond exempting `docs/audit-reports/`. `docs/agents/domain.md`, `docs/README.md`, `docs/adr/README.md` and `docs/agents/docs-context.md` were updated to match.

### 🟡 Medium

| File                                   | Issue                                                                                                                                                                                                                     | Recommended action                                                               |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `adr/0001-adopt-fumadocs-base-ui.md`   | States the adoption "fully retires direct Radix UI usage", yet `package.json` still lists `@radix-ui/react-accordion` and `@radix-ui/react-collapsible`. A grep of `src/` finds no import of either, so they look unused. | Remove the two unused dependencies, or add a note to the ADR that they remain.   |
| `explanation/about-section-theming.md` | The "What a new component needs to do" section drifts toward instruction. It is mostly explanatory.                                                                                                                       | Leave as is, or move the "hardcoded color" guidance to a how-to once one exists. |

### 🟢 Low

| File                                   | Issue                                                                                                                                                                                           | Recommended action                                                                                      |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `reference/fumadocs/tabs-migration.md` | A reference doc that tells the story of a migration, including "that was wrong, caught in review". The current-state part (the wrapper and its props) is reference; the history is explanation. | Trim to the wrapper contract, or move the history into an explanation or the ADR.                       |
| `reference/fumadocs/*`, `glossary.md`  | No `description` ranking problems, but only `glossary.md` is `authoritative: true`. Overlap between `section-theming.md` and the explanation is deliberate, but neither marks a winner.         | Set `authoritative: true` on `reference/fumadocs/section-theming.md` if it should win on theming facts. |
| `docs/README.md`, `docs/index.md`      | The README links `tutorial/` and `how-to/` as live sections, but both are empty.                                                                                                                | Fine while they are placeholders. Revisit when the first doc lands.                                     |

No dead internal links, no code blocks missing a language hint, no secret-like strings, no `console.log` in examples, and no `last_reviewed` older than 12 months (newest 2026-08-23).

## Gaps (missing docs)

### Critical

- [ ] `docs/tutorial/getting-started.md` (new contributor, clone to running site)
- [ ] `docs/how-to/how-to-run-locally.md`
- [ ] `docs/reference/configuration.md` (`next.config.mjs`, `source.config.ts`, env vars)

### High

- [ ] `docs/how-to/how-to-add-a-content-page.md` (MDX in `src/content/docs`, `meta.json`)
- [ ] `docs/how-to/how-to-build-and-deploy.md` (static export, image optimizer, `pnpm start`)
- [ ] `docs/explanation/about-architecture.md` (Next.js + Fumadocs, two sections, static export)

### Medium

- [ ] `docs/reference/components.md` (`src/components`: tabs, slides, overview cards, image zoom)
- [ ] `docs/how-to/how-to-run-an-afk-sandbox.md` (`pnpm sandcastle:build`, `pnpm afk`, `.env`)
- [ ] `docs/explanation/about-the-epic-afk-workflow.md`

## Proposed Migration

No file moves are needed: every classified doc is already in the quadrant folder that matches its type. The only changes are frontmatter edits.

| Change                                         | Files     |
| ---------------------------------------------- | --------- |
| `name`→`title`, `kind`→`type`, drop OKF `type` | 14 (done) |
| `status: current`→`stable`                     | 12 (done) |

## Next Steps

1. ~~Frontmatter migration~~ done.
2. Run `docs scaffold` to add `runbook/` if runbooks are wanted. `how-to/` and `tutorial/` already exist.
3. Resolve the Radix dependency mismatch with ADR 0001.
4. File backlog tickets for the Critical and High gaps.

## Follow-up 2026-11-05

| Finding                                         | Resolution                                                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ADR 0001 vs unused Radix dependencies           | Removed `@radix-ui/react-accordion` and `@radix-ui/react-collapsible` from `package.json` and the lockfile. `pnpm build` passes without them.                                                                                                                                                                                                                                     |
| `tabs-migration.md` mixed reference and history | Trimmed to the wrapper contract and renamed to `reference/fumadocs/tabs-wrapper.md`. The migration story is in git history and ADR 0001.                                                                                                                                                                                                                                          |
| Only `glossary.md` authoritative                | `reference/fumadocs/section-theming.md` is now `authoritative: true`.                                                                                                                                                                                                                                                                                                             |
| Dead links                                      | None found at audit time, and none after the new docs were added (35 files checked).                                                                                                                                                                                                                                                                                              |
| `tutorial/` vs the `docs` skill's `tutorials/`  | Renamed to `tutorials/`, because `docs index` only lists that folder name.                                                                                                                                                                                                                                                                                                        |
| Critical, High and Medium gaps                  | All nine written: `tutorials/getting-started.md`, `how-to/how-to-run-locally.md`, `how-to/how-to-add-a-content-page.md`, `how-to/how-to-build-and-deploy.md`, `how-to/how-to-run-an-afk-sandbox.md`, `reference/configuration.md`, `reference/components.md`, `explanation/about-architecture.md`, `explanation/about-the-epic-afk-workflow.md`. `docs/index.md` was regenerated. |
