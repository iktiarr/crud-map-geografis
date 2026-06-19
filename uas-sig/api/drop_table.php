<?php
// api/drop_table.php — Hapus tabel kustom hasil import
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Metode request tidak valid']);
    exit;
}

// Ambil input JSON
$input = json_decode(file_get_contents('php://input'), true);
$table = $input['table'] ?? '';

if (empty($table)) {
    echo json_encode(['status' => 'error', 'message' => 'Nama tabel tidak boleh kosong']);
    exit;
}

// Validasi untuk mencegah SQL injection dan penghapusan tabel sistem
$cleanTable = strtolower(trim($table));
if (in_array($cleanTable, ['kecamatan', 'fasilitas_kesehatan', 'spatial_ref_sys', 'import_metadata'])) {
    echo json_encode(['status' => 'error', 'message' => 'Tabel sistem utama tidak boleh dihapus!']);
    exit;
}

// Hanya izinkan nama tabel berupa huruf, angka, dan underscore
if (!preg_match('/^[a-z0-9_]+$/', $cleanTable)) {
    echo json_encode(['status' => 'error', 'message' => 'Nama tabel tidak valid']);
    exit;
}

try {
    $pdo = require '../config/database.php';
    
    // Drop table safely
    $pdo->exec("DROP TABLE IF EXISTS \"" . $cleanTable . "\" CASCADE;");
    
    // Cleanup import_metadata
    try {
        $pdo->exec("DELETE FROM import_metadata WHERE table_name = " . $pdo->quote($cleanTable));
    } catch (Exception $metaErr) {
        // Ignore if import_metadata doesn't exist
    }
    
    echo json_encode([
        'status' => 'success', 
        'message' => "Tabel '{$cleanTable}' berhasil dihapus dari database."
    ]);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
