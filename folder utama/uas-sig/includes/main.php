<!-- Vertical Resizer Handle -->
<div id="sidebar-resizer" class="resizer-v"></div>

<!-- ============= MAIN CONTENT ============= -->
<main class="main-content">

    <!-- MAP -->
    <div class="map-wrapper">
        <div id="map"></div>

        <!-- Loading overlay -->
        <div class="loading-overlay" id="map-loading">
            <div style="text-align:center;">
                <div class="spinner-ring"></div>
                <p style="font-size:.8rem; color:var(--text-secondary); margin-top:.75rem; font-weight: 500;">Memuat...</p>
            </div>
        </div>

    </div>

    <!-- RESULTS TABLE (Default: preview & overlay data) -->
    <div id="table-resizer" class="resizer-h"></div>
    <div class="results-panel" id="results-panel-main">
        <div class="results-header">
            <h3 id="results-title"><i class="fas fa-table"></i> Daftar Data</h3>
            <span class="badge badge-count" id="result-count">0 data</span>
        </div>
        <div class="results-body" style="display: flex; flex-direction: column; height: 100%; overflow: hidden;">
            <div style="flex: 1; overflow: auto;">
                <table class="data-table">
                    <thead id="table-thead">
                        <tr>
                            <th>#</th>
                            <th>Nama Fasilitas</th>
                            <th>Jenis</th>
                            <th>Kecamatan</th>
                            <th>Alamat</th>
                            <th>Telepon</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody id="table-body">
                        <tr>
                            <td colspan="7" class="empty-state">
                                <i class="fas fa-map"></i>
                                <h4>Pilih Fitur</h4>
                                <p>Aktifkan fitur di sidebar untuk menampilkan data</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <!-- Pagination Container -->
            <div id="table-pagination" class="pagination-container" style="display: none; border-top: 1px solid var(--border-color); flex-shrink: 0;"></div>
        </div>
    </div>

    <!-- 7 VISUAL MAPS HASIL ANALISIS (Canvas Feature) -->
    <div id="analysis-visual-section" class="sub-maps-section" style="display: none;">
        <div class="sub-maps-section-title">
            <i class="fas fa-object-group"></i> Hasil Visualisasi Himpunan Spasial
        </div>
        
        <div class="sub-maps-grid">
            <!-- Map 1: Wilayah A (Asli) -->
            <div class="sub-map-card">
                <h4>
                    <span>1. Wilayah A (Asli)</span>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span id="badge-wilayah-a" class="badge">0 Titik</span>
                    </div>
                </h4>
                <div id="sub-map-wilayah-a" class="sub-map-container"></div>
            </div>

            <!-- Map 2: Wilayah B (Asli) -->
            <div class="sub-map-card">
                <h4>
                    <span>2. Wilayah B (Asli)</span>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span id="badge-wilayah-b" class="badge">0 Titik</span>
                    </div>
                </h4>
                <div id="sub-map-wilayah-b" class="sub-map-container"></div>
            </div>

            <!-- Map 3: Union (A dan B) -->
            <div class="sub-map-card">
                <h4>
                    <span>3. Wilayah A dan B (Union)</span>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span id="badge-union" class="badge">0 Titik</span>
                    </div>
                </h4>
                <div id="sub-map-union" class="sub-map-container"></div>
            </div>

            <!-- Map 4: A - B -->
            <div class="sub-map-card">
                <h4>
                    <span>4. Wilayah A tapi bukan B</span>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span id="badge-diff-ab" class="badge">0 Titik</span>
                    </div>
                </h4>
                <div id="sub-map-diff-ab" class="sub-map-container"></div>
            </div>

            <!-- Map 5: B - A -->
            <div class="sub-map-card">
                <h4>
                    <span>5. Wilayah B tapi bukan A</span>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span id="badge-diff-ba" class="badge">0 Titik</span>
                    </div>
                </h4>
                <div id="sub-map-diff-ba" class="sub-map-container"></div>
            </div>

            <!-- Map 6: Outside A dan B -->
            <div class="sub-map-card">
                <h4>
                    <span>6. Selain Wilayah A dan B</span>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span id="badge-outside" class="badge">0 Titik</span>
                    </div>
                </h4>
                <div id="sub-map-outside" class="sub-map-container"></div>
            </div>

            <!-- Map 7: Intersection (Irisan) -->
            <div class="sub-map-card">
                <h4>
                    <span>7. Irisan A dan B</span>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span id="badge-intersect" class="badge">0 Titik</span>
                    </div>
                </h4>
                <div id="sub-map-intersect" class="sub-map-container"></div>
            </div>
        </div>
    </div>

</main>
</div> <!-- /.app-layout -->


