<!-- Collapsible 1: Overlays -->
<div class="accordion-item" id="accordion-item-overlays">
    <button class="accordion-trigger active" onclick="toggleAccordion('acc-overlays', this)">
        <span><i class="fas fa-layer-group"></i> Overlays (Lapisan Peta)</span>
        <i class="fas fa-chevron-down acc-arrow"></i>
    </button>
    <div id="acc-overlays" class="accordion-content show">
        <div class="form-group">
            <label class="form-label">Pilih Lapisan Data</label>
            <select id="overlay-table-select" class="form-control">
                <!-- Dinamis -->
            </select>
        </div>
        <button class="btn btn-primary btn-sm" style="width:100%; justify-content:center; margin-bottom: 0.75rem;" onclick="addOverlay()">
            <i class="fas fa-plus"></i> Tambah Lapisan
        </button>
        <label class="form-label" style="font-weight:600; margin-bottom:0.25rem;">Lapisan Aktif:</label>
        <ul id="overlay-active-list" class="elements-list no-scrollbar">
            <li class="element-item" style="color:var(--text-muted); justify-content:center;">Belum ada lapisan overlay aktif</li>
        </ul>
    </div>
</div>
