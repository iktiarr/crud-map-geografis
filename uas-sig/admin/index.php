<?php
// admin/index.php — Panel Admin Web GIS (Revisi: tema terang+gelap, import sederhana, responsif)
session_start();

$ADMIN_PASS = 'admin123';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['password'])) {
    if ($_POST['password'] === $ADMIN_PASS) {
        $_SESSION['admin_logged_in'] = true;
    } else {
        $login_error = 'Password salah!';
    }
}
if (isset($_GET['logout'])) { session_destroy(); header('Location: index.php'); exit; }

$logged_in = $_SESSION['admin_logged_in'] ?? false;
?>
<!DOCTYPE html>
<html lang="id" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin — Web GIS Fasilitas Kesehatan</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>

<!-- ========== HEADER ========== -->
<header>
    <h1>
        <div class="brand-icon"><i class="fas fa-cog"></i></div>
        <span class="brand-text">Panel <span>Admin</span></span>
    </h1>
    <div class="header-nav">
        <a href="../index.php" class="btn btn-outline btn-sm"><i class="fas fa-map"></i> <span class="btn-text">Peta</span></a>
        <?php if ($logged_in): ?>
        <a href="?logout=1" class="btn btn-danger btn-sm"><i class="fas fa-sign-out-alt"></i> <span class="btn-text">Logout</span></a>
        <?php endif; ?>
    </div>
</header>

<div id="toast-container"></div>

<?php if (!$logged_in): ?>
<!-- ========== HALAMAN LOGIN ========== -->
<div class="login-wrap">
    <div class="card" style="width:100%; max-width:360px;">
        <div class="card-header">
            <h3><i class="fas fa-lock" style="color:var(--primary);"></i> Login Admin</h3>
        </div>
        <div class="card-body">
            <?php if (isset($login_error)): ?>
                <div class="alert alert-error">
                    <i class="fas fa-exclamation-circle"></i>
                    <?= htmlspecialchars($login_error) ?>
                </div>
            <?php endif; ?>
            <form method="POST">
                <div class="form-group">
                    <label class="form-label">Password Admin</label>
                    <input type="password" name="password" class="form-control"
                           placeholder="Masukkan password..." autofocus required>
                </div>
                <button type="submit" class="btn btn-primary" style="width:100%; justify-content:center; margin-top:.25rem;">
                    <i class="fas fa-sign-in-alt"></i> Masuk
                </button>
            </form>
        </div>
    </div>
</div>

<?php else: ?>
<!-- ========== KONTEN ADMIN ========== -->
<div class="page-container" style="max-width: 100%; padding: 1.5rem 2.5rem;">

    <!-- ========== TABS ========== -->
    <div class="tab-nav" style="margin-bottom:1.25rem; border-bottom:1px solid var(--border-color); padding-bottom:.25rem;">
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
        <div class="search-row" style="align-items: center;">
            <div style="display:flex; gap:.35rem; align-items:center; flex: 1; min-width: 240px;">
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
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; max-width: 100%; align-items: start;">
            
            <!-- Kolom Kiri: Form Upload -->
            <div class="card" style="position: sticky; top: 72px;">
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


<?php endif; ?>

<!-- ========== SCRIPTS ========== -->
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>

/* =====================================================
   TEMA TERANG (SELALU TERANG)
   ===================================================== */
function applyTheme() {
    document.documentElement.setAttribute('data-theme', 'light');
}
(function() { applyTheme(); })();

/* =====================================================
   TOAST
   ===================================================== */
function toast(msg, type = 'info') {
    const icons = { success: '<i class="fas fa-check-circle"></i>', error: '<i class="fas fa-times-circle"></i>', info: '<i class="fas fa-info-circle"></i>', warn: '<i class="fas fa-exclamation-triangle"></i>' };
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `${icons[type]||''}<span>${msg}</span>`;
    document.getElementById('toast-container').appendChild(el);
    setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(8px) scale(0.96)';
        setTimeout(() => el.remove(), 200);
    }, 3000);
}

/* =====================================================
   TABS
   ===================================================== */
function switchTab(id, btn) {
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    btn.classList.add('active');
}

<?php if ($logged_in): ?>

/* =====================================================
   STATE
   ===================================================== */
