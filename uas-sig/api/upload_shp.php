<?php
// api/upload_shp.php — Upload & import Shapefile ke PostGIS (tanpa GDAL, pakai PHP murni)
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$pdo = require __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Method tidak diizinkan']); exit;
}

$target_table = $_POST['target_table'] ?? 'daerah_satu'; 
if (trim($target_table) === '') {
    $target_table = 'daerah_satu';
}
// Sanitasi: lowercase, space -> underscore, remove special chars
$target_table = strtolower(trim($target_table));
$target_table = preg_replace('/\s+/', '_', $target_table);
$target_table = preg_replace('/[^a-z0-9_]/', '', $target_table);
if (empty($target_table)) {
    $target_table = 'daerah_satu';
}

// Validasi file yang diupload: minimal .shp atau .dbf harus ada
if (empty($_FILES['shp']['tmp_name']) && empty($_FILES['dbf']['tmp_name'])) {
    echo json_encode(['status' => 'error', 'message' => 'File .shp atau .dbf wajib diupload']); exit;
}

$upload_dir = sys_get_temp_dir() . '/shp_upload_' . time() . '/';
mkdir($upload_dir, 0755, true);

// Simpan file yang diupload ke temp dir jika ada
$shp_path = !empty($_FILES['shp']['tmp_name']) ? $upload_dir . 'upload.shp' : null;
$dbf_path = !empty($_FILES['dbf']['tmp_name']) ? $upload_dir . 'upload.dbf' : null;
$prj_path = !empty($_FILES['prj']['tmp_name']) ? $upload_dir . 'upload.prj' : null;
$shx_path = !empty($_FILES['shx']['tmp_name']) ? $upload_dir . 'upload.shx' : null;

if ($shp_path) move_uploaded_file($_FILES['shp']['tmp_name'], $shp_path);
if ($dbf_path) move_uploaded_file($_FILES['dbf']['tmp_name'], $dbf_path);
if ($prj_path) move_uploaded_file($_FILES['prj']['tmp_name'], $prj_path);
if ($shx_path) move_uploaded_file($_FILES['shx']['tmp_name'], $shx_path);

// Muat library PHP Shapefile reader
require_once __DIR__ . '/../lib/ShapeFile.php';

