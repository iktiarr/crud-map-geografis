// =====================================================
// FEATURE 4: DRAWING CUSTOM GEOMETRIES (FITUR 4 — Drawing Canvas)
// =====================================================
const drawItems = L.featureGroup().addTo(map);
let drawHandler = null;
let currentDrawingType = null;

function setDrawingColor(hex, element) {
    currentDrawingColor = hex;
    
    // Update active UI dot
    document.querySelectorAll('#drawing-color-picker .color-dot').forEach(dot => {
        dot.classList.remove('active');
    });
    if (element) {
        element.classList.add('active');
    }
}

// =====================================================
// FEATURE 4: MANAGE SAVED DRAWINGS (custom_drawings table)
// =====================================================
async function loadDrawings() {
    try {
        const res = await fetch('api/get_drawings.php');
        const json = await res.json();
        
        if (json.status === 'success') {
            savedDrawingsData = json.data;
            renderDrawingsList(savedDrawingsData);
            
            drawingsLayer.clearLayers();
            
            savedDrawingsData.forEach(d => {
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
            });
        }
    } catch(err) {
        console.error(err);
        toast('Gagal memuat gambar kustom', 'error');
    }
}

function renderDrawingsList(data) {
    const listEl = document.getElementById('drawings-list');
    if (!listEl) return;
    listEl.innerHTML = '';
    
    if (data.length === 0) {
        listEl.innerHTML = `<li class="element-item" style="color:var(--text-muted); justify-content:center;">Belum ada gambar tersimpan</li>`;
        return;
    }
    
    data.forEach(item => {
        let icon = 'fa-map-marker-alt';
        if (item.tipe === 'polygon') icon = 'fa-draw-polygon';
        else if (item.tipe === 'polyline') icon = 'fa-route';
        
        const li = document.createElement('li');
        li.className = 'element-item';
        li.innerHTML = `
            <span class="element-name" title="${item.nama}">
                <i class="fas ${icon}" style="color:${item.warna};"></i> ${item.nama}
            </span>
            <div class="element-actions">
                <button class="btn btn-ghost btn-sm" onclick="focusDrawing(${item.id})" style="padding: 2px 6px;" title="Lihat">
                    <i class="fas fa-crosshairs" style="font-size:0.75rem;"></i>
                </button>
                <button class="btn btn-ghost btn-sm" onclick="deleteDrawing(${item.id})" style="padding: 2px 6px;" title="Hapus">
                    <i class="fas fa-trash" style="color:var(--danger); font-size:0.75rem;"></i>
                </button>
            </div>
        `;
        listEl.appendChild(li);
    });
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
            toast('Gambar kustom berhasil dihapus', 'success');
            await loadDrawings();
        } else {
            toast(json.message, 'error');
        }
    } catch (err) {
        toast('Gagal menghapus gambar', 'error');
    }
}

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
    if (type === 'polygon') defaultName = 'Gambar Polygon ' + (savedDrawingsData.filter(d => d.tipe === 'polygon').length + 1);
    else if (type === 'polyline') defaultName = 'Gambar Polyline ' + (savedDrawingsData.filter(d => d.tipe === 'polyline').length + 1);
    else defaultName = 'Gambar Marker ' + (savedDrawingsData.filter(d => d.tipe === 'marker').length + 1);
    
    const name = prompt(`Beri nama elemen ${type} baru ini:`, defaultName);
    if (!name) return;
    
    let description = '';
    
    try {
        const res = await fetch('api/save_drawing.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, name, color: currentDrawingColor, geojson, description })
        });
        const json = await res.json();
        if (json.status === 'success') {
            toast('Gambar kustom berhasil disimpan', 'success');
            await loadDrawings();
        } else {
            toast(json.message, 'error');
        }
    } catch(err) {
        toast('Gagal menyimpan gambar', 'error');
    }
});

