from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.core.security import require_role
from app.modules.ui_designer.ai.orchestrator import ai_orchestrator
from app.schema_validation.validator import validate_layout_json

router = APIRouter()


class LayoutGenerateRequest(BaseModel):
    prompt: str


class LayoutGenerateResponse(BaseModel):
    layout: dict[str, Any]


class CodegenSuggestRequest(BaseModel):
    layout: dict[str, Any]
    target_project: str


class CodegenSuggestResponse(BaseModel):
    files: dict[str, str]


@router.post(
    "/ai/generate-layout",
    dependencies=[Depends(require_role("ui_designer.editor", "ui_designer.admin"))],
)
async def generate_layout(request: LayoutGenerateRequest) -> LayoutGenerateResponse:
    layout = await ai_orchestrator.generate_layout(request.prompt)
    errors = validate_layout_json(layout)
    if errors:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"message": "AI-generated layout failed schema validation", "errors": errors},
        )
    return LayoutGenerateResponse(layout=layout)


@router.post(
    "/ai/suggest-codegen",
    dependencies=[Depends(require_role("ui_designer.codegen", "ui_designer.admin"))],
)
async def suggest_codegen(request: CodegenSuggestRequest) -> CodegenSuggestResponse:
    errors = validate_layout_json(request.layout)
    if errors:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"message": "Layout failed schema validation", "errors": errors},
        )
    files = await ai_orchestrator.suggest_codegen(request.layout, request.target_project)
    return CodegenSuggestResponse(files=files)
