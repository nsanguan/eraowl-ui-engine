"""Project file scanner – §8.4.

Scans a target project directory to discover existing generated files,
track imports, and build a manifest for diff-based updates.
"""

from __future__ import annotations

import fnmatch
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class ScannedFile:
    rel_path: str
    size: int
    hash: str


@dataclass
class ScanManifest:
    project_root: str
    files: list[ScannedFile] = field(default_factory=list)
    ignored_patterns: list[str] = field(default_factory=lambda: ["node_modules", ".git", "dist", "build"])

    def match(self, pattern: str) -> list[ScannedFile]:
        return [f for f in self.files if fnmatch.fnmatch(f.rel_path, pattern)]


class ProjectScanner:
    """Scans a project directory and builds a ScanManifest."""

    def __init__(self, root: str | Path, ignore: list[str] | None = None) -> None:
        self.root = Path(root)
        self.ignore = ignore or ["node_modules/**", ".git/**", "dist/**", "build/**"]

    def _should_ignore(self, rel_path: str) -> bool:
        """Check if a relative path should be ignored."""
        parts = Path(rel_path).parts
        for pattern in self.ignore:
            # Check if any part of the path matches the pattern
            if any(fnmatch.fnmatch(part, pattern.rstrip("/**")) for part in parts):
                return True
            # Also check full path match
            if fnmatch.fnmatch(rel_path, pattern):
                return True
        return False

    def scan(self) -> ScanManifest:
        import hashlib

        manifest = ScanManifest(project_root=str(self.root))
        for path in self.root.rglob("*"):
            if not path.is_file():
                continue
            rel = str(path.relative_to(self.root))
            if self._should_ignore(rel):
                continue
            content = path.read_bytes()
            manifest.files.append(
                ScannedFile(
                    rel_path=rel,
                    size=path.stat().st_size,
                    hash=hashlib.sha256(content).hexdigest(),
                )
            )
        return manifest

    def find_by_tag(self, manifest: ScanManifest, tag: str) -> list[ScannedFile]:
        """Return files whose content contains ``// eraowl-gen:<tag>`` marker."""
        results: list[ScannedFile] = []
        for f in manifest.files:
            full = self.root / f.rel_path
            text = full.read_text(errors="ignore")
            if f"// eraowl-gen:{tag}" in text or f"/* eraowl-gen:{tag}" in text:
                results.append(f)
        return results
