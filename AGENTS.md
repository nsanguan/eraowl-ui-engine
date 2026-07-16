# AGENTS.md — AI Agent Instructions for EraOwl UI Engine

This document provides instructions for AI agents (Claude Code, LangGraph, etc.) working on the `eraowl-ui-engine` project.

---

## Project Overview

EraOwl UI Engine is a Low-code Render Engine with two outputs:
- **Designer App** — React SPA for visual UI design
- **Library Package** — Embeddable render engine (`eraowl-ui-engine` npm package)

**Single Source of Truth:** `Implement-V1.0.md` — all implementation details, schemas, security rules, and roadmaps are defined there. Always reference it before making changes.

---

## Critical Rules

### 1. Security First — Never Violate These

- **No raw SQL** — All database queries go through SQLModel/SQLAlchemy ORM
- **No eval/exec** — Never execute dynamic code from user input
- **ResolverRegistry only** — Data fetching uses whitelisted resolver functions, never arbitrary queries
- **Auth/RBAC on all endpoints** — Every API endpoint requires authentication
- **Codegen sandbox** — File writes limited to `allowed_write_globs` per target
- **Schema validation** — All layout_json and theme JSON validated against JSON Schema before persisting

### 2. Architecture Layers — Respect the Boundaries

```
L1 Presentation → L2 API → L3 Domain → L4 Resolver → L5 Infrastructure
```

- Frontend (L1) never connects directly to PostgreSQL (L5)
- Domain Layer (L3) never bypasses Resolver Layer (L4) to run SQL
- Request flow is always top-down (L1→L5), never cross-layer

### 3. Dual Build Target — Always Maintain Both

- `vite.config.ts` — Designer build (`dist/designer/`)
- `vite.lib.config.ts` — Library build (`dist/eraowl-ui-engine/`)
- Library never bundles React, Zustand, or TanStack Query (peer dependencies)
- `package.json` exports map must stay in sync with both builds

### 4. Theme System — Follow Token Cascade

```
EUT Base Tokens → Theme Style Delta → Component styleRef → Template Options
```

- Components never use hardcoded colors/fonts — always CSS variables
- `templateOptions` are declarative enums/booleans only — no inline CSS
- `styleRef` at component level overrides page-level theme

---

## Working Conventions

### Before Making Changes

1. Read `Implement-V1.0.md` — Find the relevant section for your change
2. Check existing patterns — Look at neighboring files for conventions
3. Understand the layer — Which layer (L1-L5) does your change affect?

### File Naming

| Location | Convention | Example |
|----------|-----------|---------|
| `app/core/` | lowercase, singular | `config.py`, `db.py`, `security.py` |
| `app/modules/` | domain-driven folders | `ui_designer/`, `codegen/` |
| `src/render-engine/` | camelCase for hooks, PascalCase for components | `useFormState.ts`, `UIRenderer.tsx` |
| `src/themes/eut/` | kebab-case for JSON | `tokens.base.json`, `vita-red.json` |
| DB migrations | `YYYYMMDDHHMMSS_description.sql` | `20260101000000_init_ui_designer_schema.sql` |

### Code Style

**Python (Backend):**
- Ruff for linting: `ruff check app/`
- Mypy for types: `mypy app/`
- Line length: 120
- Type hints required on all public functions

**TypeScript (Frontend):**
- Strict mode enabled
- `noUnusedLocals` and `noUnusedParameters` enforced
- Prefer `interface` over `type` for object shapes
- Use `@/*` path alias for imports from `src/`

### Testing

**Backend:**
```bash
cd eraowl-ui-engine-api
source .venv/bin/activate
pytest tests/ -v
```

**Frontend:**
```bash
cd eraowl-ui-engine-web
npm run test         # Unit tests (Vitest)
npm run test:e2e     # E2E tests (Playwright)
npm run typecheck    # Type checking
```

### Database Migrations

```bash
cd eraowl-ui-engine-api
# Use sync driver for dbmate (not asyncpg)
DATABASE_URL="postgres://eraowlui_admin:EraOwl2026@202.71.1.13:5435/eraowlui?sslmode=disable" /tmp/dbmate up
```

