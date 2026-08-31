<!DOCTYPE html>
<html lang="id" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Web GIS — Fasilitas Kesehatan Kota Bandung</title>
    <meta name="description" content="Sistem Informasi Geografis Fasilitas Kesehatan per Kecamatan. Analisis spasial overlay puskesmas dan rumah sakit.">

    <!-- Leaflet CSS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
    <!-- Leaflet Draw CSS -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css"/>
    <!-- FontAwesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>
    <!-- Custom CSS -->
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>

<!-- ===================== HEADER ===================== -->
<header>
    <h1>
        <div class="brand-icon"><i class="fas fa-map-marked-alt"></i></div>
        Web <span>GIS</span>
    </h1>
    <div class="header-nav">
        <button class="btn btn-outline btn-sm" onclick="openTutorialDialog()">
            <i class="fas fa-question-circle"></i> <span class="btn-text">Panduan</span>
        </button>
        <a href="admin/index.php" class="btn btn-secondary btn-sm">
            <i class="fas fa-cog"></i> <span class="btn-text">Admin</span>
        </a>
    </div>
</header>

<!-- ===================== TOAST ===================== -->
<div id="toast-container"></div>

<!-- ===================== APP LAYOUT ===================== -->
<div class="app-layout">

