<?php
// admin/index.php — Panel Admin Web GIS (Modular & Clean)
session_start();

$ADMIN_PASS = 'admin123';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['password'])) {
    if ($_POST['password'] === $ADMIN_PASS) {
        $_SESSION['admin_logged_in'] = true;
    } else {
        $login_error = 'Password salah!';
    }
}
if (isset($_GET['logout'])) { 
    session_destroy(); 
    header('Location: index.php'); 
    exit; 
}

$logged_in = $_SESSION['admin_logged_in'] ?? false;

// Load components
require_once 'includes/header.php';

if (!$logged_in) {
    require_once 'includes/login.php';
} else {
    require_once 'includes/dashboard.php';
}

require_once 'includes/footer.php';
?>
