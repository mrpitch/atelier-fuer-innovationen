---
type: explanation
title: 'Runtime View — Publishing a change'
arc42_section: 6
description: 'What runs when a contributor pushes to main: validation and deploy start in parallel, and a failed validation does not stop the deploy.'
tags: [architecture, runtime, deployment, ci]
status: draft
generated:
  by: docs-code-to-docs/1.0.0
  at: 2026-11-05T11:16:00Z
sources:
  - resource: .github/workflows/main.yml
  - resource: package.json
  - resource: scripts/validate-okf.ts
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
  accDescr: A push to main starts the workflow. Job check-changes looks for Markdown changes. If there are any, job validate-okf runs tests and the Content Validator. Job deploy runs in parallel and does not wait for validation. It installs, builds, syncs the export to S3 and invalidates CloudFront.
  autonumber
  participant C as Contributor
  participant GH as GitHub
  participant CI as CI/CD Workflow
  participant VAL as Content Validator
  participant S3 as AWS hosting (S3)
  participant CF as AWS hosting (CloudFront)

  C->>GH: git push to main
  GH->>CI: start workflow
  par job validate-okf
    CI->>CI: check-changes
    opt Markdown changed
      CI->>VAL: pnpm test, then pnpm validate:okf
      VAL-->>CI: pass or fail
    end
  and job deploy
    CI->>CI: install, build
    CI->>S3: aws s3 sync ./out/
    CI->>CF: create-invalidation /*
  end
```

_Figure: publishing a change, sequence. The jobs run in parallel because `deploy` has no `needs:`._

### Failure handling

| Failure                             | Effect                                                                                                                     |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `validate-okf` fails                | The run is marked failed. `deploy` is not affected and still publishes. See [RISK-03](../11-risks/risks-and-tech-debt.md). |
| `pnpm build` fails                  | `deploy` stops before the sync. The live site keeps the previous version.                                                  |
| `aws s3 sync` fails part-way        | [INFERENCE] The bucket holds a mix of old and new files until the next successful run.                                     |
| Invalidation fails                  | New files are in S3. Visitors may still get cached pages until their cache entries expire.                                 |
| A page was removed from the content | Its file stays in S3 because the sync has no `--delete`. See [RISK-04](../11-risks/risks-and-tech-debt.md).                |

### Notes

- Nothing publishes except the push to `main`. There is no preview build and no manual approval step.
- [INFERENCE] A broken MDX file fails `pnpm build` and so never reaches S3. No test in the repository exercises this.
- Credentials: `deploy` authenticates with the secrets listed in [Security conventions](../08-crosscutting/security-conventions.md).

## See also

- [How to build and deploy the site](../../how-to/how-to-build-and-deploy.md)
