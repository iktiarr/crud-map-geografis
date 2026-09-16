<!-- ========== KONTEN ADMIN ========== -->
<div class="page-container admin-container">

    <!-- ========== TABS ========== -->
    <div class="tab-nav">
        <button class="tab-btn active" id="tab-btn-data" onclick="switchTab('tab-data', this)">
            <i class="fas fa-table"></i> Data Fasilitas
        </button>
        <button class="tab-btn" id="tab-btn-import" onclick="switchTab('tab-import', this)">
            <i class="fas fa-file-import"></i> Import Shapefile
        </button>
    </div>

    <!-- ============================
         TAB 1 — DATA FASILITAS
         ============================ -->
    <div class="tab-panel active" id="tab-data">

        <!-- Baris filter/search -->
        <div class="search-row">
            <div class="search-row-group">
                <label class="form-label" style="margin: 0; white-space: nowrap;">Tabel Aktif:</label>
                <div class="combobox-wrap" id="combo-active-table" style="flex:1; width: auto; min-width: 180px;">
                    <div class="combobox-input-wrap" onclick="toggleCombobox('combo-active-table')">
                        <input type="text" class="combobox-input" id="combo-active-table-input" placeholder="-- Pilih Tabel --" readonly>
                        <i class="fas fa-chevron-down combobox-arrow"></i>
                    </div>
                    <div class="combobox-dropdown" id="combo-active-table-dropdown">
                        <div class="combobox-empty" id="combo-active-table-empty">Belum ada tabel</div>
                    </div>
                    <input type="hidden" id="active-table" value="">
                </div>
            </div>
            
            <input type="text" id="search-input" class="form-control"
                   placeholder="🔍 Cari data..." oninput="currentPage = 1; filterTable()">
            
            <!-- Combobox Jenis -->
            <div class="combobox-wrap" id="combo-filter-jenis" style="width: auto; min-width: 140px; display: none;">
                <div class="combobox-input-wrap" onclick="toggleCombobox('combo-filter-jenis')">
                    <input type="text" class="combobox-input" id="combo-filter-jenis-input" placeholder="Semua Jenis" readonly>
                    <i class="fas fa-chevron-down combobox-arrow"></i>
                </div>
                <div class="combobox-dropdown" id="combo-filter-jenis-dropdown">
                    <div class="combobox-empty" id="combo-filter-jenis-empty">Tidak ada pilihan</div>
                </div>
                <input type="hidden" id="filter-jenis" value="">
            </div>
            
            <!-- Combobox Kecamatan -->
            <div class="combobox-wrap" id="combo-filter-kec" style="width: auto; min-width: 160px; display: none;">
                <div class="combobox-input-wrap" onclick="toggleCombobox('combo-filter-kec')">
                    <input type="text" class="combobox-input" id="combo-filter-kec-input" placeholder="Semua Kecamatan" readonly>
                    <i class="fas fa-chevron-down combobox-arrow"></i>
                </div>
                <div class="combobox-dropdown" id="combo-filter-kec-dropdown">
                    <div class="combobox-empty" id="combo-filter-kec-empty">Tidak ada pilihan</div>
                </div>
                <input type="hidden" id="filter-kec" value="">
            </div>
            
            <!-- Tombol Tambah Manual -->
            <button type="button" class="btn btn-primary" onclick="openManualFacilityModal()" style="display: flex; align-items: center; gap: 0.35rem; white-space: nowrap; height: 38px;">
                <i class="fas fa-plus-circle"></i> Tambah Manual
            </button>
        </div>

        <!-- Tabel data -->
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-list-ul" style="color:var(--primary);"></i> Daftar Fasilitas</h3>
                <span class="badge badge-count" id="admin-count">Memuat...</span>
            </div>
            <div style="overflow-x: auto;">
                <table class="data-table">
                    <thead id="admin-thead">
                        <tr>
                            <th>#</th>
                            <th>Nama</th>
                            <th>Jenis</th>
                            <th>Kecamatan</th>
                            <th>Alamat</th>
                            <th>Telepon</th>
                            <th>Status</th>
                            <th style="text-align:center;">Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="admin-tbody">
                        <tr>
                            <td colspan="8" style="text-align:center; padding:2.5rem; color:var(--text-muted);">
                                <i class="fas fa-spinner fa-spin"></i> Memuat data...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <!-- Pagination Container -->
            <div id="table-pagination" class="pagination-container" style="display: none;"></div>
        </div>
    </div>

    <!-- ============================
         TAB 2 — IMPORT SHAPEFILE
         ============================ -->
    <div class="tab-panel" id="tab-import">
        <div class="admin-grid">
            
            <!-- Kolom Kiri: Form Upload -->
            <div class="card upload-card-sticky">
                <div class="card-header">
                    <h3><i class="fas fa-file-import" style="color:var(--primary);"></i> Import Shapefile</h3>
                </div>
                <div class="card-body">
                    <!-- Target tabel — input manual -->
                    <div class="form-group">
                        <label class="form-label">Nama Tabel</label>
                        <input type="text" id="shp-target" class="form-control"
                               placeholder="Ketik nama tabel, cth: kecamatan"
                               value=""
                               autocomplete="off" spellcheck="false">
                    </div>

                    <!-- Drop zone — pilih beberapa file sekaligus -->
                    <div class="import-zone" id="drop-zone" onclick="document.getElementById('shp-input').click()"
                         ondragover="onDragOver(event)" ondragleave="onDragLeave(event)" ondrop="onDrop(event)">
                        <input type="file" id="shp-input" multiple
                               accept=".shp,.dbf,.prj,.shx"
                               onchange="onFilesSelected(this.files)">
                        <i class="fas fa-cloud-upload-alt"></i>
                        <p style="font-size: 0.85rem; font-weight: 600; margin-bottom: 0.25rem;">Klik atau seret file Shapefile ke sini</p>
                        <p class="hint" style="font-size: 0.72rem; color: var(--text-secondary); line-height: 1.4;">
                            Mendukung file: <strong style="color: var(--primary);">.shp</strong> (Geometri spasial), <strong style="color: var(--primary);">.dbf</strong> (Atribut tabel), <strong style="color: var(--primary);">.shx</strong> (Indeks geometri), <strong style="color: var(--primary);">.prj</strong> (Sistem proyeksi)<br>
                            <span style="font-size: 0.68rem; color: var(--text-muted);">(Anda bisa mengunggah file .shp saja, .dbf saja, atau kombinasi keduanya secara bersamaan)</span>
                        </p>
                    </div>

                    <!-- Chips file yang dipilih -->
                    <div class="file-chips" id="file-chips" style="display:none;"></div>

                    <!-- Tombol upload -->
                    <button class="btn btn-success" id="upload-btn" onclick="uploadShapefile()"
                            style="width:100%; justify-content:center; margin-top:.9rem;" disabled>
                        <i class="fas fa-upload"></i> Upload &amp; Import
                    </button>
                </div>
            </div>

            <!-- Kolom Kanan: Daftar Tabel Terunggah -->
            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-database" style="color:var(--primary);"></i> Daftar Tabel Database</h3>
                    <button type="button" class="btn btn-outline btn-sm" onclick="loadTablesList()" title="Segarkan daftar tabel" style="padding: 0.2rem 0.5rem;">
                        <i class="fas fa-sync-alt" id="load-list-icon"></i>
                    </button>
                </div>
                <div class="card-body" style="padding: 0;">
                    <div style="overflow-x: auto;">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Nama Tabel</th>
                                    <th>Tipe</th>
                                    <th style="text-align:center; width: 150px;">Aksi</th>
                                </tr>
                            </thead>
                            <tbody id="db-tables-list-body">
                                <tr>
                                    <td colspan="3" style="text-align:center; padding:2rem; color:var(--text-secondary);">
                                        <i class="fas fa-spinner fa-spin"></i> Memuat daftar tabel...
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        </div>
    </div>

    <!-- ========== MODAL TAMBAH FASILITAS MANUAL ========== -->
    <div id="manual-facility-dialog" class="modal-backdrop" onclick="closeManualFacilityDialogOnBackdrop(event)">
        <div class="modal" style="max-width: 600px; display: flex; flex-direction: column; max-height: 90vh;">
            <div class="modal-header" style="flex-shrink: 0;">
                <h3><i class="fas fa-plus-circle" style="color: var(--primary);"></i> Tambah Fasilitas Manual</h3>
                <button type="button" class="modal-close" onclick="closeManualFacilityDialog()">&times;</button>
            </div>
            <div class="modal-body" style="overflow-y: auto; display: flex; flex-direction: column; gap: 1rem;">
                <div class="form-group">
                    <label class="form-label">Nama Fasilitas / Grup</label>
                    <input type="text" id="manual-facility-name" class="form-control" placeholder="Masukkan nama fasilitas/grup, cth: Posko Kesehatan A" autocomplete="off">
                </div>
                
                <div class="form-group">
                    <label class="form-label" style="margin-bottom: 0.25rem;">Gambar Marker pada Peta (Bisa Lebih dari 1)</label>
                    <div id="admin-map" style="height: 300px; width: 100%; border-radius: var(--radius-sm); border: 1px solid var(--border-color); position: relative; z-index: 100;"></div>
                    <div id="pick-coords-info">Klik pada peta untuk menempatkan marker. Klik marker yang ada untuk menghapusnya.</div>
                </div>

                <div id="manual-coords-list-container" style="display: none;">
                    <label class="form-label">Daftar Titik Koordinat</label>
                    <div id="manual-coords-list" style="max-height: 80px; overflow-y: auto; font-size: 0.75rem; color: var(--text-secondary); background: var(--bg-muted); padding: 0.5rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                        Belum ada titik yang dipilih.
                    </div>
                </div>
            </div>
            <div class="modal-footer" style="flex-shrink: 0;">
                <button type="button" class="btn btn-outline" onclick="closeManualFacilityDialog()">Batal</button>
                <button type="button" class="btn btn-primary" id="save-manual-btn" onclick="saveManualFacility()">Simpan</button>
            </div>
        </div>
    </div>

</div><!-- /.page-container -->
