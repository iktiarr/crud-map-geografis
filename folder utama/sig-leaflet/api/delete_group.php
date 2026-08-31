<?php
// api/delete_group.php
header('Content-Type: application/json');
$pdo = require __DIR__ . '/../config/database.php';

$input = json_decode(file_get_contents('php://input'), true);
$id = $input['id'] ?? $_POST['id'] ?? $_GET['id'] ?? null;

if (empty($id)) {
    echo json_encode(['status' => 'error', 'message' => 'ID group tidak valid.']);
    exit;
}

try {
    $stmt = $pdo->prepare("DELETE FROM groups WHERE id = :id");
    $stmt->execute([':id' => $id]);

    echo json_encode([
        'status' => 'success',
        'message' => 'Group berhasil dihapus.'
    ]);
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Gagal menghapus group: ' . $e->getMessage()
    ]);
}
