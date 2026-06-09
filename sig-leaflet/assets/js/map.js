// assets/js/map.js

// Variabel Global
let map;
let drawHandler = null;
let wilayahCount = 0;
let markerCount = 0;

// Sub-maps objects
let subMaps = {
    union: null,
    diffAB: null,
    diffBA: null,
    outside: null,
    intersect: null
};

// Sub-maps layer groups
let subMapLayers = {
    union: L.layerGroup(),
    diffAB: L.layerGroup(),
    diffBA: L.layerGroup(),
    outside: L.layerGroup(),
    intersect: L.layerGroup()
};

// Fungsi pembantu untuk mengonversi index angka menjadi huruf (0 -> A, 1 -> B, 26 -> AA)
function getLetterName(num) {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (num < 26) {
        return letters.charAt(num);
    }
    const first = letters.charAt(Math.floor(num / 26) - 1);
    const second = letters.charAt(num % 26);
    return first + second;
}

// Layer Groups Peta Utama
const wilayahGroup = L.layerGroup();
const markerGroup = L.layerGroup();
const analysisGroup = L.layerGroup();

// Icon Marker Kustom
const customMarkerIcon = L.divIcon({
    className: 'custom-marker-icon',
    html: '<div style="width: 10px; height: 10px; border-radius:50%; background:#fff;"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
});

// Inisialisasi Peta Utama & Sub-maps
function initMap() {
    map = L.map('map').setView([-6.2088, 106.8456], 13);

    // Layer jalanan terang (OSM Voyager)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    // Tambahkan layer group ke peta utama
    wilayahGroup.addTo(map);
    markerGroup.addTo(map);
    analysisGroup.addTo(map);

    // Inisialisasi 5 sub-maps hasil himpunan
    initSubMaps();

    // Sinkronisasi view dari sub-maps ketika peta utama digeser atau dizoom
    map.on('move', syncSubMapsView);
    map.on('zoomend', syncSubMapsView);

    // Event Listener Leaflet Draw saat menggambar selesai
    map.on(L.Draw.Event.CREATED, function (e) {
        const type = drawHandler ? drawHandler.drawingType : null;
        const layer = e.layer;
        const geojson = layer.toGeoJSON().geometry;

        if (type === 'wilayah') {
            const name = "Wilayah " + getLetterName(wilayahCount);
            saveWilayah(name, geojson);
        } else if (type === 'marker') {
            const name = "Marker " + (markerCount + 1);
            saveMarker(name, "", geojson);
        }
        
        if (drawHandler) {
            drawHandler.disable();
            drawHandler = null;
        }
        
        // Sembunyikan instruksi menggambar
        document.getElementById('draw-instruction').style.display = 'none';
    });

    // Load data group pertama kali
    loadGroupData();
}

// Inisialisasi sub-maps
function initSubMaps() {
    const subMapIds = {
        union: 'sub-map-union',
        diffAB: 'sub-map-diff-ab',
        diffBA: 'sub-map-diff-ba',
        outside: 'sub-map-outside',
        intersect: 'sub-map-intersect'
    };

    for (const key in subMapIds) {
        subMaps[key] = L.map(subMapIds[key], {
            zoomControl: false,
            dragging: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            boxZoom: false,
            touchZoom: false,
            keyboard: false
        }).setView([-6.2088, 106.8456], 13);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            maxZoom: 20
        }).addTo(subMaps[key]);

        // Tambahkan layer group pendukung ke sub-maps
        subMapLayers[key].addTo(subMaps[key]);
    }
}

// Sinkronkan koordinat dan zoom level sub-maps dengan peta utama
function syncSubMapsView() {
    const center = map.getCenter();
    const zoom = map.getZoom();
    for (const key in subMaps) {
        if (subMaps[key]) {
            subMaps[key].setView(center, zoom, { animate: false });
        }
    }
}

// Aktifkan mode menggambar kustom
function startDrawing(type) {
    if (drawHandler) drawHandler.disable();

    const instructionEl = document.getElementById('draw-instruction');
    
    if (type === 'wilayah') {
        instructionEl.innerText = "Klik pada peta untuk mulai menggambar wilayah (polygon). Double-klik untuk menyelesaikan.";
        instructionEl.style.display = 'block';
        drawHandler = new L.Draw.Polygon(map, {
            shapeOptions: {
                color: '#2563eb',
                weight: 2,
                fillOpacity: 0.15
            }
        });
        drawHandler.drawingType = 'wilayah';
    } else if (type === 'marker') {
        instructionEl.innerText = "Klik di manapun pada peta untuk meletakkan sebuah marker.";
        instructionEl.style.display = 'block';
        drawHandler = new L.Draw.Marker(map, {
            icon: customMarkerIcon
        });
        drawHandler.drawingType = 'marker';
    }
    
    drawHandler.enable();
}

