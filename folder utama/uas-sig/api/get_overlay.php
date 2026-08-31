<?php
// api/get_overlay.php — Analisis Spasial Overlay: fasilitas yang ada di 2 kecamatan
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$pdo = require __DIR__ . '/../config/database.php';

try {
    $kec_a = $_GET['kec_a'] ?? null;
    $kec_b = $_GET['kec_b'] ?? null;

    if (!$kec_a || !$kec_b) {
        echo json_encode(['status' => 'error', 'message' => 'Parameter kec_a dan kec_b wajib diisi']);
        exit;
    }

    // =====================================================
    // ANALISIS SPASIAL OVERLAY (PostGIS)
    // =====================================================

    // 1. Fasilitas HANYA di Kecamatan A (bukan B)
    $sql_only_a = "
        SELECT f.id, f.nama, f.jenis, f.alamat, k.nama_kecamatan,
               ST_X(f.geom) AS longitude, ST_Y(f.geom) AS latitude
        FROM fasilitas_kesehatan f
        LEFT JOIN kecamatan k ON f.kecamatan_id = k.id
        WHERE f.kecamatan_id = :kec_a
          AND f.id NOT IN (
              SELECT id FROM fasilitas_kesehatan WHERE kecamatan_id = :kec_b
          )
        ORDER BY f.nama
    ";

    // 2. Fasilitas HANYA di Kecamatan B (bukan A)
    $sql_only_b = "
        SELECT f.id, f.nama, f.jenis, f.alamat, k.nama_kecamatan,
               ST_X(f.geom) AS longitude, ST_Y(f.geom) AS latitude
        FROM fasilitas_kesehatan f
        LEFT JOIN kecamatan k ON f.kecamatan_id = k.id
        WHERE f.kecamatan_id = :kec_b
          AND f.id NOT IN (
              SELECT id FROM fasilitas_kesehatan WHERE kecamatan_id = :kec_a
          )
        ORDER BY f.nama
    ";

    // 3. Semua Fasilitas A dan B (UNION — gabungan)
    $sql_union = "
        SELECT f.id, f.nama, f.jenis, f.alamat, k.nama_kecamatan,
               ST_X(f.geom) AS longitude, ST_Y(f.geom) AS latitude
        FROM fasilitas_kesehatan f
        LEFT JOIN kecamatan k ON f.kecamatan_id = k.id
        WHERE f.kecamatan_id IN (:kec_a, :kec_b)
        ORDER BY f.nama
    ";

    // 4. Info Kecamatan A dan B
    $sql_info = "
        SELECT id, nama_kecamatan, kabupaten,
               ST_AsGeoJSON(geom)::json AS geometry
        FROM kecamatan
        WHERE id IN (:kec_a, :kec_b)
    ";

    // Eksekusi semua query
    $stmt_a = $pdo->prepare($sql_only_a);
    $stmt_a->execute([':kec_a' => (int)$kec_a, ':kec_b' => (int)$kec_b]);
    $only_a = $stmt_a->fetchAll();

    $stmt_b = $pdo->prepare($sql_only_b);
    $stmt_b->execute([':kec_b' => (int)$kec_b, ':kec_a' => (int)$kec_a]);
    $only_b = $stmt_b->fetchAll();

    // Union: gabung A dan B, hindari duplikat
    $stmt_union = $pdo->prepare("
        SELECT f.id, f.nama, f.jenis, f.alamat, k.nama_kecamatan,
               ST_X(f.geom) AS longitude, ST_Y(f.geom) AS latitude
        FROM fasilitas_kesehatan f
        LEFT JOIN kecamatan k ON f.kecamatan_id = k.id
        WHERE f.kecamatan_id = :kec_a OR f.kecamatan_id = :kec_b
        ORDER BY f.nama
    ");
    $stmt_union->execute([':kec_a' => (int)$kec_a, ':kec_b' => (int)$kec_b]);
    $union_data = $stmt_union->fetchAll();

    // Info kecamatan
    $stmt_info = $pdo->prepare("SELECT id, nama_kecamatan, kabupaten, ST_AsGeoJSON(geom)::json AS geometry FROM kecamatan WHERE id IN (:kec_a, :kec_b)");
    $stmt_info->execute([':kec_a' => (int)$kec_a, ':kec_b' => (int)$kec_b]);
    $kec_info_raw = $stmt_info->fetchAll();

    $kec_info = [];
    foreach ($kec_info_raw as $ki) {
        if (isset($ki['geometry']) && is_string($ki['geometry'])) {
            $ki['geometry'] = json_decode($ki['geometry']);
        }
        $kec_info[$ki['id']] = $ki;
    }

    echo json_encode([
        'status'       => 'success',
        'kecamatan_a'  => $kec_info[(int)$kec_a] ?? null,
        'kecamatan_b'  => $kec_info[(int)$kec_b] ?? null,
        'only_a'       => $only_a,
        'only_b'       => $only_b,
        'union'        => $union_data,
        'total_a'      => count($only_a),
        'total_b'      => count($only_b),
        'total_union'  => count($union_data),
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
