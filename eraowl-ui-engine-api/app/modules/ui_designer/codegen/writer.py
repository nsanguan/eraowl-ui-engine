from __future__ import annotations

import difflib
import fnmatch
from pathlib import Path

from app.core.config import settings


class SandboxWriter:
    def __init__(self, project_root: str, allowed_globs: list[str]):
        self.root = Path(project_root)
        self.allowed_globs = allowed_globs

    def is_allowed(self, filepath: str) -> bool:
        return any(fnmatch.fnmatch(filepath, pat) for pat in self.allowed_globs)

    def write(self, filepath: str, content: str, dry_run: bool = True) -> str | None:
        if not self.is_allowed(filepath):
            raise PermissionError(f"Write not allowed: {filepath} (not in allowed_write_globs)")
        
        full_path = self.root / filepath
        
        if dry_run:
            if full_path.exists():
                old = full_path.read_text()
                diff = difflib.unified_diff(
                    old.splitlines(keepends=True),
                    content.splitlines(keepends=True),
                    fromfile=f"a/{filepath}",
                    tofile=f"b/{filepath}",
                )
                return "".join(diff)
            return f"+++ new file {filepath}\n{content}"
        
        full_path.parent.mkdir(parents=True, exist_ok=True)
        full_path.write_text(content)
        return None
