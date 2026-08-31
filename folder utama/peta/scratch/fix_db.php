<?php
$host = 'localhost';
$port = '5432';
$user = 'postgres';
$password = 'admin123';

// Connect to postgres to create new database
$conn = @pg_connect("host=$host port=$port dbname=postgres user=$user password=$password");

if (!$conn) {
    die("Koneksi gagal: " . pg_last_error());
}

// Check if database exists
$check = pg_query($conn, "SELECT 1 FROM pg_database WHERE datname = 'crud-map'");
if (pg_num_rows($check) == 0) {
    $res = pg_query($conn, "CREATE DATABASE \"crud-map\"");
    if ($res) {
        echo "Database 'crud-map' berhasil dibuat.\n";
    } else {
        echo "Gagal membuat database: " . pg_last_error($conn) . "\n";
    }
} else {
    echo "Database 'crud-map' sudah ada.\n";
}

pg_close($conn);

// Connect to the new database to create table
$conn2 = @pg_connect("host=$host port=$port dbname=crud-map user=$user password=$password");
if (!$conn2) {
    die("Koneksi ke 'crud-map' gagal: " . pg_last_error());
}

// Create table without deskripsi
$sql = "
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE TABLE IF NOT EXISTS markers (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(255),
    tipe VARCHAR(50) NOT NULL,
    geom GEOMETRY NOT NULL
);
CREATE INDEX IF NOT EXISTS markers_geom_idx ON markers USING GIST (geom);
";

$res2 = pg_query($conn2, $sql);
if ($res2) {
    echo "Tabel 'markers' di database 'crud-map' berhasil dibuat.\n";
} else {
    echo "Gagal membuat tabel: " . pg_last_error($conn2) . "\n";
}
?>
