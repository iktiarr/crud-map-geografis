<?php
/**
 * db.php - Database Connection & Schema
 * GIS Manager | Open Source Edition
 */

$db_config = [
    'host'     => 'localhost',
    'port'     => '5432',
    'dbname'   => 'uts_sig',
    'user'     => 'postgres',
    'password' => 'admin123'
];

$conn = @pg_connect("host={$db_config['host']} port={$db_config['port']} dbname={$db_config['dbname']} user={$db_config['user']} password={$db_config['password']}");

if (!$conn) {
    // Attempt to create the database if it doesn't exist
    $conn_temp = @pg_connect("host={$db_config['host']} port={$db_config['port']} dbname=postgres user={$db_config['user']} password={$db_config['password']}");
    if ($conn_temp) {
        @pg_query($conn_temp, 'CREATE DATABASE uts_sig');
        @pg_close($conn_temp);
        $conn = @pg_connect("host={$db_config['host']} port={$db_config['port']} dbname={$db_config['dbname']} user={$db_config['user']} password={$db_config['password']}");
    }
}

if (!$conn) {
    die(json_encode(['status' => 'error', 'message' => 'Koneksi Database Gagal: ' . pg_last_error()]));
}

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
