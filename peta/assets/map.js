/* ============================================================
 * map.js — GIS Manager | Open Source Edition
 * Main application logic: Map, Layers, CRUD, Export, UI
 * ============================================================ */

'use strict';

// ── Map Initialization ──────────────────────────────────────────────────────
const map = L.map('map', { zoomControl: true }).setView([-2.5, 118], 5);

const basemaps = {
    osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 19
    }),
    google_streets: L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        attribution: '&copy; Google Maps', maxZoom: 20
    }),
    google_satellite: L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        attribution: '&copy; Google Maps', maxZoom: 20
    }),
    google_hybrid: L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        attribution: '&copy; Google Maps', maxZoom: 20
    }),
    google_terrain: L.tileLayer('https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', {
        attribution: '&copy; Google Maps', maxZoom: 20
    }),
    esri_satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri', maxZoom: 18
    }),
    esri_street: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri', maxZoom: 18
    }),
    carto_light: L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CARTO', subdomains: 'abcd', maxZoom: 20
    }),
    carto_dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CARTO', subdomains: 'abcd', maxZoom: 20
    }),
    topo: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenTopoMap', maxZoom: 17
    })
};

let activeBasemapKey = 'osm';
basemaps[activeBasemapKey].addTo(map);

/**
 * Switch the active basemap tile layer.
 * @param {string} key - basemaps object key
 */
function changeBasemap(key) {
    if (activeBasemapKey === key) { closeBasemapDropdown(); return; }
    map.removeLayer(basemaps[activeBasemapKey]);
    basemaps[key].addTo(map);
    activeBasemapKey = key;

    document.querySelectorAll('.basemap-card').forEach(card => {
        const isActive = card.getAttribute('data-key') === key;
        card.classList.toggle('border-emerald-500', isActive);
        card.classList.toggle('bg-emerald-50', isActive);
        card.classList.toggle('dark:bg-emerald-950/20', isActive);
        card.classList.toggle('border-gray-200', !isActive);
        card.classList.toggle('bg-white', !isActive);
    });
    closeBasemapDropdown();
}

function closeBasemapDropdown() {
    document.getElementById('basemapDropdown')?.classList.add('hidden');
}

// Basemap dropdown toggle
document.getElementById('basemapBtn').addEventListener('click', e => {
    e.stopPropagation();
    document.getElementById('basemapDropdown').classList.toggle('hidden');
});

document.addEventListener('click', e => {
    const dd = document.getElementById('basemapDropdown');
    if (dd && !dd.classList.contains('hidden') &&
        !dd.contains(e.target) &&
        !document.getElementById('basemapBtn').contains(e.target)) {
        dd.classList.add('hidden');
    }
});

