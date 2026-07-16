-- =============================================================================
-- eraowl-ui-engine-api: Full schema from §5.1
-- Includes: pages, layouts, resolvers, components, themes, codegen
-- =============================================================================

-- migrate:up

-- ── Pages ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pages (
    id              TEXT PRIMARY KEY,
    tenant_id       TEXT NOT NULL DEFAULT 'default',
    name            TEXT NOT NULL,
    route           TEXT NOT NULL DEFAULT '/',
    description     TEXT NOT NULL DEFAULT '',
    schema_version  TEXT NOT NULL DEFAULT '1.0.0',
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_pages_route ON pages (route) WHERE deleted_at IS NULL;
CREATE INDEX idx_pages_tenant ON pages (tenant_id);

-- ── Page Layouts ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS page_layouts (
    id              TEXT PRIMARY KEY,
    page_id         TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    version         INTEGER NOT NULL DEFAULT 1,
    layout_json     JSONB NOT NULL,
    is_published    BOOLEAN NOT NULL DEFAULT false,
    created_by      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_layouts_page_id ON page_layouts (page_id);
CREATE UNIQUE INDEX idx_layouts_page_version ON page_layouts (page_id, version);
CREATE INDEX idx_ui_page_layouts_json ON page_layouts USING GIN (layout_json);

-- ── Resolver Catalog ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS resolver_catalog (
    resolver_key    TEXT PRIMARY KEY,
    description     TEXT NOT NULL,
    param_schema    JSONB NOT NULL,
    registered_by   TEXT NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Component Catalog ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS component_catalog (
    component_type    TEXT PRIMARY KEY,
    prop_schema       JSONB NOT NULL,
    template_options  JSONB NOT NULL DEFAULT '{}',
    is_custom         BOOLEAN NOT NULL DEFAULT false,
    registered_by     TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Theme Catalog ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS theme_catalog (
    theme_id        TEXT PRIMARY KEY,
    tenant_id       TEXT,
    display_name    TEXT NOT NULL,
    description     TEXT,
    base_tokens     JSONB NOT NULL,
    template_options JSONB NOT NULL,
    is_default      BOOLEAN NOT NULL DEFAULT false,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    schema_version  TEXT NOT NULL DEFAULT '1.0.0',
    created_by      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_ui_theme_catalog_default ON theme_catalog (theme_id) WHERE is_default;

-- ── Theme Styles ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS theme_styles (
    style_id        TEXT PRIMARY KEY,
    theme_id        TEXT NOT NULL REFERENCES theme_catalog(theme_id) ON DELETE CASCADE,
    tenant_id       TEXT,
    style_key       TEXT NOT NULL,
    display_name    TEXT NOT NULL,
    delta_tokens    JSONB NOT NULL,
    is_default      BOOLEAN NOT NULL DEFAULT false,
    created_by      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (theme_id, tenant_id, style_key)
);

CREATE INDEX idx_ui_theme_styles_lookup ON theme_styles (theme_id, tenant_id);

-- ── Theme Overrides ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS theme_overrides (
    override_id     TEXT PRIMARY KEY,
    theme_id        TEXT NOT NULL REFERENCES theme_catalog(theme_id) ON DELETE CASCADE,
    style_id        TEXT REFERENCES theme_styles(style_id) ON DELETE CASCADE,
    tenant_id       TEXT NOT NULL,
    token_path      TEXT NOT NULL,
    token_value     JSONB NOT NULL,
    created_by      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ui_theme_overrides_lookup ON theme_overrides (theme_id, style_id, tenant_id);

-- ── Codegen Targets ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS codegen_targets (
    id                  TEXT PRIMARY KEY,
    page_id             TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    project_root        TEXT NOT NULL,
    target_subpath      TEXT NOT NULL,
    allowed_write_globs TEXT[] NOT NULL DEFAULT ARRAY['apps/web/src/pages/generated/**', 'apps/web/src/components/generated/**'],
    framework_detected  TEXT,
    last_scanned_at     TIMESTAMPTZ,
    last_generated_at   TIMESTAMPTZ,
    last_commit_sha     TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Codegen Runs ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS codegen_runs (
    id                  TEXT PRIMARY KEY,
    codegen_target_id   TEXT NOT NULL REFERENCES codegen_targets(id) ON DELETE CASCADE,
    dry_run             BOOLEAN NOT NULL,
    diff_summary        TEXT,
    files_changed       TEXT[],
    approved_by         TEXT,
    status              TEXT NOT NULL DEFAULT 'pending',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_codegen_runs_target ON codegen_runs (codegen_target_id);

-- migrate:down

DROP TABLE IF EXISTS codegen_runs;
DROP TABLE IF EXISTS codegen_targets;
DROP TABLE IF EXISTS theme_overrides;
DROP TABLE IF EXISTS theme_styles;
DROP TABLE IF EXISTS theme_catalog;
DROP TABLE IF EXISTS component_catalog;
DROP TABLE IF EXISTS resolver_catalog;
DROP TABLE IF EXISTS page_layouts;
DROP TABLE IF EXISTS pages;
