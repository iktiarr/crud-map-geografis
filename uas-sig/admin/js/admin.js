/* =====================================================
   Panel Admin Web GIS — JS Logic
   admin/js/admin.js
   ===================================================== */

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
    const icons = { 
        success: '<i class="fas fa-check-circle"></i>', 
        error: '<i class="fas fa-times-circle"></i>', 
        info: '<i class="fas fa-info-circle"></i>', 
        warn: '<i class="fas fa-exclamation-triangle"></i>' 
    };
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `${icons[type] || ''}<span>${msg}</span>`;
    
    const container = document.getElementById('toast-container');
    if (container) {
        container.appendChild(el);
    }
    
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
    
    const panel = document.getElementById(id);
    if (panel) panel.classList.add('active');
    if (btn) btn.classList.add('active');
}

/* =====================================================
   COMBOBOX ENGINE
   ===================================================== */
function toggleCombobox(wrapId) {
    const wrap = document.getElementById(wrapId);
    if (!wrap) return;

    document.querySelectorAll('.combobox-wrap.open').forEach(el => {
        if (el.id !== wrapId) el.classList.remove('open');
    });

    const isOpen = wrap.classList.contains('open');
    wrap.classList.toggle('open');

    if (!isOpen) {
        const dropdown = wrap.querySelector('.combobox-dropdown');
        const inputWrap = wrap.querySelector('.combobox-input-wrap');
        if (dropdown && inputWrap) {
            const rect = inputWrap.getBoundingClientRect();
            dropdown.style.position = 'fixed';
            dropdown.style.top = (rect.bottom + 2) + 'px';
            dropdown.style.left = rect.left + 'px';
            dropdown.style.width = rect.width + 'px';
            dropdown.style.zIndex = '99999';
            dropdown.style.maxHeight = '200px';
            dropdown.style.overflowY = 'auto';
        }
    }
}

function closeAllComboboxes() {
    document.querySelectorAll('.combobox-wrap.open').forEach(el => el.classList.remove('open'));
}

document.addEventListener('click', function(e) {
    if (!e.target.closest('.combobox-wrap')) {
        closeAllComboboxes();
    }
});

function setComboboxValue(wrapId, value, label) {
    const wrap = document.getElementById(wrapId);
    if (!wrap) return;

    const hiddenInput = wrap.querySelector('input[type="hidden"]');
    const textInput = wrap.querySelector('.combobox-input');

    if (hiddenInput) hiddenInput.value = value;
    if (textInput) {
        textInput.value = label || '';
        textInput.title = label || '';
    }

    wrap.querySelectorAll('.combobox-option').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.value === String(value));
    });
    wrap.classList.remove('open');
}

function clearCombobox(wrapId) {
    setComboboxValue(wrapId, '', '');
    const wrap = document.getElementById(wrapId);
    if (wrap) {
        wrap.querySelectorAll('.combobox-option').forEach(o => o.classList.remove('selected'));
    }
}

function populateCombobox(wrapId, options, onSelect) {
    const wrap = document.getElementById(wrapId);
    if (!wrap) return;

    const dropdown = wrap.querySelector('.combobox-dropdown');
    const emptyEl  = wrap.querySelector('[id$="-empty"]');

    if (!dropdown) return;

    dropdown.querySelectorAll('.combobox-option').forEach(o => o.remove());

    if (!options || options.length === 0) {
        if (emptyEl) emptyEl.style.display = 'block';
        return;
    }

    if (emptyEl) emptyEl.style.display = 'none';

    options.forEach(opt => {
        const div = document.createElement('div');
        div.className = 'combobox-option';
        div.dataset.value = opt.value;
        div.textContent = opt.label;
        div.onclick = (e) => {
            e.stopPropagation();
            setComboboxValue(wrapId, opt.value, opt.label);
            if (typeof onSelect === 'function') onSelect(opt.value, opt.label);
        };
        dropdown.appendChild(div);
    });
}

/* =====================================================
   STATE & CONSTANTS
   ===================================================== */