async function loadCustomGeometries() {
    try {
        const res = await fetch('api/get_custom_geometries.php');
        const json = await res.json();
        if (json.status === 'success') {
            customElementsData = json.data; // Store globally
            
            // Assign distinct color to each polygon based on its index
            customElementsData.polygons.forEach((p, idx) => {
                p.color = DISTINCT_COLORS[idx % DISTINCT_COLORS.length];
            });

            renderCustomElementsList(customElementsData);
            
            drawItems.clearLayers();
            
            customElementsData.polygons.forEach(p => {
                const geom = typeof p.geojson === 'string' ? JSON.parse(p.geojson) : p.geojson;
                const layer = L.geoJSON(geom, {
                    style: {
                        color: p.color,
                        weight: 2,
                        fillColor: p.color,
                        fillOpacity: 0.15
                    }
                }).addTo(drawItems);
                layer.bindTooltip(p.name, { permanent: true, direction: 'center', className: 'polygon-tooltip' });
            });

            customElementsData.polylines.forEach(l => {
                const geom = typeof l.geojson === 'string' ? JSON.parse(l.geojson) : l.geojson;
                const layer = L.geoJSON(geom, {
                    style: {
                        color: '#10b981',
                        weight: 3
                    }
                }).addTo(drawItems);
                layer.bindTooltip(l.name, { permanent: true, direction: 'center', className: 'polygon-tooltip' });
            });

            customElementsData.markers.forEach(m => {
                const geom = typeof m.geojson === 'string' ? JSON.parse(m.geojson) : m.geojson;
                const layer = L.geoJSON(geom, {
                    pointToLayer: function(geoJsonPoint, latlng) {
                        return L.marker(latlng, {
                            icon: L.divIcon({
                                className: '',
                                iconSize:  [20, 20],
                                iconAnchor:[10, 10],
                                html: `<div style="
                                    width:20px; height:20px;
                                    background:#ef4444;
                                    border-radius:50%;
                                    border:2px solid #fff;
                                    box-shadow:0 1px 4px rgba(0,0,0,0.4);
                                "></div>`
                            })
                        });
                    }
                }).addTo(drawItems);
                layer.bindPopup(`<b>${m.name}</b>`);
            });
        }
    } catch (e) {
        console.error(e);
        toast('Gagal memuat elemen kustom', 'error');
    }
}

function renderCustomElementsList(data) {
    const listEl = document.getElementById('custom-elements-list');
    if (!listEl) return;
    listEl.innerHTML = '';
    
    let items = [];
    data.polygons.forEach(p => items.push({ id: p.id, name: p.name, type: 'polygon', icon: 'fa-draw-polygon', color: p.color }));
    data.polylines.forEach(l => items.push({ id: l.id, name: l.name, type: 'polyline', icon: 'fa-route', color: '#10b981' }));
    data.markers.forEach(m => items.push({ id: m.id, name: m.name, type: 'marker', icon: 'fa-map-marker-alt', color: '#ef4444' }));
    
    if (items.length === 0) {
        listEl.innerHTML = `<li class="element-item" style="color:var(--text-muted); justify-content:center;">Belum ada elemen kustom</li>`;
        return;
    }
    
    items.forEach(item => {
        const li = document.createElement('li');
        li.className = 'element-item';
        li.innerHTML = `
            <span class="element-name" title="${item.name}">
                <i class="fas ${item.icon}" style="color:${item.color};"></i> ${item.name}
            </span>
            <div class="element-actions">
                <button class="btn btn-ghost btn-sm" onclick="focusCustomElementById(${item.id}, '${item.type}')" style="padding: 2px 6px;" title="Lihat">
                    <i class="fas fa-eye" style="font-size:0.75rem;"></i>
                </button>
                <button class="btn btn-ghost btn-sm" onclick="deleteCustomElement(${item.id}, '${item.type}')" style="padding: 2px 6px;" title="Hapus">
                    <i class="fas fa-trash" style="color:var(--danger); font-size:0.75rem;"></i>
                </button>
            </div>
        `;
        listEl.appendChild(li);
    });
}

function focusCustomElementById(id, type) {
    let list = [];
    if (type === 'polygon') list = customElementsData.polygons;
    else if (type === 'polyline') list = customElementsData.polylines;
    else if (type === 'marker') list = customElementsData.markers;
    
    const item = list.find(x => x.id === id);
    if (!item || !item.geojson) return;
    
    const geom = typeof item.geojson === 'string' ? JSON.parse(item.geojson) : item.geojson;
    const tempLayer = L.geoJSON(geom);
    if (geom.type === 'Point') {
        map.setView(tempLayer.getBounds().getCenter(), 16, { animate: true });
    } else {
        map.fitBounds(tempLayer.getBounds(), { maxZoom: 16, animate: true });
    }
}

async function deleteCustomElement(id, type) {
    if (!confirm('Apakah Anda yakin ingin menghapus elemen kustom ini?')) return;
    try {
        const res = await fetch('api/delete_custom_geometry.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, type })
        });
        const json = await res.json();
        if (json.status === 'success') {
            toast('Elemen kustom berhasil dihapus', 'success');
            await loadCustomGeometries();
            if (typeof populateSpatialAnalysisDropdowns === 'function') {
                populateSpatialAnalysisDropdowns();
            }
        } else {
            toast(json.message, 'error');
        }
    } catch (err) {
        toast('Gagal menghapus elemen', 'error');
    }
}
