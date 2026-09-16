<?php
// api/delete_row.php — Hapus baris dari tabel apa saja secara dinamis
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$pdo = require __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Method tidak diizinkan']); exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$table = $input['table'] ?? '';
$id    = $input['id'] ?? 0;

$table = preg_replace('/[^a-zA-Z0-9_]/', '', $table);
$id    = (int)$id;

if (empty($table) || $id <= 0) {
    echo json_encode(['status' => 'error', 'message' => 'Parameter tidak valid']); exit;
}

try {
    // Jalankan delete query
    $stmt = $pdo->prepare("DELETE FROM \"$table\" WHERE id = :id");
    $stmt->execute([':id' => $id]);

    echo json_encode([
        'status' => 'success',
        'message' => 'Data berhasil dihapus'
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
