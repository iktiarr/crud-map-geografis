<?php
/**
 * setup_all_databases.php
 * Script inisialisasi & migrasi otomatis untuk seluruh database di 'folder utama'
 * Menggunakan database PostgreSQL (Neon Cloud) dari .env.
 */

require_once __DIR__ . '/db_config.php';

$is_web = PHP_SAPI !== 'cli';
if ($is_web) {
    header('Content-Type: text/html; charset=utf-8');
    echo "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Migrasi Database GIS</title>
    <style>body{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;background:#0f172a;color:#f8fafc;padding:2rem;} .ok{color:#4ade80;} .err{color:#f87171;} .info{color:#38bdf8;} .warn{color:#fbbf24;} pre{background:#1e293b;padding:1.5rem;border-radius:12px;border:1px solid #334155;overflow-x:auto;}</style></head><body><h2>🚀 Inisialisasi Database PostgreSQL & PostGIS</h2><pre>";
}

function log_msg($msg, $type = 'info') {
    global $is_web;
    $colors = ['ok' => "\033[32m", 'err' => "\033[31m", 'info' => "\033[36m", 'warn' => "\033[33m", 'reset' => "\033[0m"];
    if ($is_web) {
        $classes = ['ok' => 'ok', 'err' => 'err', 'info' => 'info', 'warn' => 'warn'];
        $cls = $classes[$type] ?? 'info';
        echo "<span class='{$cls}'>{$msg}</span>\n";
        @ob_flush(); @flush();
    } else {
        $c = $colors[$type] ?? '';
        $r = $colors['reset'] ?? '';
        echo "{$c}{$msg}{$r}\n";
    }
}

log_msg("=== MEMULAI SETUP DATABASE POSTGRESQL & POSTGIS ===", 'info');

try {
    $pdo = get_db_pdo();
    $cfg = get_db_config();
    log_msg("✅ Terhubung ke database: {$cfg['dbname']} pada host {$cfg['host']}", 'ok');

    // 1. PostGIS Extension
    log_msg("\n[1/7] Memeriksa & Mengaktifkan Ekstensi PostGIS...", 'info');
    $pdo->exec("CREATE EXTENSION IF NOT EXISTS postgis;");
    $postgis_ver = $pdo->query("SELECT PostGIS_Version();")->fetchColumn();
    log_msg("✅ Ekstensi PostGIS aktif: {$postgis_ver}", 'ok');

    // 2. Buat Semua Tabel
    log_msg("\n[2/7] Membuat & Menyesuaikan Tabel Skema...", 'info');

    // Tabel kecamatan
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS kecamatan (
            id SERIAL PRIMARY KEY,
            nama_kecamatan VARCHAR(100) NOT NULL,
            kode_kecamatan VARCHAR(20),
            kabupaten VARCHAR(100),
            provinsi VARCHAR(100) DEFAULT 'Jawa Barat',
            geom GEOMETRY(MultiPolygon, 4326),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_kecamatan_geom ON kecamatan USING GIST(geom);
    ");
    log_msg(" - Tabel 'kecamatan' siap.", 'ok');

    // Tabel sekolah (diki, index.php)
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS sekolah (
            id SERIAL PRIMARY KEY,
            nama_sekolah VARCHAR(255) NOT NULL,
            jenjang VARCHAR(50) NOT NULL,
            alamat TEXT,
            geom GEOMETRY(Point, 4326) NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_sekolah_geom ON sekolah USING GIST(geom);
    ");
    log_msg(" - Tabel 'sekolah' siap.", 'ok');

    // Tabel lokasi2 (bapak.php, teman.php, diki)
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS lokasi2 (
            id SERIAL PRIMARY KEY,
            nama VARCHAR(255) NOT NULL,
            geom GEOMETRY(Geometry, 4326) NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_lokasi2_geom ON lokasi2 USING GIST(geom);
    ");
    log_msg(" - Tabel 'lokasi2' siap.", 'ok');

    // Tabel groups & wilayah & group_boundary (sig-leaflet)
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS groups (
            id SERIAL PRIMARY KEY,
            nama_group VARCHAR(255) NOT NULL,
            deskripsi TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS wilayah (
            id SERIAL PRIMARY KEY,
            group_id INT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
            nama_wilayah VARCHAR(255) NOT NULL,
            geom GEOMETRY(Polygon, 4326) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_wilayah_geom ON wilayah USING GIST(geom);

        CREATE TABLE IF NOT EXISTS group_boundary (
            id SERIAL PRIMARY KEY,
            group_id INT UNIQUE NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
            nama_boundary VARCHAR(255) NOT NULL,
            geom GEOMETRY(Geometry, 4326) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_group_boundary_geom ON group_boundary USING GIST(geom);
    ");
    log_msg(" - Tabel 'groups', 'wilayah', 'group_boundary' siap.", 'ok');

    // Tabel markers (sig-leaflet, crud-map.php, peta)
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS markers (
            id SERIAL PRIMARY KEY,
            group_id INT REFERENCES groups(id) ON DELETE CASCADE,
            nama VARCHAR(255),
            nama_marker VARCHAR(255),
            deskripsi TEXT,
            tipe VARCHAR(50),
            warna VARCHAR(50) DEFAULT '#10b981',
            radius FLOAT DEFAULT NULL,
            tipe_layer VARCHAR(50) DEFAULT 'geojson',
            image_url TEXT DEFAULT NULL,
            geom GEOMETRY(GEOMETRY, 4326),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_markers_geom ON markers USING GIST(geom);
    ");
    // Dynamic column ensure
    $pdo->exec("ALTER TABLE markers ADD COLUMN IF NOT EXISTS group_id INT REFERENCES groups(id) ON DELETE CASCADE");
    $pdo->exec("ALTER TABLE markers ADD COLUMN IF NOT EXISTS nama_marker VARCHAR(255)");
    $pdo->exec("ALTER TABLE markers ADD COLUMN IF NOT EXISTS deskripsi TEXT");
    $pdo->exec("ALTER TABLE markers ADD COLUMN IF NOT EXISTS warna VARCHAR(50) DEFAULT '#10b981'");
    $pdo->exec("ALTER TABLE markers ADD COLUMN IF NOT EXISTS radius FLOAT DEFAULT NULL");
    $pdo->exec("ALTER TABLE markers ADD COLUMN IF NOT EXISTS tipe_layer VARCHAR(50) DEFAULT 'geojson'");
    $pdo->exec("ALTER TABLE markers ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL");
    log_msg(" - Tabel 'markers' siap & kolom diselaraskan.", 'ok');

    // Tabel fasilitas_kesehatan (uas-sig)
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS fasilitas_kesehatan (
            id SERIAL PRIMARY KEY,
            nama VARCHAR(255) NOT NULL,
            jenis VARCHAR(50) NOT NULL,
            alamat TEXT,
            telepon VARCHAR(20),
            status VARCHAR(30) DEFAULT 'Aktif',
            kecamatan_id INTEGER,
            geom GEOMETRY(Point, 4326),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_fasilitas_geom ON fasilitas_kesehatan USING GIST(geom);
        CREATE INDEX IF NOT EXISTS idx_fasilitas_kec_id ON fasilitas_kesehatan(kecamatan_id);
    ");
    log_msg(" - Tabel 'fasilitas_kesehatan' siap.", 'ok');

    // Tabel kustom gambar & metadata (uas-sig)
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS custom_polygons (
            id SERIAL PRIMARY KEY,
            nama_wilayah VARCHAR(255) NOT NULL,
            geom GEOMETRY(Polygon, 4326),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_custom_polygons_geom ON custom_polygons USING GIST(geom);

        CREATE TABLE IF NOT EXISTS custom_polylines (
            id SERIAL PRIMARY KEY,
            nama_polyline VARCHAR(255) NOT NULL,
            geom GEOMETRY(LineString, 4326),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_custom_polylines_geom ON custom_polylines USING GIST(geom);

        CREATE TABLE IF NOT EXISTS custom_markers (
            id SERIAL PRIMARY KEY,
            nama_marker VARCHAR(255) NOT NULL,
            deskripsi TEXT,
            geom GEOMETRY(Point, 4326),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_custom_markers_geom ON custom_markers USING GIST(geom);

        CREATE TABLE IF NOT EXISTS custom_drawings (
            id SERIAL PRIMARY KEY,
            nama VARCHAR(255) NOT NULL,
            tipe VARCHAR(50) NOT NULL,
            warna VARCHAR(50) DEFAULT '#ef4444',
            deskripsi TEXT,
            geom GEOMETRY(GEOMETRY, 4326),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_custom_drawings_geom ON custom_drawings USING GIST(geom);

        CREATE TABLE IF NOT EXISTS import_metadata (
            table_name VARCHAR(255) PRIMARY KEY,
            files VARCHAR(255) NOT NULL
        );
    ");
    log_msg(" - Tabel custom drawings & metadata siap.", 'ok');

    // 3. SEEDING DATA AWAL
    log_msg("\n[3/7] Mengisi Data Sampel Awal (Jika Kosong)...", 'info');

    // A. Kecamatan
    $kecCount = (int)$pdo->query("SELECT COUNT(*) FROM kecamatan")->fetchColumn();
    if ($kecCount === 0) {
        log_msg(" - Menambahkan data kecamatan awal...", 'info');
        $pdo->exec("
            INSERT INTO kecamatan (nama_kecamatan, kode_kecamatan, kabupaten, provinsi, geom) VALUES
            ('Kuningan', '32.08.01', 'Kabupaten Kuningan', 'Jawa Barat', 
             ST_Multi(ST_GeomFromText('POLYGON((108.45 -6.98, 108.52 -6.98, 108.52 -6.92, 108.45 -6.92, 108.45 -6.98))', 4326))),
            ('Cigugur', '32.08.02', 'Kabupaten Kuningan', 'Jawa Barat', 
             ST_Multi(ST_GeomFromText('POLYGON((108.43 -7.02, 108.49 -7.02, 108.49 -6.96, 108.43 -6.96, 108.43 -7.02))', 4326))),
            ('Coblong', '32.73.05', 'Kota Bandung', 'Jawa Barat', 
             ST_Multi(ST_GeomFromText('POLYGON((107.60 -6.90, 107.64 -6.90, 107.64 -6.86, 107.60 -6.86, 107.60 -6.90))', 4326))),
            ('Sukolilo', '35.78.11', 'Kota Surabaya', 'Jawa Timur', 
             ST_Multi(ST_GeomFromText('POLYGON((112.76 -7.31, 112.82 -7.31, 112.82 -7.26, 112.76 -7.26, 112.76 -7.31))', 4326))),
            ('Gubeng', '35.78.08', 'Kota Surabaya', 'Jawa Timur', 
             ST_Multi(ST_GeomFromText('POLYGON((112.73 -7.29, 112.77 -7.29, 112.77 -7.25, 112.73 -7.25, 112.73 -7.29))', 4326)));
        ");
        log_msg("   ✅ 5 Kecamatan berhasil ditambahkan.", 'ok');
    } else {
        log_msg("   ℹ️ Data kecamatan sudah ada ({$kecCount} baris).", 'info');
    }

    // B. Sekolah (untuk index.php & diki/admin.php)
    $sekolahCount = (int)$pdo->query("SELECT COUNT(*) FROM sekolah")->fetchColumn();
    if ($sekolahCount === 0) {
        log_msg(" - Menambahkan data sekolah awal...", 'info');
        $pdo->exec("
            INSERT INTO sekolah (nama_sekolah, jenjang, alamat, geom) VALUES
            ('SD Negeri 1 Kuningan', 'SD', 'Jl. Siliwangi No. 12, Kuningan', ST_SetSRID(ST_MakePoint(108.484, -6.954), 4326)),
            ('SMP Negeri 1 Kuningan', 'SMP', 'Jl. Jend. Sudirman No. 45, Kuningan', ST_SetSRID(ST_MakePoint(108.489, -6.961), 4326)),
            ('SMA Negeri 1 Kuningan', 'SMA', 'Jl. Veteran No. 88, Kuningan', ST_SetSRID(ST_MakePoint(108.478, -6.945), 4326)),
            ('SMP Negeri 1 Cigugur', 'SMP', 'Jl. Raya Cigugur No. 20, Cigugur', ST_SetSRID(ST_MakePoint(108.455, -6.985), 4326)),
            ('SMA Negeri 2 Kuningan', 'SMA', 'Jl. Sukamulya No. 5, Kuningan', ST_SetSRID(ST_MakePoint(108.498, -6.948), 4326)),
            ('SD Negeri Klampis Ngasem', 'SD', 'Jl. Klampis Ngasem No. 34, Sukolilo, Surabaya', ST_SetSRID(ST_MakePoint(112.778, -7.285), 4326)),
            ('SMP Negeri 19 Surabaya', 'SMP', 'Jl. Arif Rahman Hakim No. 101, Sukolilo, Surabaya', ST_SetSRID(ST_MakePoint(112.782, -7.292), 4326)),
            ('SMA Negeri 16 Surabaya', 'SMA', 'Jl. Prapen Indah No. 1, Surabaya', ST_SetSRID(ST_MakePoint(112.754, -7.310), 4326));
        ");
        log_msg("   ✅ 8 Sekolah berhasil ditambahkan.", 'ok');
    } else {
        log_msg("   ℹ️ Data sekolah sudah ada ({$sekolahCount} baris).", 'info');
    }

    // C. Lokasi2 (untuk bapak.php, teman.php, diki/index.php)
    $lokasiCount = (int)$pdo->query("SELECT COUNT(*) FROM lokasi2")->fetchColumn();
    if ($lokasiCount === 0) {
        log_msg(" - Menambahkan data spasial lokasi2 (Area 1, Area 2, Markers)...", 'info');
        $pdo->exec("
            INSERT INTO lokasi2 (nama, geom) VALUES
            ('area 1', ST_SetSRID(ST_GeomFromText('POLYGON((108.45 -6.98, 108.52 -6.98, 108.52 -6.92, 108.45 -6.92, 108.45 -6.98))'), 4326)),
            ('area 2', ST_SetSRID(ST_GeomFromText('POLYGON((108.48 -6.98, 108.55 -6.98, 108.55 -6.92, 108.48 -6.92, 108.48 -6.98))'), 4326)),
            ('marker 1', ST_SetSRID(ST_MakePoint(108.470, -6.950), 4326)),
            ('marker 2', ST_SetSRID(ST_MakePoint(108.500, -6.950), 4326)),
            ('marker 3', ST_SetSRID(ST_MakePoint(108.530, -6.950), 4326)),
            ('marker 4', ST_SetSRID(ST_MakePoint(108.570, -6.950), 4326));
        ");
        log_msg("   ✅ Data lokasi2 (2 Poligon Area + 4 Marker) berhasil ditambahkan.", 'ok');
    } else {
        log_msg("   ℹ️ Data lokasi2 sudah ada ({$lokasiCount} baris).", 'info');
    }

    // D. Groups & Wilayah & Markers (sig-leaflet)
    $groupCount = (int)$pdo->query("SELECT COUNT(*) FROM groups")->fetchColumn();
    if ($groupCount === 0) {
        log_msg(" - Menambahkan sample data groups & wilayah untuk sig-leaflet...", 'info');
        $stmtG = $pdo->prepare("INSERT INTO groups (nama_group, deskripsi) VALUES (:nama, :desc) RETURNING id;");
        $stmtG->execute(['nama' => 'Analisis Spasial Kuningan', 'desc' => 'Group wilayah default untuk pengujian spasial']);
        $groupId = $stmtG->fetchColumn();

        $pdo->exec("
            INSERT INTO wilayah (group_id, nama_wilayah, geom) VALUES
            ($groupId, 'Wilayah A', ST_SetSRID(ST_GeomFromText('POLYGON((108.45 -6.98, 108.52 -6.98, 108.52 -6.92, 108.45 -6.92, 108.45 -6.98))'), 4326)),
            ($groupId, 'Wilayah B', ST_SetSRID(ST_GeomFromText('POLYGON((108.48 -6.98, 108.55 -6.98, 108.55 -6.92, 108.48 -6.92, 108.48 -6.98))'), 4326));

            INSERT INTO group_boundary (group_id, nama_boundary, geom) VALUES
            ($groupId, 'Batas Acuan Kabupaten', ST_SetSRID(ST_GeomFromText('POLYGON((108.40 -7.05, 108.60 -7.05, 108.60 -6.85, 108.40 -6.85, 108.40 -7.05))'), 4326));

            INSERT INTO markers (group_id, nama, nama_marker, deskripsi, warna, geom) VALUES
            ($groupId, 'Kantor Bupati Kuningan', 'Kantor Bupati Kuningan', 'Pusat Pemerintahan', '#3b82f6', ST_SetSRID(ST_MakePoint(108.485, -6.975), 4326)),
            ($groupId, 'Taman Kota Kuningan', 'Taman Kota Kuningan', 'Ruang Terbuka Hijau', '#10b981', ST_SetSRID(ST_MakePoint(108.483, -6.978), 4326)),
            ($groupId, 'Stadion Mashud Wisnusaputra', 'Stadion Mashud', 'Fasilitas Olahraga', '#f59e0b', ST_SetSRID(ST_MakePoint(108.490, -6.965), 4326));
        ");
        log_msg("   ✅ Sample Group, Wilayah A/B, Boundary, dan 3 Marker ditambahkan.", 'ok');
    } else {
        log_msg("   ℹ️ Data groups sudah ada ({$groupCount} baris).", 'info');
    }

    // E. Fasilitas Kesehatan (uas-sig)
    $faskesCount = (int)$pdo->query("SELECT COUNT(*) FROM fasilitas_kesehatan")->fetchColumn();
    if ($faskesCount === 0) {
        log_msg(" - Menambahkan fasilitas kesehatan awal...", 'info');
        $pdo->exec("
            INSERT INTO fasilitas_kesehatan (nama, jenis, alamat, telepon, status, geom) VALUES
            ('RSUD 45 Kuningan', 'Rumah Sakit', 'Jl. Jend. Sudirman No. 68, Kuningan', '0232-871145', 'Aktif', ST_SetSRID(ST_MakePoint(108.488, -6.963), 4326)),
            ('Puskesmas Kuningan', 'Puskesmas', 'Jl. Aruji Kartawinata No. 15, Kuningan', '0232-871890', 'Aktif', ST_SetSRID(ST_MakePoint(108.482, -6.972), 4326)),
            ('Klinik Utama Ciremai', 'Klinik', 'Jl. Siliwangi No. 100, Kuningan', '0232-872233', 'Aktif', ST_SetSRID(ST_MakePoint(108.485, -6.955), 4326)),
            ('Apotek Kimia Farma Kuningan', 'Apotek', 'Jl. Siliwangi No. 50, Kuningan', '0232-873344', 'Aktif', ST_SetSRID(ST_MakePoint(108.484, -6.960), 4326)),
            ('RS Hasan Sadikin Bandung', 'Rumah Sakit', 'Jl. Pasteur No. 38, Bandung', '022-2034953', 'Aktif', ST_SetSRID(ST_MakePoint(107.598, -6.897), 4326)),
            ('Puskesmas Coblong', 'Puskesmas', 'Jl. Puter No. 3, Coblong, Bandung', '022-2501234', 'Aktif', ST_SetSRID(ST_MakePoint(107.618, -6.892), 4326));
        ");
        log_msg("   ✅ 6 Fasilitas Kesehatan berhasil ditambahkan.", 'ok');
    } else {
        log_msg("   ℹ️ Data fasilitas kesehatan sudah ada ({$faskesCount} baris).", 'info');
    }

    // F. Markers umum (crud-map.php & peta.php)
    $markerCount = (int)$pdo->query("SELECT COUNT(*) FROM markers")->fetchColumn();
    if ($markerCount <= 3) {
        log_msg(" - Menambahkan marker umum tambahan untuk peta interaktif...", 'info');
        $pdo->exec("
            INSERT INTO markers (nama, tipe, warna, deskripsi, geom) VALUES
            ('Monumen Nasional (Monas)', 'Point', '#ef4444', 'Ikon Kota Jakarta', ST_SetSRID(ST_MakePoint(106.8271, -6.1754), 4326)),
            ('Gedung Sate Bandung', 'Point', '#3b82f6', 'Pusat Pemerintahan Jabar', ST_SetSRID(ST_MakePoint(107.6191, -6.9025), 4326)),
            ('Tugu Pahlawan Surabaya', 'Point', '#10b981', 'Monumen Sejarah Surabaya', ST_SetSRID(ST_MakePoint(112.7378, -7.2458), 4326));
        ");
        log_msg("   ✅ Marker umum berhasil diperbarui.", 'ok');
    }

    // 4. VERIFIKASI SEMUA TABEL
    log_msg("\n[4/7] Verifikasi Semua Tabel dan Jumlah Data:", 'info');
    $tables = ['kecamatan', 'sekolah', 'lokasi2', 'groups', 'wilayah', 'group_boundary', 'markers', 'fasilitas_kesehatan', 'custom_drawings'];
    foreach ($tables as $t) {
        try {
            $cnt = $pdo->query("SELECT COUNT(*) FROM \"$t\"")->fetchColumn();
            log_msg(" - Tabel '$t' : $cnt baris", 'ok');
        } catch (Exception $e) {
            log_msg(" - Tabel '$t' : GAGAL (" . $e->getMessage() . ")", 'err');
        }
    }

    log_msg("\n==================================================", 'info');
    log_msg("🎉 SETUP DATABASE BERHASIL 100%! SEMUA TABEL SIAP.", 'ok');
    log_msg("==================================================", 'info');

} catch (Exception $e) {
    log_msg("\n❌ TERJADI KESALAHAN: " . $e->getMessage(), 'err');
}

if ($is_web) {
    echo "</pre></body></html>";
}
