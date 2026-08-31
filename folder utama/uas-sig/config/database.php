<?php
// config/database.php
// Mendukung koneksi ke Neon (cloud) dan lokal secara bersamaan

// =====================================================
// MODE: 'neon' atau 'local'
// =====================================================
define('DB_MODE', 'neon'); // Ganti ke 'local' jika pakai lokal

// =====================================================
// KONFIGURASI NEON (Cloud PostgreSQL)
// =====================================================
$neon_config = [
    'host'     => 'ep-twilight-hill-aopc56nx-pooler.c-2.ap-southeast-1.aws.neon.tech',
    'port'     => '5432',
    'dbname'   => 'peta',
    'user'     => 'neondb_owner',
    'password' => 'npg_PEShmOx94tXD',
    'sslmode'  => 'require',
];

// =====================================================
// KONFIGURASI LOKAL (localhost PostgreSQL)
// =====================================================
$local_config = [
    'host'     => 'localhost',
    'port'     => '5432',
    'dbname'   => 'peta',
    'user'     => 'postgres',
    'password' => 'admin123',
    'sslmode'  => 'disable',
];

// Pilih konfigurasi berdasarkan mode
$cfg = (DB_MODE === 'neon') ? $neon_config : $local_config;

try {
    $dsn  = "pgsql:host={$cfg['host']};port={$cfg['port']};dbname={$cfg['dbname']};sslmode={$cfg['sslmode']}";
    $pdo  = new PDO($dsn, $cfg['user'], $cfg['password'], [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
    return $pdo;
} catch (PDOException $e) {
    // Jika dipanggil dari API → kembalikan JSON error
    if (strpos($_SERVER['REQUEST_URI'] ?? '', '/api/') !== false) {
        header('Content-Type: application/json', true, 500);
        echo json_encode(['status' => 'error', 'message' => 'Koneksi database gagal: ' . $e->getMessage()]);
        exit;
    }
    die("<div style='color:red;padding:1rem;font-family:sans-serif;'><b>Koneksi Database Gagal:</b><br>" . htmlspecialchars($e->getMessage()) . "</div>");
}
