-- =========================================================================
-- DATABASE DDL & SCHEMA UTUH — WEB GIS UAS
-- Database: PostgreSQL + PostGIS (Neon Cloud / Lokal)
-- Pembuat: IKTIAR RAMADANI ( 230441100053 )
-- =========================================================================

-- 1. AKTIFKAN EXTENSION POSTGIS (Wajib untuk pemrosesan data spasial/geometri)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. HAPUS TABEL LAMA JIKA ADA (Reset skema bersih)
DROP TABLE IF EXISTS kecamatan CASCADE;
DROP TABLE IF EXISTS custom_polygons CASCADE;
DROP TABLE IF EXISTS custom_polylines CASCADE;
DROP TABLE IF EXISTS custom_markers CASCADE;
DROP TABLE IF EXISTS custom_drawings CASCADE;
DROP TABLE IF EXISTS import_metadata CASCADE;

-- =========================================================================
-- A. TABEL UTAMA SISTEM (Diisi via Shapefile Import atau Setup Manual)
-- =========================================================================

-- 3. Tabel KECAMATAN (Data Spasial: MultiPolygon Wilayah)
CREATE TABLE kecamatan (
    id              SERIAL PRIMARY KEY,
    nama_kecamatan  VARCHAR(100) NOT NULL,
    kode_kecamatan  VARCHAR(20),
    kabupaten       VARCHAR(100),
    provinsi        VARCHAR(100) DEFAULT 'Jawa Barat',
    geom            GEOMETRY(MultiPolygon, 4326),  -- Kolom Spasial (Polygon wilayah batas administrasi)
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- B. TABEL PEMBUATAN ELEMEN KUSTOM (Drawing Canvas & Fitur Analisis Spasial)
-- =========================================================================

-- 5. Tabel Kustom Polygon (Drawing Wilayah Kustom)
CREATE TABLE custom_polygons (
    id              SERIAL PRIMARY KEY,
    nama_wilayah    VARCHAR(255) NOT NULL,
    geom            GEOMETRY(Polygon, 4326),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabel Kustom Polyline (Drawing Rute / Garis Kustom)
CREATE TABLE custom_polylines (
    id              SERIAL PRIMARY KEY,
    nama_polyline   VARCHAR(255) NOT NULL,
    geom            GEOMETRY(LineString, 4326),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabel Kustom Marker (Drawing Penanda Lokasi Kustom)
CREATE TABLE custom_markers (
    id              SERIAL PRIMARY KEY,
    nama_marker     VARCHAR(255) NOT NULL,
    deskripsi       TEXT,
    geom            GEOMETRY(Point, 4326),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Tabel Hasil Gambar Kreatif (Drawing Canvas)
CREATE TABLE custom_drawings (
    id              SERIAL PRIMARY KEY,
    nama            VARCHAR(255) NOT NULL,
    tipe            VARCHAR(50) NOT NULL,          -- 'polygon', 'polyline', 'marker'
    warna           VARCHAR(50) DEFAULT '#ef4444', -- Palet warna visual
    deskripsi       TEXT,
    geom            GEOMETRY(GEOMETRY, 4326),      -- Mendukung tipe data spasial apa saja
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- C. TABEL METADATA (Untuk Manajemen Shapefile)
-- =========================================================================

-- 9. Tabel Metadata File Terunggah
CREATE TABLE import_metadata (
    table_name      VARCHAR(255) PRIMARY KEY,      -- Nama tabel kustom yang terbuat
    files           VARCHAR(255) NOT NULL          -- Ekstensi komponen file terunggah (.shp,.dbf,.shx,.prj)
);

-- =========================================================================
-- D. DOKUMENTASI TABEL DINAMIS (Ditambahkan Secara Manual oleh Admin)
-- =========================================================================
-- Catatan: Saat admin menambahkan fasilitas manual baru, aplikasi akan membuat 
-- tabel kustom dinamis baru secara otomatis dengan penamaan yang disanitasi dari 
-- nama fasilitas kustom tersebut (cth: tabel "klinik_darurat").
-- Struktur tabel dinamis tersebut memiliki definisi DDL sebagai berikut:
--
-- CREATE TABLE IF NOT EXISTS [nama_tabel_kustom] (
--     id              SERIAL PRIMARY KEY,
--     nama            VARCHAR(255) NOT NULL,
--     geom            GEOMETRY(MultiPoint, 4326),    -- Format MultiPoint (Bisa menampung >= 1 penanda)
--     created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );
-- CREATE INDEX IF NOT EXISTS "idx_[nama_tabel_kustom]_geom" ON [nama_tabel_kustom] USING GIST(geom);


-- =========================================================================
-- E. SPATIAL INDEX (Optimasi Performa Query Geografis Spasial)
-- =========================================================================
CREATE INDEX idx_kecamatan_geom          ON kecamatan USING GIST(geom);
CREATE INDEX idx_custom_polygons_geom    ON custom_polygons USING GIST(geom);
CREATE INDEX idx_custom_polylines_geom   ON custom_polylines USING GIST(geom);
CREATE INDEX idx_custom_markers_geom     ON custom_markers USING GIST(geom);
CREATE INDEX idx_custom_drawings_geom    ON custom_drawings USING GIST(geom);
