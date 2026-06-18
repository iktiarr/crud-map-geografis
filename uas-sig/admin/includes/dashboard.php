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
                <select id="active-table" class="form-control" onchange="onTableChange()" style="flex:1;">
                    <!-- Dinamis dari database -->
                </select>
            </div>
            <input type="text" id="search-input" class="form-control"
                   placeholder="🔍 Cari data..." oninput="currentPage = 1; filterTable()">
            <select id="filter-jenis" class="form-control" onchange="currentPage = 1; filterTable()">
                <option value="">Semua Jenis</option>
                <option value="Puskesmas">Puskesmas</option>
                <option value="Rumah Sakit">Rumah Sakit</option>
                <option value="Klinik">Klinik</option>
                <option value="Apotek">Apotek</option>
            </select>
            <select id="filter-kec" class="form-control" onchange="currentPage = 1; filterTable()">
                <option value="">Semua Kecamatan</option>
            </select>
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

</div><!-- /.page-container -->
