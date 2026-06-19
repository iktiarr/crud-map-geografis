<?php
session_start();

$host     = "localhost";
$port     = "5432";
$dbname   = "diki"; 
$user     = "postgres"; 
$password = "admin123";

try {
    $pdo = new PDO("pgsql:host=$host;port=$port;dbname=$dbname", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Koneksi database gagal: " . $e->getMessage());
}

// ----------------------------------------------------
// AJAX HANDLERS
// ----------------------------------------------------
if (isset($_GET['action']) && $_GET['action'] === 'save_polygon') {
    header('Content-Type: application/json');
    $input = json_decode(file_get_contents('php://input'), true);
    $geojson = $input['geojson'] ?? null;
    
    if (!$geojson) {
        echo json_encode(['status' => 'error', 'message' => 'Geometri tidak valid']);
        exit;
    }

    $stmt_count = $pdo->query("SELECT COUNT(*) FROM lokasi2 WHERE ST_GeometryType(geom) != 'ST_Point'");
    $count = (int)$stmt_count->fetchColumn();
    $nama = 'area ' . ($count + 1);

    $query = "INSERT INTO lokasi2 (nama, geom) VALUES (:nama, ST_SetSRID(ST_GeomFromGeoJSON(:geojson), 4326))";
    $stmt = $pdo->prepare($query);
    $res = $stmt->execute([
        ':nama' => $nama,
        ':geojson' => json_encode($geojson)
    ]);
    
    if ($res) {
        echo json_encode(['status' => 'success']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Gagal menyimpan']);
    }
    exit;
}

// Update Polygon Geometry Handler
if (isset($_GET['action']) && $_GET['action'] === 'update_polygon') {
    header('Content-Type: application/json');
    $input = json_decode(file_get_contents('php://input'), true);
    $id = isset($input['id']) ? (int)$input['id'] : 0;
    $geojson = $input['geojson'] ?? null;
    
    if ($id <= 0 || !$geojson) {
        echo json_encode(['status' => 'error', 'message' => 'Parameter tidak valid']);
        exit;
    }

    $query = "UPDATE lokasi2 SET geom = ST_SetSRID(ST_GeomFromGeoJSON(:geojson), 4326) WHERE id = :id";
    $stmt = $pdo->prepare($query);
    $res = $stmt->execute([
        ':id' => $id,
        ':geojson' => json_encode($geojson)
    ]);
    
    if ($res) {
        echo json_encode(['status' => 'success']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Gagal memperbarui geometri']);
    }
    exit;
}

// Delete Polygon Handler
if (isset($_GET['action']) && $_GET['action'] === 'delete_polygon' && isset($_GET['id'])) {
    $id = (int)$_GET['id'];
    $stmt = $pdo->prepare("DELETE FROM lokasi2 WHERE id = :id");
    $stmt->execute(['id' => $id]);
    header("Location: index.php?tab=spasial");
    exit;
}

// ----------------------------------------------------
// DATA FETCHING FOR TAB 1: SPATIAL OVERLAY
// ----------------------------------------------------
$polygons = $pdo->query("SELECT id, nama FROM lokasi2 WHERE ST_GeometryType(geom) != 'ST_Point' ORDER BY id ASC")->fetchAll(PDO::FETCH_ASSOC);

$id_a = isset($_GET['id_a']) ? (int)$_GET['id_a'] : 0;
$id_b = isset($_GET['id_b']) ? (int)$_GET['id_b'] : 0;

if ($id_a <= 0 || $id_b <= 0) {
    $def_a = (int)$pdo->query("SELECT id FROM lokasi2 WHERE nama = 'area 1' LIMIT 1")->fetchColumn();
    $def_b = (int)$pdo->query("SELECT id FROM lokasi2 WHERE nama = 'area 2' LIMIT 1")->fetchColumn();

    if ($def_a <= 0 && count($polygons) > 0) $def_a = $polygons[0]['id'];
    if ($def_b <= 0 && count($polygons) > 1) $def_b = $polygons[1]['id'];
    else if ($def_b <= 0 && count($polygons) > 0) $def_b = $polygons[0]['id'];

    if ($id_a <= 0) $id_a = $def_a;
    if ($id_b <= 0) $id_b = $def_b;
}

$stmt_wA = $pdo->prepare("SELECT ST_AsGeoJSON(geom) FROM lokasi2 WHERE id = :id");
$stmt_wA->execute(['id' => $id_a]);
$geojson_wA = $stmt_wA->fetchColumn() ?: 'null';

$stmt_wB = $pdo->prepare("SELECT ST_AsGeoJSON(geom) FROM lokasi2 WHERE id = :id");
$stmt_wB->execute(['id' => $id_b]);
$geojson_wB = $stmt_wB->fetchColumn() ?: 'null';

$list_sekolah_admin = $pdo->query("SELECT id, nama_sekolah, jenjang FROM sekolah ORDER BY nama_sekolah ASC")->fetchAll(PDO::FETCH_ASSOC);

$selected_school_ids = isset($_GET['selected_schools']) ? array_map('intval', $_GET['selected_schools']) : [];
if (empty($selected_school_ids) && !empty($list_sekolah_admin)) {
    $selected_school_ids = array_column($list_sekolah_admin, 'id');
}

$all_drawn_polygons = $pdo->query("SELECT id, nama, ST_AsGeoJSON(geom) AS geom_json FROM lokasi2 WHERE ST_GeometryType(geom) != 'ST_Point' ORDER BY id DESC")->fetchAll(PDO::FETCH_ASSOC);
$all_polys_data = [];
foreach ($all_drawn_polygons as $row) {
    $all_polys_data[] = [
        'id' => (int)$row['id'],
        'nama' => $row['nama'],
        'geojson' => json_decode($row['geom_json'])
    ];
}

$list_selected_sekolah = [];
if (!empty($selected_school_ids)) {
    $placeholders = implode(',', array_fill(0, count($selected_school_ids), '?'));
    $stmt_sel = $pdo->prepare("SELECT id, nama_sekolah, jenjang, ST_X(geom) as lng, ST_Y(geom) as lat FROM sekolah WHERE id IN ($placeholders)");
    $stmt_sel->execute($selected_school_ids);
    $list_selected_sekolah = $stmt_sel->fetchAll(PDO::FETCH_ASSOC);
}

function get_spatial_data($pdo, $id_a, $id_b, $geom_expr, $school_ids = []) {
    if ($id_a <= 0 || $id_b <= 0) {
        return ['geometry' => null, 'markers' => []];
    }
    
    $q_geom = "SELECT ST_AsGeoJSON($geom_expr) FROM lokasi2 a, lokasi2 b WHERE a.id = :id_a AND b.id = :id_b";
    $stmt = $pdo->prepare($q_geom);
    $stmt->execute(['id_a' => $id_a, 'id_b' => $id_b]);
    $geojson = $stmt->fetchColumn() ?: null;
    
    $markers = [];
    if (!empty($school_ids)) {
        $placeholders = implode(',', array_fill(0, count($school_ids), '?'));
        $q_markers = "
            SELECT s.nama_sekolah AS nama, ST_AsGeoJSON(s.geom) AS geom_json
            FROM sekolah s, lokasi2 a, lokasi2 b
            WHERE a.id = ? AND b.id = ?
              AND s.id IN ($placeholders)
              AND ST_Within(s.geom, $geom_expr)
        ";
        
        $params = array_merge([$id_a, $id_b], $school_ids);
        $stmt_m = $pdo->prepare($q_markers);
        $stmt_m->execute($params);
        while ($row = $stmt_m->fetch(PDO::FETCH_ASSOC)) {
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

$data_only_a = get_spatial_data($pdo, $id_a, $id_b, "a.geom", $selected_school_ids);
$data_only_b = get_spatial_data($pdo, $id_a, $id_b, "b.geom", $selected_school_ids);
$data_union = get_spatial_data($pdo, $id_a, $id_b, "ST_Union(a.geom, b.geom)", $selected_school_ids);
$data_diff_ab = get_spatial_data($pdo, $id_a, $id_b, "ST_Difference(a.geom, b.geom)", $selected_school_ids);
$data_diff_ba = get_spatial_data($pdo, $id_a, $id_b, "ST_Difference(b.geom, a.geom)", $selected_school_ids);
$data_outside = get_spatial_data($pdo, $id_a, $id_b, "ST_Difference(ST_SetSRID(ST_MakeEnvelope(-180, -90, 180, 90), 4326), ST_Union(a.geom, b.geom))", $selected_school_ids);
$data_intersect = get_spatial_data($pdo, $id_a, $id_b, "ST_Intersection(a.geom, b.geom)", $selected_school_ids);

?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GeoSchool Matrix — Analisis Spasial</title>
    
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css"/>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js"></script>

    <style>
        /* Custom map tooltips and style customisations for light mode */
        .polygon-tooltip {
            background: rgba(255, 255, 255, 0.95);
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 3px 8px;
            font-size: 10px;
            font-weight: 600;
            color: #0f172a;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .custom-school-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
            color: white;
            font-size: 10px;
            font-weight: bold;
        }
        .leaflet-container { background: #f8fafc; }
    </style>
</head>
<body class="bg-slate-50 text-slate-800 font-sans antialiased min-h-screen">

    <div class="max-w-7xl mx-auto px-4 py-8 space-y-6">
        
        <!-- HEADER -->
        <header class="flex flex-col md:flex-row items-center justify-between border-b border-slate-200 pb-5 gap-4">
            <div>
                <h1 class="text-2xl font-bold tracking-wider text-slate-900 flex items-center gap-2">
                    <i class="fa-solid fa-earth-asia text-emerald-600 animate-pulse"></i> GEOSCHOOL MATRIX
                </h1>
                <p class="text-xs text-slate-500 mt-1">Komputasi overlay spasial sekolah terdaftar (Layout Modern & Edit Geometri)</p>
            </div>
            
            <div class="flex items-center gap-4">
                <a href="admin.php" class="text-xs font-bold px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl shadow-md shadow-emerald-600/10 active:scale-[0.98] transition-all">
                    <i class="fa-solid fa-lock-open mr-1.5"></i> Portal Admin
                </a>
            </div>
        </header>

        <!-- EDIT GEOMETRY NOTIFICATION BANNER -->
        <div id="edit-banner" class="hidden bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-xs flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div class="flex items-center gap-2">
                <i class="fa-solid fa-pen-clip text-amber-600 text-sm animate-bounce"></i>
                <span>Sedang mengedit geometri <strong id="edit-poly-name" class="font-bold text-slate-900"></strong>. Silakan seret titik koordinat (simpul) pada peta utama di bawah untuk mengubah wilayah.</span>
            </div>
            <div class="flex gap-2 shrink-0">
                <button type="button" onclick="saveEditedPolygon()" class="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-4 py-2 rounded-lg active:scale-95 transition-all cursor-pointer shadow-sm">
                    Simpan Perubahan
                </button>
                <button type="button" onclick="cancelEditing()" class="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold px-4 py-2 rounded-lg active:scale-95 transition-all cursor-pointer shadow-sm">
                    Batal
                </button>
            </div>
        </div>

        <!-- MAIN LAYOUT: MAP LEFT, SIDEBAR RIGHT (SWAPPED POSITION) -->
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            
            <!-- Main Map (Left column - Takes 3 columns) -->
            <div class="lg:col-span-3">
                <div class="bg-white rounded-2xl border border-slate-200 p-2.5 shadow-sm">
                    <div class="h-[500px] w-full rounded-xl overflow-hidden border border-slate-200" id="mapbesar"></div>
                </div>
            </div>

            <!-- Sidebar Controls (Right column - Swapped from Left) -->
            <div class="lg:col-span-1 space-y-6">
                <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-5">
                    <div class="flex items-center gap-2 pb-2 border-b border-slate-100">
                        <i class="fa-solid fa-circle-nodes text-emerald-600"></i>
                        <h3 class="text-xs font-bold text-slate-800 uppercase tracking-widest">Parameter Analisis</h3>
                    </div>
                    
                    <form method="GET" action="index.php" class="space-y-4">
                        <input type="hidden" name="tab" value="spasial">

                        <div class="space-y-1.5">
                            <label for="id_a" class="text-xs font-semibold text-slate-500">Pilih Wilayah A</label>
                            <select name="id_a" id="id_a" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all cursor-pointer" onchange="this.form.submit()">
                                <?php if (empty($polygons)): ?>
                                    <option value="0">-- Gambar area dulu --</option>
                                <?php else: ?>
                                    <?php foreach ($polygons as $poly): ?>
                                        <option value="<?php echo $poly['id']; ?>" <?php echo $poly['id'] == $id_a ? 'selected' : ''; ?>>
                                            <?php echo htmlspecialchars($poly['nama']); ?>
                                        </option>
                                    <?php endforeach; ?>
                                <?php endif; ?>
                            </select>
                        </div>
                        
                        <div class="space-y-1.5">
                            <label for="id_b" class="text-xs font-semibold text-slate-500">Pilih Wilayah B</label>
                            <select name="id_b" id="id_b" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all cursor-pointer" onchange="this.form.submit()">
                                <?php if (empty($polygons)): ?>
                                    <option value="0">-- Gambar area dulu --</option>
                                <?php else: ?>
                                    <?php foreach ($polygons as $poly): ?>
                                        <option value="<?php echo $poly['id']; ?>" <?php echo $poly['id'] == $id_b ? 'selected' : ''; ?>>
                                            <?php echo htmlspecialchars($poly['nama']); ?>
                                        </option>
                                    <?php endforeach; ?>
                                <?php endif; ?>
                            </select>
                        </div>

                        <div class="space-y-1.5 pt-2 border-t border-slate-100">
                            <label class="text-xs font-semibold text-slate-500 block">Saring Sekolah Admin</label>
                            <div class="relative" id="school-dropdown-container">
                                <button type="button" id="school-dropdown-btn" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 flex justify-between items-center hover:bg-slate-100 transition-colors focus:ring-2 focus:ring-emerald-500 cursor-pointer">
                                    <span class="truncate text-slate-600" id="school-dropdown-text">
                                        <?php 
                                        if (empty($selected_school_ids) || count($selected_school_ids) === count($list_sekolah_admin)) {
                                            echo "Semua Sekolah Admin";
                                        } else {
                                            echo count($selected_school_ids) . " Terpilih";
                                        }
                                        ?>
                                    </span>
                                    <i class="fa-solid fa-chevron-down text-slate-400 text-xs transition-transform" id="school-dropdown-arrow"></i>
                                </button>
                                <div id="school-dropdown-menu" class="hidden absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-lg shadow-lg z-[1000] p-2 max-h-60 overflow-y-auto space-y-1.5">
                                    <?php if (empty($list_sekolah_admin)): ?>
                                        <p class="text-xs text-slate-400 py-1 text-center">Belum ada sekolah admin.</p>
                                    <?php else: ?>
                                        <?php foreach ($list_sekolah_admin as $sch): ?>
                                            <label class="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-emerald-600 p-1.5 rounded hover:bg-slate-50 transition-colors">
                                                <input type="checkbox" name="selected_schools[]" value="<?php echo $sch['id']; ?>" 
                                                       <?php echo in_array($sch['id'], $selected_school_ids) ? 'checked' : ''; ?>
                                                       class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 bg-white"
                                                       onchange="this.form.submit()">
                                                <span class="truncate"><?php echo htmlspecialchars($sch['nama_sekolah']); ?> (<?php echo $sch['jenjang']; ?>)</span>
                                            </label>
                                        <?php endforeach; ?>
                                    <?php endif; ?>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <!-- Polygons list manager -->
                <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                    <div class="flex items-center gap-2 pb-2 border-b border-slate-100">
                        <i class="fa-solid fa-vector-square text-emerald-600"></i>
                        <h3 class="text-xs font-bold text-slate-800 uppercase tracking-widest">Daftar Poligon</h3>
                    </div>
                    <div class="max-h-[220px] overflow-y-auto pr-1 space-y-2 divide-y divide-slate-100 text-xs">
                        <?php if (empty($polygons)): ?>
                            <p class="text-slate-400 py-1 italic">Tidak ada poligon tersimpan.</p>
                        <?php else: ?>
                            <?php foreach ($polygons as $poly): ?>
                                <div class="flex items-center justify-between py-2.5 first:pt-0">
                                    <span class="font-medium text-slate-700"><i class="fa-solid fa-shapes text-slate-400 mr-1.5"></i> <?php echo htmlspecialchars($poly['nama']); ?></span>
                                    <div class="flex items-center gap-1.5">
                                        <!-- Edit button triggers interactive geometric edit -->
                                        <button type="button" onclick="editPolygonGeometry(<?php echo $poly['id']; ?>, '<?php echo htmlspecialchars($poly['nama']); ?>')" 
                                                class="text-amber-600 hover:text-amber-700 p-1.5 rounded hover:bg-amber-50 transition-colors cursor-pointer"
                                                title="Edit Geometri Poligon">
                                            <i class="fa-solid fa-pen-to-square"></i>
                                        </button>
                                        <!-- Delete button -->
                                        <a href="index.php?action=delete_polygon&id=<?php echo $poly['id']; ?>" 
                                           class="text-rose-500 hover:text-rose-600 p-1.5 rounded hover:bg-rose-50 transition-colors"
                                           onclick="return confirm('Hapus poligon ini?')">
                                            <i class="fa-solid fa-trash"></i>
                                        </a>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </div>

        <!-- Sub-Maps Section (Union, Diff, etc.) -->
        <div class="relative py-4">
            <div class="absolute inset-0 flex items-center" aria-hidden="true">
                <div class="w-full border-t border-slate-200"></div>
            </div>
            <div class="relative flex justify-start">
                <span class="bg-slate-50 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <i class="fa-solid fa-chart-simple text-emerald-600"></i> Hasil Operasi Spasial (Overlay Himpunan)
                </span>
            </div>
        </div>

        <!-- 7 Sub maps arranged in a clean layout -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col space-y-3">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                        <h4 class="text-sm font-semibold text-slate-800">1. Wilayah A Saja</h4>
                    </div>
                    <span class="text-[10px] text-cyan-600 px-2 py-0.5 bg-cyan-50 rounded-full border border-cyan-200/50">Hanya A</span>
                </div>
                <div class="h-64 w-full rounded-xl overflow-hidden border border-slate-200" id="sub-map-only-a"></div>
            </div>

            <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col space-y-3">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <h4 class="text-sm font-semibold text-slate-800">2. Wilayah B Saja</h4>
                    </div>
                    <span class="text-[10px] text-emerald-600 px-2 py-0.5 bg-emerald-50 rounded-full border border-emerald-200/50">Hanya B</span>
                </div>
                <div class="h-64 w-full rounded-xl overflow-hidden border border-slate-200" id="sub-map-only-b"></div>
            </div>

            <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col space-y-3">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                        <h4 class="text-sm font-semibold text-slate-800">3. Wilayah A ∪ B (Union)</h4>
                    </div>
                    <span class="text-[10px] text-purple-600 px-2 py-0.5 bg-purple-50 rounded-full border border-purple-200/50">Gabungan</span>
                </div>
                <div class="h-64 w-full rounded-xl overflow-hidden border border-slate-200" id="sub-map-union"></div>
            </div>

            <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col space-y-3">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                        <h4 class="text-sm font-semibold text-slate-800">4. Selisih A - B</h4>
                    </div>
                    <span class="text-[10px] text-blue-600 px-2 py-0.5 bg-blue-50 rounded-full border border-blue-200/50">A tanpa B</span>
                </div>
                <div class="h-64 w-full rounded-xl overflow-hidden border border-slate-200" id="sub-map-diff-ab"></div>
            </div>

            <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col space-y-3">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                        <h4 class="text-sm font-semibold text-slate-800">5. Selisih B - A</h4>
                    </div>
                    <span class="text-[10px] text-rose-600 px-2 py-0.5 bg-rose-50 rounded-full border border-rose-200/50">B tanpa A</span>
                </div>
                <div class="h-64 w-full rounded-xl overflow-hidden border border-slate-200" id="sub-map-diff-ba"></div>
            </div>

            <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col space-y-3">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full bg-pink-500"></span>
                        <h4 class="text-sm font-semibold text-slate-800">6. Luar Wilayah A & B</h4>
                    </div>
                    <span class="text-[10px] text-pink-600 px-2 py-0.5 bg-pink-50 rounded-full border border-pink-200/50">Komplemen</span>
                </div>
                <div class="h-64 w-full rounded-xl overflow-hidden border border-slate-200" id="sub-map-outside"></div>
            </div>

            <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col space-y-3 md:col-span-2 lg:col-span-3">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        <h4 class="text-sm font-semibold text-slate-800">7. Irisan A ∩ B (Intersection)</h4>
                    </div>
                    <span class="text-[10px] text-amber-600 px-2 py-0.5 bg-amber-50 rounded-full border border-amber-200/50">Irisan</span>
                </div>
                <div class="h-64 w-full rounded-xl overflow-hidden border border-slate-200" id="sub-map-intersect"></div>
            </div>
        </div>
    </div>

    <!-- SCRIPT -->
    <script>
        // High visibility marker color palette for light mode map
        function getSchoolColor(jenjang) {
            if (jenjang === 'SD') return '#0284c7'; // Sky blue
            if (jenjang === 'SMP') return '#e11d48'; // Rose/Red
            return '#059669'; // Emerald/Green (SMA)
        }

        function getSchoolIcon(jenjang) {
            const color = getSchoolColor(jenjang);
            return L.divIcon({
                className: '',
                html: `<div class="custom-school-icon" style="background-color: ${color};"><i class="fa-solid fa-graduation-cap text-[9px]"></i></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12],
                popupAnchor: [0, -12]
            });
        }

        const semuaPolygons = <?php echo json_encode($all_polys_data); ?>;
        const selectedSchools = <?php echo json_encode($list_selected_sekolah); ?>;
        const dataOnlyA = <?php echo json_encode($data_only_a); ?>;
        const dataOnlyB = <?php echo json_encode($data_only_b); ?>;
        const dataUnion = <?php echo json_encode($data_union); ?>;
        const dataDiffAB = <?php echo json_encode($data_diff_ab); ?>;
        const dataDiffBA = <?php echo json_encode($data_diff_ba); ?>;
        const dataOutside = <?php echo json_encode($data_outside); ?>;
        const dataIntersect = <?php echo json_encode($data_intersect); ?>;

        const geomA = <?php echo $geojson_wA; ?>;
        const geomB = <?php echo $geojson_wB; ?>;

        let mapbesar;
        let drawnItems;
        let editingPolygonId = null;
        let editingLayer = null;
        const polygonLayers = {};

        let subMaps = {};
        let subMapLayers = {
            onlyA: L.layerGroup(),
            onlyB: L.layerGroup(),
            union: L.layerGroup(),
            diffAB: L.layerGroup(),
            diffBA: L.layerGroup(),
            outside: L.layerGroup(),
            intersect: L.layerGroup()
        };

        window.onload = function() {
            initMainMap();
            initSubMaps();

            // Custom Multi-select Dropdown handler
            const btn = document.getElementById('school-dropdown-btn');
            const menu = document.getElementById('school-dropdown-menu');
            const arrow = document.getElementById('school-dropdown-arrow');

            if (btn && menu) {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    menu.classList.toggle('hidden');
                    arrow.classList.toggle('rotate-180');
                });

                document.addEventListener('click', function(e) {
                    if (!menu.contains(e.target) && e.target !== btn) {
                        menu.classList.add('hidden');
                        arrow.classList.remove('rotate-180');
                    }
                });
            }
        };

        function initMainMap() {
            mapbesar = L.map('mapbesar').setView([-6.914744, 108.5], 8);
            
            // Clean Light map style (Voyager CartoDB)
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
            }).addTo(mapbesar);

            drawnItems = new L.FeatureGroup().addTo(mapbesar);
            const drawControl = new L.Control.Draw({
                edit: { featureGroup: drawnItems, remove: false, edit: false },
                draw: {
                    polygon: true,
                    marker: false,
                    polyline: false,
                    rectangle: false,
                    circle: false,
                    circlemarker: false
                }
            });
            mapbesar.addControl(drawControl);

            mapbesar.on(L.Draw.Event.CREATED, function (e) {
                const layer = e.layer;
                const geojson = layer.toGeoJSON().geometry;
                
                fetch('index.php?action=save_polygon', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ geojson: geojson })
                })
                .then(res => res.json())
                .then(res => {
                    if (res.status === 'success') {
                        window.location.reload();
                    } else {
                        alert('Gagal menyimpan poligon: ' + res.message);
                    }
                })
                .catch(err => {
                    console.error(err);
                    alert('Terjadi kesalahan koneksi.');
                });
            });

            // Modern color palette for user-drawn boundaries on main map
            const colors = ['#059669', '#0284c7', '#db2777', '#7c3aed', '#ea580c', '#c026d3', '#4f46e5'];
            const boundsArr = [];

            semuaPolygons.forEach((item, index) => {
                const color = colors[index % colors.length];
                const layer = L.geoJSON(item.geojson, {
                    style: { color: color, weight: 3, fillColor: color, fillOpacity: 0.08 }
                }).addTo(mapbesar);
                
                layer.bindTooltip(item.nama, { permanent: true, direction: 'center', className: 'polygon-tooltip' });
                layer.bindPopup(`<strong>${item.nama}</strong>`);
                boundsArr.push(layer);
                polygonLayers[item.id] = layer; // Store reference for editing
            });

            selectedSchools.forEach(sch => {
                const marker = L.marker([sch.lat, sch.lng], { icon: getSchoolIcon(sch.jenjang) }).addTo(mapbesar);
                marker.bindPopup(`<b>${sch.nama_sekolah} (${sch.jenjang})</b>`);
            });

            if (boundsArr.length > 0) {
                mapbesar.fitBounds(L.featureGroup(boundsArr).getBounds().pad(0.1));
            }
        }

        // --- POLYGON GEOMETRIC EDIT FUNCTIONS ---
        function editPolygonGeometry(id, name) {
            // Cancel any active edit first
            if (editingPolygonId) {
                cancelEditing();
            }

            editingPolygonId = id;
            
            // Hide the static layer
            if (polygonLayers[id]) {
                mapbesar.removeLayer(polygonLayers[id]);
            }

            const polyData = semuaPolygons.find(p => p.id === id);
            if (!polyData) return;

            document.getElementById('edit-poly-name').textContent = name;
            document.getElementById('edit-banner').classList.remove('hidden');

            editingLayer = L.geoJSON(polyData.geojson, {
                style: { color: '#d97706', weight: 3.5, fillColor: '#d97706', fillOpacity: 0.18 }
            }).getLayers()[0];

            drawnItems.addLayer(editingLayer);
            editingLayer.editing.enable();
            mapbesar.fitBounds(editingLayer.getBounds().pad(0.15));
        }

        function cancelEditing() {
            if (!editingPolygonId) return;

            // Remove the editing layer
            if (editingLayer) {
                drawnItems.removeLayer(editingLayer);
                editingLayer = null;
            }

            // Restore the static layer
            const id = editingPolygonId;
            if (polygonLayers[id]) {
                polygonLayers[id].addTo(mapbesar);
            }

            editingPolygonId = null;
            document.getElementById('edit-banner').classList.add('hidden');
        }

        function saveEditedPolygon() {
            if (!editingPolygonId || !editingLayer) return;

            const geojson = editingLayer.toGeoJSON().geometry;

            fetch('index.php?action=update_polygon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: editingPolygonId, geojson: geojson })
            })
            .then(res => res.json())
            .then(res => {
                if (res.status === 'success') {
                    window.location.reload();
                } else {
                    alert('Gagal mengupdate poligon: ' + res.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert('Terjadi kesalahan koneksi.');
            });
        }

        function initSubMaps() {
            const subMapIds = {
                onlyA: 'sub-map-only-a',
                onlyB: 'sub-map-only-b',
                union: 'sub-map-union',
                diffAB: 'sub-map-diff-ab',
                diffBA: 'sub-map-diff-ba',
                outside: 'sub-map-outside',
                intersect: 'sub-map-intersect'
            };

            const datasets = {
                onlyA: { data: dataOnlyA, color: '#0284c7' },
                onlyB: { data: dataOnlyB, color: '#059669' },
                union: { data: dataUnion, color: '#7c3aed' },
                diffAB: { data: dataDiffAB, color: '#2563eb' },
                diffBA: { data: dataDiffBA, color: '#e11d48' },
                outside: { data: dataOutside, color: '#db2777', isComplement: true },
                intersect: { data: dataIntersect, color: '#d97706' }
            };

            for (const key in subMapIds) {
                subMaps[key] = L.map(subMapIds[key]).setView([-6.914744, 108.5], 8);

                L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {}).addTo(subMaps[key]);
                subMapLayers[key].addTo(subMaps[key]);

                const conf = datasets[key];
                const lg = subMapLayers[key];

                // Outline references (dashed light border)
                const refStyle = { color: '#94a3b8', weight: 1.5, dashArray: '4, 4', fill: false, interactive: false };
                if (geomA) L.geoJSON(geomA, { style: refStyle }).addTo(lg);
                if (geomB) L.geoJSON(geomB, { style: refStyle }).addTo(lg);

                let mainLayer;
                if (conf.data.geometry) {
                    mainLayer = L.geoJSON(conf.data.geometry, {
                        style: {
                            color: conf.color,
                            fillColor: conf.color,
                            fillOpacity: conf.isComplement ? 0.03 : 0.22,
                            weight: conf.isComplement ? 1 : 2.5
                        }
                    }).bindPopup(`<strong>Hasil Spasial ${key}</strong>`).addTo(lg);
                }

                if (conf.data.markers) {
                    conf.data.markers.forEach(m => {
                        const coords = m.geojson.coordinates;
                        const matchedSch = selectedSchools.find(s => s.nama_sekolah === m.nama);
                        const jenjang = matchedSch ? matchedSch.jenjang : 'SD';
                        L.marker([coords[1], coords[0]], { icon: getSchoolIcon(jenjang) })
                         .bindPopup(`<strong>${m.nama}</strong>`)
                         .addTo(lg);
                    });
                }

                if (mainLayer) {
                    try {
                        subMaps[key].fitBounds(mainLayer.getBounds().pad(0.1));
                    } catch(e) {
                        console.warn(e);
                    }
                } else if (geomA || geomB) {
                    const tempGroup = L.featureGroup();
                    if (geomA) L.geoJSON(geomA).addTo(tempGroup);
                    if (geomB) L.geoJSON(geomB).addTo(tempGroup);
                    try {
                        subMaps[key].fitBounds(tempGroup.getBounds().pad(0.1));
                    } catch(e) {}
                }
            }
        }
    </script>
</body>
</html>