// =====================================================
// DYNAMIC OVERLAYS MANAGEMENT (FITUR 1)
// =====================================================
let activeOverlays = {};
const OVERLAY_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444', '#14b8a6'];
let colorIndex = 0;
let overlayLayerVisible = false;

function getOverlayColor() {
    const c = OVERLAY_COLORS[colorIndex % OVERLAY_COLORS.length];
    colorIndex++;
    return c;
}

function populateOverlayDropdown() {
    const options = [];
    tablesList.forEach(t => {
        if (['custom_polygons', 'custom_polylines', 'custom_markers', 'custom_drawings', 'markers'].includes(t.table_name)) return;
        if (!activeOverlays[t.table_name]) {
            options.push({
                value: t.table_name,
                label: `${capitalize(t.table_name)} (${t.type})`
            });
        }
    });

    populateCombobox('combo-overlay', options, (val) => {
        const hiddenEl = document.getElementById('overlay-table-select');
        if (hiddenEl) hiddenEl.value = val;
    });

    if (options.length === 0) {
        const emptyEl = document.getElementById('combo-overlay-empty');
        if (emptyEl) {
            emptyEl.textContent = 'Semua lapisan sudah ditambahkan';
            emptyEl.style.display = 'block';
        }
    }
}

async function addOverlay() {
    const hiddenEl = document.getElementById('overlay-table-select');
    if (!hiddenEl) return;
    const table = hiddenEl.value;

    if (!table) {
        toast('Pilih lapisan data terlebih dahulu!', 'warn');
        return;
    }

    const loadingEl = document.getElementById('map-loading');
    if (loadingEl) loadingEl.classList.add('show');

    try {
        const res = await fetch(`api/get_layer_data.php?table=${table}`);
        const json = await res.json();

        if (json.status === 'success') {
            const data = json.data;
            const columns = json.columns;
            const color = getOverlayColor();

            const group = L.layerGroup();

            data.forEach(row => {
                if (!row.geometry) return;
                let layer;
                if (row.geom_type === 'ST_Point' || row.geometry.type === 'Point') {
                    layer = L.marker([parseFloat(row.latitude), parseFloat(row.longitude)], {
                        icon: L.divIcon({
                            className: '',
                            iconSize:  [18, 18],
                            iconAnchor:[9, 9],
                            popupAnchor:[0, -9],
                            html: `
                                <div style="
                                    width:18px; height:18px;
                                    background:${color};
                                    border-radius:50%;
                                    border:2.5px solid #fff;
                                    box-shadow:0 1px 4px rgba(0,0,0,0.3);
                                "></div>`
                        })
                    });
                } else {
                    layer = L.geoJSON(row.geometry, {
                        pointToLayer: function(feature, latlng) {
                            return L.marker(latlng, {
                                icon: L.divIcon({
                                    className: '',
                                    iconSize:  [18, 18],
                                    iconAnchor:[9, 9],
                                    popupAnchor:[0, -9],
                                    html: `
                                        <div style="
                                            width:18px; height:18px;
                                            background:${color};
                                            border-radius:50%;
                                            border:2.5px solid #fff;
                                            box-shadow:0 1px 4px rgba(0,0,0,0.3);
                                        "></div>`
                                })
                            });
                        },
                        style: {
                            color: color,
                            weight: 2.5,
                            fillColor: color,
                            fillOpacity: 0.15
                        }
                    });
                }

                let popupContent = `<div class="popup-title"><b>Detail Overlay (${capitalize(table)})</b></div>`;
                for (const [key, val] of Object.entries(row)) {
                    if (!['id', 'geometry', 'geom_type', 'latitude', 'longitude', 'kecamatan_id'].includes(key)) {
                        popupContent += `<div class="popup-row"><strong>${capitalize(key)}</strong><span>${val !== null ? val : '-'}</span></div>`;
                    }
                }
                layer.bindPopup(popupContent, { maxWidth: 280 });
                group.addLayer(layer);
            });

            if (overlayLayerVisible) {
                group.addTo(overlayLayer);
            }

            activeOverlays[table] = {
                layer: group,
                color: color,
                data: data,
                columns: columns
            };

            // Show data in results panel
            activeData = data;
            activeColumns = columns;
            currentPage = 1;
            const titleEl = document.getElementById('results-title');
            if (titleEl) titleEl.innerHTML = `<i class="fas fa-layer-group"></i> Lapisan ${capitalize(table)}`;
            const countEl = document.getElementById('result-count');
            if (countEl) countEl.textContent = `${activeData.length} data`;

            if (typeof setupFeatureFilters === 'function') setupFeatureFilters(null);
            if (typeof renderDynamicTable === 'function') renderDynamicTable(activeData);

            toast(`Lapisan ${capitalize(table)} berhasil ditambahkan`, 'success');

            renderOverlayActiveList();
            clearCombobox('combo-overlay');
            // refresh dropdown without the new overlay
            populateOverlayDropdown();
        } else {
            toast('Gagal memuat overlay: ' + json.message, 'error');
        }
    } catch (e) {
        console.error(e);
        toast('Gagal memuat overlay', 'error');
    } finally {
        if (loadingEl) loadingEl.classList.remove('show');
    }
}

