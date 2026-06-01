<?php
/**
 * export.php - Export Handler
 * GIS Manager | Open Source Edition
 * Handles bulk export (?action=export) and single-item export (?action=export_single)
 */

if (!isset($conn)) die('No DB connection.');

// ─── BULK EXPORT ────────────────────────────────────────────────────────────
function handleBulkExport($conn, $format) {
    $sql = "SELECT id, nama, warna, ST_AsGeoJSON(geom) AS geojson, ST_AsText(geom) AS wkt,
                   ST_X(ST_Centroid(geom)) AS lng, ST_Y(ST_Centroid(geom)) AS lat
            FROM markers ORDER BY id DESC";
    $rs = pg_query($conn, $sql);

    $features  = [];
    $raw_rows  = [];
    while ($row = pg_fetch_assoc($rs)) {
        $features[] = [
            'type'       => 'Feature',
            'geometry'   => json_decode($row['geojson']),
            'properties' => ['id' => (int)$row['id'], 'nama' => $row['nama'], 'warna' => $row['warna']]
        ];
        $raw_rows[] = $row;
    }

    ob_clean();

    switch ($format) {
        case 'geojson':
            header('Content-Type: application/json');
            header('Content-Disposition: attachment; filename="peta_spasial.geojson"');
            echo json_encode(['type' => 'FeatureCollection', 'features' => $features], JSON_PRETTY_PRINT);
            break;

        case 'csv':
            header('Content-Type: text/csv; charset=utf-8');
            header('Content-Disposition: attachment; filename="peta_spasial.csv"');
            $out = fopen('php://output', 'w');
            fputcsv($out, ['ID', 'Nama Lokasi', 'Warna', 'Latitude', 'Longitude', 'WKT']);
            foreach ($raw_rows as $r) {
                fputcsv($out, [$r['id'], $r['nama'], $r['warna'], $r['lat'], $r['lng'], $r['wkt']]);
            }
            fclose($out);
            break;

        case 'kml':
            header('Content-Type: application/vnd.google-earth.kml+xml');
            header('Content-Disposition: attachment; filename="peta_spasial.kml"');
            echo buildKml($raw_rows, 'Peta Spasial GIS Manager');
            break;

        case 'gpx':
            header('Content-Type: application/gpx+xml');
            header('Content-Disposition: attachment; filename="peta_spasial.gpx"');
            echo buildGpx($raw_rows);
            break;
    }
    exit;
}

// ─── SINGLE EXPORT ──────────────────────────────────────────────────────────
function handleSingleExport($conn, $id, $format) {
    $id  = (int)$id;
    $sql = "SELECT id, nama, warna, radius, tipe_layer, image_url, deskripsi,
                   ST_AsGeoJSON(geom) AS geojson, ST_AsText(geom) AS wkt,
                   ST_X(ST_Centroid(geom)) AS lng, ST_Y(ST_Centroid(geom)) AS lat
            FROM markers WHERE id = $id";
    $rs = pg_query($conn, $sql);
    if (!$rs || pg_num_rows($rs) === 0) { http_response_code(404); die('Data tidak ditemukan.'); }

    $row        = pg_fetch_assoc($rs);
    $nama_clean = preg_replace('/[^a-zA-Z0-9_]/', '_', strtolower($row['nama']));
    if (empty($nama_clean)) { $nama_clean = 'lokasi'; }

    ob_clean();

    switch ($format) {
        case 'geojson':
            header('Content-Type: application/json');
            header('Content-Disposition: attachment; filename="' . $nama_clean . '.geojson"');
            echo json_encode([
                'type'     => 'FeatureCollection',
                'features' => [[
                    'type'       => 'Feature',
                    'geometry'   => $row['geojson'] ? json_decode($row['geojson']) : null,
                    'properties' => [
                        'id'         => (int)$row['id'],
                        'nama'       => $row['nama'],
                        'warna'      => $row['warna'],
                        'radius'     => $row['radius'] !== null ? (float)$row['radius'] : null,
                        'tipe_layer' => $row['tipe_layer'],
                        'image_url'  => $row['image_url'],
                        'deskripsi'  => $row['deskripsi']
                    ]
                ]]
            ], JSON_PRETTY_PRINT);
            break;

        case 'csv':
            header('Content-Type: text/csv; charset=utf-8');
            header('Content-Disposition: attachment; filename="' . $nama_clean . '.csv"');
            $out = fopen('php://output', 'w');
            fputcsv($out, ['ID', 'Nama', 'Warna', 'Tipe Layer', 'Radius', 'Image URL', 'Deskripsi', 'Latitude', 'Longitude', 'WKT']);
            fputcsv($out, [$row['id'], $row['nama'], $row['warna'], $row['tipe_layer'], $row['radius'], $row['image_url'], $row['deskripsi'], $row['lat'], $row['lng'], $row['wkt']]);
            fclose($out);
            break;

        case 'wkt':
            header('Content-Type: text/plain; charset=utf-8');
            header('Content-Disposition: attachment; filename="' . $nama_clean . '.wkt"');
            echo $row['wkt'] ?: 'GEOMETRYCOLLECTION EMPTY';
            break;

        case 'sql':
            header('Content-Type: application/sql; charset=utf-8');
            header('Content-Disposition: attachment; filename="' . $nama_clean . '.sql"');
            $wkt_val    = $row['wkt'] ? "ST_GeomFromText('" . $row['wkt'] . "', 4326)" : "NULL";
            $radius_val = $row['radius'] !== null ? (float)$row['radius'] : "NULL";
            $img_val    = $row['image_url'] ? "'" . pg_escape_string($conn, $row['image_url']) . "'" : "NULL";
            $desc_val   = $row['deskripsi'] ? "'" . pg_escape_string($conn, $row['deskripsi']) . "'" : "NULL";
            echo "-- PostGIS Import Script: " . $row['nama'] . "\n";
            echo "INSERT INTO markers (nama, warna, geom, radius, tipe_layer, image_url, deskripsi) VALUES (\n";
            echo "  '" . pg_escape_string($conn, $row['nama']) . "',\n";
            echo "  '" . pg_escape_string($conn, $row['warna']) . "',\n";
            echo "  $wkt_val,\n  $radius_val,\n";
            echo "  '" . pg_escape_string($conn, $row['tipe_layer']) . "',\n";
            echo "  $img_val,\n  $desc_val\n);\n";
            break;

        case 'kml':
            header('Content-Type: application/vnd.google-earth.kml+xml');
            header('Content-Disposition: attachment; filename="' . $nama_clean . '.kml"');
            $desc  = "Warna: " . $row['warna'];
            if ($row['deskripsi']) $desc .= "\nDeskripsi: " . $row['deskripsi'];
            if ($row['radius'])    $desc .= "\nRadius: " . $row['radius'] . "m";
            echo buildKml([$row], $row['nama'], $desc);
            break;

        case 'gpx':
            header('Content-Type: application/gpx+xml');
            header('Content-Disposition: attachment; filename="' . $nama_clean . '.gpx"');
            echo buildGpx([$row]);
            break;
    }
    exit;
}

