<?php
// reset_db.php — Script untuk membersihkan data contoh / reset database
// Akses via browser: http://localhost:8000/reset_db.php

$pdo = require 'config/database.php';
$is_web = PHP_SAPI !== 'cli';

if ($is_web) {
    header('Content-Type: text/html; charset=utf-8');
    echo "<!DOCTYPE html><html lang='id' data-theme='light'>
    <head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'>
    <title>Reset Database</title>
    <link rel='stylesheet' href='assets/css/style.css'>
    <link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'>
    </head><body>
    <header>
        <h1><div class='brand-icon'><i class='fas fa-trash-alt'></i></div> <span>Reset</span> Database</h1>
        <div class='header-nav'>
            <a href='index.php' class='btn btn-outline btn-sm'><i class='fas fa-map'></i> Peta</a>
            <a href='admin/index.php' class='btn btn-secondary btn-sm'><i class='fas fa-cog'></i> Admin</a>
        </div>
    </header>
    <div class='page-container' style='max-width:700px;'>
    <div class='page-header'>
        <div>
            <h2 class='page-title'>Reset <span>Database</span></h2>
            <p class='page-subtitle'>Kosongkan data contoh atau hapus tabel custom hasil import</p>
        </div>
    </div>
    
    <div class='card' style='margin-bottom: 1.5rem;'>
        <div class='card-header'>
            <h3><i class='fas fa-exclamation-triangle' style='color:var(--danger);'></i> Peringatan Tindakan</h3>
        </div>
        <div class='card-body'>
            <p style='margin-bottom: 1rem;'>Halaman ini digunakan untuk membersihkan database. Silakan pilih opsi pembersihan di bawah ini:</p>
            
            <form method='POST' style='display: flex; gap: 1rem; flex-wrap: wrap;'>
                <button type='submit' name='action' value='clear_mock' class='btn btn-secondary'>
                    <i class='fas fa-eraser'></i> Kosongkan Data Contoh (Truncate)
                </button>
                <button type='submit' name='action' value='drop_custom' class='btn btn-danger'>
                    <i class='fas fa-trash-alt'></i> Hapus Semua Tabel Hasil Import
                </button>
                <button type='submit' name='action' value='reset_all' class='btn btn-outline' style='color: var(--danger); border-color: var(--danger);'>
                    <i class='fas fa-redo'></i> Reset Total (Data Contoh &amp; Tabel Custom)
                </button>
            </form>
        </div>
    </div>";
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

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    $action = $_POST['action'];
    
    if ($is_web) {
        echo "<div class='card'><div class='card-header'><h3><i class='fas fa-terminal' style='color:var(--primary);'></i> Proses Reset</h3></div>
        <div class='card-body'><pre style='font-family:monospace;font-size:.82rem;line-height:1.8;white-space:pre-wrap;'>";
    }
    
    // Opsi 1: Kosongkan data contoh (Truncate)
    if ($action === 'clear_mock' || $action === 'reset_all') {
        log_line("Membersihkan data contoh dari tabel kecamatan...", 'info');
        try {
            // Cek apakah tabel kecamatan ada
            $stmt = $pdo->query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'kecamatan')");
            $kec_exists = $stmt->fetchColumn();
            
            if ($kec_exists) {
                $pdo->exec("TRUNCATE TABLE kecamatan RESTART IDENTITY CASCADE;");
                log_line("✅ Berhasil mengosongkan tabel 'kecamatan'.", 'ok');
            } else {
                log_line("⚠️ Tabel kecamatan tidak ditemukan, dilewati.", 'warn');
            }
        } catch (PDOException $e) {
            log_line("❌ Gagal membersihkan data contoh: " . $e->getMessage(), 'error');
        }
    }
    
    // Opsi 2: Hapus semua tabel custom hasil import
    if ($action === 'drop_custom' || $action === 'reset_all') {
        log_line("\nMencari tabel hasil import untuk dihapus...", 'info');
        try {
            // Ambil daftar semua tabel di schema public selain kecamatan, spatial_ref_sys, dan tabel gambar kustom
            $tables = $pdo->query("
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_type = 'BASE TABLE'
                AND table_name NOT IN (
                    'kecamatan', 'spatial_ref_sys', 
                    'custom_drawings', 'custom_markers', 'custom_polygons', 'custom_polylines'
                )
                ORDER BY table_name
            ")->fetchAll(PDO::FETCH_COLUMN);
            
            if (empty($tables)) {
                log_line("ℹ️ Tidak ditemukan tabel kustom hasil import.", 'info');
            } else {
                foreach ($tables as $table) {
                    log_line("Menghapus tabel kustom '{$table}'...", 'info');
                    $pdo->exec("DROP TABLE IF EXISTS " . pg_escape_identifier($table) . " CASCADE;");
                    log_line("✅ Tabel '{$table}' berhasil dihapus.", 'ok');
                }
                log_line("✅ Semua tabel kustom hasil import selesai dibersihkan.", 'ok');
            }
        } catch (PDOException $e) {
            log_line("❌ Gagal menghapus tabel kustom: " . $e->getMessage(), 'error');
        }
    }
    
    log_line("\n🎉 Selesai! Database Anda sekarang bersih.", 'ok');
    
    if ($is_web) {
        echo "</pre></div></div>";
    }
}

// Helper untuk escape identifier di Postgres jika function pg_escape_identifier tidak tersedia
if (!function_exists('pg_escape_identifier')) {
    function pg_escape_identifier($string) {
        return '"' . str_replace('"', '""', $string) . '"';
    }
}

if ($is_web) {
    echo "<div style='display:flex;gap:.75rem;margin-top:1.25rem;flex-wrap:wrap;'>
        <a href='index.php' class='btn btn-primary'><i class='fas fa-map'></i> Buka Peta Publik</a>
        <a href='admin/index.php' class='btn btn-secondary'><i class='fas fa-cog'></i> Panel Admin</a>
    </div>
    </div></body></html>";
}
