--
-- PostgreSQL database dump
--

\restrict dYVv2866NeuhvpDZuFaqDVubESOPVuz2g5yrcErg9GxbHWqiOiReXzbWOiZbp4U

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

-- Started on 2026-06-26 20:16:39

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 222 (class 1259 OID 42017)
-- Name: dim_lokasi; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dim_lokasi (
    sk_lokasi integer NOT NULL,
    alamat_lengkap text,
    kecamatan character varying(100),
    kabupaten character varying(100) DEFAULT 'Jember'::character varying
);


ALTER TABLE public.dim_lokasi OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 42016)
-- Name: dim_lokasi_sk_lokasi_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.dim_lokasi_sk_lokasi_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dim_lokasi_sk_lokasi_seq OWNER TO postgres;

--
-- TOC entry 5036 (class 0 OID 0)
-- Dependencies: 221
-- Name: dim_lokasi_sk_lokasi_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.dim_lokasi_sk_lokasi_seq OWNED BY public.dim_lokasi.sk_lokasi;


--
-- TOC entry 220 (class 1259 OID 42007)
-- Name: dim_wisata; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dim_wisata (
    sk_wisata integer NOT NULL,
    nama_wisata character varying(255),
    deskripsi text,
    link_foto character varying(255)
);


ALTER TABLE public.dim_wisata OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 42006)
-- Name: dim_wisata_sk_wisata_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.dim_wisata_sk_wisata_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dim_wisata_sk_wisata_seq OWNER TO postgres;

--
-- TOC entry 5037 (class 0 OID 0)
-- Dependencies: 219
-- Name: dim_wisata_sk_wisata_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.dim_wisata_sk_wisata_seq OWNED BY public.dim_wisata.sk_wisata;


--
-- TOC entry 224 (class 1259 OID 42028)
-- Name: fakta_wisata; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fakta_wisata (
    sk_fakta integer NOT NULL,
    fk_wisata integer,
    fk_lokasi integer,
    rating numeric(3,1),
    harga_weekday integer,
    harga_weekend integer
);


ALTER TABLE public.fakta_wisata OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 42027)
-- Name: fakta_wisata_sk_fakta_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.fakta_wisata_sk_fakta_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fakta_wisata_sk_fakta_seq OWNER TO postgres;

--
-- TOC entry 5038 (class 0 OID 0)
-- Dependencies: 223
-- Name: fakta_wisata_sk_fakta_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fakta_wisata_sk_fakta_seq OWNED BY public.fakta_wisata.sk_fakta;


--
-- TOC entry 4867 (class 2604 OID 42020)
-- Name: dim_lokasi sk_lokasi; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dim_lokasi ALTER COLUMN sk_lokasi SET DEFAULT nextval('public.dim_lokasi_sk_lokasi_seq'::regclass);


--
-- TOC entry 4866 (class 2604 OID 42010)
-- Name: dim_wisata sk_wisata; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dim_wisata ALTER COLUMN sk_wisata SET DEFAULT nextval('public.dim_wisata_sk_wisata_seq'::regclass);


--
-- TOC entry 4869 (class 2604 OID 42031)
-- Name: fakta_wisata sk_fakta; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fakta_wisata ALTER COLUMN sk_fakta SET DEFAULT nextval('public.fakta_wisata_sk_fakta_seq'::regclass);


--
-- TOC entry 5028 (class 0 OID 42017)
-- Dependencies: 222
-- Data for Name: dim_lokasi; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dim_lokasi (sk_lokasi, alamat_lengkap, kecamatan, kabupaten) FROM stdin;
\.


--
-- TOC entry 5026 (class 0 OID 42007)
-- Dependencies: 220
-- Data for Name: dim_wisata; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dim_wisata (sk_wisata, nama_wisata, deskripsi, link_foto) FROM stdin;
\.


--
-- TOC entry 5030 (class 0 OID 42028)
-- Dependencies: 224
-- Data for Name: fakta_wisata; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fakta_wisata (sk_fakta, fk_wisata, fk_lokasi, rating, harga_weekday, harga_weekend) FROM stdin;
\.


--
-- TOC entry 5039 (class 0 OID 0)
-- Dependencies: 221
-- Name: dim_lokasi_sk_lokasi_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.dim_lokasi_sk_lokasi_seq', 1, false);


--
-- TOC entry 5040 (class 0 OID 0)
-- Dependencies: 219
-- Name: dim_wisata_sk_wisata_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.dim_wisata_sk_wisata_seq', 1, false);


--
-- TOC entry 5041 (class 0 OID 0)
-- Dependencies: 223
-- Name: fakta_wisata_sk_fakta_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.fakta_wisata_sk_fakta_seq', 1, false);


--
-- TOC entry 4873 (class 2606 OID 42026)
-- Name: dim_lokasi dim_lokasi_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dim_lokasi
    ADD CONSTRAINT dim_lokasi_pkey PRIMARY KEY (sk_lokasi);


--
-- TOC entry 4871 (class 2606 OID 42015)
-- Name: dim_wisata dim_wisata_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dim_wisata
    ADD CONSTRAINT dim_wisata_pkey PRIMARY KEY (sk_wisata);


--
-- TOC entry 4875 (class 2606 OID 42034)
-- Name: fakta_wisata fakta_wisata_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fakta_wisata
    ADD CONSTRAINT fakta_wisata_pkey PRIMARY KEY (sk_fakta);


--
-- TOC entry 4876 (class 2606 OID 42040)
-- Name: fakta_wisata fakta_wisata_fk_lokasi_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fakta_wisata
    ADD CONSTRAINT fakta_wisata_fk_lokasi_fkey FOREIGN KEY (fk_lokasi) REFERENCES public.dim_lokasi(sk_lokasi);


--
-- TOC entry 4877 (class 2606 OID 42035)
-- Name: fakta_wisata fakta_wisata_fk_wisata_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fakta_wisata
    ADD CONSTRAINT fakta_wisata_fk_wisata_fkey FOREIGN KEY (fk_wisata) REFERENCES public.dim_wisata(sk_wisata);


-- Completed on 2026-06-26 20:16:39

--
-- PostgreSQL database dump complete
--

\unrestrict dYVv2866NeuhvpDZuFaqDVubESOPVuz2g5yrcErg9GxbHWqiOiReXzbWOiZbp4U

