<?php
// api/update_fasilitas.php — Edit data fasilitas
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

$pdo  = require __DIR__ . '/../config/database.php';
$body = json_decode(file_get_contents('php://input'), true);

$id           = $body['id']           ?? null;
$nama         = trim($body['nama']    ?? '');
$jenis        = trim($body['jenis']   ?? '');
$alamat       = trim($body['alamat']  ?? '');
$telepon      = trim($body['telepon'] ?? '');
$status       = trim($body['status']  ?? 'Aktif');
$kecamatan_id = $body['kecamatan_id'] ?? null;
$lat          = $body['lat']          ?? null;
$lng          = $body['lng']          ?? null;

if (!$id || !$nama || !$jenis) {
    echo json_encode(['status' => 'error', 'message' => 'ID, nama, dan jenis wajib diisi']); exit;
}

try {
    if ($lat && $lng) {
        // Update termasuk koordinat (geom)
        $stmt = $pdo->prepare("
            UPDATE fasilitas_kesehatan
            SET nama = :nama, jenis = :jenis, alamat = :alamat, telepon = :telepon,
                status = :status, kecamatan_id = :kec_id,
                geom = ST_SetSRID(ST_MakePoint(:lng, :lat), 4326),
                updated_at = NOW()
            WHERE id = :id
        ");
        $stmt->execute([
            ':nama'    => $nama,
            ':jenis'   => $jenis,
            ':alamat'  => $alamat,
            ':telepon' => $telepon,
            ':status'  => $status,
            ':kec_id'  => $kecamatan_id ?: null,
            ':lng'     => (float)$lng,
            ':lat'     => (float)$lat,
            ':id'      => (int)$id,
        ]);
    } else {
        // Update tanpa mengubah koordinat
        $stmt = $pdo->prepare("
            UPDATE fasilitas_kesehatan
            SET nama = :nama, jenis = :jenis, alamat = :alamat, telepon = :telepon,
                status = :status, kecamatan_id = :kec_id, updated_at = NOW()
            WHERE id = :id
        ");
        $stmt->execute([
            ':nama'    => $nama,
            ':jenis'   => $jenis,
            ':alamat'  => $alamat,
            ':telepon' => $telepon,
            ':status'  => $status,
            ':kec_id'  => $kecamatan_id ?: null,
            ':id'      => (int)$id,
        ]);
    }

    echo json_encode(['status' => 'success', 'message' => 'Fasilitas berhasil diperbarui']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
