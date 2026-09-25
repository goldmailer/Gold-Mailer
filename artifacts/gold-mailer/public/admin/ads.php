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
                $message = "{$slot} successfully connected and installed into index.html!";
                $message_type = "success";
            } elseif ($action === 'disconnect') {
                $stmt = $pdo->prepare("
                    UPDATE ad_tags 
                    SET status = 'disconnected', updated_at = CURRENT_TIMESTAMP 
                    WHERE tag_slot = :slot
                ");
                $stmt->execute([':slot' => $slot]);
                $message = "{$slot} disconnected from index.html (tag code preserved).";
                $message_type = "info";
            }

            // Also write directly to index.html files
            $index_files = [
                dirname(__DIR__, 2) . '/dist/public/index.html',
                dirname(__DIR__, 2) . '/index.html',
                dirname(__DIR__, 3) . '/index.html',
            ];
            $slotNum = preg_replace('/[^0-9]/', '', $slot) ?: '1';
            $startM = "<!-- TAG_{$slotNum}_START -->";
            $endM = "<!-- TAG_{$slotNum}_END -->";

            foreach ($index_files as $f) {
                if (file_exists($f)) {
                    $html = file_get_contents($f);
                    if (!str_contains($html, '<!-- ADS_TAGS_START -->')) {
                        $html = str_replace('</head>', "    <!-- ADS_TAGS_START -->\n    <!-- ADS_TAGS_END -->\n</head>", $html);
                    }
                    $slotContent = ($action === 'connect' && !empty($code)) ? "{$startM}\n    {$code}\n    {$endM}" : "{$startM}{$endM}";
                    if (str_contains($html, $startM) && str_contains($html, $endM)) {
                        $html = preg_replace('/' . preg_quote($startM, '/') . '[\s\S]*?' . preg_quote($endM, '/') . '/', $slotContent, $html);
                    } else {
                        $html = str_replace('<!-- ADS_TAGS_END -->', "  {$slotContent}\n    <!-- ADS_TAGS_END -->", $html);
                    }
                    file_put_contents($f, $html);
                }
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

// Ensure slots 1 to 5 exist in view and check index.html for connected status
$index_files = [
    dirname(__DIR__, 2) . '/dist/public/index.html',
    dirname(__DIR__, 2) . '/index.html',
    dirname(__DIR__, 3) . '/index.html',
];
$index_html_content = '';
foreach ($index_files as $f) {
    if (file_exists($f)) {
        $index_html_content = file_get_contents($f);
        break;
    }
}

for ($i = 1; $i <= 5; $i++) {
    $slotName = "Tag {$i}";
    $startM = "<!-- TAG_{$i}_START -->";
    $endM = "<!-- TAG_{$i}_END -->";
    $htmlCode = '';
    $isConnectedInHtml = false;

    if (!empty($index_html_content) && str_contains($index_html_content, $startM) && str_contains($index_html_content, $endM)) {
        $sIdx = strpos($index_html_content, $startM) + strlen($startM);
        $eIdx = strpos($index_html_content, $endM);
        $htmlCode = trim(substr($index_html_content, $sIdx, $eIdx - $sIdx));
        if (!empty($htmlCode)) {
            $isConnectedInHtml = true;
        }
    }

    if (!isset($tags[$slotName])) {
        $tags[$slotName] = [
            'tag_slot' => $slotName,
            'tag_code' => $htmlCode,
            'status' => $isConnectedInHtml ? 'connected' : 'disconnected'
        ];
    } else {
        if ($isConnectedInHtml) {
            $tags[$slotName]['status'] = 'connected';
            $tags[$slotName]['tag_code'] = $htmlCode;
        } elseif (!empty($index_html_content) && str_contains($index_html_content, $startM)) {
            $tags[$slotName]['status'] = 'disconnected';
        }
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
            border-b: 1px solid var(--card-border);
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
            letter-spacing: 0.05em;
            text-transform: uppercase;
        }
        .header-title h1 {
            font-size: 26px;
            font-weight: 800;
            letter-spacing: -0.02em;
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
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .alert-success {
            background: rgba(16, 185, 129, 0.12);
            border: 1px solid rgba(16, 185, 129, 0.35);
            color: #34d399;
        }
        .alert-info {
            background: rgba(59, 130, 246, 0.12);
            border: 1px solid rgba(59, 130, 246, 0.35);
            color: #60a5fa;
        }
        .alert-error {
            background: rgba(239, 68, 68, 0.12);
            border: 1px solid rgba(239, 68, 68, 0.35);
            color: #f87171;
        }
        .tag-card {
            background: var(--card-bg);
            border: 1px solid var(--card-border);
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 20px;
            transition: border-color 0.2s;
        }
        .tag-card:focus-within {
            border-color: rgba(245, 158, 11, 0.4);
        }
        .tag-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 14px;
        }
        .tag-title {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .tag-slot-label {
            font-size: 17px;
            font-weight: 700;
            letter-spacing: -0.01em;
        }
        .tag-purpose {
            color: var(--text-muted);
            font-size: 13px;
        }
        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            font-weight: 600;
            padding: 4px 10px;
            border-radius: 9999px;
            letter-spacing: 0.02em;
        }
        .status-connected {
            background: rgba(16, 185, 129, 0.15);
            border: 1px solid rgba(16, 185, 129, 0.4);
            color: #34d399;
        }
        .status-connected .dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #10b981;
            box-shadow: 0 0 8px #10b981;
        }
        .status-disconnected {
            background: rgba(148, 163, 184, 0.1);
            border: 1px solid rgba(148, 163, 184, 0.25);
            color: var(--text-secondary);
        }
        .status-disconnected .dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #64748b;
        }
        .textarea-container {
            margin-bottom: 16px;
        }
        textarea {
            width: 100%;
            min-height: 90px;
            background: var(--input-bg);
            border: 1px solid var(--input-border);
            border-radius: 10px;
            padding: 12px 14px;
            color: #f1f5f9;
            font-family: 'JetBrains Mono', monospace;
            font-size: 13px;
            line-height: 1.5;
            resize: vertical;
            outline: none;
            transition: border-color 0.2s, box-shadow 0.2s;
        }
        textarea:focus {
            border-color: var(--accent-gold);
            box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.15);
        }
        textarea::placeholder {
            color: var(--text-muted);
            font-family: 'Inter', sans-serif;
            font-size: 13px;
        }
        .tag-actions {
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
            border: none;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }
        .btn-connect {
            background: #10b981;
            color: #ffffff;
        }
        .btn-connect:hover {
            background: #059669;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
        }
        .btn-disconnect {
            background: transparent;
            color: var(--text-secondary);
            border: 1px solid var(--input-border);
        }
        .btn-disconnect:hover {
            background: rgba(239, 68, 68, 0.1);
            color: #f87171;
            border-color: rgba(239, 68, 68, 0.4);
        }
        .info-panel {
            background: rgba(245, 158, 11, 0.05);
            border: 1px dashed rgba(245, 158, 11, 0.3);
            border-radius: 12px;
            padding: 16px 20px;
            margin-top: 24px;
            font-size: 13px;
            color: var(--text-secondary);
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        .info-panel strong {
            color: var(--accent-gold);
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <div>
                <div class="brand">
                    <span class="logo">GOLDMAILER</span>
                    <span class="badge-admin">Admin Panel</span>
                </div>
                <div class="header-title" style="margin-top: 8px;">
                    <h1>Ads Manager</h1>
                    <p>Configure, connect, and inject Monetag ad tags (pop-up, push, vignette, in-app banner) into website header.</p>
                </div>
            </div>
            <div>
                <a href="/admin" style="color: var(--accent-gold); text-decoration: none; font-size: 13px; font-weight: 600;">&larr; Back to Admin</a>
            </div>
        </header>

        <?php if (!empty($message)): ?>
            <div class="alert alert-<?php echo htmlspecialchars($message_type); ?>">
                <span><?php echo htmlspecialchars($message); ?></span>
            </div>
        <?php endif; ?>

        <?php
        $slot_purposes = [
            'Tag 1' => 'Pop-under / Pop-up Ads script tag',
            'Tag 2' => 'In-App Push / Push notification ads',
            'Tag 3' => 'Vignette / Interstitial ads tag',
            'Tag 4' => 'Native Banner / Smart Tag ad code',
            'Tag 5' => 'Custom Ad Script / Pixel code'
        ];

        for ($i = 1; $i <= 5; $i++):
            $slot = "Tag {$i}";
            $tag = $tags[$slot];
            $isConnected = ($tag['status'] === 'connected');
            $purpose = $slot_purposes[$slot] ?? 'Ad tag snippet';
        ?>
            <form method="POST" action="ads.php" class="tag-card">
                <input type="hidden" name="tag_slot" value="<?php echo htmlspecialchars($slot); ?>">
                
                <div class="tag-header">
                    <div class="tag-title">
                        <span class="tag-slot-label"><?php echo htmlspecialchars($slot); ?></span>
                        <span class="tag-purpose">(<?php echo htmlspecialchars($purpose); ?>)</span>
                    </div>
                    <div>
                        <?php if ($isConnected): ?>
                            <span class="status-badge status-connected">
                                <span class="dot"></span> Installed / Connected
                            </span>
                        <?php else: ?>
                            <span class="status-badge status-disconnected">
                                <span class="dot"></span> Disconnected
                            </span>
                        <?php endif; ?>
                    </div>
                </div>

                <div class="textarea-container">
                    <textarea 
                        name="tag_code" 
                        placeholder="Paste Monetag code snippet here (e.g. &lt;script src=&quot;https://quge5.com/...&quot;&gt;&lt;/script&gt;)"
                    ><?php echo htmlspecialchars($tag['tag_code'] ?? ''); ?></textarea>
                </div>

                <div class="tag-actions">
                    <?php if ($isConnected): ?>
                        <button type="submit" name="action" value="disconnect" class="btn-disconnect">
                            Disconnect
                        </button>
                        <button type="submit" name="action" value="connect" class="btn-connect">
                            Update & Keep Connected
                        </button>
                    <?php else: ?>
                        <button type="submit" name="action" value="connect" class="btn-connect">
                            Connect
                        </button>
                    <?php endif; ?>
                </div>
            </form>
        <?php endfor; ?>

        <div class="info-panel">
            <div><strong>Automatic Header Injection:</strong> All tags marked as <code>Installed / Connected</code> are loaded before <code>&lt;/head&gt;</code> in the website layout.</div>
            <div><strong>Disconnecting:</strong> Clicking <code>Disconnect</code> immediately stops the tag from loading on the site while preserving your pasted code for future reactivation.</div>
        </div>
    </div>
</body>
</html>