let allData       = [];
let activeColumns = [];
let kecamatanList = [];
let adminMap      = null;
let pickMarker    = null;
let isEditMode    = false;
let selectedFiles = {}; // { shp, dbf, prj, shx }
let existingTables = []; // list of tables in database
let activeJenisColumn = null; // nama kolom jenis/kategori aktif
let currentPage = 1;
const pageSize = 50;

/* =====================================================
   CAPITALIZE HELPER
   ===================================================== */
function capitalize(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function getDisplayCols(activeTable, columns) {
    return columns.filter(c => {
        if (['id', 'geometry', 'geom_type', 'kecamatan_id'].includes(c)) return false;
        if (['latitude', 'longitude'].includes(c)) {
            return activeTable !== 'fasilitas_kesehatan';
        }
        return true;
    });
}

/* =====================================================
   SUGGEST NEXT TABLE NAME
   ===================================================== */
function suggestNextTableName(tables) {
    existingTables = tables.map(t => t.table_name.toLowerCase());
    const input = document.getElementById('shp-target');
    if (!input) return;
    
    const curVal = input.value.trim().toLowerCase();
    
    // Suggest next name if field is empty, equals "daerah satu", or matches daerah_X
    if (curVal === "" || curVal === "daerah satu" || /^daerah[_\s]\d+$/.test(curVal)) {
        let index = 1;
        while (existingTables.includes(`daerah_${index}`)) {
            index++;
        }
        input.value = `daerah_${index}`;
    }
}

/* =====================================================
   INIT — muat data saat halaman dibuka
   ===================================================== */
(async function init() {
    try {
        const kecRes = await fetch('../api/get_kecamatan.php');
        const kecJson = await kecRes.json();

        if (kecJson.status === 'success') {
            kecamatanList = kecJson.data;
            const selKec  = document.getElementById('filter-kec');
            const fKec    = document.getElementById('f-kecamatan');
            selKec.innerHTML = '<option value="">Semua Kecamatan</option>';
            fKec.innerHTML   = '<option value="">-- Pilih Kecamatan --</option>';
            kecamatanList.forEach(k => {
                selKec.insertAdjacentHTML('beforeend', `<option value="${k.id}">${k.nama_kecamatan}</option>`);
                fKec.insertAdjacentHTML('beforeend', `<option value="${k.id}">${k.nama_kecamatan}</option>`);
            });
        }
    } catch(e) {
        console.error('Error load kecamatan:', e);
    }
    
    await populateActiveTableDropdown();
    await loadTablesList();
})();

/* =====================================================
   POPULATE ACTIVE TABLE DROPDOWN
   ===================================================== */
async function populateActiveTableDropdown() {
    const sel = document.getElementById('active-table');
    if (!sel) return;
    sel.innerHTML = '';
    
    try {
        const res  = await fetch('../api/get_tables.php');
        const json = await res.json();
        
        if (json.status === 'success' && json.tables.length) {
            const tables = json.tables;
            suggestNextTableName(tables);
            const tableNames = tables.map(t => t.table_name);
            const defaultTable = tableNames.includes('fasilitas_kesehatan') ? 'fasilitas_kesehatan' : tableNames[0];
            
            tables.forEach(t => {
                const isSelected = t.table_name === defaultTable ? 'selected' : '';
                sel.insertAdjacentHTML('beforeend', `<option value="${t.table_name}" ${isSelected}>${capitalize(t.table_name)} (${t.type})</option>`);
            });
            
            onTableChange();
        } else {
            suggestNextTableName([]);
        }
    } catch(e) {
        console.error('Gagal load daftar tabel:', e);
    }
}

/* =====================================================
   ON TABLE CHANGE
   ===================================================== */
function onTableChange() {
    const activeTable = document.getElementById('active-table').value;
    loadTableData(activeTable);
}

/* =====================================================
   LOAD TABLE DATA
   ===================================================== */
async function loadTableData(table, selectJenis = null, selectJenisColumn = null) {
    const tbody = document.getElementById('admin-tbody');
    tbody.innerHTML = `<tr><td colspan="100" style="text-align:center; padding:2.5rem; color:var(--text-muted);"><i class="fas fa-spinner fa-spin"></i> Memuat data...</td></tr>`;
    currentPage = 1;
    
    try {
        const res = await fetch(`../api/get_layer_data.php?table=${table}`);
        const json = await res.json();
        
        if (json.status === 'success') {
            allData = json.data;
            activeColumns = json.columns;
            
            // Cari kolom kategori/jenis dinamis
            const categoryCols = ['jenis', 'klasifikasi', 'tipe', 'kategori', 'status', 'type', 'class', 'category', 'classification'];
            activeJenisColumn = selectJenisColumn || activeColumns.find(c => categoryCols.includes(c)) || null;
            
            const hasJenis = !!activeJenisColumn;
            const hasKecamatan = activeColumns.includes('kecamatan_id');
            
            // Populate #filter-jenis secara dinamis jika memiliki kolom kategori
            const filterJenis = document.getElementById('filter-jenis');
            if (hasJenis) {
                filterJenis.style.display = 'block';
                const distinctJenis = [...new Set(allData.map(d => d[activeJenisColumn]).filter(Boolean))];
                filterJenis.innerHTML = '<option value="">Semua Jenis</option>';
                distinctJenis.forEach(j => {
                    filterJenis.insertAdjacentHTML('beforeend', `<option value="${j}">${j}</option>`);
                });
                if (selectJenis) {
                    filterJenis.value = selectJenis;
                }
            } else {
                filterJenis.style.display = 'none';
                filterJenis.innerHTML = '<option value="">Semua Jenis</option>';
            }
            
            // Tampilkan/sembunyikan filter kecamatan
            const filterKec = document.getElementById('filter-kec');
            if (hasKecamatan) {
                filterKec.style.display = 'block';
            } else {
                filterKec.style.display = 'none';
            }
            
            filterTable();
        } else {
            tbody.innerHTML = `<tr><td colspan="100" style="text-align:center; padding:2.5rem; color:var(--danger);"><i class="fas fa-exclamation-circle"></i> Gagal: ${json.message}</td></tr>`;
        }
    } catch(e) {
        tbody.innerHTML = `<tr><td colspan="100" style="text-align:center; padding:2.5rem; color:var(--danger);"><i class="fas fa-exclamation-circle"></i> Error: ${e.message}</td></tr>`;
    }
}

/* =====================================================
   RENDER TABLE (DYNAMIC)
   ===================================================== */
function renderDynamicTable(data) {
    const thead = document.getElementById('admin-thead');
    const tbody = document.getElementById('admin-tbody');
    const cnt   = document.getElementById('admin-count');
    
    const totalCount = data.length;
    cnt.textContent = `${totalCount} data`;

    if (!totalCount) {
        tbody.innerHTML = `<tr><td colspan="100"><div class="empty-state"><i class="fas fa-database"></i><h4>Belum ada data</h4><p>Data kosong pada tabel ini</p></div></td></tr>`;
        const pagEl = document.getElementById('table-pagination');
        if (pagEl) pagEl.style.display = 'none';
        return;
    }

    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = Math.min(startIdx + pageSize, totalCount);
    const paginatedData = data.slice(startIdx, endIdx);

    const activeTable = document.getElementById('active-table').value;
    
    // Tentukan kolom mana saja yang ingin ditampilkan (kecuali ID dan geom metadata)
    const displayCols = getDisplayCols(activeTable, activeColumns);

    // Render Header
    thead.innerHTML = `
        <tr>
            <th>#</th>
            ${displayCols.map(col => `<th>${capitalize(col)}</th>`).join('')}
            <th style="text-align:center; width: 100px;">Aksi</th>
        </tr>
    `;

    // Render Body
    tbody.innerHTML = paginatedData.map((row, i) => {
        const globalIndex = startIdx + i + 1;
        const rowName = row.nama || row.nama_kecamatan || row.nama_wilayah || row.nama_polyline || row.nama_marker || row.namobj || 'Data ' + row.id;
        const actionBtn = `
            <div style="display:flex; gap:.3rem; justify-content:center;">
                <button class="btn btn-danger btn-sm" onclick="deleteDynamicRow('${activeTable}', ${row.id}, '${rowName.replace(/'/g, "\\'")}')" title="Hapus"><i class="fas fa-trash"></i> Hapus</button>
            </div>
        `;

        return `
            <tr>
                <td style="color:var(--text-muted); width:38px;">${globalIndex}</td>
                ${displayCols.map(col => `
                    <td style="color:var(--text-primary);">
                        ${row[col] !== null ? row[col] : '-'}
                    </td>
                `).join('')}
                <td style="text-align:center;">${actionBtn}</td>
            </tr>
        `;
    }).join('');

    renderPagination(totalCount);
}

function renderPagination(totalCount) {
    const pagEl = document.getElementById('table-pagination');
    if (!pagEl) return;
    
    if (totalCount <= pageSize) {
        pagEl.style.display = 'none';
        return;
    }
    pagEl.style.display = 'flex';
    
    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    const startIdx = (currentPage - 1) * pageSize + 1;
    const endIdx = Math.min(currentPage * pageSize, totalCount);
    
    const infoHTML = `<div style="font-size: 0.75rem; color: var(--text-secondary);">
        Menampilkan <strong>${startIdx}-${endIdx}</strong> dari <strong>${totalCount}</strong> data
    </div>`;
    
    let buttonsHTML = `
        <div style="display: flex; gap: 0.25rem; align-items: center;">
            <button class="btn btn-outline btn-sm" onclick="changePage(1)" ${currentPage === 1 ? 'disabled' : ''} style="padding: 0.25rem 0.5rem;" title="Halaman Pertama">
                <i class="fas fa-angle-double-left"></i>
            </button>
            <button class="btn btn-outline btn-sm" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''} style="padding: 0.25rem 0.5rem;" title="Sebelumnya">
                <i class="fas fa-angle-left"></i>
            </button>
    `;
    
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);
    
    if (currentPage <= 3) {
        endPage = Math.min(totalPages, 5);
    }
    if (currentPage > totalPages - 3) {
        startPage = Math.max(1, totalPages - 4);
    }
    
    for (let p = startPage; p <= endPage; p++) {
        const isActive = p === currentPage;
        buttonsHTML += `
            <button class="btn btn-sm ${isActive ? 'btn-primary' : 'btn-outline'}" onclick="changePage(${p})" style="min-width: 32px; justify-content: center; padding: 0.25rem;">
                ${p}
            </button>
        `;
    }
    
    buttonsHTML += `
            <button class="btn btn-outline btn-sm" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''} style="padding: 0.25rem 0.5rem;" title="Berikutnya">
                <i class="fas fa-angle-right"></i>
            </button>
            <button class="btn btn-outline btn-sm" onclick="changePage(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''} style="padding: 0.25rem 0.5rem;" title="Halaman Terakhir">
                <i class="fas fa-angle-double-right"></i>
            </button>
        </div>
    `;
    
    pagEl.innerHTML = infoHTML + buttonsHTML;
}

