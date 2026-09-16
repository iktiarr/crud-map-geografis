<?php
// api/get_spatial_filter.php — Filter spasial dinamis: Ambil data point yang ada di dalam polygon terpilih
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$pdo = require __DIR__ . '/../config/database.php';

$polygon_table = $_GET['polygon_table'] ?? '';
$polygon_id    = $_GET['polygon_id'] ?? 0;
$point_table   = $_GET['point_table'] ?? '';

// Sanitasi nama tabel
$polygon_table = preg_replace('/[^a-zA-Z0-9_]/', '', $polygon_table);
$point_table   = preg_replace('/[^a-zA-Z0-9_]/', '', $point_table);
$polygon_id    = (int)$polygon_id;

if (empty($polygon_table) || empty($point_table) || $polygon_id <= 0) {
    echo json_encode(['status' => 'error', 'message' => 'Parameter tidak valid']); exit;
}

try {
    // 1. Cek apakah kedua tabel ada (menggunakan pg_class yang jauh lebih cepat)
    $tables = [$polygon_table, $point_table];
    foreach ($tables as $t) {
        $check = $pdo->prepare("
            SELECT EXISTS (
                SELECT 1 FROM pg_class c 
                JOIN pg_namespace n ON c.relnamespace = n.oid 
                WHERE n.nspname = 'public' AND c.relname = :table AND c.relkind = 'r'
            )
        ");
        $check->execute([':table' => $t]);
        if (!$check->fetchColumn()) {
            echo json_encode(['status' => 'error', 'message' => "Tabel '$t' tidak ditemukan"]); exit;
        }
    }

    // 2. Ambil kolom untuk tabel point (kecuali geom - menggunakan pg_attribute yang jauh lebih cepat)
    $colStmt = $pdo->prepare("
        SELECT a.attname AS column_name
        FROM pg_attribute a
        JOIN pg_class c ON a.attrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public'
          AND c.relname = :table
          AND a.attnum > 0
          AND NOT a.attisdropped
          AND a.attname != 'geom'
        ORDER BY a.attnum
    ");
    $colStmt->execute([':table' => $point_table]);
    $columns = $colStmt->fetchAll(PDO::FETCH_COLUMN);

    if (empty($columns)) {
        echo json_encode(['status' => 'error', 'message' => 'Tabel point tidak memiliki kolom']); exit;
    }

    // 3. Bangun SQL Query
    $selectCols = ["sub.*"];
    if ($point_table === 'fasilitas_kesehatan') {
        $selectCols[] = "k.nama_kecamatan AS kecamatan";
        $columns[] = 'kecamatan';
    }
    
    $selectCols[] = "ST_AsGeoJSON(sub.dumped_geom)::json AS geometry";
    $selectCols[] = "ST_GeometryType(sub.dumped_geom) AS geom_type";
    $selectCols[] = "ST_X(ST_Centroid(sub.dumped_geom)) AS longitude";
    $selectCols[] = "ST_Y(ST_Centroid(sub.dumped_geom)) AS latitude";

    if ($point_table === 'fasilitas_kesehatan') {
        $sql = "
            SELECT " . implode(', ', $selectCols) . "
            FROM (
                SELECT (ST_Dump(p.geom)).geom AS dumped_geom, p.*
                FROM \"$point_table\" p
            ) sub
            LEFT JOIN kecamatan k ON sub.kecamatan_id = k.id
            CROSS JOIN \"$polygon_table\" poly
            WHERE poly.id = :poly_id
              AND ST_Within(sub.dumped_geom, poly.geom)
        ";
    } else {
        $sql = "
            SELECT " . implode(', ', $selectCols) . "
            FROM (
                SELECT (ST_Dump(p.geom)).geom AS dumped_geom, p.*
                FROM \"$point_table\" p
            ) sub
            CROSS JOIN \"$polygon_table\" poly
            WHERE poly.id = :poly_id
              AND ST_Within(sub.dumped_geom, poly.geom)
        ";
    }

    if (in_array('nama', $columns)) {
        $sql .= " ORDER BY sub.nama";
    } else {
        $sql .= " ORDER BY sub.id";
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':poly_id' => $polygon_id]);
    $rows = $stmt->fetchAll();

    foreach ($rows as &$row) {
        unset($row['geom']);
        unset($row['dumped_geom']);
        if (isset($row['geometry']) && is_string($row['geometry'])) {
            $row['geometry'] = json_decode($row['geometry']);
        }
    }

    echo json_encode([
        'status' => 'success',
        'columns' => $columns,
        'total' => count($rows),
        'data' => $rows
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
