# docs arch spot-review — interactive review of individual pages

**Entry:** the user wants a short review session: "spot-check the docs", "random page review", "surprise me". The skill picks one of the least recently checked pages, the user gives feedback, corrections are applied, and changes propagate to connected pages. A full top-down audit is [validate](./validate.md); a change-driven update is [refresh](./refresh.md). Needs a known bundle root following the OKF layout. Rules for every file written: [non-negotiables](../../references/architecture/non-negotiables.md).

Flags: `--section N` (sample one arc42 section, e.g. `05-building-blocks/`), `--count N` (pages per round, default 1), `--deep` (two-hop propagation instead of one).

## Steps

1. **Session context.** Confirm the bundle root. Parse the flags. Ask once for the reviewer's actor id (`human:<id>`, e.g. `human:jane.doe`); it goes into `verified` entries in step 6 and is never guessed. Keep a **session ledger** (paths handled this session) in the conversation so no page comes up twice. There is no session file: every page handled leaves a fresh `generated` or `verified` stamp, so a later session's sampling skips it by itself.

2. **Candidate pool.** Every `.md` under the bundle root except `index.md` and `log.md`, outside dot-directories, not in the ledger; with `--section N`, only that section's prefix. Give each candidate a **last-checked** date: the latest of `generated.at` and every `verified[].at` (legacy: `updated`; none means never checked). A past `stale_after` counts as never checked.

3. **Sample.** Sort by last-checked, oldest first; pick N pages (`--count`) at random from the oldest third. Among equally old pages prefer those without a `links:` field — isolated pages drift unnoticed. A pool smaller than N: use what is there and say so.

4. **Present the page.** A card, then the full content:

   ```
   ═══════════════════════════════════════
   Spot review — page N of M
   File    : <relative path>
   Section : arc42 §N — <name>
   Type    : <type>
   Checked : <last-checked date> (<N> days ago, or never)
   Description : <description>
   ───────────────────────────────────────
   Links OUT : (from `links:` frontmatter of this file)
   Links IN  : (pages whose `links:` points here)
   Content refs IN : (pages with inline markdown link to this file)
   ═══════════════════════════════════════
   ```

   Compute **Links IN** and **Content refs IN**:

   ```bash
   grep -rl "<relative-page-path>" <bundle-root> --include="*.md"   # frontmatter back-links
   grep -rl "(<filename>)" <bundle-root> --include="*.md"           # inline markdown back-links
   ```

5. **Elicit feedback** — all questions in one block:
   1. Is this still accurate? What has changed?
   2. Is anything important missing that belongs here?
   3. Is the scope right (one clear concern)?
   4. By `type:` — `reference`: are all entries and values still valid? `explanation`: does it still reflect the current architecture and reasoning? `how-to`: do the steps still work end to end? `tutorial`: is the learning outcome still achievable? `adr`: is the status still right and the decision still in force?
   5. Any other corrections?

   Classify the reply into one or more of: `FACTUAL_CORRECTION` | `MISSING_CONTENT` | `SCOPE_ISSUE` | `TYPE_MISMATCH` | `STALENESS` | `NO_CHANGE`.

6. **Apply feedback** to the reviewed page, in order:
   - `FACTUAL_CORRECTION` → edit precisely where indicated
   - `MISSING_CONTENT` → add at the appropriate location; leave the document's structure alone
   - `SCOPE_ISSUE` (split) → create a sibling file from the matching template in [templates/architecture/](../../templates/architecture/), update the section `index.md`, cross-link both files' `links:`
   - `SCOPE_ISSUE` (merge) → fold the content into the target file; update the section `index.md`
   - `TYPE_MISMATCH` → update `type:` and restructure the body per [framework.md](../../references/framework.md)
   - `STALENESS` → treat as `FACTUAL_CORRECTION` with the user-stated changes

   Changed pages: [non-negotiables](../../references/architecture/non-negotiables.md) apply; log entry `- **Update**: <path> — spot review: <one line>`.

   `NO_CHANGE` (the user confirmed the page as accurate): add a `verified` entry `{ by: human:<id>, at: <now, UTC ISO 8601> }` with the id from step 1, leave `generated` alone because the content did not change, format the file as in non-negotiables, and write no log entry.

7. **Propagate.**
   1. Build the propagation set, deduplicated:

      | Tier | Source                                              | When to include                                     |
      | ---- | --------------------------------------------------- | --------------------------------------------------- |
      | 1    | `links:` frontmatter of the reviewed page           | Always                                              |
      | 2    | Pages whose `links:` frontmatter contains this path | Always                                              |
      | 3    | Pages with inline `[text](<filename>)` body links   | Always                                              |
      | 4    | Section siblings (same `arc42_section`)             | Only if feedback = `SCOPE_ISSUE` or `TYPE_MISMATCH` |

      Exclude the reviewed page, every `index.md` / `log.md`, and every path in the ledger. A set above 20 pages: pause and ask before continuing.
   2. For each connected page show a compact card (path, reason, summary) and ask: "The review of `<filename>` found: [brief list]. Does any of this apply here? (y/n/skip)"
      - **y** → show the full content and rerun steps 5–6 on this page; with `--deep`, add its connections to the BFS queue
      - **n** → add to the ledger, move on
      - **skip** → leave off the ledger (it may resurface in later sampling)
      - deferred ("I need to think about this") → list it in the session summary as "Propagate review finding to {filename}: does {change} apply?"; work items go to the issue tracker on request

   Depth: default 1 hop; `--deep` up to 2 hops (BFS, the ledger prevents cycles).

8. **Loop.** Ask "Review another page? (y/n)". y → back to step 2 with the updated ledger; n → step 9.

9. **Session summary:**

   ```
   Pages reviewed  : N
   Pages updated   : N
   Pages verified  : N (confirmed, unchanged)
   Files modified  :
     • <path> — <one-line change summary>
   log.md entries  : N appended
   Deferred        : <propagation items left open> | none
   ```

   After structural changes (splits, merges, deletions), remind the user to run `python {baseDir}/scripts/architecture/validate.py <bundle-root>`.

**Done when:** at least one page was reviewed; propagation was actioned or listed as deferred; the session summary was delivered; every reviewed page carries a fresh `generated` stamp (changed) or a `verified` entry (confirmed accurate).
