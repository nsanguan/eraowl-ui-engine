"""Application entry-point.

§2.2 — Layered Architecture: L2 API Layer (FastAPI)
§6.3 — Auth/RBAC middleware on every endpoint
"""

from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    # startup: init DB pools, Redis, telemetry
    from app.modules.ui_designer.resolvers.builtin import register_builtin_resolvers

    register_builtin_resolvers()
    yield
    # shutdown: close pools


app = FastAPI(
    title="eraowl-ui-engine-api",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Routers ─────────────────────────────────────────────────────────────────
from app.modules.ui_designer.router import router as ui_designer_router  # noqa: E402
from app.modules.ui_designer.codegen.router import router as codegen_router  # noqa: E402
from app.modules.ui_designer.ai.router import router as ai_router  # noqa: E402

app.include_router(ui_designer_router, prefix="/api/v1", tags=["ui-designer"])
app.include_router(codegen_router, prefix="/api/v1", tags=["codegen"])
app.include_router(ai_router, prefix="/api/v1", tags=["ai"])


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
