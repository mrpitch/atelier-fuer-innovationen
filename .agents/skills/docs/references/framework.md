# Diataxis Framework Reference

The Diataxis framework (Greek: _dia_ "across" + _taxis_ "arrangement") splits documentation into four distinct types based on user need.

## The Two Axes

- **Practical ↔ Theoretical** — does it focus on doing or on understanding?
- **Learning ↔ Working** — is the user acquiring knowledge or applying it?

## The Four Quadrants

```
                LEARNING                 WORKING
        ┌─────────────────────┬─────────────────────┐
PRACT.  │     TUTORIALS       │    HOW-TO GUIDES    │
        │  Learning-oriented  │   Task-oriented     │
        ├─────────────────────┼─────────────────────┤
THEOR.  │    EXPLANATION      │     REFERENCE       │
        │ Understanding-ori.  │  Information-ori.   │
        └─────────────────────┴─────────────────────┘
```

## Type Details

### Tutorials — "I want to learn"

- Learning-oriented; lesson with hands-on exercises.
- Get the user to first success on a concrete deliverable.
- Minimum viable explanation; concepts go elsewhere.
- Reliable and repeatable — must be tested end-to-end.
- **Analogy:** teaching a child to cook (focus on the experience, not the dish).

**Key principles:**

- ✓ Show the destination upfront — "By the end, you'll have X"
- ✓ Deliver visible results early and often
- ✓ Maintain a narrative of expectations — "You will notice that…", "You should see…"
- ✓ Point out what learners should observe
- ✓ Focus on the concrete, not abstract
- ✓ Ruthlessly minimize explanation — link to it, don't embed it
- ✓ Encourage and permit repetition
- ✓ Ignore options and alternatives — teach one way
- ✓ Aspire to perfect reliability — every step must work as described

**Language patterns:**

- "We will…" (first-person plural, tutor-learner relationship)
- "In this tutorial, we will create…"
- "First, do X. Now, do Y."
- "The output should look something like…"
- "Notice that…", "Remember that…", "Let's check…"
- Imperatives: "Click", "Type", "Run"
- Numbered steps: 1, 2, 3

### How-to Guides — "I want to accomplish X"

- Task-oriented; series of steps to a defined outcome.
- Assumes the reader knows _what_ they want, not _how_.
- One problem per guide. Be terse.
- **Analogy:** a recipe in a cookbook.

**Key principles:**

- ✓ Goal-oriented — solve a clear, concrete problem
- ✓ Assume competence — don't teach foundational skills
- ✓ Omit the unnecessary — practical usability over completeness
- ✓ Logical sequence — steps flow as a competent user would think them
- ✓ Executable instructions — every step works; the guide is a contract
- ✓ Address real-world complexity (env differences, edge cases)
- ✓ Clear naming — title is "How to [achieve specific outcome]"

**Language patterns:**

- "This guide shows you how to…"
- "If you want X, do Y. To achieve W, do Z."
- "Refer to the X reference for full options."
- "When you encounter [situation], [action]"
- Conditional: "If X, then do Y"

### Reference — "I need to look up X"

- Information-oriented; describes the machinery factually.
- Structured around the code (functions, props, configs, constructs).
- Consistent format across siblings; comprehensive; accurate.
- Does **not** instruct or explain.
- **Analogy:** an encyclopedia entry.

**Key principles:**

- ✓ Describe and only describe — no instructions, only facts
- ✓ Neutral and objective — no opinions, no recommendations
- ✓ Precise and accurate — no approximations
- ✓ Structured by the machinery — mirror how the system is built
- ✓ Adopt standard patterns — consistent structure throughout
- ✓ Comprehensive — include all significant options and parameters
- ✓ Wholly authoritative — no doubt or ambiguity
- ✓ Examples for illustration — show without instructing

**Language patterns:**

- "X is a [noun] that [function]"
- "X inherits from Y and is defined in Z"
- "Sub-commands are: a, b, c, d"
- "Must use A. Must not apply B unless C."
- "Optional. Default: X"
- Lists and tables for comparison
- Definitions that stand alone

### Explanation — "I want to understand why"

- Understanding-oriented; discursive prose.
- Provides context, history, alternatives, trade-offs.
- Connects topics to the bigger picture.
- Does **not** instruct or describe APIs.
- **Analogy:** an article on culinary history.
- **Title pattern:** Should work with an "About …" prefix (`About our deployment model`, `Why we chose Zustand`).

**Key principles:**

