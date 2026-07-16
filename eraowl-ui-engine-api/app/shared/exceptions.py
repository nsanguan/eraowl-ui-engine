"""Custom application exceptions."""

from __future__ import annotations


class AppError(Exception):
    """Base application error."""

    status_code: int = 500
    detail: str = "Internal server error"

    def __init__(self, detail: str | None = None) -> None:
        if detail:
            self.detail = detail
        super().__init__(self.detail)


class NotFoundError(AppError):
    status_code = 404
    detail = "Resource not found"


class ConflictError(AppError):
    status_code = 409
    detail = "Resource conflict"


class ValidationError(AppError):
    status_code = 422
    detail = "Validation failed"


class PermissionDeniedError(AppError):
    status_code = 403
    detail = "Permission denied"


class CodegenError(AppError):
    status_code = 500
    detail = "Code generation failed"


class AIOrchestrationError(AppError):
    status_code = 502
    detail = "AI orchestration failed"
