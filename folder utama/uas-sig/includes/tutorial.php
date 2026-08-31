<!-- ===================== TUTORIAL DIALOG (Shadcn-style Dialog) ===================== -->
<div id="tutorial-dialog" class="modal-backdrop" onclick="closeTutorialDialogOnBackdrop(event)">
    <div class="modal" style="max-width: 650px; display: flex; flex-direction: column; max-height: 85vh;">
        <div class="modal-header" style="flex-shrink: 0;">
            <h3><i class="fas fa-book-reader" style="color: var(--primary);"></i> Panduan Penggunaan Web GIS</h3>
            <button class="modal-close" onclick="closeTutorialDialog()">&times;</button>
        </div>
        <div class="modal-body" style="line-height: 1.6; font-size: 0.82rem; color: var(--text-secondary); overflow-y: auto; padding-right: 0.75rem;">
            
            <!-- Pengantar -->
            <div style="margin-bottom: 1.25rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem;">
                <p>Selamat datang di panduan aplikasi <strong>Web GIS Peta Geografis</strong>. Berikut penjelasan mengenai fitur utama dan tata cara penggunaannya:</p>
            </div>
            
            <!-- 4 Fitur Utama -->
            <div style="display: flex; flex-direction: column; gap: 1.25rem; margin-bottom: 1.5rem;">
                <!-- Fitur 1 -->
                <div>
                    <h4 style="color: var(--text-primary); font-weight: 600; font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                        <i class="fas fa-layer-group" style="color: #3b82f6; width: 16px; text-align: center;"></i> 1. Overlays (Lapisan Peta)
                    </h4>
                    <p style="margin-left: 1.3rem;">Pada fitur ini Anda dapat melihat wilayah yang sudah ditambahkan oleh admin melalui halaman admin. Semua data disini dapat digunakan. Anda dapat membuat tampilan menumpuk pada tampilan ini dengan memilih satu per satu wilayah yang ingin digunakan ( <strong>Wilayah Default Pamekasan</strong> ). Anda dapat menggunakan beberapa fitur yang sudah ada pada bagian overlays ini secara bersamaan.</p>
                </div>
                
                <!-- Fitur 2 -->
                <div>
                    <h4 style="color: var(--text-primary); font-weight: 600; font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                        <i class="fas fa-eye" style="color: #10b981; width: 16px; text-align: center;"></i> 2. Preview Cepat (Quick Preview)
                    </h4>
                    <p style="margin-left: 1.3rem;">Pada fitur ini, Anda hanya dapat melihat satu wilayah saja yang sudah ada pada database kami. Anda dapat menambahkan wilayah melalui halaman admin. Anda dapat melihat beberapa nama yang sudah ada pada tampilan tersebut dan dapat memilih sesuai dengan keinginan Anda.</p>
                </div>
                
                <!-- Fitur 3 -->
                <div>
                    <h4 style="color: var(--text-primary); font-weight: 600; font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                        <i class="fas fa-project-diagram" style="color: #8b5cf6; width: 16px; text-align: center;"></i> 3. Analisis Spasial
                    </h4>
                    <p style="margin-left: 1.3rem;">Pada fitur ini, Anda dapat menggunakan analisis wilayah dengan membuat sesuai dengan kreasi Anda sendiri. Anda dapat menimpa beberapa wilayah dan melihat perbandingan himpunan yang sudah kami siapkan. Anda dapat menambah polyline, polygon, dan marker pada tampilan peta. Setelah itu Anda diwajibkan untuk memilih antara 2 wilayah yang ingin Anda buat himpunannya. Setelah Anda memilih, pada bagian bawah peta akan tampil beberapa jenis himpunan yang sudah kami siapkan untuk Anda. Pastikan Anda menggeser peta utama agar hasil pada semua sub-maps himpunan bisa terlihat dengan jelas.</p>
                </div>
                
                <!-- Fitur 4 -->
                <div>
                    <h4 style="color: var(--text-primary); font-weight: 600; font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                        <i class="fas fa-edit" style="color: #f59e0b; width: 16px; text-align: center;"></i> 4. Buat Gambar (Drawing Canvas)
                    </h4>
                    <p style="margin-left: 1.3rem;">Pada fitur ini, Anda bisa menambahkan marker, polyline, dan polygon sesuai dengan keinginan Anda sendiri. Anda dapat membuat gambar baru secara interaktif.</p>
                </div>
            </div>

            <!-- HAL YANG ADA / KARAKTERISTIK -->
            <div style="background-color: var(--bg-muted, #f8fafc); border: 1px solid var(--border-color); border-radius: var(--radius-md, 8px); padding: 0.85rem; margin-bottom: 1.25rem;">
                <h4 style="color: var(--text-primary); font-weight: 600; font-size: 0.85rem; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
                    <i class="fas fa-info-circle" style="color: var(--primary);"></i> Spesifikasi Aplikasi:
                </h4>
                <ul style="margin: 0; padding-left: 1.2rem; display: flex; flex-direction: column; gap: 0.35rem; color: var(--text-secondary);">
                    <li>Desain map hanya menggunakan OpenStreetMap dari Leaflet.</li>
                    <li>Desain tampilan antarmuka menggunakan desain clean dari Shadcn UI.</li>
                    <li>Alat yang kami gunakan adalah HTML5, CSS, PHP, dan Javascript.</li>
                    <li>Anda dapat melihat bagian peta pada bagian atas website ini, jika Anda ingin melihat detail dari setiap informasi, Anda dapat melihat tabel pada bawah map, dan jika Anda ingin mengubah Anda dapat menggunakan panel samping untuk mengeditnya.</li>
                </ul>
            </div>

            <!-- PERHATIAN -->
            <div style="border: 1px solid rgba(239, 68, 68, 0.2); background-color: rgba(239, 68, 68, 0.03); border-radius: var(--radius-md, 8px); padding: 0.85rem; margin-bottom: 1.5rem;">
                <h4 style="color: #ef4444; font-weight: 600; font-size: 0.85rem; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
                    <i class="fas fa-exclamation-triangle"></i> Perhatian:
                </h4>
                <ol style="margin: 0; padding-left: 1.2rem; display: flex; flex-direction: column; gap: 0.35rem; color: var(--text-secondary);">
                    <li>Setiap hasil gambar atau marker yang Anda buat akan tersimpan pada database secara permanen.</li>
                    <li>Setiap fitur yang ada tidak akan tercampur karena kami menyiapkan tabel database yang berbeda, tapi pastikan Anda berada pada fitur yang tepat.</li>
                    <li>Hasil pada peta mungkin tidak akan akurat 100%, namun kami menjamin, gambar ataupun hasil yang ada mengarah pada peta yang sesuai (sesuai dokumentasi Leaflet).</li>
                    <li>Anda dapat menambahkan data yang lebih lengkap pada fitur admin yang telah kami siapkan.</li>
                    <li>Semua data menjadi satu, sehingga Anda dapat melihat beberapa data yang sudah kami siapkan.</li>
                    <li>Anda mungkin melihat data yang sudah ada pada panel pengguna, Anda dapat menghapusnya agar lebih sesuai dengan apa yang Anda inginkan.</li>
                </ol>
            </div>

            <!-- KREDIT PEMBUAT -->
            <div style="border-top: 1px solid var(--border-color); padding-top: 0.85rem; text-align: center; font-size: 0.75rem; color: var(--text-muted);">
                <p style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.15rem;">DIBUAT OLEH IKTIAR RAMADANI ( 230441100053 )</p>
                <p style="margin-bottom: 0.15rem;">UNIVERSITAS TRUNOJOYO MADURA</p>
                <p style="font-size: 0.7rem; letter-spacing: 0.5px; text-transform: uppercase;">Desain Web Prototype 2026</p>
            </div>

        </div>
        <div class="modal-footer" style="flex-shrink: 0; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
            <button class="btn btn-primary" onclick="closeTutorialDialog()" style="width: 100%; justify-content: center;">Mulai Eksplorasi</button>
        </div>
    </div>
</div>
