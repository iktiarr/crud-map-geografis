// =====================================================
// CANVAS.JS — Drawing + Spatial Analysis (FITUR 3 — Combined)
// =====================================================

// ---- Drawing State ----
const drawItems = L.featureGroup().addTo(map);
const analysisPointsLayer = L.layerGroup().addTo(map);
let drawHandler = null;
let currentDrawingType = null;

// ---- Feature Layer Flag ----
window.canvasLayerVisible = false;

// =====================================================
// COLOR PICKER
// =====================================================
function setDrawingColor(hex, element) {
    currentDrawingColor = hex;
    document.querySelectorAll('#drawing-color-picker .color-dot').forEach(dot => {
        dot.classList.remove('active');
    });
    if (element) {
        element.classList.add('active');
    }
}

// =====================================================
// COMBOBOX ENGINE (Generic - used by overlays, preview, canvas)
// =====================================================
function toggleCombobox(wrapId) {
    const wrap = document.getElementById(wrapId);
    if (!wrap) return;

    // Close all other open comboboxes first
    document.querySelectorAll('.combobox-wrap.open').forEach(el => {
        if (el.id !== wrapId) el.classList.remove('open');
    });

    const isOpen = wrap.classList.contains('open');
    wrap.classList.toggle('open');

    // Position the dropdown using fixed coords to escape overflow:hidden containers
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

// Close on outside click
document.addEventListener('click', function(e) {
    if (!e.target.closest('.combobox-wrap')) {
        closeAllComboboxes();
    }
});

// Set combobox value programmatically
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

    // Mark selected in dropdown
    wrap.querySelectorAll('.combobox-option').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.value === String(value));
    });
    wrap.classList.remove('open');
}

// Clear combobox
function clearCombobox(wrapId) {
    setComboboxValue(wrapId, '', '');
    const wrap = document.getElementById(wrapId);
    if (wrap) {
        wrap.querySelectorAll('.combobox-option').forEach(o => o.classList.remove('selected'));
    }
}

