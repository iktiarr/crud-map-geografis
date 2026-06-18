<?php
// api/analysis_wilayah_b.php
header('Content-Type: application/json');
$pdo = require __DIR__ . '/../config/database.php';

$input = json_decode(file_get_contents('php://input'), true);
$wilayah_b = $input['wilayah_b'] ?? $_POST['wilayah_b'] ?? $_GET['wilayah_b'] ?? null;

if (empty($wilayah_b)) {
    echo json_encode(['status' => 'error', 'message' => 'Pilih Wilayah B terlebih dahulu.']);
    exit;
}

try {
    // 1. Ambil geometri Wilayah B
    $query_geom = "
        SELECT ST_AsGeoJSON(geom) AS geojson, group_id
        FROM wilayah
        WHERE id = :wilayah_b;
    ";
    
    $stmt = $pdo->prepare($query_geom);
    $stmt->execute([
        ':wilayah_b' => $wilayah_b
    ]);
    $row = $stmt->fetch();
    
    if (!$row) {
        echo json_encode(['status' => 'error', 'message' => 'Wilayah B tidak ditemukan.']);
        exit;
    }
    
    $result_geom = $row['geojson'];
    $group_id = $row['group_id'];

    // 2. Ambil marker yang berada di dalam Wilayah B
    $query_markers = "
        SELECT 
            m.id,
            m.nama_marker,
            m.deskripsi,
            ST_AsGeoJSON(m.geom) AS geojson
        FROM markers m
        WHERE m.group_id = :group_id
        AND ST_Within(m.geom, (SELECT geom FROM wilayah WHERE id = :wilayah_b));
    ";

    $stmt_markers = $pdo->prepare($query_markers);
    $stmt_markers->execute([
        ':group_id' => $group_id,
        ':wilayah_b' => $wilayah_b
    ]);
    $markers = $stmt_markers->fetchAll();

    foreach ($markers as &$m) {
        $m['geojson'] = json_decode($m['geojson']);
    }

    echo json_encode([
        'status' => 'success',
        'operation' => 'wilayah_b',
        'geometry' => $result_geom ? json_decode($result_geom) : null,
        'markers' => $markers
    ]);
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Gagal memuat analisis Wilayah B: ' . $e->getMessage()
    ]);
}
