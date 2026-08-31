<?php
// api/delete_jenis.php — Hapus semua baris dengan jenis tertentu dari suatu tabel
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Metode request tidak valid']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$table = $input['table'] ?? '';
$jenis = $input['jenis'] ?? '';
$column = $input['column'] ?? 'jenis';

if (empty($table) || empty($jenis)) {
    echo json_encode(['status' => 'error', 'message' => 'Nama tabel dan jenis wajib diisi']);
    exit;
}

// Sanitasi nama tabel
$cleanTable = strtolower(trim($table));
if (!preg_match('/^[a-z0-9_]+$/', $cleanTable) || in_array($cleanTable, ['spatial_ref_sys'])) {
    echo json_encode(['status' => 'error', 'message' => 'Nama tabel tidak valid']);
    exit;
}

// Sanitasi nama kolom
$cleanColumn = strtolower(trim($column));
if (!preg_match('/^[a-z0-9_]+$/', $cleanColumn)) {
    echo json_encode(['status' => 'error', 'message' => 'Nama kolom tidak valid']);
    exit;
}

try {
    $pdo = require '../config/database.php';
    
    // Pastikan kolom ada di tabel tersebut
    $colCheck = $pdo->prepare("
        SELECT COUNT(*) 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = ? 
          AND column_name = ?
    ");
    $colCheck->execute([$cleanTable, $cleanColumn]);
    if ($colCheck->fetchColumn() == 0) {
        echo json_encode(['status' => 'error', 'message' => 'Tabel tidak memiliki kolom tersebut']);
        exit;
    }
    
    // Jalankan query delete
    $stmt = $pdo->prepare("DELETE FROM \"{$cleanTable}\" WHERE \"{$cleanColumn}\" = ?");
    $stmt->execute([$jenis]);
    $count = $stmt->rowCount();
    
    echo json_encode([
        'status' => 'success',
        'message' => "Berhasil menghapus {$count} data dengan jenis '{$jenis}' dari tabel '{$cleanTable}'."
    ]);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
