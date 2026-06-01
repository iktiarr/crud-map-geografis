<?php
/**
 * CRUD Peta Interaktif - Clean White & Green Glassmorphism
 * Menjaga logika tetap ringan & stabil sesuai revisi user.
 */

error_reporting(0);
ini_set('display_errors', 0);
ob_start();

$db_config = [
    'host' => 'localhost',
    'port' => '5432',
    'dbname' => 'uts_sig',
    'user' => 'postgres',
    'password' => 'admin123'
];

$conn = @pg_connect("host={$db_config['host']} port={$db_config['port']} dbname={$db_config['dbname']} user={$db_config['user']} password={$db_config['password']}");

if (!$conn) {
    die("Koneksi Database Gagal: " . pg_last_error());
}

$check_table = pg_query($conn, "SELECT 1 FROM information_schema.tables WHERE table_name = 'markers'");
if (pg_num_rows($check_table) == 0) {
    $create_table = "CREATE TABLE markers (
        id SERIAL PRIMARY KEY,
        nama VARCHAR(255),
        tipe VARCHAR(50),
        warna VARCHAR(50) DEFAULT '#10b981',
        geom GEOMETRY(GEOMETRY, 4326)
    )";
    pg_query($conn, $create_table);
} else {
    // Ensure warna column exists if table already exists
    pg_query($conn, "ALTER TABLE markers ADD COLUMN IF NOT EXISTS warna VARCHAR(50) DEFAULT '#10b981'");
}

if (isset($_GET['action'])) {
    header('Content-Type: application/json');
    $action = $_GET['action'];

    if ($action === 'list') {
        $sql = "SELECT id, nama, warna, ST_AsGeoJSON(geom) AS geojson FROM markers ORDER BY id DESC";
        $rs = pg_query($conn, $sql);
        $features = [];
        while ($row = pg_fetch_assoc($rs)) {
            $features[] = [
                'type' => 'Feature',
                'geometry' => json_decode($row['geojson']),
                'properties' => [
                    'id' => $row['id'],
                    'nama' => $row['nama'],
                    'warna' => $row['warna'] ?: '#10b981'
                ]
            ];
        }
        ob_clean();
        echo json_encode(['type' => 'FeatureCollection', 'features' => $features]);
        exit;
    }

    if ($action === 'save' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $id = isset($_POST['id']) && $_POST['id'] !== '' ? (int)$_POST['id'] : null;
        $nama = trim($_POST['nama']);
        if (empty($nama)) { $nama = "Lokasi Tanpa Nama"; }
        $nama = pg_escape_string($conn, $nama);
        $warna = pg_escape_string($conn, $_POST['warna'] ?: '#10b981');
        $geojson = $_POST['geojson'];

        if (empty($geojson)) {
            ob_clean();
            echo json_encode(['status' => 'error', 'message' => 'Geometri kosong, gambar dulu di peta.']);
            exit;
        }

        if ($id > 0) {
            $sql = "UPDATE markers SET nama='$nama', warna='$warna', geom=ST_SetSRID(ST_GeomFromGeoJSON('$geojson'), 4326) WHERE id=$id";
        } else {
            $sql = "INSERT INTO markers (nama, warna, geom) VALUES ('$nama', '$warna', ST_SetSRID(ST_GeomFromGeoJSON('$geojson'), 4326))";
        }

        $rs = pg_query($conn, $sql);
        ob_clean();
        if ($rs) { echo json_encode(['status' => 'success']); } 
        else { echo json_encode(['status' => 'error', 'message' => pg_last_error($conn)]); }
        exit;
    }

    if ($action === 'update_geom' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $id = (int)$_POST['id'];
        $geojson = $_POST['geojson'];
        $sql = "UPDATE markers SET geom=ST_SetSRID(ST_GeomFromGeoJSON('$geojson'), 4326) WHERE id=$id";
        pg_query($conn, $sql);
        ob_clean();
        echo json_encode(['status' => 'success']);
        exit;
    }

    if ($action === 'delete' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $id = (int)$_POST['id'];
        $sql = "DELETE FROM markers WHERE id=$id";
        pg_query($conn, $sql);
        ob_clean();
        echo json_encode(['status' => 'success']);
        exit;
    }
}
ob_end_flush();
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GIS Manager | Emerald Clean</title>
    
    <!-- Google Fonts: Inter -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap" rel="stylesheet">
    
    <!-- Libraries -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css" />
    <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js"></script>
    <!-- Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>

    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: { sans: ['Inter', 'sans-serif'] },
                    colors: {
                        accent: {
                            50: '#ecfdf5',
                            100: '#d1fae5',
                            500: '#10b981',
                            600: '#059669',
                            700: '#047857',
                        }
                    }
                }
            }
        }
    </script>

    <style>
        body { 
            background-color: #f9fafb;
            background-image: radial-gradient(at 0% 0%, rgba(16, 185, 129, 0.05) 0px, transparent 50%), 
                              radial-gradient(at 100% 100%, rgba(16, 185, 129, 0.05) 0px, transparent 50%);
            color: #1f2937;
        }

        .glass-card { 
            background: rgba(255, 255, 255, 0.8); 
            backdrop-filter: blur(8px); 
            border: 1px solid rgba(229, 231, 235, 0.5);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
        }

        .input-emerald { 
            @apply w-full bg-white border border-gray-200 p-3 rounded-xl outline-none transition-all duration-200;
        }
        .input-emerald:focus { 
            @apply border-emerald-500 ring-4 ring-emerald-500/10;
        }

        #map { 
            height: calc(100vh - 100px); 
            min-height: 500px;
            width: 100%; 
            border-radius: 0.75rem; /* rounded-xl */
            z-index: 10; 
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05);
        }

        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        .sidebar-container {
            height: calc(100vh - 100px);
            min-height: 500px;
        }

        .table-scroll {
            height: 100%;
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: #e5e7eb transparent;
        }

        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        
        /* Table enhancements */
        .table-row-hover:hover { background-color: rgba(16, 185, 129, 0.02); }
    </style>
