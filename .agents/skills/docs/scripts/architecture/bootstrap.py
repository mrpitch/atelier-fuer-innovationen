#!/usr/bin/env python3
"""
Scaffold a new arc42/OKF architecture bundle.

Creates the root index.md and log.md, all 12 arc42 section directories with their
index.md, and one stub concept file per entry in SECTIONS with the correct Diátaxis
type (type: adr for the ADR stub) and a placeholder body.

Headings use the chosen language only (en or de). Existing files are never overwritten.

Usage:
  python bootstrap.py --project-name "Payment Service"
  python bootstrap.py --project-name "Payment Service" --output-dir docs/architecture/ --language de
  python bootstrap.py --project-name "Payment Service" --detail-level lean --domain-profile microservice

--output-dir defaults to docs/architecture/.
Exit 0 when at least one file was created; exit 1 when every file already existed.
SECTIONS below is the canonical concept-file contract: the draft, code-to-docs and
section-interview operations use the same file names.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import date, datetime, timezone
from pathlib import Path

TODAY = date.today().isoformat()
NOW = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
SKILL_VERSION = "1.0.0"
# OKF v0.2 actor convention: <producer>/<version>
GENERATED_BY = f"docs-bootstrap/{SKILL_VERSION}"

# (slug, de_title, en_title, [(filename, type, concept_summary)])
SECTIONS: list[tuple[str, str, str, list[tuple[str, str, str]]]] = [
    (
        "01-goals",
        "Einführung und Ziele",
        "Introduction and Goals",
        [
            (
                "introduction-and-goals.md",
                "explanation",
                "What this system exists to do, the top quality goals, and the key stakeholders.",
            )
        ],
    ),
    (
        "02-constraints",
        "Randbedingungen",
        "Architecture Constraints",
        [
            (
                "constraints.md",
                "reference",
                "Technical, organisational, and convention constraints that narrow the solution space.",
            )
        ],
    ),
    (
        "03-context",
        "Kontextabgrenzung",
        "Context and Scope",
        [
            (
                "context-and-scope.md",
                "explanation",
                "System boundary: what is inside vs. outside, and the external actors/systems.",
            ),
            (
                "interface-table.md",
                "reference",
                "Technical interfaces: protocols, data formats, and communication directions.",
            ),
        ],
    ),
    (
        "04-strategy",
        "Lösungsstrategie",
        "Solution Strategy",
        [
            (
                "solution-strategy.md",
                "explanation",
                "Fundamental design decisions: technology choices, decomposition approach, quality-goal responses.",
            )
        ],
    ),
    (
        "05-building-blocks",
        "Bausteinsicht",
        "Building Block View",
        [
            (
                "building-blocks-level1.md",
                "reference",
                "Level-1 whitebox: top-level subsystems, their responsibilities, and key interfaces.",
            )
        ],
    ),
    (
        "06-runtime",
        "Laufzeitsicht",
        "Runtime View",
        [
            (
                "runtime-main-flow.md",
                "explanation",
                "Primary runtime scenario: how building blocks collaborate for the main use case.",
            )
        ],
    ),
    (
        "07-deployment",
        "Verteilungssicht",
        "Deployment View",
        [
            (
                "deployment-topology.md",
                "reference",
                "Infrastructure topology and how software components map onto environments.",
            ),
            (
                "how-to-deploy-production.md",
                "how-to",
                "Step-by-step procedure for deploying a release to production.",
            ),
        ],
    ),
    (
        "08-crosscutting",
        "Querschnittliche Konzepte",
        "Cross-cutting Concepts",
        [
            (
                "security-strategy.md",
                "explanation",
                "Why: the security approach and rationale for authentication, authorisation, and data protection.",
            ),
            (
                "security-conventions.md",
                "reference",
                "What: security configuration values, required headers, and token formats.",
            ),
            (
                "logging-strategy.md",
                "explanation",
                "Why: the logging approach, chosen levels, and structured-log rationale.",
            ),
            (
                "logging-conventions.md",
                "reference",
                "What: log levels, required fields, and format rules.",
            ),
        ],
    ),
    (
        "09-decisions",
        "Architekturentscheidungen",
        "Architecture Decisions",
        [
            (
                "adr-0001-initial-architecture.md",
                "adr",
                "First ADR: records the foundational architecture decisions made at project start.",
            )
        ],
    ),
    (
        "10-quality",
        "Qualitätsanforderungen",
        "Quality Requirements",
        [
            (
                "quality-scenarios.md",
                "reference",
                "Measurable quality scenarios that make the Section 1 quality goals testable.",
            )
        ],
    ),
    (
        "11-risks",
        "Risiken und technische Schulden",
        "Risks and Technical Debts",
        [
            (
                "risks-and-tech-debt.md",
                "explanation",
                "Known risks, technical debt items, and their mitigation status.",
            )
        ],
    ),
    (
        "12-glossary",
        "Glossar",
        "Glossary",
        [
            (
                "glossary.md",
                "reference",
                "Architecture-specific terms and abbreviations; domain vocabulary lives in docs/reference/glossary.md.",
            )
        ],
    ),
]


# Stub-body headings per language. Section titles come from SECTIONS.
_LABELS: dict[str, dict[str, str]] = {
    "en": {
        "context": "Context", "discussion": "Discussion", "consequences": "Consequences",
        "see_also": "See also", "main": "Main section — e.g. Parameters, Interfaces, Values",
        "notes": "Notes", "how_to": "How to", "prerequisites": "Prerequisites",
        "steps": "Steps", "verify": "Verify", "by_the_end": "By the end of this tutorial, you will have:",
        "step1": "Step 1", "what_you_built": "What you built", "next_steps": "Next steps",
        "name": "Name", "description": "Description", "sections": "Sections",
        "concepts": "Concepts",
        "doc_title": "Architecture Documentation", "navigate": "How to navigate",
    },
    "de": {
        "context": "Kontext", "discussion": "Diskussion", "consequences": "Konsequenzen",
        "see_also": "Siehe auch", "main": "Hauptabschnitt — z. B. Parameter, Schnittstellen, Werte",
        "notes": "Hinweise", "how_to": "Anleitung:", "prerequisites": "Voraussetzungen",
        "steps": "Schritte", "verify": "Prüfen", "by_the_end": "Am Ende dieses Tutorials haben Sie:",
        "step1": "Schritt 1", "what_you_built": "Was Sie gebaut haben", "next_steps": "Nächste Schritte",
        "name": "Name", "description": "Beschreibung", "sections": "Abschnitte",
        "concepts": "Konzepte",
        "doc_title": "Architekturdokumentation", "navigate": "Navigation",
    },
}


_SCRIPTS = Path(__file__).resolve().parent
TEMPLATE_DIR = _SCRIPTS.parent.parent / "templates" / "architecture"
_DE = json.loads((_SCRIPTS / "languages" / "de.json").read_text(encoding="utf-8"))
_DE_HEADINGS: dict[str, str] = _DE["headings"]
_DE_LABELS: dict[str, str] = _DE["labels"]

# Concepts that are the one concept a section template is written for: their stub is that template.
# The others (§3 interface table, §7 deploy how-to, the split §8 concepts) keep the generic Diátaxis body.
# filename → (template, en_title, de_title); None = the section title.
TEMPLATE_STUBS: dict[str, tuple[str, str | None, str | None]] = {
    "introduction-and-goals.md": ("arc42-01-goals.md", None, None),
    "constraints.md": ("arc42-02-constraints.md", None, None),
    "context-and-scope.md": ("arc42-03-context.md", None, None),
    "solution-strategy.md": ("arc42-04-strategy.md", None, None),
    "building-blocks-level1.md": ("arc42-05-building-blocks.md", "Building Block View — Level 1", "Bausteinsicht — Ebene 1"),
    "runtime-main-flow.md": ("arc42-06-runtime.md", "Runtime View — Main flow", "Laufzeitsicht — Hauptablauf"),
    "deployment-topology.md": ("arc42-07-deployment.md", None, None),
    "adr-0001-initial-architecture.md": ("arc42-09-adr.md", "ADR-0001: Initial architecture", "ADR-0001: Initiale Architektur"),
    "quality-scenarios.md": ("arc42-10-quality.md", None, None),
    "risks-and-tech-debt.md": ("arc42-11-risks.md", None, None),
    "glossary.md": ("arc42-12-glossary.md", None, None),
}
_HEADING = re.compile(r"^(#{2,3} )(.*)$")
_ID_HEADING = re.compile(r"^(?:QS|RISK|TD|IF|ADR)-\d+")


def translate_heading(line: str) -> str:
    """German label for an H2/H3 template heading; the text after the label (placeholders, IDs) is kept."""
    match = _HEADING.match(line)
    if not match:
        return line
    text = match.group(2)
    label = text.split("<!--", 1)[0].strip().rstrip(":").removesuffix(" —").strip()
    if len(label) <= 1 or _ID_HEADING.match(label):
        return line
    return match.group(1) + text.replace(label, _DE_HEADINGS.get(label, label), 1)


def translate_labels(line: str) -> str:
    """German form of the bold body labels arc42-lint.py matches (`**Quality property:**`, `**Risks created:**`)."""
    for en, de in _DE_LABELS.items():
        line = line.replace(f"**{en}:**", f"**{de}:**")
    return line


def _yaml_quote(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def template_stub(template: str, title: str, concept_summary: str, language: str) -> str:
    """The section template with its frontmatter filled in, the H1 set to the title, and headings localised."""
    fm, body = (TEMPLATE_DIR / template).read_text(encoding="utf-8").split("---\n", 2)[1:]
    filled = {
        "title:": f"title: {_yaml_quote(title)}",
        "description:": f"description: {_yaml_quote(concept_summary)}",
        "  by:": f"  by: {GENERATED_BY}",
        "  at:": f"  at: {NOW}",
        "date:": f"date: {TODAY}",
    }
    fm_lines = []
    for line in fm.splitlines():
        key = next((k for k in filled if line.startswith(k)), None)
        fm_lines.append(filled[key] if key else line)
    fm = "\n".join(fm_lines) + "\n"
    if "<!--" in fm:
        raise RuntimeError(f"{template}: frontmatter placeholder bootstrap does not fill")
    lines, in_code, h1_done = [], False, False
    for line in body.splitlines():
        if re.match(r"^ {0,3}(`{3,}|~{3,})", line):
            in_code = not in_code
        elif not in_code and not h1_done and line.startswith("# "):
            line, h1_done = f"# {title}", True
        elif not in_code and language == "de":
            line = translate_labels(translate_heading(line))
        lines.append(line)
    return f"---\n{fm}---\n" + "\n".join(lines) + "\n"


def section_title(de_title: str, en_title: str, language: str) -> str:
    return de_title if language == "de" else en_title


def concept_body(
    de_title: str,
    en_title: str,
    doc_type: str,
    concept_summary: str,
    language: str,
) -> str:
    heading = section_title(de_title, en_title, language)
    L = _LABELS[language]

    if doc_type == "explanation":
        return f"""\
