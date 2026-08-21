# Project Context

<!--
  This is the blank schema `diataxis setup` fills in. It is NOT the output —
  never edit this file directly. `setup` reads this structure and writes the
  populated result to `docs/agents/diataxis-context.md` in the consuming
  repo (not into this skill's own directory), so the skill package itself
  stays generic and distributable.
-->

_Blank template. Run `diataxis setup` in the target repo to populate
`docs/agents/diataxis-context.md` from this structure._

## Project Identity

- **Name:** `<detected name from package.json>`
- **Description:** `<detected description, or "—" if absent>`

## Package Manager

- **Command:** `<pnpm | npm | yarn | bun>`
- **Format/lint command:** `<detected format command>`
- **Test command:** `<detected test command>`
- **Build command:** `<detected build command>`

## Tech Stack

- **Framework:** `<detected>`
- **Language:** `<TypeScript | JavaScript>`
- **Test runner:** `<detected>`
- **Other key libraries:** `<comma-separated list>`

## Project Structure

- **Type:** `<monorepo | single-package>`
- **App paths:** `<detected or "src/">`
- **Library paths:** `<detected or "none">`
- **Service paths:** `<detected or "none">`

## Logging Convention

- **Use:** `<detected import or "bare console.log is acceptable">`

## Package Namespace

- `<detected or "none">`

## Excluded Folders (not Diataxis territory)

- `<list of detected non-doc folders>`

## Environment Names (if applicable)

- `<detected from CLAUDE.md/AGENTS.md or "not applicable">`

## Other Conventions

- `<key conventions extracted from CLAUDE.md / AGENTS.md>`