// ── Marker Icon ─────────────────────────────────────────────────────────────
function getMarkerIcon(color = '#10b981', active = false) {
    const size = active ? 18 : 16;
    return L.divIcon({
        className: '',
        html: `<div style="
            width:${size}px;height:${size}px;
            background-color:${color};
            border:2.5px solid rgba(255,255,255,0.9);
            border-radius:50%;
            box-shadow:0 0 0 3px ${color}44, 0 2px 6px rgba(0,0,0,0.25);
            ${active ? 'animation:pulse 1.5s ease-in-out infinite;' : ''}
        "></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
    });
}

// ── Draw Control ─────────────────────────────────────────────────────────────
const drawnItems = new L.FeatureGroup().addTo(map);

const drawControl = new L.Control.Draw({
    edit: false,
    draw: {
        circle:       { shapeOptions: { color: '#10b981', weight: 2 } },
        rectangle:    { shapeOptions: { color: '#10b981', weight: 2 } },
        circlemarker: false,
        marker:       { icon: getMarkerIcon('#10b981') },
        polyline:     { shapeOptions: { color: '#10b981', weight: 3 } },
        polygon:      { shapeOptions: { color: '#10b981', weight: 2, fillOpacity: 0.08 } }
    }
});
map.addControl(drawControl);

// ── State ────────────────────────────────────────────────────────────────────
let activeLayer = null;
let currentSort = 'id';
let heatmapLayer = null;
let heatmapActive = false;
let activeMenuId = null;

// ── Dark Mode ────────────────────────────────────────────────────────────────
function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    changeBasemap(isDark ? 'carto_dark' : 'carto_light');
}

// Auto-apply theme on load
(function initTheme() {
    const pref = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (pref === 'dark' || (!pref && prefersDark)) {
        document.documentElement.classList.add('dark');
        changeBasemap('carto_dark');
    } else {
        document.documentElement.classList.remove('dark');
        changeBasemap('carto_light');
    }
})();

// ── Toast Notifications ──────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
    let container = document.getElementById('sonnerContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'sonnerContainer';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type} entering`;

    const iconSvg = type === 'success'
        ? `<div style="width:28px;height:28px;border-radius:50%;background:rgba(16,185,129,0.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
               <i data-lucide="check-circle" style="width:15px;height:15px;color:#10b981;stroke:#10b981;"></i>
           </div>`
        : `<div style="width:28px;height:28px;border-radius:50%;background:rgba(244,63,94,0.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
               <i data-lucide="alert-circle" style="width:15px;height:15px;color:#f43f5e;stroke:#f43f5e;"></i>
           </div>`;

    toast.innerHTML = `
        ${iconSvg}
        <div style="flex:1;min-width:0;">
            <div style="font-size:11px;font-weight:700;color:${type==='success'?'#111827':'#be123c'};margin-bottom:1px;">
                ${type === 'success' ? 'Berhasil' : 'Perhatian'}
            </div>
            <div style="font-size:10px;font-weight:500;color:#6b7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${msg}</div>
        </div>
        <button onclick="this.closest('.toast').remove()" style="padding:2px;color:#9ca3af;cursor:pointer;background:none;border:none;flex-shrink:0;">
            <i data-lucide="x" style="width:12px;height:12px;"></i>
        </button>
    `;

    container.appendChild(toast);
    lucide.createIcons({ node: toast });

    // Trigger enter animation
    requestAnimationFrame(() => {
        requestAnimationFrame(() => { toast.classList.remove('entering'); });
    });

    // Auto remove
    setTimeout(() => {
        toast.classList.add('entering');
        setTimeout(() => toast.remove(), 280);
    }, 5000);
}

// ── Color Picker ─────────────────────────────────────────────────────────────
function setColor(hex) {
    document.getElementById('data_warna').value = hex;

    let matchedPreset = false;
    document.querySelectorAll('.color-dot').forEach(dot => {
        const isMatch = dot.getAttribute('data-color') === hex;
        dot.classList.toggle('active', isMatch);
        if (isMatch) matchedPreset = true;
    });

    // Update custom color indicator
    const indicator = document.getElementById('customIndicator');
    if (indicator) {
        if (!matchedPreset) {
            indicator.style.background = hex;
            indicator.innerHTML = '';
            indicator.classList.add('active');
        } else {
            indicator.style.background = '';
            indicator.classList.remove('active');
            indicator.innerHTML = '<i data-lucide="plus" style="width:10px;height:10px;color:#9ca3af;"></i>';
            lucide.createIcons({ node: indicator });
        }
    }

    // Instantly update active layer color
    if (activeLayer) {
        if (activeLayer instanceof L.Marker) {
            activeLayer.setIcon(getMarkerIcon(hex, true));
        } else if (activeLayer.setStyle) {
            activeLayer.setStyle({ color: hex, fillColor: hex });
        }
    }
}

// ── Reverse Geocoding (Nominatim) ────────────────────────────────────────────
async function fetchAddress(lat, lng) {
    const input = document.getElementById('data_nama');
    input.value = 'Mencari alamat...';
    input.classList.add('opacity-60');
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        input.value = data.name || data.display_name?.split(',')[0] || 'Lokasi Baru';
    } catch {
        input.value = 'Lokasi Baru';
    } finally {
        input.classList.remove('opacity-60');
    }
}

// ── Form Field Visibility ────────────────────────────────────────────────────
function adjustFormFields() {
    const type     = document.getElementById('data_tipe_layer').value;
    const divUrl   = document.getElementById('div_url');
    const divRad   = document.getElementById('div_radius');
    const lblUrl   = document.getElementById('lbl_url');
    const dataUrl  = document.getElementById('data_image_url');
    const dataRad  = document.getElementById('data_radius');

    divUrl.classList.add('hidden');
    divRad.classList.add('hidden');
    dataUrl.removeAttribute('required');
    dataRad.removeAttribute('required');

    if (type === 'circle') {
        divRad.classList.remove('hidden');
        dataRad.setAttribute('required', 'true');
    } else if (type === 'ground_overlay') {
        divUrl.classList.remove('hidden');
        lblUrl.textContent = 'Tautan Gambar Overlay';
        dataUrl.placeholder = 'https://example.com/overlay.png';
        dataUrl.setAttribute('required', 'true');
    } else if (type === 'tile_layer') {
        divUrl.classList.remove('hidden');
        lblUrl.textContent = 'Tautan XYZ Tile Layer';
        dataUrl.placeholder = 'https://{s}.tile.example.com/{z}/{x}/{y}.png';
        dataUrl.setAttribute('required', 'true');
    }
}

// ── Heatmap Toggle ───────────────────────────────────────────────────────────
function toggleHeatmap() {
    heatmapActive = !heatmapActive;
    const btn = document.getElementById('heatmapBtn');

    if (heatmapActive) {
        const points = [];
        drawnItems.eachLayer(layer => {
            if (layer instanceof L.Marker && layer.options.opacity !== 0) {
                const ll = layer.getLatLng();
                points.push([ll.lat, ll.lng, 1.0]);
            }
        });

        if (!points.length) {
            showToast('Tidak ada Titik/Marker untuk Heatmap', 'error');
            heatmapActive = false;
            return;
        }

        heatmapLayer = L.heatLayer(points, { radius: 25, blur: 15, maxZoom: 17 }).addTo(map);
        btn.classList.add('bg-amber-500', 'text-white', '!border-amber-500');
        showToast('Heatmap diaktifkan');
    } else {
        if (heatmapLayer) { map.removeLayer(heatmapLayer); heatmapLayer = null; }
        btn.classList.remove('bg-amber-500', 'text-white', '!border-amber-500');
        showToast('Heatmap dimatikan');
    }
}

// ── Sync Active Layer Geometry ───────────────────────────────────────────────
function syncActiveLayerGeom() {
    if (activeLayer?.toGeoJSON) {
        document.getElementById('data_geojson').value = JSON.stringify(activeLayer.toGeoJSON().geometry);
    }
}

// ── Format Coordinate Display ────────────────────────────────────────────────
function formatKoordinat(geom) {
    if (!geom?.coordinates) return '-';

    let coords = [];
    if (geom.type === 'Point')      coords = [geom.coordinates];
    else if (geom.type === 'LineString') coords = geom.coordinates;
    else if (geom.type === 'Polygon')    coords = geom.coordinates[0];

    const badges = coords.map(c =>
        `<span class="coord-badge">${parseFloat(c[1]).toFixed(5)}, ${parseFloat(c[0]).toFixed(5)}</span>`
    ).join('');

    if (coords.length > 1) {
        return `<details class="group" style="cursor:pointer;">
            <summary style="list-style:none;font-size:9px;font-weight:700;color:#059669;display:flex;align-items:center;gap:4px;">
                <span>${coords.length} Titik →</span>
            </summary>
            <div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:4px;max-height:60px;overflow-y:auto;">${badges}</div>
        </details>`;
    }
    return `<div style="display:flex;flex-wrap:wrap;gap:3px;">${badges}</div>`;
}

// ── Load Data from API ───────────────────────────────────────────────────────
async function loadData() {
    if (activeLayer) return;

    const res  = await fetch('peta/api.php?action=list');
    const data = await res.json();
    let features = data.features || [];

    // Annotate type
    features.forEach(f => {
        f.properties.tipe = f.properties.tipe_layer || (f.geometry?.type ?? 'Spasial');
    });

    // Sort
    if      (currentSort === 'nama') features.sort((a,b) => a.properties.nama.localeCompare(b.properties.nama));
    else if (currentSort === 'tipe') features.sort((a,b) => a.properties.tipe.localeCompare(b.properties.tipe));
    else                             features.sort((a,b) => b.properties.id - a.properties.id);

    // Clear existing overlays
    drawnItems.eachLayer(layer => {
        if (layer.options.associatedOverlay)   map.removeLayer(layer.options.associatedOverlay);
        if (layer.options.associatedTileLayer) map.removeLayer(layer.options.associatedTileLayer);
    });
    drawnItems.clearLayers();

    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    features.forEach(f => {
        const p     = f.properties;
        const g     = f.geometry;
        const color = p.warna || '#10b981';

        // Layer type metadata
        const typeMap = {
            circle:         { icon: 'circle',       label: 'Circle' },
            rectangle:      { icon: 'square',        label: 'Rectangle' },
            ground_overlay: { icon: 'image',         label: 'Ground Overlay' },
            tile_layer:     { icon: 'layers',        label: 'Tile Layer' },
        };
        const geomTypeMap = {
            Point:      { icon: 'map-pin',  label: 'Point' },
            LineString: { icon: 'share-2',  label: 'Line' },
            Polygon:    { icon: 'square', label: 'Polygon' },
        };

        let typeIcon  = 'map-pin';
        let typeLabel = p.tipe_layer || 'Spasial';

        if (typeMap[p.tipe_layer]) {
            typeIcon  = typeMap[p.tipe_layer].icon;
            typeLabel = typeMap[p.tipe_layer].label;
        } else if (g && geomTypeMap[g.type]) {
            typeIcon  = geomTypeMap[g.type].icon;
            typeLabel = geomTypeMap[g.type].label;
        }

        // ── Render layer on map ──
        let layer;
        if (p.tipe_layer === 'circle' && g) {
            layer = L.circle([g.coordinates[1], g.coordinates[0]], {
                radius: p.radius || 100, color, fillColor: color, fillOpacity: 0.12, weight: 2
            });
        } else if (p.tipe_layer === 'ground_overlay' && g) {
            const cs = g.coordinates[0];
            const bounds = L.latLngBounds([[cs[0][1], cs[0][0]], [cs[2][1], cs[2][0]]]);
            layer = L.rectangle(bounds, { color, weight: 1.5, fillOpacity: 0.04, dashArray: '5,4' });
            if (p.image_url) {
                const ovl = L.imageOverlay(p.image_url, bounds, { opacity: 0.8 }).addTo(map);
                layer.options.associatedOverlay = ovl;
            }
        } else if (p.tipe_layer === 'tile_layer') {
            layer = L.marker([-2.5, 118], { opacity: 0 }); // phantom marker
            if (p.image_url) {
                const tl = L.tileLayer(p.image_url, { maxZoom: 18 });
                tl.addTo(map);
                layer.options.associatedTileLayer = tl;
            }
        } else if (g) {
            const gjLayer = L.geoJSON(f, {
                pointToLayer: (_, latlng) => L.marker(latlng, { icon: getMarkerIcon(color) }),
                style: { color, fillColor: color, weight: 3, fillOpacity: 0.08 }
            });
            layer = gjLayer.getLayers()[0];
        }

        if (layer) {
            Object.assign(layer.options, {
                dbId:       parseInt(p.id),
                nama:       p.nama,
                warna:      color,
                radius:     p.radius,
                tipe_layer: p.tipe_layer,
                image_url:  p.image_url,
                deskripsi:  p.deskripsi
            });

            layer.on('click', () => pilihEdit(p.id));
            layer.on('dragend edit', syncActiveLayerGeom);
            drawnItems.addLayer(layer);

            // Bind InfoWindow popup
            if (p.tipe_layer !== 'tile_layer') {
                const descHtml = p.deskripsi ? `<p style="font-size:10px;color:#6b7280;margin-top:4px;line-height:1.5;">${p.deskripsi}</p>` : '';
                const popupHtml = `
                    <div style="min-width:160px;padding:4px 2px;">
                        <div style="font-weight:700;font-size:12px;color:#111827;">${p.nama}</div>
                        <span style="display:inline-block;margin-top:4px;padding:2px 6px;border-radius:4px;font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;background:rgba(16,185,129,.08);color:#059669;border:1px solid rgba(16,185,129,.15);">${typeLabel}</span>
                        ${descHtml}
                        <div style="margin-top:8px;padding-top:6px;border-top:1px solid #f3f4f6;display:flex;justify-content:space-between;align-items:center;font-size:9px;font-weight:700;color:#9ca3af;">
                            <span>ID #${p.id}</span>
                            <button onclick="pilihEdit(${p.id})" style="color:#10b981;background:none;border:none;cursor:pointer;font-weight:700;">Edit →</button>
                        </div>
                    </div>`;
                layer.bindPopup(popupHtml, { maxWidth: 240, minWidth: 160 });
            }
        }

        // ── Table Row ──
        const tr = document.createElement('tr');
        tr.className = 'table-row animate-fadeIn';
        tr.innerHTML = `
            <td style="padding:7px 14px;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <div style="
                        width:28px;height:28px;border-radius:7px;
                        background:${color}18;
                        border:1px solid ${color}30;
                        display:flex;align-items:center;justify-content:center;
                        flex-shrink:0;
                    ">
                        <i data-lucide="${typeIcon}" style="width:13px;height:13px;color:${color};stroke:${color};stroke-width:2.5;"></i>
                    </div>
                    <div>
                        <div style="font-weight:700;font-size:11px;color:var(--row-text, #1f2937);line-height:1.25;">${p.nama}</div>
                        <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#9ca3af;">${typeLabel}</div>
                    </div>
                </div>
            </td>
            <td style="padding:7px 14px;">
                ${g ? formatKoordinat(g) : '<span style="font-size:9px;color:#9ca3af;font-weight:600;">XYZ Tile</span>'}
            </td>
            <td style="padding:7px 14px;text-align:right;">
                <button type="button" onclick="showActionMenu(event, ${p.id})"
                    style="padding:5px;border-radius:7px;border:none;background:transparent;cursor:pointer;color:#9ca3af;transition:all .15s;"
                    onmouseover="this.style.background='rgba(16,185,129,.08)';this.style.color='#10b981';"
                    onmouseout="this.style.background='transparent';this.style.color='#9ca3af';"
                    title="Pilihan Aksi">
                    <i data-lucide="more-vertical" style="width:13px;height:13px;"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    lucide.createIcons();
}

// ── Draw Created Event ───────────────────────────────────────────────────────
map.on(L.Draw.Event.CREATED, async (e) => {
    const layer  = e.layer;
    const color  = document.getElementById('data_warna').value || '#10b981';
    drawnItems.addLayer(layer);
    pilihEditManual(layer);

    if (layer instanceof L.Marker) layer.setIcon(getMarkerIcon(color, true));
    else if (layer.setStyle) layer.setStyle({ color, fillColor: color, fillOpacity: 0.12 });

    const nameInput  = document.getElementById('data_nama');
    const tipeSelect = document.getElementById('data_tipe_layer');
    const radInput   = document.getElementById('data_radius');

    if (e.layerType === 'marker') {
        tipeSelect.value = 'geojson';
        const ll = layer.getLatLng();
        await fetchAddress(ll.lat, ll.lng);
    } else if (e.layerType === 'circle') {
        tipeSelect.value = 'circle';
        radInput.value   = Math.round(layer.getRadius());
        document.getElementById('data_geojson').value = JSON.stringify(layer.toGeoJSON().geometry);
        nameInput.value = '';
        nameInput.placeholder = 'Masukkan nama Lingkaran...';
        nameInput.focus();
    } else if (e.layerType === 'rectangle') {
        tipeSelect.value = 'rectangle';
        document.getElementById('data_geojson').value = JSON.stringify(layer.toGeoJSON().geometry);
        nameInput.value = '';
        nameInput.placeholder = 'Masukkan nama Persegi Panjang...';
        nameInput.focus();
    } else {
        tipeSelect.value = 'geojson';
        nameInput.value = '';
        nameInput.placeholder = 'Wajib: Masukkan nama...';
        nameInput.focus();
    }

    if (e.layerType !== 'circle') {
        document.getElementById('data_geojson').value = JSON.stringify(layer.toGeoJSON().geometry);
    }

    adjustFormFields();
    document.getElementById('btnSubmit').textContent = 'Simpan';
});

// ── Activate Layer for Editing (manual select) ───────────────────────────────
function pilihEditManual(layer) {
    drawnItems.eachLayer(l => { if (l !== layer) map.removeLayer(l); });
    activeLayer = layer;

    const color = document.getElementById('data_warna').value || layer.options.warna || '#10b981';
    if (layer instanceof L.Marker) {
        layer.setIcon(getMarkerIcon(color, true));
        if (layer.dragging) layer.dragging.enable();
    } else if (layer.setStyle) {
        layer.setStyle({ color, fillOpacity: 0.25 });
        if (layer.editing) layer.editing.enable();
    }
    if (!map.hasLayer(layer)) map.addLayer(layer);
}

// ── Select Item for Editing (by DB ID) ──────────────────────────────────────
function pilihEdit(id) {
    const targetId = parseInt(id);
    drawnItems.eachLayer(layer => {
        if (layer.options.dbId === targetId) {
            setColor(layer.options.warna || '#10b981');
            pilihEditManual(layer);

            document.getElementById('data_id').value         = targetId;
            document.getElementById('data_nama').value       = layer.options.nama || '';
            document.getElementById('data_deskripsi').value  = layer.options.deskripsi || '';
            document.getElementById('data_tipe_layer').value = layer.options.tipe_layer || 'geojson';
            document.getElementById('data_radius').value     = layer.options.radius || '';
            document.getElementById('data_image_url').value  = layer.options.image_url || '';
            document.getElementById('data_geojson').value    = layer.toGeoJSON ? JSON.stringify(layer.toGeoJSON().geometry) : '';

            adjustFormFields();

            const status = document.getElementById('formStatus');
            status.textContent = '';
            status.className = 'form-status status-edit';
            status.innerHTML = `<span>Mode: Edit Data</span><span class="dot" style="background:#f43f5e;"></span>`;

            document.getElementById('btnSubmit').textContent = 'Simpan Perubahan';

            if (layer.getBounds) {
                map.flyToBounds(layer.getBounds(), { padding: [80, 80], duration: 0.5 });
            } else if (layer.getLatLng) {
                map.flyTo(layer.getLatLng(), 15, { duration: 0.5 });
            }
        } else {
            map.removeLayer(layer);
        }
    });
}

// ── Focus Map on Layer ───────────────────────────────────────────────────────
function fokusKe(id) {
    drawnItems.eachLayer(layer => {
        if (layer.options.dbId === parseInt(id)) {
            if (layer.getBounds)  map.flyToBounds(layer.getBounds(), { padding: [80, 80], duration: 0.5 });
            else if (layer.getLatLng) map.flyTo(layer.getLatLng(), 15, { duration: 0.5 });
            if (layer.openPopup) setTimeout(() => layer.openPopup(), 550);
        }
    });
}

// ── Form Submit ──────────────────────────────────────────────────────────────
document.getElementById('crudForm').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('btnSubmit');
    const orig = btn.textContent;
    btn.textContent = 'Memproses...';
    btn.disabled = true;

    if (activeLayer) syncActiveLayerGeom();

    const fd = new FormData(e.target);
    try {
        const res    = await fetch('peta/api.php?action=save', { method: 'POST', body: fd });
        const result = await res.json();
        if (result.status === 'success') {
            showToast(fd.get('id') ? 'Data diperbarui!' : 'Data berhasil disimpan!');
            resetForm();
        } else {
            showToast('Gagal: ' + result.message, 'error');
        }
    } catch {
        showToast('Kesalahan koneksi', 'error');
    } finally {
        btn.textContent = orig;
        btn.disabled = false;
    }
});

// ── Reset Form ───────────────────────────────────────────────────────────────
function resetForm() {
    document.getElementById('crudForm').reset();
    ['data_id', 'data_geojson', 'data_radius', 'data_image_url', 'data_deskripsi'].forEach(id => {
        document.getElementById(id).value = '';
    });
    document.getElementById('data_tipe_layer').value = 'geojson';
    setColor('#10b981');
    adjustFormFields();

    const status = document.getElementById('formStatus');
    status.className = 'form-status status-add';
    status.innerHTML = `<span>Mode: Tambah Baru</span><span class="dot" style="background:#10b981;"></span>`;

    document.getElementById('btnSubmit').textContent = 'Simpan';

    drawnItems.eachLayer(layer => {
        if (layer.options.associatedOverlay)   map.removeLayer(layer.options.associatedOverlay);
        if (layer.options.associatedTileLayer) map.removeLayer(layer.options.associatedTileLayer);

        const col = layer.options.warna || '#10b981';
        if (layer instanceof L.Marker) {
            if (layer.dragging) layer.dragging.disable();
            layer.setIcon(getMarkerIcon(col));
        } else if (layer.setStyle) {
            if (layer.editing) layer.editing.disable();
            layer.setStyle({ color: col, fillColor: col, fillOpacity: 0.08 });
        }
        if (!map.hasLayer(layer)) map.addLayer(layer);
    });

    activeLayer = null;
    loadData();
}

// ── Delete Data ──────────────────────────────────────────────────────────────
async function hapusData(id) {
    if (!confirm('Yakin ingin menghapus data ini?')) return;
    const fd = new FormData();
    fd.append('id', id);
    const res    = await fetch('peta/api.php?action=delete', { method: 'POST', body: fd });
    const result = await res.json();
    if (result.status === 'success') { showToast('Data berhasil dihapus'); resetForm(); }
    else showToast('Gagal menghapus', 'error');
}

// ── Action Dropdown Menu ─────────────────────────────────────────────────────
function showActionMenu(event, id) {
    event.stopPropagation();
    const menu = document.getElementById('globalActionMenu');
    const btn  = event.currentTarget;

    if (activeMenuId === id && !menu.classList.contains('hidden')) {
        closeGlobalMenu(); return;
    }
    activeMenuId = id;

    // Update download links
    const formats = ['geojson', 'kml', 'csv', 'gpx', 'wkt', 'sql'];
    formats.forEach(fmt => {
        const el = document.getElementById('download_' + fmt);
        if (el) el.href = `peta/api.php?action=export_single&id=${id}&format=${fmt}`;
    });

    menu.classList.remove('hidden');

    // Position menu smartly
    const rect    = btn.getBoundingClientRect();
    const mh      = menu.offsetHeight || 250;
    const mw      = menu.offsetWidth  || 210;
    let top  = rect.bottom + 6;
    let left = rect.right - mw;

    if (top + mh > window.innerHeight - 10) top  = rect.top - mh - 6;
    if (left < 8)                           left = 8;
    if (left + mw > window.innerWidth - 8)  left = window.innerWidth - mw - 8;

    menu.style.top  = `${top}px`;
    menu.style.left = `${left}px`;

    lucide.createIcons({ node: menu });
}

function closeGlobalMenu() {
    document.getElementById('globalActionMenu')?.classList.add('hidden');
    activeMenuId = null;
}

function handleGlobalFokus()  { if (activeMenuId) { fokusKe(activeMenuId);   closeGlobalMenu(); } }
function handleGlobalEdit()   { if (activeMenuId) { pilihEdit(activeMenuId); closeGlobalMenu(); } }
function handleGlobalHapus()  { if (activeMenuId) { hapusData(activeMenuId); closeGlobalMenu(); } }

// Close menu on outside click / scroll / map movement
document.addEventListener('click', e => {
    const menu = document.getElementById('globalActionMenu');
    if (menu && !menu.classList.contains('hidden') && !menu.contains(e.target)) closeGlobalMenu();
});
document.querySelector('.table-scroll-inner')?.addEventListener('scroll', closeGlobalMenu);
map.on('movestart zoomstart click', closeGlobalMenu);

// ── About Modal ───────────────────────────────────────────────────────────────
function openAbout() {
    const m = document.getElementById('aboutModal');
    m.style.display = 'flex';
    m.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    // Re-render lucide icons in modal
    lucide.createIcons({ node: m });
}
function closeAbout() {
    const m = document.getElementById('aboutModal');
    m.style.display = 'none';
    m.classList.add('hidden');
    document.body.style.overflow = '';
}
document.getElementById('aboutModal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('aboutModal')) closeAbout();
});

// ── Init ─────────────────────────────────────────────────────────────────────
loadData();
