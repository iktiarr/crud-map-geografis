<?php
// api/get_drawings.php — Ambil semua data gambar kustom dari tabel custom_drawings
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$pdo = require __DIR__ . '/../config/database.php';

try {
    $stmt = $pdo->query("
        SELECT id, nama, tipe, warna, deskripsi, 
               ST_AsGeoJSON(geom)::json AS geojson,
               ST_X(ST_Centroid(geom)) AS longitude,
               ST_Y(ST_Centroid(geom)) AS latitude
        FROM custom_drawings 
        ORDER BY id DESC
    ");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'success',
        'data' => $rows
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