function removeOverlay(table) {
    if (activeOverlays[table]) {
        overlayLayer.removeLayer(activeOverlays[table].layer);
        delete activeOverlays[table];
        toast(`Lapisan ${capitalize(table)} dihapus`, 'info');

        const titleEl = document.getElementById('results-title');
        if (titleEl && titleEl.textContent.includes(capitalize(table))) {
            activeData = [];
            activeColumns = [];
            if (typeof setupFeatureFilters === 'function') setupFeatureFilters(null);
            if (typeof renderDynamicTable === 'function') renderDynamicTable([]);
        }

        renderOverlayActiveList();
        populateOverlayDropdown();
    }
}

function focusOverlay(table) {
    const overlay = activeOverlays[table];
    if (!overlay) return;

    const tempGroup = L.featureGroup();
    overlay.layer.eachLayer(l => tempGroup.addLayer(l));

    if (tempGroup.getLayers().length > 0) {
        map.fitBounds(tempGroup.getBounds(), { maxZoom: 16, animate: true });
    } else {
        toast('Lapisan tidak memiliki geometri', 'warn');
    }

    activeData = overlay.data;
    activeColumns = overlay.columns;
    currentPage = 1;
    const titleEl = document.getElementById('results-title');
    if (titleEl) titleEl.innerHTML = `<i class="fas fa-layer-group"></i> Lapisan ${capitalize(table)}`;
    const countEl = document.getElementById('result-count');
    if (countEl) countEl.textContent = `${activeData.length} data`;

    if (typeof setupFeatureFilters === 'function') setupFeatureFilters(null);
    if (typeof renderDynamicTable === 'function') renderDynamicTable(activeData);
}

function toggleOverlayVisibility(table, isVisible) {
    const overlay = activeOverlays[table];
    if (!overlay) return;
    if (isVisible) {
        overlayLayer.addLayer(overlay.layer);
    } else {
        overlayLayer.removeLayer(overlay.layer);
    }
}

function renderOverlayActiveList() {
    const listEl = document.getElementById('overlay-active-list');
    const sectionEl = document.getElementById('overlay-active-section');
    if (!listEl) return;

    listEl.innerHTML = '';
    const tables = Object.keys(activeOverlays);

    if (sectionEl) {
        sectionEl.style.display = tables.length > 0 ? 'block' : 'none';
    }

    if (tables.length === 0) return;

    tables.forEach(table => {
        const item = activeOverlays[table];
        const isVisible = overlayLayer.hasLayer(item.layer);
        const switchId = `overlay-switch-${table}`;
        const li = document.createElement('li');
        li.className = 'element-item';
        li.innerHTML = `
            <span class="element-name" title="${capitalize(table)}">
                <i class="fas fa-layer-group" style="color:${item.color};"></i> ${capitalize(table)}
            </span>
            <div class="element-actions" style="display: flex; align-items: center; gap: 0.35rem;">
                <label class="switch-control" title="Tampilkan/Sembunyikan" style="margin-right: 0.2rem;">
                    <input type="checkbox" id="${switchId}" ${isVisible ? 'checked' : ''} onchange="toggleOverlayVisibility('${table}', this.checked)">
                    <span class="switch-slider"></span>
                </label>
                <button class="btn btn-ghost btn-sm" onclick="focusOverlay('${table}')" style="padding: 2px 6px;" title="Fokus">
                    <i class="fas fa-crosshairs" style="font-size:0.75rem;"></i>
                </button>
                <button class="btn btn-ghost btn-sm" onclick="removeOverlay('${table}')" style="padding: 2px 6px;" title="Hapus">
                    <i class="fas fa-trash" style="color:var(--danger); font-size:0.75rem;"></i>
                </button>
            </div>
        `;
        listEl.appendChild(li);
    });
}

// Called when overlay feature switch is toggled
function setOverlayLayerVisible(isOn) {
    overlayLayerVisible = isOn;
    if (isOn) {
        // Re-add all active overlay layers back to map
        Object.values(activeOverlays).forEach(item => {
            if (!overlayLayer.hasLayer(item.layer)) {
                item.layer.addTo(overlayLayer);
            }
        });
    } else {
        // Remove all overlay layers from map
        overlayLayer.clearLayers();
    }
}
