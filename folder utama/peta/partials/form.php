<!-- SIDEBAR PANEL (Right) -->
<div class="sidebar-panel">
    <!-- Form Card -->
    <div class="glass-card form-card" style="padding:14px;">
        <form id="crudForm">
            <!-- Status Badge -->
            <div id="formStatus" class="form-status status-add" style="display:flex;align-items:center;justify-content:space-between;padding:6px 10px;border-radius:8px;margin-bottom:10px;border:1px solid transparent;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;">
                <span>Mode: Tambah Baru</span>
                <span class="dot" style="width:6px;height:6px;border-radius:50%;background:#10b981;"></span>
            </div>

            <!-- Hidden fields -->
            <input type="hidden" id="data_id"      name="id">
            <input type="hidden" id="data_geojson" name="geojson">
            <input type="hidden" id="data_warna"   name="warna" value="#10b981">

            <!-- Row 1: Name + Deskripsi -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
                <div>
                    <label class="form-label">Nama Lokasi</label>
                    <input type="text" id="data_nama" name="nama" class="form-input"
                        placeholder="Nama tempat..." required>
                </div>
                <div>
                    <label class="form-label">Deskripsi / Popup</label>
                    <textarea id="data_deskripsi" name="deskripsi" rows="2" class="form-input" style="resize:none;"
                        placeholder="Keterangan detail..."></textarea>
                </div>
            </div>

            <!-- Row 2: Layer Type + Dynamic Fields -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
                <div>
                    <label class="form-label">Tipe Layer</label>
                    <select id="data_tipe_layer" name="tipe_layer" class="form-input" onchange="adjustFormFields()" style="cursor:pointer;">
                        <option value="geojson">Gambar Peta / Spasial</option>
                        <option value="circle">Circle (Lingkaran)</option>
                        <option value="rectangle">Rectangle (Persegi)</option>
                        <option value="ground_overlay">Ground Overlay</option>
                        <option value="tile_layer">Tile Layer XYZ</option>
                    </select>
                </div>
                <div>
                    <!-- Dynamic: URL -->
                    <div id="div_url" class="hidden">
                        <label id="lbl_url" class="form-label">Tautan Gambar Overlay</label>
                        <input type="text" id="data_image_url" name="image_url" class="form-input" placeholder="http://...">
                    </div>
                    <!-- Dynamic: Radius -->
                    <div id="div_radius" class="hidden">
                        <label class="form-label">Radius (Meter)</label>
                        <input type="number" id="data_radius" name="radius" class="form-input" placeholder="Contoh: 1000">
                    </div>
                </div>
            </div>

            <!-- Row 3: Color + Actions -->
            <div style="height:1px;background:var(--border);margin:2px 0 10px;"></div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
                <!-- Color Picker -->
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;">Warna:</span>
                    <div style="display:flex;gap:4px;align-items:center;" id="colorPickerRow">
                        <?php
                        $colors = ['#10b981','#0ea5e9','#3b82f6','#a855f7','#f43f5e','#ef4444','#f59e0b'];
                        foreach ($colors as $c): ?>
                        <button type="button" onclick="setColor('<?= $c ?>')"
                            class="color-dot <?= $c === '#10b981' ? 'active' : '' ?>"
                            data-color="<?= $c ?>"
                            style="background:<?= $c ?>;"></button>
                        <?php endforeach; ?>
                        <!-- Custom Color -->
                        <div style="position:relative;width:18px;height:18px;">
                            <input type="color" id="customColor" style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;" oninput="setColor(this.value)">
                            <div id="customIndicator" style="width:100%;height:100%;border-radius:4px;border:1px solid #e5e7eb;background:#f3f4f6;display:flex;align-items:center;justify-content:center;">
                                <i data-lucide="plus" style="width:9px;height:9px;color:#9ca3af;stroke:#9ca3af;"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Buttons -->
                <div style="display:flex;gap:6px;">
                    <button type="button" onclick="resetForm()" class="btn-secondary">Reset</button>
                    <button type="submit" id="btnSubmit" class="btn-primary">Simpan</button>
                </div>
            </div>
        </form>
    </div>
</div>
