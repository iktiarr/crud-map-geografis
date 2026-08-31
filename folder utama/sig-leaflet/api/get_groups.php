<?php
// api/get_groups.php
header('Content-Type: application/json');
$pdo = require __DIR__ . '/../config/database.php';

try {
    // Ambil data group beserta statistik jumlah wilayah, marker, dan ketersediaan boundary
    $query = "
        SELECT 
            g.id, 
            g.nama_group, 
            g.deskripsi, 
            g.created_at,
            (SELECT COUNT(*) FROM wilayah w WHERE w.group_id = g.id) AS jumlah_wilayah,
            (SELECT COUNT(*) FROM markers m WHERE m.group_id = g.id) AS jumlah_marker,
            EXISTS(SELECT 1 FROM group_boundary gb WHERE gb.group_id = g.id) AS has_boundary
        FROM groups g
        ORDER BY g.created_at DESC
    ";
    
    $stmt = $pdo->query($query);
    $groups = $stmt->fetchAll();
    
    foreach ($groups as &$group) {
        $group['id'] = (int)$group['id'];
        $group['jumlah_wilayah'] = (int)$group['jumlah_wilayah'];
        $group['jumlah_marker'] = (int)$group['jumlah_marker'];
        $group['has_boundary'] = (bool)$group['has_boundary'];
    }

    echo json_encode([
        'status' => 'success',
        'data' => $groups
    ]);
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Gagal mengambil data group: ' . $e->getMessage()
    ]);
}
