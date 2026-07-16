from __future__ import annotations

import difflib
from pathlib import Path


class DiffBuilder:
    def __init__(self, project_root: str):
        self.root = Path(project_root)

    def build_diff(self, filepath: str, new_content: str) -> str | None:
        full_path = self.root / filepath
        
        if full_path.exists():
            old_content = full_path.read_text()
            if old_content == new_content:
                return None
            
            diff = difflib.unified_diff(
                old_content.splitlines(keepends=True),
                new_content.splitlines(keepends=True),
                fromfile=f"a/{filepath}",
                tofile=f"b/{filepath}",
            )
            return "".join(diff)
        else:
            return f"+++ new file {filepath}\n" + new_content

    def build_diffs(self, files: dict[str, str]) -> dict[str, str | None]:
        return {fp: self.build_diff(fp, content) for fp, content in files.items()}