- ✓ Make connections — relate to other concepts and contexts
- ✓ Provide background — design decisions, history, constraints
- ✓ Talk _about_ the subject — title should work with "About …" prefix
- ✓ Admit perspective — acknowledge limitations and alternatives
- ✓ Weigh alternatives — show why one approach was chosen
- ✓ Bound the discussion — don't absorb instructions or reference
- ✓ Answer "why" questions — not "how" or "what"

**Language patterns:**

- "The reason for X is that historically, Y…"
- "W is better than Z because…"
- "X in system Y is analogous to W in system Z. However…"
- "Some teams prefer W (because Z). This can work, but in this project…"
- "The trade-off is…"
- "An important design decision was…"
- "Historically, X…"

## Common Misclassifications

| Document              | Often labeled as | Actually is                   |
| --------------------- | ---------------- | ----------------------------- |
| Getting Started       | How-to           | Tutorial                      |
| Architecture Overview | Reference        | Explanation                   |
| API Reference         | How-to           | Reference                     |
| FAQ                   | Reference        | Mix — split into proper types |
| README                | Everything       | Index of links to proper docs |

## Type Contamination Fixes

| Type        | Common contamination      | Fix                                           |
| ----------- | ------------------------- | --------------------------------------------- |
| Tutorial    | Reference details         | Move specs to a reference doc, link           |
| Tutorial    | Choices / alternatives    | Pick one path; mention alternatives in how-to |
| How-to      | Concept explanation       | Extract to explanation, link                  |
| Reference   | Instructions              | Move to how-to                                |
| Explanation | Step-by-step instructions | Extract to tutorial or how-to                 |

## User Journeys (examples)

**New contributor:**

1. Tutorial: "Build your first feature end-to-end"
2. Reference: configuration reference, environment matrix
3. How-to: "Deploy to staging"
4. Explanation: "Why we chose this architecture"

**Experienced contributor:**

1. How-to: "Add a new API endpoint"
2. Reference: data model, API reference
3. Back to work

**Reviewer / evaluator:**

1. Explanation: architecture overview, security model
2. Reference: key components and their interfaces
3. Tutorial: quick hands-on smoke test

## Quality Checklists

### Tutorial

- [ ] Clear, concrete deliverable named in the title
- [ ] Beginner can complete it without prior project knowledge
- [ ] Every step has a copy-paste command or code block
- [ ] No decision points — single happy path
- [ ] Verified end-to-end on a clean clone
- [ ] Explanation kept to absolute minimum (≤ 1 sentence per step)

### How-to Guide

- [ ] Title starts with "How to …" and names the task
- [ ] Single problem scope
- [ ] Numbered, actionable steps with code blocks
- [ ] Verification step with concrete command and expected output
- [ ] Troubleshooting section for known failure modes
- [ ] No multi-paragraph concept blocks

### Reference

- [ ] Structured around the code unit (handler, construct, hook, config)
- [ ] Consistent format with sibling reference docs
- [ ] Tables for parameters / options / errors / env vars
- [ ] At least one example
- [ ] No imperative ("first do …", "then run …")
- [ ] Up-to-date (matches current code)

### Explanation

- [ ] Frames a clear question or claim up front
- [ ] Provides context (when, why, by whom)
- [ ] Discusses at least one alternative or trade-off
- [ ] Includes a concrete example or diagram
- [ ] Connects to related docs (tutorial / how-to / reference)
- [ ] No step-by-step instructions

## Cross-Cutting Quality Checklist

For every document, regardless of type, verify:

- [ ] **Single category** — serves exactly one user need
- [ ] **No category pollution** — other categories are linked, not embedded
- [ ] **Correct orientation** — matches the right cell in the matrix
- [ ] **Appropriate language** — uses category-specific patterns and tone
- [ ] **Proper structure** — follows category template
- [ ] **Complete within scope** — serves its purpose fully, no further
- [ ] **Clear naming** — title and filename reflect content and category
- [ ] **Cross-links** — relates to all four categories without clutter
- [ ] **Tested execution** — for tutorials/how-to: steps actually work on a clean machine
- [ ] **Accuracy verified** — for reference/explanation: facts checked against current code
- [ ] **Repo conventions** — `pnpm` not `npm`, `logger` not `console.log`, no inlined secrets
- [ ] **Formatted** — passes `pnpm prettier`

## Resources

- [Diataxis.fr](https://diataxis.fr/) — Official site
- [Documentation.divio.com](https://documentation.divio.com/) — Original formulation
- [Compass](https://diataxis.fr/compass/) — Theoretical foundation
