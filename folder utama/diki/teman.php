<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Connect to database 'diki'
$conn_details = "host=localhost port=5432 dbname=diki user=postgres password=admin123";
$conn = pg_connect($conn_details);
if (!$conn) {
    $conn_details = "host=localhost port=5432 dbname=diki user=postgres password=ayib";
    $conn = pg_connect($conn_details);
}

if (!$conn) {
    die("Koneksi PostgreSQL gagal");
}

// Handler to save newly drawn geometries from the map (Automatic naming)
if (isset($_GET['action']) && $_GET['action'] === 'save') {
    header('Content-Type: application/json');
    $input = json_decode(file_get_contents('php://input'), true);
    $geojson = $input['geojson'] ?? null;
    
    if (!$geojson) {
        echo json_encode(['status' => 'error', 'message' => 'Geometri tidak valid']);
        exit;
    }

    // Determine geometry type and automatically query the database to count and name the entry
    $geom_type = $geojson['type'] ?? '';
    if (strtolower($geom_type) === 'point') {
        $res_count = pg_query($conn, "SELECT COUNT(*) FROM lokasi2 WHERE ST_GeometryType(geom) = 'ST_Point'");
        $count = $res_count ? (int)pg_fetch_result($res_count, 0, 0) : 0;
        $nama = 'marker ' . ($count + 1);
    } else {
        $res_count = pg_query($conn, "SELECT COUNT(*) FROM lokasi2 WHERE ST_GeometryType(geom) != 'ST_Point'");
        $count = $res_count ? (int)pg_fetch_result($res_count, 0, 0) : 0;
        $nama = 'area ' . ($count + 1);
    }
    
    $geojson_str = json_encode($geojson);
    $q_insert = "INSERT INTO lokasi2 (nama, geom) VALUES ($1, ST_SetSRID(ST_GeomFromGeoJSON($2), 4326))";
    $res = pg_query_params($conn, $q_insert, array($nama, $geojson_str));
    
    if ($res) {
        echo json_encode(['status' => 'success']);
    } else {
        echo json_encode(['status' => 'error', 'message' => pg_last_error($conn)]);
    }
    pg_close($conn);
    exit;
}

// Fetch all polygons for dropdown menus
$q_polys = "SELECT id, nama FROM lokasi2 WHERE ST_GeometryType(geom) != 'ST_Point' ORDER BY id ASC";
$res_polys = pg_query($conn, $q_polys);
$polygons = [];
if ($res_polys) {
    while ($row = pg_fetch_assoc($res_polys)) {
        $polygons[] = [
            'id' => (int)$row['id'],
            'nama' => $row['nama']
        ];
    }
}

// Select Wilayah A and B
$id_a = isset($_GET['id_a']) ? (int)$_GET['id_a'] : 0;
$id_b = isset($_GET['id_b']) ? (int)$_GET['id_b'] : 0;

if ($id_a <= 0 || $id_b <= 0) {
    // Look up area 1 and area 2 as defaults
    $res_def_a = pg_query($conn, "SELECT id FROM lokasi2 WHERE nama = 'area 1' LIMIT 1");
    $res_def_b = pg_query($conn, "SELECT id FROM lokasi2 WHERE nama = 'area 2' LIMIT 1");
    
    $def_a = $res_def_a && pg_num_rows($res_def_a) > 0 ? (int)pg_fetch_result($res_def_a, 0, 0) : 0;
    $def_b = $res_def_b && pg_num_rows($res_def_b) > 0 ? (int)pg_fetch_result($res_def_b, 0, 0) : 0;
    
    // Fallback if not found by name
    if ($def_a <= 0 && count($polygons) > 0) {
        $def_a = $polygons[0]['id'];
    }
    if ($def_b <= 0 && count($polygons) > 1) {
        $def_b = $polygons[1]['id'];
    } else if ($def_b <= 0 && count($polygons) > 0) {
        $def_b = $polygons[0]['id'];
    }
    
    if ($id_a <= 0) $id_a = $def_a;
    if ($id_b <= 0) $id_b = $def_b;
}

