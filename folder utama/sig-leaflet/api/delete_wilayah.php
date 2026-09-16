<?php
// api/delete_wilayah.php
header('Content-Type: application/json');
$pdo = require __DIR__ . '/../config/database.php';

$input = json_decode(file_get_contents('php://input'), true);
$id = $input['id'] ?? $_POST['id'] ?? $_GET['id'] ?? null;

if (empty($id)) {
    echo json_encode(['status' => 'error', 'message' => 'ID wilayah tidak valid.']);
    exit;
}

try {
    $stmt = $pdo->prepare("DELETE FROM wilayah WHERE id = :id");
    $stmt->execute([':id' => $id]);

    echo json_encode([
        'status' => 'success',
        'message' => 'Wilayah berhasil dihapus.'
    ]);
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Gagal menghapus wilayah: ' . $e->getMessage()
    ]);
}
