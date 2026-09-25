<?php
// Main site entry point with dynamic PHP header ad tag injection
$html_file = __DIR__ . '/artifacts/gold-mailer/dist/public/index.html';
if (!file_exists($html_file)) {
    $html_file = __DIR__ . '/artifacts/gold-mailer/index.html';
}

if (!file_exists($html_file)) {
    $html_file = __DIR__ . '/index.html';
}

$html = file_exists($html_file) ? file_get_contents($html_file) : '<!DOCTYPE html><html><head><title>Gold Mailer</title></head><body><div id="root"></div></body></html>';

// Buffer active ad tags
ob_start();
if (file_exists(__DIR__ . '/admin/load_tags.php')) {
    include __DIR__ . '/admin/load_tags.php';
}
$ad_tags = ob_get_clean();

// Inject active ad tags immediately before </head>
if (!empty($ad_tags)) {
    $html = str_replace('</head>', $ad_tags . "\n</head>", $html);
}

echo $html;
