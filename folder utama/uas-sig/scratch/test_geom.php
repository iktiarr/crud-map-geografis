<?php
$pdo = require 'c:/web/uas-sig/config/database.php';

try {
    echo "--- Test Full Spatial Subquery with ST_Dump ---\n";
    // Create a bounding box polygon that covers Jabodetabek coordinates
    $test_poly = 'POLYGON((105 -7, 108 -7, 108 -6, 105 -6, 105 -7))';
    
    $q = "
        SELECT COALESCE(json_agg(sub2), '[]'::json) 
        FROM (
            SELECT sub.*,
                   ST_AsGeoJSON(sub.dumped_geom)::json AS geometry,
                   ST_GeometryType(sub.dumped_geom) AS geom_type,
                   ST_X(ST_Centroid(sub.dumped_geom)) AS longitude,
                   ST_Y(ST_Centroid(sub.dumped_geom)) AS latitude
            FROM (
                SELECT (ST_Dump(p.geom)).geom AS dumped_geom, p.*
                FROM \"jabodetabek\" p
                WHERE ST_GeometryType(p.geom) IN ('ST_Point', 'ST_MultiPoint')
            ) sub
            WHERE ST_Within(sub.dumped_geom, ST_GeomFromText(:poly_wkt, 4326))
        ) sub2
    ";
    
    $stmt = $pdo->prepare($q);
    $stmt->execute([':poly_wkt' => $test_poly]);
    $res = $stmt->fetchColumn();
    
    $points = json_decode($res, true);
    echo "Succeeded. Count: " . count($points) . "\n";
    if (count($points) > 0) {
        foreach ($points as &$p) {
            unset($p['geom'], $p['dumped_geom']);
        }
        print_r($points[0]);
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
