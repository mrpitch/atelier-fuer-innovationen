---
type: explanation
title: 'Runtime View — Publishing a change'
arc42_section: 6
description: 'What runs when a contributor pushes to main: quality checks and validation run first, and a failure in either stops the deploy. Pull requests run the checks only.'
tags: [architecture, runtime, deployment, ci]
status: draft
generated:
  by: docs-code-to-docs/1.0.0
  at: 2026-11-05T11:16:00Z
verified:
  by: claude-code/sonnet-5-5
  at: 2026-11-08T11:55:02Z
sources:
  - resource: .github/workflows/main.yml
  - resource: package.json
  - resource: scripts/validate-okf.ts
  - resource: scripts/copy-integrity.ts
links:
  - 07-deployment/deployment-topology.md
  - 08-crosscutting/content-conventions.md
  - 11-risks/risks-and-tech-debt.md
---

# Runtime View — Publishing a change

## Scenario: Contributor pushes to `main`

**Trigger:** a push to `main` on GitHub.

**Actors involved:** Contributor, GitHub, CI/CD Workflow, Content Validator, AWS hosting (S3), AWS hosting (CloudFront).

### Sequence

```mermaid
sequenceDiagram
  accTitle: Publishing a change
  accDescr: A push to main starts the workflow. Job quality runs the format check, lint and typecheck. Job validate-okf runs the tests and the Content Validator. Job validate-content checks content integrity. Job validate-copy-integrity checks that protected Xeniapolis copy is unchanged. Job build-check builds the site, scans the log for missing-image warnings and keeps the export as an artefact. Job deploy starts only when all five have passed. It syncs that export to S3 and invalidates CloudFront.
  autonumber
  participant C as Contributor
  participant GH as GitHub
  participant CI as CI/CD Workflow
  participant VAL as Content Validator
  participant S3 as AWS hosting (S3)
  participant CF as AWS hosting (CloudFront)

  C->>GH: git push to main
  GH->>CI: start workflow
  par job quality
    CI->>CI: pnpm format:check, pnpm lint, pnpm typecheck
  and job validate-okf
    CI->>VAL: pnpm test, then pnpm validate:okf
    VAL-->>CI: pass or fail
  and job validate-content
    CI->>CI: pnpm validate:content
  and job validate-copy-integrity
    CI->>CI: pnpm validate:copy-integrity
  and job build-check
    CI->>CI: pnpm build, scan build log, upload out/
  end
  opt all five jobs passed
    CI->>CI: job deploy: download out/ artefact
    CI->>S3: aws s3 sync ./out/
    CI->>CF: create-invalidation /*
  end
```

_Figure: publishing a change, sequence. `quality`, `validate-okf`, `validate-content`, `validate-copy-integrity` and `build-check` run in parallel; `deploy` has `needs: [quality, validate-okf, validate-content, validate-copy-integrity, build-check]`._

### Failure handling

| Failure                             | Effect                                                                                                                                           |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `quality` fails                     | The run is marked failed and `deploy` does not run. The live site keeps the previous version.                                                    |
| `validate-okf` fails                | The run is marked failed and `deploy` does not run. The live site keeps the previous version. See [RISK-03](../11-risks/risks-and-tech-debt.md). |
| `validate-content` fails            | The run is marked failed and `deploy` does not run. The live site keeps the previous version.                                                    |
| `validate-copy-integrity` fails     | A protected Xeniapolis text block was edited, split, merged or deleted. `deploy` does not run. The live site keeps the previous version.         |
| `build-check` fails                 | `pnpm build` failed or its log holds a pinned missing-image warning. `deploy` does not run.                                                      |
| `pnpm build` fails                  | `build-check` fails and `deploy` does not run. The live site keeps the previous version.                                                         |
| `aws s3 sync` fails part-way        | [INFERENCE] The bucket holds a mix of old and new files until the next successful run.                                                           |
| Invalidation fails                  | New files are in S3. Visitors may still get cached pages until their cache entries expire.                                                       |
| A page was removed from the content | Its file stays in S3 because the sync has no `--delete`. See [RISK-04](../11-risks/risks-and-tech-debt.md).                                      |

### Notes

- Nothing publishes except the push to `main`. A pull request targeting `main` runs the five check jobs only; `deploy` is guarded by `github.event_name == 'push'`. There is no preview build and no manual approval step.
- [INFERENCE] A broken MDX file fails `pnpm build` and so never reaches S3. No test in the repository exercises this.
- Credentials: `deploy` authenticates with the secrets listed in [Security conventions](../08-crosscutting/security-conventions.md).

## See also

- [How to build and deploy the site](../../how-to/how-to-build-and-deploy.md)
