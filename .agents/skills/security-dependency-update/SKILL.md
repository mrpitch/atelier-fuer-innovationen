---
name: security-dependency-update
description: |
  Use this skill when the user asks to "fix security vulnerabilities", "patch CVEs", "run a security audit", "update vulnerable dependencies", "remediate npm audit findings", or "run a security update sweep". Scans all pnpm monorepo dependencies for high/critical CVEs and remediates them; also identifies cross-package catalog drift and version inconsistencies.
---

# Security Dependency Update

## When to Use

- Running a full security audit of the monorepo
- Remediating specific CVEs reported by `pnpm audit` or Trivy
- Addressing findings from a CI/CD security scan
- Proactively patching high/critical vulnerabilities before a release

## Overview

1. **Scan** — Identify high/critical CVEs across all packages
2. **Catalog Hygiene** — Detect cross-package deps missing from the catalog and version inconsistencies
3. **Triage** — Evaluate each CVE finding for exploitability and patch availability
4. **Patch** — Update vulnerable packages; promote catalog candidates while patching
5. **Verify** — Confirm builds and tests pass after patching
6. **Commit** — Create a conventional commit summarizing all changes

---

## Phase 1: Scan

### 1.1 pnpm Audit (Primary)

```bash
# Full audit — JSON for analysis (keep stderr separate so JSON stays parseable)
pnpm audit --json > /tmp/audit-report.json 2> /tmp/audit-report.stderr.log

# Human-readable summary filtered to high/critical
pnpm audit --audit-level=high
```

Parse the JSON report:

```bash
# Count by severity
cat /tmp/audit-report.json | jq '.metadata.vulnerabilities'

# List only high + critical advisories with affected packages
# .advisories is a keyed object — use to_entries to iterate safely
cat /tmp/audit-report.json | jq '[.advisories | to_entries[] | .value | select(.severity == "high" or .severity == "critical") | {id: .id, title: .title, severity: .severity, module: .module_name, patched_versions: .patched_versions, findings: [.findings[].paths[]]}]'
```

### 1.2 Trivy Scan (Secondary, if available)

```bash
which trivy && trivy fs --config trivy.yaml --severity HIGH,CRITICAL --format table . 2>&1 || echo "Trivy not available"
```

### 1.3 Build a Remediation List

Create a table of findings before making any changes (catalog issues are added in Phase 2):

| CVE / Advisory ID | Severity | Vulnerable Package | Affected Workspace Package(s)   | Patched Version | Action                   |
| ----------------- | -------- | ------------------ | ------------------------------- | --------------- | ------------------------ |
| GHSA-xxxx         | CRITICAL | `example-lib`      | `apps/frontend`, `apps/backend` | `>=2.1.4`       | Update direct dep        |
| CVE-yyyy          | HIGH     | `transitive-dep`   | `libs/common`                   | `>=1.0.9`       | Override / update parent |

---

## Phase 2: Catalog Hygiene

Run this analysis **before** patching so that vulnerable packages that need to move to the catalog can be promoted in the same pass.

### 2.1 Find Cross-Package Dependencies

A dependency used in **two or more** workspace packages is a catalog candidate:

```bash
grep -r '"dependencies"\|"devDependencies"' --include='package.json' -l \
  | grep -v 'node_modules\|pnpm-lock' \
  | xargs -I{} sh -c 'jq -r "(.dependencies // {} + .devDependencies // {}) | keys[]" {}' \
  | sort | uniq -d
```

Cross-reference the output against `catalog:` in `pnpm-workspace.yaml`. Any package **not** already in the catalog but appearing in ≥2 `package.json` files is a catalog candidate.

### 2.2 Detect Version Inconsistencies

```bash
# Trace who uses a specific package and which version
pnpm why <package-name>
```

Version drift between packages makes security patching harder — one package gets the fix, another stays vulnerable.

### 2.3 Build the Catalog Candidate List

| Package | Declared Versions   | Appears In                      | Catalog Status               | Recommended Action                       |
| ------- | ------------------- | ------------------------------- | ---------------------------- | ---------------------------------------- |
| `zod`   | `^3.22.0`, `^4.0.0` | `apps/frontend`, `apps/backend` | `catalog:` exists (`^4.0.0`) | Align all to `catalog:`                  |
| `axios` | `^1.6.0`, `^1.7.2`  | `apps/frontend`, `libs/common`  | Not in catalog               | Promote to `catalog:` at patched version |

