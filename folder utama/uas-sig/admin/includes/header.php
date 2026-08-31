<!DOCTYPE html>
<html lang="id" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin — Web GIS Fasilitas Kesehatan</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>

<!-- ========== HEADER ========== -->
<header>
    <h1>
        <div class="brand-icon"><i class="fas fa-cog"></i></div>
        <span class="brand-text">Panel <span>Admin</span></span>
    </h1>
    <div class="header-nav">
        <a href="../index.php" class="btn btn-outline btn-sm"><i class="fas fa-map"></i> <span class="btn-text">Peta</span></a>
        <?php if ($logged_in): ?>
        <a href="?logout=1" class="btn btn-danger btn-sm"><i class="fas fa-sign-out-alt"></i> <span class="btn-text">Logout</span></a>
        <?php endif; ?>
    </div>
</header>

<div id="toast-container"></div>
