<?php
// index.php — Halaman Publik: Peta Fasilitas Kesehatan per Kecamatan
?>
<!DOCTYPE html>
<html lang="id" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Web GIS — Fasilitas Kesehatan Kota Bandung</title>
    <meta name="description" content="Sistem Informasi Geografis Fasilitas Kesehatan per Kecamatan. Analisis spasial overlay puskesmas dan rumah sakit.">

    <!-- Leaflet CSS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
    <!-- Leaflet Draw CSS -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css"/>
    <!-- FontAwesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>
    <!-- Custom CSS -->
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>

<!-- ===================== HEADER ===================== -->
<header>
    <h1>
        <div class="brand-icon"><i class="fas fa-map-marked-alt"></i></div>
        Web <span>GIS</span>
    </h1>
    <div class="header-nav">
        <a href="admin/index.php" class="btn btn-secondary btn-sm">
            <i class="fas fa-cog"></i> <span class="btn-text">Admin</span>
        </a>
    </div>
</header>

<!-- ===================== TOAST ===================== -->
<div id="toast-container"></div>

<!-- ===================== APP LAYOUT ===================== -->
<div class="app-layout">

    <!-- ============= SIDEBAR ============= -->
    <aside class="sidebar no-scrollbar">
        <div class="sidebar-header">
            <i class="fas fa-sliders-h" style="color: var(--primary);"></i>
            <h2>Panel Kontrol</h2>
        </div>

        <div class="sidebar-scroll no-scrollbar">

            <!-- Collapsible 1: Overlays -->
            <div class="accordion-item">
                <button class="accordion-trigger active" onclick="toggleAccordion('acc-overlays', this)">
                    <span><i class="fas fa-layer-group"></i> Overlays (Lapisan Peta)</span>
                    <i class="fas fa-chevron-down acc-arrow"></i>
                </button>
                <div id="acc-overlays" class="accordion-content show">
                    <div class="form-group">
                        <label class="form-label">Pilih Lapisan Data</label>
                        <select id="overlay-table-select" class="form-control">
                            <!-- Dinamis -->
                        </select>
                    </div>
                    <button class="btn btn-primary btn-sm" style="width:100%; justify-content:center; margin-bottom: 0.75rem;" onclick="addOverlay()">
                        <i class="fas fa-plus"></i> Tambah Lapisan
                    </button>
                    <label class="form-label" style="font-weight:600; margin-bottom:0.25rem;">Lapisan Aktif:</label>
                    <ul id="overlay-active-list" class="elements-list no-scrollbar">
                        <li class="element-item" style="color:var(--text-muted); justify-content:center;">Belum ada lapisan overlay aktif</li>
                    </ul>
                </div>
            </div>

            <!-- Collapsible 2: Preview -->
            <div class="accordion-item">
                <button class="accordion-trigger" onclick="toggleAccordion('acc-preview', this)">
                    <span><i class="fas fa-eye"></i> Preview Cepat</span>
                    <i class="fas fa-chevron-down acc-arrow"></i>
                </button>
                <div id="acc-preview" class="accordion-content">
                    <div class="form-group" style="margin-bottom:0;">
                        <label class="form-label">Pilih Tabel untuk Preview</label>
                        <select id="preview-table-select" class="form-control" onchange="previewTable()">
                            <option value="">-- Pilih Tabel --</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Collapsible 3: Analisis Spasial & Gambar -->
            <div class="accordion-item">
                <button class="accordion-trigger" onclick="toggleAccordion('acc-spatial', this)">
                    <span><i class="fas fa-project-diagram"></i> Analisis Spasial & Gambar</span>
                    <i class="fas fa-chevron-down acc-arrow"></i>
                </button>
                <div id="acc-spatial" class="accordion-content">
                    <!-- Drawing Tools -->
                    <label class="form-label" style="font-weight:600; margin-bottom:0.35rem;">1. Gambar Elemen Kustom</label>
                    <div id="draw-instruction" class="draw-instructions" style="display: none;"></div>
                    <div class="draw-btn-group">
                        <button class="btn btn-outline btn-sm" onclick="startDrawing('polygon')" style="justify-content: flex-start;">
                            <i class="fas fa-draw-polygon" style="color: #3b82f6; width:16px;"></i> Polygon Baru
                        </button>
                        <button class="btn btn-outline btn-sm" onclick="startDrawing('polyline')" style="justify-content: flex-start;">
                            <i class="fas fa-route" style="color: #10b981; width:16px;"></i> Polyline Baru
                        </button>
                        <button class="btn btn-outline btn-sm" onclick="startDrawing('marker')" style="justify-content: flex-start;">
                            <i class="fas fa-map-marker-alt" style="color: #ef4444; width:16px;"></i> Marker Baru
                        </button>
                    </div>

                    <!-- Custom Drawn Elements List -->
                    <label class="form-label" style="font-weight:600; margin-bottom:0.25rem;">Elemen Kustom Tersimpan:</label>
                    <ul id="custom-elements-list" class="elements-list no-scrollbar" style="margin-bottom: 1rem;">
                        <li class="element-item" style="color:var(--text-muted); justify-content:center;">Belum ada elemen kustom</li>
                    </ul>

                    <!-- PostGIS Spatial Analysis -->
                    <label class="form-label" style="font-weight:600; margin-bottom:0.5rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem; display:block;">2. Analisis Spasial Himpunan</label>
                    
                    <div class="form-group">
                        <label class="form-label">Pilih Wilayah A</label>
                        <select id="spatial-poly-a-id" class="form-control" onchange="runSpatialAnalysis()">
                            <option value="">-- Pilih Wilayah A --</option>
                        </select>
                    </div>

                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label class="form-label">Pilih Wilayah B</label>
                        <select id="spatial-poly-b-id" class="form-control" onchange="runSpatialAnalysis()">
                            <option value="">-- Pilih Wilayah B --</option>
                        </select>
                    </div>

                    <button class="btn btn-primary" style="width:100%; justify-content:center;" onclick="runSpatialAnalysis()">
                        <i class="fas fa-sync-alt"></i> Sinkronkan Peta
                    </button>
                </div>
            </div>

        </div>
    </aside>

    <!-- Vertical Resizer Handle -->
    <div id="sidebar-resizer" class="resizer-v"></div>

    <!-- ============= MAIN CONTENT ============= -->
    <main class="main-content">

        <!-- MAP -->
        <div class="map-wrapper">
            <div id="map"></div>

            <!-- Loading overlay -->
            <div class="loading-overlay" id="map-loading">
                <div style="text-align:center;">
                    <div class="spinner"></div>
                    <p style="font-size:.8rem; color:var(--text-secondary); margin-top:.75rem;">Memuat data peta...</p>
                </div>
            </div>

        </div>

        <!-- RESULTS TABLE -->
        <div id="table-resizer" class="resizer-h"></div>
        <div class="results-panel">
            <div class="results-header">
                <h3 id="results-title"><i class="fas fa-table"></i> Daftar Data</h3>
                <span class="badge badge-count" id="result-count">0 data</span>
            </div>
            <div class="results-body" style="display: flex; flex-direction: column; height: 100%; overflow: hidden;">
                <div style="flex: 1; overflow: auto;">
                    <table class="data-table">
                        <thead id="table-thead">
                            <tr>
                                <th>#</th>
                                <th>Nama Fasilitas</th>
                                <th>Jenis</th>
                                <th>Kecamatan</th>
                                <th>Alamat</th>
                                <th>Telepon</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody id="table-body">
                            <tr>
                                <td colspan="7" class="empty-state">
                                    <i class="fas fa-spinner fa-spin"></i> Memuat data...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <!-- Pagination Container -->
                <div id="table-pagination" class="pagination-container" style="display: none; border-top: 1px solid var(--border-color); flex-shrink: 0;"></div>
            </div>
        </div>

        <!-- 7 VISUAL MAPS HASIL ANALISIS -->
        <div id="analysis-visual-section" class="sub-maps-section" style="display: none; padding: 1.25rem 0;">
            <h3 class="sub-maps-section-title">
                <i class="fas fa-th-large"></i> Hasil Visualisasi Spasial Himpunan
            </h3>
            
            <div class="sub-maps-grid">
                <!-- Map 1: Wilayah A (Asli) -->
                <div class="sub-map-card">
                    <h4>
                        <span>1. Wilayah A (Asli)</span>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span id="badge-wilayah-a" class="badge">0 Titik</span>
                        </div>
                    </h4>
                    <div id="sub-map-wilayah-a" class="sub-map-container"></div>
                </div>

                <!-- Map 2: Wilayah B (Asli) -->
                <div class="sub-map-card">
                    <h4>
                        <span>2. Wilayah B (Asli)</span>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span id="badge-wilayah-b" class="badge">0 Titik</span>
                        </div>
                    </h4>
                    <div id="sub-map-wilayah-b" class="sub-map-container"></div>
                </div>

                <!-- Map 3: Union (A dan B) -->
                <div class="sub-map-card">
                    <h4>
                        <span>3. Wilayah A dan B (Union)</span>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span id="badge-union" class="badge">0 Titik</span>
                        </div>
                    </h4>
                    <div id="sub-map-union" class="sub-map-container"></div>
                </div>

                <!-- Map 4: A - B -->
                <div class="sub-map-card">
                    <h4>
                        <span>4. Wilayah A tapi bukan B</span>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span id="badge-diff-ab" class="badge">0 Titik</span>
                        </div>
                    </h4>
                    <div id="sub-map-diff-ab" class="sub-map-container"></div>
                </div>

                <!-- Map 5: B - A -->
                <div class="sub-map-card">
                    <h4>
                        <span>5. Wilayah B tapi bukan A</span>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span id="badge-diff-ba" class="badge">0 Titik</span>
                        </div>
                    </h4>
                    <div id="sub-map-diff-ba" class="sub-map-container"></div>
                </div>

                <!-- Map 6: Outside A dan B -->
                <div class="sub-map-card">
                    <h4>
                        <span>6. Selain Wilayah A dan B</span>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span id="badge-outside" class="badge">0 Titik</span>
                        </div>
                    </h4>
                    <div id="sub-map-outside" class="sub-map-container"></div>
                </div>

                <!-- Map 7: Intersection (Irisan) -->
                <div class="sub-map-card">
                    <h4>
                        <span>7. Irisan A dan B (Gray Style)</span>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span id="badge-intersect" class="badge">0 Titik</span>
                        </div>
                    </h4>
                    <div id="sub-map-intersect" class="sub-map-container"></div>
                </div>
            </div>
        </div>

    </main>
