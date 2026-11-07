"""Black-box tests for the architecture scripts (scripts/architecture/).

Each test builds a bundle in a temp directory (via bootstrap.py or by hand), runs a script
as a subprocess, and asserts on exit codes and reported findings — never on internals.

Run from anywhere:
  python3 -B -m unittest discover -s .agents/skills/docs/tests -v
"""

import json
import os
import re
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

# Importing bootstrap.py must not leave __pycache__ inside the shipped skill (it skews the index hash).
sys.dont_write_bytecode = True

SKILL_DIR = Path(__file__).resolve().parent.parent
SCRIPTS = SKILL_DIR / "scripts" / "architecture"
TEMPLATES = SKILL_DIR / "templates" / "architecture"


def run(script: str, *args: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        [sys.executable, str(SCRIPTS / script), *args],
        capture_output=True,
        text=True,
    )


def bootstrap(out: Path, *extra: str) -> subprocess.CompletedProcess:
    return run("bootstrap.py", "--project-name", "Payment Gateway", "--output-dir", str(out), *extra)


def validate_json(bundle: Path) -> tuple[int, dict]:
    proc = run("validate.py", str(bundle), "--json")
    return proc.returncode, json.loads(proc.stdout)


def codes(messages: list[str]) -> set[str]:
    return {m.split(":", 1)[0] for m in messages}


def set_frontmatter_field(path: Path, key: str, value: str) -> None:
    text = path.read_text(encoding="utf-8")
    text = re.sub(rf"^{key}:.*$", f"{key}: {value}", text, count=1, flags=re.MULTILINE)
    path.write_text(text, encoding="utf-8")


def h1_lines(bundle: Path) -> list[str]:
    lines = []
    for p in bundle.rglob("*.md"):
        lines += [l for l in p.read_text(encoding="utf-8").splitlines() if l.startswith("# ")]
    return lines


class TempDirTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.tmp = Path(self._tmp.name)

    def tearDown(self) -> None:
        self._tmp.cleanup()


class BootstrapTest(TempDirTestCase):
    def test_fresh_bundle_validates_in_every_language(self):
        for lang in ("en", "de"):
            with self.subTest(lang=lang):
                bundle = self.tmp / lang
                self.assertEqual(bootstrap(bundle, "--language", lang).returncode, 0)
                rc, out = validate_json(bundle)
                self.assertEqual(rc, 0, out["errors"])
                self.assertEqual(out["errors"], [])

    def test_writes_section_folders_and_stubs_listed_in_section_index(self):
        bundle = self.tmp / "b"
        bootstrap(bundle)
        self.assertEqual(len([p for p in bundle.iterdir() if p.is_dir()]), 12)
        stub = bundle / "08-crosscutting" / "security-strategy.md"
        self.assertTrue(stub.exists())
        self.assertIn("security-strategy.md", (bundle / "08-crosscutting" / "index.md").read_text())

    def test_writes_no_hidden_files_and_rejects_the_removed_mode_flag(self):
        bundle = self.tmp / "b"
        bootstrap(bundle)
        self.assertEqual([p.name for p in bundle.iterdir() if p.name.startswith(".")], [])
        proc = bootstrap(self.tmp / "c", "--mode", "one-shot")
        self.assertEqual(proc.returncode, 2)
        self.assertFalse((self.tmp / "c").exists())

    def test_output_dir_defaults_to_docs_architecture(self):
        proc = subprocess.run(
            [sys.executable, str(SCRIPTS / "bootstrap.py"), "--project-name", "Payment Gateway"],
            capture_output=True, text=True, cwd=self.tmp,
        )
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertTrue((self.tmp / "docs" / "architecture" / "index.md").exists())
        self.assertFalse((self.tmp / "docs" / "arch").exists())

    def test_headings_are_single_language(self):
        bundle_en, bundle_de = self.tmp / "en", self.tmp / "de"
        bootstrap(bundle_en, "--language", "en")
        bootstrap(bundle_de, "--language", "de")
        en, de = "\n".join(h1_lines(bundle_en)), "\n".join(h1_lines(bundle_de))
        self.assertIn("Introduction and Goals", en)
        self.assertNotIn("Einführung", en)
        self.assertIn("Einführung und Ziele", de)
        self.assertNotIn("Introduction and Goals", de)
        self.assertNotIn(" / ", en + de)

    def test_settings_are_stored_in_root_index(self):
        bundle = self.tmp / "b"
        bootstrap(bundle, "--language", "de", "--detail-level", "lean", "--domain-profile", "microservice")
        root = (bundle / "index.md").read_text()
        self.assertIn('okf_version: "0.2"', root)
        self.assertIn("language: de", root)
        self.assertIn("detail_level: LEAN", root)
        self.assertIn("domain_profile: microservice", root)

    def test_rerun_never_overwrites_and_exits_nonzero(self):
        bundle = self.tmp / "b"
        bootstrap(bundle)
        marker = bundle / "index.md"
        marker.write_text(marker.read_text() + "\nlocal edit\n")
        proc = bootstrap(bundle)
        self.assertEqual(proc.returncode, 1)
        self.assertIn("local edit", marker.read_text())

    def test_rerun_creates_only_the_missing_files(self):
        bundle = self.tmp / "b"
        bootstrap(bundle)
        (bundle / "12-glossary" / "glossary.md").unlink()
        proc = bootstrap(bundle)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertIn("1 files created", proc.stdout)
        self.assertTrue((bundle / "12-glossary" / "glossary.md").exists())

    def test_stub_frontmatter_follows_the_contract(self):
        bundle = self.tmp / "b"
        bootstrap(bundle)
        for path in bundle.glob("[01][0-9]-*/*.md"):
            if path.name == "index.md":
                continue
            fm = path.read_text(encoding="utf-8").split("---\n", 2)[1]
            for key in ("type:", "title:", "description:", "tags:", "arc42_section:", "status:", "generated:", "links:"):
                self.assertRegex(fm, rf"(?m)^{key}", f"{path.relative_to(bundle)} lacks {key}")
            self.assertRegex(fm, r"(?m)^tags: \[architecture, [a-z-]+\]", path.name)
            self.assertIn("by: docs-bootstrap/", fm)
            for old in ("name:", "kind:", "status: current"):
                self.assertNotIn(old, fm)


