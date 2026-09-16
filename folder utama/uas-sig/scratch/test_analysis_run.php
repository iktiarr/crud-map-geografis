<?php
$_GET['poly_a_table'] = 'custom_drawings';
$_GET['poly_a_id'] = 12;
$_GET['poly_b_table'] = 'custom_drawings';
$_GET['poly_b_id'] = 13;
$_GET['point_table'] = 'jabodetabek';
$_GET['operation'] = 'all';

ob_start();
require 'c:/web/uas-sig/api/run_analysis.php';
$output = ob_get_clean();

$response = json_decode($output, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    echo "Invalid JSON response:\n";
    echo $output;
    exit;
}

echo "Response status: " . $response['status'] . "\n";
if ($response['status'] === 'success') {
    foreach ($response['results'] as $op => $res) {
        $count = isset($res['data']) ? count($res['data']) : 0;
        echo "Operation $op: $count points found\n";
        if ($count > 0) {
            echo "  Sample point name: " . $res['data'][0]['nama'] . "\n";
        }
    }
} else {
    echo "Error: " . $response['message'] . "\n";
}