</div>

<!-- ===================== SCRIPTS ===================== -->
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<!-- Leaflet Draw JS -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js"></script>
<script>

// =====================================================
// TEMA TERANG (SELALU TERANG)
// =====================================================
function applyTheme() {
    document.documentElement.setAttribute('data-theme', 'light');
}
(function() { applyTheme(); })();

// =====================================================
// KONFIGURASI WARNA MARKER PER JENIS
// =====================================================
const JENIS_CONFIG = {
    'Puskesmas':  { color: '#38bdf8', icon: 'fas fa-clinic-medical' },
    'Rumah Sakit':{ color: '#f87171', icon: 'fas fa-hospital' },
    'Klinik':     { color: '#a5b4fc', icon: 'fas fa-stethoscope' },
    'Apotek':     { color: '#4ade80', icon: 'fas fa-pills' },
};

// =====================================================
// TOAST NOTIFICATION
// =====================================================
function toast(message, type = 'info') {
    const icons = { 
        success: '<i class="fas fa-check-circle"></i>', 
        error: '<i class="fas fa-times-circle"></i>', 
        info: '<i class="fas fa-info-circle"></i>', 
        warn: '<i class="fas fa-exclamation-triangle"></i>' 
    };
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `${icons[type]||''}<span>${message}</span>`;
    document.getElementById('toast-container').appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .2s'; setTimeout(() => el.remove(), 200); }, 3200);
}

