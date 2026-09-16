<?php
// setup_db.php

$host = 'localhost';
$port = '5432';
$user = 'postgres';
$password = 'admin123';
$dbname = 'himpunan';

try {
    // 1. Koneksi ke PostgreSQL Server (menggunakan database default 'postgres')
    echo "Menghubungkan ke server PostgreSQL...\n";
    $dsn_server = "pgsql:host=$host;port=$port;dbname=postgres";
    $pdo_server = new PDO($dsn_server, $user, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    // Cek apakah database 'himpunan' sudah ada
    $stmt = $pdo_server->query("SELECT 1 FROM pg_database WHERE datname = '$dbname'");
    $db_exists = $stmt->fetchColumn();

    if (!$db_exists) {
        echo "Membuat database '$dbname'...\n";
        $pdo_server->exec("CREATE DATABASE $dbname");
        echo "Database '$dbname' berhasil dibuat.\n";
    } else {
        echo "Database '$dbname' sudah terdeteksi.\n";
    }
    
    // Putus koneksi server postgres
    $pdo_server = null;

    // 2. Koneksi ke database 'himpunan'
    echo "Menghubungkan ke database '$dbname'...\n";
    $dsn_db = "pgsql:host=$host;port=$port;dbname=$dbname";
    $pdo_db = new PDO($dsn_db, $user, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    // 3. Aktifkan ekstensi PostGIS jika belum aktif
    echo "Mengaktifkan extension PostGIS (jika belum aktif)...\n";
    $pdo_db->exec("CREATE EXTENSION IF NOT EXISTS postgis");
    echo "Extension PostGIS aktif.\n";

    // 4. Membaca dan menjalankan file database.sql
    $sql_path = __DIR__ . '/database.sql';
    if (!file_exists($sql_path)) {
        throw new Exception("File database.sql tidak ditemukan di $sql_path");
    }

    echo "Membaca file database.sql...\n";
    $sql = file_get_contents($sql_path);

    // Hapus command meta-psql seperti \c jika ada
    $lines = explode("\n", $sql);
    $clean_lines = array_filter($lines, function($line) {
        $trimmed = trim($line);
        // Abaikan psql meta commands
        return strpos($trimmed, '\\') !== 0;
    });
    $sql_clean = implode("\n", $clean_lines);

    echo "Membuat tabel dan index...\n";
    $pdo_db->exec($sql_clean);
    echo "Tabel dan index berhasil dibuat di database '$dbname'!\n";
    
    echo "\n==========================================\n";
    echo "SETUP DATABASE SELESAI DENGAN SUKSES!\n";
    echo "==========================================\n";

} catch (Exception $e) {
    echo "\n[ERROR] SETUP DATABASE GAGAL: " . $e->getMessage() . "\n";
    exit(1);
}