try {
    $shp = new ShapeFileReader($shp_path, $dbf_path);
    $records = $shp->read();

    if (empty($records)) {
        echo json_encode(['status' => 'error', 'message' => 'Shapefile kosong atau tidak terbaca']); exit;
    }

    $imported = 0;
    $errors   = [];

    $is_predefined = in_array($target_table, ['kecamatan', 'fasilitas_kesehatan']);

    // Pastikan kolom geom pada fasilitas_kesehatan nullable agar bisa menampung data tanpa geom (jika upload dbf saja)
    if ($target_table === 'fasilitas_kesehatan') {
        $pdo->exec("ALTER TABLE fasilitas_kesehatan ALTER COLUMN geom DROP NOT NULL");
    }

    // Jika bukan tabel bawaan, buat tabelnya secara dinamis
    if (!$is_predefined) {
        // Drop tabel lama jika ada
        $pdo->exec("DROP TABLE IF EXISTS \"$target_table\" CASCADE");

        // Tentukan kolom data berdasarkan baris pertama
        $cols = ["id SERIAL PRIMARY KEY"];
        if (!empty($records[0]['attributes'])) {
            foreach (array_keys($records[0]['attributes']) as $col_name) {
                $clean_col = strtolower(preg_replace('/[^a-zA-Z0-9_]/', '_', $col_name));
                if ($clean_col === 'id' || $clean_col === 'geom') $clean_col .= '_attr';
                $cols[] = "\"$clean_col\" TEXT";
            }
        }
        $cols[] = "geom GEOMETRY(Geometry, 4326)";

        $create_sql = "CREATE TABLE \"$target_table\" (\n" . implode(",\n", $cols) . "\n)";
        $pdo->exec($create_sql);
    }

    $pdo->beginTransaction();

    // Siapkan statement untuk tabel dinamis
    if (!$is_predefined) {
        $insert_cols = [];
        $insert_placeholders = [];
        if (!empty($records[0]['attributes'])) {
            foreach (array_keys($records[0]['attributes']) as $col_name) {
                $clean_col = strtolower(preg_replace('/[^a-zA-Z0-9_]/', '_', $col_name));
                if ($clean_col === 'id' || $clean_col === 'geom') $clean_col .= '_attr';
                $insert_cols[] = "\"$clean_col\"";
                $insert_placeholders[] = ":$clean_col";
            }
        }
        $insert_cols[] = "geom";
        $insert_placeholders[] = "CASE WHEN :wkt::text IS NULL THEN NULL ELSE ST_GeomFromText(:wkt, 4326) END";

        $insert_sql = "INSERT INTO \"$target_table\" (" . implode(', ', $insert_cols) . ") 
                       VALUES (" . implode(', ', $insert_placeholders) . ")";
        $dyn_stmt = $pdo->prepare($insert_sql);
    }

    foreach ($records as $i => $record) {
        try {
            $geom_wkt  = $record['geometry_wkt'] ?? null;
            $attrs     = $record['attributes']   ?? [];

            if (!$geom_wkt && empty($attrs)) continue;

            if ($target_table === 'kecamatan') {
                // Cari kolom nama kecamatan
                $nama_kec = $attrs['NAMOBJ']   ?? $attrs['KECAMATAN'] ?? $attrs['WADMKC']
                         ?? $attrs['NAME']     ?? $attrs['NAMA']      ?? $attrs['name']
                         ?? "Kecamatan " . ($i + 1);

                $kode     = $attrs['KDBBPS']   ?? $attrs['KODE']      ?? $attrs['ID']     ?? null;
                $kab      = $attrs['KABKOT']   ?? $attrs['KABUPATEN'] ?? $attrs['WADMKK'] ?? null;

                $geom_sql = $geom_wkt ? "ST_Multi(ST_GeomFromText(:wkt, 4326))" : "NULL";
                $stmt = $pdo->prepare("
                    INSERT INTO kecamatan (nama_kecamatan, kode_kecamatan, kabupaten, geom)
                    VALUES (:nama, :kode, :kab, $geom_sql)
                    ON CONFLICT DO NOTHING
                ");
                $params = [
                    ':nama' => $nama_kec,
                    ':kode' => $kode,
                    ':kab'  => $kab,
                ];
                if ($geom_wkt) {
                    $params[':wkt'] = $geom_wkt;
                }
                $stmt->execute($params);

            } elseif ($target_table === 'fasilitas_kesehatan') {
                $nama   = $attrs['NAMA']     ?? $attrs['NAME']    ?? "Fasilitas " . ($i + 1);
                $jenis  = $attrs['JENIS']    ?? $attrs['TYPE']    ?? 'Puskesmas';
                $alamat = $attrs['ALAMAT']   ?? $attrs['ADDRESS'] ?? null;
                $telp   = $attrs['TELEPON']  ?? $attrs['TELP']    ?? null;

                // Pastikan jenis valid
                $valid_jenis = ['Puskesmas', 'Rumah Sakit', 'Klinik', 'Apotek'];
                if (!in_array($jenis, $valid_jenis)) $jenis = 'Puskesmas';

                $geom_sql = $geom_wkt ? "ST_GeomFromText(:wkt, 4326)" : "NULL";
                $stmt = $pdo->prepare("
                    INSERT INTO fasilitas_kesehatan (nama, jenis, alamat, telepon, geom, updated_at)
                    VALUES (:nama, :jenis, :alamat, :telp, $geom_sql, NOW())
                ");
                $params = [
                    ':nama'   => $nama,
                    ':jenis'  => $jenis,
                    ':alamat' => $alamat,
                    ':telp'   => $telp,
                ];
                if ($geom_wkt) {
                    $params[':wkt'] = $geom_wkt;
                }
                $stmt->execute($params);
            } else {
                // Dynamic Table Insert
                $params = [];
                if (!empty($records[0]['attributes'])) {
                    foreach (array_keys($records[0]['attributes']) as $col_name) {
                        $clean_col = strtolower(preg_replace('/[^a-zA-Z0-9_]/', '_', $col_name));
                        if ($clean_col === 'id' || $clean_col === 'geom') $clean_col .= '_attr';
                        $params[":$clean_col"] = $attrs[$col_name] ?? null;
                    }
                }
                $params[':wkt'] = $geom_wkt;
                $dyn_stmt->execute($params);
            }
            $imported++;
        } catch (Exception $rowErr) {
            $errors[] = "Baris " . ($i+1) . ": " . $rowErr->getMessage();
        }
    }

    $pdo->commit();

    // Buat Spatial Index untuk tabel dinamis
    if (!$is_predefined) {
        try {
            $pdo->exec("CREATE INDEX ON \"$target_table\" USING GIST(geom)");
        } catch (Exception $idxErr) {
            // Abaikan error index
        }
    }

    // Cleanup temp files
    array_map('unlink', glob($upload_dir . '*'));
    rmdir($upload_dir);

    echo json_encode([
        'status'   => 'success',
        'message'  => "$imported data berhasil diimport ke tabel $target_table",
        'imported' => $imported,
        'errors'   => $errors,
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    // Cleanup
    array_map('unlink', glob($upload_dir . '*'));
    @rmdir($upload_dir);

    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