// =====================================================
// INISIALISASI PETA LEAFLET
// =====================================================
const map = L.map('map', { zoomControl: false }).setView([-6.9175, 107.6191], 13);
L.control.zoom({ position: 'topright' }).addTo(map);

// Tile layer detail (OpenStreetMap)
const initTile = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
L.tileLayer(initTile, {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
}).addTo(map);

// Layer groups
const markerLayer   = L.layerGroup().addTo(map);
const overlayLayer  = L.layerGroup().addTo(map);
const highlightLayer = L.layerGroup().addTo(map);
const analysisLayer = L.layerGroup().addTo(map);

let activeData    = [];
let activeColumns = [];
let tablesList    = [];
let currentPage   = 1;
const pageSize    = 50;

// GLOBAL VARIABLES FOR SUB-MAPS & CUSTOM ELEMENTS
let subMaps = {
    wilayahA: null,
    wilayahB: null,
    union: null,
    diffAB: null,
    diffBA: null,
    outside: null,
    intersect: null
};

let subMapLayers = {
    wilayahA: L.layerGroup(),
    wilayahB: L.layerGroup(),
    union: L.layerGroup(),
    diffAB: L.layerGroup(),
    diffBA: L.layerGroup(),
    outside: L.layerGroup(),
    intersect: L.layerGroup()
};

