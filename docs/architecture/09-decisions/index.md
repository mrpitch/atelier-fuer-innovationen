# 09. Architecture Decisions

Architecture decision records (MADR 4), one decision per file.

## Concepts

- [ADR-0001: Adopt @fumadocs/base-ui over fumadocs-ui (Radix UI)](adr-0001-adopt-fumadocs-base-ui.md) — `accepted` — Records the decision to switch this site's headless component primitive library from fumadocs-ui (Radix UI) to @fumadocs/base-ui (Base UI), despite the latter trailing the former's current release by a full major.
- [ADR-0002: Per-section theming via CSS custom-property scoping](adr-0002-per-section-theming.md) — `accepted` — Records the decision to give the Xeniapolis content section its own full-page shadcn-style palette override, layered on a site-wide default palette, via a data-section attribute rather than separate route layouts.