// Fetch geometries of Wilayah A and B for outline references
$sql_wA = pg_query($conn, "SELECT ST_AsGeoJSON(geom) FROM lokasi2 WHERE id = $id_a LIMIT 1");
$geojson_wA = ($sql_wA && pg_num_rows($sql_wA) > 0) ? pg_fetch_result($sql_wA, 0, 0) : 'null';

$sql_wB = pg_query($conn, "SELECT ST_AsGeoJSON(geom) FROM lokasi2 WHERE id = $id_b LIMIT 1");
$geojson_wB = ($sql_wB && pg_num_rows($sql_wB) > 0) ? pg_fetch_result($sql_wB, 0, 0) : 'null';

// Fetch all data for main map
$q_all = "SELECT id, nama, ST_AsGeoJSON(geom) AS geom_json, ST_GeometryType(geom) as geom_type FROM lokasi2";
$res_all = pg_query($conn, $q_all);
$all_data = [];
if ($res_all) {
    while ($row = pg_fetch_assoc($res_all)) {
        $all_data[] = [
            'id' => (int)$row['id'],
            'nama' => $row['nama'],
            'geom_type' => $row['geom_type'] === 'ST_Point' ? 'marker' : 'polygon',
            'geojson' => json_decode($row['geom_json'])
        ];
    }
}

// Helper to fetch spatial data (calculates resulting geometry & queries markers situated inside it separately)
function get_spatial_data($conn, $id_a, $id_b, $geom_expr) {
    if ($id_a <= 0 || $id_b <= 0) {
        return ['geometry' => null, 'markers' => []];
    }
    
    // Get geometry
    $q_geom = "
        SELECT ST_AsGeoJSON($geom_expr) AS geojson
        FROM lokasi2 a, lokasi2 b
        WHERE a.id = $id_a AND b.id = $id_b
    ";
    $res_geom = pg_query($conn, $q_geom);
    $geojson = ($res_geom && pg_num_rows($res_geom) > 0) ? pg_fetch_result($res_geom, 0, 0) : null;
    
    // Get markers
    $q_markers = "
        SELECT m.nama, ST_AsGeoJSON(m.geom) AS geom_json
        FROM lokasi2 m, lokasi2 a, lokasi2 b
        WHERE a.id = $id_a AND b.id = $id_b
          AND ST_GeometryType(m.geom) = 'ST_Point'
          AND ST_Within(m.geom, $geom_expr)
    ";
    $res_markers = pg_query($conn, $q_markers);
    $markers = [];
    if ($res_markers) {
        while ($row = pg_fetch_assoc($res_markers)) {
            $markers[] = [
                'nama' => $row['nama'],
                'geojson' => json_decode($row['geom_json'])
            ];
        }
    }
    
    return [
        'geometry' => $geojson ? json_decode($geojson) : null,
        'markers' => $markers
    ];
}

$data_union = get_spatial_data($conn, $id_a, $id_b, "ST_Union(a.geom, b.geom)");
$data_diff_ab = get_spatial_data($conn, $id_a, $id_b, "ST_Difference(a.geom, b.geom)");
$data_diff_ba = get_spatial_data($conn, $id_a, $id_b, "ST_Difference(b.geom, a.geom)");
$data_outside = get_spatial_data($conn, $id_a, $id_b, "ST_Difference(ST_SetSRID(ST_MakeEnvelope(-180, -90, 180, 90), 4326), ST_Union(a.geom, b.geom))");
$data_intersect = get_spatial_data($conn, $id_a, $id_b, "ST_Intersection(a.geom, b.geom)");

