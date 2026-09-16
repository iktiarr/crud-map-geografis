--
-- PostgreSQL database dump
--

\restrict fhOFRXVpYcz612V7hf7P9tKNNQwiEzhqjFhR6MY2AJ4hn8pzl3gKG3W1VydxKU5

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

-- Started on 2026-06-19 20:55:15

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
-- TOC entry 2 (class 3079 OID 46612)
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- TOC entry 6003 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 234 (class 1259 OID 47851)
-- Name: custom_drawings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.custom_drawings (
    id integer NOT NULL,
    nama character varying(255) NOT NULL,
    tipe character varying(50) NOT NULL,
    warna character varying(50) DEFAULT '#ef4444'::character varying,
    deskripsi text,
    geom public.geometry(Geometry,4326),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.custom_drawings OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 47850)
-- Name: custom_drawings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.custom_drawings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.custom_drawings_id_seq OWNER TO postgres;

--
-- TOC entry 6004 (class 0 OID 0)
-- Dependencies: 233
-- Name: custom_drawings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.custom_drawings_id_seq OWNED BY public.custom_drawings.id;


--
-- TOC entry 232 (class 1259 OID 47839)
-- Name: custom_markers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.custom_markers (
    id integer NOT NULL,
    nama_marker character varying(255) NOT NULL,
    deskripsi text,
    geom public.geometry(Point,4326),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.custom_markers OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 47838)
-- Name: custom_markers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.custom_markers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.custom_markers_id_seq OWNER TO postgres;

--
-- TOC entry 6005 (class 0 OID 0)
-- Dependencies: 231
-- Name: custom_markers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.custom_markers_id_seq OWNED BY public.custom_markers.id;


--
-- TOC entry 228 (class 1259 OID 47815)
-- Name: custom_polygons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.custom_polygons (
    id integer NOT NULL,
    nama_wilayah character varying(255) NOT NULL,
    geom public.geometry(Polygon,4326),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.custom_polygons OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 47814)
-- Name: custom_polygons_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.custom_polygons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.custom_polygons_id_seq OWNER TO postgres;

--
-- TOC entry 6006 (class 0 OID 0)
-- Dependencies: 227
-- Name: custom_polygons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.custom_polygons_id_seq OWNED BY public.custom_polygons.id;


--
-- TOC entry 230 (class 1259 OID 47827)
-- Name: custom_polylines; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.custom_polylines (
    id integer NOT NULL,
    nama_polyline character varying(255) NOT NULL,
    geom public.geometry(LineString,4326),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.custom_polylines OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 47826)
-- Name: custom_polylines_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.custom_polylines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.custom_polylines_id_seq OWNER TO postgres;

--
-- TOC entry 6007 (class 0 OID 0)
-- Dependencies: 229
-- Name: custom_polylines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.custom_polylines_id_seq OWNED BY public.custom_polylines.id;


--
-- TOC entry 226 (class 1259 OID 47790)
-- Name: fasilitas_kesehatan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fasilitas_kesehatan (
    id integer NOT NULL,
    nama character varying(255) NOT NULL,
    jenis character varying(50) NOT NULL,
    alamat text,
    telepon character varying(20),
    status character varying(30) DEFAULT 'Aktif'::character varying,
    kecamatan_id integer,
    geom public.geometry(Point,4326),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fasilitas_kesehatan_jenis_check CHECK (((jenis)::text = ANY ((ARRAY['Puskesmas'::character varying, 'Rumah Sakit'::character varying, 'Klinik'::character varying, 'Apotek'::character varying])::text[]))),
    CONSTRAINT fasilitas_kesehatan_status_check CHECK (((status)::text = ANY ((ARRAY['Aktif'::character varying, 'Tidak Aktif'::character varying])::text[])))
);


ALTER TABLE public.fasilitas_kesehatan OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 47789)
-- Name: fasilitas_kesehatan_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.fasilitas_kesehatan_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fasilitas_kesehatan_id_seq OWNER TO postgres;

