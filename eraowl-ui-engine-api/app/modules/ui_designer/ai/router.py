from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.security import require_role
from app.modules.ui_designer.ai.orchestrator import ai_orchestrator

router = APIRouter()


class LayoutGenerateRequest(BaseModel):
    prompt: str


class LayoutGenerateResponse(BaseModel):
    layout: dict


class CodegenSuggestRequest(BaseModel):
    layout: dict
    target_project: str


class CodegenSuggestResponse(BaseModel):
    files: dict[str, str]


@router.post(
    "/ai/generate-layout",
    dependencies=[Depends(require_role("ui_designer.editor", "ui_designer.admin"))],
)
async def generate_layout(request: LayoutGenerateRequest) -> LayoutGenerateResponse:
    layout = await ai_orchestrator.generate_layout(request.prompt)
    return LayoutGenerateResponse(layout=layout)


@router.post(
    "/ai/suggest-codegen",
    dependencies=[Depends(require_role("ui_designer.codegen", "ui_designer.admin"))],
)
async def suggest_codegen(request: CodegenSuggestRequest) -> CodegenSuggestResponse:
    files = await ai_orchestrator.suggest_codegen(request.layout, request.target_project)
    return CodegenSuggestResponse(files=files)