function changePage(page) {
    currentPage = page;
    filterTable();
}

/* =====================================================
   DELETE DYNAMIC ROW
   ==================================================== */
async function deleteDynamicRow(table, id, name) {
    if (!confirm(`Hapus "${name}"?\nTindakan ini tidak bisa dibatalkan.`)) return;
    try {
        const res  = await fetch('../api/delete_row.php', {
            method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ table, id })
        });
        const json = await res.json();
        if (json.status === 'success') { 
            toast(json.message, 'success'); 
            await loadTableData(table); 
        } else {
            toast('Gagal: ' + json.message, 'error'); 
        }
    } catch(e) { 
        toast('Error: ' + e.message, 'error'); 
    }
}

/* =====================================================
   FILTER LOKAL
   ===================================================== */
function filterTable() {
    const q    = document.getElementById('search-input').value.toLowerCase();
    
    const hasJenis = !!activeJenisColumn;
    const hasKecamatan = activeColumns.includes('kecamatan_id');
    
    const jns  = hasJenis ? document.getElementById('filter-jenis').value : '';
    const kec  = hasKecamatan ? document.getElementById('filter-kec').value : '';
    const activeTable = document.getElementById('active-table').value;
    const displayCols = getDisplayCols(activeTable, activeColumns);
    
    const res = allData.filter(row => {
        // Filter by jenis dinamis
        if (jns && row[activeJenisColumn] !== jns) return false;
        // Filter by kecamatan
        if (kec && String(row.kecamatan_id) !== kec) return false;
        // Filter by search query
        if (!q) return true;
        return displayCols.some(col => {
            const val = row[col];
            return val !== null && String(val).toLowerCase().includes(q);
        });
    });
    
    renderDynamicTable(res);
}