--
-- TOC entry 6008 (class 0 OID 0)
-- Dependencies: 225
-- Name: fasilitas_kesehatan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fasilitas_kesehatan_id_seq OWNED BY public.fasilitas_kesehatan.id;


--
-- TOC entry 236 (class 1259 OID 47869)
-- Name: kecamatan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kecamatan (
    id integer NOT NULL,
    nama_kecamatan character varying(100) NOT NULL,
    kode_kecamatan character varying(20),
    kabupaten character varying(100),
    provinsi character varying(100) DEFAULT 'Jawa Barat'::character varying,
    geom public.geometry(MultiPolygon,4326),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.kecamatan OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 47868)
-- Name: kecamatan_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.kecamatan_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.kecamatan_id_seq OWNER TO postgres;

--
-- TOC entry 6009 (class 0 OID 0)
-- Dependencies: 235
-- Name: kecamatan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.kecamatan_id_seq OWNED BY public.kecamatan.id;


--
-- TOC entry 5804 (class 2604 OID 47854)
-- Name: custom_drawings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.custom_drawings ALTER COLUMN id SET DEFAULT nextval('public.custom_drawings_id_seq'::regclass);


--
-- TOC entry 5802 (class 2604 OID 47842)
-- Name: custom_markers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.custom_markers ALTER COLUMN id SET DEFAULT nextval('public.custom_markers_id_seq'::regclass);


--
-- TOC entry 5798 (class 2604 OID 47818)
-- Name: custom_polygons id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.custom_polygons ALTER COLUMN id SET DEFAULT nextval('public.custom_polygons_id_seq'::regclass);


--
-- TOC entry 5800 (class 2604 OID 47830)
-- Name: custom_polylines id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.custom_polylines ALTER COLUMN id SET DEFAULT nextval('public.custom_polylines_id_seq'::regclass);


--
-- TOC entry 5794 (class 2604 OID 47793)
-- Name: fasilitas_kesehatan id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fasilitas_kesehatan ALTER COLUMN id SET DEFAULT nextval('public.fasilitas_kesehatan_id_seq'::regclass);


--
-- TOC entry 5807 (class 2604 OID 47872)
-- Name: kecamatan id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kecamatan ALTER COLUMN id SET DEFAULT nextval('public.kecamatan_id_seq'::regclass);


--
-- TOC entry 5995 (class 0 OID 47851)
-- Dependencies: 234
-- Data for Name: custom_drawings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.custom_drawings (id, nama, tipe, warna, deskripsi, geom, created_at) FROM stdin;
\.


--
-- TOC entry 5993 (class 0 OID 47839)
-- Dependencies: 232
-- Data for Name: custom_markers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.custom_markers (id, nama_marker, deskripsi, geom, created_at) FROM stdin;
\.


--
-- TOC entry 5989 (class 0 OID 47815)
-- Dependencies: 228
-- Data for Name: custom_polygons; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.custom_polygons (id, nama_wilayah, geom, created_at) FROM stdin;
\.


--
-- TOC entry 5991 (class 0 OID 47827)
-- Dependencies: 230
-- Data for Name: custom_polylines; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.custom_polylines (id, nama_polyline, geom, created_at) FROM stdin;
\.


