<?php
// api/get_kecamatan.php — Ambil daftar kecamatan (dan opsional GeoJSON polygon-nya)
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$pdo = require __DIR__ . '/../config/database.php';

try {
    // Jika ?geom=1, sertakan GeoJSON geometri polygon
    $withGeom = isset($_GET['geom']) && $_GET['geom'] == '1';

    if ($withGeom) {
        $sql = "SELECT id, nama_kecamatan, kode_kecamatan, kabupaten,
                       ST_AsGeoJSON(geom)::json AS geometry
                FROM kecamatan
                ORDER BY nama_kecamatan";
    } else {
        $sql = "SELECT id, nama_kecamatan, kode_kecamatan, kabupaten
                FROM kecamatan
                ORDER BY nama_kecamatan";
    }

    $rows = $pdo->query($sql)->fetchAll();

    // Hitung jumlah fasilitas per kecamatan
    $count_stmt = $pdo->query("
        SELECT kecamatan_id, COUNT(*) AS total
        FROM fasilitas_kesehatan
        GROUP BY kecamatan_id
    ");
    $counts = [];
    foreach ($count_stmt->fetchAll() as $c) {
        $counts[$c['kecamatan_id']] = $c['total'];
    }

    foreach ($rows as &$row) {
        $row['jumlah_fasilitas'] = $counts[$row['id']] ?? 0;
        if ($withGeom && isset($row['geometry']) && is_string($row['geometry'])) {
            $row['geometry'] = json_decode($row['geometry']);
        }
    }

    echo json_encode(['status' => 'success', 'data' => $rows]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
