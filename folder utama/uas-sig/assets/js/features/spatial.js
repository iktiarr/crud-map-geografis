// =====================================================
// SPATIAL SET ANALYSIS (FITUR 3 — PostGIS Himpunan)
// =====================================================
function populateSpatialAnalysisDropdowns() {
    const polyASel = document.getElementById('spatial-poly-a-id');
    const polyBSel = document.getElementById('spatial-poly-b-id');
    
    if (!polyASel || !polyBSel) return;
    
    const valA = polyASel.value;
    const valB = polyBSel.value;
    
    polyASel.innerHTML = '<option value="">-- Pilih Wilayah A --</option>';
    polyBSel.innerHTML = '<option value="">-- Pilih Wilayah B --</option>';
    
    if (customElementsData && customElementsData.polygons) {
        customElementsData.polygons.forEach(p => {
            polyASel.insertAdjacentHTML('beforeend', `<option value="${p.id}">${p.name}</option>`);
            polyBSel.insertAdjacentHTML('beforeend', `<option value="${p.id}">${p.name}</option>`);
        });
    }
    
    // Restore values if still valid
    if (customElementsData && customElementsData.polygons) {
        if (customElementsData.polygons.some(p => p.id == valA)) polyASel.value = valA;
        if (customElementsData.polygons.some(p => p.id == valB)) polyBSel.value = valB;
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
        if (subMaps[key]) continue; // Prevent double initialization
        
        const container = document.getElementById(subMapIds[key]);
        if (!container) continue;
        
        subMaps[key] = L.map(subMapIds[key], {
            zoomControl: false,
            dragging: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            boxZoom: false,
            touchZoom: false,
            keyboard: false
        }).setView([-6.9175, 107.6191], 13);

        const initTile = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        L.tileLayer(initTile, {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(subMaps[key]);

        // Add corresponding layer group
        subMapLayers[key].addTo(subMaps[key]);
    }
}

// Sinkronkan koordinat dan zoom level sub-maps dengan peta utama
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

// Membersihkan seluruh layer dan badge angka pada sub-maps
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

// Menggambar outline referensi Wilayah A dan B
function drawReferenceOutlines(layerGroup, geojsonA, geojsonB) {
    const referenceStyle = {
        color: '#64748b',
        weight: 1.5,
        dashArray: '4, 4',
        fillOpacity: 0,
        interactive: false
    };

    if (geojsonA) {
        L.geoJSON(geojsonA, { style: referenceStyle }).addTo(layerGroup);
    }
    if (geojsonB) {
        L.geoJSON(geojsonB, { style: referenceStyle }).addTo(layerGroup);
    }
}

// Mengubah warna marker khusus untuk sub-maps
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
    const poly_a_id = document.getElementById('spatial-poly-a-id').value;
    const poly_b_id = document.getElementById('spatial-poly-b-id').value;
    
    if (!poly_a_id || !poly_b_id) {
        clearAllSubMaps();
        return;
    }
    
    const loadingEl = document.getElementById('map-loading');
    if (loadingEl) loadingEl.classList.add('show');
    
    const polyA = customElementsData.polygons.find(p => p.id == poly_a_id);
    const polyB = customElementsData.polygons.find(p => p.id == poly_b_id);
    
    const geojsonA = polyA ? (typeof polyA.geojson === 'string' ? JSON.parse(polyA.geojson) : polyA.geojson) : null;
    const geojsonB = polyB ? (typeof polyB.geojson === 'string' ? JSON.parse(polyB.geojson) : polyB.geojson) : null;

    // Zoom peta utama agar memuat kedua geometri
    const tempGroup = L.featureGroup();
    if (geojsonA) L.geoJSON(geojsonA).addTo(tempGroup);
    if (geojsonB) L.geoJSON(geojsonB).addTo(tempGroup);
    if (tempGroup.getLayers().length > 0) {
        map.fitBounds(tempGroup.getBounds(), { maxZoom: 15, animate: true });
    }

    // Config 7 sub-maps
    const configs = {
        wilayahA: {
            op: 'union',
            idA: poly_a_id,
            idB: poly_a_id,
            color: '#3b82f6',
            fillColor: '#93c5fd',
            badgeId: 'badge-wilayah-a',
            layer: subMapLayers.wilayahA,
            label: 'Wilayah A'
        },
        wilayahB: {
            op: 'union',
            idA: poly_b_id,
            idB: poly_b_id,
            color: '#ef4444',
            fillColor: '#fca5a5',
            badgeId: 'badge-wilayah-b',
            layer: subMapLayers.wilayahB,
            label: 'Wilayah B'
        },
        union: {
            op: 'union',
            idA: poly_a_id,
            idB: poly_b_id,
            color: '#a855f7',
            fillColor: '#c084fc',
            badgeId: 'badge-union',
            layer: subMapLayers.union,
            label: 'Union (A dan B)'
        },
        diffAB: {
            op: 'diff_ab',
            idA: poly_a_id,
            idB: poly_b_id,
            color: '#2563eb',
            fillColor: '#93c5fd',
            badgeId: 'badge-diff-ab',
            layer: subMapLayers.diffAB,
            label: 'Selisih A - B'
        },
        diffBA: {
            op: 'diff_ba',
            idA: poly_a_id,
            idB: poly_b_id,
            color: '#f97316',
            fillColor: '#fed7aa',
            badgeId: 'badge-diff-ba',
            layer: subMapLayers.diffBA,
            label: 'Selisih B - A'
        },
        outside: {
            op: 'outside',
            idA: poly_a_id,
            idB: poly_b_id,
            color: '#06b6d4',
            fillColor: '#67e8f9',
            badgeId: 'badge-outside',
            layer: subMapLayers.outside,
            label: 'Luar Wilayah'
        },
        intersect: {
            op: 'intersection',
            idA: poly_a_id,
            idB: poly_b_id,
            color: '#64748b',
            fillColor: '#cbd5e1',
            badgeId: 'badge-intersect',
            layer: subMapLayers.intersect,
            label: 'Irisan A dan B'
        }
    };

    // Run concurrently
    const promises = Object.keys(configs).map(async (key) => {
        const cfg = configs[key];
        cfg.layer.clearLayers();
        drawReferenceOutlines(cfg.layer, geojsonA, geojsonB);

        try {
            const res = await fetch('api/run_analysis.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    poly_a_table: 'custom_polygons',
                    poly_a_id: cfg.idA,
                    poly_b_table: 'custom_polygons',
                    poly_b_id: cfg.idB,
                    point_table: 'custom_markers',
                    operation: cfg.op
                })
            });
            const json = await res.json();
            
            if (json.status === 'success') {
                const count = json.data ? json.data.length : 0;
                const badgeEl = document.getElementById(cfg.badgeId);
                if (badgeEl) badgeEl.innerText = count + ' Titik';
                
                if (json.geometry) {
                    L.geoJSON(json.geometry, {
                        style: {
                            color: cfg.color,
                            weight: 2.5,
                            fillColor: cfg.fillColor,
                            fillOpacity: 0.35
                        }
                    }).addTo(cfg.layer);
                }
                
                if (json.data) {
                    json.data.forEach(m => {
                        const geom = m.geometry;
                        if (geom && geom.type === 'Point') {
                            const coords = geom.coordinates;
                            L.marker([coords[1], coords[0]], { icon: getColoredMarkerIcon(cfg.color) })
                             .bindPopup(`<strong>${m.nama_marker}</strong>`)
                             .addTo(cfg.layer);
                        }
                    });
                }
            }
        } catch (e) {
            console.error(`Gagal fetch ${key}:`, e);
        }
    });

    try {
        await Promise.all(promises);
        toast('Analisis spasial selesai untuk seluruh sub-maps', 'success');
    } catch(err) {
        toast('Gagal memproses beberapa analisis spasial', 'error');
    } finally {
        if (loadingEl) loadingEl.classList.remove('show');
        syncSubMapsView();
    }
}
