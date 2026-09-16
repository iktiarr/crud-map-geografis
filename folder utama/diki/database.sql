-- =====================================================================
-- DATABASE SETUP & SCHEMA FOR SIG SEKOLAH
-- PostgreSQL + PostGIS Extension
-- =====================================================================

-- 1. Pastikan ekstensi PostGIS telah aktif
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Hapus tabel jika sudah ada (Opsional, gunakan dengan hati-hati)
-- DROP TABLE IF EXISTS sekolah;
-- DROP TABLE IF EXISTS lokasi2;
-- DROP TABLE IF EXISTS kecamatan;

-- 3. Membuat Tabel 'kecamatan' (Untuk referensi pembatas administratif wilayah)
CREATE TABLE IF NOT EXISTS kecamatan (
    id SERIAL PRIMARY KEY,
    nama_kecamatan VARCHAR(255) NOT NULL,
    geom GEOMETRY(MultiPolygon, 4326) NOT NULL
);

-- Membuat indeks spasial untuk kecamatan
CREATE INDEX IF NOT EXISTS idx_kecamatan_geom ON kecamatan USING GIST(geom);


-- 4. Membuat Tabel 'lokasi2' (Untuk poligon area gambar kustom dari user/admin)
CREATE TABLE IF NOT EXISTS lokasi2 (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    geom GEOMETRY(Geometry, 4326) NOT NULL
);

-- Membuat indeks spasial untuk lokasi2
CREATE INDEX IF NOT EXISTS idx_lokasi2_geom ON lokasi2 USING GIST(geom);


-- 5. Membuat Tabel 'sekolah' (Untuk data titik sekolah terdaftar dari admin)
CREATE TABLE IF NOT EXISTS sekolah (
    id SERIAL PRIMARY KEY,
    nama_sekolah VARCHAR(255) NOT NULL,
    jenjang VARCHAR(50) NOT NULL, -- SD, SMP, SMA
    alamat TEXT,
    geom GEOMETRY(Point, 4326) NOT NULL
);

-- Membuat indeks spasial untuk sekolah
CREATE INDEX IF NOT EXISTS idx_sekolah_geom ON sekolah USING GIST(geom);


-- =====================================================================
-- KUMPULAN QUERY OPERASI SPASIAL OVERLAY (HASIL HIMPUNAN)
-- =====================================================================

-- Catatan:
-- :id_a = ID Wilayah A pada tabel lokasi2
-- :id_b = ID Wilayah B pada tabel lokasi2
-- :selected_schools = Array ID sekolah dari admin yang dipilih

-- A. Mendapatkan Geometri Hasil Operasi Spasial

-- 1. Hanya Wilayah A saja
SELECT ST_AsGeoJSON(a.geom) AS geom_json 
FROM lokasi2 a 
WHERE a.id = :id_a;

-- 2. Hanya Wilayah B saja
SELECT ST_AsGeoJSON(b.geom) AS geom_json 
FROM lokasi2 b 
WHERE b.id = :id_b;

-- 3. Wilayah A dan B (Union)
SELECT ST_AsGeoJSON(ST_Union(a.geom, b.geom)) AS geom_json 
FROM lokasi2 a, lokasi2 b 
WHERE a.id = :id_a AND b.id = :id_b;

-- 4. Wilayah A tetapi bukan B (Difference A - B)
SELECT ST_AsGeoJSON(ST_Difference(a.geom, b.geom)) AS geom_json 
FROM lokasi2 a, lokasi2 b 
WHERE a.id = :id_a AND b.id = :id_b;

-- 5. Wilayah B tetapi bukan A (Difference B - A)
SELECT ST_AsGeoJSON(ST_Difference(b.geom, a.geom)) AS geom_json 
FROM lokasi2 a, lokasi2 b 
WHERE a.id = :id_a AND b.id = :id_b;

-- 6. Selain Wilayah A dan B (Complement of Union / Outside)
-- Menggunakan envelope/pembatas bumi (-180, -90, 180, 90) sebagai referensi luar
SELECT ST_AsGeoJSON(ST_Difference(ST_SetSRID(ST_MakeEnvelope(-180, -90, 180, 90), 4326), ST_Union(a.geom, b.geom))) AS geom_json 
FROM lokasi2 a, lokasi2 b 
WHERE a.id = :id_a AND b.id = :id_b;

-- 7. Irisan A dan B (Intersection)
SELECT ST_AsGeoJSON(ST_Intersection(a.geom, b.geom)) AS geom_json 
FROM lokasi2 a, lokasi2 b 
WHERE a.id = :id_a AND b.id = :id_b;


-- B. Mendapatkan Titik Sekolah yang Berada di Dalam Hasil Geometri Spasial
-- (Ganti :geom_expr dengan fungsi spasial di atas, contoh ST_Intersection(a.geom, b.geom))

SELECT s.nama_sekolah, s.jenjang, s.alamat, ST_X(s.geom) AS lng, ST_Y(s.geom) AS lat, ST_AsGeoJSON(s.geom) AS geom_json
FROM sekolah s, lokasi2 a, lokasi2 b
WHERE a.id = :id_a AND b.id = :id_b
  AND s.id IN (:selected_schools)
  AND ST_Within(s.geom, :geom_expr);


-- C. Mendapatkan Titik Sekolah yang Berada di Dalam Kecamatan Tertentu (Filter Kecamatan Lama)
SELECT s.nama_sekolah, s.jenjang, s.alamat, ST_X(s.geom) AS lng, ST_Y(s.geom) AS lat
FROM sekolah s
JOIN kecamatan k ON ST_Contains(k.geom, s.geom)
WHERE k.id = :kecamatan_id;