// Populate combobox with options
function populateCombobox(wrapId, options, onSelect) {
    const wrap = document.getElementById(wrapId);
    if (!wrap) return;

    const dropdown = wrap.querySelector('.combobox-dropdown');
    const emptyEl  = wrap.querySelector('[id$="-empty"]');

    if (!dropdown) return;

    // Remove old options (keep empty placeholder)
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

// =====================================================
// DRAWINGS — Load, Render, Save, Delete
// =====================================================
async function loadDrawings() {
    try {
        const res = await fetch('api/get_drawings.php');
        const json = await res.json();

        if (json.status === 'success') {
            savedDrawingsData = json.data;
            renderDrawingsTable(savedDrawingsData);

            if (window.canvasLayerVisible) {
                drawingsLayer.clearLayers();
                savedDrawingsData.forEach(d => renderDrawingOnMap(d));
            }
        }
    } catch(err) {
        console.error(err);
        toast('Gagal memuat gambar kustom', 'error');
    }
}

function renderDrawingOnMap(d) {
    const geom = typeof d.geojson === 'string' ? JSON.parse(d.geojson) : d.geojson;
    if (!geom) return;

    const color = d.warna || '#ef4444';
    let layer;

    if (geom.type === 'Point') {
        layer = L.marker([geom.coordinates[1], geom.coordinates[0]], {
            icon: L.divIcon({
                className: '',
                iconSize: [22, 22],
                iconAnchor: [11, 11],
                html: `<div style="
                    width: 22px; height: 22px;
                    background: ${color};
                    border-radius: 50%;
                    border: 2.5px solid #ffffff;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.35);
                "></div>`
            })
        });
    } else {
        layer = L.geoJSON(geom, {
            style: {
                color: color,
                weight: 3,
                fillColor: color,
                fillOpacity: 0.15
            }
        });
        layer.bindTooltip(d.nama, { permanent: true, direction: 'center', className: 'polygon-tooltip' });
    }

    layer.bindPopup(`
        <div style="font-size: 0.78rem;">
            <strong style="color: var(--text-primary); font-size: 0.82rem; display: block; margin-bottom: 0.25rem;">${d.nama}</strong>
            <span style="color: var(--text-secondary);">${d.deskripsi || 'Tidak ada deskripsi.'}</span>
            <div style="margin-top: 0.5rem; display: flex; gap: 0.25rem;">
                <button class="btn btn-outline btn-sm" onclick="focusDrawing(${d.id})" style="padding: 2px 6px; font-size: 10px;">Fokus</button>
                <button class="btn btn-ghost btn-sm" onclick="deleteDrawing(${d.id})" style="padding: 2px 6px; font-size: 10px; color: var(--danger);">Hapus</button>
            </div>
        </div>
    `);

    drawingsLayer.addLayer(layer);
    d._leaflet_layer = layer;
}

function renderDrawingsTable(data) {
    // Render into SIDEBAR list
    const listEl = document.getElementById('drawings-sidebar-list');
    const countEl = document.getElementById('drawings-count');

    if (countEl) countEl.textContent = `${data.length} gambar`;

    if (!listEl) return;

    if (data.length === 0) {
        listEl.innerHTML = `<div class="combobox-empty" style="text-align:left; padding:0.5rem 0; color:var(--text-muted); font-size:0.75rem;">
            <i class="fas fa-pencil-alt" style="margin-right:0.3rem;"></i> Belum ada gambar
        </div>`;
        return;
    }

    const iconMap = { polygon: 'fa-draw-polygon', polyline: 'fa-route', marker: 'fa-map-marker-alt' };

    listEl.innerHTML = data.map((item) => {
        const icon = iconMap[item.tipe] || 'fa-shapes';
        return `
        <div class="drawing-item" style="
            display: flex; align-items: center;
            gap: 0.5rem;
            padding: 0.4rem 0.5rem;
            border-radius: var(--radius-sm);
            background: var(--bg-elevated);
            border: 1px solid var(--border-color);
        ">
            <div style="width:10px; height:10px; border-radius:50%; background:${item.warna}; flex-shrink:0; border:1.5px solid rgba(0,0,0,0.15);"></div>
            <span style="flex:1; font-size:0.75rem; font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${item.nama}">
                <i class="fas ${icon}" style="color:${item.warna}; font-size:0.68rem; margin-right:0.2rem;"></i>${item.nama}
            </span>
            <span style="font-size:0.68rem; color:var(--text-muted); text-transform:capitalize; flex-shrink:0;">${item.tipe}</span>
            <div style="display:flex; gap:0.15rem; flex-shrink:0;">
                <button onclick="focusDrawing(${item.id})" title="Fokus" style="
                    background:none; border:none; cursor:pointer; padding:2px 4px; border-radius:3px;
                    color:var(--text-secondary); font-size:0.72rem;
                " onmouseover="this.style.background='var(--bg-surface)'" onmouseout="this.style.background='none'">
                    <i class="fas fa-crosshairs"></i>
                </button>
                <button onclick="deleteDrawing(${item.id})" title="Hapus" style="
                    background:none; border:none; cursor:pointer; padding:2px 4px; border-radius:3px;
                    color:var(--danger); font-size:0.72rem;
                " onmouseover="this.style.background='var(--bg-surface)'" onmouseout="this.style.background='none'">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>`;
    }).join('');
}

function focusDrawing(id) {
    const item = savedDrawingsData.find(x => x.id === id);
    if (!item) return;

    const geom = typeof item.geojson === 'string' ? JSON.parse(item.geojson) : item.geojson;
    const tempLayer = L.geoJSON(geom);

    if (geom.type === 'Point') {
        map.setView(tempLayer.getBounds().getCenter(), 16, { animate: true });
    } else {
        map.fitBounds(tempLayer.getBounds(), { maxZoom: 16, animate: true });
    }

    if (item._leaflet_layer) {
        item._leaflet_layer.openPopup();
    }
}

async function deleteDrawing(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus gambar ini dari database?')) return;
    try {
        const res = await fetch('api/delete_drawing.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        const json = await res.json();
        if (json.status === 'success') {
            toast('Gambar berhasil dihapus', 'success');
            await loadDrawings();
            populateSpatialAnalysisDropdowns();
        } else {
            toast(json.message, 'error');
        }
    } catch (err) {
        toast('Gagal menghapus gambar', 'error');
    }
}

// =====================================================
// DRAWING TOOLS (Leaflet Draw)
// =====================================================
function startDrawing(type) {
    if (drawHandler) {
        drawHandler.disable();
    }

    currentDrawingType = type;
    const instr = document.getElementById('draw-instruction');
    if (instr) {
        instr.style.display = 'block';
    }

    if (type === 'polygon') {
        if (instr) instr.textContent = 'Klik pada peta untuk mulai menggambar Polygon. Double-klik untuk menyelesaikan.';
        drawHandler = new L.Draw.Polygon(map, {
            shapeOptions: {
                color: currentDrawingColor,
                weight: 2,
                fillColor: currentDrawingColor,
                fillOpacity: 0.15
            }
        });
    } else if (type === 'polyline') {
        if (instr) instr.textContent = 'Klik pada peta untuk menggambar Garis (Polyline). Double-klik untuk menyelesaikan.';
        drawHandler = new L.Draw.Polyline(map, {
            shapeOptions: {
                color: currentDrawingColor,
                weight: 3
            }
        });
    } else if (type === 'marker') {
        if (instr) instr.textContent = 'Klik pada peta untuk meletakkan Marker.';
        drawHandler = new L.Draw.Marker(map, {
            icon: L.divIcon({
                className: '',
                iconSize: [22, 22],
                iconAnchor: [11, 11],
                html: `<div style="width:22px; height:22px; background:${currentDrawingColor}; border-radius:50%; border:2.5px solid #fff; box-shadow:0 1px 5px rgba(0,0,0,0.4);"></div>`
            })
        });
    }

    drawHandler.enable();
}

map.on(L.Draw.Event.CREATED, async function (e) {
    const layer = e.layer;
    const geojson = layer.toGeoJSON().geometry;
    const type = currentDrawingType || 'polygon';

    currentDrawingType = null;

    const instr = document.getElementById('draw-instruction');
    if (instr) instr.style.display = 'none';

    if (drawHandler) {
        drawHandler.disable();
        drawHandler = null;
    }

    let defaultName = '';
    if (type === 'polygon') defaultName = 'Polygon ' + (savedDrawingsData.filter(d => d.tipe === 'polygon').length + 1);
    else if (type === 'polyline') defaultName = 'Polyline ' + (savedDrawingsData.filter(d => d.tipe === 'polyline').length + 1);
    else defaultName = 'Marker ' + (savedDrawingsData.filter(d => d.tipe === 'marker').length + 1);

    const name = prompt(`Beri nama elemen ${type} baru ini:`, defaultName);
    if (!name) return;

    const colorAtTime = currentDrawingColor;

    try {
        const res = await fetch('api/save_drawing.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, name, color: colorAtTime, geojson, description: '' })
        });
        const json = await res.json();
        if (json.status === 'success') {
            toast('Gambar berhasil disimpan', 'success');
            await loadDrawings();
            populateSpatialAnalysisDropdowns();
        } else {
            toast(json.message, 'error');
        }
    } catch(err) {
        toast('Gagal menyimpan gambar', 'error');
    }
});

// =====================================================
// CUSTOM GEOMETRIES (legacy spatial support)
// =====================================================
async function loadCustomGeometries() {
    try {
        const res = await fetch('api/get_custom_geometries.php');
        const json = await res.json();
        if (json.status === 'success') {
            customElementsData = json.data;

            customElementsData.polygons.forEach((p, idx) => {
                p.color = DISTINCT_COLORS[idx % DISTINCT_COLORS.length];
            });
        }
    } catch (e) {
        console.error(e);
    }
}

// =====================================================
// SPATIAL ANALYSIS — Combobox & Sub-maps
// =====================================================
async function displayAnalysisPointsOnMainMap(tableName) {
    if (typeof analysisPointsLayer === 'undefined') return;
    analysisPointsLayer.clearLayers();
    if (!tableName) return;

    const loadingEl = document.getElementById('map-loading');
    if (loadingEl) loadingEl.classList.add('show');

    try {
        if (tableName === 'custom_drawings') {
            // Render custom markers from savedDrawingsData
            const markers = savedDrawingsData ? savedDrawingsData.filter(d => d.tipe === 'marker') : [];
            markers.forEach(d => {
                const geom = typeof d.geojson === 'string' ? JSON.parse(d.geojson) : d.geojson;
                if (geom && geom.type === 'Point') {
                    const color = d.warna || '#ef4444';
                    const marker = L.marker([geom.coordinates[1], geom.coordinates[0]], {
                        icon: L.divIcon({
                            className: '',
                            iconSize: [22, 22],
                            iconAnchor: [11, 11],
                            html: `<div style="
                                width: 22px; height: 22px;
                                background: ${color};
                                border-radius: 50%;
                                border: 2.5px solid #ffffff;
                                box-shadow: 0 2px 6px rgba(0,0,0,0.35);
                            "></div>`
                        })
                    }).bindPopup(`<strong>${d.nama}</strong><br>${d.deskripsi || 'Tidak ada deskripsi.'}`);
                    analysisPointsLayer.addLayer(marker);
                }
            });
            
            // Zoom to markers if any
            if (markers.length > 0) {
                const tempGroup = L.featureGroup(analysisPointsLayer.getLayers());
                map.fitBounds(tempGroup.getBounds(), { maxZoom: 15, padding: [30, 30], animate: true });
            }
        } else {
            // Fetch from database
            const res = await fetch(`api/get_layer_data.php?table=${tableName}`);
            const json = await res.json();
            if (json.status === 'success') {
                const data = json.data;
                data.forEach(row => {
                    if (!row.geometry) return;
                    const geom = row.geometry;
                    const isPoint = geom.type === 'Point' || row.geom_type === 'ST_Point';
                    const isMultiPoint = geom.type === 'MultiPoint' || row.geom_type === 'ST_MultiPoint';

                    if (isPoint || isMultiPoint) {
                        const coordsList = isPoint ? [geom.coordinates] : geom.coordinates;

                        coordsList.forEach(coords => {
                            // Create a premium marker
                            const marker = L.marker([coords[1], coords[0]], {
                                icon: L.divIcon({
                                    className: '',
                                    iconSize: [20, 20],
                                    iconAnchor: [10, 10],
                                    html: `<div style="
                                        width: 20px; height: 20px;
                                        background: #4f46e5;
                                        border-radius: 50%;
                                        border: 2px solid #ffffff;
                                        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                                    "></div>`
                                })
                            });
                            
                            let popupContent = `<div style="font-size: 0.78rem;">`;
                            popupContent += `<strong style="color: var(--text-primary); font-size: 0.82rem; display: block; margin-bottom: 0.25rem;">${row.nama || 'Titik'}</strong>`;
                            let extraRows = '';
                            for (const [k, v] of Object.entries(row)) {
                                if (!['id', 'geometry', 'geom_type', 'latitude', 'longitude', 'kecamatan_id', 'geom', 'nama'].includes(k)) {
                                    extraRows += `<div style="margin-top: 0.15rem; font-size: 0.72rem;"><strong>${capitalize(k)}:</strong> <span>${v !== null ? v : '-'}</span></div>`;
                                }
                            }
                            if (extraRows) {
                                popupContent += `<hr style="margin: 0.35rem 0; border: 0; border-top: 1px solid var(--border-color);">${extraRows}`;
                            }
                            popupContent += `</div>`;
                            marker.bindPopup(popupContent, { maxWidth: 220 });
                            
                            analysisPointsLayer.addLayer(marker);
                        });
                    }
                });


                // Zoom to markers if any
                if (data.length > 0) {
                    const tempGroup = L.featureGroup(analysisPointsLayer.getLayers());
                    map.fitBounds(tempGroup.getBounds(), { maxZoom: 15, padding: [30, 30], animate: true });
                }
            } else {
                toast('Gagal memuat marker: ' + json.message, 'error');
            }
        }
    } catch (e) {
        console.error(e);
        toast('Gagal memuat data marker', 'error');
    } finally {
        if (loadingEl) loadingEl.classList.remove('show');
    }
}

function populateSpatialPointsDropdown() {
    const options = [
        { value: 'custom_drawings', label: 'Marker Kustom Pengguna' }
    ];

    if (typeof tablesList !== 'undefined' && Array.isArray(tablesList)) {
        tablesList.forEach(t => {
            // Skip known drawing/system tables
            if (['custom_polygons', 'custom_polylines', 'custom_markers', 'custom_drawings', 'kecamatan'].includes(t.table_name)) return;
            
            options.push({
                value: t.table_name,
                label: capitalize(t.table_name)
            });
        });
    }


    populateCombobox('combo-spatial-points', options, (val, label) => {
        const hiddenEl = document.getElementById('spatial-points-table');
        if (hiddenEl) hiddenEl.value = val;
        // Tampilkan marker terpilih di peta utama
        displayAnalysisPointsOnMainMap(val);
    });

    // Set default value
    setComboboxValue('combo-spatial-points', 'custom_drawings', 'Marker Kustom Pengguna');
    // Load default marker pada peta utama
    displayAnalysisPointsOnMainMap('custom_drawings');
}


function populateSpatialAnalysisDropdowns() {
    // Get from savedDrawingsData (only polygons)
    const polygons = savedDrawingsData ? savedDrawingsData.filter(d => d.tipe === 'polygon') : [];

    const poly_a_id = document.getElementById('spatial-poly-a-id') ? document.getElementById('spatial-poly-a-id').value : '';
    const poly_b_id = document.getElementById('spatial-poly-b-id') ? document.getElementById('spatial-poly-b-id').value : '';

    // Clear selection if selected polygon no longer exists (e.g. deleted)
    const activeAExists = polygons.some(p => String(p.id) === String(poly_a_id));
    const activeBExists = polygons.some(p => String(p.id) === String(poly_b_id));

    if (!activeAExists && poly_a_id) {
        clearCombobox('combo-spatial-a');
    }
    if (!activeBExists && poly_b_id) {
        clearCombobox('combo-spatial-b');
    }

    // Refresh selected values after possible clearing
    const current_a_id = document.getElementById('spatial-poly-a-id') ? document.getElementById('spatial-poly-a-id').value : '';
    const current_b_id = document.getElementById('spatial-poly-b-id') ? document.getElementById('spatial-poly-b-id').value : '';

    // Options for A: exclude chosen B
    const optsA = polygons
        .filter(p => String(p.id) !== String(current_b_id))
        .map(p => ({ value: p.id, label: p.nama }));

    // Options for B: exclude chosen A
    const optsB = polygons
        .filter(p => String(p.id) !== String(current_a_id))
        .map(p => ({ value: p.id, label: p.nama }));

    populateCombobox('combo-spatial-a', optsA, (val, label) => {
        // Restore hidden field
        const hA = document.getElementById('spatial-poly-a-id');
        if (hA) hA.value = val;
        // Refresh dropdowns to exclude this selected polygon from Wilayah B options
        populateSpatialAnalysisDropdowns();
    });

    populateCombobox('combo-spatial-b', optsB, (val, label) => {
        const hB = document.getElementById('spatial-poly-b-id');
        if (hB) hB.value = val;
        // Refresh dropdowns to exclude this selected polygon from Wilayah A options
        populateSpatialAnalysisDropdowns();
    });

    if (polygons.length === 0) {
        const eA = document.getElementById('combo-spatial-a-empty');
        const eB = document.getElementById('combo-spatial-b-empty');
        if (eA) { eA.textContent = 'Belum ada polygon — buat terlebih dahulu'; eA.style.display = 'block'; }
        if (eB) { eB.textContent = 'Belum ada polygon — buat terlebih dahulu'; eB.style.display = 'block'; }
    }

    // Populate point source dropdown only if not already populated
    const comboPointsDropdown = document.getElementById('combo-spatial-points-dropdown');
    if (comboPointsDropdown && !comboPointsDropdown.querySelector('.combobox-option')) {
        populateSpatialPointsDropdown();
    }
}



// Inisialisasi sub-maps
function initSubMaps() {
    const subMapIds = {
        wilayahA: 'sub-map-wilayah-a',
        wilayahB: 'sub-map-wilayah-b',
        union: 'sub-map-union',
        diffAB: 'sub-map-diff-ab',
        diffBA: 'sub-map-diff-ba',
        outside: 'sub-map-outside',
        intersect: 'sub-map-intersect'
    };

    for (const key in subMapIds) {
        if (subMaps[key]) continue;

        const container = document.getElementById(subMapIds[key]);
        if (!container) continue;

        subMaps[key] = L.map(subMapIds[key], {
            zoomControl: true,
            dragging: true,
            scrollWheelZoom: true,
            doubleClickZoom: true,
            boxZoom: true,
            touchZoom: true,
            keyboard: true
        }).setView([-6.9175, 107.6191], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(subMaps[key]);

        subMapLayers[key].addTo(subMaps[key]);
    }
}


function syncSubMapsView() {
    const center = map.getCenter();
    const zoom = map.getZoom();
    for (const key in subMaps) {
        if (subMaps[key]) {
            subMaps[key].invalidateSize({ debounce: false });
            subMaps[key].setView(center, zoom, { animate: false });
        }
    }
}

function clearAllSubMaps() {
    for (const key in subMapLayers) {
        if (subMapLayers[key]) {
            subMapLayers[key].clearLayers();
        }
    }
    const badges = ['badge-wilayah-a', 'badge-wilayah-b', 'badge-union', 'badge-diff-ab', 'badge-diff-ba', 'badge-outside', 'badge-intersect'];
    badges.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = '0 Titik';
    });
}

