<?php
// api/save_boundary.php
header('Content-Type: application/json');
$pdo = require __DIR__ . '/../config/database.php';

$input = json_decode(file_get_contents('php://input'), true);
$group_id = $input['group_id'] ?? $_POST['group_id'] ?? null;
$nama_boundary = $input['nama_boundary'] ?? $_POST['nama_boundary'] ?? 'Batas Acuan';
$geojson = $input['geojson'] ?? $_POST['geojson'] ?? null;

if (empty($group_id) || empty($geojson)) {
    echo json_encode(['status' => 'error', 'message' => 'Parameter group_id dan geojson wajib diisi.']);
    exit;
}

// Pastikan geojson dikonversi ke string jika dikirim berupa array
if (is_array($geojson)) {
    $geojson = json_encode($geojson);
}

try {
    // Gunakan UPSERT karena group_id didefinisikan sebagai UNIQUE di database
    $query = "
        INSERT INTO group_boundary (group_id, nama_boundary, geom)
        VALUES (:group_id, :nama_boundary, ST_SetSRID(ST_GeomFromGeoJSON(:geojson), 4326))
        ON CONFLICT (group_id) 
        DO UPDATE SET 
            nama_boundary = EXCLUDED.nama_boundary,
            geom = EXCLUDED.geom,
            created_at = CURRENT_TIMESTAMP
        RETURNING id
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute([
        ':group_id' => $group_id,
        ':nama_boundary' => $nama_boundary,
        ':geojson' => $geojson
    ]);
    $id = $stmt->fetchColumn();

    echo json_encode([
        'status' => 'success',
        'message' => 'Batas acuan group berhasil disimpan.',
        'data' => [
            'id' => $id,
            'group_id' => $group_id,
            'nama_boundary' => $nama_boundary
        ]
    ]);
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Gagal menyimpan batas acuan: ' . $e->getMessage()
    ]);
}
