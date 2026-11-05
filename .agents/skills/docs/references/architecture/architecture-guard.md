# Architecture Guard — CI/CD Integration

## What is it?

Architecture Guard is the practice of running `validate.py` and `arc42-lint.py`
as automated gates on every pull request — the same way you run unit tests. Any
structural, cross-section, or staleness violation blocks the merge until the docs
are fixed.

All three scripts exit 1 on failure and 0 on success. No changes to the scripts
are needed.

---

## GitHub Actions

```yaml
# .github/workflows/arch-guard.yml
name: Architecture Guard

on:
  pull_request:
    paths:
      - 'docs/architecture/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7

      - name: Set up Python
        uses: actions/setup-python@v7
        with:
          python-version: '3.13'

      - name: Frontmatter and link conformance (validate.py)
        run: python .claude/skills/docs/scripts/architecture/validate.py docs/architecture --json

      - name: Cross-section consistency (arc42-lint.py)
        run: python .claude/skills/docs/scripts/architecture/arc42-lint.py docs/architecture

      # Renders every diagram with the tools installed on the runner. None are installed
      # here, so it warns (RENDERER_MISSING) and passes. To make it strict, install the
      # renderers in a step above (e.g. @mermaid-js/mermaid-cli, plantuml) and add --strict.
      - name: Diagram check (diagram-check.py)
        run: python .claude/skills/docs/scripts/architecture/diagram-check.py docs/architecture

      - name: Staleness report (warnings only)
        run: |
          python .claude/skills/docs/scripts/architecture/validate.py docs/architecture --json \
            | python -c "import json,sys; [print(w) for w in json.load(sys.stdin)['warnings'] if w.startswith('STALE')]"
```

The `paths:` filter ensures the guard only runs when architecture docs change,
keeping unrelated PRs fast. Actions are pinned to a major version; pin to a commit
SHA if your security policy requires it. Any Python 3.9+ works.

### Renderers run repo-controlled input

`diagram-check.py` hands every diagram in the bundle to whatever renderer is installed, so a PR author
controls the renderer's input. PlantUML is the sharp edge: `!include` and `!includeurl` read local files
and fetch URLs, so a crafted diagram can pull runner files (tokens, `.env`) into a rendered PNG or reach
the network. Before installing renderers in CI:

