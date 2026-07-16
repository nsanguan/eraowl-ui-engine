# EraOwl UI Engine

[![CI](https://github.com/eraowl/eraowl-ui-engine/actions/workflows/ci.yml/badge.svg)](https://github.com/eraowl/eraowl-ui-engine/actions/workflows/ci.yml)
[![Deploy](https://github.com/eraowl/eraowl-ui-engine/actions/workflows/deploy.yml/badge.svg)](https://github.com/eraowl/eraowl-ui-engine/actions/workflows/deploy.yml)

Low-code Render Engine — Plug-and-Play UI service for the EraOwl ecosystem.

## Overview

EraOwl UI Engine is a standalone service that renders UI from declarative JSON layouts and generates production-ready React code into target projects (AXON WMS, EraOwl-OPS, etc.) via a secure codegen pipeline.

**Two deployment modes:**

| Mode | What it does | Output |
|------|-------------|--------|
| **Designer Mode** (Target A) | Visual drag-and-drop editor | `dist/designer/` — standalone SPA |
| **Library Mode** (Target B) | Embeddable render package | `dist/eraowl-ui-engine/` — ESM + UMD |

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Designer App (React SPA)    │  Runtime Renderer (embeddable) │
├──────────────────────────────┴────────────────────────────────┤
│  API Layer (FastAPI + Auth/RBAC)                               │
├───────────────────────────────────────────────────────────────┤
│  Domain Layer (Services + Validation)                         │
├───────────────────────────────────────────────────────────────┤
│  Resolver Layer (whitelisted queries only — no raw SQL)        │
├───────────────────────────────────────────────────────────────┤
│  Infrastructure (PostgreSQL, Redis, OpenTelemetry)            │
└───────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.12+, FastAPI, SQLModel, asyncpg |
| Database | PostgreSQL 18, dbmate migrations |
| Cache | Redis 7 |
| Frontend | React 19, Vite 6, Tailwind CSS 4 |
| State | Zustand 5, TanStack Query v5 |
| DnD | @dnd-kit |
| Editor | Monaco Editor |
| Validation | ajv (JSON Schema draft-2020-12) |
| Testing | Vitest, Playwright, Pytest |
| Observability | OpenTelemetry |

## Repository Structure

```
eraowl-ui-engine/
├── Implement-V1.0.md          # Single Source of Truth (implementation plan)
├── README.md                  # This file
├── AGENTS.md                  # AI agent instructions
├── GLOBAL_DESIGN.md           # Global design document
│
├── eraowl-ui-engine-api/      # Backend (Python/FastAPI)
│   ├── app/
│   │   ├── core/              # Config, DB, Security, Telemetry
│   │   ├── modules/
│   │   │   └── ui_designer/   # Pages, Layouts, Components, Resolvers, Codegen
│   │   ├── schema_validation/ # JSON Schema validators
│   │   └── shared/            # Base CRUD, exceptions
│   ├── db/migrations/         # dbmate SQL migrations
│   ├── tests/                 # Pytest tests
│   ├── pyproject.toml
│   ├── dbmate.yml
│   └── docker-compose.yml
│
└── eraowl-ui-engine-web/      # Frontend (React/Vite)
    ├── src/
    │   ├── render-engine/     # Library: UIRenderer, hooks, components, theme
    │   ├── designer/          # Designer: Canvas, Inspector, Theme Roller
    │   ├── store/             # Zustand stores
    │   ├── api/               # API client
    │   ├── schemas/           # JSON Schema definitions
    │   ├── themes/            # EUT theme (tokens, styles, template options)
    │   ├── pages/             # DesignerPage, PreviewPage
    │   └── styles/            # Generated CSS
    ├── scripts/               # Build scripts
    ├── vite.config.ts         # Designer build
    ├── vite.lib.config.ts     # Library build
    └── package.json
```

## Quick Start

### Backend

```bash
cd eraowl-ui-engine-api

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -e ".[dev]"

# Run migrations (requires external PostgreSQL)
DATABASE_URL="postgres://eraowlui_admin:<DB_PASSWORD>@202.71.1.13:5435/eraowlui?sslmode=disable" /tmp/dbmate up

# Start server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# API docs at http://localhost:8000/docs
```

### Frontend

```bash
cd eraowl-ui-engine-web

npm install
npm run dev          # Start Vite dev server
npm run build        # Build designer + library
npm run typecheck    # Type check
npm run test         # Run unit tests
```

### Docker

```bash
cd eraowl-ui-engine-api
docker-compose up -d   # Starts Redis + API + Codegen Worker
```

## Database

External PostgreSQL at `202.71.1.13:5435`, database `eraowlui`, user `eraowlui_admin`.

Tables (created by dbmate migrations):

| Table | Purpose |
|-------|---------|
| `pages` | Page definitions |
| `page_layouts` | Versioned layout JSON |
| `resolver_catalog` | Whitelisted data resolvers |
| `component_catalog` | Registered UI components |
| `theme_catalog` | Theme definitions |
| `theme_styles` | Style presets per theme |
| `theme_overrides` | Per-component token overrides |
| `codegen_targets` | Target project configurations |
| `codegen_runs` | Code generation run history |

## Key Concepts

### Render Engine

The library package (`eraowl-ui-engine`) that interprets `layout_json` and renders React components at runtime. Supports:
- **Cascading LOV** — parent-child dropdown dependencies via `depends_on`
- **Form State** — validation, touched tracking, submit state machine
- **Universal Theme** — CSS variable injection from design tokens
- **Template Options** — declarative component variants (no CSS writing)

### Codegen Pipeline

Secure code generation into target projects:
1. **Scan** — Read target project structure
2. **Generate** — Produce React component code
3. **Diff** — Show changes before applying
4. **Apply** — Write files within sandbox boundaries

Security: No raw SQL, no eval, ResolverRegistry whitelist only, `allowed_write_globs` sandbox.

### Universal Theme (EUT)

Inspired by Oracle APEX Universal Theme:
- **Theme Catalog** — Collection of themes (EUT is built-in)
- **Theme Styles** — Color/layout presets (vita, vita-red, vita-slate)
- **Theme Roller** — Live CSS variable preview
- **Template Options** — Declarative component variants

## CI/CD Pipeline

### GitHub Actions

**Continuous Integration (`ci.yml`):**
- Runs on push to `main`/`master` and pull requests
- **Backend Tests**: Python 3.12, pytest, ruff linter
- **Frontend Tests**: Node 20, TypeScript typecheck, ESLint, Vitest, build
- **Security Scan**: pip-audit, npm audit

**Deployment (`deploy.yml`):**
- Manual trigger with environment selection (staging/production)
- Builds Docker images and pushes to GitHub Container Registry
- Deploys via SSH to target server
- Automatic rollback on failure

**Dependabot (`dependabot.yml`):**
- Weekly dependency updates (Monday 09:00 WIB)
- Grouped updates to reduce PR noise
- Covers Python, Node.js, GitHub Actions, and Docker

### Required Secrets

Configure these in GitHub repository settings:

| Secret | Description |
|--------|-------------|
| `DEPLOY_HOST` | Server IP/hostname for deployment |
| `DEPLOY_USER` | SSH username for deployment |
| `DEPLOY_SSH_KEY` | SSH private key for deployment |
| `DEPLOY_PATH` | Deployment directory path on server |

### Status Badges

```markdown
[![CI](https://github.com/eraowl/eraowl-ui-engine/actions/workflows/ci.yml/badge.svg)](https://github.com/eraowl/eraowl-ui-engine/actions/workflows/ci.yml)
[![Deploy](https://github.com/eraowl/eraowl-ui-engine/actions/workflows/deploy.yml/badge.svg)](https://github.com/eraowl/eraowl-ui-engine/actions/workflows/deploy.yml)
```

## Implementation Plan

See `Implement-V1.0.md` for the complete implementation plan (13 sections, ~1300 lines).

## License

Proprietary — EraOwl Group Internal Use Only.