/* =====================================================
   IMPORT SHAPEFILE — TARGET TABEL DINAMIS
   ===================================================== */
async function loadTablesList() {
    const icon = document.getElementById('load-list-icon');
    const tbody = document.getElementById('db-tables-list-body');
    if (icon) icon.className = 'fas fa-spinner fa-spin';
    
    tbody.innerHTML = `
        <tr>
            <td colspan="3" style="text-align:center; padding:2rem; color:var(--text-secondary);">
                <i class="fas fa-spinner fa-spin"></i> Memuat daftar tabel...
            </td>
        </tr>
    `;

    try {
        const res  = await fetch('../api/get_tables.php');
        const json = await res.json();

        if (json.status === 'success' && json.tables.length) {
            existingTables = json.tables.map(t => t.table_name.toLowerCase());
            
            tbody.innerHTML = json.tables.map((t, idx) => {
                const isSystemTable = ['kecamatan', 'fasilitas_kesehatan'].includes(t.table_name);
                const deleteBtn = isSystemTable 
                    ? `<button class="btn btn-outline btn-sm" style="opacity:0.4; cursor:not-allowed;" disabled><i class="fas fa-trash"></i> Hapus</button>` 
                    : `<button class="btn btn-danger btn-sm" onclick="dropTableFromList('${t.table_name}')" title="Hapus tabel kustom"><i class="fas fa-trash"></i> Hapus</button>`;
                
                const viewBtn = `<button class="btn btn-secondary btn-sm" onclick="viewTableData('${t.table_name}')" title="Lihat isi data"><i class="fas fa-eye"></i> Lihat</button>`;
                
                const hasSub = t.has_jenis && t.jenis_list && t.jenis_list.length > 0;
                
                const toggleIcon = hasSub 
                    ? `<span onclick="toggleTableSubtypes(${idx}, event)" style="cursor:pointer; margin-right: 6px; display:inline-flex; align-items:center; justify-content:center; width:16px; height:16px; transition: transform 0.2s;" id="chevron-${idx}">
                         <i class="fas fa-chevron-right" style="font-size:0.75rem; color:var(--text-secondary);"></i>
                       </span>`
                    : '';
                
                const mainRow = `
                    <tr>
                        <td style="font-weight: 500; color: var(--text-primary);">
                            <div style="display: flex; align-items: center;">
                                ${toggleIcon}
                                <span>${capitalize(t.table_name)}</span>
                            </div>
                        </td>
                        <td><span class="badge badge-count">${t.type}</span></td>
                        <td style="text-align:center;">
                            <div style="display:flex; gap:.35rem; justify-content:center;">
                                ${viewBtn}
                                ${deleteBtn}
                            </div>
                        </td>
                    </tr>
                `;
                
                if (!hasSub) {
                    return mainRow;
                }
                
                const subRowItems = t.jenis_list.map(jenis => {
                    const cleanJenis = jenis.replace(/'/g, "\\'");
                    return `
                        <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.72rem; padding: 0.3rem 0; border-bottom: 1px dashed var(--border-color);">
                            <span style="color: var(--text-secondary); font-weight: 500; display:flex; align-items:center; gap:0.3rem;">
                                <i class="fas fa-tag" style="font-size: 0.65rem; color: var(--text-muted);"></i>
                                <span>${jenis}</span>
                            </span>
                            <div style="display: flex; gap: 0.25rem;">
                                <button class="btn btn-outline btn-sm" onclick="viewTableData('${t.table_name}', '${cleanJenis}', '${t.jenis_column}')" style="padding: 0.15rem 0.35rem; font-size: 0.68rem; height:22px;" title="Lihat jenis ini"><i class="fas fa-eye" style="font-size: 0.65rem;"></i> Lihat</button>
                                <button class="btn btn-danger btn-sm" onclick="deleteTableJenis('${t.table_name}', '${cleanJenis}', '${t.jenis_column}')" style="padding: 0.15rem 0.35rem; font-size: 0.68rem; height:22px;" title="Hapus jenis ini"><i class="fas fa-trash" style="font-size: 0.65rem;"></i> Hapus</button>
                            </div>
                        </div>
                    `;
                }).join('');
                
                const subRow = `
                    <tr id="sub-row-${idx}" style="display: none; background: #fafafa;">
                        <td colspan="3" style="padding: 0.5rem 1rem 0.75rem 2rem;">
                            <div style="border-left: 2px solid var(--border-color); padding-left: 0.75rem; display: flex; flex-direction: column; gap: 0.2rem;">
                                <div style="font-size:0.68rem; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.02em; margin-bottom:0.25rem; display:flex; align-items:center; gap:0.25rem;">
                                    <i class="fas fa-list-ul"></i> Jenis Terimport
                                </div>
                                ${subRowItems}
                            </div>
                        </td>
                    </tr>
                `;
                
                return mainRow + subRow;
            }).join('');
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="3" style="text-align:center; padding:2rem; color:var(--text-secondary);">
                        <div class="empty-state">
                            <i class="fas fa-database"></i>
                            <h4>Tidak ada tabel</h4>
                            <p>Belum ada tabel spasial di database.</p>
                        </div>
                    </td>
                </tr>
            `;
        }
    } catch(e) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align:center; padding:2rem; color:var(--danger);">
                    <i class="fas fa-exclamation-circle"></i> Gagal: ${e.message}
                </td>
            </tr>
        `;
        toast('Gagal memuat daftar tabel: ' + e.message, 'error');
    } finally {
        if (icon) icon.className = 'fas fa-sync-alt';
    }
}

async function dropTableFromList(tableName) {
    if (!confirm(`Hapus seluruh tabel "${tableName}" beserta semua data di dalamnya?\nTindakan ini tidak bisa dibatalkan.`)) return;
    try {
        const res = await fetch('../api/drop_table.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ table: tableName })
        });
        const json = await res.json();
        if (json.status === 'success') {
            toast(json.message, 'success');
            await populateActiveTableDropdown();
            await loadTablesList();
        } else {
            toast('Gagal hapus tabel: ' + json.message, 'error');
        }
    } catch (e) {
        toast('Error: ' + e.message, 'error');
    }
}

function viewTableData(tableName, jenisName = null, jenisColumn = null) {
    const tabDataBtn = document.getElementById('tab-btn-data');
    if (tabDataBtn) {
        switchTab('tab-data', tabDataBtn);
    }
    
    const selectEl = document.getElementById('active-table');
    if (selectEl) {
        selectEl.value = tableName;
        loadTableData(tableName, jenisName, jenisColumn);
    }
}

function toggleTableSubtypes(idx, event) {
    if (event) event.stopPropagation();
    const subRow = document.getElementById(`sub-row-${idx}`);
    const chevron = document.getElementById(`chevron-${idx}`);
    if (subRow) {
        if (subRow.style.display === 'none') {
            subRow.style.display = 'table-row';
            if (chevron) chevron.style.transform = 'rotate(90deg)';
        } else {
            subRow.style.display = 'none';
            if (chevron) chevron.style.transform = 'rotate(0deg)';
        }
    }
}

async function deleteTableJenis(tableName, jenisName, jenisColumn = null) {
    if (!confirm(`Hapus semua data dengan jenis "${jenisName}" dari tabel "${tableName}"?\nTindakan ini tidak bisa dibatalkan.`)) return;
    try {
        const res = await fetch('../api/delete_jenis.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ table: tableName, jenis: jenisName, column: jenisColumn })
        });
        const json = await res.json();
        if (json.status === 'success') {
            toast(json.message, 'success');
            
            const activeTable = document.getElementById('active-table').value;
            if (activeTable === tableName) {
                await loadTableData(tableName, null, jenisColumn);
            }
            
            await populateActiveTableDropdown();
            await loadTablesList();
        } else {
            toast('Gagal menghapus jenis: ' + json.message, 'error');
        }
    } catch (e) {
        toast('Error: ' + e.message, 'error');
    }
}

