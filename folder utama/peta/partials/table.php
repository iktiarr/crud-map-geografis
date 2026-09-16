<!-- Data Table Card (Below Grid) -->
<div class="glass-card table-card bottom-table-card">
    <!-- Table Header -->
    <div style="padding:10px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;background:rgba(248,250,252,0.6);" class="dark:bg-slate-900/30">
        <h3 style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;" class="dark:text-slate-400">Data Terdaftar</h3>
        <div style="display:flex;align-items:center;gap:10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#9ca3af;">
            <button onclick="currentSort='nama'; loadData();" style="background:none;border:none;cursor:pointer;color:inherit;font:inherit;transition:color .15s;" onmouseover="this.style.color='#10b981'" onmouseout="this.style.color=''">Nama</button>
            <span>·</span>
            <button onclick="currentSort='tipe'; loadData();" style="background:none;border:none;cursor:pointer;color:inherit;font:inherit;transition:color .15s;" onmouseover="this.style.color='#10b981'" onmouseout="this.style.color=''">Jenis</button>
            <span>·</span>
            <button onclick="currentSort='id'; loadData();" style="background:none;border:none;cursor:pointer;color:inherit;font:inherit;transition:color .15s;" onmouseover="this.style.color='#10b981'" onmouseout="this.style.color=''">Terbaru</button>
        </div>
    </div>

    <!-- Scrollable Table -->
    <div class="table-scroll-inner bottom-table-scroll">
        <table class="data-table">
            <thead>
                <tr>
                    <th style="text-align:left;width:30%;">Data &amp; Jenis</th>
                    <th style="text-align:left;width:55%;">Koordinat / Detail</th>
                    <th style="text-align:right;width:15%;">Aksi</th>
                </tr>
            </thead>
            <tbody id="tableBody">
                <tr>
                    <td colspan="3" style="padding:24px;text-align:center;">
                        <div style="display:flex;flex-direction:column;align-items:center;gap:6px;opacity:.5;">
                            <i data-lucide="loader" style="width:16px;height:16px;color:#10b981;animation:spin 1s linear infinite;"></i>
                            <span style="font-size:10px;font-weight:600;color:#9ca3af;">Memuat data...</span>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</div>
