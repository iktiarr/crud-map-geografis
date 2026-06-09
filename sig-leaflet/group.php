<?php
// group.php
$pdo = require __DIR__ . '/config/database.php';

$group_id = $_GET['id'] ?? null;

if (empty($group_id)) {
    header('Location: index.php');
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT * FROM groups WHERE id = :id");
    $stmt->execute([':id' => $group_id]);
    $group = $stmt->fetch();

    if (!$group) {
        die("Group tidak ditemukan.");
    }
} catch (Exception $e) {
    die("Kesalahan database: " . $e->getMessage());
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($group['nama_group']); ?> - Peta SIG Spasial</title>
    
    <!-- Leaflet & Leaflet Draw CSS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css" />
    
    <!-- Custom Style & FontAwesome -->
    <link rel="stylesheet" href="assets/css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <style>
        /* Tooltip style for permanent polygon labels */
        .polygon-tooltip {
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid var(--border-color);
            border-radius: 4px;
            padding: 2px 6px;
            font-size: 11px;
            font-weight: 700;
            box-shadow: var(--shadow-sm);
            color: var(--text-primary);
        }
    </style>
</head>
<body>

    <header>
        <h1><i class="fas fa-map-marked-alt"></i> SIG <span>Spasial</span> - <?php echo htmlspecialchars($group['nama_group']); ?></h1>
        <a href="index.php" class="btn btn-outline"><i class="fas fa-arrow-left"></i> Kembali ke Dashboard</a>
    </header>

    <div class="app-layout">
        <!-- Sidebar Panel Kiri -->
        <aside class="sidebar">
            <div class="sidebar-header">
                <i class="fas fa-sliders-h" style="color: var(--brand-color);"></i>
                <h2>Panel Kontrol Spasial</h2>
            </div>
            
            <div class="sidebar-scroll">
                
                <!-- Keterangan Group -->
                <div style="background-color: var(--bg-primary); padding: 1rem; border-radius: 0.5rem; border: 1px solid var(--border-color);">
                    <h4 style="font-size: 0.875rem; font-weight: bold; margin-bottom: 0.25rem;">Deskripsi Group:</h4>
                    <p style="font-size: 0.8rem; color: var(--text-secondary);"><?php echo htmlspecialchars($group['deskripsi'] ?: 'Tidak ada deskripsi.'); ?></p>
                </div>

                <!-- 1. Menu Menggambar -->
                <div class="panel-section">
                    <h3><i class="fas fa-edit"></i> 1. Gambar Elemen Peta</h3>
                    <div id="draw-instruction" class="draw-instructions" style="display: none;"></div>
                    <div class="draw-btn-group">
                        <button class="btn btn-outline btn-sm" onclick="startDrawing('wilayah')" style="justify-content: flex-start;">
                            <i class="fas fa-draw-polygon" style="color: #2563eb;"></i> Wilayah Baru (Polygon)
                        </button>
                        <button class="btn btn-outline btn-sm" onclick="startDrawing('marker')" style="justify-content: flex-start;">
                            <i class="fas fa-map-marker-alt" style="color: var(--brand-color);"></i> Marker Baru (Titik)
                        </button>
                    </div>
                </div>

                <!-- 2. Daftar Elemen -->
                <div class="panel-section">
                    <h3><i class="fas fa-layer-group"></i> 2. Elemen Tersimpan</h3>
                    
                    <div style="margin-bottom: 0.75rem;">
                        <span style="font-size: 0.75rem; font-weight: bold; color: var(--text-secondary);">Daftar Wilayah (Polygon):</span>
                        <ul id="wilayah-list" class="elements-list"></ul>
                    </div>

                    <div>
                        <span style="font-size: 0.75rem; font-weight: bold; color: var(--text-secondary);">Daftar Marker (Titik):</span>
                        <ul id="marker-list" class="elements-list"></ul>
                    </div>
                </div>

                <!-- 3. Panel Analisis Spasial -->
                <div class="panel-section">
                    <h3><i class="fas fa-project-diagram"></i> 3. Analisis Himpunan</h3>
                    
                    <div class="form-group">
                        <label for="wilayah_a">Wilayah A (Polygon 1)</label>
                        <select id="wilayah_a" class="form-control">
                            <option value="">-- Pilih Wilayah A --</option>
                        </select>
                    </div>

                    <div class="form-group" style="margin-bottom: 1.25rem;">
                        <label for="wilayah_b">Wilayah B (Polygon 2)</label>
                        <select id="wilayah_b" class="form-control">
                            <option value="">-- Pilih Wilayah B --</option>
                        </select>
                    </div>

                    <label style="font-size: 0.875rem; font-weight: 600; color: var(--text-primary);">Pilih Operasi Spasial:</label>
                    <div class="analysis-grid">
                        <button id="btn-intersect" class="btn-analysis" onclick="runAnalysis('intersection')">
                            <i class="fas fa-circle-nodes" style="font-size: 1.25rem;"></i>
                            <span>Irisan A ∩ B</span>
                        </button>
                        <button id="btn-diff" class="btn-analysis" onclick="runAnalysis('difference')">
                            <i class="fas fa-scissors" style="font-size: 1.25rem;"></i>
                            <span>Selisih A - B</span>
                        </button>
                        <button id="btn-diff-ba" class="btn-analysis" onclick="runAnalysis('difference_ba')">
                            <i class="fas fa-scissors fa-flip-horizontal" style="font-size: 1.25rem;"></i>
                            <span>Selisih B - A</span>
                        </button>
                        <button id="btn-symdiff" class="btn-analysis" onclick="runAnalysis('symdifference')">
                            <i class="fas fa-circle-minus" style="font-size: 1.25rem;"></i>
                            <span>Non-Irisan A △ B</span>
                        </button>
                        <button id="btn-outside" class="btn-analysis" onclick="runAnalysis('outside')" style="grid-column: span 2;">
                            <i class="fas fa-circle-xmark" style="font-size: 1.25rem;"></i>
                            <span>Di Luar A dan B</span>
                        </button>
                    </div>
                </div>

                <!-- 4. Hasil Analisis -->
                <div class="panel-section" style="border-color: #c084fc; background-color: #faf5ff;">
                    <h3 style="color: #a855f7;"><i class="fas fa-chart-bar"></i> 4. Hasil Analisis</h3>
                    <div id="analysis-results-panel">
                        <div class="results-card" style="text-align: center; color: var(--text-secondary); font-size: 0.8rem;">
                            Pilih opsi analisis di atas untuk memproses data.
                        </div>
                    </div>
                </div>

            </div>
        </aside>

        <!-- Container Peta Kanan -->
        <div class="map-container">
            <div id="map"></div>
        </div>
    </div>

    <!-- Inject Group ID ke Javascript global -->
    <script>
        const GROUP_ID = <?php echo (int)$group['id']; ?>;
    </script>

    <!-- Leaflet & Leaflet Draw Scripts -->
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js"></script>
    
    <!-- Turf.js (untuk keperluan manipulasi spasial opsional di frontend) -->
    <script src="https://cdn.jsdelivr.net/npm/@turf/turf@6/turf.min.js"></script>

    <!-- App JS Logic -->
    <script src="assets/js/map.js"></script>
    <script src="assets/js/analysis.js"></script>
</body>
</html>
