<?php
// api/run_analysis.php — Analisis spasial PostGIS dinamis antara dua tabel wilayah dan satu tabel titik
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$pdo = require __DIR__ . '/../config/database.php';

$input = json_decode(file_get_contents('php://input'), true);
$poly_a_table = $input['poly_a_table'] ?? $_GET['poly_a_table'] ?? '';
$poly_a_id    = (int)($input['poly_a_id'] ?? $_GET['poly_a_id'] ?? 0);
$poly_b_table = $input['poly_b_table'] ?? $_GET['poly_b_table'] ?? '';
$poly_b_id    = (int)($input['poly_b_id'] ?? $_GET['poly_b_id'] ?? 0);
$point_table  = $input['point_table'] ?? $_GET['point_table'] ?? '';
$operation    = $input['operation'] ?? $_GET['operation'] ?? 'intersection';

// Sanitasi nama tabel
$poly_a_table = preg_replace('/[^a-zA-Z0-9_]/', '', $poly_a_table);
$poly_b_table = preg_replace('/[^a-zA-Z0-9_]/', '', $poly_b_table);
$point_table  = preg_replace('/[^a-zA-Z0-9_]/', '', $point_table);

if (empty($poly_a_table) || empty($poly_b_table) || empty($point_table) || $poly_a_id <= 0 || $poly_b_id <= 0) {
    echo json_encode(['status' => 'error', 'message' => 'Parameter analisis tidak lengkap.']);
    exit;
}

try {
    // 1. Tentukan ekspresi geometri PostGIS berdasarkan operasi
    $geom_expr = '';
    switch ($operation) {
        case 'union':
            $geom_expr = "ST_Union(a.geom, b.geom)";
            break;
        case 'diff_ab':
            $geom_expr = "ST_Difference(a.geom, b.geom)";
            break;
        case 'diff_ba':
            $geom_expr = "ST_Difference(b.geom, a.geom)";
            break;
        case 'outside':
            $geom_expr = "ST_Difference(ST_SetSRID(ST_MakeEnvelope(-180, -90, 180, 90), 4326), ST_Union(a.geom, b.geom))";
            break;
        case 'intersection':
        default:
            $geom_expr = "ST_Intersection(a.geom, b.geom)";
            break;
    }

    // 2. Hitung geometri hasil analisis
    $query_geom = "
        SELECT ST_AsGeoJSON($geom_expr) AS geojson
        FROM \"$poly_a_table\" a
        CROSS JOIN \"$poly_b_table\" b
        WHERE a.id = :poly_a_id AND b.id = :poly_b_id
    ";
    $stmt_geom = $pdo->prepare($query_geom);
    $stmt_geom->execute([
        ':poly_a_id' => $poly_a_id,
        ':poly_b_id' => $poly_b_id
    ]);
    $result_geom = $stmt_geom->fetchColumn();

    // 3. Ambil titik data yang berada di dalam hasil analisis
    // Ambil semua kolom point_table kecuali geom
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

    $selectCols = [];
    foreach ($columns as $col) {
        $selectCols[] = "p.\"$col\"";
    }
    
    // Join kecamatan if point_table is fasilitas_kesehatan
    if ($point_table === 'fasilitas_kesehatan') {
        $selectCols[] = "k.nama_kecamatan AS kecamatan";
        $columns[] = 'kecamatan';
    }

    $selectCols[] = "ST_AsGeoJSON(p.geom)::json AS geometry";
    $selectCols[] = "ST_GeometryType(p.geom) AS geom_type";
    $selectCols[] = "ST_X(ST_Centroid(p.geom)) AS longitude";
    $selectCols[] = "ST_Y(ST_Centroid(p.geom)) AS latitude";

    if ($point_table === 'fasilitas_kesehatan') {
        $query_points = "
            WITH selected AS (
                SELECT $geom_expr AS hasil_geom
                FROM \"$poly_a_table\" a
                CROSS JOIN \"$poly_b_table\" b
                WHERE a.id = :poly_a_id AND b.id = :poly_b_id
            )
            SELECT " . implode(', ', $selectCols) . "
            FROM \"$point_table\" p
            LEFT JOIN kecamatan k ON p.kecamatan_id = k.id
            JOIN selected s ON ST_Within(p.geom, s.hasil_geom)
        ";
    } else {
        $query_points = "
            WITH selected AS (
                SELECT $geom_expr AS hasil_geom
                FROM \"$poly_a_table\" a
                CROSS JOIN \"$poly_b_table\" b
                WHERE a.id = :poly_a_id AND b.id = :poly_b_id
            )
            SELECT " . implode(', ', $selectCols) . "
            FROM \"$point_table\" p
            JOIN selected s ON ST_Within(p.geom, s.hasil_geom)
        ";
    }

    $stmt_points = $pdo->prepare($query_points);
    $stmt_points->execute([
        ':poly_a_id' => $poly_a_id,
        ':poly_b_id' => $poly_b_id
    ]);
    $points = $stmt_points->fetchAll();

    foreach ($points as &$p) {
        if (isset($p['geometry']) && is_string($p['geometry'])) {
            $p['geometry'] = json_decode($p['geometry']);
        }
    }

    echo json_encode([
        'status' => 'success',
        'operation' => $operation,
        'geometry' => $result_geom ? json_decode($result_geom) : null,
        'columns' => $columns,
        'data' => $points
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
