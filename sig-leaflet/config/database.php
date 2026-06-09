<?php
// config/database.php

$db_config = [
    'host' => 'localhost',
    'port' => '5432',
    'dbname' => 'himpunan',
    'user' => 'postgres',
    'password' => 'admin123'
];

try {
    $dsn = "pgsql:host=" . $db_config['host'] . ";port=" . $db_config['port'] . ";dbname=" . $db_config['dbname'];
    $pdo = new PDO($dsn, $db_config['user'], $db_config['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    return $pdo;
} catch (PDOException $e) {
    // Return standard JSON error if this is called from API
    if (strpos($_SERVER['REQUEST_URI'] ?? '', '/api/') !== false) {
        header('Content-Type: application/json', true, 500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Koneksi database gagal: ' . $e->getMessage()
        ]);
        exit;
    }
    // Return standard HTML error if called from a page
    die("Koneksi database gagal: " . $e->getMessage());
}
