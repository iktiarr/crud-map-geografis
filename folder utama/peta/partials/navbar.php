<!-- NAVBAR -->
<nav class="navbar">
    <div style="max-width:1700px;margin:0 auto;padding:0 1.5rem;height:58px;display:flex;align-items:center;justify-content:space-between;">
        <!-- Logo -->
        <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:34px;height:34px;border-radius:10px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.18);display:flex;align-items:center;justify-content:center;">
                <i data-lucide="globe" style="width:17px;height:17px;color:#10b981;stroke:#10b981;"></i>
            </div>
            <div>
                <div style="font-size:13px;font-weight:800;letter-spacing:-.02em;color:#111827;" class="dark:text-white">GeoPortal</div>
                <div style="font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#9ca3af;">GIS Manager</div>
            </div>
        </div>

        <!-- Nav Links + Actions -->
        <div style="display:flex;align-items:center;gap:20px;">
            <div style="display:flex;align-items:center;gap:16px;" class="hidden sm:flex">
                <a href="#" style="font-size:11px;font-weight:700;color:#10b981;text-decoration:none;">Peta Interaktif</a>
                <a href="#" onclick="openAbout();return false;" style="font-size:11px;font-weight:600;color:#6b7280;text-decoration:none;transition:color .15s;" onmouseover="this.style.color='#111827'" onmouseout="this.style.color='#6b7280'">Tentang</a>
            </div>

            <!-- Dark Mode Toggle -->
            <button onclick="toggleDarkMode()"
                style="width:34px;height:34px;border-radius:9px;border:1px solid #e5e7eb;background:#f9fafb;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;"
                class="dark:bg-slate-800 dark:border-slate-700"
                onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background=''">
                <i data-lucide="sun"  style="width:15px;height:15px;color:#f59e0b;stroke:#f59e0b;" class="hidden dark:block"></i>
                <i data-lucide="moon" style="width:15px;height:15px;color:#6b7280;stroke:#6b7280;" class="block dark:hidden"></i>
            </button>

            <!-- Open Source Badge -->
            <div style="display:flex;align-items:center;gap:5px;padding:4px 10px;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:100px;font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:#6b7280;" class="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 hidden sm:flex">
                <span style="width:6px;height:6px;border-radius:50%;background:#10b981;" class="animate-pulse-dot"></span>
                Open Source
            </div>
        </div>
    </div>
</nav>
