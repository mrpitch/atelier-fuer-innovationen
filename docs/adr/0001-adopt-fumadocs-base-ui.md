---
name: 'Adopt @fumadocs/base-ui over fumadocs-ui (Radix UI)'
description: "Records the decision to switch this site's headless component primitive library from fumadocs-ui (Radix UI) to @fumadocs/base-ui (Base UI), despite the latter trailing the former's current release by a full major."
tags: [fumadocs, base-ui, radix-ui, components, dependencies]
kind: adr
status: accepted
last_reviewed: 2026-08-22
---

# Adopt @fumadocs/base-ui over fumadocs-ui (Radix UI)

## Context

This site's local component library (`src/components/`) was built about 1.5 years ago directly on Radix UI primitives (`@radix-ui/react-accordion`, `-collapsible`, `-tabs`), because Radix was the only realistic headless-primitive choice available at the time and Fumadocs hadn't yet shipped native equivalents for Accordion, Banner, Card, Steps, or Tabs.

Fumadocs now ships two separate, independently-versioned packages with an identical subpath structure (`/provider/next`, `/layouts/*`, `/mdx`, `/page`, `/components/*`, etc.):

- `fumadocs-ui` — "the Radix UI version." Latest release at time of writing: `17.0.0`.
- `@fumadocs/base-ui` — "the Base UI version," depending on `@base-ui/react`. Latest release at time of writing: `16.15.0` — a full major behind `fumadocs-ui`.

Switching between them is a whole-package swap: rewrite every `fumadocs-ui/...` import to `@fumadocs/base-ui/...`. It is not a per-component or mixable choice — a single Next.js app cannot render some native Fumadocs components via Radix and others via Base UI, since both packages wrap a shared lower-level primitives layer as one coherent unit.

Fumadocs' own current documentation states that Base UI is now its default primitive library, with Radix UI offered as the explicit alternative for projects that prefer it.

This decision surfaced while scoping a broader refactor (issue #28) to replace this site's hand-rolled, Radix-backed local components with Fumadocs' native equivalents. Adopting the native components meant first deciding which of the two packages to build on.

## Decision

Adopt `@fumadocs/base-ui`, replacing `fumadocs-ui` repo-wide, accepting that it trails `fumadocs-ui`'s current latest release by a full major at the time of adoption.

This was checked for peer-dependency compatibility before deciding: `@fumadocs/base-ui@16.15.0` requires `next@16.x.x`, `react@^19.2.0`, `react-dom@^19.2.0`, and `fumadocs-core@16.15.0` — all satisfied by (or a trivial patch bump away from) this repo's stack after epic #13's Fumadocs version bump. It pulls in one dependency this repo didn't previously have: `takumi-js`.

Adopting `@fumadocs/base-ui` is also what fully retires direct Radix UI usage from this site's local component library — every local component that imported a Radix package directly either gets replaced by a native (now Base-UI-backed) Fumadocs component, or becomes orphaned and is deleted, as part of the same refactor.

## Alternatives Considered

| Option                                                                                                         | Why not                                                                                                                                                                                           |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stay on `fumadocs-ui` (Radix UI), migrate components to Fumadocs' native versions without switching packages   | Keeps pace with `fumadocs-ui`'s own release cadence, but leaves the site on Fumadocs' non-default primitive library indefinitely, working against the direction Fumadocs itself has committed to. |
| Adopt `@fumadocs/base-ui` only for newly-built or freshly-migrated components, keep `fumadocs-ui` for the rest | Not actually possible — the two packages cannot coexist for native Fumadocs components in one app; this was ruled out on a technical basis, not a preference.                                     |
| Wait for `@fumadocs/base-ui` to reach version parity with `fumadocs-ui` before adopting it                     | Defers the entire component-migration refactor (issue #28) indefinitely on an external release schedule outside this project's control, for no benefit beyond avoiding the version-lag optics.    |

## Consequences

| Aspect                             | Pros                                                                             | Cons                                                                                                                                                    |
| ---------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alignment with Fumadocs' direction | Site tracks Fumadocs' own stated default rather than its legacy/alternate option | —                                                                                                                                                       |
| Release currency                   | —                                                                                | `@fumadocs/base-ui` trails `fumadocs-ui`'s latest by a full major at adoption time; future Fumadocs releases may land on one package before the other   |
| Dependency surface                 | Retires direct Radix UI usage from the local component library entirely          | Adds `@base-ui/react` and `takumi-js` as new dependencies                                                                                               |
| Reversibility                      | —                                                                                | Reverting to `fumadocs-ui` later is a full repo-wide import-path rewrite, not a config flag — treat this as a deliberate, not lightly-revisited, choice |

An unexplained dependency pin that trails "latest" by a major reads as neglect without this context — this ADR exists specifically so a future reader (or agent auditing dependencies) understands the lag is a deliberate trade-off, not an oversight.
