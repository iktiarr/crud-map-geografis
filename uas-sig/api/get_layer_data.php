<?php
// api/get_layer_data.php — Ambil data dari tabel spasial apa saja secara dinamis
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$pdo = require __DIR__ . '/../config/database.php';

$table = $_GET['table'] ?? 'fasilitas_kesehatan';

// Sanitasi nama tabel untuk mencegah SQL injection
$table = preg_replace('/[^a-zA-Z0-9_]/', '', $table);

if (empty($table)) {
    echo json_encode(['status' => 'error', 'message' => 'Nama tabel tidak valid']); exit;
}

try {
    // Ambil semua kolom tabel dari system catalogs dalam 1 query saja (jauh lebih cepat daripada information_schema views)
    $colStmt = $pdo->prepare("
        SELECT a.attname AS column_name
        FROM pg_attribute a
        JOIN pg_class c ON a.attrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public'
          AND c.relname = :table
          AND a.attnum > 0
          AND NOT a.attisdropped
        ORDER BY a.attnum
    ");
    $colStmt->execute([':table' => $table]);
    $allColumns = $colStmt->fetchAll(PDO::FETCH_COLUMN);

    if (empty($allColumns)) {
        echo json_encode(['status' => 'error', 'message' => "Tabel '$table' tidak ditemukan atau tidak memiliki kolom data"]); exit;
    }

    $hasGeom = in_array('geom', $allColumns);
    $columns = array_values(array_filter($allColumns, function($c) { return $c !== 'geom'; }));

    // 4. Bangun query dinamis
    $selectCols = [];
    foreach ($columns as $col) {
        if ($table === 'fasilitas_kesehatan') {
            $selectCols[] = "t.\"$col\"";
        } else {
            $selectCols[] = "\"$col\"";
        }
    }
    
    if ($table === 'fasilitas_kesehatan') {
        $selectCols[] = "k.nama_kecamatan AS kecamatan";
        $columns[] = 'kecamatan';
    }
    
    if ($hasGeom) {
        if (!in_array('longitude', $columns)) {
            $columns[] = 'longitude';
        }
        if (!in_array('latitude', $columns)) {
            $columns[] = 'latitude';
        }
        if ($table === 'fasilitas_kesehatan') {
            $selectCols[] = "ST_AsGeoJSON(t.geom)::json AS geometry";
            $selectCols[] = "ST_GeometryType(t.geom) AS geom_type";
            $selectCols[] = "ST_X(ST_Centroid(t.geom)) AS longitude";
            $selectCols[] = "ST_Y(ST_Centroid(t.geom)) AS latitude";
        } else {
            $selectCols[] = "ST_AsGeoJSON(geom)::json AS geometry";
            $selectCols[] = "ST_GeometryType(geom) AS geom_type";
            $selectCols[] = "ST_X(ST_Centroid(geom)) AS longitude";
            $selectCols[] = "ST_Y(ST_Centroid(geom)) AS latitude";
        }
    }

    if ($table === 'fasilitas_kesehatan') {
        $sql = "SELECT " . implode(', ', $selectCols) . " FROM \"$table\" t LEFT JOIN kecamatan k ON t.kecamatan_id = k.id";
    } else {
        $sql = "SELECT " . implode(', ', $selectCols) . " FROM \"$table\"";
    }
    
    // Jika ada kolom nama, urutkan berdasarkan nama
    if (in_array('nama', $columns)) {
        $sql .= " ORDER BY nama";
    } elseif (in_array('nama_kecamatan', $columns)) {
        $sql .= " ORDER BY nama_kecamatan";
    } else {
        $sql .= " ORDER BY id";
    }

    $stmt = $pdo->query($sql);
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
