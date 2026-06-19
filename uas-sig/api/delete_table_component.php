<?php
// api/delete_table_component.php — Hapus salah satu komponen (shp, dbf, prj, shx) dari tabel kustom
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Metode request tidak valid']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$table = $input['table'] ?? '';
$component = $input['component'] ?? ''; // 'shp', 'dbf', 'prj', 'shx'

if (empty($table) || empty($component)) {
    echo json_encode(['status' => 'error', 'message' => 'Nama tabel dan komponen wajib diisi']);
    exit;
}

$cleanTable = strtolower(trim($table));
$cleanComp = strtolower(trim($component));

// Validasi untuk mencegah SQL injection dan penghapusan tabel sistem catalog
if (!preg_match('/^[a-z0-9_]+$/', $cleanTable) || in_array($cleanTable, ['spatial_ref_sys', 'import_metadata'])) {
    echo json_encode(['status' => 'error', 'message' => 'Nama tabel tidak valid']);
    exit;
}

if (!in_array($cleanComp, ['shp', 'dbf', 'prj', 'shx'])) {
    echo json_encode(['status' => 'error', 'message' => 'Komponen tidak valid']);
    exit;
}

try {
    $pdo = require '../config/database.php';
    
    // Pastikan tabel ada di database
    $tblCheck = $pdo->prepare("
        SELECT COUNT(*) 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = ?
    ");
    $tblCheck->execute([$cleanTable]);
    if ($tblCheck->fetchColumn() == 0) {
        echo json_encode(['status' => 'error', 'message' => 'Tabel tidak ditemukan']);
        exit;
    }
    
    $affectedRows = 0;
    
    if ($cleanComp === 'shp') {
        // Hapus data geometri: Set geom/geometry menjadi NULL
        // Cari nama kolom geometri (geom atau geometry)
        $geomColStmt = $pdo->prepare("
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = ? 
              AND column_name IN ('geom', 'geometry')
        ");
        $geomColStmt->execute([$cleanTable]);
        $geomCol = $geomColStmt->fetchColumn();
        
        if ($geomCol) {
            $stmt = $pdo->prepare("UPDATE \"{$cleanTable}\" SET \"{$geomCol}\" = NULL");
            $stmt->execute();
            $affectedRows = $stmt->rowCount();
        }
    } elseif ($cleanComp === 'dbf') {
        // Hapus data atribut: Set semua kolom selain id dan geom/geometry menjadi NULL
        $colsStmt = $pdo->prepare("
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = ? 
              AND column_name NOT IN ('id', 'geom', 'geometry', 'created_at', 'updated_at')
        ");
        $colsStmt->execute([$cleanTable]);
        $attrCols = $colsStmt->fetchAll(PDO::FETCH_COLUMN);
        
        if (!empty($attrCols)) {
            $updateParts = [];
            foreach ($attrCols as $col) {
                $updateParts[] = "\"{$col}\" = NULL";
            }
            $updateSql = "UPDATE \"{$cleanTable}\" SET " . implode(', ', $updateParts);
            $stmt = $pdo->prepare($updateSql);
            $stmt->execute();
            $affectedRows = $stmt->rowCount();
        }
    }
    
    // Update metadata di import_metadata
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS import_metadata (
            table_name VARCHAR(255) PRIMARY KEY,
            files VARCHAR(255) NOT NULL
        )
    ");
    
    $metaGet = $pdo->prepare("SELECT files FROM import_metadata WHERE table_name = ?");
    $metaGet->execute([$cleanTable]);
    $filesStr = $metaGet->fetchColumn();
    
    if ($filesStr !== false) {
        $filesArr = explode(',', $filesStr);
        $filesArr = array_map('trim', $filesArr);
        $newFilesArr = array_filter($filesArr, function($val) use ($cleanComp) {
            return $val !== $cleanComp;
        });
        
        if (empty($newFilesArr)) {
            $metaDel = $pdo->prepare("DELETE FROM import_metadata WHERE table_name = ?");
            $metaDel->execute([$cleanTable]);
        } else {
            $newFilesStr = implode(',', $newFilesArr);
            $metaUpd = $pdo->prepare("UPDATE import_metadata SET files = ? WHERE table_name = ?");
            $metaUpd->execute([$newFilesStr, $cleanTable]);
        }
    }
    
    $compLabels = [
        'shp' => 'Geometri Spasial (.shp)',
        'dbf' => 'Data Atribut (.dbf)',
        'prj' => 'Sistem Proyeksi (.prj)',
        'shx' => 'Indeks Geometri (.shx)'
    ];
    $label = $compLabels[$cleanComp] ?? $cleanComp;
    
    echo json_encode([
        'status' => 'success',
        'message' => "Komponen {$label} berhasil dihapus dari tabel '{$cleanTable}'."
    ]);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
