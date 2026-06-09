// assets/js/analysis.js

// Fungsi utama untuk melakukan analisis spasial
function runAnalysis(operationType) {
    const wilayahA = document.getElementById('wilayah_a').value;
    const wilayahB = document.getElementById('wilayah_b').value;

    if (!wilayahA || !wilayahB) {
        alert('Pilih Wilayah A dan Wilayah B terlebih dahulu untuk melakukan analisis.');
        return;
    }

    if (wilayahA === wilayahB) {
        alert('Wilayah A dan Wilayah B tidak boleh sama.');
        return;
    }

    // Tentukan endpoint API berdasarkan tipe operasi
    let apiEndpoint = '';
    let operationName = '';
    
    switch (operationType) {
        case 'intersection':
            apiEndpoint = 'api/analysis_intersection.php';
            operationName = 'Irisan (A ∩ B)';
            break;
        case 'difference':
            apiEndpoint = 'api/analysis_difference.php';
            operationName = 'Selisih (A - B)';
            break;
        case 'difference_ba':
            apiEndpoint = 'api/analysis_difference_ba.php';
            operationName = 'Selisih (B - A)';
            break;
        case 'outside':
            apiEndpoint = 'api/analysis_outside.php';
            operationName = 'Luar Gabungan Semesta - (A ∪ B)';
            break;
        case 'symdifference':
            apiEndpoint = 'api/analysis_symdifference.php';
            operationName = 'Symmetric Difference (A △ B)';
            break;
        default:
            return;
    }

    // Tampilkan status loading di tombol
    setAnalysisButtonsActive(operationType);
    showLoadingResults();

    fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            wilayah_a: wilayahA,
            wilayah_b: wilayahB
        })
    })
    .then(res => res.json())
    .then(res => {
        if (res.status === 'success') {
            displayAnalysisResults(res, operationName);
        } else {
            resetAnalysisUI();
            alert('Analisis Gagal: ' + res.message);
        }
    })
    .catch(err => {
        console.error(err);
        resetAnalysisUI();
        alert('Terjadi kesalahan saat memproses data analisis.');
    });
}

// Set status aktif pada tombol analisis yang diklik
function setAnalysisButtonsActive(activeType) {
    const buttons = {
        'intersection': document.getElementById('btn-intersect'),
        'difference': document.getElementById('btn-diff'),
        'difference_ba': document.getElementById('btn-diff-ba'),
        'outside': document.getElementById('btn-outside'),
        'symdifference': document.getElementById('btn-symdiff')
    };

    for (const type in buttons) {
        if (buttons[type]) {
            if (type === activeType) {
                buttons[type].classList.add('active');
            } else {
                buttons[type].classList.remove('active');
            }
        }
    }
}

// Menampilkan loading state di panel hasil
function showLoadingResults() {
    const panel = document.getElementById('analysis-results-panel');
    panel.innerHTML = `
        <div class="results-card" style="text-align: center;">
            <div style="color: var(--brand-color); margin-bottom: 0.5rem;"><i class="fas fa-spinner fa-spin"></i></div>
            <span style="font-size: 0.8rem; color: var(--text-secondary);">Memproses query spasial PostGIS...</span>
        </div>
    `;
}

// Reset tombol & hasil UI ke kondisi semula jika terjadi error
function resetAnalysisUI() {
    setAnalysisButtonsActive(null);
    document.getElementById('analysis-results-panel').innerHTML = `
        <div class="results-card" style="text-align: center; color: var(--text-secondary); font-size: 0.8rem;">
            Pilih opsi analisis di atas untuk memproses data.
        </div>
    `;
    analysisGroup.clearLayers();

    // Tampilkan kembali semua wilayah dan marker bawaan
    wilayahGroup.eachLayer(function(layer) {
        if (!map.hasLayer(layer)) map.addLayer(layer);
    });
    if (!map.hasLayer(markerGroup)) {
        map.addLayer(markerGroup);
    }
}