</head>
<body class="p-4 md:p-8 custom-scrollbar">

    <div class="max-w-[1600px] mx-auto">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            <!-- Map Panel (Left) -->
            <div class="lg:col-span-7 space-y-6">
                <div class="glass-card rounded-xl p-2 overflow-hidden">
                    <div id="map"></div>
                </div>
            </div>

            <!-- Sidebar Panel (Right) -->
            <div class="lg:col-span-5 sidebar-container flex flex-col gap-6">
                
                <!-- Form Section -->
                <div class="glass-card rounded-xl p-6 shadow-sm shrink-0">
                    <form id="crudForm" class="space-y-4">
                        <div id="formStatus" class="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center justify-between">
                            <span>Mode: Tambah Baru</span>
                            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        </div>
                        <input type="hidden" id="data_id" name="id">
                        <input type="hidden" id="data_geojson" name="geojson">
                        <input type="hidden" id="data_warna" name="warna" value="#10b981">
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                            
                            <!-- Bagian Kiri: Nama & Kirim -->
                            <div class="space-y-4">
                                <div class="space-y-2">
                                    <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Nama Lokasi</label>
                                    <input type="text" id="data_nama" name="nama" 
                                        class="w-full bg-white border border-gray-200 p-3.5 rounded-xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-gray-700 shadow-sm" 
                                        placeholder="Nama tempat..." required>
                                </div>
                                <div class="flex gap-2">
                                    <button type="submit" id="btnSubmit" 
                                        class="flex-grow bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95">
                                        Simpan Data
                                    </button>
                                    <button type="button" onclick="resetForm()" 
                                        class="bg-gray-100 hover:bg-gray-200 text-gray-500 p-3.5 rounded-xl transition-all" title="Reset">
                                        <i data-lucide="refresh-ccw" class="w-5 h-5"></i>
                                    </button>
                                </div>
                            </div>

                            <!-- Bagian Kanan: Warna Grid -->
                            <div class="space-y-2">
                                <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Pilih Warna</label>
                                <div class="grid grid-cols-8 gap-2 pt-1" id="colorPicker">
                                    <button type="button" onclick="setColor('#10b981')" class="color-dot w-7 h-7 rounded-lg border-2 border-white ring-2 ring-emerald-500 bg-[#10b981] transition-all scale-110" data-color="#10b981"></button>
                                    <button type="button" onclick="setColor('#14b8a6')" class="color-dot w-7 h-7 rounded-lg border-2 border-white bg-[#14b8a6] transition-all hover:scale-110" data-color="#14b8a6"></button>
                                    <button type="button" onclick="setColor('#06b6d4')" class="color-dot w-7 h-7 rounded-lg border-2 border-white bg-[#06b6d4] transition-all hover:scale-110" data-color="#06b6d4"></button>
                                    <button type="button" onclick="setColor('#0ea5e9')" class="color-dot w-7 h-7 rounded-lg border-2 border-white bg-[#0ea5e9] transition-all hover:scale-110" data-color="#0ea5e9"></button>
                                    <button type="button" onclick="setColor('#3b82f6')" class="color-dot w-7 h-7 rounded-lg border-2 border-white bg-[#3b82f6] transition-all hover:scale-110" data-color="#3b82f6"></button>
                                    <button type="button" onclick="setColor('#6366f1')" class="color-dot w-7 h-7 rounded-lg border-2 border-white bg-[#6366f1] transition-all hover:scale-110" data-color="#6366f1"></button>
                                    <button type="button" onclick="setColor('#8b5cf6')" class="color-dot w-7 h-7 rounded-lg border-2 border-white bg-[#8b5cf6] transition-all hover:scale-110" data-color="#8b5cf6"></button>
                                    <button type="button" onclick="setColor('#a855f7')" class="color-dot w-7 h-7 rounded-lg border-2 border-white bg-[#a855f7] transition-all hover:scale-110" data-color="#a855f7"></button>
                                    <button type="button" onclick="setColor('#d946ef')" class="color-dot w-7 h-7 rounded-lg border-2 border-white bg-[#d946ef] transition-all hover:scale-110" data-color="#d946ef"></button>
                                    <button type="button" onclick="setColor('#ec4899')" class="color-dot w-7 h-7 rounded-lg border-2 border-white bg-[#ec4899] transition-all hover:scale-110" data-color="#ec4899"></button>
                                    <button type="button" onclick="setColor('#f43f5e')" class="color-dot w-7 h-7 rounded-lg border-2 border-white bg-[#f43f5e] transition-all hover:scale-110" data-color="#f43f5e"></button>
                                    <button type="button" onclick="setColor('#ef4444')" class="color-dot w-7 h-7 rounded-lg border-2 border-white bg-[#ef4444] transition-all hover:scale-110" data-color="#ef4444"></button>
                                    <button type="button" onclick="setColor('#f97316')" class="color-dot w-7 h-7 rounded-lg border-2 border-white bg-[#f97316] transition-all hover:scale-110" data-color="#f97316"></button>
                                    <button type="button" onclick="setColor('#f59e0b')" class="color-dot w-7 h-7 rounded-lg border-2 border-white bg-[#f59e0b] transition-all hover:scale-110" data-color="#f59e0b"></button>
                                    <button type="button" onclick="setColor('#eab308')" class="color-dot w-7 h-7 rounded-lg border-2 border-white bg-[#eab308] transition-all hover:scale-110" data-color="#eab308"></button>
                                    <button type="button" onclick="setColor('#84cc16')" class="color-dot w-7 h-7 rounded-lg border-2 border-white bg-[#84cc16] transition-all hover:scale-110" data-color="#84cc16"></button>
                                    
                                    <!-- Custom Picker -->
                                    <div class="relative w-7 h-7">
                                        <input type="color" id="customColor" class="absolute inset-0 opacity-0 cursor-pointer w-full h-full" oninput="setColor(this.value)">
                                        <div id="customIndicator" class="w-full h-full rounded-lg border-2 border-white shadow-sm bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-400">
                                            <i data-lucide="plus" class="w-3 h-3"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <!-- Table Section -->
                <div class="glass-card rounded-xl overflow-hidden flex-grow flex flex-col min-h-0 shadow-sm">
                    <div class="p-4 border-b border-gray-100/50 bg-white/50 flex justify-between items-center shrink-0">
                        <h3 class="text-xs font-extrabold text-gray-500 uppercase tracking-tighter">Data Terdaftar</h3>
                        <div class="flex gap-2 text-[9px] font-bold uppercase text-gray-400">
                            <button onclick="currentSort='nama'; loadData();" class="hover:text-emerald-500 transition-colors">Sort Nama</button>
                            <span>•</span>
                            <button onclick="currentSort='tipe'; loadData();" class="hover:text-emerald-500 transition-colors">Sort Jenis</button>
                        </div>
                    </div>
                    <div class="table-scroll no-scrollbar">
                        <table class="w-full text-left border-collapse">
                            <thead class="bg-gray-50/50 sticky top-0 z-20 backdrop-blur-md">
                                <tr class="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                    <th class="px-5 py-4">Data & Jenis</th>
                                    <th class="px-5 py-4">Koordinat Detail</th>
                                    <th class="px-5 py-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody id="tableBody" class="divide-y divide-gray-50/50">
                                <!-- Data injected here -->
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    </div>

    <script>
        const map = L.map('map').setView([-2.5, 118], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap',
            maxZoom: 19
        }).addTo(map);

        function getMarkerIcon(color = '#10b981', active = false) {
            return L.divIcon({ 
                className: `${active ? 'animate-pulse' : ''} w-4 h-4 rounded-full border-2 border-white shadow-md ring-4`,
                html: `<div class="w-full h-full rounded-full" style="background-color: ${color}; box-shadow: 0 0 0 4px ${color}33"></div>`,
                iconSize: [16, 16],
                iconAnchor: [8, 8]
            });
        }

        const drawnItems = new L.FeatureGroup().addTo(map);
        let activeLayer = null;
        let currentSort = 'id';

        function setColor(hex) {
            document.getElementById('data_warna').value = hex;
            let found = false;
            document.querySelectorAll('.color-dot').forEach(dot => {
                const dotColor = dot.getAttribute('data-color');
                if (dotColor === hex) {
                    dot.classList.add('scale-110', 'ring-2');
                    dot.style.ringColor = hex;
                    found = true;
                } else {
                    dot.classList.remove('scale-110', 'ring-2');
                }
            });

            const customIndicator = document.getElementById('customIndicator');
            if (!found) {
                customIndicator.style.backgroundColor = hex;
                customIndicator.classList.add('scale-110', 'ring-2');
                customIndicator.style.ringColor = hex;
                customIndicator.innerHTML = '';
            } else {
                customIndicator.style.backgroundColor = '';
                customIndicator.classList.remove('scale-110', 'ring-2');
                customIndicator.innerHTML = '<i data-lucide="plus" class="w-3 h-3"></i>';
                lucide.createIcons();
            }

            // If editing, apply color immediately
            if (activeLayer) {
                if (activeLayer instanceof L.Marker) {
                    activeLayer.setIcon(getMarkerIcon(hex, true));
                } else {
                    activeLayer.setStyle({ color: hex });
                }
            }
        }

        async function fetchAddress(lat, lng) {
            const input = document.getElementById('data_nama');
            input.value = "Mencari alamat...";
            input.classList.add('animate-pulse', 'text-gray-400');
            
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
                const data = await res.json();
                const address = data.name || data.display_name.split(',')[0] || "Lokasi Baru";
                input.value = address;
            } catch (e) {
                input.value = "Lokasi Baru";
            } finally {
                input.classList.remove('animate-pulse', 'text-gray-400');
            }
        }

        const drawControl = new L.Control.Draw({
            edit: false,
            draw: {
                circle: false, circlemarker: false, rectangle: false,
                marker: { icon: getMarkerIcon('#10b981') },
                polyline: { shapeOptions: { color: '#10b981', weight: 4 } },
                polygon: { shapeOptions: { color: '#10b981', weight: 3, fillOpacity: 0.1 } }
            }
        });
        map.addControl(drawControl);

        function showToast(msg, type = 'success') {
            const toast = document.createElement('div');
            toast.className = `fixed bottom-8 right-8 px-6 py-3 rounded-xl text-white font-bold shadow-2xl z-[9999] transition-all transform translate-y-20 opacity-0 ${type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`;
            toast.textContent = msg;
            document.body.appendChild(toast);
            setTimeout(() => { toast.classList.remove('translate-y-20', 'opacity-0'); }, 100);
            setTimeout(() => { 
                toast.classList.add('translate-y-20', 'opacity-0');
                setTimeout(() => toast.remove(), 500);
            }, 3000);
        }

        function formatKoordinat(geom) {
            if (!geom || !geom.coordinates) return '-';
            
            let coords = [];
            if (geom.type === 'Point') {
                coords = [geom.coordinates];
            } else if (geom.type === 'LineString') {
                coords = geom.coordinates;
            } else if (geom.type === 'Polygon') {
                coords = geom.coordinates[0];
            }
            
            const badges = coords.map(c => 
                `<span class="inline-flex items-center px-2 py-1 rounded-md text-[9px] font-mono font-bold bg-emerald-50 text-emerald-600 border border-emerald-100/50 shadow-sm">
                    ${c[1].toFixed(5)}, ${c[0].toFixed(5)}
                </span>`
            ).join('');
            
            if (coords.length > 1) {
                return `
                    <details class="group">
                        <summary class="list-none cursor-pointer flex items-center gap-2 text-[9px] font-bold text-emerald-600 bg-emerald-50/50 px-3 py-1.5 rounded-lg border border-emerald-100/30 hover:bg-emerald-100/50 transition-all">
                            <i data-lucide="plus-circle" class="w-3 h-3 group-open:hidden"></i>
                            <i data-lucide="minus-circle" class="w-3 h-3 hidden group-open:block"></i>
                            <span>Lihat ${coords.length} Titik</span>
                        </summary>
                        <div class="flex flex-wrap gap-1.5 mt-2 max-w-[220px] max-h-[100px] overflow-y-auto no-scrollbar p-1">
                            ${badges}
                        </div>
                    </details>`;
            }
            
            return `<div class="flex flex-wrap gap-1.5 p-1">${badges}</div>`;
        }

        function syncActiveLayerGeom() {
            if (activeLayer) {
                document.getElementById('data_geojson').value = JSON.stringify(activeLayer.toGeoJSON().geometry);
            }
        }

        async function loadData() {
            if (activeLayer) return;
            const res = await fetch('?action=list');
            const data = await res.json();
            
            let features = data.features;
            
            // Auto-detect type
            features.forEach(f => {
                f.properties.tipe = f.geometry.type;
            });

            // Sorting
            if (currentSort === 'nama') {
                features.sort((a, b) => a.properties.nama.localeCompare(b.properties.nama));
            } else if (currentSort === 'tipe') {
                features.sort((a, b) => a.properties.tipe.localeCompare(b.properties.tipe));
            } else {
                features.sort((a, b) => b.properties.id - a.properties.id);
            }
            
            drawnItems.clearLayers();
            const tbody = document.getElementById('tableBody');
            tbody.innerHTML = '';

            features.forEach(f => {
                const p = f.properties;
                const g = f.geometry;
                const color = p.warna;
                const typeIcon = g.type === 'Point' ? 'map-pin' : (g.type === 'LineString' ? 'share-2' : 'box');
                const typeLabel = g.type.replace('LineString', 'Line');
                
                const tempLayer = L.geoJSON(f, {
                    pointToLayer: (feature, latlng) => L.marker(latlng, { icon: getMarkerIcon(color) }),
                    style: { color: color, weight: 4, fillOpacity: 0.1 }
                });

                const layer = tempLayer.getLayers()[0];
                layer.options.dbId = parseInt(p.id);
                layer.options.nama = p.nama;
                layer.options.warna = color;
                
                layer.on('click', () => pilihEdit(p.id));
                layer.on('dragend edit', syncActiveLayerGeom);
                
                drawnItems.addLayer(layer);

                const tr = document.createElement('tr');
                tr.className = "table-row-hover transition-colors group";
                tr.innerHTML = `
                    <td class="px-5 py-4">
                        <div class="flex items-center gap-3">
                            <div class="p-2 rounded-xl bg-gray-50 group-hover:bg-white transition-colors border border-gray-100">
                                <i data-lucide="${typeIcon}" class="w-3.5 h-3.5" style="color: ${color}"></i>
                            </div>
                            <div>
                                <div class="font-bold text-gray-700 text-xs">${p.nama}</div>
                                <div class="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">${typeLabel}</div>
                            </div>
                        </div>
                    </td>
                    <td class="px-5 py-4">${formatKoordinat(g)}</td>
                    <td class="px-5 py-4 text-right">
                        <div class="flex justify-end gap-1">
                            <button onclick="fokusKe(${p.id})" class="p-2 text-amber-500 hover:bg-amber-50 rounded-xl transition-all" title="Lihat">
                                <i data-lucide="eye" class="w-4 h-4"></i>
                            </button>
                            <button onclick="pilihEdit(${p.id})" class="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="Ubah Data">
                                <i data-lucide="edit-3" class="w-4 h-4"></i>
                            </button>
                            <button onclick="hapusData(${p.id})" class="p-2 text-rose-400 hover:bg-rose-50 rounded-xl transition-all" title="Hapus">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            lucide.createIcons();
        }

        map.on(L.Draw.Event.CREATED, async function (e) {
            const layer = e.layer;
            const color = document.getElementById('data_warna').value;
            drawnItems.addLayer(layer);
            pilihEditManual(layer);
            
            // Apply color to the new layer
            if (layer instanceof L.Marker) {
                layer.setIcon(getMarkerIcon(color, true));
            } else {
                layer.setStyle({ color: color });
            }
            const nameInput = document.getElementById('data_nama');
            
            if (e.layerType === 'marker') {
                const latlng = layer.getLatLng();
                await fetchAddress(latlng.lat, latlng.lng);
            } else {
                nameInput.value = '';
                nameInput.placeholder = "Wajib: Masukkan nama area/garis...";
                nameInput.focus();
            }

            document.getElementById('data_geojson').value = JSON.stringify(layer.toGeoJSON().geometry);
            
            document.getElementById('btnSubmit').textContent = 'Simpan Lokasi Baru';
            document.getElementById('btnSubmit').className = 'flex-grow bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all';
        });

        function pilihEditManual(layer) {
            drawnItems.eachLayer(l => { if (l !== layer) map.removeLayer(l); });
            activeLayer = layer;
            const color = document.getElementById('data_warna').value || layer.options.warna || '#10b981';
            
            if (layer instanceof L.Marker) {
                layer.setIcon(getMarkerIcon(color, true));
                if (layer.dragging) layer.dragging.enable();
            } else {
                layer.setStyle({ color: color, fillOpacity: 0.3 });
                if (layer.editing) layer.editing.enable();
            }
            if (!map.hasLayer(layer)) map.addLayer(layer);
        }

        function pilihEdit(id) {
            const targetId = parseInt(id);
            drawnItems.eachLayer(layer => {
                if (layer.options.dbId === targetId) {
                    setColor(layer.options.warna);
                    pilihEditManual(layer);
                    document.getElementById('data_id').value = targetId;
                    document.getElementById('data_nama').value = layer.options.nama;
                    document.getElementById('data_geojson').value = JSON.stringify(layer.toGeoJSON().geometry);
                    
                    document.getElementById('formStatus').innerHTML = `<span>Mode: Edit Data</span><span class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>`;
                    document.getElementById('formStatus').className = "bg-rose-50 text-rose-700 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center justify-between";
                    document.getElementById('btnSubmit').textContent = 'Simpan Perubahan';
                    const submitColorClass = layer.options.warna === '#10b981' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-gray-800 hover:bg-black';
                    document.getElementById('btnSubmit').className = `flex-grow text-white font-bold py-3.5 rounded-xl shadow-lg transition-all ${submitColorClass}`;

                    const bounds = layer.getBounds ? layer.getBounds() : L.latLngBounds([layer.getLatLng()]);
                    map.flyToBounds(bounds, { padding: [100, 100], duration: 0.5 });
                } else {
                    map.removeLayer(layer);
                }
            });
        }

        function fokusKe(id) {
            const targetId = parseInt(id);
            drawnItems.eachLayer(layer => {
                if (layer.options.dbId === targetId) {
                    const bounds = layer.getBounds ? layer.getBounds() : L.latLngBounds([layer.getLatLng()]);
                    map.flyToBounds(bounds, { padding: [100, 100], duration: 0.5 });
                    L.popup()
                        .setLatLng(layer.getBounds ? layer.getBounds().getCenter() : layer.getLatLng())
                        .setContent(`<div class="font-bold text-emerald-600">${layer.options.nama || "Lokasi"}</div>`)
                        .openOn(map);
                }
            });
        }

        document.getElementById('crudForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btnSubmit');
            const originalText = btn.textContent;
            btn.textContent = 'Memproses...';
            btn.disabled = true;

            if (activeLayer) syncActiveLayerGeom();

            const formData = new FormData(e.target);
            try {
                const res = await fetch('?action=save', { method: 'POST', body: formData });
                const result = await res.json();
                if (result.status === 'success') {
                    showToast(formData.get('id') ? 'Data diperbarui!' : 'Data disimpan!');
                    resetForm();
                } else {
                    showToast('Gagal: ' + result.message, 'error');
                }
            } catch (err) { 
                showToast('Kesalahan jaringan', 'error');
            } finally {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });

        function resetForm() {
            document.getElementById('crudForm').reset();
            setColor('#10b981');
            document.getElementById('data_id').value = '';
            document.getElementById('data_geojson').value = '';
            document.getElementById('btnSubmit').textContent = 'Simpan Data';
            document.getElementById('btnSubmit').className = 'flex-grow bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all';
            document.getElementById('formStatus').innerHTML = `<span>Mode: Tambah Baru</span><span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>`;
            document.getElementById('formStatus').className = "bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center justify-between";

            drawnItems.eachLayer(layer => {
                const color = layer.options.warna || '#10b981';
                if (layer instanceof L.Marker) {
                    if (layer.dragging) layer.dragging.disable();
                    layer.setIcon(getMarkerIcon(color));
                } else {
                    if (layer.editing) layer.editing.disable();
                    layer.setStyle({ color: color, fillOpacity: 0.1 });
                }
                if (!map.hasLayer(layer)) map.addLayer(layer);
            });

            activeLayer = null;
            loadData(); 
        }

        async function hapusData(id) {
            if (confirm("Hapus data ini?")) {
                const fd = new FormData(); fd.append('id', id);
                const res = await fetch('?action=delete', { method: 'POST', body: fd });
                const result = await res.json();
                if (result.status === 'success') {
                    showToast('Terhapus');
                    resetForm();
                } else {
                    showToast('Gagal hapus', 'error');
                }
            }
        }

        loadData();
    </script>
</body>
</html>