class BootstrapTemplateTest(TempDirTestCase):
    """Stubs start from the section templates, in the bundle's language."""

    def one_shot(self, lang: str) -> Path:
        bundle = self.tmp / lang
        self.assertEqual(bootstrap(bundle, "--language", lang).returncode, 0)
        return bundle

    def test_adr_stub_is_madr4(self):
        adr = (self.one_shot("en") / "09-decisions" / "adr-0001-initial-architecture.md").read_text()
        for heading in ("## Context and Problem Statement", "## Considered Options", "## Decision Outcome"):
            self.assertIn(heading, adr)
        self.assertRegex(adr, r"(?m)^type: adr$")
        self.assertRegex(adr, r"(?m)^status: proposed\b")
        self.assertRegex(adr, r"(?m)^title: 'ADR-0001: Initial architecture'$")
        self.assertRegex(adr, r"(?m)^# ADR-0001: Initial architecture$")

    def test_quality_and_risk_stubs_carry_lint_ids(self):
        bundle = self.one_shot("en")
        self.assertIn("QS-01", (bundle / "10-quality" / "quality-scenarios.md").read_text())
        self.assertIn("RISK-01", (bundle / "11-risks" / "risks-and-tech-debt.md").read_text())

    def test_frontmatter_has_no_placeholders_and_bundles_are_clean(self):
        for lang in ("en", "de"):
            with self.subTest(lang=lang):
                bundle = self.one_shot(lang)
                for path in bundle.rglob("*.md"):
                    fm = path.read_text(encoding="utf-8").split("---\n", 2)
                    if len(fm) == 3:
                        self.assertNotIn("<!--", fm[1], path.relative_to(bundle))
                rc, out = validate_json(bundle)
                self.assertEqual((rc, out["errors"], out["warnings"]), (0, [], []))
                lint = run("arc42-lint.py", str(bundle))
                self.assertEqual(lint.returncode, 0, lint.stdout + lint.stderr)

    def test_german_bundle_has_no_english_template_headings(self):
        english = set()
        for template in TEMPLATES.glob("arc42-*.md"):
            english |= {key for key in map(heading_key, template.read_text().splitlines()) if key}
        bundle = self.one_shot("de")
        found = sorted(
            f"{path.relative_to(bundle)}: {line}"
            for path in bundle.rglob("*.md")
            for line in path.read_text(encoding="utf-8").splitlines()
            if heading_key(line) in english
        )
        self.assertEqual(found, [])

    def test_de_json_translates_every_template_heading(self):
        de = json.loads((SCRIPTS / "languages" / "de.json").read_text(encoding="utf-8"))["headings"]
        missing = sorted({
            key for template in TEMPLATES.glob("arc42-*.md")
            for key in map(heading_key, template.read_text().splitlines())
            if key and key not in de
        })
        self.assertEqual(missing, [])


def heading_key(line: str) -> str:
    """The translatable part of an H2/H3 heading, or "" (mirrors bootstrap.py's rule)."""
    m = re.match(r"^#{2,3} (.*)$", line)
    if not m:
        return ""
    key = m.group(1).split("<!--", 1)[0].strip().rstrip(":").removesuffix(" —").strip()
    if len(key) <= 1 or re.match(r"^(?:QS|RISK|TD|IF|ADR)-\d+", key):
        return ""
    return key


