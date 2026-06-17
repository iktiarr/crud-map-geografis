<?php
$pdo = require 'config/database.php';
$r = $pdo->query('SELECT COUNT(*) as total FROM fasilitas_kesehatan')->fetch();
$k = $pdo->query('SELECT COUNT(*) as total FROM kecamatan')->fetch();
echo 'Fasilitas: ' . $r['total'] . PHP_EOL;
echo 'Kecamatan: ' . $k['total'] . PHP_EOL;
echo 'DATABASE OK!' . PHP_EOL;
