<?php
session_start();
if (!isset($_SESSION['admin_logged_in'])) {
    header("Location: login.php");
    exit;
}

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

// Ajax fetch schools
if (isset($_GET['action']) && $_GET['action'] == 'get_sekolah') {
    header('Content-Type: application/json');
    $query = "SELECT id, nama_sekolah, jenjang, alamat, ST_X(geom) AS lng, ST_Y(geom) AS lat FROM sekolah ORDER BY id DESC";
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    exit;
}

// Add/Update handler
if (isset($_POST['simpan_sekolah'])) {
    $id      = $_POST['id'];
    $nama    = $_POST['nama_sekolah'];
    $jenjang = $_POST['jenjang'];
    $alamat  = $_POST['alamat'];
    $lng     = $_POST['longitude'];
    $lat     = $_POST['latitude'];

    if (!empty($nama) && !empty($lng) && !empty($lat)) {
        if (empty($id)) {
            $query = "INSERT INTO sekolah (nama_sekolah, jenjang, alamat, geom) 
                      VALUES (:nama, :jenjang, :alamat, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))";
            $stmt = $pdo->prepare($query);
            $stmt->execute(['nama' => $nama, 'jenjang' => $jenjang, 'alamat' => $alamat, 'lng' => $lng, 'lat' => $lat]);
        } else {
            $query = "UPDATE sekolah 
                      SET nama_sekolah = :nama, jenjang = :jenjang, alamat = :alamat, 
                          geom = ST_SetSRID(ST_MakePoint(:lng, :lat), 4326) 
                      WHERE id = :id";
            $stmt = $pdo->prepare($query);
            $stmt->execute(['nama' => $nama, 'jenjang' => $jenjang, 'alamat' => $alamat, 'lng' => $lng, 'lat' => $lat, 'id' => $id]);
        }
    }
    header("Location: admin.php");
    exit;
}

