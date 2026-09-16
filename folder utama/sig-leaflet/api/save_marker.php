<?php
// api/save_marker.php
header('Content-Type: application/json');
$pdo = require __DIR__ . '/../config/database.php';

$input = json_decode(file_get_contents('php://input'), true);
$group_id = $input['group_id'] ?? $_POST['group_id'] ?? null;
$nama_marker = $input['nama_marker'] ?? $_POST['nama_marker'] ?? null;
$deskripsi = $input['deskripsi'] ?? $_POST['deskripsi'] ?? null;
$geojson = $input['geojson'] ?? $_POST['geojson'] ?? null;

if (empty($group_id) || empty($nama_marker) || empty($geojson)) {
    echo json_encode(['status' => 'error', 'message' => 'Parameter group_id, nama_marker, dan geojson wajib diisi.']);
    exit;
}

if (is_array($geojson)) {
    $geojson = json_encode($geojson);
}

try {
    $query = "
        INSERT INTO markers (group_id, nama_marker, deskripsi, geom)
        VALUES (:group_id, :nama_marker, :deskripsi, ST_SetSRID(ST_GeomFromGeoJSON(:geojson), 4326))
        RETURNING id
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute([
        ':group_id' => $group_id,
        ':nama_marker' => $nama_marker,
        ':deskripsi' => $deskripsi,
        ':geojson' => $geojson
    ]);
    $id = $stmt->fetchColumn();

    echo json_encode([
        'status' => 'success',
        'message' => 'Marker berhasil disimpan.',
        'data' => [
            'id' => $id,
            'group_id' => $group_id,
            'nama_marker' => $nama_marker,
            'deskripsi' => $deskripsi
        ]
    ]);
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Gagal menyimpan marker: ' . $e->getMessage()
    ]);
}