# {heading}

<!-- {concept_summary} -->

## {L['context']}

<!-- What situation or problem led to this topic?
     Why does the reader need to understand this? -->

## {L['discussion']}

<!-- Discuss the topic. Be willing to explain tradeoffs and rationale.
     Link to reference docs for dry facts; link to how-to guides for tasks. -->

## {L['consequences']}

<!-- What does this decision or design mean for the system?
     What constraints does it impose or relax? -->

## {L['see_also']}

<!-- Links to related concept files, ADRs, or reference docs. -->
"""

    if doc_type == "reference":
        return f"""\
# {heading}

<!-- {concept_summary} -->

---

## <!-- {L['main']} -->

| {L['name']} | {L['description']} |
|------|-------------|
| `<!-- field -->` | <!-- description --> |

## {L['notes']}

<!-- Edge cases, version differences, or deprecation notices. Keep short. -->

## {L['see_also']}

<!-- Links to related explanation or how-to files. -->
"""

    if doc_type == "how-to":
        return f"""\
# {L['how_to']} <!-- goal -->

<!-- {concept_summary} -->

**{L['prerequisites']}:**
- <!-- What the reader must have or know -->

---

## {L['steps']}

1. <!-- First action -->

2. <!-- Second action -->

3. <!-- Third action -->

