<?php
// api/delete_boundary.php
header('Content-Type: application/json');
$pdo = require __DIR__ . '/../config/database.php';

$input = json_decode(file_get_contents('php://input'), true);
$group_id = $input['group_id'] ?? $_POST['group_id'] ?? $_GET['group_id'] ?? null;

if (empty($group_id)) {
    echo json_encode(['status' => 'error', 'message' => 'ID group tidak valid.']);
    exit;
}

try {
    $stmt = $pdo->prepare("DELETE FROM group_boundary WHERE group_id = :group_id");
    $stmt->execute([':group_id' => $group_id]);

    echo json_encode([
        'status' => 'success',
        'message' => 'Batas acuan berhasil dihapus.'
    ]);
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Gagal menghapus batas acuan: ' . $e->getMessage()
    ]);
}
