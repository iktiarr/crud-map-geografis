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
    // 1. Cek apakah kedua tabel ada
    $tables = [$polygon_table, $point_table];
    foreach ($tables as $t) {
        $check = $pdo->prepare("
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                  AND table_name = :table
            )
        ");
        $check->execute([':table' => $t]);
        if (!$check->fetchColumn()) {
            echo json_encode(['status' => 'error', 'message' => "Tabel '$t' tidak ditemukan"]); exit;
        }
    }

    // 2. Ambil kolom untuk tabel point (kecuali geom)
    $colStmt = $pdo->prepare("
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = :table
          AND column_name != 'geom'
        ORDER BY ordinal_position
    ");
    $colStmt->execute([':table' => $point_table]);
    $columns = $colStmt->fetchAll(PDO::FETCH_COLUMN);

    if (empty($columns)) {
        echo json_encode(['status' => 'error', 'message' => 'Tabel point tidak memiliki kolom']); exit;
    }

    // 3. Bangun SQL Query
    $selectCols = [];
    foreach ($columns as $col) {
        $selectCols[] = "p.\"$col\"";
    }
    
    if ($point_table === 'fasilitas_kesehatan') {
        $selectCols[] = "k.nama_kecamatan AS kecamatan";
        $columns[] = 'kecamatan';
    }
    
    $selectCols[] = "ST_AsGeoJSON(p.geom)::json AS geometry";
    $selectCols[] = "ST_GeometryType(p.geom) AS geom_type";
    $selectCols[] = "ST_X(ST_Centroid(p.geom)) AS longitude";
    $selectCols[] = "ST_Y(ST_Centroid(p.geom)) AS latitude";

    if ($point_table === 'fasilitas_kesehatan') {
        $sql = "
            SELECT " . implode(', ', $selectCols) . "
            FROM \"$point_table\" p
            LEFT JOIN kecamatan k ON p.kecamatan_id = k.id
            CROSS JOIN \"$polygon_table\" poly
            WHERE poly.id = :poly_id
              AND ST_Within(p.geom, poly.geom)
        ";
    } else {
        $sql = "
            SELECT " . implode(', ', $selectCols) . "
            FROM \"$point_table\" p
            CROSS JOIN \"$polygon_table\" poly
            WHERE poly.id = :poly_id
              AND ST_Within(p.geom, poly.geom)
        ";
    }

    if (in_array('nama', $columns)) {
        $sql .= " ORDER BY p.nama";
    } else {
        $sql .= " ORDER BY p.id";
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':poly_id' => $polygon_id]);
    $rows = $stmt->fetchAll();

    foreach ($rows as &$row) {
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
