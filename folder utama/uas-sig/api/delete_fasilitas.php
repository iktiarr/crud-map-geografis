<?php
// api/delete_fasilitas.php — Hapus fasilitas
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

$pdo  = require __DIR__ . '/../config/database.php';
$body = json_decode(file_get_contents('php://input'), true);
$id   = $body['id'] ?? null;

if (!$id) {
    echo json_encode(['status' => 'error', 'message' => 'ID wajib diisi']); exit;
}

try {
    $stmt = $pdo->prepare("DELETE FROM fasilitas_kesehatan WHERE id = :id");
    $stmt->execute([':id' => (int)$id]);

    if ($stmt->rowCount() === 0) {
        echo json_encode(['status' => 'error', 'message' => 'Data tidak ditemukan']);
    } else {
        echo json_encode(['status' => 'success', 'message' => 'Fasilitas berhasil dihapus']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