pg_close($conn);
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Overlay Spasial</title>

    <!-- FontAwesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- Leaflet CSS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
    <!-- Leaflet JS -->
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    
    <!-- Leaflet Draw CSS & JS -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css"/>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js"></script>

    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #fafafa;
            color: #1f2937;
        }

        .control-box {
            background-color: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 12px 16px;
            margin-bottom: 20px;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }

        .control-form {
            display: flex;
            gap: 15px;
            align-items: center;
            flex-wrap: wrap;
        }

        .control-group {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .control-group label {
            font-weight: 600;
            font-size: 0.85rem;
        }

        .control-select {
            padding: 4px 8px;
            font-size: 0.85rem;
            border-radius: 4px;
            border: 1px solid #d1d5db;
            background-color: #fff;
            color: #1f2937;
            font-family: inherit;
        }

        .control-hint {
            font-size: 0.75rem;
            color: #6b7280;
        }

        .map-wrapper {
            margin-bottom: 24px;
        }

        .map-container {
            height: 480px;
            width: 100%;
            border-radius: 6px;
            overflow: hidden;
            border: 1px solid #e5e7eb;
        }

        #mapbesar {
            height: 100%;
            width: 100%;
        }

        .sub-maps-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 20px;
        }

        .sub-map-card {
            background-color: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }

        .sub-map-card h4 {
            font-size: 0.875rem;
            font-weight: 600;
            margin: 0;
        }

        .sub-map-container {
            height: 280px;
            width: 100%;
            border-radius: 4px;
            overflow: hidden;
            border: 1px solid #e5e7eb;
        }

        .sub-map-element {
            height: 100%;
            width: 100%;
        }

        /* Tooltip style for permanent polygon labels */
        .polygon-tooltip {
            background: rgba(255, 255, 255, 0.95);
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            padding: 2px 6px;
            font-size: 10px;
            font-weight: bold;
            color: #1f2937;
        }

        /* Custom Marker style (white border, centered dot) */
        .custom-marker-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background-color: #1f2937;
            border: 2px solid #fff;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }

        /* Leaflet border removal inside containers */
        .leaflet-container {
            border: none !important;
            background: #f8fafc;
        }
    </style>
