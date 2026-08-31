<?php
// api/create_group.php
header('Content-Type: application/json');
$pdo = require __DIR__ . '/../config/database.php';

// Mendukung JSON input maupun x-www-form-urlencoded
$input = json_decode(file_get_contents('php://input'), true);
$nama_group = $input['nama_group'] ?? $_POST['nama_group'] ?? null;
$deskripsi = $input['deskripsi'] ?? $_POST['deskripsi'] ?? null;

if (empty($nama_group)) {
    echo json_encode(['status' => 'error', 'message' => 'Nama group wajib diisi.']);
    exit;
}

try {
    $stmt = $pdo->prepare("INSERT INTO groups (nama_group, deskripsi) VALUES (:nama_group, :deskripsi) RETURNING id");
    $stmt->execute([
        ':nama_group' => $nama_group,
        ':deskripsi' => $deskripsi
    ]);
    $id = $stmt->fetchColumn();

    echo json_encode([
        'status' => 'success',
        'message' => 'Group berhasil dibuat.',
        'data' => [
            'id' => $id,
            'nama_group' => $nama_group,
            'deskripsi' => $deskripsi
        ]
    ]);
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Gagal membuat group: ' . $e->getMessage()
    ]);
}
