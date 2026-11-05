---
type: explanation
title: 'Risks and Technical Debts'
arc42_section: 11
description: 'Risks and technical debt visible in the code, workflow and ADRs, with a suggested measure for each. Likelihood and impact are unreviewed estimates.'
tags: [architecture, risks]
status: draft
generated:
  by: docs-code-to-docs/1.0.0
  at: 2026-11-05T11:01:33Z
sources:
  - resource: .github/workflows/main.yml
  - resource: source.config.ts
  - resource: src/app/layout.tsx
  - resource: src/app/layout.config.tsx
  - resource: src/app/(home)/page.tsx
  - resource: pnpm-workspace.yaml
  - resource: docs/architecture/09-decisions/adr-0001-adopt-fumadocs-base-ui.md
  - resource: docs/architecture/09-decisions/adr-0002-per-section-theming.md
links:
  - 09-decisions/adr-0001-adopt-fumadocs-base-ui.md
  - 09-decisions/adr-0002-per-section-theming.md
---

# Risks and Technical Debts

Every entry below is `inferred` from code, configuration or an ADR, except RISK-03, which is closed. No one has reviewed likelihood, impact or priority; they are first estimates for the team to confirm.

## Risk register

| ID      | Risk                                                                                                                                                                                                                                                        | Likelihood | Impact | Suggested measure                                                                                                    | Status         |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------ | -------------------------------------------------------------------------------------------------------------------- | -------------- |
| RISK-01 | `@fumadocs/base-ui` trails `fumadocs-ui` by a full major; future Fumadocs releases may land on one package first. Reverting is a repo-wide import rewrite ([ADR-0001](../09-decisions/adr-0001-adopt-fumadocs-base-ui.md)).                                 | med        | med    | Review the lag at each Fumadocs upgrade; keep the version exemptions in `pnpm-workspace.yaml` current                | open, inferred |
| RISK-02 | Two palettes, each with light and dark variants, drift apart or miss a new token ([ADR-0002](../09-decisions/adr-0002-per-section-theming.md)).                                                                                                             | med        | low    | Change tokens in all four sets in one commit; check both sections after each palette change                          | open, inferred |
| RISK-03 | Closed by [#128](https://github.com/mrpitch/atelier-fuer-innovationen/issues/128): job `deploy` now has `needs: [quality, validate-okf]` and runs on pushes only, so a failing validation, test, format check, lint or typecheck stops a production deploy. | low        | med    | Keep `deploy` gated on every check job when a new one is added                                                       | closed         |
| RISK-04 | `aws s3 sync ./out/ s3://<bucket>` runs without `--delete`. A page removed from the content stays in the bucket and stays reachable by URL.                                                                                                                 | high       | med    | Decide whether removed pages must disappear; if so add `--delete` and confirm the bucket holds nothing else          | open, inferred |
| RISK-05 | Every visitor downloads the complete static search index on first search. It is about 2.3 MB in the local `out/` checked on 2026-11-05 and grows with the content ([Search](../06-runtime/runtime-search.md)).                                              | med        | low    | Check the transferred size behind CloudFront (compression); set a size threshold at which to move to a hosted search | open, inferred |
| RISK-06 | The deploy uses a long-lived AWS access key pair in repository secrets. A leak allows writes to the bucket until the key is rotated.                                                                                                                        | low        | high   | Move to short-lived OIDC credentials for GitHub Actions; scope the IAM policy to the one bucket and distribution     | open, inferred |
| RISK-07 | No staging or preview environment. Each merge to `main` publishes to production.                                                                                                                                                                            | med        | med    | Add a preview build on pull requests, or protect `main` with required checks                                         | open, inferred |

## Technical debts

| ID    | Debt item                                                                                                                                                                                                                    | Affected building block | Estimated effort | Priority |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | ---------------- | -------- |
| TD-01 | `layout.config.tsx` links to `/docs/xeniapolisviertel-der-annaeherung` (missing slash after `xeniapolis`). Menu descriptions in `layout.config.tsx` and the cards on the home page are Lorem ipsum or English template text. | App Shell, Home Route   | not estimated    | med      |
| TD-02 | `src/app/layout.tsx` sets `<html lang="en">` while the content is German.                                                                                                                                                    | App Shell               | not estimated    | med      |
| TD-03 | `source.config.ts` carries a comment listing fumadocs-mdx v11 to v15 changes and states "None of this is applied here yet; that's a later ticket."                                                                           | Content Pipeline        | not estimated    | low      |

## Mitigations in progress

None are in progress. RISK-03 was closed by [#128](https://github.com/mrpitch/atelier-fuer-innovationen/issues/128); [How to build and deploy the site](../../how-to/how-to-build-and-deploy.md) describes the gated deploy.