--
-- TOC entry 5987 (class 0 OID 47790)
-- Dependencies: 226
-- Data for Name: fasilitas_kesehatan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fasilitas_kesehatan (id, nama, jenis, alamat, telepon, status, kecamatan_id, geom, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5997 (class 0 OID 47869)
-- Dependencies: 236
-- Data for Name: kecamatan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.kecamatan (id, nama_kecamatan, kode_kecamatan, kabupaten, provinsi, geom, created_at) FROM stdin;
\.


--
-- TOC entry 5793 (class 0 OID 46931)
-- Dependencies: 221
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
\.


--
-- TOC entry 6010 (class 0 OID 0)
-- Dependencies: 233
-- Name: custom_drawings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.custom_drawings_id_seq', 1, false);


--
-- TOC entry 6011 (class 0 OID 0)
-- Dependencies: 231
-- Name: custom_markers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.custom_markers_id_seq', 1, false);


--
-- TOC entry 6012 (class 0 OID 0)
-- Dependencies: 227
-- Name: custom_polygons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.custom_polygons_id_seq', 1, false);


--
-- TOC entry 6013 (class 0 OID 0)
-- Dependencies: 229
-- Name: custom_polylines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.custom_polylines_id_seq', 1, false);


--
-- TOC entry 6014 (class 0 OID 0)
-- Dependencies: 225
-- Name: fasilitas_kesehatan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.fasilitas_kesehatan_id_seq', 1, false);


--
-- TOC entry 6015 (class 0 OID 0)
-- Dependencies: 235
-- Name: kecamatan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.kecamatan_id_seq', 1, false);


--
-- TOC entry 5829 (class 2606 OID 47863)
-- Name: custom_drawings custom_drawings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.custom_drawings
    ADD CONSTRAINT custom_drawings_pkey PRIMARY KEY (id);


--
-- TOC entry 5826 (class 2606 OID 47849)
-- Name: custom_markers custom_markers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.custom_markers
    ADD CONSTRAINT custom_markers_pkey PRIMARY KEY (id);


--
-- TOC entry 5820 (class 2606 OID 47825)
-- Name: custom_polygons custom_polygons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.custom_polygons
    ADD CONSTRAINT custom_polygons_pkey PRIMARY KEY (id);


--
-- TOC entry 5823 (class 2606 OID 47837)
-- Name: custom_polylines custom_polylines_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.custom_polylines
    ADD CONSTRAINT custom_polylines_pkey PRIMARY KEY (id);


--
-- TOC entry 5816 (class 2606 OID 47805)
-- Name: fasilitas_kesehatan fasilitas_kesehatan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fasilitas_kesehatan
    ADD CONSTRAINT fasilitas_kesehatan_pkey PRIMARY KEY (id);


--
-- TOC entry 5833 (class 2606 OID 47880)
-- Name: kecamatan kecamatan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kecamatan
    ADD CONSTRAINT kecamatan_pkey PRIMARY KEY (id);


--
-- TOC entry 5830 (class 1259 OID 47867)
-- Name: idx_custom_drawings_geom; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_custom_drawings_geom ON public.custom_drawings USING gist (geom);


--
-- TOC entry 5827 (class 1259 OID 47866)
-- Name: idx_custom_markers_geom; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_custom_markers_geom ON public.custom_markers USING gist (geom);


--
-- TOC entry 5821 (class 1259 OID 47864)
-- Name: idx_custom_polygons_geom; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_custom_polygons_geom ON public.custom_polygons USING gist (geom);


--
-- TOC entry 5824 (class 1259 OID 47865)
-- Name: idx_custom_polylines_geom; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_custom_polylines_geom ON public.custom_polylines USING gist (geom);


--
-- TOC entry 5817 (class 1259 OID 47812)
-- Name: idx_fasilitas_geom; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fasilitas_geom ON public.fasilitas_kesehatan USING gist (geom);


--
-- TOC entry 5818 (class 1259 OID 47813)
-- Name: idx_fasilitas_kec_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fasilitas_kec_id ON public.fasilitas_kesehatan USING btree (kecamatan_id);


--
-- TOC entry 5831 (class 1259 OID 47881)
-- Name: idx_kecamatan_geom; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_kecamatan_geom ON public.kecamatan USING gist (geom);


-- Completed on 2026-06-19 20:55:17

--
-- PostgreSQL database dump complete
--

\unrestrict fhOFRXVpYcz612V7hf7P9tKNNQwiEzhqjFhR6MY2AJ4hn8pzl3gKG3W1VydxKU5

