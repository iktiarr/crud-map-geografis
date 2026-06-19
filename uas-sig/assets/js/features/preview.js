// =====================================================
// QUICK PREVIEW MANAGEMENT (FITUR 2)
// =====================================================
let activeFeatureFilters = {};
let currentCategoryColumn = null;
let previewLayerVisible = false;

function populatePreviewDropdown() {
    const options = [];
    tablesList.forEach(t => {
        if (['custom_polygons', 'custom_polylines', 'custom_markers', 'custom_drawings', 'markers'].includes(t.table_name)) return;
        options.push({ value: t.table_name, label: capitalize(t.table_name) });
    });

    populateCombobox('combo-preview', options, (val) => {
        const hiddenEl = document.getElementById('preview-table-select');
        if (hiddenEl) hiddenEl.value = val;
        previewTable();
    });
}

async function previewTable() {
    const hiddenEl = document.getElementById('preview-table-select');
    if (!hiddenEl) return;
    const table = hiddenEl.value;
    if (!table) {
        markerLayer.clearLayers();
        activeData = [];
        activeColumns = [];
        setupFeatureFilters(null);
        renderDynamicTable([]);
        return;
    }
    
    const loadingEl = document.getElementById('map-loading');
    if (loadingEl) loadingEl.classList.add('show');
    
    markerLayer.clearLayers();
    highlightLayer.clearLayers();
    
    try {
        const res = await fetch(`api/get_layer_data.php?table=${table}`);
        const json = await res.json();
        
        if (json.status === 'success') {
            activeData = json.data;
            activeColumns = json.columns;
            currentPage = 1;
            
            const titleEl = document.getElementById('results-title');
            if (titleEl) {
                titleEl.innerHTML = `<i class="fas fa-table"></i> Preview ${capitalize(table)}`;
            }
            const countEl = document.getElementById('result-count');
            if (countEl) {
                countEl.textContent = `${activeData.length} data`;
            }
            
            // Setup dynamic filter switches
            const activeTableMeta = tablesList.find(t => t.table_name === table);
            setupFeatureFilters(activeTableMeta);
            
            // Apply filters (this renders both geometries and dynamic table)
            applyCurrentFilters();
            
            const tempGroup = L.featureGroup();
            markerLayer.eachLayer(l => {
                tempGroup.addLayer(l);
            });
            
            if (tempGroup.getLayers().length > 0) {
                map.fitBounds(tempGroup.getBounds(), { maxZoom: 15, animate: true });
            } else {
                toast('Tabel tidak memiliki geometri untuk ditampilkan', 'warn');
            }
            
            toast(`Menampilkan preview ${capitalize(table)}`, 'success');
        } else {
            toast('Gagal memuat preview: ' + json.message, 'error');
        }
    } catch (e) {
        console.error(e);
        toast('Gagal memuat preview', 'error');
    } finally {
        if (loadingEl) loadingEl.classList.remove('show');
    }
}

