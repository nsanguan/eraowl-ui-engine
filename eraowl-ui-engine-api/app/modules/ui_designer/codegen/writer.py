"""Git-aware sandboxed file writer – §8.7."""

from __future__ import annotations

import shutil
import subprocess
from pathlib import Path

from app.core.config import settings


class SandboxWriter:
    """Writes generated files inside a temporary sandbox, then optionally
    copies changes to the real project via ``git apply``."""

    def __init__(self, sandbox_dir: str | None = None) -> None:
        self.sandbox = Path(sandbox_dir or settings.CODEGEN_SANDBOX_DIR)
        self.sandbox.mkdir(parents=True, exist_ok=True)

    def write_file(self, rel_path: str, content: str) -> Path:
        dest = self.sandbox / rel_path
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(content)
        return dest

    def read_file(self, rel_path: str) -> str | None:
        path = self.sandbox / rel_path
        if path.exists():
            return path.read_text()
        return None

    def apply_diff(self, diff_content: str) -> bool:
        """Apply a unified diff to the sandbox via ``git apply``."""
        proc = subprocess.run(
            ["git", "apply", "--check"],
            input=diff_content,
            capture_output=True,
            text=True,
            cwd=str(self.sandbox),
        )
        if proc.returncode != 0:
            return False
        subprocess.run(
            ["git", "apply"],
            input=diff_content,
            capture_output=True,
            text=True,
            cwd=str(self.sandbox),
        )
        return True

    def copy_to_project(self, project_root: str | Path) -> None:
        """Copy sandbox contents to the real project directory."""
        dest = Path(project_root)
        shutil.copytree(str(self.sandbox), str(dest), dirs_exist_ok=True)

    def cleanup(self) -> None:
        if self.sandbox.exists():
            shutil.rmtree(self.sandbox)
