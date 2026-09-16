<?php
/**
 * db.php - Database Connection & Schema
 * GIS Manager | Open Source Edition
 */

require_once __DIR__ . '/../db_config.php';
$conn = get_db_conn();


// Enable PostGIS extension
@pg_query($conn, "CREATE EXTENSION IF NOT EXISTS postgis");

// Create and upgrade markers table
pg_query($conn, "CREATE TABLE IF NOT EXISTS markers (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(255),
    warna VARCHAR(50) DEFAULT '#10b981',
    geom GEOMETRY(GEOMETRY, 4326)
)");

// Dynamic column upgrades
pg_query($conn, "ALTER TABLE markers ADD COLUMN IF NOT EXISTS warna VARCHAR(50) DEFAULT '#10b981'");
pg_query($conn, "ALTER TABLE markers ADD COLUMN IF NOT EXISTS radius FLOAT DEFAULT NULL");
pg_query($conn, "ALTER TABLE markers ADD COLUMN IF NOT EXISTS tipe_layer VARCHAR(50) DEFAULT 'geojson'");
pg_query($conn, "ALTER TABLE markers ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL");
pg_query($conn, "ALTER TABLE markers ADD COLUMN IF NOT EXISTS deskripsi TEXT DEFAULT NULL");