**Priority rule**: If a catalog candidate is also in the CVE remediation list, the patched version becomes the catalog entry — handle both in one edit.

### 2.4 Catalog Entry Format

```yaml
# pnpm-workspace.yaml
catalog:
  axios: ^1.7.9 # patched version becomes the catalog pin
catalogs:
  zod4:
    zod: 4.0.0
```

In individual `package.json` files: `"axios": "catalog:"` or `"zod": "catalog:zod4"`.

- Use the default `catalog:` for the canonical/current version of a package.
- Use a named catalog only for parallel versioning during a migration. Consolidate back to the default catalog once migration is complete.

---

## Phase 3: Triage

### Direct Dependency (in a `package.json` `dependencies` or `devDependencies`)

→ Update the version in the owning package. If the package is a catalog candidate, promote it to `pnpm-workspace.yaml` at the patched version and switch the `package.json` reference to `"catalog:"` in one step.

### Direct Dependency already in the catalog

→ Update `pnpm-workspace.yaml` under `catalog:` or the relevant named catalog. All workspace packages referencing it via `"catalog:"` get the fix automatically — no individual `package.json` edits needed.

### Transitive Dependency

→ Check if the parent package has a release that pins the patched transitive version. If yes, update the parent. If no patch exists yet, add a `pnpm.overrides` entry at the workspace root:

```json
{ "pnpm": { "overrides": { "vulnerable-transitive-dep": ">=1.0.9" } } }
```

### No Fix Available

→ First check if the dependency is still used. If not, **remove it** — always preferable to carrying an unused vulnerable dependency.

If still needed, use the **2-Step Review Process** (Phase 3b). Document with `// SECURITY: No patch available for CVE-yyyy as of <date>`. Do **not** suppress the advisory without going through the review process.

---

## Phase 3b: 2-Step Review Process (High/Critical with No Fix)

> **This is a safety net, not the default path.** Always prefer updating or removing the dependency first.

### Step 1: Agent Review (Automated)

Evaluate and document:

1. **Exploitability** — Is the vulnerable code path reachable in our application?
2. **Impact** — What is the blast radius? (data exposure, RCE, DoS, etc.)
3. **Alternatives** — Can the dependency be replaced or removed?
4. **Timeline** — Is an upstream fix expected soon?

Present the assessment to the user:

```markdown
### Exclusion Review: <CVE-ID> in <package>

- **Severity:** HIGH / CRITICAL
- **Vulnerable path:** `apps/frontend > some-lib > vulnerable-dep`
- **Code path reachable:** Yes / No / Uncertain
- **Impact if exploited:** <description>
- **Upstream fix ETA:** <date or "unknown">
- **Recommendation:** Exclude / Do not exclude
- **Justification:** <reason>
```

### Step 2: Human Review (Mandatory)

**Ask the user** to accept or reject the exclusion. The agent must not accept exclusions autonomously.

- **Accept** → Record as `status: accepted` in `.pnpm-audit-exclusions.yaml` with an expiry date. Add the advisory's GHSA id to `auditConfig.ignoreGhsas` in `pnpm-workspace.yaml`.
- **Reject** → Record as `status: rejected` in `.pnpm-audit-exclusions.yaml` with a `resolution` field. Then escalate, find an alternative, or apply an override.