function drawReferenceOutlines(layerGroup, geojsonA, geojsonB) {
    const referenceStyle = {
        color: '#64748b',
        weight: 1.5,
        dashArray: '4, 4',
        fillOpacity: 0,
        interactive: false
    };
    if (geojsonA) L.geoJSON(geojsonA, { style: referenceStyle }).addTo(layerGroup);
    if (geojsonB) L.geoJSON(geojsonB, { style: referenceStyle }).addTo(layerGroup);
}

function getColoredMarkerIcon(bgColor) {
    return L.divIcon({
        className: '',
        html: `<div style="
            width: 18px; height: 18px;
            border-radius: 50%;
            background: ${bgColor};
            border: 2px solid #fff;
            box-shadow: 0 1px 4px rgba(0,0,0,0.3);
            display: flex; align-items: center; justify-content: center;
        ">
            <div style="width: 5px; height: 5px; border-radius: 50%; background: #fff;"></div>
        </div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
        popupAnchor: [0, -9]
    });
}

async function runSpatialAnalysis() {
    const poly_a_id = document.getElementById('spatial-poly-a-id') ? document.getElementById('spatial-poly-a-id').value : '';
    const poly_b_id = document.getElementById('spatial-poly-b-id') ? document.getElementById('spatial-poly-b-id').value : '';

    if (!poly_a_id || !poly_b_id) {
        toast('Pilih Wilayah A dan B terlebih dahulu!', 'warn');
        clearAllSubMaps();
        return;
    }

    if (poly_a_id === poly_b_id) {
        toast('Wilayah A dan B tidak boleh sama', 'warn');
        return;
    }

    const loadingEl = document.getElementById('map-loading');
    if (loadingEl) loadingEl.classList.add('show');

    // Get polygon geojson from savedDrawingsData
    const polyA = savedDrawingsData.find(p => String(p.id) === String(poly_a_id));
    const polyB = savedDrawingsData.find(p => String(p.id) === String(poly_b_id));

    const geojsonA = polyA ? (typeof polyA.geojson === 'string' ? JSON.parse(polyA.geojson) : polyA.geojson) : null;
    const geojsonB = polyB ? (typeof polyB.geojson === 'string' ? JSON.parse(polyB.geojson) : polyB.geojson) : null;

    // Show A and B on main map first
    analysisLayer.clearLayers();
    if (geojsonA) {
        L.geoJSON(geojsonA, { style: { color: '#3b82f6', weight: 2.5, fillColor: '#3b82f6', fillOpacity: 0.15 } })
         .bindPopup(`<strong>Wilayah A: ${polyA.nama}</strong>`)
         .bindTooltip(`Wilayah A: ${polyA.nama}`, { permanent: true, direction: 'center', className: 'polygon-tooltip' })
         .addTo(analysisLayer);
    }
    if (geojsonB) {
        L.geoJSON(geojsonB, { style: { color: '#ef4444', weight: 2.5, fillColor: '#ef4444', fillOpacity: 0.15 } })
         .bindPopup(`<strong>Wilayah B: ${polyB.nama}</strong>`)
         .bindTooltip(`Wilayah B: ${polyB.nama}`, { permanent: true, direction: 'center', className: 'polygon-tooltip' })
         .addTo(analysisLayer);
    }

    // Zoom to both on main map
    const tempGroup = L.featureGroup();
    if (geojsonA) L.geoJSON(geojsonA).addTo(tempGroup);
    if (geojsonB) L.geoJSON(geojsonB).addTo(tempGroup);
    if (tempGroup.getLayers().length > 0) {
        map.fitBounds(tempGroup.getBounds(), { maxZoom: 15, padding: [30, 30], animate: true });
    }

    // Show analysis section
    const analysisSection = document.getElementById('analysis-visual-section');
    if (analysisSection) analysisSection.style.display = 'block';

    if (typeof updateWorkspaceView === 'function') {
        updateWorkspaceView();
    }

    // Initialize sub-maps if needed
    initSubMaps();
    setTimeout(syncSubMapsView, 100);

    const configs = {
        wilayahA: { op: 'all', color: '#3b82f6', fillColor: '#3b82f6', badgeId: 'badge-wilayah-a', layer: subMapLayers.wilayahA },
        wilayahB: { op: 'all', color: '#ef4444', fillColor: '#ef4444', badgeId: 'badge-wilayah-b', layer: subMapLayers.wilayahB },
        union:    { op: 'all', color: '#a855f7', fillColor: '#a855f7', badgeId: 'badge-union',    layer: subMapLayers.union    },
        diffAB:   { op: 'all', color: '#2563eb', fillColor: '#2563eb', badgeId: 'badge-diff-ab',  layer: subMapLayers.diffAB  },
        diffBA:   { op: 'all', color: '#f97316', fillColor: '#f97316', badgeId: 'badge-diff-ba',  layer: subMapLayers.diffBA  },
        outside:  { op: 'all', color: '#06b6d4', fillColor: '#06b6d4', badgeId: 'badge-outside',  layer: subMapLayers.outside },
        intersect:{ op: 'all', color: '#f59e0b', fillColor: '#f59e0b', badgeId: 'badge-intersect', layer: subMapLayers.intersect }
    };

    // Bersihkan sub-maps
    for (const key in configs) {
        const cfg = configs[key];
        cfg.layer.clearLayers();
        if (key !== 'wilayahA' && key !== 'wilayahB') {
            drawReferenceOutlines(cfg.layer, geojsonA, geojsonB);
        }
    }

    const points_table = document.getElementById('spatial-points-table') ? document.getElementById('spatial-points-table').value : 'custom_drawings';

    try {
        const res = await fetch('api/run_analysis.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                poly_a_table: 'custom_drawings',
                poly_a_id: poly_a_id,
                poly_b_table: 'custom_drawings',
                poly_b_id: poly_b_id,
                point_table: points_table,
                operation: 'all'
            })
        });
        const json = await res.json();

        if (json.status === 'success' && json.results) {
            for (const key in configs) {
                const cfg = configs[key];
                const resData = json.results[key];
                if (!resData) continue;

                const badgeEl = document.getElementById(cfg.badgeId);

                // 1. Gambar Geometri
                if (resData.geometry) {
                    const geoLayer = L.geoJSON(resData.geometry, {
                        style: {
                            color: cfg.color,
                            weight: 2.5,
                            fillColor: cfg.fillColor,
                            fillOpacity: 0.35
                        }
                    });
                    geoLayer.addTo(cfg.layer);

                    // Khusus union, tampilkan juga di peta utama
                    if (key === 'union') {
                        const mainGeoLayer = L.geoJSON(resData.geometry, {
                            style: {
                                color: '#a855f7',
                                weight: 3,
                                fillColor: '#a855f7',
                                fillOpacity: 0.2,
                                dashArray: '6, 4'
                            }
                        });
                        mainGeoLayer.bindPopup('<strong>Gabungan A ∪ B</strong>');
                        mainGeoLayer.addTo(analysisLayer);
                    }
                }

                // 2. Gambar Titik/Markers
                let pointCount = 0;
                if (resData.data) {
                    resData.data.forEach(m => {
                        const geom = m.geometry;
                        if (!geom) return;
                        const isPoint = geom.type === 'Point';
                        const isMultiPoint = geom.type === 'MultiPoint';

                        if (isPoint || isMultiPoint) {
                            const coordsList = isPoint ? [geom.coordinates] : geom.coordinates;
                            pointCount += coordsList.length;

                            coordsList.forEach(coords => {
                                let popupContent = `<div style="font-size: 0.78rem;">`;
                                popupContent += `<strong style="color: var(--text-primary); font-size: 0.82rem; display: block; margin-bottom: 0.25rem;">${m.nama_marker || m.nama || 'Titik'}</strong>`;
                                
                                let extraRows = '';
                                for (const [k, v] of Object.entries(m)) {
                                    if (!['id', 'geometry', 'geom_type', 'latitude', 'longitude', 'kecamatan_id', 'geom', 'nama', 'nama_marker', 'tipe', 'warna', 'deskripsi', 'created_at'].includes(k)) {
                                        extraRows += `<div style="margin-top: 0.15rem; font-size: 0.72rem;"><strong>${capitalize(k)}:</strong> <span>${v !== null ? v : '-'}</span></div>`;
                                    }
                                }
                                if (extraRows) {
                                    popupContent += `<hr style="margin: 0.35rem 0; border: 0; border-top: 1px solid var(--border-color);">${extraRows}`;
                                }
                                popupContent += `</div>`;

                                L.marker([coords[1], coords[0]], { icon: getColoredMarkerIcon(cfg.color) })
                                 .bindPopup(popupContent, { maxWidth: 220 })
                                 .addTo(cfg.layer);
                            });
                        }
                    });
                }



                // 3. Update Badge
                if (badgeEl) {
                    badgeEl.innerText = pointCount + ' Titik';
                }
            }

            toast('Analisis spasial selesai — lihat hasil di peta dan himpunan di bawah', 'success');
            setTimeout(() => {
                syncSubMapsView();
                for (const key in subMaps) {
                    if (subMaps[key]) subMaps[key].invalidateSize();
                }
            }, 300);
        } else {
            toast('Gagal memproses analisis spasial: ' + (json.message || 'Respons tidak valid'), 'error');
        }
    } catch (e) {
        console.error('Gagal fetch analisis spasial:', e);
        toast('Gagal memproses analisis spasial', 'error');
    } finally {
        if (loadingEl) loadingEl.classList.remove('show');
    }
}
