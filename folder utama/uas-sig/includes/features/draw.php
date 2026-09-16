<!-- Collapsible 4: Buat Gambar -->
<div class="accordion-item" id="accordion-item-draw">
    <button class="accordion-trigger" onclick="toggleAccordion('acc-draw', this)">
        <span><i class="fas fa-edit"></i> Buat Gambar</span>
        <i class="fas fa-chevron-down acc-arrow"></i>
    </button>
    <div id="acc-draw" class="accordion-content">
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
        
        <label class="form-label" style="font-weight:600; margin-bottom:0.35rem; margin-top:0.75rem;">2. Alat Gambar</label>
        <div id="draw-instruction" class="draw-instructions" style="display: none;"></div>
        <div class="draw-btn-group" style="margin-bottom:0.75rem;">
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

        <label class="form-label" style="font-weight:600; margin-bottom:0.25rem;">Daftar Gambar Tersimpan:</label>
        <ul id="drawings-list" class="elements-list no-scrollbar">
            <li class="element-item" style="color:var(--text-muted); justify-content:center;">Belum ada gambar tersimpan</li>
        </ul>
    </div>
</div>