let customElementsData = { polygons: [], polylines: [], markers: [] };

const DISTINCT_COLORS = [
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Amber
    '#ec4899', // Pink
    '#8b5cf6', // Violet
    '#ef4444', // Red
    '#14b8a6', // Teal
    '#f97316', // Orange
    '#06b6d4', // Cyan
    '#6366f1'  // Indigo
];


// =====================================================
// CAPITALIZE HELPER
// =====================================================
function capitalize(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
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
// INIT
// =====================================================
// =====================================================
// ACCORDION TOGGLER
// =====================================================
function toggleAccordion(id, btn) {
    const content = document.getElementById(id);
    const isActive = btn.classList.contains('active');
    
    // Close other accordions for focus
    document.querySelectorAll('.accordion-content').forEach(c => c.classList.remove('show'));
    document.querySelectorAll('.accordion-trigger').forEach(b => b.classList.remove('active'));
    
    if (!isActive) {
        content.classList.add('show');
        btn.classList.add('active');
    }
    
    updateWorkspaceView();
}

function updateWorkspaceView() {
    const spatialActive = document.getElementById('acc-spatial') && document.getElementById('acc-spatial').classList.contains('show');
    const mainContent = document.querySelector('.main-content');
    const tableResizer = document.getElementById('table-resizer');
    const resultsPanel = document.querySelector('.results-panel');
    const analysisSection = document.getElementById('analysis-visual-section');
    const mapWrapper = document.querySelector('.map-wrapper');
    
    if (spatialActive) {
        if (tableResizer) tableResizer.style.display = 'none';
        if (resultsPanel) resultsPanel.style.display = 'none';
        if (analysisSection) analysisSection.style.display = 'block';
        if (mainContent) mainContent.style.overflowY = 'auto';
        if (mapWrapper) {
            mapWrapper.style.height = '450px';
            mapWrapper.style.flex = 'none';
        }
        
        // Invalidate size multiple times to handle transition animations
        const invalidateAll = () => {
            if (window.map) window.map.invalidateSize();
            for (const key in subMaps) {
                if (subMaps[key]) {
                    subMaps[key].invalidateSize();
                }
            }
            syncSubMapsView();
        };
        
        invalidateAll();
        setTimeout(invalidateAll, 100);
        setTimeout(invalidateAll, 300);
        setTimeout(invalidateAll, 500);
    } else {
        if (tableResizer) tableResizer.style.display = 'flex';
        if (resultsPanel) resultsPanel.style.display = 'flex';
        if (analysisSection) analysisSection.style.display = 'none';
        if (mainContent) mainContent.style.overflowY = 'hidden';
        if (mapWrapper) {
            mapWrapper.style.height = '';
            mapWrapper.style.flex = '';
        }
        
        setTimeout(() => {
            if (window.map) window.map.invalidateSize();
        }, 100);
    }
}

// =====================================================
// DYNAMIC OVERLAYS MANAGEMENT
// =====================================================
let activeOverlays = {}; 
const OVERLAY_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444', '#14b8a6'];
let colorIndex = 0;

function getOverlayColor() {
    const c = OVERLAY_COLORS[colorIndex % OVERLAY_COLORS.length];
    colorIndex++;
    return c;
}

function populateOverlayDropdown() {
    const sel = document.getElementById('overlay-table-select');
    sel.innerHTML = '<option value="">-- Pilih Lapisan --</option>';
    
    tablesList.forEach(t => {
        if (['custom_polygons', 'custom_polylines', 'custom_markers'].includes(t.table_name)) return;
        if (!activeOverlays[t.table_name]) {
            sel.insertAdjacentHTML('beforeend', `<option value="${t.table_name}">${capitalize(t.table_name)} (${t.type})</option>`);
        }
    });
}

async function addOverlay() {
    const sel = document.getElementById('overlay-table-select');
    const table = sel.value;
    if (!table) {
        toast('Pilih lapisan data terlebih dahulu!', 'warn');
        return;
    }
    
    document.getElementById('map-loading').classList.add('show');
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
            
            group.addTo(overlayLayer);
            
            activeOverlays[table] = {
                layer: group,
                color: color,
                data: data,
                columns: columns
            };
            
            // Show data in the bottom results panel
            activeData = data;
            activeColumns = columns;
            currentPage = 1;
            document.getElementById('results-title').innerHTML = `<i class="fas fa-layer-group"></i> Lapisan ${capitalize(table)}`;
            document.getElementById('result-count').textContent = `${activeData.length} data`;
            renderDynamicTable(activeData);
            
            toast(`Lapisan ${capitalize(table)} berhasil ditambahkan`, 'success');
            
            renderOverlayActiveList();
            populateOverlayDropdown();
        } else {
            toast('Gagal memuat overlay: ' + json.message, 'error');
        }
    } catch (e) {
        console.error(e);
        toast('Gagal memuat overlay', 'error');
    } finally {
        document.getElementById('map-loading').classList.remove('show');
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
            renderDynamicTable([]);
        }
        
        renderOverlayActiveList();
        populateOverlayDropdown();
    }
}

