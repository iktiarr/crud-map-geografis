-- SQL Database Setup for 'teman' Project
-- Extension: PostGIS must be enabled.

-- 1. Enable PostGIS Extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Drop table if exists
DROP TABLE IF EXISTS lokasi2 CASCADE;

-- 3. Create lokasi2 table for storing both Polygons and Points
CREATE TABLE lokasi2 (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    geom GEOMETRY(Geometry, 4326) NOT NULL
);

-- 4. Create spatial index on the geom column for performance
CREATE INDEX IF NOT EXISTS lokasi2_geom_idx ON lokasi2 USING GIST(geom);

-- 5. Insert Sample Areas (Polygons)
INSERT INTO lokasi2 (nama, geom) VALUES 
('area 1', ST_GeomFromText('POLYGON((107.60 -6.90, 107.60 -6.95, 107.65 -6.95, 107.65 -6.90, 107.60 -6.90))', 4326)),
('area 2', ST_GeomFromText('POLYGON((107.63 -6.92, 107.63 -6.97, 107.68 -6.97, 107.68 -6.92, 107.63 -6.92))', 4326));

-- 6. Insert Sample Markers (Points)
INSERT INTO lokasi2 (nama, geom) VALUES 
('marker 1', ST_GeomFromText('POINT(107.64 -6.93)', 4326)),
('marker 2', ST_GeomFromText('POINT(107.61 -6.91)', 4326)),
('marker 3', ST_GeomFromText('POINT(107.66 -6.94)', 4326)),
('marker 4', ST_GeomFromText('POINT(107.58 -6.88)', 4326));
