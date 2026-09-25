import { Link } from "wouter";
import { ArrowUpRight, Megaphone, Wallet } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Wallets } from "@/lib/marketplace";

export function WalletSummary({ compact = false }: { compact?: boolean }) {
  const { data, isLoading } = useQuery<Wallets>({
    queryKey: ["marketplace-wallets"],
    queryFn: async () => {
      const response = await fetch("/api/marketplace/wallets", { credentials: "include" });
      if (!response.ok) throw new Error("Unable to load wallets");
      return response.json();
    },
    staleTime: 15_000,
  });

  const money = (value = 0) => `$${value.toFixed(2)}`;

  return (
    <div className={`grid ${compact ? "sm:grid-cols-2" : "md:grid-cols-2"} gap-3`}>
      <div className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-4">
        <div className="flex items-center justify-between text-xs text-[#888888]">
          <span className="flex items-center gap-2">
            <Wallet size={14} className="text-[#00ff88]" /> Earning Wallet
          </span>
          <Link href="/withdraw" className="text-[#888888] hover:text-[#00ff88] transition-colors">
            <ArrowUpRight size={14} />
          </Link>
        </div>
        <p className="mt-3 text-2xl font-black text-[#00ff88]">{isLoading ? "—" : money(data?.earningWallet)}</p>
        <p className="mt-1 text-[11px] text-[#888888]">Withdrawable via crypto</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-4">
        <div className="flex items-center justify-between text-xs text-[#888888]">
          <span className="flex items-center gap-2">
            <Megaphone size={14} className="text-[#00ff88]" /> Advertising Wallet
          </span>
          <Link href="/deposit" className="text-[#888888] hover:text-[#00ff88] transition-colors">
            <ArrowUpRight size={14} />
          </Link>
        </div>
        <p className="mt-3 text-2xl font-black text-white">{isLoading ? "—" : money(data?.advertisingWallet)}</p>
        <p className="mt-1 text-[11px] text-[#888888]">Only for posting tasks</p>
      </div>
    </div>
  );
}
