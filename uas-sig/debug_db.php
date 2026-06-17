<?php
// debug_db.php — Diagnosa koneksi & status tabel
header('Content-Type: text/plain; charset=utf-8');

// ===== NEON =====
echo "========================================\n";
echo "TES KONEKSI: NEON (Cloud)\n";
echo "========================================\n";
try {
    $dsn_neon = "pgsql:host=ep-twilight-hill-aopc56nx-pooler.c-2.ap-southeast-1.aws.neon.tech;port=5432;dbname=peta;sslmode=require";
    $pdo_neon = new PDO($dsn_neon, 'neondb_owner', 'npg_PEShmOx94tXD', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    echo "✅ Neon TERHUBUNG\n";

    // Cek tabel
    $tables = $pdo_neon->query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")->fetchAll(PDO::FETCH_COLUMN);
    echo "Tabel di Neon: " . (empty($tables) ? '(tidak ada!)' : implode(', ', $tables)) . "\n";

    // Cek PostGIS
    try {
        $ver = $pdo_neon->query("SELECT PostGIS_version()")->fetchColumn();
        echo "PostGIS: ✅ $ver\n";
    } catch(Exception $e) {
        echo "PostGIS: ❌ Belum aktif\n";
    }

    // Cek data jika tabel ada
    if (in_array('kecamatan', $tables)) {
        $c = $pdo_neon->query("SELECT COUNT(*) FROM kecamatan")->fetchColumn();
        echo "Data kecamatan: $c baris\n";
    }
    if (in_array('fasilitas_kesehatan', $tables)) {
        $c = $pdo_neon->query("SELECT COUNT(*) FROM fasilitas_kesehatan")->fetchColumn();
        echo "Data fasilitas: $c baris\n";
    }
} catch(PDOException $e) {
    echo "❌ Gagal konek Neon: " . $e->getMessage() . "\n";
}

echo "\n";

// ===== LOKAL =====
echo "========================================\n";
echo "TES KONEKSI: LOKAL (localhost)\n";
echo "========================================\n";
try {
    $dsn_local = "pgsql:host=localhost;port=5432;dbname=peta;sslmode=disable";
    $pdo_local = new PDO($dsn_local, 'postgres', 'admin123', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    echo "✅ Lokal TERHUBUNG\n";

    $tables = $pdo_local->query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")->fetchAll(PDO::FETCH_COLUMN);
    echo "Tabel di Lokal: " . (empty($tables) ? '(tidak ada!)' : implode(', ', $tables)) . "\n";

    try {
        $ver = $pdo_local->query("SELECT PostGIS_version()")->fetchColumn();
        echo "PostGIS: ✅ $ver\n";
    } catch(Exception $e) {
        echo "PostGIS: ❌ Belum aktif - " . $e->getMessage() . "\n";
    }

    if (in_array('kecamatan', $tables)) {
        $c = $pdo_local->query("SELECT COUNT(*) FROM kecamatan")->fetchColumn();
        echo "Data kecamatan: $c baris\n";
    }
    if (in_array('fasilitas_kesehatan', $tables)) {
        $c = $pdo_local->query("SELECT COUNT(*) FROM fasilitas_kesehatan")->fetchColumn();
        echo "Data fasilitas: $c baris\n";
    }
} catch(PDOException $e) {
    echo "❌ Gagal konek Lokal: " . $e->getMessage() . "\n";
}
