<!-- MAP CONTAINER (Left) -->
<div class="glass-card" style="padding:6px;overflow:hidden;position:relative;">
    <div id="map"></div>

    <!-- Map Overlay Controls -->
    <div style="position:absolute;top:12px;right:12px;z-index:1000;display:flex;gap:8px;align-items:flex-start;">

        <!-- Heatmap Button -->
        <button id="heatmapBtn" onclick="toggleHeatmap()"
            style="display:flex;align-items:center;gap:6px;padding:7px 12px;background:rgba(255,255,255,0.95);border:1px solid #e5e7eb;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.08);cursor:pointer;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#374151;transition:all .15s;backdrop-filter:blur(8px);"
            class="dark:bg-slate-900/95 dark:border-slate-700 dark:text-slate-200">
            <i data-lucide="flame" style="width:14px;height:14px;color:#f59e0b;stroke:#f59e0b;flex-shrink:0;"></i>
            Heatmap
        </button>

        <!-- Basemap Selector -->
        <div style="position:relative;">
            <button id="basemapBtn"
                style="display:flex;align-items:center;gap:6px;padding:7px 12px;background:rgba(255,255,255,0.95);border:1px solid #e5e7eb;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.08);cursor:pointer;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#374151;transition:all .15s;backdrop-filter:blur(8px);"
                class="dark:bg-slate-900/95 dark:border-slate-700 dark:text-slate-200">
                <i data-lucide="layers" style="width:14px;height:14px;color:#10b981;stroke:#10b981;flex-shrink:0;"></i>
                Pilih Peta
            </button>

            <!-- Basemap Dropdown Panel -->
            <div id="basemapDropdown" class="hidden"
                style="position:absolute;top:calc(100% + 6px);right:0;width:290px;background:rgba(255,255,255,0.97);border:1px solid rgba(229,231,235,0.8);border-radius:14px;box-shadow:0 10px 30px -5px rgba(0,0,0,0.12);padding:14px;backdrop-filter:blur(12px);z-index:1001;"
                class="dark:bg-slate-900/97 dark:border-slate-700">
                <div style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:#9ca3af;padding-bottom:8px;border-bottom:1px solid #f3f4f6;margin-bottom:10px;">
                    Tampilan Peta
                </div>
                <div style="display:grid;grid-template-columns:repeat(2, 1fr);gap:7px;">
                    <?php
                    $maps = [
                        ['key'=>'osm',            'label'=>'OpenStreetMap',   'from'=>'from-sky-400',    'to'=>'to-emerald-400',  'icon'=>'map'],
                        ['key'=>'google_streets',  'label'=>'Google Streets',  'from'=>'from-blue-400',   'to'=>'to-indigo-500',   'icon'=>'compass'],
                        ['key'=>'google_satellite','label'=>'Google Satellite','from'=>'from-emerald-800','to'=>'to-cyan-900',     'icon'=>'globe'],
                        ['key'=>'google_hybrid',   'label'=>'Google Hybrid',   'from'=>'from-slate-800',  'to'=>'to-emerald-700',  'icon'=>'layers'],
                        ['key'=>'google_terrain',  'label'=>'Google Terrain',  'from'=>'from-amber-500',  'to'=>'to-emerald-600',  'icon'=>'mountain'],
                        ['key'=>'esri_satellite',  'label'=>'Esri Satellite',  'from'=>'from-teal-900',   'to'=>'to-blue-950',     'icon'=>'satellite'],
                        ['key'=>'esri_street',     'label'=>'Esri Street',     'from'=>'from-orange-200', 'to'=>'to-yellow-400',   'icon'=>'map-pin'],
                        ['key'=>'carto_light',     'label'=>'Carto Light',     'from'=>'from-gray-100',   'to'=>'to-slate-200',    'icon'=>'sun'],
                        ['key'=>'carto_dark',      'label'=>'Carto Dark',      'from'=>'from-gray-800',   'to'=>'to-slate-950',    'icon'=>'moon'],
                        ['key'=>'topo',            'label'=>'OpenTopo',        'from'=>'from-emerald-200','to'=>'to-stone-500',    'icon'=>'compass'],
                    ];
                    foreach ($maps as $m): ?>
                    <button type="button" onclick="changeBasemap('<?= $m['key'] ?>')"
                        data-key="<?= $m['key'] ?>"
                        class="basemap-card"
                        style="display:flex;flex-direction:column;align-items:center;padding:8px;border-radius:10px;border:1.5px solid #e5e7eb;background:#fff;cursor:pointer;text-align:center;width:100%;transition:all .15s;">
                        <div class="w-full h-10 rounded-lg mb-1.5 bg-gradient-to-tr <?= $m['from'] ?> <?= $m['to'] ?> flex items-center justify-center shadow-inner">
                            <i data-lucide="<?= $m['icon'] ?>" style="width:16px;height:16px;color:rgba(255,255,255,0.9);filter:drop-shadow(0 1px 2px rgba(0,0,0,0.2));"></i>
                        </div>
                        <span style="font-size:9px;font-weight:700;color:#374151;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%;"><?= $m['label'] ?></span>
                    </button>
                    <?php endforeach; ?>
                </div>
            </div>
        </div>
    </div>
</div>
