-- ==========================================
-- DATABASE SCHEMA FOR GIS SYSTEM (sig-leaflet)
-- ==========================================

-- 1. Jalankan query ini terlebih dahulu jika Anda membuat database secara manual di pgAdmin:
-- CREATE DATABASE uts_sig;
-- \c uts_sig; -- Hubungkan ke database uts_sig

-- 2. Aktifkan ekstensi PostGIS (wajib)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 3. Hapus tabel jika sudah ada (untuk keperluan reset)
DROP TABLE IF EXISTS markers CASCADE;
DROP TABLE IF EXISTS wilayah CASCADE;
DROP TABLE IF EXISTS groups CASCADE;

-- 4. Buat Tabel Groups
CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    nama_group VARCHAR(255) NOT NULL,
    deskripsi TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Buat Tabel Wilayah (Polygon untuk Wilayah A, B, dst)
CREATE TABLE wilayah (
    id SERIAL PRIMARY KEY,
    group_id INT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    nama_wilayah VARCHAR(255) NOT NULL,
    geom GEOMETRY(Polygon, 4326) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Buat Tabel Markers (Titik koordinat)
CREATE TABLE markers (
    id SERIAL PRIMARY KEY,
    group_id INT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    nama_marker VARCHAR(255) NOT NULL,
    deskripsi TEXT,
    geom GEOMETRY(Point, 4326) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Buat Spatial Index untuk mengoptimalkan pencarian spasial
CREATE INDEX idx_wilayah_geom ON wilayah USING gist(geom);
CREATE INDEX idx_markers_geom ON markers USING gist(geom);
