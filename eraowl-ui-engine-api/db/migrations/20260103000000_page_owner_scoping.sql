-- migrate:up

ALTER TABLE pages ADD COLUMN owner_id uuid DEFAULT NULL;
CREATE INDEX IF NOT EXISTS ix_pages_owner_id ON pages (owner_id);

-- migrate:down

DROP INDEX IF EXISTS ix_pages_owner_id;
ALTER TABLE pages DROP COLUMN owner_id;
