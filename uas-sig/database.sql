-- =====================================================
-- DATABASE DDL — Web GIS UAS
-- Tema: Fasilitas Kesehatan per Kecamatan
-- Database: peta (Neon Cloud / Lokal)
-- =====================================================

-- 1. Aktifkan PostGIS (wajib)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 3. Hapus tabel lama jika ada (reset) — urutan penting: child dulu, baru parent
DROP TABLE IF EXISTS fasilitas_kesehatan CASCADE;
DROP TABLE IF EXISTS kecamatan CASCADE;

-- =====================================================
-- 3. Tabel KECAMATAN (Data Spasial: Polygon Wilayah)
-- =====================================================
CREATE TABLE kecamatan (
    id              SERIAL PRIMARY KEY,
    nama_kecamatan  VARCHAR(100) NOT NULL,
    kode_kecamatan  VARCHAR(20),
    kabupaten       VARCHAR(100),
    provinsi        VARCHAR(100) DEFAULT 'Jawa Barat',
    geom            GEOMETRY(MultiPolygon, 4326),  -- Kolom Spasial (Polygon wilayah)
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. Tabel FASILITAS KESEHATAN (Data Spasial: Point + Tabular)
-- =====================================================
CREATE TABLE fasilitas_kesehatan (
    id              SERIAL PRIMARY KEY,
    nama            VARCHAR(255) NOT NULL,           -- Kolom Tabular
    jenis           VARCHAR(50)  NOT NULL            -- 'Puskesmas' | 'Rumah Sakit' | 'Klinik'
                    CHECK (jenis IN ('Puskesmas', 'Rumah Sakit', 'Klinik', 'Apotek')),
    alamat          TEXT,                            -- Kolom Tabular
    telepon         VARCHAR(20),                     -- Kolom Tabular
    status          VARCHAR(30) DEFAULT 'Aktif'      -- 'Aktif' | 'Tidak Aktif'
                    CHECK (status IN ('Aktif', 'Tidak Aktif')),
    kecamatan_id    INT REFERENCES kecamatan(id) ON DELETE SET NULL,
    geom            GEOMETRY(Point, 4326),           -- Kolom Spasial (Titik lokasi)
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 5. Spatial Index (Optimasi Query Spasial)
-- =====================================================
CREATE INDEX idx_kecamatan_geom      ON kecamatan USING GIST(geom);
CREATE INDEX idx_fasilitas_geom      ON fasilitas_kesehatan USING GIST(geom);
CREATE INDEX idx_fasilitas_kec_id   ON fasilitas_kesehatan(kecamatan_id);

-- =====================================================
-- DATABASE READY FOR CUSTOM DATA
-- =====================================================
-- (Tabel kecamatan dan fasilitas_kesehatan dikosongkan agar Anda dapat mengisinya secara manual atau melalui Shapefile)

