<?php
// =========================================================================
// 1. BAGIAN BACKEND (LOGIKA DATABASE & CRUD LENGKAP)
// =========================================================================

$host     = "localhost";
$port     = "5432";
$dbname   = "diki"; 
$user     = "postgres"; 
$password = "admin123"; // <-- GANTI DENGAN PASSWORD PGADMIN KAMU

try {
    $pdo = new PDO("pgsql:host=$host;port=$port;dbname=$dbname", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Koneksi database gagal: " . $e->getMessage());
}

// ---- BACKEND ACTION 1: AJAX Ambil Data Sekolah (Read Spasial untuk Peta) ----
if (isset($_GET['action']) && $_GET['action'] == 'get_sekolah') {
    header('Content-Type: application/json');
    $kecamatan_id = isset($_GET['kecamatan_id']) ? $_GET['kecamatan_id'] : 'semua';

    if ($kecamatan_id === 'semua' || $kecamatan_id === '') {
        $query = "SELECT id, nama_sekolah, jenjang, alamat, ST_X(geom) AS lng, ST_Y(geom) AS lat FROM sekolah ORDER BY id DESC";
        $stmt = $pdo->prepare($query);
        $stmt->execute();
    } else {
        $query = "SELECT s.id, s.nama_sekolah, s.jenjang, s.alamat, ST_X(s.geom) AS lng, ST_Y(s.geom) AS lat 
                  FROM sekolah s
                  JOIN kecamatan k ON ST_Contains(k.geom, s.geom)
                  WHERE k.id = :id ORDER BY s.id DESC";
        $stmt = $pdo->prepare($query);
        $stmt->execute(['id' => $kecamatan_id]);
    }
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    exit;
}

// ---- BACKEND ACTION 2: Tambah Data Baru (Create) / Simpan Perubahan (Update) ----
if (isset($_POST['simpan_sekolah'])) {
    $id      = $_POST['id']; // Jika kosong berarti Create, jika ada isi berarti Update
    $nama    = $_POST['nama_sekolah'];
    $jenjang = $_POST['jenjang'];
    $alamat  = $_POST['alamat'];
    $lng     = $_POST['longitude'];
    $lat     = $_POST['latitude'];

    if (!empty($nama) && !empty($lng) && !empty($lat)) {
        if (empty($id)) {
            // Logika CREATE
            $query = "INSERT INTO sekolah (nama_sekolah, jenjang, alamat, geom) 
                      VALUES (:nama, :jenjang, :alamat, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))";
            $stmt = $pdo->prepare($query);
            $stmt->execute(['nama' => $nama, 'jenjang' => $jenjang, 'alamat' => $alamat, 'lng' => $lng, 'lat' => $lat]);
        } else {
            // Logika UPDATE
            $query = "UPDATE sekolah 
                      SET nama_sekolah = :nama, jenjang = :jenjang, alamat = :alamat, 
                          geom = ST_SetSRID(ST_MakePoint(:lng, :lat), 4326) 
                      WHERE id = :id";
            $stmt = $pdo->prepare($query);
            $stmt->execute(['nama' => $nama, 'jenjang' => $jenjang, 'alamat' => $alamat, 'lng' => $lng, 'lat' => $lat, 'id' => $id]);
        }
    }
    header("Location: index.php");
    exit;
}

