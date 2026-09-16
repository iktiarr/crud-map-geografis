<?php
/**
 * db_config.php — Konfigurasi Terpusat Database PostgreSQL (Neon Cloud)
 * Otomatis membaca konfigurasi dari file .env di root project.
 */

if (!function_exists('get_db_config')) {
    function get_db_config() {
        static $config = null;
        if ($config !== null) {
            return $config;
        }

        // Cari file .env
        $possiblePaths = [
            __DIR__ . '/../.env',
            __DIR__ . '/../../.env',
            __DIR__ . '/.env',
            dirname(__DIR__) . '/.env'
        ];

        $envContent = '';
        foreach ($possiblePaths as $path) {
            if (file_exists($path)) {
                $envContent = file_get_contents($path);
                break;
            }
        }

        $dbUrl = '';
        if (!empty($envContent)) {
            if (preg_match('/DATABASE_URL=["\']?(.*?)["\']?$/m', $envContent, $m)) {
                $dbUrl = trim($m[1]);
            }
        }

        if (!empty($dbUrl)) {
            $parsed = parse_url($dbUrl);
            $config = [
                'host'     => $parsed['host'] ?? 'ep-still-paper-b3hcddot-pooler.c-4.ap-southeast-1.aws.neon.tech',
                'port'     => (string)($parsed['port'] ?? 5432),
                'dbname'   => ltrim($parsed['path'] ?? 'neondb', '/'),
                'user'     => $parsed['user'] ?? 'neondb_owner',
                'password' => $parsed['pass'] ?? 'npg_AD1Oa0sgyvtp',
                'sslmode'  => 'require',
            ];
        } else {
            // Default ke Neon aktif
            $config = [
                'host'     => 'ep-still-paper-b3hcddot-pooler.c-4.ap-southeast-1.aws.neon.tech',
                'port'     => '5432',
                'dbname'   => 'neondb',
                'user'     => 'neondb_owner',
                'password' => 'npg_AD1Oa0sgyvtp',
                'sslmode'  => 'require',
            ];
        }

        $config['conn_string'] = "host={$config['host']} port={$config['port']} dbname={$config['dbname']} user={$config['user']} password={$config['password']} sslmode={$config['sslmode']}";
        $config['dsn'] = "pgsql:host={$config['host']};port={$config['port']};dbname={$config['dbname']};sslmode={$config['sslmode']}";

        return $config;
    }
}

if (!function_exists('get_db_pdo')) {
    function get_db_pdo() {
        static $pdo = null;
        if ($pdo instanceof PDO) {
            return $pdo;
        }

        $cfg = get_db_config();
        try {
            $pdo = new PDO($cfg['dsn'], $cfg['user'], $cfg['password'], [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
            return $pdo;
        } catch (PDOException $e) {
            if (isset($_SERVER['REQUEST_URI']) && (strpos($_SERVER['REQUEST_URI'], '/api/') !== false || isset($_GET['action']))) {
                header('Content-Type: application/json', true, 500);
                echo json_encode(['status' => 'error', 'message' => 'Koneksi database PostgreSQL gagal: ' . $e->getMessage()]);
                exit;
            }
            die("<div style='background:#fee2e2;color:#991b1b;padding:1rem;border-radius:8px;font-family:sans-serif;'><b>Koneksi Database Gagal:</b><br>" . htmlspecialchars($e->getMessage()) . "</div>");
        }
    }
}

if (!function_exists('get_db_conn')) {
    function get_db_conn() {
        static $conn = null;
        if (is_resource($conn) || (is_object($conn) && get_class($conn) === 'PgSql\Connection')) {
            return $conn;
        }

        $cfg = get_db_config();
        $conn = @pg_connect($cfg['conn_string']);
        if (!$conn) {
            if (isset($_SERVER['REQUEST_URI']) && (strpos($_SERVER['REQUEST_URI'], '/api/') !== false || isset($_GET['action']))) {
                header('Content-Type: application/json', true, 500);
                echo json_encode(['status' => 'error', 'message' => 'Koneksi pg_connect gagal: ' . pg_last_error()]);
                exit;
            }
            die("<div style='background:#fee2e2;color:#991b1b;padding:1rem;border-radius:8px;font-family:sans-serif;'><b>Koneksi pg_connect Gagal:</b><br>" . htmlspecialchars(pg_last_error() ?: 'Unknown error') . "</div>");
        }
        return $conn;
    }
}

// Inisialisasi variabel global yang biasa dipakai script lama
$db_config = get_db_config();
$host      = $db_config['host'];
$port      = $db_config['port'];
$dbname    = $db_config['dbname'];
$user      = $db_config['user'];
$password  = $db_config['password'];
$conn_details = $db_config['conn_string'];
