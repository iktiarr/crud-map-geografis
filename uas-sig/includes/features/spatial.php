<!-- Collapsible 3: Analisis Spasial -->
<div class="accordion-item" id="accordion-item-spatial">
    <button class="accordion-trigger" onclick="toggleAccordion('acc-spatial', this)">
        <span><i class="fas fa-project-diagram"></i> Analisis Spasial</span>
        <i class="fas fa-chevron-down acc-arrow"></i>
    </button>
    <div id="acc-spatial" class="accordion-content">
        <div class="form-group">
            <label class="form-label">Pilih Wilayah A</label>
            <select id="spatial-poly-a-id" class="form-control" onchange="runSpatialAnalysis()">
                <option value="">-- Pilih Wilayah A --</option>
            </select>
        </div>

        <div class="form-group" style="margin-bottom: 1rem;">
            <label class="form-label">Pilih Wilayah B</label>
            <select id="spatial-poly-b-id" class="form-control" onchange="runSpatialAnalysis()">
                <option value="">-- Pilih Wilayah B --</option>
            </select>
        </div>

        <button class="btn btn-primary" style="width:100%; justify-content:center;" onclick="runSpatialAnalysis()">
            <i class="fas fa-sync-alt"></i> Sinkronkan Peta
        </button>
    </div>
</div>