</head>
<body>

    <!-- Simple Control Box (No Header, No Titles, No Submit Button) -->
    <div class="control-box">
        <form method="GET" action="teman.php" class="control-form">
            <div class="control-group">
                <label for="id_a">Wilayah A:</label>
                <select name="id_a" id="id_a" class="control-select" onchange="this.form.submit()">
                    <?php foreach ($polygons as $poly): ?>
                        <option value="<?php echo $poly['id']; ?>" <?php echo $poly['id'] == $id_a ? 'selected' : ''; ?>>
                            <?php echo htmlspecialchars($poly['nama']); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
            
            <div class="control-group">
                <label for="id_b">Wilayah B:</label>
                <select name="id_b" id="id_b" class="control-select" onchange="this.form.submit()">
                    <?php foreach ($polygons as $poly): ?>
                        <option value="<?php echo $poly['id']; ?>" <?php echo $poly['id'] == $id_b ? 'selected' : ''; ?>>
                            <?php echo htmlspecialchars($poly['nama']); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>

            <span class="control-hint">(Gunakan toolbar Leaflet Draw di sebelah kiri peta untuk menambah wilayah/marker baru)</span>
        </form>
    </div>

    <!-- Peta Utama -->
    <div class="map-wrapper">
        <div class="map-container">
            <div id="mapbesar"></div>
        </div>
    </div>

    <!-- 5 Visual Maps Hasil Analisis (No Badges) -->
    <div class="sub-maps-grid">
        <!-- Map 1 -->
        <div class="sub-map-card">
            <h4>1. Wilayah A dan B (Union)</h4>
            <div class="sub-map-container">
                <div id="sub-map-union" class="sub-map-element"></div>
            </div>
        </div>

        <!-- Map 2 -->
        <div class="sub-map-card">
            <h4>2. Wilayah A tapi bukan B</h4>
            <div class="sub-map-container">
                <div id="sub-map-diff-ab" class="sub-map-element"></div>
            </div>
        </div>

        <!-- Map 3 -->
        <div class="sub-map-card">
            <h4>3. Wilayah B tapi bukan A</h4>
            <div class="sub-map-container">
                <div id="sub-map-diff-ba" class="sub-map-element"></div>
            </div>
        </div>

        <!-- Map 4 -->
        <div class="sub-map-card">
            <h4>4. Selain Wilayah A dan B</h4>
            <div class="sub-map-container">
                <div id="sub-map-outside" class="sub-map-element"></div>
            </div>
        </div>

        <!-- Map 5 -->
        <div class="sub-map-card">
            <h4>5. Irisan A dan B</h4>
            <div class="sub-map-container">
                <div id="sub-map-intersect" class="sub-map-element"></div>
            </div>
        </div>
    </div>

    <script>
        // Load data from PHP
        const semuaData = <?php echo json_encode($all_data); ?>;
        const dataUnion = <?php echo json_encode($data_union); ?>;
        const dataDiffAB = <?php echo json_encode($data_diff_ab); ?>;
        const dataDiffBA = <?php echo json_encode($data_diff_ba); ?>;
        const dataOutside = <?php echo json_encode($data_outside); ?>;
        const dataIntersect = <?php echo json_encode($data_intersect); ?>;

        const geomA = <?php echo $geojson_wA; ?>;
        const geomB = <?php echo $geojson_wB; ?>;

        let mapbesar;
        let subMaps = {};
        let subMapLayers = {
            union: L.layerGroup(),
            diffAB: L.layerGroup(),
            diffBA: L.layerGroup(),
            outside: L.layerGroup(),
            intersect: L.layerGroup()
        };

        // Standard Marker Icon
        const customMarkerIcon = L.divIcon({
            className: 'custom-marker-icon',
            html: '<div style="width: 8px; height: 8px; border-radius:50%; background:#fff;"></div>',
            iconSize: [18, 18],
            iconAnchor: [9, 9],
            popupAnchor: [0, -9]
        });

        // 3D-like Icon with Colored center and White borders for Sub Maps
        function getColoredMarkerIcon(bgColor) {
            return L.divIcon({
                className: 'custom-sub-marker',
                html: `<div style="width: 20px; height: 20px; border-radius: 50%; background: ${bgColor}; border: 2px solid #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center;"><div style="width: 6px; height: 6px; border-radius: 50%; background: #fff;"></div></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10],
                popupAnchor: [0, -10]
            });
        }

        // Initialize maps
        window.onload = function() {
            initMap();
            renderSubMaps();
        };

        function initMap() {
            // Center of West/Central Java
            mapbesar = L.map('mapbesar').setView([-6.914744, 108.5], 8);

            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
                maxZoom: 20
            }).addTo(mapbesar);

            // Add Leaflet.draw controls to the main map
            const drawnItems = new L.FeatureGroup();
            mapbesar.addLayer(drawnItems);
            
            const drawControl = new L.Control.Draw({
                edit: {
                    featureGroup: drawnItems,
                    remove: false,
                    edit: false
                },
                draw: {
                    polygon: true,
                    marker: true,
                    polyline: false,
                    rectangle: false,
                    circle: false,
                    circlemarker: false
                }
            });
            mapbesar.addControl(drawControl);

            // Listen to Leaflet Draw Event (Automatic naming & reload)
            mapbesar.on(L.Draw.Event.CREATED, function (e) {
                const layer = e.layer;
                const geojson = layer.toGeoJSON().geometry;
                
                fetch('teman.php?action=save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ geojson: geojson })
                })
                .then(res => res.json())
                .then(res => {
                    if (res.status === 'success') {
                        window.location.reload();
                    } else {
                        alert('Gagal menyimpan: ' + res.message);
                    }
                })
                .catch(err => {
                    console.error(err);
                    alert('Terjadi kesalahan koneksi.');
                });
            });

            // Tampilkan semua data di Peta Utama
            const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#06b6d4', '#ec4899', '#8b5cf6'];
            
            const boundsArr = [];
            semuaData.forEach((item, index) => {
                if (item.geom_type === 'polygon') {
                    const color = colors[index % colors.length];
                    const layer = L.geoJSON(item.geojson, {
                        style: {
                            color: color,
                            weight: 2.5,
                            fillColor: color,
                            fillOpacity: 0.15
                        }
                    }).addTo(mapbesar);
                    
                    layer.bindTooltip(item.nama, {
                        permanent: true,
                        direction: 'center',
                        className: 'polygon-tooltip'
                    });
                    layer.bindPopup(`<strong>${item.nama}</strong>`);
                    boundsArr.push(layer);
                } else {
                    const latlng = [item.geojson.coordinates[1], item.geojson.coordinates[0]];
                    const marker = L.marker(latlng, { icon: customMarkerIcon }).addTo(mapbesar);
                    marker.bindPopup(`<strong>${item.nama}</strong>`);
                }
            });

            // Fit bounds peta utama
            if (boundsArr.length > 0) {
                const groupBounds = L.featureGroup(boundsArr).getBounds();
                mapbesar.fitBounds(groupBounds, { padding: [30, 30] });
            }

            // Inisialisasi 5 sub-maps
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
                }).setView(mapbesar.getCenter(), mapbesar.getZoom());

                L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                    maxZoom: 20
                }).addTo(subMaps[key]);

                subMapLayers[key].addTo(subMaps[key]);
            }

            // Sinkronisasi pan/zoom real-time
            mapbesar.on('move', syncSubMapsView);
            mapbesar.on('zoomend', syncSubMapsView);
        }

        function syncSubMapsView() {
            const center = mapbesar.getCenter();
            const zoom = mapbesar.getZoom();
            for (const key in subMaps) {
                if (subMaps[key]) {
                    subMaps[key].setView(center, zoom, { animate: false });
                }
            }
        }

        function renderSubMaps() {
            const datasets = {
                union: { data: dataUnion, color: '#a855f7' },
                diffAB: { data: dataDiffAB, color: '#2563eb' },
                diffBA: { data: dataDiffBA, color: '#ef4444' },
                outside: { data: dataOutside, color: '#06b6d4', isComplement: true },
                intersect: { data: dataIntersect, color: '#64748b' }
            };

            for (const key in datasets) {
                const conf = datasets[key];
                const lg = subMapLayers[key];
                lg.clearLayers();

                // 1. Gambar outline A dan B sebagai acuan transparan
                const refStyle = {
                    color: '#94a3b8',
                    weight: 1.5,
                    dashArray: '4, 4',
                    fill: false,
                    interactive: false
                };
                if (geomA) L.geoJSON(geomA, { style: refStyle }).addTo(lg);
                if (geomB) L.geoJSON(geomB, { style: refStyle }).addTo(lg);

                // 2. Gambar hasil kalkulasi spasial
                if (conf.data.geometry) {
                    L.geoJSON(conf.data.geometry, {
                        style: {
                            color: conf.color,
                            fillColor: conf.color,
                            fillOpacity: conf.isComplement ? 0.08 : 0.25,
                            weight: conf.isComplement ? 1 : 2.5
                        }
                    }).bindPopup(`<strong>Hasil Spasial</strong>`).addTo(lg);
                }

                // 3. Gambar marker yang memenuhi syarat
                if (conf.data.markers) {
                    conf.data.markers.forEach(m => {
                        const coords = m.geojson.coordinates;
                        L.marker([coords[1], coords[0]], { icon: getColoredMarkerIcon(conf.color) })
                         .bindPopup(`<strong>${m.nama}</strong>`)
                         .addTo(lg);
                    });
                }
            }

            // Sinkronkan pandangan awal
            syncSubMapsView();
        }
    </script>
</body>
</html>