class ValidateTest(TempDirTestCase):
    def make_bundle(self) -> Path:
        bundle = self.tmp / "b"
        bootstrap(bundle)
        return bundle

    def test_dot_directories_are_ignored(self):
        bundle = self.make_bundle()
        write(bundle / ".hidden" / "notes.md", "no frontmatter, [broken](nowhere.md)\n")
        rc, out = validate_json(bundle)
        self.assertEqual(rc, 0, out["errors"])
        self.assertFalse(any(".hidden" in m for m in out["errors"] + out["warnings"]))

    def test_seeded_defects_are_reported(self):
        bundle = self.make_bundle()
        sec3 = bundle / "03-context"
        set_frontmatter_field(sec3 / "context-and-scope.md", "arc42_section", '"3"')
        set_frontmatter_field(sec3 / "interface-table.md", "type", "howto")
        with (sec3 / "context-and-scope.md").open("a") as f:
            f.write("\nSee [missing](./does-not-exist.md).\n")
        aged = bundle / "02-constraints" / "constraints.md"
        aged.write_text(re.sub(r"(?m)^  at: .*$", "  at: 2020-01-01T00:00:00Z", aged.read_text()))
        (bundle / "04-strategy" / "unlisted.md").write_text("---\ntype: explanation\n---\n\n# Unlisted\n")
        (bundle / "06-runtime" / "no-type.md").write_text("---\ntitle: x\n---\n\n# x\n")
        (bundle / "08-crosscutting" / "cross-cutting.md").write_text("---\ntype: reference\n---\n\n# All\n")
        with (bundle / "05-building-blocks" / "building-blocks-level1.md").open("a") as f:
            f.write("\n```mermaid\nflowchart LR\n  A --> B\n```\n")

        rc, out = validate_json(bundle)
        self.assertEqual(rc, 1)
        self.assertTrue(
            {"INVALID_ARC42_SECTION", "INVALID_TYPE", "BROKEN_LINK", "MISSING_TYPE", "SECTION8_NOT_SPLIT"}
            <= codes(out["errors"]),
            out["errors"],
        )
        self.assertTrue({"STALE", "ORPHAN", "DIAGRAM_NO_TITLE"} <= codes(out["warnings"]), out["warnings"])

    def test_links_inside_html_comments_are_not_checked(self):
        bundle = self.tmp / "b"
        bootstrap(bundle)
        with (bundle / "02-constraints" / "constraints.md").open("a") as f:
            f.write("\n<!-- e.g. [old page](./missing.md) -->\n[real](./also-missing.md)\n")
        rc, out = validate_json(bundle)
        self.assertEqual(out["errors"], ["BROKEN_LINK: 02-constraints/constraints.md → ./also-missing.md (resolves to 02-constraints/also-missing.md)"])

    def test_comment_markers_in_code_do_not_hide_links(self):
        bundle = self.tmp / "b"
        bootstrap(bundle)
        with (bundle / "02-constraints" / "constraints.md").open("a") as f:
            f.write("\nUse the `<!--` marker.\n[missing](./nope.md)\n\n```mermaid\nflowchart LR\n  accTitle: x\n  A --> B\n```\n")
        rc, out = validate_json(bundle)
        self.assertEqual(out["errors"], ["BROKEN_LINK: 02-constraints/constraints.md → ./nope.md (resolves to 02-constraints/nope.md)"])

    def test_links_leaving_the_bundle_warn_if_the_target_exists(self):
        bundle = self.tmp / "b"
        bootstrap(bundle)
        (self.tmp / "README.md").write_text("# Repo\n")
        with (bundle / "02-constraints" / "constraints.md").open("a") as f:
            f.write("\n[repo](../../README.md) [gone](../../gone.md)\n")
        rc, out = validate_json(bundle)
        self.assertEqual(rc, 1)
        self.assertEqual(out["errors"], ["BROKEN_LINK: 02-constraints/constraints.md → ../../gone.md (resolves to ../gone.md)"])
        self.assertIn(
            "LINK_OUTSIDE_BUNDLE: 02-constraints/constraints.md → ../../README.md (resolves to ../README.md)",
            out["warnings"],
        )

    def test_summary_prints_exact_counts_per_code(self):
        bundle = self.tmp / "b"
        bootstrap(bundle)
        with (bundle / "02-constraints" / "constraints.md").open("a") as f:
            f.write("\n[a](./gone-1.md) [b](./gone-2.md)\n")
        (bundle / "04-strategy" / "unlisted.md").write_text("---\ntype: explanation\n---\n\n# Unlisted\n")
        proc = run("validate.py", str(bundle), "--summary")
        self.assertEqual(proc.returncode, 1)
        lines = proc.stdout.splitlines()
        self.assertEqual(lines[0], "FAILED — 2 error(s), 1 warning(s)")
        self.assertIn("  BROKEN_LINK × 2", lines)
        self.assertIn("  ORPHAN × 1", lines)
        self.assertNotIn("→", proc.stdout)

    def test_links_resolve_relative_to_the_containing_file(self):
        bundle = self.make_bundle()
        with (bundle / "03-context" / "context-and-scope.md").open("a") as f:
            f.write("\n[ok](./interface-table.md) [also ok](../05-building-blocks/building-blocks-level1.md)\n")
        rc, out = validate_json(bundle)
        self.assertEqual(rc, 0, out["errors"])


class Arc42LintTest(TempDirTestCase):
    def test_missing_path_fails(self):
        proc = run("arc42-lint.py", str(self.tmp / "typo"))
        self.assertEqual(proc.returncode, 2)

    def test_fresh_bundle_passes(self):
        bundle = self.tmp / "b"
        bootstrap(bundle)
        self.assertEqual(run("arc42-lint.py", str(bundle)).returncode, 0)

    def test_sections_split_across_files_merge_silently(self):
        bundle = self.tmp / "b"
        bootstrap(bundle)
        decisions = bundle / "09-decisions"
        (decisions / "adr-0002-x.md").write_text((decisions / "adr-0001-initial-architecture.md").read_text())
        proc = run("arc42-lint.py", str(bundle))
        self.assertNotIn("detected in both", proc.stderr)


