#!/usr/bin/env python3
"""
Render every diagram in an architecture bundle and report the ones that fail.

Usage:
  python diagram-check.py <bundle-root>
  python diagram-check.py <bundle-root> --json
  python diagram-check.py <bundle-root> --strict

Finds mermaid and plantuml code fences (``` or ~~~, also in lists and quotes) in Markdown files, plus *.mmd, *.puml,
*.drawio, *.drawio.svg / .drawio.png files and workspace.dsl. Each diagram is
rendered with the matching tool, if that tool is on PATH:

  mermaid     mmdc -i <src> -o <out>.png
  plantuml    plantuml -tpng -failfast2 -o <absolute dir> <src>
  drawio      drawio -x -f png -o <out>.png <src>
  structurizr structurizr | structurizr.sh validate -workspace <src>   (validated, not rendered)

Renders go to <bundle>/.renders/, mirroring the bundle layout, so they can
be opened for visual QA; validate.py skips dot-directories. Nothing else is written: fenced
blocks are handed to the renderer through a temporary file, so a run without renderers
leaves the bundle untouched. The script never installs or
downloads a renderer: a missing tool is a RENDERER_MISSING warning (an error with
--strict, for CI that installs renderers).

Exit 0 = no errors. Exit 1 = render errors (or, with --strict, a missing renderer).
Exit 2 = bundle root not found.

Output (--json): {"errors": [...], "warnings": [...], "info": [...], "ok": bool}
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
import tempfile
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

RENDER_TIMEOUT_SECONDS = 120
OUTPUT_DIR = Path(".renders")


@dataclass(frozen=True)
class Renderer:
    binaries: tuple[str, ...]
    argv: Callable[[Path, Path], list[str]]
    source_suffix: str
    install: str  # official install command or download page; shown, never run
    renders_png: bool = True


RENDERERS: dict[str, Renderer] = {
    "mermaid": Renderer(
        ("mmdc",), lambda src, out: ["-i", str(src), "-o", str(out)], ".mmd",
        "npm install -g @mermaid-js/mermaid-cli",
    ),
    "plantuml": Renderer(
        ("plantuml",), lambda src, out: ["-tpng", "-failfast2", "-o", str(out.parent), str(src)], ".puml",
        "https://plantuml.com/download",
    ),
    "drawio": Renderer(
        ("drawio",), lambda src, out: ["-x", "-f", "png", "-o", str(out), str(src)], ".drawio",
        "https://github.com/jgraph/drawio-desktop/releases",
    ),
    "structurizr": Renderer(
        ("structurizr", "structurizr.sh"), lambda src, out: ["validate", "-workspace", str(src)], ".dsl",
        "https://docs.structurizr.com/cli", renders_png=False,
    ),
}


@dataclass(frozen=True)
class Diagram:
    kind: str
    location: str  # "<rel path>" or "<rel path>:<line>" for fenced blocks
    render: Path  # PNG the renderer should produce
    source: Path | None = None  # diagram file in the bundle
    body: str | None = None  # fenced block text; written to a temp file only when it is rendered


def _in_dot_dir(path: Path, root: Path) -> bool:
    return any(part.startswith(".") for part in path.relative_to(root).parts[:-1])


def _bundle_files(root: Path) -> list[Path]:
    return sorted(p for p in root.rglob("*") if p.is_file() and not _in_dot_dir(p, root))


def _file_kind(path: Path) -> str | None:
    name = path.name.lower()
    if name.endswith((".drawio", ".drawio.svg", ".drawio.png")):
        return "drawio"
    if name.endswith((".mmd", ".mermaid")):
        return "mermaid"
    if name.endswith((".puml", ".plantuml")):
        return "plantuml"
    if name == "workspace.dsl":
        return "structurizr"
    return None


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


def _fenced_blocks(text: str) -> list[tuple[str, int, str]]:
    """(kind, 1-based line of the opening fence, block body) for each diagram fence."""
    return [
        (kind, start + 1, "\n".join(body) + "\n")
        for kind, start, _, body in code_fences(text.splitlines())
        if kind in ("mermaid", "plantuml")
    ]


def collect_diagrams(root: Path) -> list[Diagram]:
    out_root = root / OUTPUT_DIR
    diagrams = []
    for path in _bundle_files(root):
        rel = path.relative_to(root)
        if path.suffix == ".md":
            for n, (kind, line, body) in enumerate(_fenced_blocks(path.read_text(encoding="utf-8")), 1):
                render = out_root / rel.parent / f"{path.stem}-{n}.png"
                diagrams.append(Diagram(kind, f"{rel.as_posix()}:{line}", render, body=body))
        elif kind := _file_kind(path):
            # Keep the whole name: v1.0.mmd, v1.1.mmd, x.mmd and x.puml must not share a PNG.
            render = out_root / rel.parent / (path.name + ".png")
            diagrams.append(Diagram(kind, rel.as_posix(), render, source=path))
    return diagrams


def _first_lines(text: str, limit: int = 3) -> str:
    lines = [line.strip() for line in text.strip().splitlines() if line.strip()]
    return " | ".join(lines[:limit]) or "no output"


def _prune_empty_dirs(path: Path, root: Path) -> None:
    """Remove the empty directories a failed render left behind, up to the bundle root."""
    while path != root and path.is_dir() and not any(path.iterdir()):
        path.rmdir()
        path = path.parent


def render(diagram: Diagram, binary: str, root: Path, errors: list, info: list) -> None:
    """Run one installed renderer; a non-zero exit or a missing PNG counts as a failure."""
    renderer = RENDERERS[diagram.kind]
    diagram.render.parent.mkdir(parents=True, exist_ok=True)
    # A PNG left by an earlier run would pass the existence check for a renderer that wrote nothing.
    diagram.render.unlink(missing_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        source = diagram.source
        if source is None:  # fenced block: the renderer needs a file, but the bundle gets none
            source = Path(tmp) / (diagram.render.stem + renderer.source_suffix)
            source.write_text(diagram.body or "", encoding="utf-8")
        # PlantUML names its output after the diagram, not the target; render into a scratch dir.
        target = Path(tmp) / "out" / diagram.render.name if diagram.kind == "plantuml" else diagram.render
        target.parent.mkdir(parents=True, exist_ok=True)
        try:
            proc = subprocess.run(
                [binary, *renderer.argv(source, target)],
                capture_output=True, text=True, timeout=RENDER_TIMEOUT_SECONDS,
            )
        except subprocess.TimeoutExpired:
            _prune_empty_dirs(diagram.render.parent, root)
            errors.append(f"DIAGRAM_RENDER_FAILED: {diagram.location} — {binary} timed out after "
                          f"{RENDER_TIMEOUT_SECONDS}s")
            return
        if diagram.kind == "plantuml":
            produced = sorted((Path(tmp) / "out").glob("*.png"))
            if produced:
                shutil.move(str(produced[0]), diagram.render)
        if proc.returncode != 0 or (renderer.renders_png and not diagram.render.exists()):
            _prune_empty_dirs(diagram.render.parent, root)
            detail = _first_lines(proc.stderr or proc.stdout)
            errors.append(f"DIAGRAM_RENDER_FAILED: {diagram.location} — {diagram.kind} via {binary} "
                          f"(exit {proc.returncode}): {detail}")
            return
    if renderer.renders_png:
        info.append(f"DIAGRAM_RENDERED: {diagram.location} → {diagram.render.relative_to(root).as_posix()}")
    else:
        info.append(f"DIAGRAM_VALIDATED: {diagram.location} — {diagram.kind} via {binary}")


def check(root: Path, strict: bool) -> tuple[list[str], list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    info: list[str] = []
    missing: Counter[str] = Counter()
    for diagram in collect_diagrams(root):
        renderer = RENDERERS[diagram.kind]
        binary = next((b for b in renderer.binaries if shutil.which(b)), None)
        if binary is None:
            missing[diagram.kind] += 1
            continue
        render(diagram, binary, root, errors, info)
    for kind, count in sorted(missing.items()):
        tools = " or ".join(RENDERERS[kind].binaries)
        msg = (f"RENDERER_MISSING: {tools} not on PATH — {count} {kind} diagram(s) not checked. "
               f"Install: {RENDERERS[kind].install} (this script never downloads renderers)")
        (errors if strict else warnings).append(msg)
    return errors, warnings, info


def main() -> None:
    parser = argparse.ArgumentParser(description="Render and check the diagrams in an architecture bundle")
    parser.add_argument("bundle_root", help="Path to the bundle root directory")
    parser.add_argument("--json", action="store_true", help="Output machine-readable JSON")
    parser.add_argument("--strict", action="store_true", help="Treat a missing renderer as an error")
    args = parser.parse_args()

    root = Path(args.bundle_root).resolve()
    if not root.is_dir():
        msg = f"Bundle root not found: {root}"
        print(json.dumps({"errors": [msg], "warnings": [], "info": [], "ok": False}) if args.json else f"[ERROR] {msg}")
        sys.exit(2)

    errors, warnings, info = check(root, args.strict)
    ok = not errors
    if args.json:
        print(json.dumps({"errors": errors, "warnings": warnings, "info": info, "ok": ok}, indent=2))
    else:
        for e in errors:
            print(f"[ERROR] {e}")
        for w in warnings:
            print(f"[WARN]  {w}")
        for i in info:
            print(f"[INFO]  {i}")
        verdict = "OK" if ok else "FAILED"
        print(f"{verdict} — {len(errors)} error(s), {len(warnings)} warning(s), {len(info)} diagram(s) checked")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
