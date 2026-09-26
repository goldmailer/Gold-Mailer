import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Coins, ExternalLink, ArrowLeft, ShieldCheck } from "lucide-react";

const BITLABS_TOKEN = "8f1daa8f-fdbc-41e7-9010-45973b88e45";

export default function BitlabsOfferwall() {
  const { user } = useAuth();
  const userId = user?.id ?? 0;
  const [coins, setCoins] = useState<number>(0);

  useEffect(() => {
    fetch("/api/offerwalls/config", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (typeof data?.coins === "number") setCoins(data.coins);
      })
      .catch(() => {});
  }, [userId]);

  const iframeUrl = `https://web.bitlabs.ai?token=${BITLABS_TOKEN}&uid=${userId}`;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Sidebar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#888888] mb-1">
              <Link href="/dashboard" className="hover:text-white inline-flex items-center gap-1 transition-colors">
                <ArrowLeft size={14} /> Dashboard
              </Link>
              <span>/</span>
              <span className="text-[#00ff88] font-semibold">BitLabs Offerwall</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              BitLabs Surveys & Offers
            </h1>
            <p className="text-xs sm:text-sm text-[#888888] mt-1">
              Rate: <span className="text-white font-semibold">700 Coins = $1.00 USD</span> · Instant S2S Callback Crediting
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#1a1a1a] border border-[#262626] px-4 py-2.5 flex items-center gap-2.5">
              <Coins size={18} className="text-[#00ff88]" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#888888] font-semibold">Your Coins</p>
                <p className="text-sm font-black text-white tabular-nums">{coins.toLocaleString()} Coins</p>
              </div>
            </div>
            <Link
              href="/dashboard/surveys"
              className="rounded-xl bg-[#1a1a1a] hover:bg-[#262626] border border-[#262626] px-4 py-2.5 text-xs font-bold text-white transition-colors inline-flex items-center gap-1.5"
            >
              CPX Surveys <ExternalLink size={14} />
            </Link>
          </div>
        </div>

        {/* Offerwall Iframe Container */}
        <div className="rounded-2xl bg-[#141414] border border-[#262626] overflow-hidden shadow-xl">
          <div className="px-4 py-3 bg-[#1a1a1a] border-b border-[#262626] flex flex-wrap items-center justify-between gap-2 text-xs text-[#888888]">
            <span className="inline-flex items-center gap-1.5 text-zinc-300 font-medium">
              <ShieldCheck size={15} className="text-[#00ff88]" />
              BitLabs Official Web Offerwall (UID: {userId})
            </span>
            <a
              href={iframeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#00ff88] hover:underline font-semibold inline-flex items-center gap-1"
            >
              Open in New Tab <ExternalLink size={12} />
            </a>
          </div>

          <iframe
            src={iframeUrl}
            title="BitLabs Offerwall"
            className="w-full h-[2000px] border-0"
            style={{ width: "100%", height: "2000px", border: "none" }}
            allow="clipboard-write"
          />
        </div>
      </main>
    </div>
  );
}
