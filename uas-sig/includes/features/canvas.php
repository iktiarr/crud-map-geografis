<!-- Collapsible 3: Gambar & Analisis (Drawing + Spatial combined) -->
<div class="accordion-item" id="accordion-item-canvas" style="display: none;">
    <button class="accordion-trigger" id="acc-trigger-canvas" onclick="toggleAccordion('acc-canvas', this)">
        <span><i class="fas fa-pen-ruler" style="color: #f59e0b;"></i> Gambar &amp; Analisis</span>
        <i class="fas fa-chevron-down acc-arrow"></i>
    </button>
    <div id="acc-canvas" class="accordion-content">

        <!-- 1. Color Picker -->
        <label class="form-label" style="font-weight:600; margin-bottom:0.35rem;">1. Pilih Warna Elemen</label>
        <div class="color-picker-grid" id="drawing-color-picker">
            <div class="color-dot active" style="background-color: #ef4444;" data-color="#ef4444" onclick="setDrawingColor('#ef4444', this)"></div>
            <div class="color-dot" style="background-color: #3b82f6;" data-color="#3b82f6" onclick="setDrawingColor('#3b82f6', this)"></div>
            <div class="color-dot" style="background-color: #10b981;" data-color="#10b981" onclick="setDrawingColor('#10b981', this)"></div>
            <div class="color-dot" style="background-color: #f59e0b;" data-color="#f59e0b" onclick="setDrawingColor('#f59e0b', this)"></div>
            <div class="color-dot" style="background-color: #8b5cf6;" data-color="#8b5cf6" onclick="setDrawingColor('#8b5cf6', this)"></div>
            <div class="color-dot" style="background-color: #ec4899;" data-color="#ec4899" onclick="setDrawingColor('#ec4899', this)"></div>
            <div class="color-dot" style="background-color: #14b8a6;" data-color="#14b8a6" onclick="setDrawingColor('#14b8a6', this)"></div>
            <div class="color-dot" style="background-color: #f97316;" data-color="#f97316" onclick="setDrawingColor('#f97316', this)"></div>
        </div>

        <!-- 2. Drawing Tools -->
        <label class="form-label" style="font-weight:600; margin-bottom:0.35rem; margin-top:0.75rem;">2. Alat Gambar</label>
        <div id="draw-instruction" class="draw-instructions" style="display: none;"></div>
        <div class="draw-btn-group" style="margin-bottom:0.5rem;">
            <button class="btn btn-outline btn-sm" onclick="startDrawing('polygon')" style="justify-content: flex-start;">
                <i class="fas fa-draw-polygon" style="color: #3b82f6; width:16px;"></i> Polygon Baru
            </button>
            <button class="btn btn-outline btn-sm" onclick="startDrawing('polyline')" style="justify-content: flex-start;">
                <i class="fas fa-route" style="color: #10b981; width:16px;"></i> Polyline Baru
            </button>
            <button class="btn btn-outline btn-sm" onclick="startDrawing('marker')" style="justify-content: flex-start;">
                <i class="fas fa-map-marker-alt" style="color: #ef4444; width:16px;"></i> Marker Baru
            </button>
        </div>

        <!-- Divider -->
        <div style="border-top: 1px solid var(--border-color); margin: 0.75rem 0;"></div>

        <!-- 3. Spatial Analysis -->
        <label class="form-label" style="font-weight:600; margin-bottom:0.5rem;">3. Analisis Spasial</label>
        <p style="font-size: 0.72rem; color: var(--text-secondary); margin-bottom: 0.65rem; line-height: 1.4;">
            Pilih dua Polygon yang sudah Anda buat, lalu jalankan analisis himpunan.
        </p>

        <div class="form-group" style="margin-bottom: 0.75rem;">
            <label class="form-label">Pilih Sumber Titik / Marker</label>
            <div class="combobox-wrap" id="combo-spatial-points">
                <div class="combobox-input-wrap" onclick="toggleCombobox('combo-spatial-points')">
                    <input type="text" class="combobox-input" id="combo-spatial-points-input" placeholder="Marker Kustom Pengguna" readonly>
                    <i class="fas fa-chevron-down combobox-arrow"></i>
                </div>
                <div class="combobox-dropdown" id="combo-spatial-points-dropdown">
                    <div class="combobox-empty" id="combo-spatial-points-empty">Tidak ada pilihan</div>
                </div>
                <input type="hidden" id="spatial-points-table" value="custom_drawings">
            </div>
        </div>

        <div class="form-group" style="margin-bottom: 0.65rem;">
            <label class="form-label">Pilih Wilayah A</label>
            <div class="combobox-wrap" id="combo-spatial-a">
                <div class="combobox-input-wrap" onclick="toggleCombobox('combo-spatial-a')">
                    <input type="text" class="combobox-input" id="combo-spatial-a-input" placeholder="-- Pilih Wilayah A --" readonly>
                    <i class="fas fa-chevron-down combobox-arrow"></i>
                </div>
                <div class="combobox-dropdown" id="combo-spatial-a-dropdown">
                    <div class="combobox-empty" id="combo-spatial-a-empty">Belum ada polygon</div>
                </div>
                <input type="hidden" id="spatial-poly-a-id" value="">
            </div>
        </div>

        <div class="form-group" style="margin-bottom: 0.75rem;">
            <label class="form-label">Pilih Wilayah B</label>
            <div class="combobox-wrap" id="combo-spatial-b">
                <div class="combobox-input-wrap" onclick="toggleCombobox('combo-spatial-b')">
                    <input type="text" class="combobox-input" id="combo-spatial-b-input" placeholder="-- Pilih Wilayah B --" readonly>
                    <i class="fas fa-chevron-down combobox-arrow"></i>
                </div>
                <div class="combobox-dropdown" id="combo-spatial-b-dropdown">
                    <div class="combobox-empty" id="combo-spatial-b-empty">Belum ada polygon</div>
                </div>
                <input type="hidden" id="spatial-poly-b-id" value="">
            </div>
        </div>


        <button class="btn btn-primary btn-sm" style="width:100%; justify-content:center;" onclick="runSpatialAnalysis()">
            <i class="fas fa-chart-area"></i> Jalankan Analisis
        </button>

        <!-- Divider -->
        <div style="border-top: 1px solid var(--border-color); margin: 0.85rem 0;"></div>

        <!-- 4. Gambar Tersimpan (di sidebar) -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.45rem;">
            <label class="form-label" style="font-weight:600; margin-bottom:0;">4. Gambar Tersimpan</label>
            <span class="badge badge-count" id="drawings-count" style="font-size:0.68rem;">0 gambar</span>
        </div>

        <div id="drawings-sidebar-list" style="display:flex; flex-direction:column; gap:0.3rem; max-height: 220px; overflow-y:auto;">
            <div class="combobox-empty" style="text-align:left; padding: 0.5rem 0; color:var(--text-muted); font-size:0.75rem;">
                <i class="fas fa-pencil-alt" style="margin-right:0.3rem;"></i> Belum ada gambar
            </div>
        </div>

    </div>
</div>
