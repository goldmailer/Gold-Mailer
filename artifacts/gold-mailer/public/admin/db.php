<?php
// Database configuration for Gold Mailer Ads Manager
// Supports MySQL / MariaDB via PDO

$db_host = getenv('DB_HOST') ?: (getenv('MYSQLHOST') ?: '127.0.0.1');
$db_port = getenv('DB_PORT') ?: (getenv('MYSQLPORT') ?: '3306');
$db_name = getenv('DB_NAME') ?: (getenv('MYSQLDATABASE') ?: 'goldmailer');
$db_user = getenv('DB_USER') ?: (getenv('MYSQLUSER') ?: 'root');
$db_pass = getenv('DB_PASS') ?: (getenv('MYSQLPASSWORD') ?: '');

// If DATABASE_URL is provided (e.g. mysql://user:pass@host:port/dbname)
$database_url = getenv('DATABASE_URL') ?: getenv('JAWSDB_URL') ?: getenv('CLEARDB_DATABASE_URL');
if ($database_url && str_starts_with($database_url, 'mysql:')) {
    $parts = parse_url($database_url);
    $db_host = $parts['host'] ?? $db_host;
    $db_port = $parts['port'] ?? $db_port;
    $db_user = $parts['user'] ?? $db_user;
    $db_pass = $parts['pass'] ?? $db_pass;
    $db_name = ltrim($parts['path'] ?? '', '/') ?: $db_name;
}

$pdo = null;

try {
    // Attempt MySQL connection
    $dsn = "mysql:host={$db_host};port={$db_port};dbname={$db_name};charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_TIMEOUT => 3,
    ];
    $pdo = new PDO($dsn, $db_user, $db_pass, $options);
} catch (Exception $e) {
    // Fallback: If MySQL is not reachable, use a local SQLite database file so the Ads Manager works in any PHP environment
    $sqlite_file = __DIR__ . '/ads_database.sqlite';
    try {
        $pdo = new PDO("sqlite:" . $sqlite_file);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    } catch (Exception $sqle) {
        $pdo = null;
    }
}

// Auto-bootstrap ad_tags table if it does not exist
if ($pdo) {
    try {
        $driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
        if ($driver === 'sqlite') {
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS ad_tags (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    tag_slot VARCHAR(50) NOT NULL UNIQUE,
                    tag_code TEXT,
                    status VARCHAR(20) NOT NULL DEFAULT 'disconnected',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
            ");
        } else {
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS `ad_tags` (
                    `id` INT AUTO_INCREMENT PRIMARY KEY,
                    `tag_slot` VARCHAR(50) NOT NULL UNIQUE,
                    `tag_code` MEDIUMTEXT,
                    `status` ENUM('connected','disconnected') NOT NULL DEFAULT 'disconnected',
                    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            ");
        }

        // Pre-populate 5 tag slots if empty
        $stmt = $pdo->query("SELECT COUNT(*) as cnt FROM ad_tags");
        $count = $stmt->fetch()['cnt'] ?? 0;
        if ($count == 0) {
            $insert = $pdo->prepare("INSERT INTO ad_tags (tag_slot, tag_code, status) VALUES (:slot, '', 'disconnected')");
            for ($i = 1; $i <= 5; $i++) {
                $insert->execute([':slot' => "Tag {$i}"]);
            }
        }
    } catch (Exception $e) {
        error_log("Error ensuring ad_tags table: " . $e->getMessage());
    }
}

function get_pdo() {
    global $pdo;
    return $pdo;
}
