import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateStake, getGetStakesQueryKey, getGetDashboardQueryKey, getGetMeQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { getConfig, fmt as currencyFmt } from "@/lib/currency";
import { TrendingUp, Info, AlertTriangle } from "lucide-react";
import { Link } from "wouter";

export default function Stake() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");

  const cfg = getConfig(user?.country);
  const fmt = (n: number) => currencyFmt(n, user?.country);
  const isNGN = !user?.country || user.country === "NG";
  const presets = isNGN ? [2700, 5000, 10000, 50000] : [3, 10, 25, 100];

  const numAmount = parseFloat(amount) || 0;
  const profit = numAmount >= cfg.minStake ? Math.floor((numAmount / cfg.minStake) * cfg.baseProfit) : 0;
  const totalAfter7Days = numAmount + profit + cfg.dailyReward * 7;
  const isValid = numAmount >= cfg.minStake && numAmount <= cfg.maxStake && numAmount <= (user?.balance ?? 0) && (user?.hasDeposited ?? false);

  const mutation = useCreateStake({
    mutation: {
      onSuccess: () => {
        toast({ title: "Stake created!", description: `${fmt(numAmount)} is now staking for 7 days.` });
        queryClient.invalidateQueries({ queryKey: getGetStakesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setAmount("");
      },
      onError: (err: any) => {
        toast({ title: "Stake failed", description: err?.data?.error || err?.message || "Something went wrong", variant: "destructive" });
      },
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pl-16 pt-16 max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-black mb-1">Create a Stake</h1>
        <p className="text-muted-foreground text-sm mb-8">Lock funds for 7 days and earn guaranteed profit</p>

        {/* Deposit-first gate */}
        {!user?.hasDeposited && (
          <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-5 mb-6 flex gap-4 items-start">
            <AlertTriangle size={20} className="text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-amber-300 mb-1">Deposit required before staking</p>
              <p className="text-sm text-muted-foreground mb-3">
                You need to make a real deposit and have it approved by our team before you can start staking. Your signup bonus alone is not enough.
              </p>
              <Link href="/deposit">
                <Button size="sm" className="bg-amber-500 hover:bg-amber-400 text-black font-bold">
                  Make a Deposit
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Balance card */}
        <div className="bg-card border border-border rounded-xl p-5 mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Available Balance</p>
            <p className="text-2xl font-black text-primary mt-1" data-testid="text-balance">
              {fmt(user?.balance ?? 0)}
            </p>
          </div>
          <TrendingUp size={32} className="text-primary/30" />
        </div>

        {/* Amount input */}
        <div className={`bg-card border border-border rounded-2xl p-6 mb-6 ${!user?.hasDeposited ? "opacity-50 pointer-events-none" : ""}`}>
          <label className="block text-sm font-medium mb-3">Stake Amount ({cfg.symbol})</label>
          <div className="relative mb-2">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-lg">{cfg.symbol}</span>
            <Input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
              min={cfg.minStake}
              max={cfg.maxStake}
              data-testid="input-stake-amount"
              className="pl-10 py-6 text-2xl font-black"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {presets.map(preset => (
              <button key={preset} onClick={() => setAmount(String(preset))}
                data-testid={`button-preset-${preset}`}
                className="px-3 py-1.5 text-xs rounded-lg border border-border hover:border-primary hover:text-primary transition-colors">
                {fmt(preset)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
            <Info size={12} />
            <span>Min: {fmt(cfg.minStake)} — Max: {fmt(cfg.maxStake)}</span>
          </div>
        </div>

        {/* Profit preview */}
        {numAmount >= cfg.minStake && user?.hasDeposited && (
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-5 mb-6 space-y-3">
            <h3 className="font-bold text-primary">Earnings Preview</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground mb-1">You Stake</p>
                <p className="font-black text-lg" data-testid="text-stake-amount">{fmt(numAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">After 7 Days</p>
                <p className="font-black text-lg text-green-400" data-testid="text-stake-profit">+{fmt(profit)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Daily Reward</p>
                <p className="font-black text-lg text-primary">+{fmt(cfg.dailyReward)}</p>
              </div>
            </div>
            <div className="border-t border-primary/20 pt-3 flex justify-between">
              <span className="text-sm font-medium">Total after 7 days</span>
              <span className="font-black text-lg text-green-400">{fmt(totalAfter7Days)}</span>
            </div>
          </div>
        )}

        {numAmount > (user?.balance ?? 0) && numAmount > 0 && user?.hasDeposited && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 mb-4 text-destructive text-sm">
            Insufficient balance. You need {fmt(numAmount - (user?.balance ?? 0))} more.
          </div>
        )}

        <Button
          className="w-full bg-primary text-primary-foreground hover:opacity-90 py-5 font-bold text-base"
          disabled={!isValid || mutation.isPending}
          onClick={() => mutation.mutate({ data: { amount: numAmount } })}
          data-testid="button-stake-submit"
        >
          {mutation.isPending ? "Creating Stake..." : `Stake ${numAmount >= cfg.minStake ? fmt(numAmount) : ""}`}
        </Button>

        <div className="mt-6 bg-card border border-border rounded-xl p-4">
          <h3 className="font-semibold text-sm mb-3">How Staking Works</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2"><span className="text-primary">1.</span> Deposit the minimum of {fmt(cfg.minStake)} to stake</li>
            <li className="flex gap-2"><span className="text-primary">2.</span> Funds are locked for 7 days</li>
            <li className="flex gap-2"><span className="text-primary">3.</span> Claim {fmt(cfg.dailyReward)} daily reward each day</li>
            <li className="flex gap-2"><span className="text-primary">4.</span> After 7 days, withdraw your stake + profit</li>
            <li className="flex gap-2"><span className="text-primary">5.</span> Multiple stakes are allowed simultaneously</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
