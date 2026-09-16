<?php
// api/save_manual_facility.php — Simpan data fasilitas manual ke PostGIS
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$pdo = require __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Method tidak diizinkan']); exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$nama  = trim($input['nama'] ?? '');
$wkt   = trim($input['wkt'] ?? '');

if (empty($nama) || empty($wkt)) {
    echo json_encode(['status' => 'error', 'message' => 'Parameter tidak lengkap']); exit;
}

try {
    // Sanitasi nama tabel untuk PostgreSQL
    $tableName = preg_replace('/[^a-zA-Z0-9_]/', '_', strtolower($nama));
    $tableName = preg_replace('/_+/', '_', $tableName);
    $tableName = trim($tableName, '_');

    if (empty($tableName)) {
        echo json_encode(['status' => 'error', 'message' => 'Nama tidak valid untuk dijadikan tabel']); exit;
    }

    if (in_array(strtolower($tableName), ['import_metadata', 'spatial_ref_sys', 'kecamatan', 'fasilitas_kesehatan'])) {
        echo json_encode(['status' => 'error', 'message' => 'Nama tabel dilindungi oleh sistem']); exit;
    }

    // 1. Pastikan tabel kustom dinamis sudah ada
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS \"$tableName\" (
            id SERIAL PRIMARY KEY,
            nama VARCHAR(255) NOT NULL,
            geom GEOMETRY(MultiPoint, 4326),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS \"idx_{$tableName}_geom\" ON \"$tableName\" USING GIST(geom);
    ");

    // 2. Simpan data manual
    $stmt = $pdo->prepare("INSERT INTO \"$tableName\" (nama, geom) VALUES (:nama, ST_GeomFromText(:wkt, 4326))");
    $stmt->execute([':nama' => $nama, ':wkt' => $wkt]);

    echo json_encode([
        'status' => 'success', 
        'message' => "Fasilitas berhasil disimpan ke dalam tabel kustom '$tableName'",
        'table' => $tableName
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
