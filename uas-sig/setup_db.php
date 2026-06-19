<?php
// setup_db.php — Setup database: aktifkan PostGIS + buat tabel + isi data sample
// Akses via browser: http://localhost:8000/setup_db.php
// atau jalankan: php setup_db.php [neon|local]

$mode = $_GET['mode'] ?? $_GET['db'] ?? (PHP_SAPI === 'cli' ? ($argv[1] ?? 'neon') : 'neon');

// Konfigurasi koneksi
$configs = [
    'neon' => [
        'dsn'  => "pgsql:host=ep-twilight-hill-aopc56nx-pooler.c-2.ap-southeast-1.aws.neon.tech;port=5432;dbname=peta;sslmode=require",
        'user' => 'neondb_owner',
        'pass' => 'npg_PEShmOx94tXD',
        'label'=> '☁️  Neon (Cloud)',
    ],
    'local' => [
        'dsn'  => "pgsql:host=localhost;port=5432;dbname=peta;sslmode=disable",
        'user' => 'postgres',
        'pass' => 'admin123',
        'label'=> '🖥️  Lokal (localhost)',
    ],
];

$cfg = $configs[$mode] ?? $configs['neon'];
$is_web = PHP_SAPI !== 'cli';

if ($is_web) {
    header('Content-Type: text/html; charset=utf-8');
    echo "<!DOCTYPE html><html lang='id' data-theme='light'>
    <head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'>
    <title>Setup Database</title>
    <link rel='stylesheet' href='assets/css/style.css'>
    <link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'>
    </head><body>
    <header>
        <h1><div class='brand-icon'><i class='fas fa-database'></i></div> <span>Setup</span> Database</h1>
        <div class='header-nav'>
            <a href='index.php' class='btn btn-outline btn-sm'><i class='fas fa-map'></i> Peta</a>
            <a href='admin/index.php' class='btn btn-secondary btn-sm'><i class='fas fa-cog'></i> Admin</a>
        </div>
    </header>
    <div class='page-container' style='max-width:700px;'>
    <div class='page-header'>
        <div>
            <h2 class='page-title'>Setup <span>Database</span></h2>
            <p class='page-subtitle'>Membuat tabel & data awal Web GIS</p>
        </div>
    </div>
    <div style='display:flex;gap:.5rem;margin-bottom:1.25rem;'>
        <a href='?mode=neon' class='btn " . ($mode==='neon'?'btn-primary':'btn-outline') . "'><i class='fas fa-cloud'></i> Neon (Cloud)</a>
        <a href='?mode=local' class='btn " . ($mode==='local'?'btn-primary':'btn-outline') . "'><i class='fas fa-server'></i> Lokal</a>
    </div>
    <div class='card'><div class='card-header'><h3><i class='fas fa-terminal' style='color:var(--primary);'></i> {$cfg['label']}</h3></div>
    <div class='card-body'><pre style='font-family:monospace;font-size:.82rem;line-height:1.8;white-space:pre-wrap;'>";
}

function log_line($msg, $type = 'info') {
    global $is_web;
    if ($is_web) {
        $colors = ['ok'=>'#16a34a','error'=>'#dc2626','info'=>'#475569','warn'=>'#d97706'];
        $color  = $colors[$type] ?? '#475569';
        echo "<span style='color:{$color};'>{$msg}</span>\n";
        ob_flush(); flush();
    } else {
        echo $msg . "\n";
    }
}

// =====================================================
// KONEKSI
// =====================================================
log_line("Mencoba koneksi ke {$cfg['label']}...", 'info');

