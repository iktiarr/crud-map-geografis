// =====================================================
// TEMA TERANG (SELALU TERANG)
// =====================================================
function applyTheme() {
    document.documentElement.setAttribute('data-theme', 'light');
}
applyTheme();

// =====================================================
// PANDUAN / TUTORIAL DIALOG FUNCTIONS
// =====================================================
function openTutorialDialog() {
    const el = document.getElementById('tutorial-dialog');
    if (el) el.classList.add('show');
}
function closeTutorialDialog() {
    const el = document.getElementById('tutorial-dialog');
    if (el) el.classList.remove('show');
}
function closeTutorialDialogOnBackdrop(event) {
    if (event.target === document.getElementById('tutorial-dialog')) {
        closeTutorialDialog();
    }
}

// =====================================================
// TOGGLE ACCORDION SECTIONS FROM SWITCHES
// =====================================================
function toggleFeatureSection(accordionId, isChecked) {
    let itemId = '';
    if (accordionId === 'acc-overlays') itemId = 'accordion-item-overlays';
    else if (accordionId === 'acc-preview') itemId = 'accordion-item-preview';
    else if (accordionId === 'acc-spatial') itemId = 'accordion-item-spatial';
    else if (accordionId === 'acc-draw') itemId = 'accordion-item-draw';
    
    const item = document.getElementById(itemId);
    if (!item) return;
    
    if (isChecked) {
        item.style.display = 'block';
    } else {
        item.style.display = 'none';
        
        // Also if it is active/open, let's close it so it is not active
        const content = document.getElementById(accordionId);
        const trigger = item.querySelector('.accordion-trigger');
        if (content && content.classList.contains('show')) {
            content.classList.remove('show');
            if (trigger) trigger.classList.remove('active');
            
            // If it was spatial, trigger layout update
            if (accordionId === 'acc-spatial') {
                updateWorkspaceView();
            }
        }
    }
}

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
    setTimeout(() => { 
        el.style.opacity = '0'; 
        el.style.transition = 'opacity .2s'; 
        setTimeout(() => el.remove(), 200); 
    }, 3200);
}

// =====================================================
// ACCORDION TOGGLER
// =====================================================
function toggleAccordion(id, btn) {
    const content = document.getElementById(id);
    if (!content) return;
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
            if (typeof syncSubMapsView === 'function') {
                syncSubMapsView();
            }
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
// CAPITALIZE HELPER
// =====================================================
function capitalize(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// =====================================================
// KONFIGURASI WARNA MARKER PER JENIS
// =====================================================
const JENIS_CONFIG = {
    'Puskesmas':  { color: '#38bdf8', icon: 'fas fa-clinic-medical' },
    'Rumah Sakit':{ color: '#f87171', icon: 'fas fa-hospital' },
    'Klinik':     { color: '#a5b4fc', icon: 'fas fa-stethoscope' },
    'Apotek':     { color: '#4ade80', icon: 'fas fa-pills' },
};

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
const drawingsLayer = L.layerGroup().addTo(map);

let activeData    = [];
let activeColumns = [];
let tablesList    = [];
let currentPage   = 1;
const pageSize    = 50;

// Variables for Feature 4: Buat Gambar
let currentDrawingColor = '#ef4444';
let savedDrawingsData = [];

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

// =====================================================
// GLOBAL INITIALIZATION EVENT
// =====================================================
window.addEventListener('DOMContentLoaded', async () => {
    try {
        // Bind map events for sync
        if (typeof syncSubMapsView === 'function') {
            map.on('move', syncSubMapsView);
            map.on('zoomend', syncSubMapsView);
        }

        // Initialize sub-maps
        if (typeof initSubMaps === 'function') {
            initSubMaps();
        }

        // Ambil daftar tabel, elemen kustom, dan gambar kustom secara paralel
        const [tablesData] = await Promise.all([
            fetch('api/get_tables.php').then(r => r.json()),
            typeof loadCustomGeometries === 'function' ? loadCustomGeometries() : Promise.resolve(),
            typeof loadDrawings === 'function' ? loadDrawings() : Promise.resolve()
        ]);
        
        if (tablesData.status === 'success' && tablesData.tables.length) {
            tablesList = tablesData.tables; 
            
            if (typeof populateOverlayDropdown === 'function') populateOverlayDropdown();
            if (typeof populatePreviewDropdown === 'function') populatePreviewDropdown();
            if (typeof populateSpatialAnalysisDropdowns === 'function') populateSpatialAnalysisDropdowns();
            
            const defaultTable = tablesList.some(t => t.table_name === 'fasilitas_kesehatan') ? 'fasilitas_kesehatan' : tablesList[0].table_name;
            const previewSelect = document.getElementById('preview-table-select');
            if (previewSelect) {
                previewSelect.value = defaultTable;
            }
            if (typeof previewTable === 'function') {
                await previewTable();
            }
        }
    } catch (e) {
        console.error('Error in init:', e);
        toast('Gagal menginisialisasi control panel', 'error');
    }
});
