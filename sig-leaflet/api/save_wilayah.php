<?php
// api/save_wilayah.php
header('Content-Type: application/json');
$pdo = require __DIR__ . '/../config/database.php';

$input = json_decode(file_get_contents('php://input'), true);
$group_id = $input['group_id'] ?? $_POST['group_id'] ?? null;
$nama_wilayah = $input['nama_wilayah'] ?? $_POST['nama_wilayah'] ?? null;
$geojson = $input['geojson'] ?? $_POST['geojson'] ?? null;

if (empty($group_id) || empty($nama_wilayah) || empty($geojson)) {
    echo json_encode(['status' => 'error', 'message' => 'Parameter group_id, nama_wilayah, dan geojson wajib diisi.']);
    exit;
}

if (is_array($geojson)) {
    $geojson = json_encode($geojson);
}

try {
    $query = "
        INSERT INTO wilayah (group_id, nama_wilayah, geom)
        VALUES (:group_id, :nama_wilayah, ST_SetSRID(ST_GeomFromGeoJSON(:geojson), 4326))
        RETURNING id
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute([
        ':group_id' => $group_id,
        ':nama_wilayah' => $nama_wilayah,
        ':geojson' => $geojson
    ]);
    $id = $stmt->fetchColumn();

    echo json_encode([
        'status' => 'success',
        'message' => 'Wilayah berhasil disimpan.',
        'data' => [
            'id' => $id,
            'group_id' => $group_id,
            'nama_wilayah' => $nama_wilayah
        ]
    ]);
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Gagal menyimpan wilayah: ' . $e->getMessage()
    ]);
}
