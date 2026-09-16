<?php
session_start();
if (isset($_SESSION['admin_logged_in'])) {
    header("Location: admin.php");
    exit;
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    
    if ($username === 'admin' && $password === 'admin123') {
        $_SESSION['admin_logged_in'] = true;
        header("Location: admin.php");
        exit;
    } else {
        $error = 'Username atau Password salah!';
    }
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login Admin — SIG</title>
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="bg-slate-900 text-slate-100 flex items-center justify-center min-h-screen relative overflow-hidden">
    <!-- Gradient blobs -->
    <div class="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600 rounded-full filter blur-3xl opacity-20 animate-pulse"></div>
    <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600 rounded-full filter blur-3xl opacity-20 animate-pulse"></div>

    <div class="bg-slate-800/80 backdrop-blur-md border border-slate-700/50 p-8 rounded-2xl shadow-2xl w-full max-w-md z-10 space-y-6 transition-all">
        <div class="text-center space-y-2">
            <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 mb-2">
                <i class="fa-solid fa-user-lock text-2xl"></i>
            </div>
            <h2 class="text-2xl font-bold tracking-tight text-white">Portal Admin SIG</h2>
            <p class="text-slate-400 text-xs">Silakan login untuk mengelola marker sekolah</p>
        </div>

        <?php if (!empty($error)): ?>
            <div class="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-lg text-xs flex items-center gap-2">
                <i class="fa-solid fa-triangle-exclamation shrink-0"></i>
                <span><?php echo $error; ?></span>
            </div>
        <?php endif; ?>

        <form action="login.php" method="POST" class="space-y-4">
            <div class="space-y-1.5">
                <label for="username" class="text-xs font-semibold text-slate-300">Username</label>
                <div class="relative">
                    <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-sm">
                        <i class="fa-solid fa-user"></i>
                    </span>
                    <input type="text" name="username" id="username" required
                           class="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                           placeholder="admin">
                </div>
            </div>

            <div class="space-y-1.5">
                <label for="password" class="text-xs font-semibold text-slate-300">Password</label>
                <div class="relative">
                    <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-sm">
                        <i class="fa-solid fa-key"></i>
                    </span>
                    <input type="password" name="password" id="password" required
                           class="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                           placeholder="••••••••">
                </div>
            </div>

            <button type="submit" 
                    class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-lg shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all text-sm mt-2">
                Login ke Portal
            </button>
        </form>

        <div class="text-center pt-2">
            <a href="index.php" class="text-xs text-slate-400 hover:text-indigo-400 transition-colors">
                <i class="fa-solid fa-arrow-left mr-1"></i> Kembali ke Halaman User
            </a>
        </div>
    </div>
</body>
</html>