function pickTable(name) {
    document.getElementById('shp-target').value = name;
    toast(`Tabel dipilih: ${name}`, 'info');
}

function onFilesSelected(files) {
    Array.from(files).forEach(f => {
        const ext = f.name.split('.').pop().toLowerCase();
        if (['shp','dbf','prj','shx'].includes(ext)) {
            selectedFiles[ext] = f;
        }
    });
    renderFileChips();
    document.getElementById('upload-btn').disabled = !(selectedFiles.shp || selectedFiles.dbf);
}

function removeSelectedFile(ext, event) {
    if (event) event.stopPropagation();
    delete selectedFiles[ext];
    renderFileChips();
    document.getElementById('upload-btn').disabled = !(selectedFiles.shp || selectedFiles.dbf);
}

function renderFileChips() {
    const wrap = document.getElementById('file-chips');
    const exts = ['shp','dbf','prj','shx'];
    const hasAny = exts.some(ext => !!selectedFiles[ext]);
    if (!hasAny) {
        wrap.style.display = 'none';
        wrap.innerHTML = '';
        return;
    }
    wrap.style.display = 'flex';
    wrap.innerHTML = exts.map(ext => {
        const found = !!selectedFiles[ext];
        const label = found ? selectedFiles[ext].name : `.${ext}`;
        const cls   = found ? 'found' : 'missing';
        const icon  = found ? '✓' : '○';
        const cancelBtn = found ? `<button type="button" onclick="removeSelectedFile('${ext}', event)" style="background:none; border:none; color:inherit; font-size:1.1rem; margin-left:0.35rem; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; padding:0 2px; line-height:1; font-weight:bold;">&times;</button>` : '';
        return `<span class="file-chip ${cls}">${icon} ${label}${cancelBtn}</span>`;
    }).join('');
}

