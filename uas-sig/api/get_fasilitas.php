<?php
// api/get_fasilitas.php — Ambil data fasilitas kesehatan (dengan filter kecamatan & analisis spasial)
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$pdo = require __DIR__ . '/../config/database.php';

try {
    $kecamatan_id = $_GET['kecamatan_id'] ?? null;
    $jenis        = $_GET['jenis']        ?? null;

    // Base query — selalu kembalikan GeoJSON point
    $sql = "
        SELECT
            f.id,
            f.nama,
            f.jenis,
            f.alamat,
            f.telepon,
            f.status,
            f.kecamatan_id,
            f.created_at,
            k.nama_kecamatan,
            ST_X(f.geom) AS longitude,
            ST_Y(f.geom) AS latitude,
            ST_AsGeoJSON(f.geom)::json AS geometry
        FROM fasilitas_kesehatan f
        LEFT JOIN kecamatan k ON f.kecamatan_id = k.id
        WHERE 1=1
    ";

    $params = [];

    // =====================================================
    // ANALISIS SPASIAL: Filter berdasarkan kecamatan
    // Menggunakan ST_Within (PostGIS) — marker dalam polygon kecamatan
    // =====================================================
    if ($kecamatan_id && $kecamatan_id !== 'all') {
        // ST_Within: cek apakah titik fasilitas berada DI DALAM polygon kecamatan
        $sql .= " AND (f.kecamatan_id = :kec_id OR ST_Within(f.geom, (
                    SELECT geom FROM kecamatan WHERE id = :kec_id2
                    AND geom IS NOT NULL
                  )))";
        $params[':kec_id']  = (int)$kecamatan_id;
        $params[':kec_id2'] = (int)$kecamatan_id;
    }

    if ($jenis && $jenis !== 'all') {
        $sql .= " AND f.jenis = :jenis";
        $params[':jenis'] = $jenis;
    }

    $sql .= " ORDER BY f.nama";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    foreach ($rows as &$row) {
        if (isset($row['geometry']) && is_string($row['geometry'])) {
            $row['geometry'] = json_decode($row['geometry']);
        }
    }

    echo json_encode([
        'status' => 'success',
        'total'  => count($rows),
        'data'   => $rows
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
