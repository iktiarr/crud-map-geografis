<?php
$host = 'localhost';
$port = '5432'; 
$dbname = 'uts_sig';
$user = 'postgres';
$password = 'admin123';

$conn = @pg_connect("host=$host port=$port dbname=$dbname user=$user password=$password");

if (!$conn) {
    die("Koneksi gagal: " . pg_last_error());
}

$sql = "
CREATE TABLE IF NOT EXISTS peta_crud (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    deskripsi TEXT,
    tipe VARCHAR(50) NOT NULL,
    geom GEOMETRY NOT NULL
);
CREATE INDEX IF NOT EXISTS peta_crud_geom_idx ON peta_crud USING GIST (geom);
";

$rs = pg_query($conn, $sql);

if ($rs) {
    echo "Tabel 'peta_crud' berhasil dibuat atau sudah ada.\n";
} else {
    echo "Gagal membuat tabel: " . pg_last_error($conn) . "\n";
}
?>