function onDragOver(e) { e.preventDefault(); document.getElementById('drop-zone').classList.add('dragover'); }
function onDragLeave(e) { document.getElementById('drop-zone').classList.remove('dragover'); }
function onDrop(e) {
    e.preventDefault();
    document.getElementById('drop-zone').classList.remove('dragover');
    onFilesSelected(e.dataTransfer.files);
}

async function uploadShapefile() {
    if (!selectedFiles.shp && !selectedFiles.dbf) {
        toast('Pilih minimal file .shp atau .dbf', 'warn'); return;
    }
    const targetTable = document.getElementById('shp-target').value.trim();
    if (!targetTable) {
        toast('Nama tabel tujuan wajib diisi!', 'warn');
        document.getElementById('shp-target').focus();
        return;
    }
    const cleanTarget = targetTable.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    if (existingTables.includes(cleanTarget)) {
        if (!confirm(`Tabel "${cleanTarget}" sudah ada di database. Apakah Anda ingin menimpanya? Data lama di tabel tersebut akan dihapus.`)) {
            return;
        }
    }

    const btn = document.getElementById('upload-btn');
    const originalBtnHTML = btn.innerHTML;

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sedang mengimport...';

    const formData = new FormData();
    formData.append('target_table', targetTable);
    if (selectedFiles.shp) formData.append('shp', selectedFiles.shp);
    if (selectedFiles.dbf) formData.append('dbf', selectedFiles.dbf);
    if (selectedFiles.prj) formData.append('prj', selectedFiles.prj);
    if (selectedFiles.shx) formData.append('shx', selectedFiles.shx);

    try {
        const res  = await fetch('../api/upload_shp.php', { method:'POST', body: formData });
        const json = await res.json();

        if (json.status === 'success') {
            toast(`Berhasil diimport ${json.imported} data ke database.`, 'success');
            
            selectedFiles = {};
            document.getElementById('shp-input').value = '';
            document.getElementById('file-chips').style.display = 'none';
            document.getElementById('upload-btn').disabled = true;

            await populateActiveTableDropdown();
            await loadTablesList();
            
            const cleanTargetName = targetTable.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
            const selectEl = document.getElementById('active-table');
            if (selectEl && Array.from(selectEl.options).some(o => o.value === cleanTargetName)) {
                selectEl.value = cleanTargetName;
                onTableChange();
            }
        } else {
            toast(`Gagal: ${json.message}`, 'error');
        }
    } catch(e) {
        toast(`Error koneksi: ${e.message}`, 'error');
    } finally {
        btn.disabled = !(selectedFiles.shp || selectedFiles.dbf);
        btn.innerHTML = originalBtnHTML;
    }
}

<?php endif; ?>

</script>
</body>
</html>
