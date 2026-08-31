<?php
// api/delete_drawing.php — Hapus gambar kustom dari tabel custom_drawings
header('Content-Type: application/json');

$pdo = require __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Method tidak diizinkan']); exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$id = isset($input['id']) ? (int)$input['id'] : null;

if (!$id) {
    echo json_encode(['status' => 'error', 'message' => 'ID tidak valid']); exit;
}

try {
    $stmt = $pdo->prepare("DELETE FROM custom_drawings WHERE id = :id");
    $stmt->execute([':id' => $id]);
    echo json_encode(['status' => 'success', 'message' => 'Gambar kustom berhasil dihapus']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
