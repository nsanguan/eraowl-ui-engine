-- =============================================================================
-- eraowl-ui-engine-api: Codegen targets tables (§8.1)
-- =============================================================================

-- migrate:up

CREATE TABLE IF NOT EXISTS codegen_targets (
    id           TEXT PRIMARY KEY,
    project_path TEXT NOT NULL,
    framework    TEXT NOT NULL DEFAULT 'react',
    config_json  TEXT NOT NULL DEFAULT '{}',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS codegen_runs (
    id         TEXT PRIMARY KEY,
    target_id  TEXT NOT NULL REFERENCES codegen_targets(id) ON DELETE CASCADE,
    page_ids   TEXT NOT NULL,
    status     TEXT NOT NULL DEFAULT 'pending',
    diff_json  TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_codegen_runs_target_id ON codegen_runs (target_id);

-- migrate:down

DROP TABLE IF EXISTS codegen_runs;
DROP TABLE IF EXISTS codegen_targets;