// ─── KML BUILDER ────────────────────────────────────────────────────────────
function buildKml($rows, $docName = 'GIS Manager', $extraDesc = '') {
    $kml  = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    $kml .= '<kml xmlns="http://www.opengis.net/kml/2.2">' . "\n<Document>\n";
    $kml .= '  <name>' . htmlspecialchars($docName) . "</name>\n";

    foreach ($rows as $row) {
        $geom = $row['geojson'] ? json_decode($row['geojson']) : null;
        $kml .= "  <Placemark>\n";
        $kml .= '    <name>' . htmlspecialchars($row['nama']) . "</name>\n";
        $desc = $extraDesc ?: ("Warna: " . $row['warna']);
        $kml .= '    <description>' . htmlspecialchars($desc) . "</description>\n";

        if ($geom) {
            if ($geom->type === 'Point') {
                $kml .= "    <Point>\n      <coordinates>" . $geom->coordinates[0] . ',' . $geom->coordinates[1] . ",0</coordinates>\n    </Point>\n";
            } elseif ($geom->type === 'LineString') {
                $kml .= "    <LineString>\n      <coordinates>\n";
                foreach ($geom->coordinates as $c) { $kml .= "        " . $c[0] . ',' . $c[1] . ",0\n"; }
                $kml .= "      </coordinates>\n    </LineString>\n";
            } elseif ($geom->type === 'Polygon') {
                $kml .= "    <Polygon>\n      <outerBoundaryIs>\n        <LinearRing>\n          <coordinates>\n";
                foreach ($geom->coordinates[0] as $c) { $kml .= "            " . $c[0] . ',' . $c[1] . ",0\n"; }
                $kml .= "          </coordinates>\n        </LinearRing>\n      </outerBoundaryIs>\n    </Polygon>\n";
            }
        }
        $kml .= "  </Placemark>\n";
    }
    $kml .= "</Document>\n</kml>\n";
    return $kml;
}

// ─── GPX BUILDER ────────────────────────────────────────────────────────────
function buildGpx($rows) {
    $gpx  = '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>' . "\n";
    $gpx .= '<gpx version="1.1" creator="GIS Manager" xmlns="http://www.topografix.com/GPX/1/1">' . "\n";

    foreach ($rows as $row) {
        $geom = $row['geojson'] ? json_decode($row['geojson']) : null;
        if (!$geom) continue;

        if ($geom->type === 'Point') {
            $gpx .= '  <wpt lat="' . $geom->coordinates[1] . '" lon="' . $geom->coordinates[0] . '">' . "\n";
            $gpx .= '    <name>' . htmlspecialchars($row['nama']) . "</name>\n";
            $gpx .= '    <desc>Warna: ' . $row['warna'] . "</desc>\n";
            $gpx .= "  </wpt>\n";
        } elseif ($geom->type === 'LineString' || $geom->type === 'Polygon') {
            $coords = $geom->type === 'LineString' ? $geom->coordinates : $geom->coordinates[0];
            $suffix = $geom->type === 'Polygon' ? ' (Polygon)' : '';
            $gpx .= "  <trk>\n    <name>" . htmlspecialchars($row['nama']) . "$suffix</name>\n    <trkseg>\n";
            foreach ($coords as $c) {
                $gpx .= '      <trkpt lat="' . $c[1] . '" lon="' . $c[0] . '"></trkpt>' . "\n";
            }
            $gpx .= "    </trkseg>\n  </trk>\n";
        }
    }
    $gpx .= "</gpx>\n";
    return $gpx;
}
