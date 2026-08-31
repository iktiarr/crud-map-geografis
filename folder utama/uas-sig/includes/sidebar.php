<!-- ============= SIDEBAR ============= -->
<aside class="sidebar no-scrollbar">
    <div class="sidebar-scroll no-scrollbar">

        <!-- Feature Selection Panel (Shadcn-style Switches) — AKTIFKAN FITUR -->
        <div class="filter-card" style="margin-bottom: 0.75rem;">
            <div class="filter-card-title">
                <i class="fas fa-th-list" style="color: var(--primary);"></i> Aktifkan Fitur
            </div>
            <div class="switch-group">
                <!-- Switch Overlays -->
                <div class="switch-item">
                    <span class="switch-label">
                        <i class="fas fa-layer-group" style="color:#3b82f6;"></i> Overlays
                    </span>
                    <label class="switch-control">
                        <input type="checkbox" id="feature-switch-overlays" onchange="toggleFeatureVisibility('overlays', this.checked)">
                        <span class="switch-slider"></span>
                    </label>
                </div>
                <!-- Switch Preview Cepat -->
                <div class="switch-item">
                    <span class="switch-label">
                        <i class="fas fa-eye" style="color:#10b981;"></i> Preview Cepat
                    </span>
                    <label class="switch-control">
                        <input type="checkbox" id="feature-switch-preview" onchange="toggleFeatureVisibility('preview', this.checked)">
                        <span class="switch-slider"></span>
                    </label>
                </div>
                <!-- Switch Gambar & Analisis -->
                <div class="switch-item">
                    <span class="switch-label">
                        <i class="fas fa-pen-ruler" style="color:#f59e0b;"></i> Gambar & Analisis
                    </span>
                    <label class="switch-control">
                        <input type="checkbox" id="feature-switch-canvas" onchange="toggleFeatureVisibility('canvas', this.checked)">
                        <span class="switch-slider"></span>
                    </label>
                </div>
            </div>
        </div>

        <!-- Dynamic Feature Filter Panel -->
        <div id="feature-filter-card" class="filter-card" style="display: none;">
            <div class="filter-card-title">
                <i class="fas fa-filter" style="color: var(--primary);"></i> Filter Jenis
            </div>
            <div id="feature-filter-switches" class="switch-group">
                <!-- Dinamis -->
            </div>
        </div>

        <!-- Collapsible Feature Modules -->
        <?php
        require_once __DIR__ . '/features/overlays.php';
        require_once __DIR__ . '/features/preview.php';
        require_once __DIR__ . '/features/canvas.php';
        ?>

    </div>
</aside>
