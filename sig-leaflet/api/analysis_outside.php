<?php
// api/analysis_outside.php
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
    // 1. Hitung area di luar A dan B menggunakan Bounding Box Dinamis: Envelope(Union(A, B) + Buffer) - (A U B)
    $query_geom = "
        WITH selected AS (
            SELECT
                a.geom AS geom_a,
                b.geom AS geom_b
            FROM wilayah a
            JOIN wilayah b ON a.group_id = b.group_id
            WHERE a.id = :wilayah_a
            AND b.id = :wilayah_b
        ),
        envelope AS (
            SELECT
                ST_Envelope(ST_Buffer(ST_Union(geom_a, geom_b), 0.05)) AS boundary_geom,
                geom_a,
                geom_b
            FROM selected
            GROUP BY geom_a, geom_b
        )
        SELECT ST_AsGeoJSON(
            ST_Difference(
                boundary_geom,
                ST_Union(geom_a, geom_b)
            )
        ) AS geojson
        FROM envelope;
    ";
    
    $stmt = $pdo->prepare($query_geom);
    $stmt->execute([
        ':wilayah_a' => $wilayah_a,
        ':wilayah_b' => $wilayah_b
    ]);
    $result_geom = $stmt->fetchColumn();

    // 2. Ambil marker yang berada di luar area A dan B tetapi tetap di dalam Bounding Box Dinamis
    $query_markers = "
        WITH selected AS (
            SELECT
                a.geom AS geom_a,
                b.geom AS geom_b,
                a.group_id
            FROM wilayah a
            JOIN wilayah b ON a.group_id = b.group_id
            WHERE a.id = :wilayah_a
            AND b.id = :wilayah_b
        ),
        envelope AS (
            SELECT
                ST_Difference(
                    ST_Envelope(ST_Buffer(ST_Union(geom_a, geom_b), 0.05)),
                    ST_Union(geom_a, geom_b)
                ) AS hasil_geom,
                group_id
            FROM selected
            GROUP BY geom_a, geom_b, group_id
        )
        SELECT 
            m.id,
            m.nama_marker,
            m.deskripsi,
            ST_AsGeoJSON(m.geom) AS geojson
        FROM markers m
        JOIN envelope e ON m.group_id = e.group_id
        WHERE ST_Within(m.geom, e.hasil_geom);
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
        'operation' => 'outside',
        'geometry' => $result_geom ? json_decode($result_geom) : null,
        'markers' => $markers
    ]);
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Gagal melakukan analisis area luar: ' . $e->getMessage()
    ]);
}
