# Change log

## 2026-11-08

- **Update**: 06-runtime/runtime-main-flow.md, 07-deployment/deployment-topology.md, index.md — `trailingSlash: true` and the CloudFront Function `RewriteSPAUrls` recorded as confirmed; public URL recorded; job `verify-deploy` (`scripts/check-deployed.ts`) requests every sitemap address after each deploy (#146)
- **Update**: 06-runtime/runtime-publish-change.md, 08-crosscutting/content-conventions.md — CI job `validate-copy-integrity` (`scripts/copy-integrity.ts`) gates the deploy next to the other check jobs (#145); protected copy covers table cells and quotations; job `validate-stadtviertel` (#147) added to the job lists, six check jobs in total; `verified` bumped after checking the prose against `.github/workflows/main.yml` and `package.json`

## 2026-11-06

- **Creation**: 09-decisions/adr-0003-vector-icon-and-illustration-conventions.md — ADR-0003 records the `<Illu>` icon-vs-illustration SVG convention (#113)

## 2026-11-05

- **Creation**: Initial bundle scaffold (12 arc42 sections) by docs-bootstrap/1.0.0
- **Creation**: 09-decisions/adr-0001-adopt-fumadocs-base-ui.md — ADR-0001 migrated from docs/adr/
- **Creation**: 09-decisions/adr-0002-per-section-theming.md — ADR-0002 migrated from docs/adr/
- **Deprecation**: removed stub 09-decisions/adr-0001-initial-architecture.md and docs/adr/ (ADRs now live in the bundle)
- **Creation**: initial extraction from codebase (§3, §5, §7, §8, §11, §12) by docs-code-to-docs/1.0.0
- **Update**: 03-context/context-and-scope.md, 03-context/interface-table.md — IF-01 to IF-06 and context diagram
- **Update**: 05-building-blocks/building-blocks-level1.md — eleven building blocks and building-block diagram
- **Update**: 07-deployment/deployment-topology.md — production topology, mapping and environments; deployment diagram
- **Creation**: 08-crosscutting/static-export-strategy.md, section-theming-strategy.md, content-conventions.md
- **Update**: 08-crosscutting/security-strategy.md, security-conventions.md — filled from workflow and pnpm config
- **Update**: 11-risks/risks-and-tech-debt.md — RISK-01 to RISK-07, TD-01 to TD-03 (all inferred)
- **Update**: 12-glossary/glossary.md — architecture terms and abbreviations
- **Deprecation**: removed stubs 07-deployment/how-to-deploy-production.md (covered by docs/how-to/how-to-build-and-deploy.md), 08-crosscutting/logging-strategy.md and logging-conventions.md (no shared logging concept in the code)
- **Update**: scripts/validate-okf.ts — exempt reserved index.md and log.md of docs/architecture/ from the `type` check
- **Update**: 06-runtime/runtime-main-flow.md — page view scenario (site is a static website on S3 served by CloudFront, per maintainer)
- **Creation**: 06-runtime/runtime-search.md, 06-runtime/runtime-publish-change.md
- **Update**: 11-risks/risks-and-tech-debt.md, 07-deployment/deployment-topology.md, index.md — RISK-05 measured, CloudFront wiring marked maintainer-confirmed, §6 removed from open gaps
- **Update**: 05-building-blocks/building-blocks-level1.md, 06-runtime/index.md, 06-runtime/runtime-publish-change.md, 08-crosscutting/content-conventions.md, 11-risks/risks-and-tech-debt.md — CI now gates the deploy on jobs `quality` and `validate-okf` and runs on pull requests (#128); RISK-03 closed, RISK-07 measure updated; hand edit, `verified` added
