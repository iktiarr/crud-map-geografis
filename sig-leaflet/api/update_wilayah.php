<?php
// api/update_wilayah.php
header('Content-Type: application/json');
$pdo = require __DIR__ . '/../config/database.php';

$input = json_decode(file_get_contents('php://input'), true);
$id = $input['id'] ?? $_POST['id'] ?? null;
$nama_wilayah = $input['nama_wilayah'] ?? $_POST['nama_wilayah'] ?? null;

if (empty($id) || empty($nama_wilayah)) {
    echo json_encode(['status' => 'error', 'message' => 'Parameter id dan nama_wilayah wajib diisi.']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE wilayah SET nama_wilayah = :nama_wilayah WHERE id = :id");
    $stmt->execute([
        ':nama_wilayah' => $nama_wilayah,
        ':id' => $id
    ]);

    echo json_encode([
        'status' => 'success',
        'message' => 'Wilayah berhasil diubah.'
    ]);
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Gagal mengubah wilayah: ' . $e->getMessage()
    ]);
}