// =====================================================
// DYNAMIC FEATURE FILTERS (SHADCN SWITCH LOGIC)
// =====================================================
function setupFeatureFilters(tableMeta) {
    const card = document.getElementById('feature-filter-card');
    const container = document.getElementById('feature-filter-switches');
    if (!card || !container) return;

    if (!tableMeta || !tableMeta.has_jenis || !tableMeta.jenis_list || !tableMeta.jenis_list.length) {
        card.style.display = 'none';
        activeFeatureFilters = {};
        currentCategoryColumn = null;
        return;
    }

    currentCategoryColumn = tableMeta.jenis_column;
    card.style.display = 'block';
    container.innerHTML = '';
    activeFeatureFilters = {};

    tableMeta.jenis_list.forEach(jenis => {
        activeFeatureFilters[jenis] = true; // By default all are active
        
        // Find icon / color config
        const cfg = JENIS_CONFIG[jenis] || { color: '#71717a', icon: 'fas fa-dot-circle' };
        const itemId = `switch-${jenis.replace(/\s+/g, '-')}`;
        const switchHTML = `
            <div class="switch-item">
                <span class="switch-label">
                    <i class="${cfg.icon}" style="color:${cfg.color};"></i> ${jenis}
                </span>
                <label class="switch-control">
                    <input type="checkbox" id="${itemId}" checked onchange="toggleFeatureFilter('${jenis}', this.checked)">
                    <span class="switch-slider"></span>
                </label>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', switchHTML);
    });
}

function toggleFeatureFilter(value, isChecked) {
    activeFeatureFilters[value] = isChecked;
    applyCurrentFilters();
}

function applyCurrentFilters() {
    currentPage = 1;
    let filteredData = activeData;
    if (currentCategoryColumn && Object.keys(activeFeatureFilters).length > 0) {
        filteredData = activeData.filter(row => {
            const val = row[currentCategoryColumn];
            if (val === null || val === undefined || val === '') return true;
            return activeFeatureFilters[val] !== false;
        });
    }
    
    renderLayerGeometries(filteredData);
    const countEl = document.getElementById('result-count');
    if (countEl) {
        countEl.textContent = `${filteredData.length} data`;
    }
    renderDynamicTable(filteredData);
}

// =====================================================
// BUAT CUSTOM MARKER ICON
// =====================================================
function createMarkerIcon(jenis) {
    const cfg   = JENIS_CONFIG[jenis] || { color: '#0ea5e9', icon: 'fas fa-map-marker-alt' };
    const color = cfg.color;
    return L.divIcon({
        className: '',
        iconSize:  [28, 28],
        iconAnchor:[14, 14],
        popupAnchor:[0, -14],
        html: `
            <div style="
                width:28px; height:28px;
                background:${color};
                border-radius:50%;
                border:2px solid rgba(255,255,255,.8);
                box-shadow:0 2px 8px rgba(0,0,0,.5), 0 0 0 4px ${color}33;
                display:flex; align-items:center; justify-content:center;
                transition:transform .15s;
            ">
                <i class="${cfg.icon}" style="font-size:12px; color:#fff;"></i>
            </div>`
    });
}

// =====================================================
// RENDER GEOMETRIES ON MAP
// =====================================================
function renderLayerGeometries(data) {
    markerLayer.clearLayers();
    data.forEach((row, i) => {
        if (!row.geometry) return;
        try {
            let layer;
            if (row.geom_type === 'ST_Point' || row.geometry.type === 'Point') {
                layer = L.marker([parseFloat(row.latitude), parseFloat(row.longitude)], {
                    icon: createMarkerIcon(row.jenis || 'default')
                });
            } else {
                layer = L.geoJSON(row.geometry, {
                    style: {
                        color: '#0ea5e9',
                        weight: 2,
                        fillColor: '#0ea5e9',
                        fillOpacity: 0.15
                    }
                });
            }
            
            let popupContent = `<div class="popup-title"><b>Detail Data</b></div>`;
            for (const [key, val] of Object.entries(row)) {
                if (!['id', 'geometry', 'geom_type', 'latitude', 'longitude', 'kecamatan_id'].includes(key)) {
                    popupContent += `<div class="popup-row"><strong>${capitalize(key)}</strong><span>${val !== null ? val : '-'}</span></div>`;
                }
            }
            layer.bindPopup(popupContent, { maxWidth: 280 });
            markerLayer.addLayer(layer);
            row._leaflet_layer = layer; 
        } catch(e) {
            console.error('Error drawing geometry:', e);
        }
    });
}

// =====================================================
// RENDER TABLE DYNAMICALLY
// =====================================================
function renderDynamicTable(data) {
    const thead = document.getElementById('table-thead');
    const tbody = document.getElementById('table-body');
    const pagEl = document.getElementById('table-pagination');
    
    if (!thead || !tbody) return;

    const totalCount = data.length;
    if (!totalCount) {
        tbody.innerHTML = `<tr><td colspan="100"><div class="empty-state"><i class="fas fa-search"></i><h4>Tidak ada data</h4><p>Tabel kosong atau filter tidak cocok</p></div></td></tr>`;
        if (pagEl) pagEl.style.display = 'none';
        return;
    }
    
    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = Math.min(startIdx + pageSize, totalCount);
    const paginatedData = data.slice(startIdx, endIdx);

    const displayCols = activeColumns.filter(c => !['id', 'geometry', 'geom_type', 'latitude', 'longitude', 'kecamatan_id'].includes(c));
    
    thead.innerHTML = `
        <tr>
            <th>#</th>
            ${displayCols.map(col => `<th>${capitalize(col)}</th>`).join('')}
            <th style="text-align:center; width: 100px;">Aksi</th>
        </tr>
    `;
    
    tbody.innerHTML = paginatedData.map((row, i) => {
        const globalIndex = startIdx + i;
        const rowNumber = globalIndex + 1;
        const actionBtn = `
            <div style="display:flex; justify-content:center;">
                <button class="btn btn-outline btn-sm" onclick="focusGeometry(${globalIndex}); event.stopPropagation();" title="Lihat di Peta" style="display: inline-flex; align-items: center; gap: 0.35rem; height: 26px; padding: 0.2rem 0.5rem; border-radius: var(--radius-sm); border-color: var(--border-color); cursor: pointer;">
                    <i class="fas fa-eye" style="color: var(--text-secondary); font-size: 0.72rem;"></i>
                    <span style="font-size: 0.72rem; font-weight: 500; color: var(--text-primary);">Lihat</span>
                </button>
            </div>
        `;
        return `
            <tr onclick="focusGeometry(${globalIndex})" style="cursor:pointer;">
                <td style="color:var(--text-muted); width:36px;">${rowNumber}</td>
                ${displayCols.map(col => `<td>${row[col] !== null ? row[col] : '-'}</td>`).join('')}
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
    renderDynamicTable(activeData);
}

// =====================================================
// ZOOM & HIGHLIGHT GEOMETRY
// =====================================================
function focusGeometry(index) {
    const row = activeData[index];
    if (!row || !row.geometry) return;
    
    highlightLayer.clearLayers();
    
    if (row.geom_type === 'ST_Point' || row.geometry.type === 'Point') {
        let lat = parseFloat(row.latitude);
        let lng = parseFloat(row.longitude);
        if (isNaN(lat) || isNaN(lng)) {
            if (row.geometry.coordinates) {
                lng = parseFloat(row.geometry.coordinates[0]);
                lat = parseFloat(row.geometry.coordinates[1]);
            }
        }
        if (!isNaN(lat) && !isNaN(lng)) {
            map.setView([lat, lng], 16, { animate: true });
        }
    } else {
        const highlight = L.geoJSON(row.geometry, {
            style: {
                color: '#f43f5e',
                weight: 3,
                fillOpacity: 0
            }
        }).addTo(highlightLayer);
        map.fitBounds(highlight.getBounds(), { maxZoom: 16, animate: true });
    }
    
    if (row._leaflet_layer) {
        row._leaflet_layer.openPopup();
    }
}
