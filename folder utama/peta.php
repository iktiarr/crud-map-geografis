<?php
/**
 * peta.php — GIS Manager | Open Source Edition
 * Entry point: routes API calls to peta/api.php, otherwise renders HTML.
 */

error_reporting(0);
ini_set('display_errors', 0);

// Route AJAX requests directly to api.php
if (isset($_GET['action'])) {
    require_once __DIR__ . '/peta/api.php';
    exit;
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GeoPortal — GIS Manager Open Source</title>
    <meta name="description" content="Aplikasi GIS Interaktif untuk memetakan titik, garis, area, dan berbagai layer spasial secara real-time dengan basis data PostGIS.">

    <!-- Tailwind (used for utilities in markup) -->
    <script>
        // Must run before Tailwind loads to prevent FOUC
        (function() {
            const pref = localStorage.getItem('theme');
            if (pref === 'dark' || (!pref && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
            }
        })();
    </script>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] }
                }
            }
        }
    </script>

    <!-- Leaflet -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

    <!-- Leaflet Draw -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js"></script>

    <!-- Leaflet Heat -->
    <script src="https://unpkg.com/leaflet.heat/dist/leaflet-heat.js"></script>

    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>

    <!-- App Stylesheet -->
    <link rel="stylesheet" href="peta/assets/style.css">
</head>
<body class="dark:bg-[#0b0f19] dark:text-slate-100">

<!-- NAVBAR -->
<?php include __DIR__ . '/peta/partials/navbar.php'; ?>

<div class="page-wrapper">

    <!-- ── Map + Sidebar ──────────────────────────────────────── -->
    <div class="main-grid">
        <?php include __DIR__ . '/peta/partials/map.php'; ?>
        <?php include __DIR__ . '/peta/partials/form.php'; ?>
    </div><!-- /main-grid -->

    <!-- ── Data Table (Below Grid) ────────────────────────────── -->
    <?php include __DIR__ . '/peta/partials/table.php'; ?>

</div><!-- /page-wrapper -->

<!-- DROPDOWNS & MODALS -->
<?php include __DIR__ . '/peta/partials/menu.php'; ?>
<?php include __DIR__ . '/peta/partials/about.php'; ?>

<!-- TOAST CONTAINER -->
<div id="sonnerContainer"></div>

<!-- ── Extra style for spin animation ── -->
<style>
    @keyframes spin { to { transform: rotate(360deg); } }
    .form-status { transition: background .2s ease, color .2s ease; }
    .dot { display:inline-block; width:6px; height:6px; border-radius:50%; flex-shrink:0; }
</style>

<!-- App JS -->
<script src="peta/assets/map.js"></script>

<script>
    // Re-initialize lucide icons after page load
    lucide.createIcons();
</script>

</body>
</html>