class LintTemplateShapeTest(TempDirTestCase):
    """RULE-1 and RULE-2 read the table shapes the §3 and §5 templates use."""

    def lint(self, bundle: Path, *extra: str) -> str:
        proc = run("arc42-lint.py", str(bundle), *extra)
        return proc.stdout + proc.stderr

    def test_fresh_bundle_cross_checks_interfaces_cleanly(self):
        for lang in ("en", "de"):
            with self.subTest(lang=lang):
                bundle = self.tmp / lang
                bootstrap(bundle, "--language", lang)
                out = self.lint(bundle, "--lang", lang)
                self.assertNotIn("RULE-1", out)
                self.assertNotIn("RULE-2", out)

    def test_fresh_bundle_lints_clean_in_both_languages(self):
        # RULE-3 and RULE-4 read body labels (`**Quality property:**`, `**Risks created:**`);
        # a German stub must carry the German forms or --lang de cannot see its own scenarios.
        for lang in ("en", "de"):
            with self.subTest(lang=lang):
                bundle = self.tmp / lang
                bootstrap(bundle, "--language", lang)
                proc = run("arc42-lint.py", str(bundle), "--lang", lang, "--strict")
                self.assertEqual(proc.returncode, 0, proc.stdout + proc.stderr)

    def test_language_defaults_to_the_one_the_bundle_declares(self):
        bundle = self.tmp / "de"
        bootstrap(bundle, "--language", "de")
        out = self.lint(bundle)
        self.assertIn("[Deutsch]", out)
        self.assertNotIn("RULE-3", out)

    def test_interface_id_mismatch_is_an_error(self):
        bundle = self.tmp / "b"
        bootstrap(bundle)
        ctx = bundle / "03-context" / "context-and-scope.md"
        ctx.write_text(ctx.read_text().replace("| IF-02 |", "| IF-09 |"))
        proc = run("arc42-lint.py", str(bundle))
        self.assertEqual(proc.returncode, 1, proc.stdout)
        self.assertIn("IF-09 defined in Section 3 but missing from Section 5", proc.stdout)
        self.assertIn("IF-02 referenced in Section 5 but not defined in Section 3", proc.stdout)

    def test_filled_building_block_missing_from_deployment_is_an_error(self):
        bundle = self.tmp / "b"
        bootstrap(bundle)
        bb = bundle / "05-building-blocks" / "building-blocks-level1.md"
        bb.write_text(bb.read_text().replace("| <!-- Core Service --> |", "| Ledger |", 1))
        proc = run("arc42-lint.py", str(bundle))
        self.assertEqual(proc.returncode, 1, proc.stdout)
        self.assertIn('Building block "Ledger" (Section 5) not found in Section 7', proc.stdout)


    def test_bold_building_block_names_are_matched_without_markup(self):
        bundle = self.tmp / "b"
        bootstrap(bundle)
        bb = bundle / "05-building-blocks" / "building-blocks-level1.md"
        bb.write_text(bb.read_text().replace("| <!-- Core Service --> |", "| **Ledger** |", 1))
        proc = run("arc42-lint.py", str(bundle))
        self.assertIn('Building block "Ledger" (Section 5) not found in Section 7', proc.stdout)

    def test_label_at_the_end_of_a_header_marks_a_block_table(self):
        bundle = self.tmp / "b"
        bootstrap(bundle)
        with (bundle / "05-building-blocks" / "building-blocks-level1.md").open("a") as f:
            f.write("\n## Billing\n\n| Container name | Role |\n| --- | --- |\n| Billing | money |\n")
        proc = run("arc42-lint.py", str(bundle))
        self.assertIn('Building block "Billing" (Section 5) not found in Section 7', proc.stdout)

    def test_level2_parts_need_no_deployment_entry(self):
        bundle = self.tmp / "b"
        bootstrap(bundle)
        table = "| {} | Role |\n| --- | --- |\n| {} | internal |\n"
        write(
            bundle / "05-building-blocks" / "level2-ledger.md",
            "---\ntype: reference\narc42_section: 5\n---\n\n# Level-2 Whitebox — Ledger\n\n"
            "```bash\n# a comment, not a heading\n```\n\n" + table.format("Component", "Ledger Writer"),
        )
        with (bundle / "05-building-blocks" / "building-blocks-level1.md").open("a") as f:
            f.write("\n## Auth\n\n" + table.format("Sub-component", "Token Engine"))
        proc = run("arc42-lint.py", str(bundle))
        self.assertNotIn("RULE-2", proc.stdout + proc.stderr)


LEGACY_CODES = {
    "LEGACY_UPDATED_FIELD", "LEGACY_SUMMARY_FIELD", "LEGACY_LOG_FORMAT",
    "ROOT_INDEX_OKF_VERSION_LEGACY", "ROOT_INDEX_UNKNOWN_KEY",
}


# Fixture dates are fixed, so a year after they were written validate.py starts reporting them as STALE.
AGEING = {"STALE"}


def write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def v02_concept(extra: str = "", body: str = "# Goals\n") -> str:
    return (
        "---\ntype: explanation\ntitle: Goals\narc42_section: 1\n"
        "description: Why the system exists.\n"
        "generated:\n  by: claude-code/claude-opus-5-5\n  at: 2026-10-01T09:00:00Z\n"
        f"{extra}---\n\n{body}"
    )


def v02_bundle(root: Path, concept: str) -> Path:
    write(root / "index.md", '---\nokf_version: "0.2"\nlanguage: en\ndetail_level: LEAN\n---\n\n# X\n\n- [01](./01-goals/index.md)\n')
    write(root / "log.md", "# Change log\n\n## 2026-10-01\n\n- **Creation**: bundle\n")
    write(root / "01-goals" / "index.md", "# 01. Goals\n\n- [goals](./goals.md) — why\n")
    write(root / "01-goals" / "goals.md", concept)
    return root


def adr_concept(status: str) -> str:
    return v02_concept(f"status: {status}\n").replace("type: explanation", "type: adr")


