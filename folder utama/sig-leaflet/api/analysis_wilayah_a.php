<?php
// api/analysis_wilayah_a.php
header('Content-Type: application/json');
$pdo = require __DIR__ . '/../config/database.php';

$input = json_decode(file_get_contents('php://input'), true);
$wilayah_a = $input['wilayah_a'] ?? $_POST['wilayah_a'] ?? $_GET['wilayah_a'] ?? null;

if (empty($wilayah_a)) {
    echo json_encode(['status' => 'error', 'message' => 'Pilih Wilayah A terlebih dahulu.']);
    exit;
}

try {
    // 1. Ambil geometri Wilayah A
    $query_geom = "
        SELECT ST_AsGeoJSON(geom) AS geojson, group_id
        FROM wilayah
        WHERE id = :wilayah_a;
    ";
    
    $stmt = $pdo->prepare($query_geom);
    $stmt->execute([
        ':wilayah_a' => $wilayah_a
    ]);
    $row = $stmt->fetch();
    
    if (!$row) {
        echo json_encode(['status' => 'error', 'message' => 'Wilayah A tidak ditemukan.']);
        exit;
    }
    
    $result_geom = $row['geojson'];
    $group_id = $row['group_id'];

    // 2. Ambil marker yang berada di dalam Wilayah A
    $query_markers = "
        SELECT 
            m.id,
            m.nama_marker,
            m.deskripsi,
            ST_AsGeoJSON(m.geom) AS geojson
        FROM markers m
        WHERE m.group_id = :group_id
        AND ST_Within(m.geom, (SELECT geom FROM wilayah WHERE id = :wilayah_a));
    ";

    $stmt_markers = $pdo->prepare($query_markers);
    $stmt_markers->execute([
        ':group_id' => $group_id,
        ':wilayah_a' => $wilayah_a
    ]);
    $markers = $stmt_markers->fetchAll();

    foreach ($markers as &$m) {
        $m['geojson'] = json_decode($m['geojson']);
    }

    echo json_encode([
        'status' => 'success',
        'operation' => 'wilayah_a',
        'geometry' => $result_geom ? json_decode($result_geom) : null,
        'markers' => $markers
    ]);
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Gagal memuat analisis Wilayah A: ' . $e->getMessage()
    ]);
}
