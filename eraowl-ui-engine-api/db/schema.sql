\restrict PaVDBbdbpPFPKBy70ThZpF89ct8nmJ8Gaz9TQvfuUY35OYm2fMM19mAjsmKVCC3

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
    target_id text NOT NULL,
    page_ids text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    diff_json text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: codegen_targets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.codegen_targets (
    id text NOT NULL,
    project_path text NOT NULL,
    framework text DEFAULT 'react'::text NOT NULL,
    config_json text DEFAULT '{}'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: component_catalog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.component_catalog (
    id text NOT NULL,
    name text NOT NULL,
    category text DEFAULT 'basic'::text NOT NULL,
    prop_schema text NOT NULL,
    default_props text DEFAULT '{}'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: page_layouts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_layouts (
    id text NOT NULL,
    page_id text NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    layout_json text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: pages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pages (
    id text NOT NULL,
    name text NOT NULL,
    route text DEFAULT '/'::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: resolver_catalog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resolver_catalog (
    id text NOT NULL,
    name text NOT NULL,
    module_path text NOT NULL,
    input_schema text NOT NULL,
    output_schema text NOT NULL,
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
    id text NOT NULL,
    name text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: theme_overrides; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.theme_overrides (
    id text NOT NULL,
    theme_id text NOT NULL,
    component_name text NOT NULL,
    override_json text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: theme_styles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.theme_styles (
    id text NOT NULL,
    theme_id text NOT NULL,
    style_json text NOT NULL,
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
-- Name: component_catalog component_catalog_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.component_catalog
    ADD CONSTRAINT component_catalog_name_key UNIQUE (name);


--
-- Name: component_catalog component_catalog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.component_catalog
    ADD CONSTRAINT component_catalog_pkey PRIMARY KEY (id);


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
-- Name: resolver_catalog resolver_catalog_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resolver_catalog
    ADD CONSTRAINT resolver_catalog_name_key UNIQUE (name);


--
-- Name: resolver_catalog resolver_catalog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resolver_catalog
    ADD CONSTRAINT resolver_catalog_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: theme_catalog theme_catalog_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.theme_catalog
    ADD CONSTRAINT theme_catalog_name_key UNIQUE (name);


--
-- Name: theme_catalog theme_catalog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.theme_catalog
    ADD CONSTRAINT theme_catalog_pkey PRIMARY KEY (id);


--
-- Name: theme_overrides theme_overrides_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.theme_overrides
    ADD CONSTRAINT theme_overrides_pkey PRIMARY KEY (id);


--
-- Name: theme_styles theme_styles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.theme_styles
    ADD CONSTRAINT theme_styles_pkey PRIMARY KEY (id);


--
-- Name: idx_codegen_runs_target_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_codegen_runs_target_id ON public.codegen_runs USING btree (target_id);


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
-- Name: idx_theme_overrides_theme_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_theme_overrides_theme_id ON public.theme_overrides USING btree (theme_id);


--
-- Name: idx_theme_styles_theme_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_theme_styles_theme_id ON public.theme_styles USING btree (theme_id);


--
-- Name: codegen_runs codegen_runs_target_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codegen_runs
    ADD CONSTRAINT codegen_runs_target_id_fkey FOREIGN KEY (target_id) REFERENCES public.codegen_targets(id) ON DELETE CASCADE;


--
-- Name: page_layouts page_layouts_page_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_layouts
    ADD CONSTRAINT page_layouts_page_id_fkey FOREIGN KEY (page_id) REFERENCES public.pages(id) ON DELETE CASCADE;


--
-- Name: theme_overrides theme_overrides_theme_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.theme_overrides
    ADD CONSTRAINT theme_overrides_theme_id_fkey FOREIGN KEY (theme_id) REFERENCES public.theme_catalog(id) ON DELETE CASCADE;


--
-- Name: theme_styles theme_styles_theme_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.theme_styles
    ADD CONSTRAINT theme_styles_theme_id_fkey FOREIGN KEY (theme_id) REFERENCES public.theme_catalog(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict PaVDBbdbpPFPKBy70ThZpF89ct8nmJ8Gaz9TQvfuUY35OYm2fMM19mAjsmKVCC3


--
-- Dbmate schema migrations
--

INSERT INTO public.schema_migrations (version) VALUES
    ('20260101000000'),
    ('20260102000000');
