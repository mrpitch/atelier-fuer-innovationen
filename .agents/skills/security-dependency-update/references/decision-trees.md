# Security Dependency Update: Decision Trees, Templates & Reference

## Decision Trees

### CVE Remediation

```
pnpm audit finding
    ├── severity: critical or high?
    │       ├── NO  → Skip (below threshold for this skill)
    │       └── YES → Continue
    ├── dependency still used?
    │       ├── NO  → Remove the dependency
    │       └── YES → Continue
    ├── patch available?
    │       ├── NO  → 2-Step Review Process (see below)
    │       │         Document: // SECURITY: No patch available for CVE-yyyy as of <date>
    │       └── YES → Continue
    ├── blocked by minimumReleaseAge?
    │       ├── YES → 2-Step Review Process (document finding)
    │       │       └── Add to minimumReleaseAgeExclude (temporary), continue to update
    │       │           Remove from minimumReleaseAgeExclude once age threshold passes
    │       └── NO  → Continue
    ├── parent ranges already allow the patched version?
    │       ├── YES → Refresh the lockfile (SKILL.md 4.0) → continue to verification
    │       └── NO  → Manual update
    ├── already in catalog?
    │       ├── YES → Update pnpm-workspace.yaml only → done
    │       └── NO  → Continue
    ├── direct dependency?
    │       ├── YES + catalog candidate → Promote to catalog at patched version; switch refs to "catalog:"
    │       ├── YES, single package only → Update that package.json
    │       └── NO (transitive) → Update parent OR add pnpm.overrides (last resort)
    └── tests pass?
            ├── YES → Commit
            └── NO  → Fix breaking changes, then commit
```

### Catalog Hygiene

```
dependency found in ≥2 package.json files
    ├── already in catalog?
    │       ├── YES → Check all packages use "catalog:" reference (fix drift)
    │       └── NO  → Promote: add to pnpm-workspace.yaml; switch all refs to "catalog:"
    ├── version inconsistency detected (different semver ranges across packages)?
    │       ├── Already in catalog → All packages should use "catalog:" — investigate who overrides
    │       └── Not in catalog → Pick the highest patched version as the catalog pin
    └── is it only in a named catalog (e.g. catalogs.zod4) during a migration?
            ├── Migration complete → Merge into default catalog:; remove named entry
            └── Migration ongoing → Leave as-is; document in commit message
```

### 2-Step Review Process (High/Critical, No Fix)

```
High/critical CVE with no available fix
    ├── Step 1: Agent review
    │       ├── Is the vulnerable code path reachable?
    │       ├── What is the impact if exploited?
    │       ├── Can the dependency be replaced or removed?
    │       └── Is an upstream fix expected soon?
    ├── Step 2: Human review (mandatory)
    │       ├── ACCEPT → Add to .pnpm-audit-exclusions.yaml with expiry date
    │       │             Add GHSA id to auditConfig.ignoreGhsas in pnpm-workspace.yaml
    │       │             Document: // SECURITY: No patch available for CVE-yyyy as of <date>
    │       └── REJECT → Escalate / find alternative / apply override
    └── On every subsequent audit run:
            ├── Re-read .pnpm-audit-exclusions.yaml
            ├── Check: fix available now? → Update and remove exclusion
            ├── Check: expiry passed? → Flag for re-review
            └── Report exclusion status in audit report
```

---

## Exclusion File Format

`.pnpm-audit-exclusions.yaml` at the repository root is the **single source of truth** for all reviewed security vulnerabilities. It serves four purposes:

1. **Audit trail** — Records every advisory reviewed through the 2-Step Review Process.
2. **Audit memory** — For accepted entries, prevents redundant re-triage on every run.
3. **Expiry tracking** — Accepted entries have an `expires` date (max 3 months).
4. **Automated re-checking** — Re-evaluated on every skill execution.

The file is **not** a way to silence warnings permanently — it is a structured, time-bounded record requiring periodic human sign-off.