// Memuat data Wilayah dan Marker dari database
function loadGroupData() {
    fetch(`api/get_group_data.php?group_id=${GROUP_ID}`)
        .then(res => res.json())
        .then(res => {
            if (res.status === 'success') {
                renderGroupData(res.data);
            } else {
                alert('Gagal memuat data: ' + res.message);
            }
        })
        .catch(err => {
            console.error(err);
            alert('Terjadi kesalahan saat memuat data group.');
        });
}

// Menampilkan data wilayah dan marker di peta utama
function renderGroupData(data) {
    // Simpan jumlah wilayah & marker untuk penamaan otomatis
    wilayahCount = data.wilayah ? data.wilayah.length : 0;
    markerCount = data.markers ? data.markers.length : 0;

    // 1. Bersihkan Layer yang Ada di peta utama
    wilayahGroup.clearLayers();
    markerGroup.clearLayers();
    analysisGroup.clearLayers();
    
    const bounds = [];

    // 2. Gambar Semua Wilayah (Polygons)
    const dropdownA = document.getElementById('wilayah_a');
    const dropdownB = document.getElementById('wilayah_b');
    const wilayahList = document.getElementById('wilayah-list');
    
    // Simpan data ID pilihan saat ini agar tidak ter-reset saat di-refresh
    const prevSelectedA = dropdownA.value;
    const prevSelectedB = dropdownB.value;

    // Reset dropdown & lists
    dropdownA.innerHTML = '<option value="">-- Pilih Wilayah A --</option>';
    dropdownB.innerHTML = '<option value="">-- Pilih Wilayah B --</option>';
    wilayahList.innerHTML = '';

    if (data.wilayah && data.wilayah.length > 0) {
        data.wilayah.forEach((w, index) => {
            // Tambahkan ke Dropdowns Analisis
            const optA = document.createElement('option');
            optA.value = w.id;
            optA.innerText = w.nama_wilayah;
            if (w.id == prevSelectedA) optA.selected = true;
            dropdownA.appendChild(optA);

            const optB = document.createElement('option');
            optB.value = w.id;
            optB.innerText = w.nama_wilayah;
            if (w.id == prevSelectedB) optB.selected = true;
            dropdownB.appendChild(optB);

            // Tentukan warna wilayah berbeda secara dinamis
            const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#06b6d4', '#ec4899', '#8b5cf6'];
            const color = colors[index % colors.length];

            // Render ke Peta Utama
            const layer = L.geoJSON(w.geojson, {
                style: {
                    color: color,
                    weight: 2.5,
                    fillColor: color,
                    fillOpacity: 0.18
                }
            }).addTo(wilayahGroup);
            layer.wilayahId = w.id;

            // Bind tooltip permanent di tengah polygon
            layer.bindTooltip(w.nama_wilayah, {
                permanent: true,
                direction: 'center',
                className: 'polygon-tooltip'
            });

            layer.bindPopup(`<strong>${w.nama_wilayah}</strong>`);
            bounds.push(layer.getBounds());

            // Tampilkan di sidebar list dengan tombol Ubah dan Hapus
            wilayahList.innerHTML += `
                <li class="element-item">
                    <span class="element-name" style="color: ${color};"><i class="fas fa-draw-polygon"></i> ${w.nama_wilayah}</span>
                    <div style="display: flex; align-items: center; gap: 0.25rem;">
                        <span class="badge-a" style="background-color: ${color}; font-size: 0.65rem;">Wilayah</span>
                        <button class="btn btn-outline btn-sm" onclick="editWilayah(${w.id}, '${w.nama_wilayah}')" style="padding: 0.15rem 0.35rem; font-size: 0.7rem; color: var(--warning); border-color: var(--warning);" title="Ubah Nama">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deleteWilayah(${w.id}, '${w.nama_wilayah}')" style="padding: 0.15rem 0.35rem; font-size: 0.7rem;" title="Hapus Wilayah">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </li>
            `;
        });
    } else {
        wilayahList.innerHTML = `
            <li class="element-item" style="color: var(--text-secondary); justify-content: center;">
                Belum ada wilayah polygon
            </li>
        `;
    }

    // 3. Gambar Semua Marker (Points)
    const markerListEl = document.getElementById('marker-list');
    markerListEl.innerHTML = '';

    if (data.markers && data.markers.length > 0) {
        data.markers.forEach(m => {
            const coords = m.geojson.coordinates;
            const latlng = [coords[1], coords[0]];

            const marker = L.marker(latlng, { icon: customMarkerIcon }).addTo(markerGroup);
            marker.markerId = m.id;
            marker.bindPopup(`<strong>${m.nama_marker}</strong>`);

            // Tampilkan di list sidebar dengan tombol Ubah dan Hapus
            markerListEl.innerHTML += `
                <li class="element-item">
                    <span class="element-name" style="color: var(--brand-color);"><i class="fas fa-map-marker-alt"></i> ${m.nama_marker}</span>
                    <div style="display: flex; align-items: center; gap: 0.25rem;">
                        <span class="badge-a" style="background-color: var(--brand-color); font-size: 0.65rem;">Marker</span>
                        <button class="btn btn-outline btn-sm" onclick="editMarker(${m.id}, '${m.nama_marker}')" style="padding: 0.15rem 0.35rem; font-size: 0.7rem; color: var(--warning); border-color: var(--warning);" title="Ubah Nama">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deleteMarker(${m.id}, '${m.nama_marker}')" style="padding: 0.15rem 0.35rem; font-size: 0.7rem;" title="Hapus Marker">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </li>
            `;
        });
    } else {
        markerListEl.innerHTML = `
            <li class="element-item" style="color: var(--text-secondary); justify-content: center;">
                Belum ada marker/titik
            </li>
        `;
    }

    // 4. Sesuaikan Zoom Peta agar semua layer terlihat
    if (bounds.length > 0) {
        const combinedBounds = bounds.reduce((acc, cur) => acc.extend(cur));
        map.fitBounds(combinedBounds, { padding: [40, 40] });
    }

    // 5. Trigger analisis ulang jika Wilayah A dan B sudah dipilih untuk mensinkronkan sub-maps
    if (typeof triggerAnalysisSync === 'function') {
        triggerAnalysisSync();
    }
}