---

## {L['verify']}

<!-- How does the reader confirm it worked? -->

## {L['see_also']}

<!-- Links to explanation docs for background. -->
"""

    if doc_type == "tutorial":
        return f"""\
# {heading}

<!-- {concept_summary} -->

**{L['by_the_end']}** <!-- concrete outcome -->

**{L['prerequisites']}:** <!-- what the reader needs -->

---

## {L['step1']}: <!-- First step -->

<!-- ... -->

## {L['what_you_built']}

<!-- One short paragraph summarising the outcome. -->

## {L['next_steps']}

<!-- Links to related how-to guides. -->
"""

    return f"# {heading}\n\n<!-- {concept_summary} -->\n"


def concept_frontmatter(
    filename: str,
    doc_type: str,
    section_slug: str,
    concept_summary: str,
) -> str:
    title = filename.replace("-", " ").replace(".md", "").title()
    description = concept_summary.replace('"', "'")
    section_num, _, section_name = section_slug.partition("-")
    return f"""\
---
type: {doc_type}
title: "{title}"
description: "{description}"
tags: [architecture, {section_name}]
arc42_section: {int(section_num)}
status: draft
generated:
  by: {GENERATED_BY}
  at: {NOW}
links: []
---
"""


def section_index_body(
    de_title: str,
    en_title: str,
    section_num: int,
    concepts: list[tuple[str, str, str]],
    language: str,
) -> str:
    L = _LABELS[language]
    lines = [
        f"# {section_num:02d}. {section_title(de_title, en_title, language)}\n\n",
        "<!-- Brief description of what this section covers. -->\n\n",
        f"## {L['concepts']}\n\n",
    ]
    for filename, _, summary in concepts:
        anchor = filename.replace(".md", "")
        lines.append(f"- [{anchor}](./{filename}) — {summary}\n")
    return "".join(lines)


def root_index_body(project_name: str, language: str) -> str:
    L = _LABELS[language]
    section_lines = []
    for slug, de, en, _ in SECTIONS:
        num = int(slug.split("-")[0])
        section_lines.append(f"- [{num:02d}. {section_title(de, en, language)}](./{slug}/index.md)")
    sections_block = "\n".join(section_lines)
    return f"""\
