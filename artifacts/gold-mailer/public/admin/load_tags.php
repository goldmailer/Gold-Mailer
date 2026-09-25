<?php
// load_tags.php
// Loads and echoes all Monetag ad tags where status = 'connected'

if (!function_exists('get_pdo')) {
    $db_path = __DIR__ . '/db.php';
    if (file_exists($db_path)) {
        require_once $db_path;
    }
}

if (function_exists('get_pdo')) {
    $db = get_pdo();
    if ($db) {
        try {
            $stmt = $db->query("SELECT tag_slot, tag_code FROM ad_tags WHERE status = 'connected' AND tag_code IS NOT NULL AND TRIM(tag_code) != '' ORDER BY id ASC");
            $tags = $stmt->fetchAll(PDO::FETCH_ASSOC);
            if (!empty($tags)) {
                echo "\n<!-- === Gold Mailer Active Ad Tags (Connected) === -->\n";
                foreach ($tags as $tag) {
                    echo "<!-- Active Tag: " . htmlspecialchars($tag['tag_slot']) . " -->\n";
                    echo $tag['tag_code'] . "\n";
                }
                echo "<!-- ============================================== -->\n\n";
            }
        } catch (Exception $e) {
            error_log("Failed to load active ad tags: " . $e->getMessage());
        }
    }
}
