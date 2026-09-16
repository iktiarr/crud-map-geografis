<?php
// api/delete_custom_geometry.php — Hapus data gambar kustom berdasarkan ID dan Tipe
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$pdo = require __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Method tidak diizinkan']); exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$id    = (int)($input['id'] ?? 0);
$type  = $input['type'] ?? '';

if ($id <= 0 || empty($type)) {
    echo json_encode(['status' => 'error', 'message' => 'Parameter tidak lengkap']); exit;
}

try {
    if ($type === 'polygon') {
        $stmt = $pdo->prepare("DELETE FROM custom_polygons WHERE id = :id");
    } elseif ($type === 'polyline') {
        $stmt = $pdo->prepare("DELETE FROM custom_polylines WHERE id = :id");
    } elseif ($type === 'marker') {
        $stmt = $pdo->prepare("DELETE FROM custom_markers WHERE id = :id");
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Tipe tidak valid']); exit;
    }

    $stmt->execute([':id' => $id]);
    echo json_encode(['status' => 'success', 'message' => 'Elemen kustom berhasil dihapus']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