function focusOverlay(table) {
    const overlay = activeOverlays[table];
    if (!overlay) return;
    
    const tempGroup = L.featureGroup();
    overlay.layer.eachLayer(l => {
        tempGroup.addLayer(l);
    });
    
    if (tempGroup.getLayers().length > 0) {
        map.fitBounds(tempGroup.getBounds(), { maxZoom: 16, animate: true });
    } else {
        toast('Lapisan tidak memiliki geometri', 'warn');
    }
    
    // Show table data in the bottom results panel
    activeData = overlay.data;
    activeColumns = overlay.columns;
    currentPage = 1;
    document.getElementById('results-title').innerHTML = `<i class="fas fa-layer-group"></i> Lapisan ${capitalize(table)}`;
    document.getElementById('result-count').textContent = `${activeData.length} data`;
    renderDynamicTable(activeData);
}

function renderOverlayActiveList() {
    const listEl = document.getElementById('overlay-active-list');
    listEl.innerHTML = '';
    
    const tables = Object.keys(activeOverlays);
    if (tables.length === 0) {
        listEl.innerHTML = `<li class="element-item" style="color:var(--text-muted); justify-content:center;">Belum ada lapisan overlay aktif</li>`;
        return;
    }
    
    tables.forEach(table => {
        const item = activeOverlays[table];
        const li = document.createElement('li');
        li.className = 'element-item';
        li.innerHTML = `
            <span class="element-name" title="${capitalize(table)}">
                <i class="fas fa-layer-group" style="color:${item.color};"></i> ${capitalize(table)}
            </span>
            <div class="element-actions">
                <button class="btn btn-ghost btn-sm" onclick="focusOverlay('${table}')" style="padding: 2px 6px;" title="Lihat">
                    <i class="fas fa-eye" style="font-size:0.75rem;"></i>
                </button>
                <button class="btn btn-ghost btn-sm" onclick="removeOverlay('${table}')" style="padding: 2px 6px;" title="Hapus">
                    <i class="fas fa-trash" style="color:var(--danger); font-size:0.75rem;"></i>
                </button>
            </div>
        `;
        listEl.appendChild(li);
    });
}