```yaml
# .pnpm-audit-exclusions.yaml
# All reviewed audit findings from the 2-Step Review Process.
# Re-checked on every security audit run.

exclusions:
  # Accepted: risk is tolerable, exclusion active until expiry
  - advisory: GHSA-xxxx
    package: vulnerable-dep
    severity: HIGH
    status: accepted # accepted | rejected
    reason: >
      Code path not reachable in our application.
    reviewed_by: developer-name
    reviewed_at: 2026-05-27
    expires: 2026-08-27 # mandatory for accepted, max 3 months
    upstream_issue: https://github.com/org/repo/issues/123

  # Rejected: risk not tolerable, action taken
  - advisory: CVE-2026-9999
    package: risky-lib
    severity: CRITICAL
    status: rejected
    reason: >
      RCE vulnerability in a reachable code path. Override applied despite
      minimumReleaseAge to install patched version immediately.
    reviewed_by: developer-name
    reviewed_at: 2026-05-27
    resolution: override # override | removed | alternative | escalated
    upstream_issue: https://github.com/org/repo/issues/456
```

### Fields

| Field            | Required      | Description                                                        |
| ---------------- | ------------- | ------------------------------------------------------------------ |
| `advisory`       | Yes           | GHSA or CVE identifier                                             |
| `package`        | Yes           | Vulnerable npm package name                                        |
| `severity`       | Yes           | `HIGH` or `CRITICAL`                                               |
| `status`         | Yes           | `accepted` (risk tolerable) or `rejected` (action taken)           |
| `reason`         | Yes           | Human-readable justification for the decision                      |
| `reviewed_by`    | Yes           | Developer who reviewed                                             |
| `reviewed_at`    | Yes           | ISO date of review                                                 |
| `expires`        | Accepted only | ISO date for mandatory re-review (max 3 months from `reviewed_at`) |
| `resolution`     | Rejected only | `override`, `removed`, `alternative`, or `escalated`               |
| `upstream_issue` | Optional      | Link to the upstream issue or PR tracking the fix                  |

---

## Commit Message Templates

Use `fix(deps):` for security CVE fixes (not `build`). Include a ticket number, CVE/advisory IDs, and catalog promotion notes. Every commit must end with an `AI-Assisted-By:` trailer.

### Single CVE fix

```
fix(deps): BSD-<ID> patch <CVE-ID> in <package>

Update <package> from <old-version> to <new-version> to resolve
<CVE-ID> (<severity>): <brief description>.

Refs: https://nvd.nist.gov/vuln/detail/<CVE-ID>
AI-Assisted-By: GitHub Copilot (Claude Opus 4.6)
```

### Batch / multiple CVEs

```
fix(deps): BSD-<ID> security dependency updates

- <package> <old> → <new> (<CVE-ID>, <severity>)
- <package> <old> → <new> (<CVE-ID>, <severity>) via pnpm.overrides
- <package> promoted to catalog: (drift: apps/frontend@<v1>, libs/common@<v2>)

All builds and tests pass. Lock file regenerated.

Refs: <CVE-ID-1>, <CVE-ID-2>
AI-Assisted-By: GitHub Copilot (Claude Opus 4.6)
```

### Batch example

```
fix(deps): PROJ-1234 security dependency updates

- nth-check <2.0.1 → >=2.0.1 (GHSA-3xgq-729c-5l, CRITICAL)
- postcss <8.4.31 → 8.4.31 (CVE-2023-44270, HIGH) via pnpm.overrides
- axios <1.7.4 → ^1.7.9 (CVE-2024-12345, HIGH) — promoted to catalog:
  (was: apps/frontend@^1.6.0, libs/common@^1.7.2 — version drift detected)

All builds and tests pass. Lock file regenerated.

Refs: GHSA-3xgq-729c-5l, CVE-2023-44270, CVE-2024-12345
AI-Assisted-By: GitHub Copilot (Claude Opus 4.6)
```

---

## Quick Reference Commands

```bash
# Full high/critical audit
pnpm audit --audit-level=high

# JSON report for parsing
pnpm audit --json > /tmp/audit-report.json

# Never run `pnpm audit --fix=…`, `--ignore` or `--ignore-unfixable`: on pnpm 11 they
# edit project files and exit 0 instead of reporting the gate (see SKILL.md 4.0)

# Find deps used in more than one package.json (catalog candidates)
grep -r '"dependencies"\|"devDependencies"' --include='package.json' -l \
  | grep -v 'node_modules\|pnpm-lock' \
  | xargs -I{} sh -c 'jq -r "(.dependencies // {} + .devDependencies // {}) | keys[]" {}' \
  | sort | uniq -d

# Trace who uses a specific package and which version
pnpm why <package-name>

# Update a dep in a specific workspace
pnpm --filter './apps/backend' update <pkg>@<version>

# Regenerate lock file (after catalog or package.json edits)
pnpm install

# PR checks (prettier + lint + jscpd)
pnpm -s run pr:check --if-present

# Build changed packages
pnpm -s run pr:build --if-present

# Test changed packages
pnpm -s run pr:test --if-present
```