Migration file format:
```sql
-- migrate:up
CREATE TABLE ...;

-- migrate:down
DROP TABLE ...;
```

---

## Key Files Reference

### Backend (`eraowl-ui-engine-api/`)

| File | Purpose |
|------|---------|
| `app/main.py` | FastAPI app entry point |
| `app/core/config.py` | Settings (pydantic-settings, reads `.env`) |
| `app/core/db.py` | Async SQLAlchemy engine + session |
| `app/core/security.py` | JWT decode + RBAC dependency |
| `app/modules/ui_designer/models.py` | SQLModel table definitions |
| `app/modules/ui_designer/service.py` | Business logic |
| `app/modules/ui_designer/router.py` | API endpoints |
| `app/modules/ui_designer/resolvers/registry.py` | Whitelisted data resolvers |
| `app/modules/ui_designer/codegen/` | Code generation pipeline |
| `app/schema_validation/validator.py` | JSON Schema validation |
| `db/migrations/` | dbmate SQL migrations |

### Frontend (`eraowl-ui-engine-web/`)

| File | Purpose |
|------|---------|
| `src/render-engine/UIRenderer.tsx` | Main interpreter — JSON to React |
| `src/render-engine/index.ts` | Library public API surface |
| `src/render-engine/components/` | Built-in components (Region, Lov, LovSelect) |
| `src/render-engine/hooks/` | Form state, cascade query, theme hooks |
| `src/render-engine/theme/` | Token resolver, RuntimeThemeProvider |
| `src/render-engine/registry/` | Component registry |
| `src/render-engine/validation/` | Form validation |
| `src/store/` | Zustand stores (render, codegen, UI) |
| `src/designer/` | Designer app (canvas, inspector, theme roller) |
| `src/themes/eut/` | Built-in EUT theme |
| `vite.config.ts` | Designer build config |
| `vite.lib.config.ts` | Library build config |

---

## Common Tasks

### Adding a New Component

1. Create component in `src/render-engine/components/YourComponent.tsx`
2. Register in `src/render-engine/registry/componentRegistry.ts`
3. Add to `src/render-engine/types.ts` Component type union
4. Create JSON Schema entry in `app/schema_validation/layout_schema_v1.json`
5. Add tests in `src/render-engine/__tests__/`

### Adding a New Resolver

1. Create resolver in `app/modules/ui_designer/resolvers/builtin/`
2. Register in `app/modules/ui_designer/resolvers/registry.py`
3. Add input/output schema validation
4. Test with `pytest tests/test_resolvers.py`

### Adding a Database Migration

1. Create `db/migrations/YYYYMMDDHHMMSS_description.sql`
2. Include `-- migrate:up` and `-- migrate:down` blocks
3. Test with `dbmate up` then `dbmate rollback`
4. Never modify applied migrations — create new ones

### Modifying Theme Tokens

1. Edit `src/themes/eut/tokens.base.json` for base tokens
2. Edit style presets in `src/themes/eut/styles/*.json`
3. Run `npm run build:theme-css` to regenerate CSS
4. Update `app/schema_validation/theme_schema_v1.json` if schema changes

---

## Environment Variables

See `.env.example` in `eraowl-ui-engine-api/` for all variables.

Key variables:
- `DATABASE_URL` — PostgreSQL connection (asyncpg driver for app, postgres for dbmate)
- `REDIS_URL` — Redis connection
- `JWT_SECRET_KEY` — JWT signing key
- `TARGET_PROJECT_ROOT` — Path to target project for codegen

---

## Implementation Plan

The complete implementation plan is in `Implement-V1.0.md`. Sections:

| Section | Topic |
|---------|-------|
| §1 | Executive Summary |
| §2 | Architecture (Render Engine, Form State, Cascading LOV, Universal Theme) |
| §3 | Project Structure (Dual Build, Library API) |
| §4 | Tech Stack |
| §5 | Database & JSON Schema |
| §6 | Security Contract |
| §7 | Roadmap |
| §8 | Codegen Target Adapter |
| §9 | AI Agent Rules & Prompt Templates |
| §10 | Testing Strategy |
| §11 | Open Decisions |
| §12 | Refinement Changelog |
