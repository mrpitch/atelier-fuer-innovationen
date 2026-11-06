#!/usr/bin/env python3
"""
Architecture bundle conformance checker (OKF v0.2 + arc42 layout).

Usage:
  python validate.py <bundle-root>
  python validate.py <bundle-root> --json
  python validate.py <bundle-root> --summary

Exit 0 = no errors (warnings only).
Exit 1 = one or more errors found.

Output (text mode, default): human-readable lines prefixed [ERROR] or [WARN]
Output (--json mode):         {"errors": [...], "warnings": [...], "ok": bool}
Output (--summary mode):      the result line, then "CODE × N" per code, errors before warnings

Dot-directories (.git/, .renders/) are not bundle content and are skipped. Markdown
links resolve relative to the file that contains them; links starting with "/" resolve
from the bundle root.

OKF v0.2 provenance/lifecycle fields (generated, verified, status, stale_after,
sources) are optional and checked only when present. OKF v0.1 bundles still pass:
legacy `updated`, `summary`, line-style log.md and okf_version "0.1" produce
LEGACY_* warnings, never errors.

Frontmatter is parsed with PyYAML when installed, otherwise with a built-in parser
for the subset the bundle uses (scalars, flow/block mappings, lists of mappings).
Set DOCS_YAML=builtin to force the built-in parser.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from collections import Counter
from datetime import date, datetime, timezone
from pathlib import Path

STALENESS_DAYS = 365

ALLOWED_TYPES = {"tutorial", "how-to", "reference", "explanation", "adr"}
RESERVED_NAMES = {"index.md", "log.md"}
OKF_VERSION = "0.2"
# Bundle settings the root index.md may carry next to okf_version.
ROOT_INDEX_KEYS = {"okf_version", "language", "detail_level", "domain_profile"}
OKF_STATUSES = {"draft", "stable", "deprecated"}
# ADRs keep MADR's own status vocabulary (one YAML key cannot hold both).
MADR_STATUS = re.compile(r"^(proposed|rejected|accepted|deprecated|superseded by ADR-\d+)$", re.IGNORECASE)
ADR_FILE_NAME = re.compile(r"^adr-\d+", re.IGNORECASE)
LEGACY_LOG_LINE = re.compile(r"^\d{4}-\d{2}-\d{2}\s+[—–-]\s")
LOG_HEADING = re.compile(r"^##\s+(\d{4}-\d{2}-\d{2})\s*$")


# ---------------------------------------------------------------------------
# Frontmatter parsing
# ---------------------------------------------------------------------------

class InvalidFrontmatter(ValueError):
    """Frontmatter that YAML rejects; both parsers raise it, so the result doesn't depend on PyYAML."""


def _coerce(raw: str) -> object:
    """Coerce a YAML scalar string to a Python value. Dates stay strings."""
    raw = raw.strip()
    if raw[:1] in ("'", '"'):
        # A quoted scalar ends at its first unescaped quote ('' in single quotes, \" in double); only a comment may follow.
        quoted = r"^'((?:[^']|'')*)'" if raw[0] == "'" else r'^"((?:[^"\\]|\\.)*)"'
        m = re.match(quoted, raw)
        if not m or re.sub(r"^\s+#.*$", "", raw[m.end():]):
            raise InvalidFrontmatter(f"bad quoted value {raw[:60]!r}")
        return m.group(1).replace("''", "'") if raw[0] == "'" else m.group(1)
    if raw.startswith("{") and raw.endswith("}"):
        return _parse_flow_mapping(raw[1:-1])
    if raw.startswith("[") and raw.endswith("]"):
        return [_coerce(item) for item in _split_flow(raw[1:-1])]
    raw = re.sub(r"\s+#.*$", "", raw)  # inline comment
    if raw.lower() in ("true", "yes"):
        return True
    if raw.lower() in ("false", "no"):
        return False
    if raw.lower() in ("null", "~", ""):
        return None
    try:
        return int(raw)
    except ValueError:
        pass
    try:
        return float(raw)
    except ValueError:
        pass
    return raw


def _split_flow(inner: str) -> list[str]:
    """Split a flow collection body on top-level commas."""
    items, depth, current, quote = [], 0, "", None
    for ch in inner:
        if quote:
            current += ch
            if ch == quote:
                quote = None
            continue
        if ch in "\"'":
            quote = ch
        elif ch in "[{":
            depth += 1
        elif ch in "]}":
            depth -= 1
        elif ch == "," and depth == 0:
            items.append(current.strip())
            current = ""
            continue
        current += ch
    if current.strip():
        items.append(current.strip())
    return items