try {
    $pdo = new PDO($cfg['dsn'], $cfg['user'], $cfg['pass'], [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    log_line("✅ Koneksi berhasil!", 'ok');
} catch (PDOException $e) {
    log_line("❌ Gagal konek: " . $e->getMessage(), 'error');
    if ($is_web) echo "</pre></div></div></div></body></html>";
    exit(1);
}

// =====================================================
// STEP 1: Aktifkan PostGIS
// =====================================================
log_line("\n--- STEP 1: Aktifkan Extension PostGIS ---", 'info');
try {
    $pdo->exec("CREATE EXTENSION IF NOT EXISTS postgis;");
    $ver = $pdo->query("SELECT PostGIS_version()")->fetchColumn();
    log_line("✅ PostGIS aktif — versi: $ver", 'ok');
} catch (PDOException $e) {
    log_line("❌ PostGIS gagal: " . $e->getMessage(), 'error');
    log_line("   → Pastikan ekstensi postgis tersedia di server PostgreSQL ini.", 'warn');
    if ($is_web) echo "</pre></div></div></div></body></html>";
    exit(1);
}

// =====================================================
// STEP 2: Hapus tabel lama (dengan CASCADE aman)
// =====================================================
log_line("\n--- STEP 2: Bersihkan tabel lama ---", 'info');
// Tabel fasilitas_kesehatan dilewati
try {
    $pdo->exec("DROP TABLE IF EXISTS kecamatan CASCADE;");
    log_line("✅ Tabel kecamatan dibersihkan", 'ok');
} catch (PDOException $e) {
    log_line("⚠️  kecamatan: " . $e->getMessage(), 'warn');
}

// =====================================================
// STEP 3: Buat tabel KECAMATAN
// =====================================================
log_line("\n--- STEP 3: Buat tabel kecamatan ---", 'info');
try {
    $pdo->exec("
        CREATE TABLE kecamatan (
            id              SERIAL PRIMARY KEY,
            nama_kecamatan  VARCHAR(100) NOT NULL,
            kode_kecamatan  VARCHAR(20),
            kabupaten       VARCHAR(100),
            provinsi        VARCHAR(100) DEFAULT 'Jawa Barat',
            geom            GEOMETRY(MultiPolygon, 4326),
            created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    ");
    log_line("✅ Tabel kecamatan dibuat", 'ok');
} catch (PDOException $e) {
    log_line("❌ Gagal buat kecamatan: " . $e->getMessage(), 'error');
    if ($is_web) echo "</pre></div></div></div></body></html>";
    exit(1);
}

// STEP 4: Buat tabel fasilitas_kesehatan (Dilewati)

// =====================================================
// STEP 5: Buat Spatial Index
// =====================================================
log_line("\n--- STEP 5: Buat Spatial Index ---", 'info');
$indexes = [
    "CREATE INDEX IF NOT EXISTS idx_kecamatan_geom    ON kecamatan USING GIST(geom);",
];
foreach ($indexes as $idx_sql) {
    try {
        $pdo->exec($idx_sql);
        log_line("✅ Index dibuat", 'ok');
    } catch (PDOException $e) {
        log_line("⚠️  Index: " . $e->getMessage(), 'warn');
    }
}

// =====================================================
// STEP 5.5: Buat Tabel Kustom Gambar (custom_drawings, dll.)
// =====================================================
log_line("\n--- STEP 5.5: Buat Tabel Kustom Gambar ---", 'info');
try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS custom_polygons (
            id SERIAL PRIMARY KEY,
            nama_wilayah VARCHAR(255) NOT NULL,
            geom GEOMETRY(Polygon, 4326),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS custom_polylines (
            id SERIAL PRIMARY KEY,
            nama_polyline VARCHAR(255) NOT NULL,
            geom GEOMETRY(LineString, 4326),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS custom_markers (
            id SERIAL PRIMARY KEY,
            nama_marker VARCHAR(255) NOT NULL,
            deskripsi TEXT,
            geom GEOMETRY(Point, 4326),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS custom_drawings (
            id SERIAL PRIMARY KEY,
            nama VARCHAR(255) NOT NULL,
            tipe VARCHAR(50) NOT NULL,
            warna VARCHAR(50) DEFAULT '#ef4444',
            deskripsi TEXT,
            geom GEOMETRY(GEOMETRY, 4326),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_custom_polygons_geom ON custom_polygons USING GIST(geom);
        CREATE INDEX IF NOT EXISTS idx_custom_polylines_geom ON custom_polylines USING GIST(geom);
        CREATE INDEX IF NOT EXISTS idx_custom_markers_geom ON custom_markers USING GIST(geom);
        CREATE INDEX IF NOT EXISTS idx_custom_drawings_geom ON custom_drawings USING GIST(geom);
    ");
    log_line("✅ Tabel kustom gambar berhasil dibuat/dipastikan ada", 'ok');
} catch (PDOException $e) {
    log_line("❌ Gagal buat tabel kustom gambar: " . $e->getMessage(), 'error');
}

// =====================================================
// STEP 6 & 7: Insert Data Sample (Dilewati sesuai request database kosong)
// =====================================================
log_line("\n--- STEP 6 & 7: Insert data sample (Dilewati) ---", 'info');
log_line("ℹ️ Database dikonfigurasi kosong tanpa data contoh.", 'info');
$total_kec = 0;
$total_fas = 0;


// =====================================================
// SELESAI — Verifikasi
// =====================================================
log_line("\n--- VERIFIKASI AKHIR ---", 'info');
$total_kec = $pdo->query("SELECT COUNT(*) FROM kecamatan")->fetchColumn();
$postgis   = $pdo->query("SELECT PostGIS_version()")->fetchColumn();

log_line("📍 Kecamatan  : $total_kec baris", 'ok');
log_line("🗺️  PostGIS   : $postgis", 'ok');
log_line("\n🎉 SELESAI! Database siap digunakan.", 'ok');

if ($is_web) {
    echo "</pre></div></div>
    <div style='display:flex;gap:.75rem;margin-top:1.25rem;flex-wrap:wrap;'>
        <a href='index.php' class='btn btn-primary'><i class='fas fa-map'></i> Buka Peta Publik</a>
        <a href='admin/index.php' class='btn btn-secondary'><i class='fas fa-cog'></i> Panel Admin</a>
        <a href='setup_db.php?mode=" . ($mode==='neon'?'local':'neon') . "' class='btn btn-outline'><i class='fas fa-sync'></i> Setup " . ($mode==='neon'?'Lokal':'Neon') . " juga</a>
    </div>
    </div></body></html>";
}
