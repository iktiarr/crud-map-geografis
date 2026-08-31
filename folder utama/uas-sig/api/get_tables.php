<?php
// api/get_tables.php — Ambil daftar tabel spasial, tipe geometri, dan sub-jenis didalamnya
header('Content-Type: application/json');

try {
    $pdo = require '../config/database.php';
    
    // Ambil semua base table spasial
    $rows = $pdo->query("
        SELECT f_table_name AS table_name, type
        FROM geometry_columns
        WHERE f_table_schema = 'public'
          AND f_table_name NOT IN ('spatial_ref_sys', 'import_metadata')
        ORDER BY f_table_name
    ")->fetchAll(PDO::FETCH_ASSOC);
    
    // Fallback jika geometry_columns kosong
    if (empty($rows)) {
        $tablesList = $pdo->query("
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_type = 'BASE TABLE'
              AND table_name NOT IN ('spatial_ref_sys', 'import_metadata')
            ORDER BY table_name
        ")->fetchAll(PDO::FETCH_COLUMN);
        
        $rows = [];
        foreach ($tablesList as $t) {
            $rows[] = ['table_name' => $t, 'type' => 'GEOMETRY'];
        }
    }
    
    // Ambil kolom kandidat untuk semua tabel sekaligus untuk meminimalkan query metadata
    $tableColumns = [];
    if (!empty($rows)) {
        $tableNames = array_column($rows, 'table_name');
        $placeholders = implode(',', array_fill(0, count($tableNames), '?'));
        
        $colQuery = "
            SELECT c.relname AS table_name, a.attname AS column_name
            FROM pg_attribute a
            JOIN pg_class c ON a.attrelid = c.oid
            JOIN pg_namespace n ON c.relnamespace = n.oid
            WHERE n.nspname = 'public'
              AND c.relname IN ($placeholders)
              AND a.attnum > 0
              AND NOT a.attisdropped
              AND a.attname IN ('jenis', 'klasifikasi', 'tipe', 'kategori', 'status', 'type', 'class', 'category', 'classification')
            ORDER BY a.attnum
        ";
        
        $colStmt = $pdo->prepare($colQuery);
        $colStmt->execute($tableNames);
        $allCols = $colStmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($allCols as $c) {
            $tableColumns[$c['table_name']][] = $c['column_name'];
        }
    }

    // Ensure import_metadata table exists
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS import_metadata (
            table_name VARCHAR(255) PRIMARY KEY,
            files VARCHAR(255) NOT NULL
        )
    ");

    // Fetch all metadata once (Batch Query 1)
    $metaMap = [];
    try {
        $metaMap = $pdo->query("SELECT table_name, files FROM import_metadata")->fetchAll(PDO::FETCH_KEY_PAIR);
    } catch (Exception $e) {
        // Safe to ignore
    }

    // Fetch all columns for all user tables in public schema once (Batch Query 2)
    $tableAllColumns = [];
    try {
        $allColsStmt = $pdo->query("
            SELECT c.relname AS table_name, a.attname AS column_name
            FROM pg_attribute a
            JOIN pg_class c ON a.attrelid = c.oid
            JOIN pg_namespace n ON c.relnamespace = n.oid
            WHERE n.nspname = 'public'
              AND c.relkind = 'r'
              AND a.attnum > 0
              AND NOT a.attisdropped
        ");
        foreach ($allColsStmt->fetchAll(PDO::FETCH_ASSOC) as $colRow) {
            $tableAllColumns[$colRow['table_name']][] = $colRow['column_name'];
        }
    } catch (Exception $e) {
        // Safe to ignore
    }

    $resultTables = [];
    $candidateCols = ['jenis', 'klasifikasi', 'tipe', 'kategori', 'status', 'type', 'class', 'category', 'classification'];
    
    foreach ($rows as $row) {
        $tableName = $row['table_name'];
        $type = $row['type'];
        
        $jenisList = [];
        $hasJenis = false;
        $categoryColumn = null;
        
        $cols = $tableColumns[$tableName] ?? [];
        foreach ($candidateCols as $col) {
            if (in_array($col, $cols)) {
                $hasJenis = true;
                $categoryColumn = $col;
                break;
            }
        }
        
        if ($hasJenis && $categoryColumn) {
            try {
                // Ambil distinct jenis dari tabel tersebut (tetap per-tabel karena datanya dinamis dan minor)
                $stmt = $pdo->query("
                    SELECT DISTINCT \"{$categoryColumn}\" 
                    FROM \"{$tableName}\" 
                    WHERE \"{$categoryColumn}\" IS NOT NULL AND \"{$categoryColumn}\" != '' 
                    ORDER BY \"{$categoryColumn}\"
                ");
                $jenisList = $stmt->fetchAll(PDO::FETCH_COLUMN);
            } catch (Exception $e) {
                $jenisList = [];
            }
        }
        
        // Jika tidak memiliki jenis/kategori dinamis, kita tampilkan komponen file terunggah (.shp, .dbf, .prj, .shx)
        if (empty($jenisList)) {
            // Cek di hasil batch import_metadata (Tanpa Query)
            $metaFiles = $metaMap[$tableName] ?? null;
            
            if ($metaFiles !== null) {
                if (!empty($metaFiles)) {
                    $parts = explode(',', $metaFiles);
                    foreach ($parts as $p) {
                        $jenisList[] = '.' . trim($p);
                    }
                    $hasJenis = true;
                    $categoryColumn = '__component__';
                }
            } else {
                // Deteksi dinamis columns dari hasil batch pg_attribute (Tanpa Query)
                $allTableCols = $tableAllColumns[$tableName] ?? [];
                
                $hasGeom = in_array('geom', $allTableCols) || in_array('geometry', $allTableCols);
                $hasAttrs = false;
                foreach ($allTableCols as $c) {
                    if (!in_array($c, ['id', 'geom', 'geometry', 'created_at', 'updated_at'])) {
                        $hasAttrs = true;
                        break;
                    }
                }
                
                $detected = [];
                if ($hasGeom) {
                    $detected[] = '.shp';
                }
                if ($hasAttrs) {
                    $detected[] = '.dbf';
                }
                if ($hasGeom) {
                    $detected[] = '.prj';
                    $detected[] = '.shx';
                }
                
                if (!empty($detected)) {
                    $jenisList = $detected;
                    $hasJenis = true;
                    $categoryColumn = '__component__';
                }
            }
        }
        
        $resultTables[] = [
            'table_name' => $tableName,
            'type' => $type,
            'has_jenis' => $hasJenis,
            'jenis_column' => $categoryColumn,
            'jenis_list' => $jenisList
        ];
    }
    
    echo json_encode(['status' => 'success', 'tables' => $resultTables]);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
