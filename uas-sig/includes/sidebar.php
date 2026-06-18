<!-- ============= SIDEBAR ============= -->
<aside class="sidebar no-scrollbar">
    <div class="sidebar-scroll no-scrollbar">

        <!-- Feature Selection Panel (Shadcn-style Switches) -->
        <div class="filter-card">
            <div class="filter-card-title">
                <i class="fas fa-th-list" style="color: var(--primary);"></i> Pilihan Fitur
            </div>
            <div class="switch-group">
                <div class="switch-item">
                    <span class="switch-label">
                        <i class="fas fa-layer-group" style="color:#3b82f6;"></i> Overlays
                    </span>
                    <label class="switch-control">
                        <input type="checkbox" id="feature-switch-overlays" checked onchange="toggleFeatureSection('acc-overlays', this.checked)">
                        <span class="switch-slider"></span>
                    </label>
                </div>
                <div class="switch-item">
                    <span class="switch-label">
                        <i class="fas fa-eye" style="color:#10b981;"></i> Preview Cepat
                    </span>
                    <label class="switch-control">
                        <input type="checkbox" id="feature-switch-preview" checked onchange="toggleFeatureSection('acc-preview', this.checked)">
                        <span class="switch-slider"></span>
                    </label>
                </div>
                <div class="switch-item">
                    <span class="switch-label">
                        <i class="fas fa-project-diagram" style="color:#8b5cf6;"></i> Analisis Spasial
                    </span>
                    <label class="switch-control">
                        <input type="checkbox" id="feature-switch-spatial" checked onchange="toggleFeatureSection('acc-spatial', this.checked)">
                        <span class="switch-slider"></span>
                    </label>
                </div>
                <div class="switch-item">
                    <span class="switch-label">
                        <i class="fas fa-edit" style="color:#f59e0b;"></i> Buat Gambar
                    </span>
                    <label class="switch-control">
                        <input type="checkbox" id="feature-switch-draw" checked onchange="toggleFeatureSection('acc-draw', this.checked)">
                        <span class="switch-slider"></span>
                    </label>
                </div>
            </div>
        </div>

        <!-- Dynamic Feature Filter Panel (Shadcn-style Switches) -->
        <div id="feature-filter-card" class="filter-card" style="display: none;">
            <div class="filter-card-title">
                <i class="fas fa-filter" style="color: var(--primary);"></i> Filter Fitur
            </div>
            <div id="feature-filter-switches" class="switch-group">
                <!-- Dinamis -->
            </div>
        </div>

        <!-- Collapsible Feature Modules -->
        <?php
        require_once __DIR__ . '/features/overlays.php';
        require_once __DIR__ . '/features/preview.php';
        require_once __DIR__ . '/features/spatial.php';
        require_once __DIR__ . '/features/draw.php';
        ?>

    </div>
</aside>
