# Sandcastle

This repo runs its `afk` issues in a Docker sandbox through the shared Home
runner. How the runner works, the `.sandcastle/config.json` schema, prompt
overrides, `.env` loading, permissions, workspace trust and troubleshooting
are documented once, in:

`~/Dev/home/tools/sandcastle/README.md`

Files kept here, per repo: `Dockerfile`, `.env` / `.env.example`,
`claude.json`, `config.json`, `.gitignore`, the caches and logs it creates,
and optional prompt overrides (`implement-prompt.md`, `review-prompt.md`,
`efficiency-rules.md`).
