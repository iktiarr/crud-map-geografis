<!-- GLOBAL ACTION MENU (Floating dropdown for each row) -->
<div id="globalActionMenu" class="hidden" style="position:fixed;z-index:9999;width:210px;padding:8px 6px;">
    <!-- Actions -->
    <div style="padding:0 2px 6px;">
        <button onclick="handleGlobalFokus()" style="width:100%;display:flex;align-items:center;gap:9px;padding:7px 10px;border:none;background:none;border-radius:8px;cursor:pointer;font-size:11px;font-weight:700;color:#374151;transition:all .12s;" onmouseover="this.style.background='rgba(16,185,129,0.06)';this.style.color='#059669'" onmouseout="this.style.background='';this.style.color='#374151'" class="dark:text-slate-300">
            <i data-lucide="eye" style="width:14px;height:14px;color:#f59e0b;stroke:#f59e0b;flex-shrink:0;"></i>
            <span>Fokus Peta</span>
        </button>
        <button onclick="handleGlobalEdit()" style="width:100%;display:flex;align-items:center;gap:9px;padding:7px 10px;border:none;background:none;border-radius:8px;cursor:pointer;font-size:11px;font-weight:700;color:#374151;transition:all .12s;" onmouseover="this.style.background='rgba(16,185,129,0.06)';this.style.color='#059669'" onmouseout="this.style.background='';this.style.color='#374151'" class="dark:text-slate-300">
            <i data-lucide="edit-3" style="width:14px;height:14px;color:#10b981;stroke:#10b981;flex-shrink:0;"></i>
            <span>Ubah Data</span>
        </button>
        <button onclick="handleGlobalHapus()" style="width:100%;display:flex;align-items:center;gap:9px;padding:7px 10px;border:none;background:none;border-radius:8px;cursor:pointer;font-size:11px;font-weight:700;color:#374151;transition:all .12s;" onmouseover="this.style.background='rgba(244,63,94,0.06)';this.style.color='#e11d48'" onmouseout="this.style.background='';this.style.color='#374151'" class="dark:text-slate-300">
            <i data-lucide="trash-2" style="width:14px;height:14px;color:#f43f5e;stroke:#f43f5e;flex-shrink:0;"></i>
            <span>Hapus Data</span>
        </button>
    </div>

    <!-- Divider -->
    <div style="height:1px;background:var(--border);margin:0 4px 8px;"></div>

    <!-- Download Links -->
    <div style="padding:0 6px 4px;">
        <div style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;margin-bottom:6px;">Unduh Format:</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;">
            <?php
            $formats = [
                ['id'=>'download_geojson', 'fmt'=>'geojson', 'icon'=>'file-code',   'label'=>'GeoJSON'],
                ['id'=>'download_kml',     'fmt'=>'kml',     'icon'=>'globe',        'label'=>'KML'],
                ['id'=>'download_csv',     'fmt'=>'csv',     'icon'=>'table',        'label'=>'CSV'],
                ['id'=>'download_gpx',     'fmt'=>'gpx',     'icon'=>'navigation',   'label'=>'GPX'],
                ['id'=>'download_wkt',     'fmt'=>'wkt',     'icon'=>'file-text',    'label'=>'WKT'],
                ['id'=>'download_sql',     'fmt'=>'sql',     'icon'=>'database',     'label'=>'SQL'],
            ];
            foreach ($formats as $f): ?>
            <a id="<?= $f['id'] ?>" href="#" target="_blank" onclick="closeGlobalMenu()"
                style="display:flex;align-items:center;justify-content:center;gap:5px;padding:6px 4px;border-radius:7px;background:rgba(16,185,129,0.04);border:1px solid rgba(16,185,129,0.12);font-size:10px;font-weight:700;color:#059669;text-decoration:none;transition:all .12s;"
                onmouseover="this.style.background='rgba(16,185,129,0.1)'" onmouseout="this.style.background='rgba(16,185,129,0.04)'">
                <i data-lucide="<?= $f['icon'] ?>" style="width:11px;height:11px;flex-shrink:0;"></i>
                <?= $f['label'] ?>
            </a>
            <?php endforeach; ?>
        </div>
    </div>
</div>
