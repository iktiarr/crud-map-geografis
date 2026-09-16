<?php
// api/get_custom_geometries.php — Ambil data gambar kustom untuk sidebar
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$pdo = require __DIR__ . '/../config/database.php';

try {
    $polys = $pdo->query("SELECT id, nama_wilayah AS name, ST_AsGeoJSON(geom)::json AS geojson, 'polygon' AS type FROM custom_polygons ORDER BY created_at DESC")->fetchAll();
    $lines = $pdo->query("SELECT id, nama_polyline AS name, ST_AsGeoJSON(geom)::json AS geojson, 'polyline' AS type FROM custom_polylines ORDER BY created_at DESC")->fetchAll();
    $markers = $pdo->query("SELECT id, nama_marker AS name, deskripsi, ST_AsGeoJSON(geom)::json AS geojson, 'marker' AS type FROM custom_markers ORDER BY created_at DESC")->fetchAll();

    echo json_encode([
        'status' => 'success',
        'data' => [
            'polygons' => $polys,
            'polylines' => $lines,
            'markers' => $markers
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