def _parse_flow_mapping(inner: str) -> dict:
    result = {}
    for item in _split_flow(inner):
        key, _, value = item.partition(":")
        result[key.strip()] = _coerce(value)
    return result


def _indent(line: str) -> int:
    return len(line) - len(line.lstrip(" "))


def _parse_block(lines: list[str], i: int, indent: int) -> tuple[object, int]:
    """Parse a block mapping or block sequence whose items sit at `indent`."""
    if i < len(lines) and lines[i].lstrip().startswith("- "):
        items = []
        while i < len(lines) and _indent(lines[i]) == indent and lines[i].lstrip().startswith("- "):
            content = lines[i].lstrip()[2:]
            if re.match(r"^[A-Za-z_][\w-]*\s*:(\s|$)", content):
                # "- key: value" starts a mapping whose keys align at indent + 2.
                lines[i] = " " * (indent + 2) + content
                value, i = _parse_block(lines, i, indent + 2)
                items.append(value)
            else:
                items.append(_coerce(content))
                i += 1
        return items, i

    result: dict = {}
    while i < len(lines):
        line = lines[i]
        if _indent(line) < indent:
            break
        m = re.match(r"^\s*([A-Za-z_][\w-]*)\s*:\s*(.*)$", line)
        if not m or _indent(line) != indent:
            i += 1
            continue
        key, raw = m.group(1), m.group(2)
        i += 1
        if raw.strip() in ("", "|", ">"):
            if i < len(lines) and (
                _indent(lines[i]) > indent or (_indent(lines[i]) == indent and lines[i].lstrip().startswith("- "))
            ):
                result[key], i = _parse_block(lines, i, _indent(lines[i]))
            else:
                result[key] = None if raw.strip() == "" else ""
        else:
            result[key] = _coerce(raw)
    return result, i


def _parse_builtin(block: str) -> dict:
    lines = [l.rstrip() for l in block.splitlines() if l.strip() and not l.lstrip().startswith("#")]
    value, _ = _parse_block(lines, 0, 0) if lines else ({}, 0)
    return value if isinstance(value, dict) else {}


