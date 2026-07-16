from __future__ import annotations

from pathlib import Path

from pydantic import BaseModel, field_validator


class CodegenTargetConfig(BaseModel):
    project_root: str
    target_subpath: str
    allowed_write_globs: list[str] = [
        "apps/web/src/pages/generated/**",
        "apps/web/src/components/generated/**",
    ]
    dry_run: bool = True

    @field_validator("project_root")
    @classmethod
    def must_be_absolute_and_exist(cls, v: str) -> str:
        p = Path(v)
        if not p.is_absolute():
            raise ValueError("project_root must be absolute path")
        return v
