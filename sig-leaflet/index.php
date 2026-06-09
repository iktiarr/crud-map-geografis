<?php
// index.php
// Koneksi database untuk fetch awal
$pdo = require __DIR__ . '/config/database.php';

try {
    $query = "
        SELECT 
            g.id, 
            g.nama_group, 
            g.deskripsi, 
            g.created_at,
            (SELECT COUNT(*) FROM wilayah w WHERE w.group_id = g.id) AS jumlah_wilayah,
            (SELECT COUNT(*) FROM markers m WHERE m.group_id = g.id) AS jumlah_marker,
            EXISTS(SELECT 1 FROM group_boundary gb WHERE gb.group_id = g.id) AS has_boundary
        FROM groups g
        ORDER BY g.created_at DESC
    ";
    
    $stmt = $pdo->query($query);
    $groups = $stmt->fetchAll();
} catch (Exception $e) {
    $groups = [];
    $error_msg = $e->getMessage();
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SIG Spasial - Kelola Group Wilayah</title>
    <!-- Google Fonts & FontAwesome -->
    <link rel="stylesheet" href="assets/css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>

    <header>
        <h1><i class="fas fa-map-marked-alt"></i> SIG <span>Spasial</span></h1>
        <button class="btn btn-primary" onclick="openModal()"><i class="fas fa-plus"></i> Tambah Group Baru</button>
    </header>

    <main class="container">
        <div class="dashboard-header">
            <div>
                <h2>Daftar Group Wilayah & Marker</h2>
                <p style="color: var(--text-secondary); margin-top: 0.25rem;">Pilih atau buat group wilayah untuk memulai analisis spasial spasial PostGIS.</p>
            </div>
            <!-- Live Search input -->
            <div style="position: relative; width: 300px;">
                <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-secondary);"><i class="fas fa-search"></i></span>
                <input type="text" id="search-input" placeholder="Cari group..." class="form-control" style="padding-left: 36px;" onkeyup="filterGroups()">
            </div>
        </div>

        <?php if (isset($error_msg)): ?>
            <div style="background-color: #fee2e2; border-left: 4px solid var(--danger); padding: 1rem; border-radius: 0.5rem; color: #991b1b; margin-bottom: 2rem;">
                <strong>Koneksi Database Bermasalah:</strong> <?php echo htmlspecialchars($error_msg); ?><br>
                <span style="font-size: 0.875rem;">Pastikan database <code>uts_sig</code> telah dibuat dan extension <code>postgis</code> diaktifkan.</span>
            </div>
        <?php endif; ?>

        <?php if (empty($groups)): ?>
            <div class="empty-state">
                <i class="fas fa-map-marked" style="font-size: 3.5rem; color: var(--border-color); margin-bottom: 1rem;"></i>
                <h3>Belum Ada Group Peta</h3>
                <p>Silakan buat group peta terlebih dahulu untuk menambahkan wilayah polygon dan marker.</p>
                <button class="btn btn-primary" onclick="openModal()"><i class="fas fa-plus"></i> Buat Group Pertama</button>
            </div>
        <?php else: ?>
            <div class="group-grid" id="group-container">
                <?php foreach ($groups as $group): ?>
                    <div class="group-card" data-name="<?php echo htmlspecialchars(strtolower($group['nama_group'])); ?>">
                        <div>
                            <h3><?php echo htmlspecialchars($group['nama_group']); ?></h3>
                            <p><?php echo htmlspecialchars($group['deskripsi'] ?: 'Tidak ada deskripsi untuk group ini.'); ?></p>
                        </div>
                        
                        <div>
                            <div class="group-stats">
                                <div class="stat-item">
                                    <span class="stat-val"><?php echo $group['jumlah_wilayah']; ?></span>
                                    <span class="stat-lbl">Wilayah</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-val"><?php echo $group['jumlah_marker']; ?></span>
                                    <span class="stat-lbl">Marker</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-val" style="color: <?php echo $group['has_boundary'] ? 'var(--success)' : 'var(--danger)'; ?>">
                                        <i class="fas <?php echo $group['has_boundary'] ? 'fa-check-circle' : 'fa-times-circle'; ?>"></i>
                                    </span>
                                    <span class="stat-lbl">Batas Acuan</span>
                                </div>
                            </div>
                            
                            <div class="group-actions">
                                <span style="font-size: 0.75rem; color: var(--text-secondary);">
                                    Dibuat: <?php echo date('d M Y', strtotime($group['created_at'])); ?>
                                </span>
                                <div style="display: flex; gap: 0.5rem;">
                                    <button class="btn btn-danger btn-sm" onclick="deleteGroup(<?php echo $group['id']; ?>, '<?php echo addslashes($group['nama_group']); ?>')">
                                        <i class="fas fa-trash"></i> Hapus
                                    </button>
                                    <a href="group.php?id=<?php echo $group['id']; ?>" class="btn btn-primary btn-sm">
                                        <i class="fas fa-external-link-alt"></i> Buka Peta
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </main>

    <!-- Modal Buat Group Baru -->
    <div class="modal-backdrop" id="group-modal">
        <div class="modal">
            <div class="modal-header">
                <h3><i class="fas fa-folder-plus"></i> Tambah Group Peta Baru</h3>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            <form id="create-group-form" onsubmit="submitNewGroup(event)">
                <div class="form-group">
                    <label for="nama_group">Nama Group Peta</label>
                    <input type="text" id="nama_group" required class="form-control" placeholder="Contoh: Kawasan Kota Bandung">
                </div>
                <div class="form-group">
                    <label for="deskripsi">Deskripsi</label>
                    <textarea id="deskripsi" class="form-control" rows="3" placeholder="Deskripsi singkat mengenai wilayah cakupan peta..."></textarea>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline" onclick="closeModal()">Batal</button>
                    <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Simpan Group</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        // Membuka modal
        function openModal() {
            document.getElementById('group-modal').classList.add('show');
        }

        // Menutup modal
        function closeModal() {
            document.getElementById('group-modal').classList.remove('show');
            document.getElementById('create-group-form').reset();
        }

        // Live search filter
        function filterGroups() {
            const query = document.getElementById('search-input').value.toLowerCase();
            const cards = document.querySelectorAll('.group-card');
            
            cards.forEach(card => {
                const name = card.getAttribute('data-name');
                if (name.includes(query)) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        }

        // Kirim data group baru ke API
        function submitNewGroup(e) {
            e.preventDefault();
            const nama = document.getElementById('nama_group').value;
            const deskripsi = document.getElementById('deskripsi').value;

            fetch('api/create_group.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nama_group: nama, deskripsi: deskripsi })
            })
            .then(res => res.json())
            .then(res => {
                if (res.status === 'success') {
                    closeModal();
                    alert(res.message);
                    window.location.reload(); // Reload halaman untuk memuat ulang daftar
                } else {
                    alert('Gagal: ' + res.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert('Terjadi kesalahan koneksi.');
            });
        }

        // Hapus group wilayah
        function deleteGroup(id, name) {
            if (confirm(`Apakah Anda yakin ingin menghapus group "${name}"? Semua data wilayah, boundary, dan marker di dalamnya akan ikut terhapus secara permanen.`)) {
                fetch('api/delete_group.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: id })
                })
                .then(res => res.json())
                .then(res => {
                    if (res.status === 'success') {
                        alert(res.message);
                        window.location.reload();
                    } else {
                        alert('Gagal menghapus: ' + res.message);
                    }
                })
                .catch(err => {
                    console.error(err);
                    alert('Terjadi kesalahan saat menghapus group.');
                });
            }
        }
    </script>
</body>
</html>
