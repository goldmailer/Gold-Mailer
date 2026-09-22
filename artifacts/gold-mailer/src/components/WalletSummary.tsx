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
      <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/15 to-primary/5 p-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-2"><Wallet size={14} className="text-primary" /> Earning Wallet</span>
          <Link href="/withdraw"><ArrowUpRight size={14} className="hover:text-primary" /></Link>
        </div>
        <p className="mt-3 text-2xl font-black text-primary">{isLoading ? "—" : money(data?.earningWallet)}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">Withdrawable via crypto</p>
      </div>
      <div className="rounded-2xl border border-blue-400/25 bg-gradient-to-br from-blue-400/15 to-blue-400/5 p-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-2"><Megaphone size={14} className="text-blue-300" /> Advertising Wallet</span>
          <Link href="/deposit"><ArrowUpRight size={14} className="hover:text-blue-300" /></Link>
        </div>
        <p className="mt-3 text-2xl font-black text-blue-300">{isLoading ? "—" : money(data?.advertisingWallet)}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">Only for posting tasks</p>
      </div>
    </div>
  );
}