<?php
// admin/ads.php — Gold Mailer Ads Manager
require_once __DIR__ . '/db.php';

$pdo = get_pdo();
$message = '';
$message_type = '';

// Handle actions
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $pdo) {
    $slot = $_POST['tag_slot'] ?? '';
    $action = $_POST['action'] ?? '';
    $code = trim($_POST['tag_code'] ?? '');

    if ($slot) {
        try {
            if ($action === 'connect') {
                $stmt = $pdo->prepare("
                    UPDATE ad_tags 
                    SET tag_code = :code, status = 'connected', updated_at = CURRENT_TIMESTAMP 
                    WHERE tag_slot = :slot
                ");
                $stmt->execute([':code' => $code, ':slot' => $slot]);
                $message = "{$slot} successfully connected and configured!";
                $message_type = "success";
            } elseif ($action === 'disconnect') {
                $stmt = $pdo->prepare("
                    UPDATE ad_tags 
                    SET status = 'disconnected', updated_at = CURRENT_TIMESTAMP 
                    WHERE tag_slot = :slot
                ");
                $stmt->execute([':slot' => $slot]);
                $message = "{$slot} disconnected (tag code preserved).";
                $message_type = "info";
            }
        } catch (Exception $e) {
            $message = "Error updating {$slot}: " . $e->getMessage();
            $message_type = "error";
        }
    }
}

// Fetch all 5 tag slots
$tags = [];
if ($pdo) {
    try {
        $stmt = $pdo->query("SELECT * FROM ad_tags ORDER BY id ASC");
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($results as $row) {
            $tags[$row['tag_slot']] = $row;
        }
    } catch (Exception $e) {
        $message = "Database read error: " . $e->getMessage();
        $message_type = "error";
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ads Manager — Gold Mailer Admin</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #0c0f17;
            --card-bg: #141a29;
            --card-border: #1f283d;
            --accent-gold: #f59e0b;
            --accent-green: #10b981;
            --accent-red: #ef4444;
            --text-primary: #f8fafc;
            --text-secondary: #94a3b8;
            --text-muted: #64748b;
            --input-bg: #0b0f19;
            --input-border: #2a3449;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-primary);
            line-height: 1.5;
            padding: 32px 16px;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
        }
        header {
            margin-bottom: 28px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid var(--card-border);
            padding-bottom: 20px;
        }
        .brand {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .logo {
            font-size: 24px;
            font-weight: 900;
            letter-spacing: 0.15em;
            color: var(--accent-gold);
            text-transform: uppercase;
        }
        .badge-admin {
            background: #27272a;
            color: #d4d4d8;
            font-size: 11px;
            font-weight: 700;
            padding: 4px 8px;
            border-radius: 6px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .header-title h1 {
            font-size: 22px;
            font-weight: 700;
            margin-bottom: 4px;
        }
        .header-title p {
            color: var(--text-secondary);
            font-size: 14px;
        }
        .alert {
            padding: 12px 16px;
            border-radius: 10px;
            margin-bottom: 24px;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .alert-success { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #34d399; }
        .alert-error { background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; }
        .alert-info { background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); color: #60a5fa; }
        
        .grid {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        .card {
            background: var(--card-bg);
            border: 1px solid var(--card-border);
            border-radius: 16px;
            padding: 24px;
            transition: border-color 0.2s, box-shadow 0.2s;
        }
        .card.connected {
            border-color: rgba(16, 185, 129, 0.3);
            box-shadow: 0 4px 20px -8px rgba(16, 185, 129, 0.15);
        }
        .tag-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
        }
        .tag-title {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .tag-name {
            font-size: 17px;
            font-weight: 700;
        }
        .tag-purpose {
            font-size: 13px;
            color: var(--text-secondary);
        }
        .status-badge {
            font-size: 12px;
            font-weight: 600;
            padding: 5px 12px;
            border-radius: 9999px;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .status-badge.connected {
            background: rgba(16, 185, 129, 0.12);
            color: #34d399;
            border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .status-badge.connected::before {
            content: '';
            width: 7px;
            height: 7px;
            background: var(--accent-green);
            border-radius: 50%;
            box-shadow: 0 0 8px #10b981;
        }
        .status-badge.disconnected {
            background: rgba(100, 116, 139, 0.12);
            color: var(--text-muted);
            border: 1px solid rgba(100, 116, 139, 0.25);
        }
        .status-badge.disconnected::before {
            content: '';
            width: 7px;
            height: 7px;
            background: var(--text-muted);
            border-radius: 50%;
        }
        .form-group {
            margin-bottom: 16px;
        }
        label {
            display: block;
            font-size: 13px;
            font-weight: 500;
            color: var(--text-secondary);
            margin-bottom: 8px;
        }
        textarea {
            width: 100%;
            background: var(--input-bg);
            border: 1px solid var(--input-border);
            border-radius: 10px;
            color: #38bdf8;
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            padding: 12px 14px;
            resize: vertical;
            min-height: 85px;
            line-height: 1.5;
            transition: border-color 0.2s, box-shadow 0.2s;
        }
        textarea:focus {
            outline: none;
            border-color: var(--accent-gold);
            box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.15);
        }
        .actions {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 12px;
        }
        button {
            cursor: pointer;
            font-family: inherit;
            font-size: 13px;
            font-weight: 600;
            padding: 9px 18px;
            border-radius: 8px;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            border: none;
        }
        .btn-connect {
            background: var(--accent-green);
            color: #042f1a;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
        }
        .btn-connect:hover {
            background: #059669;
            color: #fff;
        }
        .btn-disconnect {
            background: transparent;
            color: var(--text-secondary);
            border: 1px solid var(--card-border);
        }
        .btn-disconnect:hover {
            background: rgba(239, 68, 68, 0.1);
            color: var(--accent-red);
            border-color: rgba(239, 68, 68, 0.3);
        }
        .back-link {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            color: var(--accent-gold);
            text-decoration: none;
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 20px;
        }
        .back-link:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <a href="/admin" class="back-link">&larr; Back to Admin Dashboard</a>
        
        <header>
            <div class="brand">
                <span class="logo">Gold Mailer</span>
                <span class="badge-admin">Admin Ads Control</span>
            </div>
            <div class="header-title">
                <h1>Monetag Ads Integration</h1>
                <p>Manage all 5 advertising tag slots dynamically for user public pages (strictly excluded from admin panel).</p>
            </div>
        </header>

        <?php if ($message): ?>
            <div class="alert alert-<?= htmlspecialchars($message_type) ?>">
                <?= htmlspecialchars($message) ?>
            </div>
        <?php endif; ?>

        <div class="grid">
            <?php
            $slots_info = [
                'Tag 1' => ['purpose' => 'Pop-up / Pop-under ad tag', 'default' => '<script src="https://quge5.com/88/tag.min.js" data-zone="284730" async data-cfasync="false"></script>'],
                'Tag 2' => ['purpose' => 'In-App Push notification ad tag', 'default' => '<script src="https://quge5.com/88/tag.min.js" data-zone="284203" async data-cfasync="false"></script>'],
                'Tag 3' => ['purpose' => 'Interstitial / Vignette ad tag', 'default' => '<script src="https://n6wxm.com/88/tag.min.js" data-zone="284731" async data-cfasync="false"></script>'],
                'Tag 4' => ['purpose' => 'In-Page Push / Native banner tag', 'default' => '<script src="https://n6wxm.com/88/tag.min.js" data-zone="284209" async data-cfasync="false"></script>'],
                'Tag 5' => ['purpose' => 'Reward / Smart ad link tag', 'default' => '<script src="https://quge5.com/88/tag.min.js" data-zone="284730" async data-cfasync="false"></script>']
            ];

            foreach ($slots_info as $slot_name => $info):
                $row = $tags[$slot_name] ?? null;
                $is_connected = ($row && $row['status'] === 'connected');
                $current_code = $row ? $row['tag_code'] : $info['default'];
            ?>
                <div class="card <?= $is_connected ? 'connected' : '' ?>">
                    <div class="tag-header">
                        <div class="tag-title">
                            <span class="tag-name"><?= htmlspecialchars($slot_name) ?></span>
                            <span class="tag-purpose">&bull; <?= htmlspecialchars($info['purpose']) ?></span>
                        </div>
                        <span class="status-badge <?= $is_connected ? 'connected' : 'disconnected' ?>">
                            <?= $is_connected ? 'Active (User Pages)' : 'Disconnected' ?>
                        </span>
                    </div>

                    <form method="POST" action="">
                        <input type="hidden" name="tag_slot" value="<?= htmlspecialchars($slot_name) ?>">
                        
                        <div class="form-group">
                            <label>Monetag Tag Script Code</label>
                            <textarea name="tag_code" rows="3" placeholder="Paste full &lt;script&gt;...&lt;/script&gt; tag here"><?= htmlspecialchars($current_code) ?></textarea>
                        </div>

                        <div class="actions">
                            <?php if ($is_connected): ?>
                                <button type="submit" name="action" value="disconnect" class="btn-disconnect">
                                    Disconnect
                                </button>
                                <button type="submit" name="action" value="connect" class="btn-connect">
                                    Update Code
                                </button>
                            <?php else: ?>
                                <button type="submit" name="action" value="connect" class="btn-connect">
                                    Connect Tag
                                </button>
                            <?php endif; ?>
                        </div>
                    </form>
                </div>
            <?php endforeach; ?>
        </div>
    </div>
</body>
</html>