class OkfV02Test(TempDirTestCase):
    def test_fresh_bundle_is_v02_without_warnings(self):
        bundle = self.tmp / "b"
        bootstrap(bundle)
        root = (bundle / "index.md").read_text()
        self.assertIn('okf_version: "0.2"', root)
        stub = (bundle / "08-crosscutting" / "security-strategy.md").read_text()
        fm = stub.split("---", 2)[1]
        self.assertIn("description:", fm)
        self.assertIn("generated:", fm)
        self.assertIn("by: docs-bootstrap/", fm)
        self.assertIn("status: draft", fm)
        self.assertNotIn("summary:", fm)
        self.assertNotIn("updated:", fm)
        self.assertRegex((bundle / "log.md").read_text(), r"(?m)^## \d{4}-\d{2}-\d{2}$")
        rc, out = validate_json(bundle)
        self.assertEqual((rc, out["errors"], out["warnings"]), (0, [], []))

    def test_legacy_v01_bundle_validates_with_deprecation_warnings_only(self):
        root = self.tmp / "legacy"
        write(root / "index.md", '---\nokf_version: "0.1"\ntitle: "Legacy"\nupdated: 2026-01-01\n---\n\n# Legacy\n\n- [01](./01-goals/index.md)\n')
        write(root / "log.md", "# Change log\n\n2026-01-01 — Initial bundle scaffold\n")
        write(root / "01-goals" / "index.md", "# 01. Goals\n\n- [goals](./goals.md) — why\n")
        write(root / "01-goals" / "goals.md", "---\ntype: explanation\narc42_section: 1\nsummary: 'Why.'\nupdated: 2026-01-01\nlinks: []\n---\n\n# Goals\n")
        rc, out = validate_json(root)
        self.assertEqual(rc, 0, out["errors"])
        self.assertEqual(codes(out["warnings"]) - AGEING, LEGACY_CODES)

    def test_malformed_v02_fields_are_errors(self):
        extra = (
            "verified:\n  - by: human:jane.doe\n"
            "status: finished\n"
            "stale_after: soon\n"
            "sources:\n  - title: Confluence page without a resource\n"
        )
        bundle = v02_bundle(self.tmp / "b", v02_concept(extra).replace("  at: 2026-10-01T09:00:00Z\n", ""))
        rc, out = validate_json(bundle)
        self.assertEqual(rc, 1)
        self.assertEqual(
            {"INVALID_GENERATED", "INVALID_VERIFIED", "INVALID_STATUS", "INVALID_STALE_AFTER", "INVALID_SOURCES"}
            & codes(out["errors"]),
            {"INVALID_GENERATED", "INVALID_VERIFIED", "INVALID_STATUS", "INVALID_STALE_AFTER", "INVALID_SOURCES"},
            out["errors"],
        )

    def test_adr_status_uses_the_madr_vocabulary(self):
        bundle = v02_bundle(self.tmp / "b", v02_concept())
        decisions = bundle / "09-decisions"
        write(decisions / "index.md", "# 09. Decisions\n\n- [a](./adr-0001-a.md)\n- [b](./adr-0002-b.md)\n- [c](./adr-0003-c.md)\n")
        write(decisions / "adr-0001-a.md", adr_concept("accepted"))
        write(decisions / "adr-0002-b.md", adr_concept("superseded by ADR-0003"))
        write(decisions / "adr-0003-c.md", adr_concept("proposed"))
        rc, out = validate_json(bundle)
        self.assertEqual((rc, out["errors"]), (0, []))
        self.assertNotIn("ADR_NOT_TYPED", codes(out["warnings"]))
        write(decisions / "adr-0001-a.md", adr_concept("stable"))
        write(decisions / "adr-0002-b.md", adr_concept("superseded"))
        _, out = validate_json(bundle)
        status = sorted(m for m in out["errors"] if m.startswith("INVALID_STATUS"))
        self.assertEqual(len(status), 2, out["errors"])
        self.assertIn("MADR status", status[0])
        self.assertIn("use 'superseded by ADR-NNNN'", status[1])

    def test_madr_status_on_a_non_adr_points_to_type_adr(self):
        bundle = v02_bundle(self.tmp / "b", v02_concept())
        write(bundle / "01-goals" / "decision.md", v02_concept("status: accepted\n"))
        _, out = validate_json(bundle)
        status = [m for m in out["errors"] if m.startswith("INVALID_STATUS")]
        self.assertEqual(len(status), 1, out["errors"])
        self.assertIn("set type: adr", status[0])
        self.assertIn("if it's a template, move it out of the bundle", status[0])

    def test_adr_type_is_valid_and_belongs_in_the_decisions_folder(self):
        bundle = v02_bundle(self.tmp / "b", v02_concept())
        write(bundle / "01-goals" / "index.md", "# 01. Goals\n\n- [goals](./goals.md)\n- [x](./misplaced.md)\n- [y](./adr-0009-y.md)\n")
        write(bundle / "01-goals" / "misplaced.md", adr_concept("accepted"))
        write(bundle / "01-goals" / "adr-0009-y.md", v02_concept())
        rc, out = validate_json(bundle)
        self.assertEqual((rc, out["errors"]), (0, []))
        self.assertTrue({"ADR_MISPLACED", "ADR_NOT_TYPED"} <= codes(out["warnings"]), out["warnings"])

    def test_runbook_is_not_a_bundle_type(self):
        bundle = v02_bundle(self.tmp / "b", v02_concept())
        write(bundle / "01-goals" / "index.md", "# 01. Goals\n\n- [goals](./goals.md)\n- [r](./restart.md)\n")
        write(bundle / "01-goals" / "restart.md", v02_concept().replace("type: explanation", "type: runbook"))
        _, out = validate_json(bundle)
        self.assertIn("INVALID_TYPE", codes(out["errors"]))

    def test_invalid_yaml_frontmatter_is_an_error_with_either_parser(self):
        bundle = v02_bundle(self.tmp / "b", v02_concept())
        write(bundle / "01-goals" / "bad.md", "---\ntype: reference\ndescription: 'Bob's actors.'\n---\n\n# Bad\n")
        write(bundle / "01-goals" / "ok.md", "---\ntype: reference\ndescription: 'It''s fine.'\n---\n\n# Ok\n")
        for parser in ("default", "builtin"):
            with self.subTest(parser=parser):
                env = {**os.environ, "DOCS_YAML": parser}
                proc = subprocess.run(
                    [sys.executable, str(SCRIPTS / "validate.py"), str(bundle), "--json"],
                    capture_output=True, text=True, env=env,
                )
                errors = json.loads(proc.stdout)["errors"]
                self.assertEqual([m.split(" —")[0] for m in errors], ["INVALID_FRONTMATTER: 01-goals/bad.md"], errors)

    def test_well_formed_v02_fields_pass(self):
        extra = (
            "verified:\n  - by: human:jane.doe\n    at: 2026-10-02T10:00:00Z\n"
            "status: stable\n"
            "stale_after: 2099-01-01T00:00:00Z\n"
            "sources:\n  - id: wiki\n    resource: https://confluence.example.com/x\n    title: Old page\n"
            "tags: [goals, q42]\n"
        )
        rc, out = validate_json(v02_bundle(self.tmp / "b", v02_concept(extra)))
        self.assertEqual((rc, out["errors"], out["warnings"]), (0, [], []))

    def test_flow_mapping_generated_is_accepted(self):
        concept = v02_concept().replace(
            "generated:\n  by: claude-code/claude-opus-5-5\n  at: 2026-10-01T09:00:00Z\n",
            "generated: { by: claude-code/claude-opus-5-5, at: 2026-10-01T09:00:00Z }\n",
        )
        rc, out = validate_json(v02_bundle(self.tmp / "b", concept))
        self.assertEqual((rc, out["errors"], out["warnings"]), (0, [], []))

    def test_past_stale_after_is_stale(self):
        rc, out = validate_json(v02_bundle(self.tmp / "b", v02_concept("stale_after: 2026-01-01T00:00:00Z\n")))
        self.assertEqual(rc, 0)
        self.assertIn("STALE", codes(out["warnings"]))

    def test_section_index_with_frontmatter_warns(self):
        bundle = v02_bundle(self.tmp / "b", v02_concept())
        write(bundle / "01-goals" / "index.md", "---\ntitle: Goals\n---\n\n# 01. Goals\n\n- [goals](./goals.md)\n")
        _, out = validate_json(bundle)
        self.assertIn("INDEX_HAS_FRONTMATTER", codes(out["warnings"]))

    def test_root_relative_links_resolve_from_bundle_root(self):
        ok = v02_concept(body="# Goals\n\n[index](/01-goals/index.md)\n")
        rc, out = validate_json(v02_bundle(self.tmp / "ok", ok))
        self.assertEqual(rc, 0, out["errors"])
        broken = v02_concept(body="# Goals\n\n[gone](/02-constraints/missing.md)\n")
        rc, out = validate_json(v02_bundle(self.tmp / "broken", broken))
        self.assertIn("BROKEN_LINK", codes(out["errors"]))