---

## Security Update Report Template

Save as `docs/audit-reports/YYYY-MM-DD-security-audit.md`.

```markdown
# Security Update Report — YYYY-MM-DD

## Scan Summary

- **Date:** YYYY-MM-DD
- **Performed by:** <developer name or "security-dependency-update skill">
- **Tools:** pnpm audit, Trivy (if available)
- **Severity threshold:** HIGH and CRITICAL
- **Packages scanned:** all workspace packages
- **Branch:** `<branch-name>`

## Remediation List

| #   | CVE / Advisory | Severity | Package    | Affected Workspace(s)      | Old Version | New Version | Method            |
| --- | -------------- | -------- | ---------- | -------------------------- | ----------- | ----------- | ----------------- |
| 1   | GHSA-xxxx      | CRITICAL | nth-check  | apps/frontend              | <2.0.1      | >=2.0.1     | direct dep update |
| 2   | CVE-yyyy       | HIGH     | postcss    | apps/frontend, libs/common | <8.4.31     | 8.4.31      | pnpm.overrides    |
| 3   | CVE-zzzz       | HIGH     | unused-lib | apps/backend               | 1.2.0       | —           | removed (unused)  |

**Method** values: `direct dep update`, `catalog update`, `pnpm.overrides`, `lockfile refresh`,
`minimumReleaseAgeExclude`, `removed (unused)`, `parent dep update`

## Catalog Changes

| Package | Before                           | After           | Reason                  |
| ------- | -------------------------------- | --------------- | ----------------------- |
| axios   | Not in catalog (^1.6.0 / ^1.7.2) | catalog: ^1.7.9 | Version drift + CVE fix |

_Leave empty if no catalog changes were made._

## Temporary Measures

### pnpm.overrides added

| Package                   | Override Version | Reason                          | Remove When         |
| ------------------------- | ---------------- | ------------------------------- | ------------------- |
| vulnerable-transitive-dep | >=1.0.9          | CVE-yyyy, parent has no fix yet | Parent releases fix |

### minimumReleaseAgeExclude added

| Package@Version | Reason                               | Remove When                        |
| --------------- | ------------------------------------ | ---------------------------------- |
| some-pkg@2.1.4  | CVE-xxxx, patch released <5 days ago | Package passes 5-day age threshold |

_These are temporary. Re-checked on every security audit run._

## 2-Step Review Findings

### Accepted exclusions

| Advisory  | Package  | Severity | Reason                  | Reviewed By | Expires    |
| --------- | -------- | -------- | ----------------------- | ----------- | ---------- |
| GHSA-aaaa | some-dep | HIGH     | Code path not reachable | @developer  | YYYY-MM-DD |

### Rejected findings

| Advisory | Package   | Severity | Reason                | Reviewed By | Resolution       |
| -------- | --------- | -------- | --------------------- | ----------- | ---------------- |
| CVE-bbbb | risky-lib | CRITICAL | RCE in reachable path | @developer  | override applied |

_All entries here must have a corresponding record in `.pnpm-audit-exclusions.yaml`._
_Accepted exclusions must also appear in `auditConfig.ignoreGhsas` in `pnpm-workspace.yaml`._

## Dependencies Removed

| Package    | Was Used In  | Reason                                |
| ---------- | ------------ | ------------------------------------- |
| unused-lib | apps/backend | No imports found, vulnerable, removed |

## Verification

- [ ] `pnpm audit --audit-level=high` clean (0 high/critical, or only accepted exclusions)
- [ ] `pnpm pr:check` passed (lint + format + jscpd)
- [ ] Build passed (`pnpm pr:build` or `pnpm build`)
- [ ] Tests passed with coverage meeting the project's configured threshold (`pnpm pr:test` or `pnpm test`)
- [ ] Lock file regenerated and committed
- [ ] `.pnpm-audit-exclusions.yaml` committed (if modified)
- [ ] `auditConfig.ignoreGhsas` in `pnpm-workspace.yaml` in sync with accepted exclusions
- [ ] `pnpm audit --audit-level=high` left the working tree unchanged (`git diff --exit-code`)
- [ ] `minimumReleaseAgeExclude` entries documented as temporary

## Commit

- **Branch:** `<branch-name>`
- **Commit:** `<commit-sha>`
- **Message:** `fix(deps): BSD-<ID> <summary>`
```
