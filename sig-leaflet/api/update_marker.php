<?php
// api/update_marker.php
header('Content-Type: application/json');
$pdo = require __DIR__ . '/../config/database.php';

$input = json_decode(file_get_contents('php://input'), true);
$id = $input['id'] ?? $_POST['id'] ?? null;
$nama_marker = $input['nama_marker'] ?? $_POST['nama_marker'] ?? null;

if (empty($id) || empty($nama_marker)) {
    echo json_encode(['status' => 'error', 'message' => 'Parameter id dan nama_marker wajib diisi.']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE markers SET nama_marker = :nama_marker WHERE id = :id");
    $stmt->execute([
        ':nama_marker' => $nama_marker,
        ':id' => $id
    ]);

    echo json_encode([
        'status' => 'success',
        'message' => 'Marker berhasil diubah.'
    ]);
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Gagal mengubah marker: ' . $e->getMessage()
    ]);
}
