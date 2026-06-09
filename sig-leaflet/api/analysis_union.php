<?php
// api/analysis_union.php
header('Content-Type: application/json');
$pdo = require __DIR__ . '/../config/database.php';

$input = json_decode(file_get_contents('php://input'), true);
$wilayah_a = $input['wilayah_a'] ?? $_POST['wilayah_a'] ?? $_GET['wilayah_a'] ?? null;
$wilayah_b = $input['wilayah_b'] ?? $_POST['wilayah_b'] ?? $_GET['wilayah_b'] ?? null;

if (empty($wilayah_a) || empty($wilayah_b)) {
    echo json_encode(['status' => 'error', 'message' => 'Pilih Wilayah A dan Wilayah B terlebih dahulu.']);
    exit;
}

try {
    // 1. Hitung gabungan wilayah (A U B)
    $query_geom = "
        WITH selected AS (
            SELECT
                a.geom AS geom_a,
                b.geom AS geom_b
            FROM wilayah a
            JOIN wilayah b ON a.group_id = b.group_id
            WHERE a.id = :wilayah_a
            AND b.id = :wilayah_b
        )
        SELECT ST_AsGeoJSON(ST_Union(geom_a, geom_b)) AS geojson
        FROM selected;
    ";
    
    $stmt = $pdo->prepare($query_geom);
    $stmt->execute([
        ':wilayah_a' => $wilayah_a,
        ':wilayah_b' => $wilayah_b
    ]);
    $result_geom = $stmt->fetchColumn();

    // 2. Ambil marker yang berada di dalam gabungan
    $query_markers = "
        WITH selected AS (
            SELECT
                ST_Union(a.geom, b.geom) AS hasil_geom,
                a.group_id
            FROM wilayah a
            JOIN wilayah b ON a.group_id = b.group_id
            WHERE a.id = :wilayah_a
            AND b.id = :wilayah_b
        )
        SELECT 
            m.id,
            m.nama_marker,
            m.deskripsi,
            ST_AsGeoJSON(m.geom) AS geojson
        FROM markers m
        JOIN selected s ON m.group_id = s.group_id
        WHERE ST_Within(m.geom, s.hasil_geom);
    ";

    $stmt_markers = $pdo->prepare($query_markers);
    $stmt_markers->execute([
        ':wilayah_a' => $wilayah_a,
        ':wilayah_b' => $wilayah_b
    ]);
    $markers = $stmt_markers->fetchAll();

    foreach ($markers as &$m) {
        $m['geojson'] = json_decode($m['geojson']);
    }

    echo json_encode([
        'status' => 'success',
        'operation' => 'union',
        'geometry' => $result_geom ? json_decode($result_geom) : null,
        'markers' => $markers
    ]);
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Gagal melakukan analisis gabungan: ' . $e->getMessage()
    ]);
}
