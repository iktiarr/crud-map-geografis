--
-- PostgreSQL database dump
--

\restrict zYfoXQGXhcYqWxnzfFp3xlHiYefKQTXK4TZ3fNqYlYw8Fj7Z0OnIxOqPRZNc4C1

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

-- Started on 2026-06-26 20:21:55

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
-- TOC entry 2 (class 3079 OID 16388)
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- TOC entry 5924 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- TOC entry 5763 (class 0 OID 16707)
-- Dependencies: 221
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
\.


-- Completed on 2026-06-26 20:21:56

--
-- PostgreSQL database dump complete
--

\unrestrict zYfoXQGXhcYqWxnzfFp3xlHiYefKQTXK4TZ3fNqYlYw8Fj7Z0OnIxOqPRZNc4C1

