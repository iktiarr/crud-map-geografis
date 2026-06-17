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
          AND f_table_name NOT IN ('spatial_ref_sys')
        ORDER BY f_table_name
    ")->fetchAll(PDO::FETCH_ASSOC);
    
    // Fallback jika geometry_columns kosong
    if (empty($rows)) {
        $tablesList = $pdo->query("
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_type = 'BASE TABLE'
              AND table_name NOT IN ('spatial_ref_sys')
            ORDER BY table_name
        ")->fetchAll(PDO::FETCH_COLUMN);
        
        $rows = [];
        foreach ($tablesList as $t) {
            $rows[] = ['table_name' => $t, 'type' => 'GEOMETRY'];
        }
    }
    
    $resultTables = [];
    foreach ($rows as $row) {
        $tableName = $row['table_name'];
        $type = $row['type'];
        
        $jenisList = [];
        $hasJenis = false;
        $categoryColumn = null;
        
        $candidateCols = ['jenis', 'klasifikasi', 'tipe', 'kategori', 'status', 'type', 'class', 'category', 'classification'];
        
        foreach ($candidateCols as $col) {
            $colCheck = $pdo->prepare("
                SELECT COUNT(*) 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                  AND table_name = ? 
                  AND column_name = ?
            ");
            $colCheck->execute([$tableName, $col]);
            if ($colCheck->fetchColumn() > 0) {
                $hasJenis = true;
                $categoryColumn = $col;
                break;
            }
        }
        
        if ($hasJenis && $categoryColumn) {
            try {
                // Ambil distinct jenis dari tabel tersebut
                // Karena nama tabel divalidasi dari list geometry_columns, ini aman dari SQL injection
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
