---
type: explanation
title: 'Security Strategy'
arc42_section: 8
description: 'Why the site has no run-time security surface, and where the remaining exposure sits: the build, publish and dependency chain.'
tags: [architecture, crosscutting, security]
status: draft
generated:
  by: docs-code-to-docs/1.0.0
  at: 2026-11-05T11:01:33Z
sources:
  - resource: next.config.mjs
  - resource: .github/workflows/main.yml
  - resource: pnpm-workspace.yaml
  - resource: .npmrc
  - resource: src/app/layout.tsx
links:
  - 08-crosscutting/security-conventions.md
  - 11-risks/risks-and-tech-debt.md
---

# Security Strategy

## Context

The site is a folder of static files. It has no login, no user accounts, no forms and no server-side code at run time. A search of `src/` finds no analytics script, cookie handling or third-party embed. The usual web application concerns (authentication, authorization, session handling, input validation) do not apply to any building block.

## Discussion

The exposure moved from run time to the chain that produces and publishes the files:

- **Publishing credentials.** The workflow writes to S3 and invalidates CloudFront with an AWS access key pair stored as repository secrets. Whoever can push to `main` causes a deploy with those credentials. See [Security conventions](./security-conventions.md).
- **Dependencies.** The build installs dozens of packages from the registry. Two controls exist: pnpm's `allowBuilds` allows install scripts only for `esbuild` and `sharp`, and a `minimumReleaseAge` gate (configured outside the repository) holds back freshly published versions. [ADR-0001](../09-decisions/adr-0001-adopt-fumadocs-base-ui.md) records the one deliberate exception.
- **Private registry tokens.** `.npmrc` is committed and empty. Its comment says to add `.npmrc` to `.gitignore` before putting a token in it.
- **Content.** MDX is compiled at build time from files in the repository. A contributor's MDX can run arbitrary JavaScript in the visitor's browser, so write access to `src/content/docs/` is write access to the site's script surface.

Not configured in this repository: HTTP response headers (CSP, HSTS), CloudFront access logging, S3 bucket policy and branch protection. These may exist in the AWS account or the GitHub settings; the code cannot confirm either way.

## Consequences

- No authentication or authorization concept is needed, and none should be added without a new decision.
- Security work concentrates on three places: who can push to `main`, how the AWS credentials are scoped, and which dependencies enter the build.
- Anything that needs a response header or a cookie has to be solved at the CDN, not in the application, because the static export cannot set either.

## See also

- [Static export strategy](./static-export-strategy.md)
- [Risks and Technical Debts](../11-risks/risks-and-tech-debt.md)