// Edit prefill
$sekolah_edit = ['id' => '', 'nama_sekolah' => '', 'jenjang' => 'SD', 'alamat' => '', 'lng' => '', 'lat' => ''];
if (isset($_GET['action']) && $_GET['action'] == 'edit' && isset($_GET['id'])) {
    $query = "SELECT id, nama_sekolah, jenjang, alamat, ST_X(geom) AS lng, ST_Y(geom) AS lat FROM sekolah WHERE id = :id";
    $stmt = $pdo->prepare($query);
    $stmt->execute(['id' => $_GET['id']]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($result) {
        $sekolah_edit = $result;
    }
}

// Delete handler
if (isset($_GET['action']) && $_GET['action'] == 'delete' && isset($_GET['id'])) {
    $id = $_GET['id'];
    $query = "DELETE FROM sekolah WHERE id = :id";
    $stmt = $pdo->prepare($query);
    $stmt->execute(['id' => $id]);
    header("Location: admin.php");
    exit;
}

// Fetch all schools
$list_sekolah = $pdo->query("SELECT id, nama_sekolah, jenjang, alamat, ST_X(geom) AS lng, ST_Y(geom) AS lat FROM sekolah ORDER BY id DESC")->fetchAll(PDO::FETCH_ASSOC);
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Matrix Admin — Kelola Sekolah</title>
    
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    
    <style>
        .leaflet-container { background: #f8fafc; }
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
    </style>
</head>
<body class="bg-slate-50 text-slate-800 font-sans antialiased min-h-screen">

    <div class="max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        <!-- HEADER -->
        <header class="flex flex-col sm:flex-row items-center justify-between border-b border-slate-200 pb-5 gap-4">
            <div>
                <h1 class="text-2xl font-bold tracking-wider text-slate-900 flex items-center gap-2">
                    <i class="fa-solid fa-gears text-emerald-600"></i> PORTAL ADMIN MATRIX
                </h1>
                <p class="text-xs text-slate-500 mt-1">Mengelola penanda sekolah terdaftar dalam database spasial</p>
            </div>
            <div class="flex items-center gap-3">
                <span class="text-xs font-semibold px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg">
                    <i class="fa-solid fa-user-circle mr-1"></i> Admin Aktif
                </span>
                <a href="index.php" class="text-xs font-semibold px-3 py-1.5 border border-slate-300 text-slate-600 hover:text-emerald-600 hover:border-emerald-500 rounded-lg transition-all">
                    <i class="fa-solid fa-globe mr-1"></i> Buka Halaman User
                </a>
                <a href="logout.php" class="text-xs font-semibold px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow-md active:scale-[0.98] transition-all">
                    <i class="fa-solid fa-power-off mr-1"></i> Log Out
                </a>
            </div>
        </header>

        <!-- MAIN LAYOUT -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            <!-- FORM CRUD (Left column - 4 cols) -->
            <div class="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
                <div>
                    <h3 class="text-lg font-bold text-slate-900">
                        <?php echo empty($sekolah_edit['id']) ? 'Tambah Sekolah Baru' : 'Edit Sekolah ID: ' . $sekolah_edit['id']; ?>
                    </h3>
                    <p class="text-xs text-slate-500 mt-1">*Klik di peta kanan untuk menentukan koordinat longitude & latitude otomatis.</p>
                </div>

                <form action="admin.php" method="POST" class="space-y-4">
                    <input type="hidden" name="id" value="<?php echo $sekolah_edit['id']; ?>">

                    <div class="space-y-1.5">
                        <label class="text-xs font-semibold text-slate-600">Nama Sekolah</label>
                        <input type="text" name="nama_sekolah" required 
                               value="<?php echo htmlspecialchars($sekolah_edit['nama_sekolah']); ?>" 
                               class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:border-transparent transition-all"
                               placeholder="Contoh: SMAN 1 Sukolilo">
                    </div>

                    <div class="space-y-1.5">
                        <label class="text-xs font-semibold text-slate-600">Jenjang Pendidikan</label>
                        <select name="jenjang" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all">
                            <option value="SD" <?php echo $sekolah_edit['jenjang'] == 'SD' ? 'selected' : ''; ?>>SD (Sekolah Dasar)</option>
                            <option value="SMP" <?php echo $sekolah_edit['jenjang'] == 'SMP' ? 'selected' : ''; ?>>SMP (Sekolah Menengah Pertama)</option>
                            <option value="SMA" <?php echo $sekolah_edit['jenjang'] == 'SMA' ? 'selected' : ''; ?>>SMA (Sekolah Menengah Atas)</option>
                        </select>
                    </div>

                    <div class="space-y-1.5">
                        <label class="text-xs font-semibold text-slate-600">Alamat</label>
                        <textarea name="alamat" rows="3" required
                                  class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                  placeholder="Nama jalan, nomor, kecamatan..."><?php echo htmlspecialchars($sekolah_edit['alamat']); ?></textarea>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-1.5">
                            <label class="text-xs font-semibold text-slate-600">Longitude (X)</label>
                            <input type="text" id="lng_input" name="longitude" required readonly 
                                   value="<?php echo $sekolah_edit['lng']; ?>" 
                                   class="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-500 cursor-not-allowed outline-none"
                                   placeholder="Klik di peta">
                        </div>
                        <div class="space-y-1.5">
                            <label class="text-xs font-semibold text-slate-600">Latitude (Y)</label>
                            <input type="text" id="lat_input" name="latitude" required readonly 
                                   value="<?php echo $sekolah_edit['lat']; ?>" 
                                   class="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-500 cursor-not-allowed outline-none"
                                   placeholder="Klik di peta">
                        </div>
                    </div>

                    <div class="pt-2 flex gap-2">
                        <?php if (empty($sekolah_edit['id'])): ?>
                            <button type="submit" name="simpan_sekolah" class="flex-grow bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold py-2.5 rounded-lg shadow-md active:scale-[0.98] transition-all text-sm cursor-pointer">
                                <i class="fa-solid fa-save mr-1"></i> Simpan Data Sekolah
                            </button>
                        <?php else: ?>
                            <button type="submit" name="simpan_sekolah" class="flex-grow bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-2.5 rounded-lg shadow-md active:scale-[0.98] transition-all text-sm cursor-pointer">
                                <i class="fa-solid fa-pen-to-square mr-1"></i> Update Data
                            </button>
                            <a href="admin.php" class="text-center px-4 py-2.5 border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-lg text-sm transition-all font-semibold">
                                Batal
                            </a>
                        <?php endif; ?>
                    </div>
                </form>
            </div>

            <!-- MAP INTERFACE (Right column - 8 cols) -->
            <div class="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-2.5 shadow-sm">
                <div id="map" class="h-[480px] w-full rounded-xl overflow-hidden border border-slate-200"></div>
            </div>
        </div>

        <!-- LIST TABLE -->
        <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div class="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
                    <i class="fa-solid fa-table-list text-emerald-600"></i> Daftar Sekolah Terdaftar
                </h3>
                <span class="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200/50">
                    Total: <?php echo count($list_sekolah); ?> Sekolah
                </span>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-slate-100/70 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            <th class="px-6 py-4">Nama Sekolah</th>
                            <th class="px-6 py-4">Jenjang</th>
                            <th class="px-6 py-4">Alamat</th>
                            <th class="px-6 py-4">Koordinat (Long, Lat)</th>
                            <th class="px-6 py-4 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-200 text-sm">
                        <?php if (empty($list_sekolah)): ?>
                            <tr>
                                <td colspan="5" class="px-6 py-10 text-center text-slate-400">
                                    <i class="fa-regular fa-folder-open text-3xl block mb-2 text-slate-300"></i>
                                    Belum ada data sekolah terdaftar.
                                </td>
                            </tr>
                        <?php else: ?>
                            <?php foreach ($list_sekolah as $s): ?>
                                <tr class="hover:bg-slate-50/50 transition-colors">
                                    <td class="px-6 py-4 font-bold text-slate-900"><?php echo htmlspecialchars($s['nama_sekolah']); ?></td>
                                    <td class="px-6 py-4">
                                        <?php 
                                        $badgeColor = $s['jenjang'] == 'SD' ? 'bg-sky-50 text-sky-600 border border-sky-200/50' : ($s['jenjang'] == 'SMP' ? 'bg-rose-50 text-rose-600 border border-rose-200/50' : 'bg-emerald-50 text-emerald-600 border border-emerald-200/50');
                                        ?>
                                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold <?php echo $badgeColor; ?>">
                                            <?php echo $s['jenjang']; ?>
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 text-slate-500 max-w-xs truncate" title="<?php echo htmlspecialchars($s['alamat']); ?>">
                                        <?php echo htmlspecialchars($s['alamat']); ?>
                                    </td>
                                    <td class="px-6 py-4 font-mono text-xs text-slate-400">
                                        <?php echo number_format($s['lng'], 6); ?>, <?php echo number_format($s['lat'], 6); ?>
                                    </td>
                                    <td class="px-6 py-4 text-right space-x-2">
                                        <a href="admin.php?action=edit&id=<?php echo $s['id']; ?>" class="text-amber-600 hover:text-amber-700 font-semibold text-xs inline-flex items-center gap-1">
                                            <i class="fa-solid fa-edit"></i> Edit
                                        </a>
                                        <a href="admin.php?action=delete&id=<?php echo $s['id']; ?>" class="text-rose-600 hover:text-rose-700 font-semibold text-xs inline-flex items-center gap-1" onclick="return confirm('Yakin ingin menghapus?')">
                                            <i class="fa-solid fa-trash"></i> Hapus
                                        </a>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>

    </div>

    <!-- Leaflet JS Map Logic -->
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
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

        const map = L.map('map').setView([-6.914744, 108.5], 8);
        
        // Clean Light map style (Voyager CartoDB)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
        }).addTo(map);

        let activeMarkers = [];
        let clickMarker;

        // Fetch and display all markers on the map
        function loadMarkers() {
            fetch('admin.php?action=get_sekolah')
                .then(res => res.json())
                .then(data => {
                    activeMarkers.forEach(m => map.removeLayer(m));
                    activeMarkers = [];

                    data.forEach(item => {
                        const marker = L.marker([item.lat, item.lng], { icon: getSchoolIcon(item.jenjang) })
                            .addTo(map)
                            .bindPopup(`<b>${item.nama_sekolah} (${item.jenjang})</b><br>${item.alamat}`);
                        activeMarkers.push(marker);
                    });

                    // Auto fit bounds if markers exist
                    if (activeMarkers.length > 0) {
                        const group = L.featureGroup(activeMarkers);
                        map.fitBounds(group.getBounds().pad(0.1));
                    }
                });
        }

        // Map Click Picker
        map.on('click', function(e) {
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;

            document.getElementById('lat_input').value = lat.toFixed(6);
            document.getElementById('lng_input').value = lng.toFixed(6);

            if (clickMarker) { map.removeLayer(clickMarker); }
            clickMarker = L.circleMarker([lat, lng], { color: '#059669', radius: 8, fillOpacity: 0.8 }).addTo(map)
                .bindPopup("<div class='text-xs font-semibold text-slate-900'>Koordinat dipilih</div>").openPopup();
        });

        // Prefill logic for edit mode
        <?php if (!empty($sekolah_edit['id'])): ?>
            clickMarker = L.circleMarker([<?php echo $sekolah_edit['lat']; ?>, <?php echo $sekolah_edit['lng']; ?>], { color: '#f59e0b', radius: 8, fillOpacity: 0.8 }).addTo(map)
                .bindPopup("<b>Posisi Lama:</b> <?php echo htmlspecialchars($sekolah_edit['nama_sekolah']); ?>").openPopup();
            map.setView([<?php echo $sekolah_edit['lat']; ?>, <?php echo $sekolah_edit['lng']; ?>], 14);
        <?php endif; ?>

        loadMarkers();
    </script>
</body>
</html>
