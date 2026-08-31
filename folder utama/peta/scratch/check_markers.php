<?php
$conn = @pg_connect("host=localhost port=5432 dbname=uts_sig user=postgres password=admin123");
if (!$conn) die("Koneksi gagal");

$res = pg_query($conn, "SELECT 1 FROM information_schema.tables WHERE table_name = 'markers'");
if (pg_num_rows($res) > 0) {
    echo "Tabel markers ADA di uts_sig\n";
} else {
    echo "Tabel markers TIDAK ADA di uts_sig\n";
}
?>
