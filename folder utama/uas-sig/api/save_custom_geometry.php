<?php
// api/save_custom_geometry.php — Simpan data gambar kustom ke PostGIS
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$pdo = require __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Method tidak diizinkan']); exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$type  = $input['type'] ?? '';
$name  = trim($input['name'] ?? '');
$geojson = $input['geojson'] ?? null;
$desc  = trim($input['description'] ?? '');

if (empty($type) || empty($name) || empty($geojson)) {
    echo json_encode(['status' => 'error', 'message' => 'Parameter tidak lengkap']); exit;
}

function geojsonToWkt($geom) {
    $gType = $geom['type'] ?? '';
    $coords = $geom['coordinates'] ?? [];
    if (empty($coords)) return null;

    switch (strtolower($gType)) {
        case 'point':
            return "POINT({$coords[0]} {$coords[1]})";
        case 'linestring':
            $pts = array_map(fn($p) => "{$p[0]} {$p[1]}", $coords);
            return "LINESTRING(" . implode(', ', $pts) . ")";
        case 'polygon':
            $rings = [];
            foreach ($coords as $ring) {
                $pts = array_map(fn($p) => "{$p[0]} {$p[1]}", $ring);
                $rings[] = "(" . implode(', ', $pts) . ")";
            }
            return "POLYGON(" . implode(', ', $rings) . ")";
        default:
            return null;
    }
}

$wkt = geojsonToWkt($geojson);
if (!$wkt) {
    echo json_encode(['status' => 'error', 'message' => 'Format GeoJSON tidak didukung']); exit;
}

try {
    if ($type === 'polygon') {
        $stmt = $pdo->prepare("INSERT INTO custom_polygons (nama_wilayah, geom) VALUES (:name, ST_GeomFromText(:wkt, 4326))");
        $stmt->execute([':name' => $name, ':wkt' => $wkt]);
    } elseif ($type === 'polyline') {
        $stmt = $pdo->prepare("INSERT INTO custom_polylines (nama_polyline, geom) VALUES (:name, ST_GeomFromText(:wkt, 4326))");
        $stmt->execute([':name' => $name, ':wkt' => $wkt]);
    } elseif ($type === 'marker') {
        $stmt = $pdo->prepare("INSERT INTO custom_markers (nama_marker, deskripsi, geom) VALUES (:name, :desc, ST_GeomFromText(:wkt, 4326))");
        $stmt->execute([':name' => $name, ':desc' => $desc, ':wkt' => $wkt]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Tipe tidak valid']); exit;
    }

    echo json_encode(['status' => 'success', 'message' => 'Elemen kustom berhasil disimpan']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
