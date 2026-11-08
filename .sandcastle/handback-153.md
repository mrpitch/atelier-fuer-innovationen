Handed back after /implement failed twice (initial run + repair pass).

**Branch:** `feat/153-archiv-grouped-by-type-year` — the attempted work is committed there (1ecc51b implement, 668a1ad repair). No PR opened.

**Run 1** review blocked on `nie-gebaute-features` sitting under the Telepolis separator; the repair pass fixed it with a dedicated `---Nie gebaute Features---` separator in `src/content/docs/xeniapolis/archiv/meta.json`. The repair pass's review then returned `success: false` on one new standards finding:

- `src/content/docs/xeniapolis/maerkte/index.mdx:34-38` and `zukunft/index.mdx:55-59` — a single `<Card>` in `<Cards>` renders in a `grid-cols-2` grid, so on desktop the lone "Nie gebaute Features" card fills half the row with an empty cell beside it. It is the repo's first lone-card use. Fix options: render the card full width (a one-card layout, or a plain editorial link) without changing text; keep editorial markers per copy-integrity (single-line Card, see the notes in `.epic-notes/144.md`).

Non-blocking nitpick: the 3-line `<Cards><Card/></Cards>` block is duplicated in both files.

Spec axis: all acceptance criteria verified as met. Gates reported green in the sandbox: pnpm test 133/133, typecheck, lint, format:check, build, copy-integrity.