# {project_name} — {L['doc_title']}

<!-- Brief description of this system. One or two sentences. -->

## {L['sections']}

{sections_block}

## {L['navigate']}

<!-- Start with 01-goals/ for a system overview. Follow links or use section index files
     for deeper exploration. -->
"""


def write_file(path: Path, content: str) -> str:
    if path.exists():
        return f"  skipped (exists): {path}"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    return f"  created: {path}"


DETAIL_LEVELS = ["LEAN", "ESSENTIAL", "THOROUGH"]
DOMAIN_PROFILES = ["startup-mvp", "microservice", "platform-service", "data-pipeline"]


def bootstrap(
    project_name: str,
    output_dir: Path,
    language: str,
    detail_level: str = "ESSENTIAL",
    domain_profile: str | None = None,
) -> list[str]:
    log: list[str] = []

    # Root index.md — bundle settings live here so later operations don't re-ask.
    profile_line = f"domain_profile: {domain_profile}\n" if domain_profile else ""
    root_index_fm = f"""\
---
okf_version: "0.2"
language: {language}
detail_level: {detail_level}
{profile_line}---
"""
    root_index = root_index_fm + "\n" + root_index_body(project_name, language)
    log.append(write_file(output_dir / "index.md", root_index))

    root_log = f"# Change log\n\n## {TODAY}\n\n- **Creation**: Initial bundle scaffold (12 arc42 sections) by {GENERATED_BY}\n"
    log.append(write_file(output_dir / "log.md", root_log))

    for slug, de_title, en_title, concepts in SECTIONS:
        section_num = int(slug.split("-")[0])
        section_dir = output_dir / slug

        index_content = section_index_body(de_title, en_title, section_num, concepts, language)
        log.append(write_file(section_dir / "index.md", index_content))

        for filename, doc_type, concept_summary in concepts:
            if filename in TEMPLATE_STUBS:
                template, en_stub, de_stub = TEMPLATE_STUBS[filename]
                title = section_title(de_stub or de_title, en_stub or en_title, language)
                content = template_stub(template, title, concept_summary, language)
            else:
                fm = concept_frontmatter(filename, doc_type, slug, concept_summary)
                content = fm + "\n" + concept_body(de_title, en_title, doc_type, concept_summary, language)
            log.append(write_file(section_dir / filename, content))

    return log


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Scaffold a new arc42/OKF architecture documentation bundle."
    )
    parser.add_argument("--project-name", required=True, help="Human-readable project name")
    parser.add_argument(
        "--output-dir", default="docs/architecture/",
        help="Target directory for the bundle, created if absent (default: docs/architecture/)",
    )
    parser.add_argument(
        "--language",
        choices=["en", "de"],
        default="en",
        help="Bundle language for headings and stub bodies (default: en).",
    )
    parser.add_argument(
        "--detail-level", choices=[d.lower() for d in DETAIL_LEVELS], default="essential",
        help="Stored in the root index.md (default: essential).",
    )
    parser.add_argument(
        "--domain-profile", choices=DOMAIN_PROFILES, default=None,
        help="Optional domain profile stored in the root index.md.",
    )
    args = parser.parse_args()

    output_dir = Path(args.output_dir)
    results = bootstrap(
        project_name=args.project_name,
        output_dir=output_dir,
        language=args.language,
        detail_level=args.detail_level.upper(),
        domain_profile=args.domain_profile,
    )

    created = [r for r in results if "created" in r]
    skipped = [r for r in results if "skipped" in r]

    print(f"Bundle scaffolded at: {output_dir.resolve()}")
    print(f"  {len(created)} files created, {len(skipped)} skipped (already existed)")
    print()
    for line in results:
        print(line)

    if not created:
        print(
            "\nAll files already exist. Delete the directory or move it aside to re-scaffold.",
            file=sys.stderr,
        )
        sys.exit(1)


if __name__ == "__main__":
    main()
