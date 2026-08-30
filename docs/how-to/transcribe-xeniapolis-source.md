---
name: Transcribe Xeniapolis source material
description: How to transcribe text from the archived xeniapolis.de source pages into MDX content without introducing unintended edits.
tags: [xeniapolis, migration, transcription, content]
kind: how-to
type: How-To Guide
status: current
last_reviewed: 2026-08-30
authoritative: true
---

# How to transcribe Xeniapolis source material

Xeniapolis content originates from a 1990s Siemens AG research site (see
[the glossary](../reference/glossary.md)). When moving text from a source
page into an MDX file under `src/content/docs/xeniapolis/`, follow the
verbatim rule below so transcriptions stay faithful and reviewable.

## The verbatim rule

- Quote the source exactly, including its period orthography (e.g. "muß"
  instead of "muss", old-style hyphenation) and any OCR garble present in
  the crawled source.
- Mark an unusual or seemingly erroneous passage with `[sic]` immediately
  after it, rather than silently correcting it.
- Do not modernize spelling, punctuation, or wording in transcribed source
  text — even where it looks like a typo.

## Authored prose is different

Frontmatter, headings you write yourself, and any explanatory prose added
around a transcription (not quoted from the source) use current, correct
spelling. The verbatim rule applies only to text carried over from the
original source page.

## Verification

After transcribing, diff the new MDX content against the source page (or
the archived copy referenced in
[the source map](../reference/xeniapolis-source-map.md)) to confirm no
words were altered beyond what `[sic]` already flags.