// ---- BACKEND ACTION 3: Ambil Data Sekolah Tertentu untuk Mode Edit ----
$sekolah_edit = ['id' => '', 'nama_sekolah' => '', 'jenjang' => 'SD', 'alamat' => '', 'lng' => '', 'lat' => ''];
if (isset($_GET['action']) && $_GET['action'] == 'edit' && isset($_GET['id'])) {
    $query = "SELECT id, nama_sekolah, jenjang, alamat, ST_X(geom) AS lng, ST_Y(geom) AS lat FROM sekolah WHERE id = :id";
    $stmt = $pdo->prepare($query);
    $stmt->execute(['id' => $_GET['id']]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($result) {
        $sekolah_edit = $result; // Menyimpan data lama sekolah ke variabel form
    }
}

// ---- BACKEND ACTION 4: Proses Hapus Data (Delete) ----
if (isset($_GET['action']) && $_GET['action'] == 'delete' && isset($_GET['id'])) {
    $id = $_GET['id'];
    $query = "DELETE FROM sekolah WHERE id = :id";
    $stmt = $pdo->prepare($query);
    $stmt->execute(['id' => $id]);
    header("Location: index.php");
    exit;
}

// Ambil data untuk komponen Dropdown & Tabel Utama
$list_kecamatan = $pdo->query("SELECT id, nama_kecamatan FROM kecamatan")->fetchAll(PDO::FETCH_ASSOC);
$list_sekolah = $pdo->query("SELECT id, nama_sekolah, jenjang, alamat, ST_X(geom) AS lng, ST_Y(geom) AS lat FROM sekolah ORDER BY id DESC")->fetchAll(PDO::FETCH_ASSOC);
?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>WebGIS Sekolah - CRUD Lengkap</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f6f9; }
        .container { max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
        .row { display: flex; gap: 20px; }
        .col-8 { flex: 2; }
        .col-4 { flex: 1; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        select, input, textarea { width: 100%; padding: 8px; margin: 8px 0 15px 0; border-radius: 4px; border: 1px solid #ccc; box-sizing: border-box; }
        .btn-submit { background: #28a745; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; width: 100%; font-size: 16px; }
        .btn-submit.mode-edit { background: #ffc107; color: black; }
        #map { height: 460px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; background: white; }
        table, th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background-color: #007bff; color: white; }
        .btn-edit { color: #ffc107; text-decoration: none; font-weight: bold; margin-right: 10px; }
        .btn-delete { color: red; text-decoration: none; font-weight: bold; }
        .btn-batal { background: #6c757d; color: white; text-align: center; display: block; padding: 8px; border-radius: 4px; text-decoration: none; margin-top: 5px; font-size: 14px; }
    </style>
</head>
<body>

<div class="container">
    <h2>Sistem Informasi Geografis & CRUD Pemetaan Sekolah (Full)</h2>
    
    <div class="row">
        <div class="col-8">
            <div class="card" style="margin-bottom: 15px;">
                <label for="kecamatan"><b>Filter Berdasarkan Kecamatan (Overlay):</b></label>
                <select id="kecamatan" onchange="loadSekolahSpasial()" style="width: 300px;">
                    <option value="semua">-- Tampilkan Semua Sekolah --</option>
                    <?php foreach ($list_kecamatan as $kec): ?>
                        <option value="<?= $kec['id']; ?>"><?= $kec['nama_kecamatan']; ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div id="map"></div>
        </div>

        <div class="col-4">
            <div class="card">
                <h3><?= empty($sekolah_edit['id']) ? '[Admin] Tambah Sekolah' : '[Admin] Edit Sekolah ID: '.$sekolah_edit['id']; ?></h3>
                <small style="color: blue; display:block; margin-bottom:10px;">*Klik lokasi baru di peta untuk mengganti/mengisi koordinat otomatis.</small>
                
                <form action="index.php" method="POST">
                    <input type="hidden" name="id" value="<?= $sekolah_edit['id']; ?>">

                    <label>Nama Sekolah</label>
                    <input type="text" name="nama_sekolah" required value="<?= htmlspecialchars($sekolah_edit['nama_sekolah']); ?>" placeholder="Contoh: SMAN 1 Sukolilo">

                    <label>Jenjang</label>
                    <select name="jenjang">
                        <option value="SD" <?= $sekolah_edit['jenjang'] == 'SD' ? 'selected' : ''; ?>>SD</option>
                        <option value="SMP" <?= $sekolah_edit['jenjang'] == 'SMP' ? 'selected' : ''; ?>>SMP</option>
                        <option value="SMA" <?= $sekolah_edit['jenjang'] == 'SMA' ? 'selected' : ''; ?>>SMA</option>
                    </select>

                    <label>Alamat</label>
                    <textarea name="alamat" rows="3" placeholder="Nama Jalan, No..."><?= htmlspecialchars($sekolah_edit['alamat']); ?></textarea>

                    <label>Longitude (X)</label>
                    <input type="text" id="lng_input" name="longitude" required readonly value="<?= $sekolah_edit['lng']; ?>" placeholder="Klik pada peta">

                    <label>Latitude (Y)</label>
                    <input type="text" id="lat_input" name="latitude" required readonly value="<?= $sekolah_edit['lat']; ?>" placeholder="Klik pada peta">

                    <?php if (empty($sekolah_edit['id'])): ?>
                        <button type="submit" name="simpan_sekolah" class="btn-submit">Simpan Data Sekolah</button>
                    <?php else: ?>
                        <button type="submit" name="simpan_sekolah" class="btn-submit mode-edit">Update Data Sekolah</button>
                        <a href="index.php" class="btn-batal">Batal Edit</a>
                    <?php endif; ?>
                </form>
            </div>
        </div>
    </div>

    <div class="card">
        <h3>[Admin] Manajemen Tabel Data Sekolah</h3>
        <table>
            <thead>
                <tr>
                    <th>Nama Sekolah</th>
                    <th>Jenjang</th>
                    <th>Alamat</th>
                    <th>Koordinat</th>
                    <th>Aksi</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($list_sekolah as $s): ?>
                <tr>
                    <td><?= htmlspecialchars($s['nama_sekolah']); ?></td>
                    <td><?= $s['jenjang']; ?></td>
                    <td><?= htmlspecialchars($s['alamat']); ?></td>
                    <td><small><?= $s['lng']; ?>, <?= $s['lat']; ?></small></td>
                    <td>
                        <a href="index.php?action=edit&id=<?= $s['id']; ?>" class="btn-edit">Edit</a>
                        <a href="index.php?action=delete&id=<?= $s['id']; ?>" class="btn-delete" onclick="return confirm('Yakin ingin menghapus?')">Hapus</a>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
    const map = L.map('map').setView([-7.27, 112.78], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);

    let markersLayer = [];
    let clickMarker;

    function loadSekolahSpasial() {
        const idKecamatan = document.getElementById('kecamatan').value;
        fetch(`index.php?action=get_sekolah&kecamatan_id=${idKecamatan}`)
            .then(response => response.json())
            .then(dataSekolah => {
                markersLayer.forEach(marker => map.removeLayer(marker));
                markersLayer = [];

                dataSekolah.forEach(sekolah => {
                    const marker = L.marker([sekolah.lat, schools=sekolah.lng])
                        .addTo(map)
                        .bindPopup(`<b>${sekolah.nama_sekolah} (${sekolah.jenjang})</b><br>${sekolah.alamat}`);
                    
                    // Ganti struktur syntax leaflet binding koordinat yang benar
                    marker.setLatLng([sekolah.lat, sekolah.lng]);
                    markersLayer.push(marker);
                });
            });
    }

    // Map Picker: Klik peta otomatis isi koordinat form
    map.on('click', function(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        document.getElementById('lat_input').value = lat.toFixed(6);
        document.getElementById('lng_input').value = lng.toFixed(6);

        if (clickMarker) { map.removeLayer(clickMarker); }
        clickMarker = L.circleMarker([lat, lng], { color: 'orange', radius: 8 }).addTo(map)
            .bindPopup("Koordinat dipilih").openPopup();
    });

    // Jika sedang dalam mode edit, plot marker titik lama di peta saat load halaman
    <?php if (!empty($sekolah_edit['id'])): ?>
        clickMarker = L.circleMarker([<?= $sekolah_edit['lat']; ?>, <?= $sekolah_edit['lng']; ?>], { color: 'red', radius: 8 }).addTo(map)
            .bindPopup("Posisi Lama: <?= htmlspecialchars($sekolah_edit['nama_sekolah']); ?>").openPopup();
        map.setView([<?= $sekolah_edit['lat']; ?>, <?= $sekolah_edit['lng']; ?>], 14);
    <?php endif; ?>

    loadSekolahSpasial();
</script>
</body>
</html>