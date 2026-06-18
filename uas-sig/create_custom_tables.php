<?php
// create_custom_tables.php — Setup custom drawing tables for uas-sig
$pdo = require __DIR__ . '/config/database.php';

try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS custom_polygons (
            id SERIAL PRIMARY KEY,
            nama_wilayah VARCHAR(255) NOT NULL,
            geom GEOMETRY(Polygon, 4326),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS custom_polylines (
            id SERIAL PRIMARY KEY,
            nama_polyline VARCHAR(255) NOT NULL,
            geom GEOMETRY(LineString, 4326),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS custom_markers (
            id SERIAL PRIMARY KEY,
            nama_marker VARCHAR(255) NOT NULL,
            deskripsi TEXT,
            geom GEOMETRY(Point, 4326),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Tabel Baru untuk Fitur Keempat: Buat Gambar
        CREATE TABLE IF NOT EXISTS custom_drawings (
            id SERIAL PRIMARY KEY,
            nama VARCHAR(255) NOT NULL,
            tipe VARCHAR(50) NOT NULL,
            warna VARCHAR(50) DEFAULT '#ef4444',
            deskripsi TEXT,
            geom GEOMETRY(GEOMETRY, 4326),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_custom_polygons_geom ON custom_polygons USING GIST(geom);
        CREATE INDEX IF NOT EXISTS idx_custom_polylines_geom ON custom_polylines USING GIST(geom);
        CREATE INDEX IF NOT EXISTS idx_custom_markers_geom ON custom_markers USING GIST(geom);
        CREATE INDEX IF NOT EXISTS idx_custom_drawings_geom ON custom_drawings USING GIST(geom);
    ");
    echo "Custom tables created successfully!\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
