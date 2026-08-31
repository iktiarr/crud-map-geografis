<?php
// api/create_fasilitas.php — Tambah fasilitas baru
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Method tidak diizinkan']); exit;
}

$pdo  = require __DIR__ . '/../config/database.php';
$body = json_decode(file_get_contents('php://input'), true);

$nama         = trim($body['nama']         ?? '');
$jenis        = trim($body['jenis']        ?? '');
$alamat       = trim($body['alamat']       ?? '');
$telepon      = trim($body['telepon']      ?? '');
$status       = trim($body['status']       ?? 'Aktif');
$kecamatan_id = $body['kecamatan_id']      ?? null;
$lat          = $body['lat']               ?? null;
$lng          = $body['lng']               ?? null;

if (!$nama || !$jenis || !$lat || !$lng) {
    echo json_encode(['status' => 'error', 'message' => 'Nama, jenis, dan koordinat wajib diisi']); exit;
}

$allowed_jenis = ['Puskesmas', 'Rumah Sakit', 'Klinik', 'Apotek'];
if (!in_array($jenis, $allowed_jenis)) {
    echo json_encode(['status' => 'error', 'message' => 'Jenis tidak valid']); exit;
}

try {
    // Jika kecamatan_id tidak diisi, coba deteksi otomatis via ST_Within
    if (!$kecamatan_id) {
        $stmt_kec = $pdo->prepare("
            SELECT id FROM kecamatan
            WHERE geom IS NOT NULL
              AND ST_Within(ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), geom)
            LIMIT 1
        ");
        $stmt_kec->execute([':lng' => (float)$lng, ':lat' => (float)$lat]);
        $found = $stmt_kec->fetch();
        $kecamatan_id = $found['id'] ?? null;
    }

    $stmt = $pdo->prepare("
        INSERT INTO fasilitas_kesehatan (nama, jenis, alamat, telepon, status, kecamatan_id, geom, updated_at)
        VALUES (:nama, :jenis, :alamat, :telepon, :status, :kec_id,
                ST_SetSRID(ST_MakePoint(:lng, :lat), 4326),
                NOW())
        RETURNING id
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
    ]);
    $new = $stmt->fetch();

    echo json_encode(['status' => 'success', 'message' => 'Fasilitas berhasil ditambahkan', 'id' => $new['id']]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
