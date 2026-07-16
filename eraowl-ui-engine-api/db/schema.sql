\restrict dzXyEvDjwcUefQynN8jE7zaA4eGI9S6sMbd75Zq0OvYfklhtz6qdRyjGgKsZueK

-- Dumped from database version 18.4 (Ubuntu 18.4-1.pgdg24.04+1)
-- Dumped by pg_dump version 18.4 (Ubuntu 18.4-1.pgdg24.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA public;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: codegen_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.codegen_runs (
    id text NOT NULL,
    codegen_target_id text NOT NULL,
    dry_run boolean NOT NULL,
    diff_summary text,
    files_changed text[],
    approved_by text,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: codegen_targets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.codegen_targets (
    id text NOT NULL,
    page_id text NOT NULL,
    project_root text NOT NULL,
    target_subpath text NOT NULL,
    allowed_write_globs text[] DEFAULT ARRAY['apps/web/src/pages/generated/**'::text, 'apps/web/src/components/generated/**'::text] NOT NULL,
    framework_detected text,
    last_scanned_at timestamp with time zone,
    last_generated_at timestamp with time zone,
    last_commit_sha text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: component_catalog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.component_catalog (
    component_type text NOT NULL,
    prop_schema jsonb NOT NULL,
    template_options jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_custom boolean DEFAULT false NOT NULL,
    registered_by text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: page_layouts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_layouts (
    id text NOT NULL,
    page_id text NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    layout_json jsonb NOT NULL,
    is_published boolean DEFAULT false NOT NULL,
    created_by text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: pages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pages (
    id text NOT NULL,
    tenant_id text DEFAULT 'default'::text NOT NULL,
    name text NOT NULL,
    route text DEFAULT '/'::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    schema_version text DEFAULT '1.0.0'::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: resolver_catalog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resolver_catalog (
    resolver_key text NOT NULL,
    description text NOT NULL,
    param_schema jsonb NOT NULL,
    registered_by text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version character varying(128) NOT NULL
);


--
-- Name: theme_catalog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.theme_catalog (
    theme_id text NOT NULL,
    tenant_id text,
    display_name text NOT NULL,
    description text,
    base_tokens jsonb NOT NULL,
    template_options jsonb NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    schema_version text DEFAULT '1.0.0'::text NOT NULL,
    created_by text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: theme_overrides; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.theme_overrides (
    override_id text NOT NULL,
    theme_id text NOT NULL,
    style_id text,
    tenant_id text NOT NULL,
    token_path text NOT NULL,
    token_value jsonb NOT NULL,
    created_by text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: theme_styles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.theme_styles (
    style_id text NOT NULL,
    theme_id text NOT NULL,
    tenant_id text,
    style_key text NOT NULL,
    display_name text NOT NULL,
    delta_tokens jsonb NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_by text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: codegen_runs codegen_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codegen_runs
    ADD CONSTRAINT codegen_runs_pkey PRIMARY KEY (id);


--
-- Name: codegen_targets codegen_targets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codegen_targets
    ADD CONSTRAINT codegen_targets_pkey PRIMARY KEY (id);


--
-- Name: component_catalog component_catalog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.component_catalog
    ADD CONSTRAINT component_catalog_pkey PRIMARY KEY (component_type);


--
-- Name: page_layouts page_layouts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_layouts
    ADD CONSTRAINT page_layouts_pkey PRIMARY KEY (id);


--
-- Name: pages pages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pages
    ADD CONSTRAINT pages_pkey PRIMARY KEY (id);


--
-- Name: resolver_catalog resolver_catalog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resolver_catalog
    ADD CONSTRAINT resolver_catalog_pkey PRIMARY KEY (resolver_key);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: theme_catalog theme_catalog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.theme_catalog
    ADD CONSTRAINT theme_catalog_pkey PRIMARY KEY (theme_id);


--
-- Name: theme_overrides theme_overrides_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.theme_overrides
    ADD CONSTRAINT theme_overrides_pkey PRIMARY KEY (override_id);


--
-- Name: theme_styles theme_styles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.theme_styles
    ADD CONSTRAINT theme_styles_pkey PRIMARY KEY (style_id);


--
-- Name: theme_styles theme_styles_theme_id_tenant_id_style_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.theme_styles
    ADD CONSTRAINT theme_styles_theme_id_tenant_id_style_key_key UNIQUE (theme_id, tenant_id, style_key);


--
-- Name: idx_codegen_runs_target; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_codegen_runs_target ON public.codegen_runs USING btree (codegen_target_id);


--
-- Name: idx_layouts_page_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_layouts_page_id ON public.page_layouts USING btree (page_id);


--
-- Name: idx_layouts_page_version; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_layouts_page_version ON public.page_layouts USING btree (page_id, version);


--
-- Name: idx_pages_route; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pages_route ON public.pages USING btree (route) WHERE (deleted_at IS NULL);


--
-- Name: idx_pages_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pages_tenant ON public.pages USING btree (tenant_id);


--
-- Name: idx_ui_page_layouts_json; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ui_page_layouts_json ON public.page_layouts USING gin (layout_json);


--
-- Name: idx_ui_theme_overrides_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ui_theme_overrides_lookup ON public.theme_overrides USING btree (theme_id, style_id, tenant_id);


--
-- Name: idx_ui_theme_styles_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ui_theme_styles_lookup ON public.theme_styles USING btree (theme_id, tenant_id);


--
-- Name: uq_ui_theme_catalog_default; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_ui_theme_catalog_default ON public.theme_catalog USING btree (theme_id) WHERE is_default;


--
-- Name: codegen_runs codegen_runs_codegen_target_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codegen_runs
    ADD CONSTRAINT codegen_runs_codegen_target_id_fkey FOREIGN KEY (codegen_target_id) REFERENCES public.codegen_targets(id) ON DELETE CASCADE;


--
-- Name: codegen_targets codegen_targets_page_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codegen_targets
    ADD CONSTRAINT codegen_targets_page_id_fkey FOREIGN KEY (page_id) REFERENCES public.pages(id) ON DELETE CASCADE;


--
-- Name: page_layouts page_layouts_page_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_layouts
    ADD CONSTRAINT page_layouts_page_id_fkey FOREIGN KEY (page_id) REFERENCES public.pages(id) ON DELETE CASCADE;


--
-- Name: theme_overrides theme_overrides_style_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.theme_overrides
    ADD CONSTRAINT theme_overrides_style_id_fkey FOREIGN KEY (style_id) REFERENCES public.theme_styles(style_id) ON DELETE CASCADE;


--
-- Name: theme_overrides theme_overrides_theme_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.theme_overrides
    ADD CONSTRAINT theme_overrides_theme_id_fkey FOREIGN KEY (theme_id) REFERENCES public.theme_catalog(theme_id) ON DELETE CASCADE;


--
-- Name: theme_styles theme_styles_theme_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.theme_styles
    ADD CONSTRAINT theme_styles_theme_id_fkey FOREIGN KEY (theme_id) REFERENCES public.theme_catalog(theme_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict dzXyEvDjwcUefQynN8jE7zaA4eGI9S6sMbd75Zq0OvYfklhtz6qdRyjGgKsZueK


--
-- Dbmate schema migrations
--

INSERT INTO public.schema_migrations (version) VALUES
    ('20260101000000'),
    ('20260102000000');
