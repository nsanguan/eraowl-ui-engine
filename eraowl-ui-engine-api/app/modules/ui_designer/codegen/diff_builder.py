"""Unified diff builder for codegen output – §8.6."""

from __future__ import annotations

import difflib
from dataclasses import dataclass


@dataclass
class FileDiff:
    path: str
    old_content: str
    new_content: str
    unified_diff: str

    @property
    def has_changes(self) -> bool:
        return self.old_content != self.new_content


class DiffBuilder:
    """Builds unified diffs for files that need updating."""

    @staticmethod
    def build(rel_path: str, old_content: str, new_content: str, n_lines: int = 3) -> FileDiff:
        diff_lines = difflib.unified_diff(
            old_content.splitlines(keepends=True),
            new_content.splitlines(keepends=True),
            fromfile=f"a/{rel_path}",
            tofile=f"b/{rel_path}",
            n=n_lines,
        )
        return FileDiff(
            path=rel_path,
            old_content=old_content,
            new_content=new_content,
            unified_diff="".join(diff_lines),
        )

    @staticmethod
    def build_new(rel_path: str, content: str) -> FileDiff:
        return DiffBuilder.build(rel_path, "", content)

    @staticmethod
    def build_deleted(rel_path: str, content: str) -> FileDiff:
        return DiffBuilder.build(rel_path, content, "")
