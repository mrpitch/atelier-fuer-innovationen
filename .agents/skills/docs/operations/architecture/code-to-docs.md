# docs arch code-to-docs — extract documentation from existing code

**Entry:** the user has a codebase and no (or thin) architecture docs: "document this repo", "extract the architecture", "reverse-engineer the architecture". Content that is underivable from code is flagged, never invented. Human-written docs to import belong to [migrate](./migrate.md). Rules for every file written: [non-negotiables](../../references/architecture/non-negotiables.md).

## Steps

1. **Probe the repo.** Read in order, stopping a layer once the signal is enough:
   1. `README.md` (or `.rst`) — purpose, tech stack, key services
   2. `package.json` / `pom.xml` / `go.mod` / `pyproject.toml` / `Cargo.toml` — language, framework, top-level dependencies
   3. directory tree (top 2 levels) — service boundaries, module layout, build targets
   4. CI/CD config (`.github/workflows/`, `Jenkinsfile`, `.gitlab-ci.yml`, `Dockerfile`) — deployment targets and environments

   Record the primary language and framework, entry points (main services, API gateway, CLI), external dependencies (databases, queues, third-party APIs), and deployment indicators (Docker, Kubernetes, cloud provider).

2. **Map findings to arc42 sections.**

   | Found in repo                                            | → arc42 section                  |
   | -------------------------------------------------------- | -------------------------------- |
   | External API calls, SDK clients, integration libraries   | 3 — Context (external systems)   |
   | Service entry points, main modules, top-level packages   | 5 — Building Block View          |
   | Environment config, CI/CD stages, Docker/K8s manifests   | 7 — Deployment View              |
   | Auth middleware, logging config, error handling patterns | 8 — Cross-cutting Concepts       |
   | `CHANGELOG.md`, `DECISION*.md`, `ADR*.md`                | 9 — Architecture Decisions       |
   | Domain entities, value objects, aggregate roots          | 8 — Domain model (cross-cutting) |
   | Quality gates in CI, SLA comments, performance tests     | 10 — Quality Requirements        |
   | `TODO`, `FIXME`, tech debt comments in code              | 11 — Risks and Technical Debt    |
   | Domain glossary in README or wiki                        | `docs/reference/glossary.md` via `docs write glossary`; §12 points to it |

   Code evidence is typically weak for 1 (Goals), 2 (Constraints), 4 (Solution Strategy) and 6 (Runtime scenarios: code shows calls, not scenarios); those need human input.

3. **Ask once, upfront** (all questions in one prompt): target directory (default `docs/architecture/`), system name, language (EN or DE), sections to skip (e.g. "no §2 constraints yet").

4. **Scaffold, then populate from code.** Run the scaffolder; it writes the root `index.md`, `log.md`, all 12 section directories and the stub concept files:

   ```bash
   python {baseDir}/scripts/architecture/bootstrap.py --project-name "<SystemName>" \
     --output-dir <target-dir> --language <en|de> [--detail-level <level>]
   ```

   Fill the stubs with their canonical file names (the output contracts in [section-interviews.md](../../references/architecture/section-interviews.md), which match `bootstrap.py`). Add files beyond those only when the code shows more (e.g. one §8 file per pattern) and list each in its section `index.md`. A skipped section is noted `N/A — <reason>` in the root `index.md`.

   Read only what each section needs. File-finding matrix:

   | Tech stack            | Entry-point files to read                                                                         | Dependency/config files                                           |
   | --------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
   | **Go**                | `cmd/*/main.go`, `internal/*/`, `pkg/*/`                                                          | `go.mod`, `go.sum`                                                |
   | **Java / Spring**     | `src/main/java/**/*Application.java`, `src/main/java/**/controller/`, `src/main/java/**/service/` | `pom.xml` or `build.gradle`, `src/main/resources/application.yml` |
   | **Node / TypeScript** | `src/index.ts`, `src/app.ts`, `src/routes/`, `src/controllers/`                                   | `package.json`, `tsconfig.json`                                   |
   | **Python**            | `src/`, `app/`, `main.py`, `__init__.py`, `setup.py`                                              | `pyproject.toml`, `requirements.txt`, `Dockerfile`                |
   | **.NET / C#**         | `src/**/*.csproj`, `Program.cs`, `Startup.cs`, `Controllers/`                                     | `*.sln`, `appsettings.json`                                       |
   | **Generic**           | `Dockerfile`, `docker-compose.yml`, Kubernetes manifests under `k8s/` or `deploy/`                | `.env.example`, `Makefile`                                        |

   Per section:
   - **§3 Context** — list the external systems from step 2; add a C4 Context diagram ([diagram operation](./diagram.md)) with `Person` and `System_Ext` entries from discovered integrations.
   - **§5 Building blocks** — list services/modules; add a C4 Container diagram with containers from entry points and major packages; flag containers whose technology is unclear.
   - **§7 Deployment** — environment names from CI/CD config and Docker/K8s manifests; a PlantUML deployment diagram with nodes from infrastructure configuration.
   - **§8 Cross-cutting** — one file per identified pattern (auth, logging, error handling, domain model), never merged; fill what is directly observable and flag assumptions.
   - **§9 ADRs** — convert each existing `DECISION*.md` / `ADR*.md` to MADR through the [adr operation](./adr.md). Document only decisions recorded somewhere; never infer ADRs from code.
   - **§11 Risks** — convert `TODO` / `FIXME` / tech-debt comments into stub risk entries, each marked `inferred`.

5. **Flag gaps.** List what code cannot supply and needs a human, and write no concept content for it:

   ```markdown
   ## Gaps requiring human input

   | Section       | What is missing                                                   |
   | ------------- | ----------------------------------------------------------------- |
   | 1 Goals       | Business goals and stakeholder list — not derivable from code     |
   | 2 Constraints | Regulatory, organizational, and contractual constraints           |
   | 4 Strategy    | Fundamental design decisions — code shows what, not why           |
   | 6 Runtime     | Named scenarios (happy path, error path) — needs domain knowledge |
   | 10 Quality    | Measurable quality scenarios (stimulus → response + metric)       |
   ```

   Those sections stay `status: draft` stubs; the user closes them with `docs arch draft <section>`. Work items per section or gap go to the configured issue tracker on request.

6. **Apply** [non-negotiables](../../references/architecture/non-negotiables.md) across every file touched: each concept written from code gets a `sources` list with one `- resource: <repo-relative path or URL>` per code path it was derived from, so [converge](./converge.md) can re-check every claim. Log entry: `- **Creation**: initial extraction from codebase (<sections>)`. Then run `python {baseDir}/scripts/architecture/validate.py <target-dir>` and fix errors before delivering.

**Done when:** every section with code evidence has a populated concept file carrying `sources` and `generated`; every gap is in the delivered gap table, with no concept content invented for it; `validate.py` exits 0; non-negotiables are applied.
