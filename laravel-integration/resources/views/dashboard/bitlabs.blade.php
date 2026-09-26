<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BitLabs Offerwall - TaskNest</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen antialiased">
    @php
        $userId = Auth::id();
        $bitlabsUrl = isset($iframeUrl)
            ? $iframeUrl
            : "https://web.bitlabs.ai?token=8f1daa8f-fdbc-41e7-9010-45973b88e45&uid={$userId}";
    @endphp

    <header class="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <a href="/dashboard" class="text-lg font-extrabold tracking-tight text-white">
                    Task<span class="text-emerald-400">Nest</span>
                </a>
                <span class="text-slate-600">/</span>
                <span class="text-sm font-medium text-slate-300">BitLabs Offerwall</span>
            </div>
            <div class="flex items-center gap-4 text-sm">
                <div class="px-3.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700">
                    <span class="text-slate-400">Balance:</span>
                    <span class="font-bold text-emerald-400 ml-1">{{ number_format(Auth::user()->coins ?? 0) }} Coins</span>
                </div>
                <a href="/dashboard/surveys" class="px-3.5 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 transition">
                    CPX Surveys
                </a>
            </div>
        </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
            <iframe
                src="{{ $bitlabsUrl }}"
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