All reviewed findings — accepted **and** rejected — must be recorded. See [`references/decision-trees.md`](./references/decision-trees.md#exclusion-file-format) for the full `.pnpm-audit-exclusions.yaml` format and field reference.

### Re-checking Exclusions (mandatory on every run)

Read `.pnpm-audit-exclusions.yaml` at the start of every execution and re-check each entry:

**Accepted entries:**

1. **Fix available?** → `pnpm view <package> versions --json`. If patched, update dependency and remove the entry.
2. **Expired?** → Compare `expires` against today. If expired → flag for mandatory re-review.
3. **Advisory withdrawn?** → Remove the entry.
4. **Renewed too often?** → If renewed 2+ times for the same advisory, flag and recommend alternative.

**Rejected entries:**

1. **Escalation resolved?** → Remove the entry.
2. **Override still needed?** → If parent includes the fix natively, remove the override and the entry.

**Additionally:**

- `minimumReleaseAgeExclude` in `pnpm-workspace.yaml`: remove each entry when the package passes the age threshold.
- `pnpm.overrides` in root `package.json`: remove when the parent includes the fix natively (`pnpm why <package>`).
- `auditConfig.ignoreGhsas` in `pnpm-workspace.yaml`: keep in sync — add when recording an accepted exclusion, remove when the exclusion is resolved or expires unrenewed. Never add an id without a corresponding accepted, unexpired entry in `.pnpm-audit-exclusions.yaml`. Do not use `pnpm.auditConfig.ignoreCves`: pnpm 11 ignores it (in `package.json` with a warning, in `pnpm-workspace.yaml` silently).

Present a summary table:

```markdown
### Exclusion Status Check

| Advisory  | Package        | Status                    | Action Needed           |
| --------- | -------------- | ------------------------- | ----------------------- |
| GHSA-xxxx | vulnerable-dep | Fix available (v2.1.4)    | Update and remove entry |
| CVE-yyyy  | other-dep      | Expired (was 2026-05-01)  | Re-review required      |
| GHSA-zzzz | third-dep      | Still valid (exp 2026-08) | No action               |
```

---

## Phase 4: Patch

### 4.0 Update parents before overriding

Never use `pnpm audit --fix=update|override`, `--ignore` or `--ignore-unfixable` to remediate. On pnpm 11 each one edits project files (`--fix=update` rewrites `package.json` ranges and the lockfile, sometimes adding `minimumReleaseAgeExclude` entries; `--ignore*` write `auditConfig.ignoreGhsas` into `pnpm-workspace.yaml`) and exits 0 instead of reporting the `--audit-level` gate — in CI that turns the audit step into a silent no-op.

1. Bump direct dependencies to a patched version.
2. For transitive findings, run `pnpm why <package>`. If every parent's range already allows the patched version, the lockfile is just stale: `pnpm update <transitive>` may report "Already up to date" for non-direct packages, so add a temporary override (`'<pkg>@<<patched>': '<patched>'`), run `pnpm install`, remove the override, and run `pnpm install` again. The lockfile keeps the patched version and no override remains.
3. Only when a parent pins a vulnerable version and no fixed parent release exists, keep an override (4.4).

Overrides are a **last resort** — they accumulate and become difficult to remove.

### 4.1 Promote Catalog Candidates (combined with patch)

1. Add/update the entry in `pnpm-workspace.yaml` under `catalog:` at the **patched version**.
2. Replace the version string in every affected `package.json` with `"catalog:"`.
3. Run `pnpm install` to apply all changes.

```yaml
# pnpm-workspace.yaml — promote axios to catalog at patched version
catalog:
  axios: ^1.7.9 # was: ^1.6.0 in frontend, ^1.7.2 in common
```

### 4.2 Patch Catalog-only Entries

Update `pnpm-workspace.yaml` only:

```yaml
catalog:
  some-lib: ^2.3.1 # bumped from ^2.1.0 to patch CVE-yyyy
```

### 4.3 Update Direct Dependencies Not in Catalog

```bash
pnpm --filter './apps/frontend' update <package-name>@<patched-version>
```

### 4.4 Apply pnpm Overrides (Transitive Deps)

Edit root `package.json` `pnpm.overrides` block (see Phase 3 — Transitive Dependency).

### 4.5 Regenerate Lock File

```bash
pnpm install
```

### 4.6 Verify Audit Is Clean

```bash
pnpm audit --audit-level=high 2>&1
# Expected: found 0 vulnerabilities (or only accepted exclusions)
```

---

## Phase 5: Verify

```bash
pnpm -s run pr:check --if-present   # lint + format + jscpd

# Build changed packages only (preferred)
pnpm -r --filter='./apps/*[origin/main]' --filter='./libs/*[origin/main]' --filter='./services/*[origin/main]' --if-present run build
# or full build: pnpm build

# Tests — ensure any project coverage threshold continues to pass
pnpm -s run pr:test --if-present    # changed packages only
# or full suite: pnpm test
```

If tests fail after patching: check for breaking API changes in the updated package and fix affected call sites. Do not suppress failures — investigate and fix.

---

## Phase 6: Commit & Branch

### 6.0 Check Existing Branch

```bash
git branch --show-current
```

**Ask the user:** commit to this branch, or create a new dedicated branch?

### 6.1 Create a Branch

Propose a branch name and **confirm with the user before creating it**:

```bash
git checkout -b hotfix/security-update-<package>-<cve-id>
# or for batch/scheduled maintenance:
git checkout -b bugfix/BSD-<ID>-dependency-updates
```

### 6.2 Stage Changes

```bash
git add pnpm-lock.yaml pnpm-workspace.yaml package.json
# Plus individual package.json files for direct dep updates or catalog references
```

### 6.3 Generate Commit Message

Use `fix(deps):` prefix (not `build`). Include ticket number, CVE/advisory IDs, catalog promotion notes. End with `AI-Assisted-By:` trailer.

See [`references/decision-trees.md`](./references/decision-trees.md#commit-message-templates) for full message templates with examples.

### 6.4 Confirm with User Before Committing

Ask:

1. Does the commit message look correct?
2. Should a ticket/issue number be referenced?
3. Is the branch name correct?

---

## Phase 7: Documentation

Save a security update report to `docs/audit-reports/YYYY-MM-DD-security-audit.md`. See [`references/decision-trees.md`](./references/decision-trees.md#security-update-report-template) for the report template.

---

## Supply Chain Hardening Check

After completing the CVE sweep, check whether the project has the pnpm hardening settings from [pnpm's supply chain security docs](https://pnpm.io/supply-chain-security) in place.

**If the `supply-chain-security` skill is available** (scan the loaded skills list for a skill named or described around supply chain / dependency security auditing), delegate to it — it performs a full audit with detection commands, risk ratings, and remediation snippets.

**If the `supply-chain-security` skill is not available**, run these checks directly and report any gaps:

```bash
# Check for pnpm hardening settings in pnpm-workspace.yaml and .npmrc
grep -E 'allowBuilds|onlyBuiltDependencies|dangerouslyAllowAllBuilds' pnpm-workspace.yaml .npmrc 2>/dev/null
grep 'blockExoticSubdeps' pnpm-workspace.yaml .npmrc 2>/dev/null
grep 'minimumReleaseAge' pnpm-workspace.yaml .npmrc 2>/dev/null
grep 'trustPolicy' .npmrc 2>/dev/null
```

Report missing settings as gaps, then offer to apply them:

| Setting              | Location                          | Recommended value     | What it does                                                                        |
| -------------------- | --------------------------------- | --------------------- | ----------------------------------------------------------------------------------- |
| `allowBuilds`        | `pnpm-workspace.yaml`             | Explicit package list | Blocks postinstall scripts — only listed packages may run them                      |
| `blockExoticSubdeps` | `pnpm-workspace.yaml` or `.npmrc` | `true`                | Prevents transitive deps from resolving via git or tarball URLs                     |
| `minimumReleaseAge`  | `pnpm-workspace.yaml` or `.npmrc` | `1440` (24 h)         | Delays installation of newly published versions to allow time for malware detection |
| `trustPolicy`        | `.npmrc`                          | `no-downgrade`        | Prevents installing a version with lower publisher trust than the current one       |

For each missing setting, show the user the exact config line and offer to add it.

---

## Decision Trees

Consult **[`references/decision-trees.md`](./references/decision-trees.md)** for the CVE remediation decision tree, catalog hygiene decision tree, and 2-Step review decision tree.

---

## Safety Rules

- **Never use `--force`** to bypass audit failures.
- **Never commit a `pnpm-lock.yaml` that wasn't generated by `pnpm install`** (no manual edits).
- **Minimise blast radius**: prefer scoped `--filter` updates over blanket `pnpm update --latest` across all packages.
- **No `--latest` without explicit approval**: always confirm the exact target version; never let `--latest` silently pull in a major bump.
- **No major version bumps without approval**: a major version update may require code changes — stop and check with the user before proceeding.
- **One commit per logical group** of CVE fixes when packages are unrelated — makes rollback easier.
- Document any unfixable finding with `// SECURITY: CVE-xxxx — no upstream fix as of <date>`.
- **Catalog promotions are additive-only during patching**: never remove a `package.json` explicit version entry without adding `"catalog:"` and confirming `pnpm install` resolves correctly.
- **Do not collapse named catalogs** unless the migration they support is fully complete — check with the team first.
- **Check Renovate first**: verify Renovate has not already opened a PR for the same package/version. Avoid duplicate work.
- **Lock file is the source of truth**: always regenerate and commit `pnpm-lock.yaml` after any change.
- **Test coverage must remain ≥80%**: security patches must not reduce coverage below the project threshold.