- Set `PLANTUML_SECURITY_PROFILE=SANDBOX` in the job environment (no local file or URL access). Use
  `INTERNET` only if diagrams must `!includeurl` remote libraries; it still blocks local files but allows
  any URL on ports 80 and 443. See [PlantUML security](https://plantuml.com/security).
- Render fork PRs only in a job that has no secrets and a read-only token. Never run the diagram check
  under `pull_request_target`, which runs fork code with the base repository's secrets.
- Keep the PNGs in `<bundle>/.renders/` as job artifacts at most; don't publish them from PR jobs.

The guard above installs no renderers, so none of this applies until you add one.

---

## GitLab CI

```yaml
# .gitlab-ci.yml (append to existing file)
arch-guard:
  stage: test
  image: python:3.13-slim
  script:
    - python .claude/skills/docs/scripts/architecture/validate.py docs/architecture --json
    - python .claude/skills/docs/scripts/architecture/arc42-lint.py docs/architecture
    - python .claude/skills/docs/scripts/architecture/diagram-check.py docs/architecture # warns until renderers are installed; then add --strict
  rules:
    - changes:
        - docs/architecture/**
```

---

## Optional additions

### Fitness-function job

Doc gates check the docs; a fitness-function job checks the code against the ADRs
(see [arch-doc-best-practices.md](./arch-doc-best-practices.md)). Put it in its own workflow, without the
`docs/architecture/**` path filter, because code changes are what break decisions:

```yaml
# .github/workflows/arch-fitness.yml
name: Architecture Fitness
on: pull_request
jobs:
  fitness:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      # One of, depending on the stack:
      - run: npx depcruise src --config .dependency-cruiser.cjs # JS/TS
      # - run: lint-imports # Python (import-linter)
      # - run: ./gradlew test --tests '*ArchitectureTest' # Java (ArchUnit)
```

Each rule should be named in the _Confirmation_ section of the ADR it enforces.

### Docs-as-code linters

Common extra steps: markdownlint, Vale (style and glossary terms), lychee (external
links — `validate.py` checks only internal links), and Prettier. Diagram rendering is
`diagram-check.py` above. Add them as needed; this skill does not ship configs for them.

---

## Exit-code contract

| Script             | Exit 0                                                          | Exit 1                                                                        |
| ------------------ | --------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `validate.py`      | No errors (warnings allowed)                                    | Frontmatter invalid, malformed v0.2 field, broken link, reserved file misused |
| `arc42-lint.py`    | No cross-section inconsistencies                                | IF-xx mismatch, Q42 gap, RISK-xx missing, or ADR/QS traceability broken       |
| `diagram-check.py` | Every installed renderer succeeded; missing renderers only warn | A render failed, or (with `--strict`) a renderer is missing                   |

All three produce human-readable output by default. Pass `--json` to
`validate.py` or `diagram-check.py` for machine-parseable output (CI log parsers, Slack bots).

---

## Staleness threshold guidance

`validate.py` applies one global rule — 365 days since `generated.at` — and per-concept
deadlines via `stale_after`. Set `stale_after` on content that ages faster than a year:

| Context                       | Suggested `stale_after` from the last change |
| ----------------------------- | -------------------------------------------- |
| Actively evolving system      | 60 days                                      |
| Stable production service     | 90 days                                      |
| Regulated / audit environment | 30 days                                      |

---

## Docs-as-code gate: what counts as a violation

The guard should fail PRs that:

1. Introduce a concept file with missing or invalid frontmatter (`validate.py`)
2. Create or modify content that breaks cross-section traceability (`arc42-lint.py`)
3. Fail `arc42-lint.py --strict` if the team wants cross-section warnings to block too

Staleness (`STALE` warnings: past `stale_after`, or `generated.at` older than 365 days)
and a body edited without a fresh `generated` stamp (VALIDATE's DATE-DRIFT judgment
check) are review signals, not gates — they need a human to decide UPDATE / ARCHIVE / DELETE.

The guard should **not** fail PRs that:

- Touch only `log.md` or `index.md`
- Add new concept files with valid frontmatter (these pass both scripts)
- Change the architecture docs README or tooling scripts

---

## When not to use

- **Read-only or experimental repos** — skip the gate; add a `validate.py` step to
  a nightly or weekly scheduled job instead.
- **Fresh scaffold** — right after `docs arch generate` the bundle holds only draft stubs.
  Add the guard after the first DRAFT pass fills at least Sections 1 and 9.

---

## Constitution Files

The bundle itself is the governance constitution. Before running VALIDATE, load the following sections to define what a violation _means_:

| arc42 section  | Constitution role                                                 |
| -------------- | ----------------------------------------------------------------- |
| §2 Constraints | Must always be dealt with — P0 only if marked `blocking: true`    |
| §4 Strategy    | Pattern choices — violations are P1                               |
| §9 ADRs        | Governance decisions — mark ADR as `blocking: true` to make it P0 |

To signal that violating a constraint or ADR blocks delivery, add `blocking: true` to it (ADR: MADR frontmatter). The VALIDATE operation reads `blocking: true` constraints and ADRs as its P0 list before classifying findings. arc42 says constraints "must always be dealt with; they may be negotiable, though" — so a breached constraint without the tag is a review finding to resolve or renegotiate, not an automatic merge-blocker.

---

## Non-Blocking Model and Severity Tiers

Not every violation is equal. The table below defines how findings from VALIDATE, CONVERGE and SPOT_REVIEW are classified before deciding whether to block delivery:

| Tier | Trigger                                                                             | Default action              |
| ---- | ----------------------------------------------------------------------------------- | --------------------------- |
| P0   | `blocking: true` constraint (§2) or ADR (§9) breached                               | Block PR                    |
| P1   | Significant boundary erosion, stale critical artifact (STALE-ARTIFACT)              | Report; fix first           |
| P2   | Documentation drift, local inconsistency (UNFILLED-STUB, DUPLICATE-DOC, DATE-DRIFT) | Report; fix next            |
| P3   | Hygiene: TODO markers, orphaned files, minor naming drift (TODO-MARKER, ORPHAN-DOC) | Report; fix when convenient |

Only P0 findings block delivery. The tier classifies a finding and orders the report. On request, turn the P1–P3 findings into work items in the repo's configured issue tracker (`docs/agents/issue-tracker.md`) through the `to-tickets` skill.

To promote a staleness finding to P0 (e.g., in a regulated environment), set `blocking: true` on the relevant ADR or §2 constraint, or make the staleness step fail when it prints any `STALE` warning.

---

## Violation Lifecycle

Finding a violation is step one. The full cycle maps to two operations of this skill and the tracker hand-off:

```
VALIDATE → work items (on request) → EDIT → VALIDATE (verify)
```

1. **VALIDATE** — detect findings, classify by tier (P0–P3), report in MECHANICAL · JUDGMENT · HYGIENE sections.
2. **Work items** — on request, file the P1–P3 findings the user approves in the configured issue tracker through `to-tickets`. P0 findings are reported as merge-blocking instead.
3. **EDIT** — apply the fix: update the doc, remove the stale reference, fill the stub.
4. **VALIDATE (verify)** — re-run to confirm all P0s are cleared; optionally re-run hygiene categories.

P0 violations skip the refactor queue — fix them before merging.