class ReferenceContentTest(TempDirTestCase):
    """Templates and references must produce content the lint can check and diagrams that render."""

    def test_lint_rule4_fires_on_an_adr_written_from_the_template(self):
        adr = (TEMPLATES / "arc42-09-adr.md").read_text(encoding="utf-8").replace("ADR-NNNN", "ADR-0001")
        adr, n = re.subn(r"(?m)^\*\*Risks created:\*\*.*$", "**Risks created:** RISK-01", adr)
        self.assertEqual(n, 1, "ADR template needs exactly one '**Risks created:**' line")
        bundle = self.tmp / "b"
        write(bundle / "09-decisions" / "adr-0001-use-grpc.md", adr)
        write(bundle / "11-risks" / "risks-and-tech-debt.md",
              "---\ntype: explanation\n---\n\n# Risks\n\n| ID | Risk |\n| --- | --- |\n| RISK-02 | Other |\n")
        proc = run("arc42-lint.py", str(bundle))
        self.assertEqual(proc.returncode, 1, proc.stdout + proc.stderr)
        self.assertIn("RISK-01", proc.stdout)

    def test_lint_rule3_requires_a_scenario_for_every_section1_goal(self):
        bundle = self.tmp / "b"
        write(bundle / "01-goals" / "introduction-and-goals.md",
              "---\ntype: explanation\n---\n\n# Goals\n\n| Priority | Q42 tag | Goal |\n| --- | --- | --- |\n"
              "| 1 | #reliable | up |\n| 2 | #secure | safe |\n")
        quality = ("---\ntype: reference\n---\n\n# Quality\n\n### QS-01: Failover\n\n**Quality property:** #reliable\n\n"
                   "### QS-02: Onboarding\n\n**Quality property:** #usable\n")
        write(bundle / "10-quality" / "quality-scenarios.md", quality)
        proc = run("arc42-lint.py", str(bundle))
        self.assertEqual(proc.returncode, 1, proc.stdout)
        self.assertIn("#secure", proc.stdout)
        self.assertNotIn("#usable", proc.stdout)  # extra §10 tags are lesser requirements, not errors
        write(bundle / "10-quality" / "quality-scenarios.md",
              quality + "\n### QS-03: Auth\n\n**Quality property:** #secure\n")
        self.assertEqual(run("arc42-lint.py", str(bundle)).returncode, 0)

    def test_diagram_fences_contain_no_html_comments(self):
        files = [*sorted((SKILL_DIR / "references" / "architecture").rglob("*.md")), *sorted(TEMPLATES.glob("*.md"))]
        offenders = []
        for f in files:
            for m in re.finditer(r"```(mermaid|plantuml)\n(.*?)```", f.read_text(encoding="utf-8"), re.DOTALL):
                if "<!--" in m.group(2):
                    offenders.append(f"{f.relative_to(SKILL_DIR)}: {m.group(1)} block at offset {m.start()}")
        self.assertEqual(offenders, [])

    def test_templates_use_the_lint_id_schemes(self):
        expectations = {
            "arc42-01-goals.md": r"\|\s*Q42 tag\s*\|",
            "arc42-03-context.md": r"\bIF-01\b",
            "arc42-10-quality.md": r"\bQS-01\b",
            "arc42-11-risks.md": r"\bRISK-01\b",
            "arc42-09-adr.md": r"(?m)^status:",
        }
        missing = [
            f"{name}: {pattern}" for name, pattern in expectations.items()
            if not re.search(pattern, (TEMPLATES / name).read_text(encoding="utf-8"))
        ]
        self.assertEqual(missing, [])


STUB_RENDERER = """#!{python}
# Test stand-in for a diagram renderer: fails on BROKEN input, otherwise writes a PNG.
import sys
from pathlib import Path
args = sys.argv[1:]
src = Path(args[args.index("-i") + 1] if "-i" in args else args[-1])
out = Path(args[args.index("-o") + 1])
if out.is_dir():
    out = out / (src.name.split(".")[0] + ".png")
if "BROKEN" in src.read_text():
    sys.stderr.write("Parse error on line 2\\n")
    sys.exit(1)
out.parent.mkdir(parents=True, exist_ok=True)
out.write_bytes(b"\\x89PNG\\r\\n\\x1a\\n")
"""

