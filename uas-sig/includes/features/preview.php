<!-- Collapsible 2: Preview -->
<div class="accordion-item" id="accordion-item-preview">
    <button class="accordion-trigger" onclick="toggleAccordion('acc-preview', this)">
        <span><i class="fas fa-eye"></i> Preview Cepat</span>
        <i class="fas fa-chevron-down acc-arrow"></i>
    </button>
    <div id="acc-preview" class="accordion-content">
        <div class="form-group" style="margin-bottom:0;">
            <label class="form-label">Pilih Tabel untuk Preview</label>
            <select id="preview-table-select" class="form-control" onchange="previewTable()">
                <option value="">-- Pilih Tabel --</option>
            </select>
        </div>
    </div>
</div>
