<!-- ABOUT MODAL -->
<div id="aboutModal" class="hidden" style="position:fixed;inset:0;z-index:9998;display:none;align-items:center;justify-content:center;" onclick="closeAbout()" aria-modal="true" role="dialog">
    <div id="aboutModalContent" onclick="event.stopPropagation()" style="animation:fadeUp 0.25s ease forwards;">
        <!-- Header -->
        <div style="padding:24px 24px 18px;border-bottom:1px solid var(--border);">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                <div style="width:42px;height:42px;border-radius:12px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <i data-lucide="globe" style="width:20px;height:20px;color:#10b981;stroke:#10b981;"></i>
                </div>
                <div>
                    <h2 style="font-size:16px;font-weight:800;letter-spacing:-.02em;margin:0;" class="text-[#111827] dark:text-white">GeoPortal</h2>
                    <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;margin:0;">GIS Manager — Open Source Edition</p>
                </div>
            </div>
            <p style="font-size:12px;line-height:1.65;margin:0;" class="text-[#6b7280] dark:text-slate-400">
                Aplikasi GIS (Geographic Information System) interaktif berbasis web yang memungkinkan pengguna memetakan, mengelola, dan mengekspor data spasial secara real-time dengan backend PostGIS.
            </p>
        </div>

        <!-- Feature List -->
        <div style="padding:18px 24px;">
            <div style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:#9ca3af;margin-bottom:12px;">Fitur Utama</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                <?php
                $features = [
                    ['icon'=>'map-pin',  'text'=>'Multi Layer Type'],
                    ['icon'=>'layers',   'text'=>'10 Basemap Options'],
                    ['icon'=>'flame',    'text'=>'Heatmap / Peta Panas'],
                    ['icon'=>'download', 'text'=>'Export 6 Format'],
                    ['icon'=>'sun',      'text'=>'Dark / Light Mode'],
                    ['icon'=>'database', 'text'=>'PostGIS Backend'],
                ];
                foreach ($features as $feat): ?>
                <div style="display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:8px;background:rgba(16,185,129,0.04);border:1px solid rgba(16,185,129,0.1);">
                    <i data-lucide="<?= $feat['icon'] ?>" style="width:13px;height:13px;color:#10b981;stroke:#10b981;flex-shrink:0;"></i>
                    <span style="font-size:10px;font-weight:600;" class="text-[#374151] dark:text-slate-300"><?= $feat['text'] ?></span>
                </div>
                <?php endforeach; ?>
            </div>
        </div>

        <!-- Footer -->
        <div style="padding:14px 24px 20px;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;">
            <span style="font-size:10px;color:#9ca3af;font-weight:500;">v2.0.0 — Open Source</span>
            <button onclick="closeAbout()" class="btn-primary" style="padding:7px 18px;">Tutup</button>
        </div>
    </div>
</div>
