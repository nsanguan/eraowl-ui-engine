"""Tests for the codegen sandbox writer — §6.5."""

import pytest

from app.modules.ui_designer.codegen.writer import SandboxWriter


@pytest.fixture
def writer(tmp_path):
    """Create a SandboxWriter with test project root."""
    (tmp_path / "apps" / "web" / "src" / "pages" / "generated").mkdir(parents=True)
    (tmp_path / "apps" / "web" / "src" / "components" / "generated").mkdir(parents=True)
    return SandboxWriter(
        project_root=str(tmp_path),
        allowed_globs=[
            "apps/web/src/pages/generated/**",
            "apps/web/src/components/generated/**",
        ],
    )


def test_write_allowed_path_dry_run(writer):
    """Writing to allowed path in dry_run returns diff."""
    diff = writer.write("apps/web/src/pages/generated/test.tsx", "export const x = 1;", dry_run=True)
    assert diff is not None
    assert "new file" in diff


def test_write_allowed_path_real(writer):
    """Writing to allowed path creates file."""
    diff = writer.write("apps/web/src/pages/generated/test.tsx", "export const x = 1;", dry_run=False)
    assert diff is None
    from pathlib import Path
    assert (Path(writer.root) / "apps/web/src/pages/generated/test.tsx").exists()


def test_write_disallowed_path_rejected(writer):
    """Writing to disallowed path raises PermissionError."""
    with pytest.raises(PermissionError, match="Write not allowed"):
        writer.write("apps/api/secret.py", "malicious code", dry_run=False)


def test_is_allowed(writer):
    """is_allowed checks against allowed_write_globs."""
    assert writer.is_allowed("apps/web/src/pages/generated/page.tsx")
    assert writer.is_allowed("apps/web/src/components/generated/button.tsx")
    assert not writer.is_allowed("apps/api/main.py")
    assert not writer.is_allowed("db/migrations/001.sql")
