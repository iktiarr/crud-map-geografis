// assets/js/map.js

// Variabel Global
let map;
let drawHandler = null;
let wilayahCount = 0;
let markerCount = 0;

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

// Layer Groups
let boundaryLayer = null;
const wilayahGroup = L.layerGroup();
const markerGroup = L.layerGroup();
const analysisGroup = L.layerGroup();

// Icon Marker Kustom
const customMarkerIcon = L.divIcon({
    className: 'custom-marker-icon',
    html: '<i class="fas fa-map-marker-alt"></i>',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
});

// Inisialisasi Peta
function initMap() {
    // Tentukan koordinat default (Indonesia / Jakarta jika data masih kosong)
    map = L.map('map').setView([-6.2088, 106.8456], 13);

    // Layer jalanan terang (OSM)
    const baseLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    // Tambahkan layer group ke peta
    wilayahGroup.addTo(map);
    markerGroup.addTo(map);
    analysisGroup.addTo(map);

    // Event Listener Leaflet Draw saat menggambar selesai
    map.on(L.Draw.Event.CREATED, function (e) {
        const type = drawHandler ? drawHandler.drawingType : null;
        const layer = e.layer;
        const geojson = layer.toGeoJSON().geometry;

        if (type === 'boundary') {
            saveBoundary("Batas Acuan", geojson);
        } else if (type === 'wilayah') {
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

// Aktifkan mode menggambar kustom
function startDrawing(type) {
    if (drawHandler) drawHandler.disable();

    const instructionEl = document.getElementById('draw-instruction');
    
    if (type === 'boundary') {
        instructionEl.innerText = "Klik pada peta untuk mulai menggambar batas acuan (polygon). Double-klik untuk menyelesaikan.";
        instructionEl.style.display = 'block';
        drawHandler = new L.Draw.Polygon(map, {
            shapeOptions: {
                color: '#e11d48',
                weight: 3,
                dashArray: '6, 6',
                fillOpacity: 0.05
            }
        });
        drawHandler.drawingType = 'boundary';
    } else if (type === 'wilayah') {
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

// Memuat data Boundary, Wilayah, dan Marker dari database
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

// Menampilkan data wilayah dan marker di peta
function renderGroupData(data) {
    // Simpan jumlah wilayah & marker untuk penamaan otomatis
    wilayahCount = data.wilayah ? data.wilayah.length : 0;
    markerCount = data.markers ? data.markers.length : 0;

    // 1. Bersihkan Layer yang Ada
    wilayahGroup.clearLayers();
    markerGroup.clearLayers();
    analysisGroup.clearLayers();
    
    const bounds = [];

    // 3. Gambar Semua Wilayah (Polygons)
    const dropdownA = document.getElementById('wilayah_a');
    const dropdownB = document.getElementById('wilayah_b');
    const wilayahList = document.getElementById('wilayah-list');
    
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
            dropdownA.appendChild(optA);

            const optB = document.createElement('option');
            optB.value = w.id;
            optB.innerText = w.nama_wilayah;
            dropdownB.appendChild(optB);

            // Tentukan warna wilayah (kita ganti-ganti warnanya)
            const colors = ['#2563eb', '#10b981', '#f59e0b', '#06b6d4', '#ec4899'];
            const color = colors[index % colors.length];

            // Render ke Peta
            const layer = L.geoJSON(w.geojson, {
                style: {
                    color: color,
                    weight: 2,
                    fillColor: color,
                    fillOpacity: 0.15
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

            // Tampilkan di sidebar list
            wilayahList.innerHTML += `
                <li class="element-item">
                    <span class="element-name" style="color: ${color};"><i class="fas fa-draw-polygon"></i> ${w.nama_wilayah}</span>
                    <div style="display: flex; align-items: center; gap: 0.35rem;">
                        <span class="badge-a" style="background-color: ${color};">Wilayah</span>
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

    // 4. Gambar Semua Marker (Points)
    const markerListEl = document.getElementById('marker-list');
    markerListEl.innerHTML = '';

    if (data.markers && data.markers.length > 0) {
        data.markers.forEach(m => {
            // Dapatkan koordinat GeoJSON Point [Lng, Lat]
            const coords = m.geojson.coordinates;
            // Leaflet butuh [Lat, Lng]
            const latlng = [coords[1], coords[0]];

            // Custom HTML marker icon
            const markerIcon = L.divIcon({
                className: `custom-marker-icon marker-item-${m.id}`,
                html: '<div style="width: 10px; height: 10px; border-radius:50%; background:#fff;"></div>',
                iconSize: [20, 20],
                iconAnchor: [10, 10],
                popupAnchor: [0, -10]
            });

            const marker = L.marker(latlng, { icon: markerIcon }).addTo(markerGroup);
            marker.markerId = m.id;
            marker.bindPopup(`<strong>${m.nama_marker}</strong><br>${m.deskripsi || 'Tidak ada deskripsi'}`);

            // Tampilkan di list sidebar
            markerListEl.innerHTML += `
                <li class="element-item">
                    <span class="element-name" style="color: var(--brand-color);"><i class="fas fa-map-marker-alt"></i> ${m.nama_marker}</span>
                    <div style="display: flex; align-items: center; gap: 0.35rem;">
                        <span class="badge-a" style="background-color: var(--brand-color);">Marker</span>
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

    // 5. Sesuaikan Zoom Peta agar semua layer terlihat
    if (bounds.length > 0) {
        const combinedBounds = bounds.reduce((acc, cur) => acc.extend(cur));
        map.fitBounds(combinedBounds, { padding: [40, 40] });
    }
}

// Simpan Boundary ke Server
function saveBoundary(name, geojson) {
    fetch('api/save_boundary.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            group_id: GROUP_ID,
            nama_boundary: name,
            geojson: geojson
        })
    })
    .then(res => res.json())
    .then(res => {
        if (res.status === 'success') {
            alert(res.message);
            loadGroupData();
        } else {
            alert('Gagal menyimpan: ' + res.message);
        }
    })
    .catch(err => {
        console.error(err);
        alert('Terjadi kesalahan saat menyimpan boundary.');
    });
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
            alert(res.message);
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
            alert(res.message);
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

// Jalankan saat halaman terisi
window.onload = function() {
    initMap();
};
