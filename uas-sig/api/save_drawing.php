<?php
// api/save_drawing.php — Simpan data gambar kustom ke tabel custom_drawings
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$pdo = require __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Method tidak diizinkan']); exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$id    = isset($input['id']) && $input['id'] !== '' ? (int)$input['id'] : null;
$type  = $input['type'] ?? '';
$name  = trim($input['name'] ?? '');
$color = trim($input['color'] ?? '#ef4444');
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
    if ($id > 0) {
        $stmt = $pdo->prepare("UPDATE custom_drawings SET nama = :name, tipe = :type, warna = :color, deskripsi = :desc, geom = ST_GeomFromText(:wkt, 4326) WHERE id = :id");
        $stmt->execute([':name' => $name, ':type' => $type, ':color' => $color, ':desc' => $desc, ':wkt' => $wkt, ':id' => $id]);
    } else {
        $stmt = $pdo->prepare("INSERT INTO custom_drawings (nama, tipe, warna, deskripsi, geom) VALUES (:name, :type, :color, :desc, ST_GeomFromText(:wkt, 4326))");
        $stmt->execute([':name' => $name, ':type' => $type, ':color' => $color, ':desc' => $desc, ':wkt' => $wkt]);
    }

    echo json_encode(['status' => 'success', 'message' => 'Gambar kustom berhasil disimpan']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
