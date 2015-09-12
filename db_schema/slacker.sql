--
-- PostgreSQL database dump
--

-- Dumped from database version 9.1.18
-- Dumped by pg_dump version 9.4.0
-- Started on 2015-09-12 17:07:31 MSK

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

--
-- TOC entry 1862 (class 1262 OID 11919)
-- Dependencies: 1861
-- Name: postgres; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON DATABASE postgres IS 'default administrative connection database';


--
-- TOC entry 7 (class 2615 OID 16391)
-- Name: slacker; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA slacker;


ALTER SCHEMA slacker OWNER TO postgres;

--
-- TOC entry 164 (class 3079 OID 11645)
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- TOC entry 1866 (class 0 OID 0)
-- Dependencies: 164
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET search_path = slacker, pg_catalog;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- TOC entry 162 (class 1259 OID 16392)
-- Name: hustle; Type: TABLE; Schema: slacker; Owner: postgres; Tablespace: 
--

CREATE TABLE hustle (
    text text NOT NULL,
    id integer NOT NULL,
    added bigint NOT NULL,
    vacancy text NOT NULL,
    id_sputnik text,
    tel text,
    issue integer,
    vse35_id text,
    price text,
    price_custom text,
    edited bigint,
    author text,
    email text,
    visitors integer,
    payment_period text,
    experience text,
    education text,
    busyness text,
    work_schedule text,
    picture text,
    author_detail_name text,
    author_detail_id text
);


ALTER TABLE hustle OWNER TO postgres;

--
-- TOC entry 163 (class 1259 OID 16399)
-- Name: test_key_column_seq; Type: SEQUENCE; Schema: slacker; Owner: postgres
--

CREATE SEQUENCE test_key_column_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE test_key_column_seq OWNER TO postgres;

--
-- TOC entry 1867 (class 0 OID 0)
-- Dependencies: 163
-- Name: test_key_column_seq; Type: SEQUENCE OWNED BY; Schema: slacker; Owner: postgres
--

ALTER SEQUENCE test_key_column_seq OWNED BY hustle.id;


--
-- TOC entry 1753 (class 2604 OID 16408)
-- Name: id; Type: DEFAULT; Schema: slacker; Owner: postgres
--

ALTER TABLE ONLY hustle ALTER COLUMN id SET DEFAULT nextval('test_key_column_seq'::regclass);


--
-- TOC entry 1755 (class 2606 OID 16410)
-- Name: test_pkey; Type: CONSTRAINT; Schema: slacker; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY hustle
    ADD CONSTRAINT test_pkey PRIMARY KEY (id);


--
-- TOC entry 1864 (class 0 OID 0)
-- Dependencies: 5
-- Name: public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM postgres;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- TOC entry 1865 (class 0 OID 0)
-- Dependencies: 7
-- Name: slacker; Type: ACL; Schema: -; Owner: postgres
--

REVOKE ALL ON SCHEMA slacker FROM PUBLIC;
REVOKE ALL ON SCHEMA slacker FROM postgres;
GRANT ALL ON SCHEMA slacker TO postgres;


-- Completed on 2015-09-12 17:07:32 MSK

--
-- PostgreSQL database dump complete
--

