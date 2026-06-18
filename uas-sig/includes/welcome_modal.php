<!-- ===================== WELCOME DIALOG (Informasi Mahasiswa) ===================== -->
<div id="welcome-dialog" class="modal-backdrop show">
    <div class="modal" style="max-width: 480px; text-align: center; border: 1px solid var(--border-color); box-shadow: var(--shadow-lg);">
        <div class="modal-header" style="justify-content: center; border-bottom: none; padding-bottom: 0;">
            <div style="width: 50px; height: 50px; background-color: rgba(59, 130, 246, 0.1); color: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 0.5rem; font-size: 1.5rem;">
                <i class="fas fa-id-card"></i>
            </div>
        </div>
        <div class="modal-body" style="padding: 0.5rem 1.5rem 1.5rem 1.5rem;">
            <h3 style="font-size: 1.2rem; font-weight: 700; color: var(--text-primary); margin-bottom: 1rem;">Informasi Mahasiswa</h3>
            
            <div style="background-color: var(--bg-muted, #f8fafc); border: 1px solid var(--border-color); border-radius: var(--radius-md, 8px); padding: 1.15rem; text-align: left; display: flex; flex-direction: column; gap: 0.65rem; margin-bottom: 1.25rem; font-size: 0.85rem; line-height: 1.5;">
                <div style="display: flex; border-bottom: 1px solid rgba(0,0,0,0.04); padding-bottom: 0.4rem;">
                    <span style="width: 120px; font-weight: 600; color: var(--text-secondary);">Nama:</span>
                    <span style="color: var(--text-primary); font-weight: 600;">Iktiar Ramadani</span>
                </div>
                <div style="display: flex; border-bottom: 1px solid rgba(0,0,0,0.04); padding-bottom: 0.4rem;">
                    <span style="width: 120px; font-weight: 600; color: var(--text-secondary);">NIM:</span>
                    <span style="color: var(--text-primary); font-family: monospace; font-weight: 600; font-size: 0.88rem;">230441100053</span>
                </div>
                <div style="display: flex; border-bottom: 1px solid rgba(0,0,0,0.04); padding-bottom: 0.4rem;">
                    <span style="width: 120px; font-weight: 600; color: var(--text-secondary);">Mata Kuliah:</span>
                    <span style="color: var(--text-primary);">Sistem Informasi Geografis</span>
                </div>
                <div style="display: flex; border-bottom: 1px solid rgba(0,0,0,0.04); padding-bottom: 0.4rem;">
                    <span style="width: 120px; font-weight: 600; color: var(--text-secondary);">Program Studi:</span>
                    <span style="color: var(--text-primary);">Sistem Informasi</span>
                </div>
                <div style="display: flex; border-bottom: 1px solid rgba(0,0,0,0.04); padding-bottom: 0.4rem;">
                    <span style="width: 120px; font-weight: 600; color: var(--text-secondary);">Fakultas:</span>
                    <span style="color: var(--text-primary);">Fakultas Teknik</span>
                </div>
                <div style="display: flex; border-bottom: 1px solid rgba(0,0,0,0.04); padding-bottom: 0.4rem;">
                    <span style="width: 120px; font-weight: 600; color: var(--text-secondary);">Universitas:</span>
                    <span style="color: var(--text-primary);">Universitas Trunojoyo Madura</span>
                </div>
                <div style="display: flex; padding-top: 0.1rem;">
                    <span style="width: 120px; font-weight: 600; color: var(--text-secondary);">Tahun:</span>
                    <span style="color: var(--text-primary);">2026</span>
                </div>
            </div>
            
            <p style="font-size: 0.72rem; color: var(--text-muted); margin-bottom: 0;">Tekan tombol di bawah untuk masuk ke aplikasi</p>
        </div>
        <div class="modal-footer" style="border-top: none; padding-top: 0; padding-bottom: 1.5rem;">
            <button class="btn btn-primary" onclick="closeWelcomeDialog()" style="width: 100%; justify-content: center; height: 38px; font-weight: 600; font-size: 0.85rem;">OK</button>
        </div>
    </div>
</div>

<script>
// Fungsi untuk membuka & menutup dialog selamat datang (welcome-dialog)
function openWelcomeDialog() {
    const el = document.getElementById('welcome-dialog');
    if (el) el.classList.add('show');
}

function closeWelcomeDialog() {
    const el = document.getElementById('welcome-dialog');
    if (el) el.classList.remove('show');
}
</script>
