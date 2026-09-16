<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Latihan PHP Dasar</title>
    <style>
        body { font-family: sans-serif; line-height: 1.6; padding: 20px; }
        .section { margin-bottom: 30px; border-bottom: 1px solid #ccc; pb: 10px; }
        h2 { color: #333; }
    </style>
</head>
<body>

    <div class="section">
    <h2>1. Deteksi Kategori Usia</h2>

    <form method="POST">
        <input type="number" name="umur" placeholder="Masukkan umur" required>
        <button type="submit">Cek Kategori</button>
    </form>

    <?php
    if (isset($_POST['umur'])) {
        $umur = (int) $_POST['umur'];

        if ($umur < 18) {
            echo "Kategori: <strong>Anak-anak</strong>";
        } elseif ($umur < 60) {
            echo "Kategori: <strong>Dewasa</strong>";
        } elseif ($umur < 100) {
            echo "Kategori: <strong>Orang Tua</strong>";
        }else {
            echo "Kategori: <b>Omakk gelo boss</b>";
        }
    }
    ?>
</div>

    <div class="section array">
        <?php
            $data = "abdul";
            $data2 = "imam";
            $data3 = "joko";

            $data = [$data, $data2, $data3];
            
            foreach ($data as $nilai) {
                echo "nama: $nilai";
                echo "<br>";
            }

        ?>
    </div>

    <div class="sectionn">

    <form method="POST">
        <input type="text" name="nama" placeholder="Masukkan nama">
        <button type="submit">Tambah</button>
    </form>

    <?php
        session_start();

        if (!isset($_SESSION['data'])) {
            $_SESSION['data'] = [];
        }

        if (isset($_POST['nama']) && $_POST['nama'] != '') {
            $_SESSION['data'][] = $_POST['nama'];
        }

        foreach ($_SESSION['data'] as $nilai) {
            echo "Nama: $nilai <br>";
        }
    ?>

</div>

    <div class="section">
        <h2>2. Deretan Angka 1-10 (Kecuali 3 dan 8)</h2>
        <?php
        $i = 1;

        while ($i <= 10) {
            // Menggunakan if..else sesuai permintaan
            if ($i == 3 || $i == 8) {
                // Jika angka 3 atau 8, tidak melakukan apa-apa
            } else {
                echo $i . " ";
            }
            
            $i++; // Increment
        }
        ?>
    </div>

</body>
</html>