// =====================================================
// QUICK PREVIEW MANAGEMENT
// =====================================================
function populatePreviewDropdown() {
    const sel = document.getElementById('preview-table-select');
    sel.innerHTML = '<option value="">-- Pilih Tabel --</option>';
    tablesList.forEach(t => {
        if (['custom_polygons', 'custom_polylines', 'custom_markers'].includes(t.table_name)) return;
        sel.insertAdjacentHTML('beforeend', `<option value="${t.table_name}">${capitalize(t.table_name)}</option>`);
    });
}

async function previewTable() {
    const sel = document.getElementById('preview-table-select');
    const table = sel.value;
    if (!table) {
        markerLayer.clearLayers();
        activeData = [];
        activeColumns = [];
        renderDynamicTable([]);
        return;
    }
    
    document.getElementById('map-loading').classList.add('show');
    markerLayer.clearLayers();
    highlightLayer.clearLayers();
    
    try {
        const res = await fetch(`api/get_layer_data.php?table=${table}`);
        const json = await res.json();
        
        if (json.status === 'success') {
            activeData = json.data;
            activeColumns = json.columns;
            currentPage = 1;
            
            document.getElementById('results-title').innerHTML = `<i class="fas fa-table"></i> Preview ${capitalize(table)}`;
            document.getElementById('result-count').textContent = `${activeData.length} data`;
            
            renderLayerGeometries(activeData);
            
            const tempGroup = L.featureGroup();
            markerLayer.eachLayer(l => {
                tempGroup.addLayer(l);
            });
            
            if (tempGroup.getLayers().length > 0) {
                map.fitBounds(tempGroup.getBounds(), { maxZoom: 15, animate: true });
            } else {
                toast('Tabel tidak memiliki geometri untuk ditampilkan', 'warn');
            }
            
            renderDynamicTable(activeData);
            toast(`Menampilkan preview ${capitalize(table)}`, 'success');
        } else {
            toast('Gagal memuat preview: ' + json.message, 'error');
        }
    } catch (e) {
        console.error(e);
        toast('Gagal memuat preview', 'error');
    } finally {
        document.getElementById('map-loading').classList.remove('show');
    }
}

// =====================================================
// DRAWING CUSTOM GEOMETRIES
// =====================================================
const drawItems = L.featureGroup().addTo(map);
let drawHandler = null;
let currentDrawingType = null;

