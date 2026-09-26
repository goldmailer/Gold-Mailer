<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CPX Research Surveys - TaskNest</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen antialiased">
    @php
        $userId = Auth::id();
        $secret = '7pSyJPPfNZYNV2zLirffBdjnTt39SY67';
        $generatedHash = isset($secureHash) ? $secureHash : md5($userId . '-' . $secret);
        $cpxIframeUrl = isset($iframeUrl)
            ? $iframeUrl
            : "https://offers.cpx-research.com/index.php?app_id=36554&ext_user_id={$userId}&secure_hash={$generatedHash}&subId_1=&subId_2=";
        $resultParam = request()->query('result');
    @endphp

    <header class="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <a href="/dashboard" class="text-lg font-extrabold tracking-tight text-white">
                    Task<span class="text-emerald-400">Nest</span>
                </a>
                <span class="text-slate-600">/</span>
                <span class="text-sm font-medium text-slate-300">CPX Research Surveys</span>
            </div>
            <div class="flex items-center gap-4 text-sm">
                <div class="px-3.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700">
                    <span class="text-slate-400">Balance:</span>
                    <span class="font-bold text-emerald-400 ml-1">{{ number_format(Auth::user()->coins ?? 0) }} Coins</span>
                </div>
                <a href="/dashboard/bitlabs" class="px-3.5 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 transition">
                    BitLabs Offerwall
                </a>
            </div>
        </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        @if($resultParam === 'success')
            <div class="mb-6 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-4 text-emerald-300 font-semibold flex items-center justify-between">
                <span>Survey completed! Coins credited soon.</span>
                <span class="text-xs text-emerald-400">700 Coins = $1.00 USD</span>
            </div>
        @elseif($resultParam === 'screenout_bonus')
            <div class="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 px-5 py-4 text-amber-300 font-semibold flex items-center justify-between">
                <span>You got bonus</span>
                <span class="text-xs text-amber-400">70 Coins = $1.00 USD Screenout Bonus</span>
            </div>
        @endif

        <div class="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
            <iframe
                src="{{ $cpxIframeUrl }}"
                width="100%"
                height="2000px"
                frameborder="0"
                class="w-full h-[2000px] border-0"
                style="width: 100%; height: 2000px; border: none;"
            ></iframe>
        </div>
    </main>
</body>
</html>