// Simpan Wilayah ke Server
function saveWilayah(name, geojson) {
    fetch('api/save_wilayah.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            group_id: GROUP_ID,
            nama_wilayah: name,
            geojson: geojson
        })
    })
    .then(res => res.json())
    .then(res => {
        if (res.status === 'success') {
            loadGroupData();
        } else {
            alert('Gagal menyimpan: ' + res.message);
        }
    })
    .catch(err => {
        console.error(err);
        alert('Terjadi kesalahan saat menyimpan wilayah.');
    });
}

// Simpan Marker ke Server
function saveMarker(name, desc, geojson) {
    fetch('api/save_marker.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            group_id: GROUP_ID,
            nama_marker: name,
            deskripsi: desc,
            geojson: geojson
        })
    })
    .then(res => res.json())
    .then(res => {
        if (res.status === 'success') {
            loadGroupData();
        } else {
            alert('Gagal menyimpan: ' + res.message);
        }
    })
    .catch(err => {
        console.error(err);
        alert('Terjadi kesalahan saat menyimpan marker.');
    });
}

// Hapus wilayah berdasarkan ID
function deleteWilayah(id, name) {
    if (confirm(`Apakah Anda yakin ingin menghapus "${name}"?`)) {
        fetch('api/delete_wilayah.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        })
        .then(res => res.json())
        .then(res => {
            if (res.status === 'success') {
                loadGroupData();
            } else {
                alert('Gagal menghapus: ' + res.message);
            }
        })
        .catch(err => {
            console.error(err);
            alert('Terjadi kesalahan saat menghapus wilayah.');
        });
    }
}

// Hapus marker berdasarkan ID
function deleteMarker(id, name) {
    if (confirm(`Apakah Anda yakin ingin menghapus "${name}"?`)) {
        fetch('api/delete_marker.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        })
        .then(res => res.json())
        .then(res => {
            if (res.status === 'success') {
                loadGroupData();
            } else {
                alert('Gagal menghapus: ' + res.message);
            }
        })
        .catch(err => {
            console.error(err);
            alert('Terjadi kesalahan saat menghapus marker.');
        });
    }
}

// Edit nama wilayah
function editWilayah(id, currentName) {
    const newName = prompt("Ubah nama wilayah:", currentName);
    if (newName === null || newName.trim() === '') return;
    
    fetch('api/update_wilayah.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, nama_wilayah: newName.trim() })
    })
    .then(res => res.json())
    .then(res => {
        if (res.status === 'success') {
            loadGroupData();
        } else {
            alert('Gagal mengubah wilayah: ' + res.message);
        }
    })
    .catch(err => {
        console.error(err);
        alert('Terjadi kesalahan saat mengubah wilayah.');
    });
}

// Edit nama marker
function editMarker(id, currentName) {
    const newName = prompt("Ubah nama marker:", currentName);
    if (newName === null || newName.trim() === '') return;
    
    fetch('api/update_marker.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, nama_marker: newName.trim() })
    })
    .then(res => res.json())
    .then(res => {
        if (res.status === 'success') {
            loadGroupData();
        } else {
            alert('Gagal mengubah marker: ' + res.message);
        }
    })
    .catch(err => {
        console.error(err);
        alert('Terjadi kesalahan saat mengubah marker.');
    });
}

// Jalankan saat halaman terisi
window.onload = function() {
    initMap();
};