function startDrawing(type) {
    if (drawHandler) {
        drawHandler.disable();
    }
    
    currentDrawingType = type;
    const instr = document.getElementById('draw-instruction');
    instr.style.display = 'block';
    
    if (type === 'polygon') {
        instr.textContent = 'Klik pada peta untuk mulai menggambar Polygon. Double-klik untuk menyelesaikan.';
        drawHandler = new L.Draw.Polygon(map, {
            shapeOptions: {
                color: '#3b82f6',
                weight: 2,
                fillColor: '#3b82f6',
                fillOpacity: 0.15
            }
        });
    } else if (type === 'polyline') {
        instr.textContent = 'Klik pada peta untuk menggambar Garis (Polyline). Double-klik untuk menyelesaikan.';
        drawHandler = new L.Draw.Polyline(map, {
            shapeOptions: {
                color: '#10b981',
                weight: 3
            }
        });
    } else if (type === 'marker') {
        instr.textContent = 'Klik pada peta untuk meletakkan Marker.';
        drawHandler = new L.Draw.Marker(map, {
            icon: L.divIcon({
                className: '',
                iconSize: [20, 20],
                iconAnchor: [10, 10],
                html: `<div style="width:20px; height:20px; background:#ef4444; border-radius:50%; border:2px solid #fff; box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>`
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
    
    document.getElementById('draw-instruction').style.display = 'none';
    if (drawHandler) {
        drawHandler.disable();
        drawHandler = null;
    }
    
    let defaultName = '';
    if (type === 'polygon') defaultName = 'Polygon ' + (document.querySelectorAll('#custom-elements-list .fa-draw-polygon').length + 1);
    else if (type === 'polyline') defaultName = 'Polyline ' + (document.querySelectorAll('#custom-elements-list .fa-route').length + 1);
    else defaultName = 'Marker ' + (document.querySelectorAll('#custom-elements-list .fa-map-marker-alt').length + 1);
    
    const name = prompt(`Beri nama elemen ${type} baru ini:`, defaultName);
    if (!name) return;
    
    let description = '';
    
    try {
        const res = await fetch('api/save_custom_geometry.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, name, geojson, description })
        });
        const json = await res.json();
        if (json.status === 'success') {
            toast('Elemen kustom disimpan', 'success');
            await loadCustomGeometries();
            populateSpatialAnalysisDropdowns();
        } else {
            toast(json.message, 'error');
        }
    } catch(err) {
        toast('Gagal menyimpan elemen', 'error');
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
            populateSpatialAnalysisDropdowns();
        } else {
            toast(json.message, 'error');
        }
    } catch (err) {
        toast('Gagal menghapus elemen', 'error');
    }
}

// =====================================================
// SPATIAL SET ANALYSIS (PostGIS Himpunan)
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
    
    document.getElementById('map-loading').classList.add('show');
    
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
        document.getElementById('map-loading').classList.remove('show');
        syncSubMapsView();
    }
}

// =====================================================
// INIT
// =====================================================
(async function init() {
    try {
        // Bind map events for sync
        map.on('move', syncSubMapsView);
        map.on('zoomend', syncSubMapsView);

        // Initialize sub-maps
        initSubMaps();

        const res = await fetch('api/get_tables.php');
        const json = await res.json();
        
        if (json.status === 'success' && json.tables.length) {
            tablesList = json.tables; 
            
            populateOverlayDropdown();
            populatePreviewDropdown();
            await loadCustomGeometries();
            populateSpatialAnalysisDropdowns();
            
            const defaultTable = tablesList.some(t => t.table_name === 'fasilitas_kesehatan') ? 'fasilitas_kesehatan' : tablesList[0].table_name;
            document.getElementById('preview-table-select').value = defaultTable;
            await previewTable();
        }
    } catch (e) {
        console.error('Error in init:', e);
        toast('Gagal menginisialisasi control panel', 'error');
    }
})();

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

// =====================================================
// SHADCN-STYLE RESIZABLE PANELS
// =====================================================
function initResizableLayout() {
    const sidebar = document.querySelector('.sidebar');
    const sidebarResizer = document.getElementById('sidebar-resizer');
    const resultsPanel = document.querySelector('.results-panel');
    const tableResizer = document.getElementById('table-resizer');
    const mainContent = document.querySelector('.main-content');

    if (!sidebarResizer || !tableResizer) return;

    // Sidebar Resizing (Horizontal)
    let isResizingSidebar = false;

    sidebarResizer.addEventListener('mousedown', function(e) {
        e.preventDefault();
        isResizingSidebar = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        sidebarResizer.classList.add('dragging');
    });

    // Table Resizing (Vertical)
    let isResizingTable = false;

    tableResizer.addEventListener('mousedown', function(e) {
        e.preventDefault();
        isResizingTable = true;
        document.body.style.cursor = 'row-resize';
        document.body.style.userSelect = 'none';
        tableResizer.classList.add('dragging');
    });

    document.addEventListener('mousemove', function(e) {
        if (isResizingSidebar) {
            let newWidth = e.clientX;
            // constraints
            if (newWidth < 240) newWidth = 240;
            if (newWidth > 480) newWidth = 480;
            sidebar.style.width = newWidth + 'px';
            if (window.map) {
                window.map.invalidateSize({ animate: false });
            }
        } else if (isResizingTable) {
            const mainRect = mainContent.getBoundingClientRect();
            const resizerHeight = tableResizer.offsetHeight;
            let newHeight = mainRect.bottom - e.clientY - (resizerHeight / 2);
            
            // Constrain height between 120px and 70% of mainContent height
            const maxHeight = mainRect.height * 0.7;
            const minHeight = 120;
            if (newHeight < minHeight) newHeight = minHeight;
            if (newHeight > maxHeight) newHeight = maxHeight;

            resultsPanel.style.height = newHeight + 'px';
            if (window.map) {
                window.map.invalidateSize({ animate: false });
            }
        }
    });

    document.addEventListener('mouseup', function() {
        if (isResizingSidebar) {
            isResizingSidebar = false;
            sidebarResizer.classList.remove('dragging');
        }
        if (isResizingTable) {
            isResizingTable = false;
            tableResizer.classList.remove('dragging');
        }
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        
        if (window.map) {
            window.map.invalidateSize();
        }
    });

    // Touch support for mobile/tablet resizers (if displayed)
    sidebarResizer.addEventListener('touchstart', function(e) {
        isResizingSidebar = true;
        sidebarResizer.classList.add('dragging');
    }, { passive: true });

    tableResizer.addEventListener('touchstart', function(e) {
        isResizingTable = true;
        tableResizer.classList.add('dragging');
    }, { passive: true });

    document.addEventListener('touchmove', function(e) {
        if (!isResizingSidebar && !isResizingTable) return;
        const touch = e.touches[0];
        if (isResizingSidebar) {
            let newWidth = touch.clientX;
            if (newWidth < 240) newWidth = 240;
            if (newWidth > 480) newWidth = 480;
            sidebar.style.width = newWidth + 'px';
        } else if (isResizingTable) {
            const mainRect = mainContent.getBoundingClientRect();
            const resizerHeight = tableResizer.offsetHeight;
            let newHeight = mainRect.bottom - touch.clientY - (resizerHeight / 2);
            const maxHeight = mainRect.height * 0.7;
            const minHeight = 120;
            if (newHeight < minHeight) newHeight = minHeight;
            if (newHeight > maxHeight) newHeight = maxHeight;
            resultsPanel.style.height = newHeight + 'px';
        }
        if (window.map) {
            window.map.invalidateSize({ animate: false });
        }
    }, { passive: true });

    document.addEventListener('touchend', function() {
        isResizingSidebar = false;
        isResizingTable = false;
        sidebarResizer.classList.remove('dragging');
        tableResizer.classList.remove('dragging');
        if (window.map) {
            window.map.invalidateSize();
        }
    });
}

// Initialize resizable panels layout
initResizableLayout();

</script>

</body>
</html>
