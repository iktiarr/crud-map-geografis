<?php
/**
 * api.php - AJAX API Handler
 * GIS Manager | Open Source Edition
 * Handles: list, save, update_geom, delete, export, export_single
 */

error_reporting(0);
ini_set('display_errors', 0);
ob_start();

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/export.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

// ─── LIST ────────────────────────────────────────────────────────────────────
if ($action === 'list') {
    $sql = "SELECT id, nama, warna, radius, tipe_layer, image_url, deskripsi, ST_AsGeoJSON(geom) AS geojson FROM markers ORDER BY id DESC";
    $rs  = pg_query($conn, $sql);
    $features = [];
    while ($row = pg_fetch_assoc($rs)) {
        $features[] = [
            'type'       => 'Feature',
            'geometry'   => $row['geojson'] ? json_decode($row['geojson']) : null,
            'properties' => [
                'id'         => $row['id'],
                'nama'       => $row['nama'],
                'warna'      => $row['warna'] ?: '#10b981',
                'radius'     => $row['radius'] !== null ? (float)$row['radius'] : null,
                'tipe_layer' => $row['tipe_layer'] ?: 'geojson',
                'image_url'  => $row['image_url'],
                'deskripsi'  => $row['deskripsi']
            ]
        ];
    }
    ob_clean();
    echo json_encode(['type' => 'FeatureCollection', 'features' => $features]);
    exit;
}

// ─── SAVE ────────────────────────────────────────────────────────────────────
if ($action === 'save' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $id          = isset($_POST['id']) && $_POST['id'] !== '' ? (int)$_POST['id'] : null;
    $nama        = trim($_POST['nama'] ?? '');
    if (empty($nama)) { $nama = "Lokasi Tanpa Nama"; }
    $nama        = pg_escape_string($conn, $nama);
    $warna       = pg_escape_string($conn, $_POST['warna'] ?? '#10b981') ?: '#10b981';
    $geojson     = $_POST['geojson'] ?? '';
    $radius      = isset($_POST['radius']) && $_POST['radius'] !== '' ? (float)$_POST['radius'] : 'NULL';
    $tipe_layer  = pg_escape_string($conn, $_POST['tipe_layer'] ?? 'geojson');
    $image_url   = isset($_POST['image_url']) && trim($_POST['image_url']) !== '' ? "'" . pg_escape_string($conn, trim($_POST['image_url'])) . "'" : 'NULL';
    $deskripsi   = isset($_POST['deskripsi']) && trim($_POST['deskripsi']) !== '' ? "'" . pg_escape_string($conn, trim($_POST['deskripsi'])) . "'" : 'NULL';

    if (empty($geojson) && $tipe_layer !== 'tile_layer') {
        ob_clean();
        echo json_encode(['status' => 'error', 'message' => 'Geometri kosong. Gambar dulu di peta.']);
        exit;
    }

    if ($id > 0) {
        $geom_sql = !empty($geojson) ? "ST_SetSRID(ST_GeomFromGeoJSON('$geojson'), 4326)" : "geom";
        $sql = "UPDATE markers SET nama='$nama', warna='$warna', geom=$geom_sql, radius=$radius, tipe_layer='$tipe_layer', image_url=$image_url, deskripsi=$deskripsi WHERE id=$id";
    } else {
        $geom_sql = !empty($geojson) ? "ST_SetSRID(ST_GeomFromGeoJSON('$geojson'), 4326)" : "NULL";
        $sql = "INSERT INTO markers (nama, warna, geom, radius, tipe_layer, image_url, deskripsi) VALUES ('$nama', '$warna', $geom_sql, $radius, '$tipe_layer', $image_url, $deskripsi)";
    }

    $rs = pg_query($conn, $sql);
    ob_clean();
    echo $rs ? json_encode(['status' => 'success']) : json_encode(['status' => 'error', 'message' => pg_last_error($conn)]);
    exit;
}

// ─── UPDATE GEOMETRY ─────────────────────────────────────────────────────────
if ($action === 'update_geom' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $id      = (int)$_POST['id'];
    $geojson = $_POST['geojson'];
    pg_query($conn, "UPDATE markers SET geom=ST_SetSRID(ST_GeomFromGeoJSON('$geojson'), 4326) WHERE id=$id");
    ob_clean();
    echo json_encode(['status' => 'success']);
    exit;
}

// ─── DELETE ──────────────────────────────────────────────────────────────────
if ($action === 'delete' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = (int)$_POST['id'];
    pg_query($conn, "DELETE FROM markers WHERE id=$id");
    ob_clean();
    echo json_encode(['status' => 'success']);
    exit;
}

// ─── EXPORTS ─────────────────────────────────────────────────────────────────
if ($action === 'export') {
    $format = $_GET['format'] ?? 'geojson';
    handleBulkExport($conn, $format);
}

if ($action === 'export_single') {
    $id     = (int)($_GET['id'] ?? 0);
    $format = $_GET['format'] ?? 'geojson';
    handleSingleExport($conn, $id, $format);
}

ob_end_flush();
