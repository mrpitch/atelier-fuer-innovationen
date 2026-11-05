---
type: reference
title: 'Security Conventions'
arc42_section: 8
description: 'Secrets, variables and supply-chain settings the build and deploy workflow depends on.'
tags: [architecture, crosscutting, security]
status: draft
generated:
  by: docs-code-to-docs/1.0.0
  at: 2026-11-05T11:01:33Z
sources:
  - resource: .github/workflows/main.yml
  - resource: pnpm-workspace.yaml
  - resource: .npmrc
links:
  - 08-crosscutting/security-strategy.md
---

# Security Conventions

## Workflow secrets and variables

The `deploy` job in `.github/workflows/main.yml` reads these from the GitHub repository settings.

| Kind     | Name                       | Used by                                    | Holds                      |
| -------- | -------------------------- | ------------------------------------------ | -------------------------- |
| Secret   | `AWS_S3_ACCESS_KEY_ID`     | `aws-actions/configure-aws-credentials@v4` | AWS access key ID          |
| Secret   | `AWS_S3_SECRET_ACCESS_KEY` | `aws-actions/configure-aws-credentials@v4` | AWS secret access key      |
| Secret   | `AWS_CF_DISTRIBUTION_ID`   | `aws cloudfront create-invalidation`       | CloudFront distribution ID |
| Variable | `AWS_S3_REGION`            | `aws-actions/configure-aws-credentials@v4` | AWS region                 |
| Variable | `AWS_S3_BUCKET_NAME`       | `aws s3 sync`                              | Target bucket name         |

The credentials are a long-lived access key pair. The workflow does not use short-lived OIDC credentials.

## Supply-chain settings

| Setting                    | File                  | Value                                                | Effect                                                                         |
| -------------------------- | --------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------ |
| `allowBuilds`              | `pnpm-workspace.yaml` | `esbuild: true`, `sharp: true`                       | Only these two packages may run install scripts                                |
| `minimumReleaseAgeExclude` | `pnpm-workspace.yaml` | `fumadocs-core@16.15.0`, `@fumadocs/base-ui@16.15.0` | Exempts two versions from pnpm's release-age gate                              |
| Private registry           | `.npmrc`              | empty                                                | No registry token is committed; add `.npmrc` to `.gitignore` before adding one |

## Not defined in this repository

HTTP security headers, CloudFront logging, the S3 bucket policy, IAM permissions of the access key and GitHub branch protection. Document them here once they are confirmed in the AWS account and GitHub settings.

## See also

- [Security Strategy](./security-strategy.md)
- [How to build and deploy the site](../../how-to/how-to-build-and-deploy.md)
