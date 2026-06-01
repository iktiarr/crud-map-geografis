<?php
$conn = @pg_connect("host=localhost port=5432 dbname=uts_sig user=postgres password=admin123");
if (!$conn) {
    echo "FAILED_TO_CONNECT: " . pg_last_error();
    exit;
}

$res = @pg_query($conn, "SELECT postgis_full_version()");
if ($res) {
    echo pg_fetch_result($res, 0, 0);
} else {
    echo "POSTGIS_NOT_FOUND: " . pg_last_error($conn);
}
?>