def _normalise(value: object) -> object:
    """Make PyYAML output look like the built-in parser's: dates/datetimes become ISO strings."""
    if isinstance(value, dict):
        return {str(k): _normalise(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_normalise(v) for v in value]
    if isinstance(value, datetime):
        return value.isoformat().replace("+00:00", "Z")
    if isinstance(value, date):
        return value.isoformat()
    return value


def _parse_yaml(block: str) -> dict:
    if os.environ.get("DOCS_YAML") != "builtin":
        try:
            import yaml  # noqa: PLC0415

            loaded = yaml.safe_load(block)
            return _normalise(loaded) if isinstance(loaded, dict) else {}
        except ImportError:
            pass
        except yaml.YAMLError as exc:
            raise InvalidFrontmatter(str(exc).splitlines()[0]) from exc
    return _parse_builtin(block)


def parse_frontmatter(path: Path) -> tuple[dict | None, str]:
    """Return (frontmatter_dict_or_None, body_text). Raises InvalidFrontmatter if the block isn't valid YAML."""
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---"):
        return None, text
    parts = text.split("---", 2)
    if len(parts) < 3:
        return None, text
    fm = _parse_yaml(parts[1])
    return (fm if fm else None), parts[2]


# ---------------------------------------------------------------------------
# Collection
# ---------------------------------------------------------------------------

def _in_dot_dir(path: Path, root: Path) -> bool:
    """True if any directory between root and path starts with '.' (e.g. .git/, .renders/)."""
    return any(part.startswith(".") for part in path.relative_to(root).parts[:-1])


def collect_md_files(root: Path, pattern: str = "*.md") -> list[Path]:
    return sorted(p for p in root.rglob(pattern) if not _in_dot_dir(p, root))


def collect_concept_files(root: Path) -> list[Path]:
    return [p for p in collect_md_files(root) if p.name not in RESERVED_NAMES]


# ---------------------------------------------------------------------------
# Value checks
# ---------------------------------------------------------------------------

def parse_instant(value: object) -> datetime | None:
    """Parse an ISO 8601 date or datetime; None if invalid. Naive values count as UTC."""
    if not isinstance(value, str) or not value.strip():
        return None
    try:
        parsed = datetime.fromisoformat(value.strip().replace("Z", "+00:00"))
    except ValueError:
        return None
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def _valid_actor_stamp(value: object) -> bool:
    return (
        isinstance(value, dict)
        and isinstance(value.get("by"), str)
        and bool(value["by"].strip())
        and parse_instant(value.get("at")) is not None
    )


def _is_adr(fm: dict) -> bool:
    return fm.get("type") == "adr"


def resolve_md_links(body: str, source: Path, root: Path) -> list[tuple[str, Path, bool, bool]]:
    """(target, resolved path, exists, inside the bundle) per relative markdown link."""
    links = []
    # Only rendered links count: drop code blocks and code spans (a `<!--` or a Mermaid `-->` there is not a
    # comment delimiter), then HTML comments.
    lines = body.splitlines()
    for _, start, end, _ in code_fences(lines):
        lines[start : end + 1] = [""] * len(lines[start : end + 1])
    body = re.sub(r"(`+)(?:(?!\1).)+?\1", "", "\n".join(lines))
    body = re.sub(r"<!--.*?-->", "", body, flags=re.S)
    for match in re.finditer(r"\[([^\]]*)\]\(([^)\s]+)(?:\s+\"[^\"]*\")?\)", body):
        target = match.group(2)
        if target.startswith(("http://", "https://", "mailto:")):
            continue
        target = target.split("#")[0]
        if not target:
            continue
        base = root.resolve() if target.startswith("/") else source.parent
        resolved = (base / target.lstrip("/")).resolve()
        inside = resolved == root.resolve() or root.resolve() in resolved.parents
        links.append((target, resolved, resolved.exists(), inside))
    return links


# ---------------------------------------------------------------------------
# Checks
# ---------------------------------------------------------------------------

def check_root_index(root: Path, errors: list, warnings: list) -> None:
    root_index = root / "index.md"
    if not root_index.exists():
        errors.append(f"MISSING_ROOT_INDEX: {root}/index.md does not exist")
        return
    try:
        fm, _ = parse_frontmatter(root_index)
    except InvalidFrontmatter as exc:
        errors.append(f"INVALID_FRONTMATTER: index.md — not valid YAML ({exc})")
        return
    if fm is None:
        errors.append(f"ROOT_INDEX_NO_FRONTMATTER: {root_index} must declare okf_version in frontmatter")
        return
    version = fm.get("okf_version")
    if version is None:
        errors.append(f"ROOT_INDEX_MISSING_OKF_VERSION: {root_index} must declare okf_version")
    elif str(version) == "0.1":
        warnings.append(
            f"ROOT_INDEX_OKF_VERSION_LEGACY: {root_index} declares okf_version '0.1' — upgrade to '{OKF_VERSION}'"
        )
    elif str(version) != OKF_VERSION:
        warnings.append(
            f"ROOT_INDEX_OKF_VERSION_UNEXPECTED: {root_index} has okf_version={version!r} (expected '{OKF_VERSION}')"
        )
    for key in sorted(set(fm) - ROOT_INDEX_KEYS):
        warnings.append(
            f"ROOT_INDEX_UNKNOWN_KEY: {root_index} has '{key}' — OKF index files carry only okf_version "
            f"(the bundle also allows {', '.join(sorted(ROOT_INDEX_KEYS - {'okf_version'}))})"
        )


def check_reserved_files(root: Path, errors: list, warnings: list) -> None:
    """index.md/log.md are reserved: never concepts; non-root index.md carries no frontmatter."""
    for reserved in collect_md_files(root, "index.md") + collect_md_files(root, "log.md"):
        rel = reserved.relative_to(root)
        try:
            fm, _ = parse_frontmatter(reserved)
        except InvalidFrontmatter as exc:
            if reserved.parent.resolve() != root.resolve():  # the root index is reported by check_root_index
                errors.append(f"INVALID_FRONTMATTER: {rel} — not valid YAML ({exc})")
            continue
        if fm and "type" in fm:
            errors.append(f"RESERVED_FILE_MISUSED_AS_CONCEPT: {rel} is {reserved.name} but has type: frontmatter")
        elif fm and reserved.name == "index.md" and reserved.parent.resolve() != root.resolve():
            warnings.append(f"INDEX_HAS_FRONTMATTER: {rel} — OKF index files carry no frontmatter")


def check_logs(root: Path, warnings: list) -> None:
    for log_file in collect_md_files(root, "log.md"):
        rel = log_file.relative_to(root)
        lines = log_file.read_text(encoding="utf-8").splitlines()
        if any(LEGACY_LOG_LINE.match(l) for l in lines):
            warnings.append(
                f"LEGACY_LOG_FORMAT: {rel} uses 'YYYY-MM-DD — …' lines — group entries under "
                "'## YYYY-MM-DD' headings, newest first"
            )
        dates = [m.group(1) for m in map(LOG_HEADING.match, lines) if m]
        if dates != sorted(dates, reverse=True):
            warnings.append(f"LOG_NOT_NEWEST_FIRST: {rel} — date headings must be newest first")


def check_provenance(rel: Path, fm: dict, errors: list, warnings: list) -> None:
    """OKF v0.2 fields: checked only when present."""
    if "generated" in fm and not _valid_actor_stamp(fm["generated"]):
        errors.append(f"INVALID_GENERATED: {rel} — generated needs 'by' (actor) and 'at' (ISO 8601)")
    if "verified" in fm:
        stamps = fm["verified"] if isinstance(fm["verified"], list) else [fm["verified"]]
        if not stamps or not all(_valid_actor_stamp(s) for s in stamps):
            errors.append(f"INVALID_VERIFIED: {rel} — every verified entry needs 'by' and 'at' (ISO 8601)")
    if "status" in fm:
        status = str(fm["status"]).strip()
        is_adr = _is_adr(fm)
        if is_adr:
            if not MADR_STATUS.match(status):
                reason = "use 'superseded by ADR-NNNN'" if status.lower() == "superseded" else (
                    "ADRs (type: adr) use a MADR status: proposed, rejected, accepted, deprecated, superseded by ADR-NNNN"
                )
                errors.append(f"INVALID_STATUS: {rel} has status={status!r}; {reason}")
        elif status not in OKF_STATUSES:
            if MADR_STATUS.match(status):
                reason = (f"{status!r} is an ADR status, but this file has type={fm.get('type')!r}: "
                          "set type: adr; if it's a template, move it out of the bundle")
            else:
                reason = f"allowed: {', '.join(sorted(OKF_STATUSES))}"
            errors.append(f"INVALID_STATUS: {rel} has status={status!r}; {reason}")
    if "stale_after" in fm:
        stale_after = parse_instant(fm["stale_after"])
        if stale_after is None:
            errors.append(f"INVALID_STALE_AFTER: {rel} has stale_after={fm['stale_after']!r}; expected ISO 8601")
        elif stale_after < datetime.now(timezone.utc):
            warnings.append(
                f"STALE: {rel} passed its stale_after {fm['stale_after']} — review: UPDATE, ARCHIVE, or DELETE"
            )
    if "sources" in fm:
        sources = fm["sources"]
        if not isinstance(sources, list) or not all(isinstance(s, dict) and s.get("resource") for s in sources):
            errors.append(f"INVALID_SOURCES: {rel} — sources must be a list of entries that each carry 'resource'")


def check_staleness(rel: Path, fm: dict, warnings: list) -> None:
    if "stale_after" in fm:
        return  # an explicit deadline replaces the age rule
    generated = fm.get("generated")
    raw = generated.get("at") if isinstance(generated, dict) else None
    field = "generated.at"
    if raw is None and "updated" in fm:
        raw, field = fm["updated"], "updated"
    if raw is None:
        return
    instant = parse_instant(raw)
    if instant is None:
        if field == "updated":
            warnings.append(f"INVALID_UPDATED_DATE: {rel} has updated={raw!r}; expected YYYY-MM-DD")
        return
    age_days = (datetime.now(timezone.utc).date() - instant.date()).days
    if age_days > STALENESS_DAYS:
        warnings.append(
            f"STALE: {rel} last changed {instant.date().isoformat()} ({age_days} days ago, {field}) "
            "— review: UPDATE, ARCHIVE, or DELETE"
        )


def check_concepts(root: Path, errors: list, warnings: list) -> None:
    for path in collect_concept_files(root):
        rel = path.relative_to(root)
        try:
            fm, body = parse_frontmatter(path)
        except InvalidFrontmatter as exc:
            errors.append(f"INVALID_FRONTMATTER: {rel} — not valid YAML ({exc})")
            continue

        if fm is None:
            errors.append(f"MISSING_FRONTMATTER: {rel}")
            continue

        if "type" not in fm:
            errors.append(f"MISSING_TYPE: {rel} has no 'type' field")
        elif fm["type"] not in ALLOWED_TYPES:
            errors.append(
                f"INVALID_TYPE: {rel} has type={fm['type']!r}; "
                f"allowed values: {', '.join(sorted(ALLOWED_TYPES))}"
            )

        arc42 = fm.get("arc42_section")
        if arc42 is not None and (not isinstance(arc42, int) or isinstance(arc42, bool) or not (1 <= arc42 <= 12)):
            errors.append(
                f"INVALID_ARC42_SECTION: {rel} has arc42_section={arc42!r}; must be an integer 1–12"
            )

        if _is_adr(fm):
            if not path.parent.name.startswith("09"):
                warnings.append(f"ADR_MISPLACED: {rel} is an ADR — bundle ADRs live in 09-decisions/")
        elif ADR_FILE_NAME.match(path.name):
            warnings.append(f"ADR_NOT_TYPED: {rel} is named like an ADR but has type={fm.get('type')!r} — set type: adr")

        if "updated" in fm and "generated" not in fm:
            warnings.append(f"LEGACY_UPDATED_FIELD: {rel} uses 'updated' — replace with generated: {{ by, at }}")
        if "summary" in fm and "description" not in fm:
            warnings.append(f"LEGACY_SUMMARY_FIELD: {rel} uses 'summary' — rename to 'description'")

        check_provenance(rel, fm, errors, warnings)
        check_staleness(rel, fm, warnings)

        for target, resolved, exists, inside in resolve_md_links(body, path, root):
            shown = f"{rel} → {target} (resolves to {os.path.relpath(resolved, root.resolve())})"
            if not exists:
                errors.append(f"BROKEN_LINK: {shown}")
            elif not inside:
                # OKF consumers tolerate such links (monorepo paths are legitimate), but the bundle isn't self-contained.
                warnings.append(f"LINK_OUTSIDE_BUNDLE: {shown}")


# Fenced code blocks: 3+ backticks or 3+ tildes, after any indent or blockquote `>` markers, so fences inside
# list items and quotes count (unlike CommonMark, a 4-space-indented fence counts too: missing a real diagram
# is worse than checking an example). The first word of the info string is the kind; a backtick fence's info
# string can't contain a backtick. The block closes on a line of the same character, at least as long; an
# unclosed block runs to the end of the file. Body lines lose the opening line's prefix.
# diagram-check.py and validate.py share this rule (kept identical; a test checks they agree).
FENCE_OPEN = re.compile(r"^(?P<prefix>(?:[ \t]*>)*[ \t]*)(?P<fence>`{3,}|~{3,})(?P<info>.*)$")


def code_fences(lines: list[str]) -> list[tuple[str, int, int, list[str]]]:
    """(lower-cased kind, opening line index, closing line index or len(lines), body lines) per block."""
    blocks, i = [], 0
    while i < len(lines):
        match = FENCE_OPEN.match(lines[i])
        if not match or (match["fence"][0] == "`" and "`" in match["info"]):
            i += 1
            continue
        prefix, fence, words = match["prefix"], match["fence"], match["info"].split()
        close = re.compile(rf"^(?:[ \t]*>)*[ \t]*{re.escape(fence[0])}{{{len(fence)},}}[ \t]*$")
        j = i + 1
        while j < len(lines) and not close.match(lines[j]):
            j += 1
        body = [line[len(prefix):] if line.startswith(prefix) else line.lstrip(" \t>") for line in lines[i + 1 : j]]
        blocks.append((words[0].lower() if words else "", i, j, body))
        i = j + 1
    return blocks


DIAGRAM_TITLE = {
    # Mermaid: accTitle, a frontmatter `title:` or a C4 `title …` statement; PlantUML: a `title` line.
    "mermaid": re.compile(r"(?m)^\s*(?:accTitle\s*:|title\s*:|title\s+\S)"),
    "plantuml": re.compile(r"(?mi)^\s*title\s+\S"),
}
IMAGE_WITHOUT_ALT = re.compile(r"!\[\s*\]\(([^)\s]+)")


def check_accessibility(root: Path, warnings: list) -> None:
    """Diagrams need a title screen readers can announce; images need alt text."""
    for path in collect_md_files(root):
        rel = path.relative_to(root)
        lines = path.read_text(encoding="utf-8").splitlines()
        in_fence = set()
        for kind, start, end, body in code_fences(lines):
            in_fence.update(range(start, min(end, len(lines) - 1) + 1))
            pattern = DIAGRAM_TITLE.get(kind)
            if pattern and not pattern.search("\n".join(body)):
                hint = "add accTitle/accDescr" if kind == "mermaid" else "add a title line"
                warnings.append(f"DIAGRAM_NO_TITLE: {rel}:{start + 1} — {kind} diagram has no title; {hint}")
        for n, line in enumerate(lines):
            if n not in in_fence:
                for image in IMAGE_WITHOUT_ALT.finditer(line):
                    warnings.append(f"IMAGE_NO_ALT: {rel}:{n + 1} — image {image.group(1)} has no alt text")


SECTION8_MEGA_DOC_NAMES = {"cross-cutting.md", "crosscutting.md", "cross-cutting-concepts.md"}


def check_section8_split(root: Path, errors: list) -> None:
    """§8 must be split into one file per concept and Diátaxis type, never one mega-doc."""
    for path in collect_concept_files(root):
        in_section8 = path.parent.name.startswith("08")
        if in_section8 and path.name in SECTION8_MEGA_DOC_NAMES:
            errors.append(
                f"SECTION8_NOT_SPLIT: {path.relative_to(root)} — split cross-cutting concepts "
                "into one file per concept and Diátaxis type (e.g. security-strategy.md + security-conventions.md)"
            )


def check_orphans(root: Path, warnings: list) -> None:
    """Warn about concept files not listed in the parent index.md."""
    for concept in collect_concept_files(root):
        parent_index = concept.parent / "index.md"
        if not parent_index.exists():
            warnings.append(f"MISSING_PARENT_INDEX: {concept.relative_to(root)} has no sibling index.md")
            continue
        if concept.name not in parent_index.read_text(encoding="utf-8"):
            warnings.append(
                f"ORPHAN: {concept.relative_to(root)} is not linked in {parent_index.relative_to(root)}"
            )


def main() -> None:
    parser = argparse.ArgumentParser(description="Architecture bundle conformance checker (OKF v0.2 + arc42)")
    parser.add_argument("bundle_root", help="Path to the bundle root directory")
    output = parser.add_mutually_exclusive_group()
    output.add_argument("--json", action="store_true", help="Output machine-readable JSON")
    output.add_argument("--summary", action="store_true", help="Output exact counts per code instead of messages")
    args = parser.parse_args()

    root = Path(args.bundle_root).resolve()
    if not root.is_dir():
        msg = f"Bundle root not found: {root}"
        if args.json:
            print(json.dumps({"errors": [msg], "warnings": [], "ok": False}))
        else:
            print(f"[ERROR] {msg}")
        sys.exit(1)

    errors: list[str] = []
    warnings: list[str] = []

    check_root_index(root, errors, warnings)
    check_reserved_files(root, errors, warnings)
    check_logs(root, warnings)
    check_concepts(root, errors, warnings)
    check_section8_split(root, errors)
    check_orphans(root, warnings)
    check_accessibility(root, warnings)

    ok = len(errors) == 0

    if ok:
        summary = f"OK — 0 errors, {len(warnings)} warning(s)"
    else:
        summary = f"FAILED — {len(errors)} error(s), {len(warnings)} warning(s)"
    if args.json:
        print(json.dumps({"errors": errors, "warnings": warnings, "ok": ok}, indent=2))
    elif args.summary:
        print(summary)
        for label, messages in (("errors", errors), ("warnings", warnings)):
            counts = Counter(m.split(":", 1)[0] for m in messages)
            if counts:
                print(f"{label}:")
                for code, n in sorted(counts.items(), key=lambda item: (-item[1], item[0])):
                    print(f"  {code} × {n}")
    else:
        for e in errors:
            print(f"[ERROR] {e}")
        for w in warnings:
            print(f"[WARN]  {w}")
        print(summary)

    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
