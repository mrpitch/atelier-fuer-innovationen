# Architectural Decision Records

Dated, numbered, immutable records of significant technical decisions — distinct from `../explanation/`, which covers ongoing conceptual understanding rather than a specific decision with a status lifecycle.

## Guidelines

- One ADR per decision. Number sequentially: `0001-title-in-kebab-case.md`.
- Frontmatter: `kind: adr`, plus `status` reflecting the decision lifecycle (`proposed`, `accepted`, `superseded`, `deprecated`).
- Once accepted, an ADR's body is not rewritten — a changed decision gets a new ADR that supersedes it (link both ways).

## Structure

1. Context — what problem forced this decision
2. Decision — what was chosen
3. Alternatives considered — and why they were rejected
4. Consequences — trade-offs accepted

## Avoid

- Editing an accepted ADR's decision after the fact (supersede instead)
- Using ADRs for reversible, low-stakes choices
