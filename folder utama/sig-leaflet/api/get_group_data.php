<?php
// api/get_group_data.php
header('Content-Type: application/json');
$pdo = require __DIR__ . '/../config/database.php';

$group_id = $_GET['group_id'] ?? null;

if (empty($group_id)) {
    echo json_encode(['status' => 'error', 'message' => 'Parameter group_id wajib diisi.']);
    exit;
}

try {
    // 1. Ambil data group
    $stmt = $pdo->prepare("SELECT * FROM groups WHERE id = :group_id");
    $stmt->execute([':group_id' => $group_id]);
    $group = $stmt->fetch();

    if (!$group) {
        echo json_encode(['status' => 'error', 'message' => 'Group tidak ditemukan.']);
        exit;
    }



    // 3. Ambil data wilayah
    $stmt = $pdo->prepare("SELECT id, nama_wilayah, ST_AsGeoJSON(geom) AS geojson FROM wilayah WHERE group_id = :group_id ORDER BY id ASC");
    $stmt->execute([':group_id' => $group_id]);
    $wilayah = $stmt->fetchAll();
    foreach ($wilayah as &$w) {
        $w['geojson'] = json_decode($w['geojson']);
    }

    // 4. Ambil data markers
    $stmt = $pdo->prepare("SELECT id, nama_marker, deskripsi, ST_AsGeoJSON(geom) AS geojson FROM markers WHERE group_id = :group_id ORDER BY id ASC");
    $stmt->execute([':group_id' => $group_id]);
    $markers = $stmt->fetchAll();
    foreach ($markers as &$m) {
        $m['geojson'] = json_decode($m['geojson']);
    }

    echo json_encode([
        'status' => 'success',
        'data' => [
            'group' => $group,
            'wilayah' => $wilayah,
            'markers' => $markers
        ]
    ]);
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Gagal memuat data group: ' . $e->getMessage()
    ]);
}
