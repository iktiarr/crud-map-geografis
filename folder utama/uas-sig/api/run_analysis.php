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
    if ($operation === 'all') {
        $markers_subquery = function($geom_field) use ($point_table) {
            if ($point_table === 'fasilitas_kesehatan') {
                return "
                    SELECT COALESCE(json_agg(sub2), '[]'::json) 
                    FROM (
                        SELECT sub.*, k.nama_kecamatan AS kecamatan,
                               ST_AsGeoJSON(sub.dumped_geom)::json AS geometry,
                               ST_GeometryType(sub.dumped_geom) AS geom_type,
                               ST_X(ST_Centroid(sub.dumped_geom)) AS longitude,
                               ST_Y(ST_Centroid(sub.dumped_geom)) AS latitude
                        FROM (
                            SELECT (ST_Dump(p.geom)).geom AS dumped_geom, p.*
                            FROM \"$point_table\" p
                            WHERE ST_GeometryType(p.geom) IN ('ST_Point', 'ST_MultiPoint')
                        ) sub
                        LEFT JOIN kecamatan k ON sub.kecamatan_id = k.id
                        WHERE ST_Within(sub.dumped_geom, $geom_field)
                    ) sub2
                ";
            } elseif ($point_table === 'custom_drawings') {
                return "
                    SELECT COALESCE(json_agg(sub2), '[]'::json) 
                    FROM (
                        SELECT sub.*,
                               ST_AsGeoJSON(sub.dumped_geom)::json AS geometry,
                               ST_GeometryType(sub.dumped_geom) AS geom_type,
                               ST_X(ST_Centroid(sub.dumped_geom)) AS longitude,
                               ST_Y(ST_Centroid(sub.dumped_geom)) AS latitude
                        FROM (
                            SELECT (ST_Dump(p.geom)).geom AS dumped_geom, p.*
                            FROM \"$point_table\" p
                            WHERE p.tipe = 'marker' AND ST_GeometryType(p.geom) IN ('ST_Point', 'ST_MultiPoint')
                        ) sub
                        WHERE ST_Within(sub.dumped_geom, $geom_field)
                    ) sub2
                ";
            } else {
                return "
                    SELECT COALESCE(json_agg(sub2), '[]'::json) 
                    FROM (
                        SELECT sub.*,
                               ST_AsGeoJSON(sub.dumped_geom)::json AS geometry,
                               ST_GeometryType(sub.dumped_geom) AS geom_type,
                               ST_X(ST_Centroid(sub.dumped_geom)) AS longitude,
                               ST_Y(ST_Centroid(sub.dumped_geom)) AS latitude
                        FROM (
                            SELECT (ST_Dump(p.geom)).geom AS dumped_geom, p.*
                            FROM \"$point_table\" p
                            WHERE ST_GeometryType(p.geom) IN ('ST_Point', 'ST_MultiPoint')
                        ) sub
                        WHERE ST_Within(sub.dumped_geom, $geom_field)
                    ) sub2
                ";
            }
        };


        $query = "
            WITH 
              geom_a AS (
                SELECT ST_MakeValid(geom) AS geom FROM \"$poly_a_table\" WHERE id = :poly_a_id
              ),
              geom_b AS (
                SELECT ST_MakeValid(geom) AS geom FROM \"$poly_b_table\" WHERE id = :poly_b_id
              ),
              calc AS (
                SELECT 
                  a.geom AS a_geom,
                  b.geom AS b_geom,
                  ST_Union(a.geom, b.geom) AS union_geom,
                  ST_Difference(a.geom, b.geom) AS diff_ab_geom,
                  ST_Difference(b.geom, a.geom) AS diff_ba_geom,
                  ST_Intersection(a.geom, b.geom) AS intersect_geom,
                  ST_Difference(
                    ST_Expand(ST_Envelope(ST_Union(a.geom, b.geom)), 0.2), 
                    ST_Union(a.geom, b.geom)
                  ) AS outside_geom
                FROM geom_a a, geom_b b
              )
            SELECT 
              ST_AsGeoJSON(c.a_geom) AS a_geojson,
              ST_AsGeoJSON(c.b_geom) AS b_geojson,
              ST_AsGeoJSON(c.union_geom) AS union_geojson,
              ST_AsGeoJSON(c.diff_ab_geom) AS diff_ab_geojson,
              ST_AsGeoJSON(c.diff_ba_geom) AS diff_ba_geojson,
              ST_AsGeoJSON(c.outside_geom) AS outside_geojson,
              ST_AsGeoJSON(c.intersect_geom) AS intersect_geojson,
              
              (" . $markers_subquery('c.a_geom') . ") AS a_markers,
              (" . $markers_subquery('c.b_geom') . ") AS b_markers,
              (" . $markers_subquery('c.union_geom') . ") AS union_markers,
              (" . $markers_subquery('c.diff_ab_geom') . ") AS diff_ab_markers,
              (" . $markers_subquery('c.diff_ba_geom') . ") AS diff_ba_markers,
              (" . $markers_subquery('c.outside_geom') . ") AS outside_markers,
              (" . $markers_subquery('c.intersect_geom') . ") AS intersect_markers
            FROM calc c
        ";

        $stmt = $pdo->prepare($query);
        $stmt->execute([
            ':poly_a_id' => $poly_a_id,
            ':poly_b_id' => $poly_b_id
        ]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            echo json_encode(['status' => 'error', 'message' => 'Gagal menghitung analisis spasial. Pastikan ID wilayah valid.']);
            exit;
        }

        $results = [];
        $keys = [
            'wilayahA' => ['geojson' => 'a_geojson', 'markers' => 'a_markers'],
            'wilayahB' => ['geojson' => 'b_geojson', 'markers' => 'b_markers'],
            'union' => ['geojson' => 'union_geojson', 'markers' => 'union_markers'],
            'diffAB' => ['geojson' => 'diff_ab_geojson', 'markers' => 'diff_ab_markers'],
            'diffBA' => ['geojson' => 'diff_ba_geojson', 'markers' => 'diff_ba_markers'],
            'outside' => ['geojson' => 'outside_geojson', 'markers' => 'outside_markers'],
            'intersect' => ['geojson' => 'intersect_geojson', 'markers' => 'intersect_markers']
        ];

        foreach ($keys as $outKey => $rowKeys) {
            $geomStr = $row[$rowKeys['geojson']] ?? null;
            $markersStr = $row[$rowKeys['markers']] ?? '[]';
            
            $markers = json_decode($markersStr, true);
            foreach ($markers as &$m) {
                unset($m['geom']);
                unset($m['dumped_geom']);
                if (isset($m['geometry']) && is_string($m['geometry'])) {
                    $m['geometry'] = json_decode($m['geometry'], true);
                }
            }

            $results[$outKey] = [
                'geometry' => $geomStr ? json_decode($geomStr, true) : null,
                'data' => $markers
            ];
        }

        echo json_encode([
            'status' => 'success',
            'operation' => 'all',
            'results' => $results
        ]);
        exit;
    }

    // 1. Tentukan ekspresi geometri PostGIS berdasarkan operasi dengan ST_MakeValid untuk keamanan
    $geom_expr = '';
    switch ($operation) {
        case 'union':
            $geom_expr = "ST_Union(ST_MakeValid(a.geom), ST_MakeValid(b.geom))";
            break;
        case 'diff_ab':
            $geom_expr = "ST_Difference(ST_MakeValid(a.geom), ST_MakeValid(b.geom))";
            break;
        case 'diff_ba':
            $geom_expr = "ST_Difference(ST_MakeValid(b.geom), ST_MakeValid(a.geom))";
            break;
        case 'outside':
            $geom_expr = "ST_Difference(ST_Expand(ST_Envelope(ST_Union(ST_MakeValid(a.geom), ST_MakeValid(b.geom))), 0.2), ST_Union(ST_MakeValid(a.geom), ST_MakeValid(b.geom)))";
            break;
        case 'intersection':
        default:
            $geom_expr = "ST_Intersection(ST_MakeValid(a.geom), ST_MakeValid(b.geom))";
            break;
    }

    // 2. Bangun query sub-select untuk mengambil point data
    if ($point_table === 'fasilitas_kesehatan') {
        $subSelect = "
            SELECT sub.*, k.nama_kecamatan AS kecamatan,
                   ST_AsGeoJSON(sub.dumped_geom)::json AS geometry,
                   ST_GeometryType(sub.dumped_geom) AS geom_type,
                   ST_X(ST_Centroid(sub.dumped_geom)) AS longitude,
                   ST_Y(ST_Centroid(sub.dumped_geom)) AS latitude
            FROM (
                SELECT (ST_Dump(p.geom)).geom AS dumped_geom, p.*
                FROM \"$point_table\" p
                WHERE ST_GeometryType(p.geom) IN ('ST_Point', 'ST_MultiPoint')
            ) sub
            LEFT JOIN kecamatan k ON sub.kecamatan_id = k.id
            JOIN selected s2 ON ST_Within(sub.dumped_geom, s2.hasil_geom)
        ";
    } elseif ($point_table === 'custom_drawings') {
        // Hanya ambil marker kustom (drawn points)
        $subSelect = "
            SELECT sub.*,
                   ST_AsGeoJSON(sub.dumped_geom)::json AS geometry,
                   ST_GeometryType(sub.dumped_geom) AS geom_type,
                   ST_X(ST_Centroid(sub.dumped_geom)) AS longitude,
                   ST_Y(ST_Centroid(sub.dumped_geom)) AS latitude
            FROM (
                SELECT (ST_Dump(p.geom)).geom AS dumped_geom, p.*
                FROM \"$point_table\" p
                WHERE p.tipe = 'marker' AND ST_GeometryType(p.geom) IN ('ST_Point', 'ST_MultiPoint')
            ) sub
            JOIN selected s2 ON ST_Within(sub.dumped_geom, s2.hasil_geom)
        ";
    } else {
        $subSelect = "
            SELECT sub.*,
                   ST_AsGeoJSON(sub.dumped_geom)::json AS geometry,
                   ST_GeometryType(sub.dumped_geom) AS geom_type,
                   ST_X(ST_Centroid(sub.dumped_geom)) AS longitude,
                   ST_Y(ST_Centroid(sub.dumped_geom)) AS latitude
            FROM (
                SELECT (ST_Dump(p.geom)).geom AS dumped_geom, p.*
                FROM \"$point_table\" p
                WHERE ST_GeometryType(p.geom) IN ('ST_Point', 'ST_MultiPoint')
            ) sub
            JOIN selected s2 ON ST_Within(sub.dumped_geom, s2.hasil_geom)
        ";
    }


    // 3. Gabungkan seluruh kalkulasi dan pencarian data ke dalam 1 query saja (1 network round-trip)
    $query = "
        WITH selected AS (
            SELECT $geom_expr AS hasil_geom
            FROM \"$poly_a_table\" a
            CROSS JOIN \"$poly_b_table\" b
            WHERE a.id = :poly_a_id AND b.id = :poly_b_id
        )
        SELECT 
            ST_AsGeoJSON(s.hasil_geom) AS polygon_geojson,
            (
                SELECT COALESCE(json_agg(sub), '[]'::json)
                FROM ($subSelect) sub
            ) AS points_json
        FROM selected s
    ";

    $stmt = $pdo->prepare($query);
    $stmt->execute([
        ':poly_a_id' => $poly_a_id,
        ':poly_b_id' => $poly_b_id
    ]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    $result_geom = $result ? $result['polygon_geojson'] : null;
    $points = $result ? json_decode($result['points_json'], true) : [];

    // Bersihkan kolom 'geom' biner agar tidak dikirim ke klien, dan format geometry
    foreach ($points as &$p) {
        unset($p['geom']);
        unset($p['dumped_geom']);
        if (isset($p['geometry']) && is_string($p['geometry'])) {
            $p['geometry'] = json_decode($p['geometry'], true);
        }
    }

    // Ambil daftar kolom secara dinamis dari data hasil fetch
    $columns = [];
    if (!empty($points)) {
        $columns = array_keys($points[0]);
        // Keluarkan kolom internal dari display list
        $columns = array_filter($columns, fn($c) => !in_array($c, ['geom', 'dumped_geom', 'geometry', 'geom_type', 'latitude', 'longitude']));
        $columns = array_values($columns);
    }

    echo json_encode([
        'status' => 'success',
        'operation' => $operation,
        'geometry' => $result_geom ? json_decode($result_geom, true) : null,
        'columns' => $columns,
        'data' => $points
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