VALID_MERMAID = "```mermaid\nflowchart LR\n  accTitle: Payment flow\n  accDescr: Shop calls the gateway.\n  A --> B\n```\n"
BROKEN_MERMAID = "```mermaid\nflowchart LR\n  accTitle: Broken\n  BROKEN -->\n```\n"


class ScriptCompatibilityTest(unittest.TestCase):
    """The scripts run on Python 3.9 (macOS's system python3), where `X | None` annotations need the future import."""

    def test_union_annotations_are_postponed(self):
        for script in sorted(SCRIPTS.glob("*.py")):
            text = script.read_text(encoding="utf-8")
            if re.search(r"\w \| None", text):
                self.assertIn("from __future__ import annotations", text, script.name)


class DiagramCheckTest(TempDirTestCase):
    """diagram-check.py renders what it can, fails on render errors, and only warns about missing renderers."""

    def make_bundle(self, *bodies: str) -> Path:
        bundle = self.tmp / "b"
        bootstrap(bundle)
        with (bundle / "03-context" / "context-and-scope.md").open("a") as f:
            for body in bodies:
                f.write("\n" + body)
        return bundle

    def stub_path(self, *names: str) -> str:
        bin_dir = self.tmp / "bin"
        bin_dir.mkdir(exist_ok=True)
        for name in names:
            stub = bin_dir / name
            stub.write_text(STUB_RENDERER.format(python=sys.executable))
            stub.chmod(0o755)
        return str(bin_dir)

    def check(self, bundle: Path, path_env: str, *extra: str) -> tuple[int, dict]:
        proc = subprocess.run(
            [sys.executable, str(SCRIPTS / "diagram-check.py"), str(bundle), "--json", *extra],
            capture_output=True, text=True, env={"PATH": path_env},
        )
        self.assertNotEqual(proc.stdout.strip(), "", proc.stderr)
        return proc.returncode, json.loads(proc.stdout)

    def test_broken_block_fails_when_the_renderer_is_present(self):
        bundle = self.make_bundle(VALID_MERMAID, BROKEN_MERMAID)
        rc, out = self.check(bundle, self.stub_path("mmdc"))
        self.assertEqual(rc, 1, out)
        failed = [m for m in out["errors"] if m.startswith("DIAGRAM_RENDER_FAILED")]
        self.assertEqual(len(failed), 1, out["errors"])
        self.assertRegex(failed[0], r"03-context/context-and-scope\.md:\d+")
        self.assertIn("Parse error", failed[0])

    def test_valid_block_renders_into_a_dot_directory(self):
        bundle = self.make_bundle(VALID_MERMAID)
        rc, out = self.check(bundle, self.stub_path("mmdc"))
        self.assertEqual(rc, 0, out)
        self.assertIn("DIAGRAM_RENDERED", codes(out["info"]))
        self.assertTrue(list((bundle / ".renders").rglob("*.png")))
        rc, report = validate_json(bundle)
        self.assertEqual((rc, report["errors"], report["warnings"]), (0, [], []))

    def test_missing_renderer_warns_once_and_passes(self):
        bundle = self.make_bundle(VALID_MERMAID, BROKEN_MERMAID)
        rc, out = self.check(bundle, self.stub_path())
        self.assertEqual(rc, 0, out)
        missing = [m for m in out["warnings"] if m.startswith("RENDERER_MISSING")]
        self.assertEqual(len(missing), 1, out["warnings"])
        self.assertIn("mmdc", missing[0])
        self.assertIn("Install: npm install -g @mermaid-js/mermaid-cli", missing[0])
        # VALIDATE is read-only: with nothing rendered, the check must leave no files behind.
        self.assertFalse((bundle / ".renders").exists())

    def test_strict_mode_fails_on_a_missing_renderer(self):
        rc, out = self.check(self.make_bundle(VALID_MERMAID), self.stub_path(), "--strict")
        self.assertEqual(rc, 1)
        self.assertIn("RENDERER_MISSING", codes(out["errors"]))

    def test_broken_drawio_file_fails(self):
        bundle = self.make_bundle("![Context overview](./context.drawio.svg)\n")
        (bundle / "03-context" / "context.drawio.svg").write_text("<svg>BROKEN</svg>")
        rc, out = self.check(bundle, self.stub_path("drawio"))
        self.assertEqual(rc, 1, out)
        self.assertTrue(any("context.drawio.svg" in m for m in out["errors"]), out["errors"])

    def test_stale_png_does_not_hide_a_renderer_that_writes_nothing(self):
        bundle = self.make_bundle(VALID_MERMAID)
        self.assertEqual(self.check(bundle, self.stub_path("mmdc"))[0], 0)
        bin_dir = self.tmp / "silent"
        bin_dir.mkdir()
        (bin_dir / "mmdc").write_text("#!/bin/sh\nexit 0\n")
        (bin_dir / "mmdc").chmod(0o755)
        rc, out = self.check(bundle, str(bin_dir))
        self.assertEqual(rc, 1, out)
        self.assertIn("DIAGRAM_RENDER_FAILED", codes(out["errors"]))

    def test_dotted_file_names_render_to_distinct_pngs(self):
        bundle = self.make_bundle()
        ctx = bundle / "03-context"
        for name in ("v1.0.mmd", "v1.1.mmd", "foo.drawio", "foo.drawio.svg"):
            (ctx / name).write_text("flowchart LR\n  A --> B\n")
        rc, out = self.check(bundle, self.stub_path("mmdc", "drawio"))
        self.assertEqual(rc, 0, out)
        rendered = sorted(p.name for p in (bundle / ".renders" / "03-context").glob("*.png"))
        self.assertEqual(rendered, ["foo.drawio.png", "foo.drawio.svg.png", "v1.0.mmd.png", "v1.1.mmd.png"])

    def test_both_scripts_recognise_the_same_commonmark_fences(self):
        doc = "\n".join([
            "# Fences",                          # 1
            "```mermaid",                        # 2  found
            "flowchart LR",
            "```",
            "```mermaid {title=x}",              # 5  found: attributes are ignored
            "flowchart LR",
            "```",
            "~~~Mermaid",                        # 8  found: tilde fence, kind is case-insensitive
            "flowchart LR",
            "~~~",
            "````plantuml",                      # 11 found: a shorter inner fence does not close it
            "@startuml",
            "```",
            "@enduml",
            "````",
            "````md",                            # 16 a mermaid example inside another fence is not a diagram
            "```mermaid",
            "flowchart LR",
            "```",
            "````",
            "",
            "1. Step",
            "    ```mermaid",                    # 23 found: inside a list item
            "    flowchart LR",
            "    ```",
            "",
            "> ```plantuml",                     # 27 found: inside a blockquote
            "> @startuml",
            "> ```",
            "",
        ])
        expected = {2, 5, 8, 11, 23, 27}
        bundle = self.tmp / "fences"
        write(bundle / "doc.md", doc)
        _, out = self.check(bundle, self.stub_path("mmdc", "plantuml"))
        rendered = {int(m.split("doc.md:")[1].split()[0]) for m in out["info"] if "doc.md:" in m}
        _, report = validate_json(bundle)
        untitled = {int(m.split("doc.md:")[1].split()[0]) for m in report["warnings"]
                    if m.startswith("DIAGRAM_NO_TITLE")}
        self.assertEqual((rendered, untitled), (expected, expected))

    def test_fence_rule_is_the_same_code_in_both_scripts(self):
        def rule(script: str) -> str:
            text = (SCRIPTS / script).read_text(encoding="utf-8")
            return re.search(r"(?ms)^# Fenced code blocks:.*?^    return blocks$", text).group(0)

        self.assertEqual(rule("diagram-check.py"), rule("validate.py"))

    def test_bundle_without_diagrams_has_no_findings(self):
        bundle = v02_bundle(self.tmp / "b", v02_concept())
        rc, out = self.check(bundle, self.stub_path())
        self.assertEqual((rc, out["errors"], out["warnings"]), (0, [], []))

    def test_missing_path_exits_2(self):
        proc = run("diagram-check.py", str(self.tmp / "nope"))
        self.assertEqual(proc.returncode, 2)

    def test_validate_warns_on_untitled_diagram_and_missing_alt_text(self):
        bundle = self.make_bundle("```mermaid\nflowchart LR\n  A --> B\n```\n", "![](./overview.png)\n")
        (bundle / "03-context" / "overview.png").write_bytes(b"\x89PNG")
        rc, out = validate_json(bundle)
        self.assertEqual(rc, 0, out["errors"])
        self.assertTrue({"DIAGRAM_NO_TITLE", "IMAGE_NO_ALT"} <= codes(out["warnings"]), out["warnings"])

    def test_shipped_diagram_scaffolds_have_accessible_titles(self):
        files = [*sorted((SKILL_DIR / "references" / "architecture").rglob("*.md")), *sorted(TEMPLATES.glob("*.md"))]
        offenders = [
            f"{f.relative_to(SKILL_DIR)}: block at line {f.read_text(encoding='utf-8')[:m.start()].count(chr(10)) + 1}"
            for f in files
            for m in re.finditer(r"```(?:mermaid|plantuml)\n(.*?)```", f.read_text(encoding="utf-8"), re.DOTALL)
            if not re.search(r"(?mi)^\s*(accTitle:|title:?\s)", m.group(1))
        ]
        self.assertEqual(offenders, [])