// Menampilkan hasil analisis ke peta dan sidebar
function displayAnalysisResults(data, operationName) {
    // 1. Bersihkan layer analisis sebelumnya
    analysisGroup.clearLayers();

    // Sembunyikan wilayah yang tidak dipilih (selain A dan B) dan semua marker default
    const wilayahA = document.getElementById('wilayah_a').value;
    const wilayahB = document.getElementById('wilayah_b').value;
    
    wilayahGroup.eachLayer(function(layer) {
        if (layer.wilayahId == wilayahA || layer.wilayahId == wilayahB) {
            if (!map.hasLayer(layer)) map.addLayer(layer);
        } else {
            if (map.hasLayer(layer)) map.removeLayer(layer);
        }
    });
    
    if (map.hasLayer(markerGroup)) {
        map.removeLayer(markerGroup);
    }

    // 2. Gambar Polygon Hasil Spasial jika geometri ada
    let geomAdded = false;
    let bounds = [];

    if (data.geometry) {
        const analysisLayer = L.geoJSON(data.geometry, {
            style: {
                color: '#a855f7', // Warna ungu menyala
                weight: 4,
                fillColor: '#c084fc',
                fillOpacity: 0.4,
                dashArray: '3, 3'
            }
        }).addTo(analysisGroup);

        analysisLayer.bindPopup(`<strong>Hasil Analisis: ${operationName}</strong>`);
        bounds.push(analysisLayer.getBounds());
        geomAdded = true;
    }

    // 3. Tampilkan/filter Marker hasil analisis
    const countMarkers = data.markers ? data.markers.length : 0;
    
    if (data.markers && countMarkers > 0) {
        data.markers.forEach(m => {
            const coords = m.geojson.coordinates;
            const latlng = [coords[1], coords[0]];

            // Custom Icon Ungu Berkedip (Pulsing)
            const highlightIcon = L.divIcon({
                className: 'custom-marker-icon highlight',
                html: '<i class="fas fa-bullseye" style="font-size: 14px;"></i>',
                iconSize: [26, 26],
                iconAnchor: [13, 13],
                popupAnchor: [0, -13]
            });

            const marker = L.marker(latlng, { icon: highlightIcon }).addTo(analysisGroup);
            marker.bindPopup(`
                <strong style="color: #a855f7;">[Hasil Spasial]</strong><br>
                <strong>${m.nama_marker}</strong><br>
                ${m.deskripsi || 'Tidak ada deskripsi'}
            `);

            // Buat LatLngBounds untuk disesuaikan
            const tempBounds = L.latLngBounds([latlng]);
            bounds.push(tempBounds);
        });
    }

    // 4. Update Panel Sidebar dengan hasil detail
    const panel = document.getElementById('analysis-results-panel');
    let hasResultGeomText = geomAdded ? "Terbentuk" : "Tidak Terbentuk (Kosong)";
    
    panel.innerHTML = `
        <div class="results-card">
            <div class="results-title"><i class="fas fa-chart-line"></i> Hasil: ${operationName}</div>
            <div class="results-stats">
                <div><strong>Geometri Hasil:</strong> <span style="color: ${geomAdded ? 'var(--success)' : 'var(--danger)'};">${hasResultGeomText}</span></div>
                <div><strong>Jumlah Marker Terpilih:</strong> <span style="color: var(--brand-color); font-weight: bold;">${countMarkers} Titik</span></div>
            </div>
            ${countMarkers > 0 ? `
                <div style="margin-top: 0.75rem; border-top: 1px solid var(--border-color); padding-top: 0.5rem;">
                    <div style="font-size: 0.75rem; font-weight: bold; margin-bottom: 0.25rem;">Daftar Marker Lolos:</div>
                    <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.25rem; max-height: 120px; overflow-y: auto;">
                        ${data.markers.map(m => `
                            <li style="font-size: 0.75rem; display: flex; align-items: center; justify-content: space-between; background: var(--bg-primary); padding: 0.25rem 0.5rem; border-radius: 0.25rem;">
                                <span><i class="fas fa-bullseye" style="color: #a855f7;"></i> ${m.nama_marker}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            ` : `<div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.5rem;">Tidak ada marker di dalam area hasil.</div>`}
            <button class="btn btn-outline btn-sm" style="width: 100%; margin-top: 0.75rem; justify-content: center;" onclick="resetAnalysisUI()">
                <i class="fas fa-undo"></i> Reset Hasil
            </button>
        </div>
    `;

    // 5. Fit Bounds peta jika ada elemen
    if (bounds.length > 0) {
        const combinedBounds = bounds.reduce((acc, cur) => acc.extend(cur));
        map.fitBounds(combinedBounds, { padding: [50, 50] });
    } else {
        alert("Analisis berhasil, namun tidak menghasilkan area koordinat (Disjoint/Kosong) dan tidak ada marker terpilih.");
    }
}
