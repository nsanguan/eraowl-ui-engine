-- =============================================================================
-- eraowl-ui-engine-api: Initial schema (§5.1)
-- =============================================================================

-- migrate:up

CREATE TABLE IF NOT EXISTS pages (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    route       TEXT NOT NULL DEFAULT '/',
    description TEXT NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ
);

CREATE INDEX idx_pages_route ON pages (route) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS page_layouts (
    id          TEXT PRIMARY KEY,
    page_id     TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    version     INTEGER NOT NULL DEFAULT 1,
    layout_json TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_layouts_page_id ON page_layouts (page_id);
CREATE UNIQUE INDEX idx_layouts_page_version ON page_layouts (page_id, version);

CREATE TABLE IF NOT EXISTS resolver_catalog (
    id           TEXT PRIMARY KEY,
    name         TEXT NOT NULL UNIQUE,
    module_path  TEXT NOT NULL,
    input_schema TEXT NOT NULL,
    output_schema TEXT NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS component_catalog (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL UNIQUE,
    category      TEXT NOT NULL DEFAULT 'basic',
    prop_schema   TEXT NOT NULL,
    default_props TEXT NOT NULL DEFAULT '{}',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS theme_catalog (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS theme_styles (
    id         TEXT PRIMARY KEY,
    theme_id   TEXT NOT NULL REFERENCES theme_catalog(id) ON DELETE CASCADE,
    style_json TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_theme_styles_theme_id ON theme_styles (theme_id);

CREATE TABLE IF NOT EXISTS theme_overrides (
    id             TEXT PRIMARY KEY,
    theme_id       TEXT NOT NULL REFERENCES theme_catalog(id) ON DELETE CASCADE,
    component_name TEXT NOT NULL,
    override_json  TEXT NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_theme_overrides_theme_id ON theme_overrides (theme_id);

-- migrate:down

DROP TABLE IF EXISTS theme_overrides;
DROP TABLE IF EXISTS theme_styles;
DROP TABLE IF EXISTS theme_catalog;
DROP TABLE IF EXISTS component_catalog;
DROP TABLE IF EXISTS resolver_catalog;
DROP TABLE IF EXISTS page_layouts;
DROP TABLE IF EXISTS pages;
