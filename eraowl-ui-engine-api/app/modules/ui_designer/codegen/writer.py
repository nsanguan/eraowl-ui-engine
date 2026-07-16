from __future__ import annotations

import difflib
import fnmatch
import re
from pathlib import Path

_SAFE_ID_RE = re.compile(r"^[A-Za-z0-9_-]+$")
_TRAVERSAL_RE = re.compile(r"(\.\./|\.\./$|\.\.\\|^\.\.)")


def _matches_glob(rel_path: str, pattern: str) -> bool:
    """Check whether ``rel_path`` matches a glob pattern.

    Uses :func:`fnmatch.fnmatch` which supports ``**`` as a recursive
    wildcard in Python >= 3.12.
    """
    return fnmatch.fnmatch(rel_path, pattern)


class SandboxWriter:
    def __init__(self, project_root: str, allowed_globs: list[str]):
        self.root = Path(project_root).resolve()
        self.allowed_globs = allowed_globs

    def is_allowed(self, filepath: str) -> bool:
        # Reject traversal / absolute paths before any glob matching.
        if not filepath or filepath.startswith("/") or _TRAVERSAL_RE.search(filepath):
            return False
        if filepath.startswith("~") or filepath.startswith("\\"):
            return False

        # Normalise separators.
        norm = filepath.replace("\\", "/")
        if any(sep in norm for sep in ("\\", "../", "..\\")):
            return False

        return any(_matches_glob(norm, pat) for pat in self.allowed_globs)

    def _resolve_contained(self, filepath: str) -> Path:
        """Resolve the destination path and verify it stays within root."""
        if filepath.startswith("/") or _TRAVERSAL_RE.search(filepath):
            raise PermissionError(f"Write not allowed: {filepath} (path traversal detected)")
        if not self.is_allowed(filepath):
            raise PermissionError(f"Write not allowed: {filepath} (not in allowed_write_globs)")

        full_path = (self.root / filepath).resolve()

        if full_path == self.root:
            raise PermissionError(f"Write not allowed: {filepath} (cannot target root)")

        if self.root not in full_path.parents:
            raise PermissionError(
                f"Write not allowed: {filepath} (escapes project root {self.root})"
            )

        # Re-verify the resolved relative path still matches the globs.
        rel = full_path.relative_to(self.root).as_posix()
        if not any(_matches_glob(rel, pat) for pat in self.allowed_globs):
            raise PermissionError(f"Write not allowed: {filepath} (resolved path not in allowed_write_globs)")

        return full_path

    def write(self, filepath: str, content: str, dry_run: bool = True) -> str | None:
        full_path = self._resolve_contained(filepath)

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
