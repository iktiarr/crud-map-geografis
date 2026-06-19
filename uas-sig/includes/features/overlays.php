<!-- Collapsible 1: Overlays -->
<div class="accordion-item" id="accordion-item-overlays" style="display: none;">
    <button class="accordion-trigger" id="acc-trigger-overlays" onclick="toggleAccordion('acc-overlays', this)">
        <span><i class="fas fa-layer-group" style="color:#3b82f6;"></i> Overlays</span>
        <i class="fas fa-chevron-down acc-arrow"></i>
    </button>
    <div id="acc-overlays" class="accordion-content">

        <div class="form-group" style="margin-bottom: 0.65rem;">
            <label class="form-label">Pilih Lapisan Data</label>
            <!-- Custom Combobox Overlay -->
            <div class="combobox-wrap" id="combo-overlay">
                <div class="combobox-input-wrap" onclick="toggleCombobox('combo-overlay')">
                    <input type="text" class="combobox-input" id="combo-overlay-input" placeholder="-- Pilih Lapisan --" readonly>
                    <i class="fas fa-chevron-down combobox-arrow"></i>
                </div>
                <div class="combobox-dropdown" id="combo-overlay-dropdown">
                    <div class="combobox-empty" id="combo-overlay-empty">Memuat data...</div>
                </div>
                <input type="hidden" id="overlay-table-select" value="">
            </div>
        </div>

        <button class="btn btn-primary btn-sm" style="width:100%; justify-content:center; margin-bottom: 0.75rem;" onclick="addOverlay()">
            <i class="fas fa-plus"></i> Tambah Lapisan
        </button>

        <!-- Active overlays - hanya tampil kalau ada -->
        <div id="overlay-active-section" style="display: none;">
            <label class="form-label" style="font-weight:600; margin-bottom:0.25rem;">Lapisan Aktif:</label>
            <ul id="overlay-active-list" class="elements-list no-scrollbar"></ul>
        </div>

    </div>
</div>
