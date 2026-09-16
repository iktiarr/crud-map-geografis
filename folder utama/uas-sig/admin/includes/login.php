<!-- ========== HALAMAN LOGIN ========== -->
<div class="login-wrap">
    <div class="card" style="width:100%; max-width:360px;">
        <div class="card-header">
            <h3><i class="fas fa-lock" style="color:var(--primary);"></i> Login Admin</h3>
        </div>
        <div class="card-body">
            <?php if (isset($login_error)): ?>
                <div class="alert alert-error">
                    <i class="fas fa-exclamation-circle"></i>
                    <?= htmlspecialchars($login_error) ?>
                </div>
            <?php endif; ?>
            <form method="POST">
                <div class="form-group">
                    <label class="form-label">Password Admin</label>
                    <input type="password" name="password" class="form-control"
                           placeholder="Masukkan password..." autofocus required>
                </div>
                <button type="submit" class="btn btn-primary" style="width:100%; justify-content:center; margin-top:.25rem;">
                    <i class="fas fa-sign-in-alt"></i> Masuk
                </button>
            </form>
        </div>
    </div>
</div>
