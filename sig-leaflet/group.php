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
        <a href="index.php" class="btn-back"><i class="fas fa-arrow-left"></i> Kembali</a>
    </header>

    <div class="app-layout">
        <!-- Sidebar Panel Kiri -->
        <aside class="sidebar no-scrollbar">
            <div class="sidebar-header">
                <i class="fas fa-sliders-h" style="color: var(--text-primary);"></i>
                <h2>Panel Kontrol</h2>
            </div>
            
            <div class="sidebar-scroll no-scrollbar">
                
                <!-- 1. Menu Menggambar -->
                <div class="panel-section">
                    <h3><i class="fas fa-edit"></i> 1. Gambar Elemen</h3>
                    <div id="draw-instruction" class="alert draw-instructions" style="display: none;"></div>
                    <div class="draw-btn-group">
                        <button class="btn btn-outline btn-sm" onclick="startDrawing('wilayah')" style="justify-content: flex-start;">
                            <i class="fas fa-draw-polygon" style="color: #3b82f6;"></i> Wilayah Baru (Polygon)
                        </button>
                        <button class="btn btn-outline btn-sm" onclick="startDrawing('marker')" style="justify-content: flex-start;">
                            <i class="fas fa-map-marker-alt" style="color: #ef4444;"></i> Marker Baru (Titik)
                        </button>
                    </div>
                </div>

                <!-- 2. Daftar Elemen -->
                <div class="panel-section">
                    <h3><i class="fas fa-layer-group"></i> 2. Elemen Tersimpan</h3>
                    
                    <div style="margin-bottom: 0.75rem;">
                        <span style="font-size: 0.75rem; font-weight: bold; color: var(--text-secondary);">Daftar Wilayah (Polygon):</span>
                        <ul id="wilayah-list" class="elements-list no-scrollbar"></ul>
                    </div>

                    <div>
                        <span style="font-size: 0.75rem; font-weight: bold; color: var(--text-secondary);">Daftar Marker (Titik):</span>
                        <ul id="marker-list" class="elements-list no-scrollbar"></ul>
                    </div>
                </div>

                <!-- 3. Panel Analisis Spasial -->
                <div class="panel-section">
                    <h3><i class="fas fa-project-diagram"></i> 3. Pilihan Wilayah</h3>
                    
                    <div class="form-group">
                        <label for="wilayah_a">Wilayah A (Polygon 1)</label>
                        <select id="wilayah_a" class="form-control" onchange="triggerAnalysisSync()">
                            <option value="">-- Pilih Wilayah A --</option>
                        </select>
                    </div>

                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label for="wilayah_b">Wilayah B (Polygon 2)</label>
                        <select id="wilayah_b" class="form-control" onchange="triggerAnalysisSync()">
                            <option value="">-- Pilih Wilayah B --</option>
                        </select>
                    </div>

                    <button class="btn btn-outline btn-sm" onclick="triggerAnalysisSync()" style="width: 100%; justify-content: center; gap: 0.5rem; margin-top: 0.25rem;">
                        <i class="fas fa-sync-alt"></i> Sinkronkan Peta
                    </button>
                </div>
            </div>
        </aside>

        <!-- Main Content Area Kanan -->
        <main class="main-content no-scrollbar">
            <!-- Peta Utama di Atas -->
            <div class="main-map-wrapper">
                <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 0.75rem; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-map" style="color: var(--text-primary);"></i> Peta Utama (Input Wilayah & Marker)
                </h3>
                <div class="main-map-container">
                    <div id="map"></div>
                </div>
            </div>

            <!-- 5 Visual Maps Hasil Analisis di Bawah -->
            <div class="sub-maps-section">
                <h3 class="sub-maps-section-title">
                    <i class="fas fa-th-large"></i> Hasil Visualisasi Spasial Himpunan
                </h3>
                
                <div class="sub-maps-grid">
                    <!-- Map 1: Union (A dan B) -->
                    <div class="sub-map-card">
                        <h4>
                            <span>1. Wilayah A dan B (Union)</span>
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <span id="badge-union" class="badge">0 Titik</span>
                                <button class="btn btn-outline btn-sm" onclick="triggerAnalysisSync()" style="padding: 0.15rem 0.35rem; font-size: 0.7rem;" title="Refresh">
                                    <i class="fas fa-sync-alt"></i>
                                </button>
                            </div>
                        </h4>
                        <div id="sub-map-union" class="sub-map-container"></div>
                    </div>

                    <!-- Map 2: A - B -->
                    <div class="sub-map-card">
                        <h4>
                            <span>2. Wilayah A tapi bukan B</span>
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <span id="badge-diff-ab" class="badge">0 Titik</span>
                                <button class="btn btn-outline btn-sm" onclick="triggerAnalysisSync()" style="padding: 0.15rem 0.35rem; font-size: 0.7rem;" title="Refresh">
                                    <i class="fas fa-sync-alt"></i>
                                </button>
                            </div>
                        </h4>
                        <div id="sub-map-diff-ab" class="sub-map-container"></div>
                    </div>

                    <!-- Map 3: B - A -->
                    <div class="sub-map-card">
                        <h4>
                            <span>3. Wilayah B tapi bukan A</span>
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <span id="badge-diff-ba" class="badge">0 Titik</span>
                                <button class="btn btn-outline btn-sm" onclick="triggerAnalysisSync()" style="padding: 0.15rem 0.35rem; font-size: 0.7rem;" title="Refresh">
                                    <i class="fas fa-sync-alt"></i>
                                </button>
                            </div>
                        </h4>
                        <div id="sub-map-diff-ba" class="sub-map-container"></div>
                    </div>

                    <!-- Map 4: Outside A dan B -->
                    <div class="sub-map-card">
                        <h4>
                            <span>4. Selain Wilayah A dan B</span>
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <span id="badge-outside" class="badge">0 Titik</span>
                                <button class="btn btn-outline btn-sm" onclick="triggerAnalysisSync()" style="padding: 0.15rem 0.35rem; font-size: 0.7rem;" title="Refresh">
                                    <i class="fas fa-sync-alt"></i>
                                </button>
                            </div>
                        </h4>
                        <div id="sub-map-outside" class="sub-map-container"></div>
                    </div>

                    <!-- Map 5: Intersection (Irisan) -->
                    <div class="sub-map-card">
                        <h4>
                            <span>5. Irisan A dan B (Gray Style)</span>
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <span id="badge-intersect" class="badge">0 Titik</span>
                                <button class="btn btn-outline btn-sm" onclick="triggerAnalysisSync()" style="padding: 0.15rem 0.35rem; font-size: 0.7rem;" title="Refresh">
                                    <i class="fas fa-sync-alt"></i>
                                </button>
                            </div>
                        </h4>
                        <div id="sub-map-intersect" class="sub-map-container"></div>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <!-- Inject Group ID ke Javascript global -->
    <script>
        const GROUP_ID = <?php echo (int)$group['id']; ?>;
    </script>

    <!-- Leaflet & Leaflet Draw Scripts -->
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js"></script>
    
    <!-- Turf.js -->
    <script src="https://cdn.jsdelivr.net/npm/@turf/turf@6/turf.min.js"></script>

    <!-- App JS Logic -->
    <script src="assets/js/map.js"></script>
    <script src="assets/js/analysis.js"></script>

</body>
</html>
