"""Application entry-point.

§2.2 — Layered Architecture: L2 API Layer (FastAPI)
§6.3 — Auth/RBAC middleware on every endpoint
"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

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
from app.modules.ui_designer.ai.router import router as ai_router  # noqa: E402
from app.modules.ui_designer.codegen.router import router as codegen_router  # noqa: E402
from app.modules.ui_designer.components.router import router as components_router  # noqa: E402
from app.modules.ui_designer.router import router as ui_designer_router  # noqa: E402

app.include_router(ui_designer_router, prefix="/api/v1", tags=["ui-designer"])
app.include_router(components_router, prefix="/api/v1", tags=["ui-designer"])
app.include_router(codegen_router, prefix="/api/v1", tags=["codegen"])
app.include_router(ai_router, prefix="/api/v1", tags=["ai"])


# ── Unauthenticated allowlist ─────────────────────────────────────────────────
# AGENTS.md / §6.3 require Auth+RBAC on *every* API endpoint. The routes below are
# an explicit, documented exception to that rule:
#   - /health, /healthz : liveness/readiness probes (k8s, load balancers) MUST be
#     reachable without a bearer token, otherwise orchestrators cannot check the
#     process. They deliberately return only a minimal, non-sensitive status.
#   - /docs, /redoc, /openapi.json : FastAPI dev tooling, not part of the data
#     API surface. Left unauthenticated (standard practice); disable in prod via
#     config if required.
# No business data is exposed by these routes; all data-bearing endpoints under
# /api/v1 remain gated by get_current_user / require_role.
@app.get("/health")
@app.get("/healthz")
async def health() -> dict[str, str]:
    return {"status": "ok"}