class ContractTest(unittest.TestCase):
    """The section-interview output contracts must use the file names bootstrap scaffolds, or stubs get duplicated."""

    def test_draft_output_contracts_use_bootstrap_file_names(self):
        sys.path.insert(0, str(SCRIPTS))
        try:
            import bootstrap as bootstrap_module  # noqa: PLC0415
        finally:
            sys.path.pop(0)
        scaffolded = {
            f"{slug}/{filename}"
            for slug, _, _, concepts in bootstrap_module.SECTIONS
            for filename, _, _ in concepts
        }
        interviews = (SKILL_DIR / "references" / "architecture" / "section-interviews.md").read_text(encoding="utf-8")
        drafted = set(re.findall(r"`(\d\d-[a-z-]+/[a-z0-9-]+\.md)`", interviews))
        self.assertTrue(drafted, "no output paths found in references/architecture/section-interviews.md")
        self.assertEqual(drafted - scaffolded, set(), "the interviews draft files bootstrap doesn't know")


class TemplateConsistencyTest(unittest.TestCase):
    def test_templates_have_single_language_headings(self):
        offenders = [
            f"{p.name}: {line}"
            for p in sorted(TEMPLATES.glob("arc42-*.md"))
            for line in p.read_text(encoding="utf-8").splitlines()
            if (line.startswith("#") or line.startswith("title:")) and " / " in line
        ]
        self.assertEqual(offenders, [])

    def test_template_frontmatter_follows_the_contract(self):
        for path in sorted(TEMPLATES.glob("*.md")):
            fm = path.read_text(encoding="utf-8").split("---\n", 2)[1]
            for key in ("type:", "title:", "description:", "tags:", "status:", "generated:"):
                self.assertRegex(fm, rf"(?m)^{key}", f"{path.name} lacks {key}")
        adr = (TEMPLATES / "arc42-09-adr.md").read_text(encoding="utf-8")
        self.assertRegex(adr, r"(?m)^type: adr$")


if __name__ == "__main__":
    unittest.main()
