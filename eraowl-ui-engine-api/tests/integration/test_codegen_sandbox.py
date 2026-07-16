"""Tests for the codegen sandbox writer."""

import pytest

from app.modules.ui_designer.codegen.writer import SandboxWriter


@pytest.fixture
def sandbox(tmp_path):
    return SandboxWriter(sandbox_dir=str(tmp_path))


def test_write_file(sandbox):
    path = sandbox.write_file("src/App.tsx", "export default () => null;")
    assert path.exists()
    assert path.read_text() == "export default () => null;"


def test_read_file(sandbox):
    sandbox.write_file("test.txt", "hello")
    assert sandbox.read_file("test.txt") == "hello"


def test_read_missing_file(sandbox):
    assert sandbox.read_file("nope.txt") is None


def test_cleanup(sandbox):
    sandbox.write_file("keep.txt", "data")
    sandbox.cleanup()
    assert not sandbox.sandbox.exists()
