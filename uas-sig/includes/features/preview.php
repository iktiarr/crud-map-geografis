<!-- Collapsible 2: Preview Cepat -->
<div class="accordion-item" id="accordion-item-preview" style="display: none;">
    <button class="accordion-trigger" id="acc-trigger-preview" onclick="toggleAccordion('acc-preview', this)">
        <span><i class="fas fa-eye" style="color:#10b981;"></i> Preview Cepat</span>
        <i class="fas fa-chevron-down acc-arrow"></i>
    </button>
    <div id="acc-preview" class="accordion-content">
        <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Pilih Tabel untuk Preview</label>
            <!-- Custom Combobox Preview -->
            <div class="combobox-wrap" id="combo-preview">
                <div class="combobox-input-wrap" onclick="toggleCombobox('combo-preview')">
                    <input type="text" class="combobox-input" id="combo-preview-input" placeholder="-- Pilih Tabel --" readonly>
                    <i class="fas fa-chevron-down combobox-arrow"></i>
                </div>
                <div class="combobox-dropdown" id="combo-preview-dropdown">
                    <div class="combobox-empty" id="combo-preview-empty">Memuat data...</div>
                </div>
                <input type="hidden" id="preview-table-select" value="">
            </div>
        </div>
    </div>
</div>
