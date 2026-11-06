---
title: About the epic/afk workflow
description: Why this repo works GitHub issues as epics with afk and hitl sub-issues, what the Sandcastle sandbox adds, and where a human still decides.
type: explanation
status: stable
last_reviewed: 2026-11-05
tags: [workflow, epic, afk, hitl, sandcastle, implement-epic, concept]
---

# About the epic/afk workflow

Work on this repo is planned as GitHub issues and often carried out by an agent. The epic/afk workflow, driven by the `/implement-epic` skill, is the set of rules that decides which issue is worked next, where the work happens, and who looks at the result.

## The shape of the work

- A **spec** issue, written with `/to-spec`, is the **epic**. It carries the `epic` label.
- `/to-tickets` splits the spec into **sub-issues**, published as GitHub native sub-issues, each with its blocking edges.
- Each sub-issue is worked on its own `feat/<number>-<slug>` branch. The epic has an `epic/<number>-<slug>` branch that the sub-issue branches merge into. Only the epic branch goes to trunk.

This keeps each change small enough to review, while the epic branch collects a coherent whole before it reaches `main`, which is the branch that deploys.

## `afk` and `hitl`

Every sub-issue is labelled for how it may be executed:

- **`afk`** (away from keyboard): safe to run unattended, because the spec is clear and the change is checkable by tests and review.
- **`hitl`** (human in the loop): needs someone watching, because it involves judgment, design taste or something an agent cannot verify.

The rules for doing the work are identical for both. The label only decides where the work runs and what machinery surrounds it. An `afk` issue runs in the Sandcastle sandbox. A `hitl` issue runs in the interactive session, as does an `afk` issue when you pass `--watch`.

## What the sandbox adds

Sandcastle runs the agent inside a Docker container on an isolated git worktree, never on your own checkout. Each run has two passes. The implementing agent works the issue and commits. A second, independent agent then reviews that commit against the epic's fixed point, with no memory of how the code was written. If a gate fails, the run writes a repair context so a later pass continues from the same working tree instead of starting over.

The container has Chromium and Playwright, so the agent can look at rendered pages. It has no GitHub credentials. Pushing and opening the PR stay on the host.

## Where a human still decides

- **Epic to trunk.** The PR from the epic branch to `main` is always reviewed by a person, whatever else is automated.
- **Auto-merge.** `auto_merge_afk_epic_subissues` is `true` here, so an `afk` sub-issue that clears every gate (implementation, validation, review) squash-merges into the epic branch without a human. Set it to `false` to review each one.
- **Version bump.** The level of the bump for the epic PR is suggested from the commit history and confirmed by a person. Standalone issues always bump the patch level.

## Status on the board

Each step reports to GitHub Project #11 through `scripts/set-project-status.sh`: `in-progress` when an issue is picked up, `in-review` when its PR opens, `done` when it merges.

## Where the settings live

The labels, the sandbox command, the project number, auto-merge and the version-bump command are in `docs/agents/implementation-workflow.md`. To run the sandbox yourself, see [How to run an afk sandbox](../how-to/how-to-run-an-afk-sandbox.md). The sandbox files are described in `.sandcastle/README.md`.