let allData       = [];
let activeColumns = [];
let kecamatanList = [];
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
            const fKec    = document.getElementById('f-kecamatan');
            
            if (fKec) {
                fKec.innerHTML   = '<option value="">-- Pilih Kecamatan --</option>';
                kecamatanList.forEach(k => {
                    fKec.insertAdjacentHTML('beforeend', `<option value="${k.id}">${k.nama_kecamatan}</option>`);
                });
            }
            
            // Populate combo-filter-kec
            const kecOpts = [
                { value: '', label: 'Semua Kecamatan' },
                ...kecamatanList.map(k => ({ value: k.id, label: k.nama_kecamatan }))
            ];
            populateCombobox('combo-filter-kec', kecOpts, (val) => {
                currentPage = 1;
                filterTable();
            });
            setComboboxValue('combo-filter-kec', '', 'Semua Kecamatan');
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
    const hiddenInput = document.getElementById('active-table');
    if (!hiddenInput) return;
    
    try {
        const res  = await fetch('../api/get_tables.php');
        const json = await res.json();
        
        if (json.status === 'success' && json.tables.length) {
            const tables = json.tables;
            suggestNextTableName(tables);
            const tableNames = tables.map(t => t.table_name);
            const defaultTable = tableNames.includes('fasilitas_kesehatan') ? 'fasilitas_kesehatan' : tableNames[0];
            
            const tableOpts = tables.map(t => ({
                value: t.table_name,
                label: `${capitalize(t.table_name)} (${t.type})`
            }));
            
            populateCombobox('combo-active-table', tableOpts, (val) => {
                onTableChange();
            });
            
            // Set default value
            const defaultTableObj = tables.find(t => t.table_name === defaultTable);
            const defaultLabel = defaultTableObj ? `${capitalize(defaultTableObj.table_name)} (${defaultTableObj.type})` : '';
            setComboboxValue('combo-active-table', defaultTable, defaultLabel);
            
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
    const selectEl = document.getElementById('active-table');
    if (!selectEl) return;
    const activeTable = selectEl.value;
    loadTableData(activeTable);
}

/* =====================================================
   LOAD TABLE DATA
   ===================================================== */
async function loadTableData(table, selectJenis = null, selectJenisColumn = null) {
    const tbody = document.getElementById('admin-tbody');
    if (!tbody) return;
    
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
            activeJenisColumn = (selectJenisColumn && selectJenisColumn !== '__component__') 
                ? selectJenisColumn 
                : (activeColumns.find(c => categoryCols.includes(c)) || null);
            
            const hasJenis = !!activeJenisColumn;
            const hasKecamatan = activeColumns.includes('kecamatan_id');
            
            // Populate combo-filter-jenis secara dinamis jika memiliki kolom kategori
            const comboJenisWrap = document.getElementById('combo-filter-jenis');
            if (comboJenisWrap) {
                if (hasJenis) {
                    comboJenisWrap.style.display = 'block';
                    const distinctJenis = [...new Set(allData.map(d => d[activeJenisColumn]).filter(Boolean))];
                    const jenisOpts = [
                        { value: '', label: 'Semua Jenis' },
                        ...distinctJenis.map(j => ({ value: j, label: j }))
                    ];
                    
                    populateCombobox('combo-filter-jenis', jenisOpts, (val) => {
                        currentPage = 1;
                        filterTable();
                    });
                    
                    const defaultVal = selectJenis || '';
                    setComboboxValue('combo-filter-jenis', defaultVal, defaultVal ? defaultVal : 'Semua Jenis');
                } else {
                    comboJenisWrap.style.display = 'none';
                    setComboboxValue('combo-filter-jenis', '', 'Semua Jenis');
                }
            }
            
            // Tampilkan/sembunyikan filter kecamatan
            const comboKecWrap = document.getElementById('combo-filter-kec');
            if (comboKecWrap) {
                if (hasKecamatan) {
                    comboKecWrap.style.display = 'block';
                } else {
                    comboKecWrap.style.display = 'none';
                    setComboboxValue('combo-filter-kec', '', 'Semua Kecamatan');
                }
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
    
    if (!tbody || !thead) return;
    
    const totalCount = data.length;
    if (cnt) {
        cnt.textContent = `${totalCount} data`;
    }

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
            method:'POST', 
            headers:{'Content-Type':'application/json'}, 
            body: JSON.stringify({ table, id })
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
    const qEl = document.getElementById('search-input');
    const q = qEl ? qEl.value.toLowerCase() : '';
    
    const hasJenis = !!activeJenisColumn;
    const hasKecamatan = activeColumns.includes('kecamatan_id');
    
    const jnsEl = document.getElementById('filter-jenis');
    const kecEl = document.getElementById('filter-kec');
    const activeTableEl = document.getElementById('active-table');
    
    if (!activeTableEl) return;
    
    const jns  = (hasJenis && jnsEl) ? jnsEl.value : '';
    const kec  = (hasKecamatan && kecEl) ? kecEl.value : '';
    const activeTable = activeTableEl.value;
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
    if (!tbody) return;
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
                
                const isComponentList = t.jenis_column === '__component__';
                const headerText = isComponentList ? 'Komponen Terimport' : 'Jenis Terimport';
                const listIcon = isComponentList ? 'fa-file' : 'fa-list-ul';
                
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
                    const itemIcon = isComponentList ? 'fa-file-alt' : 'fa-tag';
                    const displayLabel = isComponentList ? `Komponen ${jenis}` : jenis;
                    
                    return `
                        <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.72rem; padding: 0.3rem 0; border-bottom: 1px dashed var(--border-color);">
                            <span style="color: var(--text-secondary); font-weight: 500; display:flex; align-items:center; gap:0.3rem;">
                                <i class="fas ${itemIcon}" style="font-size: 0.65rem; color: var(--text-muted);"></i>
                                <span>${displayLabel}</span>
                            </span>
                            <div style="display: flex; gap: 0.25rem;">
                                <button class="btn btn-outline btn-sm" onclick="viewTableData('${t.table_name}', '${cleanJenis}', '${t.jenis_column}')" style="padding: 0.15rem 0.35rem; font-size: 0.68rem; height:22px;" title="Lihat ${displayLabel}"><i class="fas fa-eye" style="font-size: 0.65rem;"></i> Lihat</button>
                                <button class="btn btn-danger btn-sm" onclick="deleteTableJenis('${t.table_name}', '${cleanJenis}', '${t.jenis_column}')" style="padding: 0.15rem 0.35rem; font-size: 0.68rem; height:22px;" title="Hapus ${displayLabel}"><i class="fas fa-trash" style="font-size: 0.65rem;"></i> Hapus</button>
                            </div>
                        </div>
                    `;
                }).join('');
                
                const subRow = `
                    <tr id="sub-row-${idx}" style="display: none; background: #fafafa;">
                        <td colspan="3" style="padding: 0.5rem 1rem 0.75rem 2rem;">
                            <div style="border-left: 2px solid var(--border-color); padding-left: 0.75rem; display: flex; flex-direction: column; gap: 0.2rem;">
                                <div style="font-size:0.68rem; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.02em; margin-bottom:0.25rem; display:flex; align-items:center; gap:0.25rem;">
                                    <i class="fas ${listIcon}"></i> ${headerText}
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
    
    const hiddenEl = document.getElementById('active-table');
    if (hiddenEl) {
        setComboboxValue('combo-active-table', tableName, capitalize(tableName));
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
    if (jenisColumn === '__component__') {
        const cleanComp = jenisName.replace('.', ''); // '.shp' -> 'shp'
        const compLabels = {
            shp: 'Geometri Spasial (.shp)',
            dbf: 'Data Atribut (.dbf)',
            prj: 'Sistem Proyeksi (.prj)',
            shx: 'Indeks Geometri (.shx)'
        };
        const label = compLabels[cleanComp] || jenisName;
        if (!confirm(`Hapus komponen ${label} dari tabel "${tableName}"?\nTindakan ini tidak bisa dibatalkan.`)) return;
        
        try {
            const res = await fetch('../api/delete_table_component.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ table: tableName, component: cleanComp })
            });
            const json = await res.json();
            if (json.status === 'success') {
                toast(json.message, 'success');
                
                const activeTableEl = document.getElementById('active-table');
                if (activeTableEl && activeTableEl.value === tableName) {
                    await loadTableData(tableName);
                }
                
                await populateActiveTableDropdown();
                await loadTablesList();
            } else {
                toast('Gagal menghapus komponen: ' + json.message, 'error');
            }
        } catch (e) {
            toast('Error: ' + e.message, 'error');
        }
        return;
    }

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
            
            const activeTableEl = document.getElementById('active-table');
            if (activeTableEl && activeTableEl.value === tableName) {
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
    const targetInput = document.getElementById('shp-target');
    if (targetInput) {
        targetInput.value = name;
        toast(`Tabel dipilih: ${name}`, 'info');
    }
}

function onFilesSelected(files) {
    Array.from(files).forEach(f => {
        const ext = f.name.split('.').pop().toLowerCase();
        if (['shp','dbf','prj','shx'].includes(ext)) {
            selectedFiles[ext] = f;
        }
    });
    renderFileChips();
    
    const uploadBtn = document.getElementById('upload-btn');
    if (uploadBtn) {
        uploadBtn.disabled = !(selectedFiles.shp || selectedFiles.dbf);
    }
}

function removeSelectedFile(ext, event) {
    if (event) event.stopPropagation();
    delete selectedFiles[ext];
    renderFileChips();
    
    const uploadBtn = document.getElementById('upload-btn');
    if (uploadBtn) {
        uploadBtn.disabled = !(selectedFiles.shp || selectedFiles.dbf);
    }
}

function renderFileChips() {
    const wrap = document.getElementById('file-chips');
    if (!wrap) return;
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

function onDragOver(e) { 
    e.preventDefault(); 
    const dropZone = document.getElementById('drop-zone');
    if (dropZone) dropZone.classList.add('dragover'); 
}
function onDragLeave(e) { 
    const dropZone = document.getElementById('drop-zone');
    if (dropZone) dropZone.classList.remove('dragover'); 
}
function onDrop(e) {
    e.preventDefault();
    const dropZone = document.getElementById('drop-zone');
    if (dropZone) dropZone.classList.remove('dragover');
    onFilesSelected(e.dataTransfer.files);
}

async function uploadShapefile() {
    if (!selectedFiles.shp && !selectedFiles.dbf) {
        toast('Pilih minimal file .shp atau .dbf', 'warn'); return;
    }
    const targetTableEl = document.getElementById('shp-target');
    if (!targetTableEl) return;
    const targetTable = targetTableEl.value.trim();
    if (!targetTable) {
        toast('Nama tabel tujuan wajib diisi!', 'warn');
        targetTableEl.focus();
        return;
    }
    const cleanTarget = targetTable.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    if (existingTables.includes(cleanTarget)) {
        if (!confirm(`Tabel "${cleanTarget}" sudah ada di database. Apakah Anda ingin menimpanya? Data lama di tabel tersebut akan dihapus.`)) {
            return;
        }
    }

    const btn = document.getElementById('upload-btn');
    if (!btn) return;
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
            const shpInput = document.getElementById('shp-input');
            if (shpInput) shpInput.value = '';
            
            const fileChips = document.getElementById('file-chips');
            if (fileChips) fileChips.style.display = 'none';
            
            btn.disabled = true;

            await populateActiveTableDropdown();
            await loadTablesList();
            
            const cleanTargetName = targetTable.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
            const hiddenEl = document.getElementById('active-table');
            if (hiddenEl) {
                setComboboxValue('combo-active-table', cleanTargetName, capitalize(cleanTargetName));
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

/* =====================================================
   FITUR TAMBAH FASILITAS MANUAL
   ===================================================== */
let adminMap = null;
let adminMarkers = [];

function openManualFacilityModal() {
    const dialog = document.getElementById('manual-facility-dialog');
    if (!dialog) return;

    dialog.classList.add('show');
    document.getElementById('manual-facility-name').value = '';
    
    // Clear old markers from map
    if (adminMap) {
        adminMarkers.forEach(m => adminMap.removeLayer(m));
    }
    adminMarkers = [];
    updateCoordsList();

    // Initialize map if not done yet
    if (!adminMap) {
        adminMap = L.map('admin-map').setView([-6.9175, 107.6191], 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(adminMap);

        // Click handler to add marker
        adminMap.on('click', function(e) {
            addAdminMarker(e.latlng);
        });
        
        // Fit map bounds to existing kecamatan if available
        fetchKecamatanAndFitBounds();
    } else {
        // Just invalidate size so Leaflet layout updates correctly inside the modal
        setTimeout(() => {
            adminMap.invalidateSize();
            fetchKecamatanAndFitBounds();
        }, 100);
    }
}

async function fetchKecamatanAndFitBounds() {
    try {
        const res = await fetch('../api/get_layer_data.php?table=kecamatan');
        const json = await res.json();
        if (json.status === 'success' && json.data.length > 0) {
            const tempGroup = L.featureGroup();
            json.data.forEach(row => {
                if (row.geometry) {
                    tempGroup.addLayer(L.geoJSON(row.geometry));
                }
            });
            if (tempGroup.getLayers().length > 0) {
                adminMap.fitBounds(tempGroup.getBounds());
            }
        }
    } catch (e) {
        console.error("Gagal menyesuaikan batas peta ke kecamatan:", e);
    }
}

function addAdminMarker(latlng) {
    const marker = L.marker(latlng, {
        draggable: true
    }).addTo(adminMap);
    
    // When dragged, update coordinates list
    marker.on('dragend', function() {
        updateCoordsList();
    });

    // When clicked, remove this marker
    marker.on('click', function(e) {
        L.DomEvent.stopPropagation(e);
        adminMap.removeLayer(marker);
        adminMarkers = adminMarkers.filter(m => m !== marker);
        updateCoordsList();
    });

    adminMarkers.push(marker);
    updateCoordsList();
}

function updateCoordsList() {
    const listContainer = document.getElementById('manual-coords-list-container');
    const listEl = document.getElementById('manual-coords-list');
    if (!listEl) return;

    if (adminMarkers.length === 0) {
        if (listContainer) listContainer.style.display = 'none';
        listEl.innerHTML = 'Belum ada titik yang dipilih.';
        return;
    }

    if (listContainer) listContainer.style.display = 'block';
    
    listEl.innerHTML = adminMarkers.map((m, idx) => {
        const pos = m.getLatLng();
        return `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem;">
            <span>Titik ${idx+1}: <strong>${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}</strong></span>
            <button type="button" class="btn btn-link btn-sm" onclick="removeAdminMarkerByIdx(${idx})" style="color:var(--danger); padding:0; font-size:0.75rem; border:none; background:none; cursor:pointer;"><i class="fas fa-trash"></i></button>
        </div>`;
    }).join('');
}

function removeAdminMarkerByIdx(idx) {
    const marker = adminMarkers[idx];
    if (marker && adminMap) {
        adminMap.removeLayer(marker);
        adminMarkers.splice(idx, 1);
        updateCoordsList();
    }
}

function closeManualFacilityDialog() {
    const dialog = document.getElementById('manual-facility-dialog');
    if (dialog) dialog.classList.remove('show');
}

function closeManualFacilityDialogOnBackdrop(e) {
    if (e.target.id === 'manual-facility-dialog') {
        closeManualFacilityDialog();
    }
}

async function saveManualFacility() {
    const nameEl = document.getElementById('manual-facility-name');
    const name = nameEl ? nameEl.value.trim() : '';

    if (!name) {
        toast('Nama fasilitas tidak boleh kosong!', 'warn');
        return;
    }

    if (adminMarkers.length === 0) {
        toast('Pilih minimal 1 marker pada peta!', 'warn');
        return;
    }

    // WKT MultiPoint format: MULTIPOINT(lng1 lat1, lng2 lat2, ...)
    const pointsStr = adminMarkers.map(m => {
        const pos = m.getLatLng();
        return `${pos.lng} ${pos.lat}`;
    }).join(', ');
    const wkt = `MULTIPOINT(${pointsStr})`;

    const saveBtn = document.getElementById('save-manual-btn');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    }

    try {
        const res = await fetch('../api/save_manual_facility.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nama: name, wkt: wkt })
        });
        const json = await res.json();

        if (json.status === 'success') {
            toast(json.message, 'success');
            closeManualFacilityDialog();
            
            // Reload the table and active table dropdown
            const activeTableEl = document.getElementById('active-table');
            if (activeTableEl && json.table) {
                setComboboxValue('combo-active-table', json.table, capitalize(json.table) + ' (GEOMETRY)');
                await loadTableData(json.table);
            }
            await populateActiveTableDropdown();
            await loadTablesList();
        } else {
            toast('Gagal menyimpan: ' + json.message, 'error');
        }
    } catch (e) {
        toast('Error: ' + e.message, 'error');
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = 'Simpan';
        }
    }
}

