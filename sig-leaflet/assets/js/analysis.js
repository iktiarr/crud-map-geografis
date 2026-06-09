// assets/js/analysis.js

// Fungsi helper untuk menghasilkan icon marker berwarna kustom
function getColoredMarkerIcon(bgColor) {
    return L.divIcon({
        className: 'custom-sub-marker',
        html: `<div style="width: 20px; height: 20px; border-radius: 50%; background: ${bgColor}; border: 2px solid #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center;"><div style="width: 6px; height: 6px; border-radius: 50%; background: #fff;"></div></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        popupAnchor: [0, -10]
    });
}

// Fungsi utama untuk mensinkronkan seluruh 5 sub-maps
function triggerAnalysisSync() {
    const wilayahA = document.getElementById('wilayah_a').value;
    const wilayahB = document.getElementById('wilayah_b').value;

    // Jika salah satu wilayah belum dipilih, bersihkan seluruh sub-map
    if (!wilayahA || !wilayahB || wilayahA === wilayahB) {
        clearAllSubMaps();
        return;
    }

    // Ambil data GeoJSON referensi Wilayah A dan Wilayah B langsung dari peta utama
    let geojsonA = null;
    let geojsonB = null;
    
    wilayahGroup.eachLayer(function(layer) {
        if (layer.wilayahId == wilayahA) geojsonA = layer.toGeoJSON();
        if (layer.wilayahId == wilayahB) geojsonB = layer.toGeoJSON();
    });

    // Jalankan ke-5 query spasial secara bersamaan
    fetchUnion(wilayahA, wilayahB, geojsonA, geojsonB);
    fetchDiffAB(wilayahA, wilayahB, geojsonA, geojsonB);
    fetchDiffBA(wilayahA, wilayahB, geojsonA, geojsonB);
    fetchOutside(wilayahA, wilayahB, geojsonA, geojsonB);
    fetchIntersect(wilayahA, wilayahB, geojsonA, geojsonB);
}

// Membersihkan seluruh layer dan badge angka pada sub-maps
function clearAllSubMaps() {
    for (const key in subMapLayers) {
        if (subMapLayers[key]) {
            subMapLayers[key].clearLayers();
        }
    }
    document.getElementById('badge-union').innerText = '0 Titik';
    document.getElementById('badge-diff-ab').innerText = '0 Titik';
    document.getElementById('badge-diff-ba').innerText = '0 Titik';
    document.getElementById('badge-outside').innerText = '0 Titik';
    document.getElementById('badge-intersect').innerText = '0 Titik';
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

// 1. Fetch & Render: Wilayah A dan B (Union)
function fetchUnion(wilayahA, wilayahB, geojsonA, geojsonB) {
    const lg = subMapLayers.union;
    lg.clearLayers();
    drawReferenceOutlines(lg, geojsonA, geojsonB);

    fetch('api/analysis_union.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wilayah_a: wilayahA, wilayah_b: wilayahB })
    })
    .then(res => res.json())
    .then(res => {
        if (res.status === 'success') {
            // Update badge jumlah marker
            document.getElementById('badge-union').innerText = (res.markers ? res.markers.length : 0) + ' Titik';
            
            // Gambar geometri hasil union (warna ungu)
            if (res.geometry) {
                L.geoJSON(res.geometry, {
                    style: { color: '#a855f7', weight: 2.5, fillColor: '#c084fc', fillOpacity: 0.35 }
                }).addTo(lg);
            }
            
            // Gambar hanya marker yang memenuhi syarat (warna ungu)
            if (res.markers) {
                res.markers.forEach(m => {
                    const coords = m.geojson.coordinates;
                    L.marker([coords[1], coords[0]], { icon: getColoredMarkerIcon('#a855f7') })
                     .bindPopup(`<strong>${m.nama_marker}</strong><br>Berada di A atau B`)
                     .addTo(lg);
                });
            }
        }
    })
    .catch(err => console.error('Gagal fetch union:', err));
}

// 2. Fetch & Render: Wilayah A tapi bukan B (Difference A - B)
function fetchDiffAB(wilayahA, wilayahB, geojsonA, geojsonB) {
    const lg = subMapLayers.diffAB;
    lg.clearLayers();
    drawReferenceOutlines(lg, geojsonA, geojsonB);

    fetch('api/analysis_difference.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wilayah_a: wilayahA, wilayah_b: wilayahB })
    })
    .then(res => res.json())
    .then(res => {
        if (res.status === 'success') {
            document.getElementById('badge-diff-ab').innerText = (res.markers ? res.markers.length : 0) + ' Titik';
            
            // Gambar geometri hasil selisih (warna biru)
            if (res.geometry) {
                L.geoJSON(res.geometry, {
                    style: { color: '#2563eb', weight: 2.5, fillColor: '#93c5fd', fillOpacity: 0.35 }
                }).addTo(lg);
            }
            
            // Gambar marker (warna biru)
            if (res.markers) {
                res.markers.forEach(m => {
                    const coords = m.geojson.coordinates;
                    L.marker([coords[1], coords[0]], { icon: getColoredMarkerIcon('#2563eb') })
                     .bindPopup(`<strong>${m.nama_marker}</strong><br>Di Wilayah A, Bukan B`)
                     .addTo(lg);
                });
            }
        }
    })
    .catch(err => console.error('Gagal fetch difference A-B:', err));
}

// 3. Fetch & Render: Wilayah B tapi bukan A (Difference B - A)
function fetchDiffBA(wilayahA, wilayahB, geojsonA, geojsonB) {
    const lg = subMapLayers.diffBA;
    lg.clearLayers();
    drawReferenceOutlines(lg, geojsonA, geojsonB);

    fetch('api/analysis_difference_ba.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wilayah_a: wilayahA, wilayah_b: wilayahB })
    })
    .then(res => res.json())
    .then(res => {
        if (res.status === 'success') {
            document.getElementById('badge-diff-ba').innerText = (res.markers ? res.markers.length : 0) + ' Titik';
            
            // Gambar geometri hasil selisih (warna merah)
            if (res.geometry) {
                L.geoJSON(res.geometry, {
                    style: { color: '#ef4444', weight: 2.5, fillColor: '#fca5a5', fillOpacity: 0.35 }
                }).addTo(lg);
            }
            
            // Gambar marker (warna merah)
            if (res.markers) {
                res.markers.forEach(m => {
                    const coords = m.geojson.coordinates;
                    L.marker([coords[1], coords[0]], { icon: getColoredMarkerIcon('#ef4444') })
                     .bindPopup(`<strong>${m.nama_marker}</strong><br>Di Wilayah B, Bukan A`)
                     .addTo(lg);
                });
            }
        }
    })
    .catch(err => console.error('Gagal fetch difference B-A:', err));
}

// 4. Fetch & Render: Selain Wilayah A dan B (Outside A & B)
function fetchOutside(wilayahA, wilayahB, geojsonA, geojsonB) {
    const lg = subMapLayers.outside;
    lg.clearLayers();
    drawReferenceOutlines(lg, geojsonA, geojsonB);

    fetch('api/analysis_outside.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wilayah_a: wilayahA, wilayah_b: wilayahB })
    })
    .then(res => res.json())
    .then(res => {
        if (res.status === 'success') {
            document.getElementById('badge-outside').innerText = (res.markers ? res.markers.length : 0) + ' Titik';
            
            // Gambar geometri hasil complement luar (warna cyan)
            if (res.geometry) {
                L.geoJSON(res.geometry, {
                    style: { color: '#06b6d4', weight: 2.5, fillColor: '#67e8f9', fillOpacity: 0.35 }
                }).addTo(lg);
            }
            
            // Gambar marker (warna cyan)
            if (res.markers) {
                res.markers.forEach(m => {
                    const coords = m.geojson.coordinates;
                    L.marker([coords[1], coords[0]], { icon: getColoredMarkerIcon('#06b6d4') })
                     .bindPopup(`<strong>${m.nama_marker}</strong><br>Di Luar Wilayah A & B`)
                     .addTo(lg);
                });
            }
        }
    })
    .catch(err => console.error('Gagal fetch outside:', err));
}

// 5. Fetch & Render: Irisan A dan B (Intersection A ∩ B) - Styled in GRAY
function fetchIntersect(wilayahA, wilayahB, geojsonA, geojsonB) {
    const lg = subMapLayers.intersect;
    lg.clearLayers();
    drawReferenceOutlines(lg, geojsonA, geojsonB);

    fetch('api/analysis_intersection.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wilayah_a: wilayahA, wilayah_b: wilayahB })
    })
    .then(res => res.json())
    .then(res => {
        if (res.status === 'success') {
            document.getElementById('badge-intersect').innerText = (res.markers ? res.markers.length : 0) + ' Titik';
            
            // Gambar geometri irisan (warna ABU-ABU sesuai request user)
            if (res.geometry) {
                L.geoJSON(res.geometry, {
                    style: { color: '#64748b', weight: 2.5, fillColor: '#cbd5e1', fillOpacity: 0.45 }
                }).addTo(lg);
            }
            
            // Gambar marker (warna ABU-ABU)
            if (res.markers) {
                res.markers.forEach(m => {
                    const coords = m.geojson.coordinates;
                    L.marker([coords[1], coords[0]], { icon: getColoredMarkerIcon('#64748b') })
                     .bindPopup(`<strong>${m.nama_marker}</strong><br>Irisan Wilayah A & B`)
                     .addTo(lg);
                });
            }
        }
    })
    .catch(err => console.error('Gagal fetch intersection:', err));
}
