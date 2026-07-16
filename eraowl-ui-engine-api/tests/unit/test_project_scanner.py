"""Tests for ProjectScanner."""

import pytest

from app.modules.ui_designer.codegen.scanner import ProjectScanner


@pytest.fixture
def sample_project(tmp_path):
    """Create a minimal project structure."""
    (tmp_path / "src").mkdir()
    (tmp_path / "src" / "App.tsx").write_text("export default function App() {}")
    (tmp_path / "node_modules").mkdir()
    (tmp_path / "node_modules" / "pkg").mkdir()
    (tmp_path / "node_modules" / "pkg" / "index.js").write_text("// ignored")
    (tmp_path / "README.md").write_text("# Project")
    return tmp_path


def test_scan_finds_source_files(sample_project):
    scanner = ProjectScanner(sample_project)
    manifest = scanner.scan()
    rel_paths = [f.rel_path for f in manifest.files]
    assert "src/App.tsx" in rel_paths
    assert "README.md" in rel_paths
    # node_modules should be ignored
    assert not any("node_modules" in p for p in rel_paths)


def test_find_by_tag(sample_project):
    (sample_project / "src" / "Generated.tsx").write_text(
        "// eraowl-gen:page\nexport const x = 1;\n"
    )
    scanner = ProjectScanner(sample_project)
    manifest = scanner.scan()
    results = scanner.find_by_tag(manifest, "page")
    assert any(f.rel_path == "src/Generated.tsx" for f in results)
