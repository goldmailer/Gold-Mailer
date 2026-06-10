import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetDashboard, useGetStakes, useClaimDailyReward,
  getGetDashboardQueryKey, getGetStakesQueryKey, getGetMeQueryKey
} from "@workspace/api-client-react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { fmt as currencyFmt, getConfig } from "@/lib/currency";
import {
  TrendingUp, Wallet, Clock, Gift, ChevronRight, AlertCircle, CheckCircle2,
  ArrowUpCircle, ShieldCheck, ArrowRight, Lock, Check, Users,
  Calculator, Activity, BarChart3, Zap, Star, Trophy,
  CreditCard, Mail, Globe, Target, BadgeCheck
} from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/i18n/LanguageContext";

// ── Countdown timer ──────────────────────────────────────────────────────────
function Countdown({ endDate }: { endDate: string }) {
  const [remaining, setRemaining] = useState("");
  useEffect(() => {
    function calc() {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) { setRemaining("Ready"); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (d > 0) setRemaining(`${d}d ${h}h ${m}m`);
      else if (h > 0) setRemaining(`${h}h ${m}m ${s}s`);
      else setRemaining(`${m}m ${s}s`);
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [endDate]);
  const isReady = remaining === "Ready";
  return (
    <span className={`text-xs font-mono font-bold ${isReady ? "text-green-400" : "text-primary"}`}>
      {remaining}
    </span>
  );
}

// ── KYC Banner ───────────────────────────────────────────────────────────────
function KycBanner({ kycStatus }: { kycStatus: string }) {
  if (kycStatus === "approved") return null;
  if (kycStatus === "pending") {
    return (
      <div className="mx-4 sm:ml-16 mt-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-center gap-3">
            <Clock size={20} className="text-blue-400 shrink-0" />
            <div>
              <p className="text-sm font-bold text-blue-400">KYC Under Review</p>
              <p className="text-xs text-muted-foreground">Your ID has been submitted. We'll verify it within 24–48 hours and credit your $20 bonus.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (kycStatus === "declined") {
    return (
      <div className="mx-4 sm:ml-16 mt-4">
        <div className="max-w-5xl mx-auto">
          <Link href="/kyc">
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:bg-red-500/15 transition-colors">
              <AlertCircle size={20} className="text-red-400 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold text-red-400">KYC Declined — Resubmit</p>
                <p className="text-xs text-muted-foreground">Your ID was declined. Please upload a clearer photo. Tap here to try again.</p>
              </div>
              <ArrowRight size={16} className="text-red-400 shrink-0" />
            </div>
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="mx-4 sm:ml-16 mt-4">
      <div className="max-w-5xl mx-auto">
        <Link href="/kyc">
          <div className="bg-amber-500/10 border-2 border-amber-500/50 rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:bg-amber-500/15 transition-all group">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} className="text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-amber-400">Verify your account to unlock all access and claim your $20!</p>
              <p className="text-xs text-muted-foreground mt-0.5">Upload your ID (NIN, Voters Card, or Passport) to get verified.</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-xs font-bold text-amber-400 group-hover:translate-x-0.5 transition-transform">Verify Now</span>
              <ArrowRight size={14} className="text-amber-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}


// ── NEW: Investment Calculator ────────────────────────────────────────────────
function InvestmentCalculator({ country }: { country: string }) {
  const cfg = getConfig(country);
  const [amount, setAmount] = useState(cfg.minStake);
  const profit = Math.floor((amount / 2700) * 8000);
  const total = amount + profit;
  const roi = amount > 0 ? ((profit / amount) * 100).toFixed(0) : "0";

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
          <Calculator size={16} className="text-primary" />
        </div>
        <div>
          <h2 className="font-bold text-base">Investment Calculator</h2>
          <p className="text-xs text-muted-foreground">See your 7-day returns before staking</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-muted-foreground">Stake Amount</label>
            <span className="text-xs font-bold text-primary">{currencyFmt(amount, country)}</span>
          </div>
          <input
            type="range"
            min={cfg.minStake}
            max={cfg.maxStake}
            step={cfg.minStake}
            value={amount}
            onChange={e => setAmount(Number(e.target.value))}
            className="w-full h-2 bg-border rounded-full appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{currencyFmt(cfg.minStake, country)}</span>
            <span>{currencyFmt(cfg.maxStake, country)}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-background border border-border rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">You invest</p>
            <p className="text-sm font-black text-foreground">{currencyFmt(amount, country)}</p>
          </div>
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Profit</p>
            <p className="text-sm font-black text-green-400">+{currencyFmt(profit, country)}</p>
          </div>
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">You receive</p>
            <p className="text-sm font-black text-primary">{currencyFmt(total, country)}</p>
          </div>
        </div>

        <div className="flex items-center justify-between bg-background border border-border rounded-xl px-4 py-3">
          <span className="text-xs text-muted-foreground">Return on investment (7 days)</span>
          <span className="text-sm font-black text-green-400">{roi}% ROI</span>
        </div>

        <Link href="/stake">
          <Button className="w-full bg-primary text-primary-foreground hover:opacity-90 font-bold gap-2">
            <TrendingUp size={16} /> Stake {currencyFmt(amount, country)} Now
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ── NEW: Recent Activity ──────────────────────────────────────────────────────
function RecentActivity({ country }: { country: string }) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/transactions?limit=5", { credentials: "include" })
      .then(r => r.json())
      .then(d => { setTransactions(Array.isArray(d) ? d.slice(0, 5) : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const statusColors: Record<string, string> = {
    approved: "text-green-400 bg-green-400/10",
    pending: "text-amber-400 bg-amber-400/10",
    declined: "text-red-400 bg-red-400/10",
  };
  const typeLabels: Record<string, string> = {
    deposit: "Deposit",
    withdrawal: "Withdrawal",
    stake: "Stake",
    daily_reward: "Daily Reward",
    bonus: "Bonus",
    referral_bonus: "Referral Bonus",
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
            <Activity size={16} className="text-blue-400" />
          </div>
          <div>
            <h2 className="font-bold text-base">Recent Activity</h2>
            <p className="text-xs text-muted-foreground">Latest account transactions</p>
          </div>
        </div>
        <Link href="/transactions">
          <span className="text-xs text-primary flex items-center gap-0.5 hover:underline cursor-pointer">
            View all <ChevronRight size={12} />
          </span>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-8">
          <Activity size={28} className="text-muted-foreground mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">No transactions yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((tx: any) => (
            <div key={tx.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${statusColors[tx.status] ?? "text-muted-foreground bg-muted"}`}>
                {tx.type === "deposit" ? "D" : tx.type === "withdrawal" ? "W" : tx.type === "daily_reward" ? "R" : "B"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{typeLabels[tx.type] ?? tx.type}</p>
                <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-sm font-bold ${tx.type === "withdrawal" ? "text-orange-400" : "text-green-400"}`}>
                  {tx.type === "withdrawal" ? "-" : "+"}{currencyFmt(tx.amount, country)}
                </p>
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${statusColors[tx.status] ?? ""}`}>
                  {tx.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── NEW: Account Health Score ─────────────────────────────────────────────────
function AccountHealth({ user, hasStakes, isNG }: { user: any; hasStakes: boolean; isNG: boolean }) {
  const checks = [
    { label: "Email verified", done: true, icon: Mail },
    { label: "Profile complete", done: !!user?.profileComplete, icon: Users },
    { label: "Card added", done: !!(user as any)?.cardAdded, icon: CreditCard },
    ...(isNG ? [{ label: "KYC approved", done: user?.kycStatus === "approved", icon: BadgeCheck }] : []),
    { label: "First stake made", done: hasStakes, icon: TrendingUp },
  ];
  const score = Math.round((checks.filter(c => c.done).length / checks.length) * 100);
  const scoreColor = score === 100 ? "text-green-400" : score >= 60 ? "text-primary" : "text-amber-400";
  const barColor = score === 100 ? "bg-green-400" : score >= 60 ? "bg-primary" : "bg-amber-400";

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <Target size={16} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="font-bold text-base">Account Health</h2>
            <p className="text-xs text-muted-foreground">Profile completion score</p>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-2xl font-black ${scoreColor}`}>{score}%</span>
          {score === 100 && <p className="text-xs text-green-400">Complete!</p>}
        </div>
      </div>

      <div className="h-2 bg-border rounded-full mb-4 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${score}%` }} />
      </div>

      <div className="grid grid-cols-1 gap-2">
        {checks.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${c.done ? "bg-green-500/20" : "bg-border"}`}>
                {c.done
                  ? <Check size={11} className="text-green-400" />
                  : <span className="w-1.5 h-1.5 rounded-full bg-border block" />
                }
              </div>
              <Icon size={13} className={c.done ? "text-foreground" : "text-muted-foreground"} />
              <span className={`text-sm ${c.done ? "text-foreground" : "text-muted-foreground line-through opacity-60"}`}>{c.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── NEW: Platform Stats ───────────────────────────────────────────────────────
function PlatformStats() {
  const stats = [
    { label: "Active Members", value: "12,847", icon: Users, color: "text-blue-400" },
    { label: "Total Staked", value: "₦4.2B+", icon: TrendingUp, color: "text-primary" },
    { label: "Payouts Made", value: "₦890M+", icon: Wallet, color: "text-green-400" },
    { label: "Leaderboard Rank", value: "Live", icon: Trophy, color: "text-amber-400" },
  ];
  return (
    <div className="bg-gradient-to-br from-primary/8 to-amber-500/5 border border-primary/20 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Zap size={16} className="text-primary" />
        <h2 className="font-bold text-base">Platform Overview</h2>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-green-400 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Live
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-background/50 border border-border/50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={13} className={s.color} />
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
              <p className={`text-base font-black ${s.color}`}>{s.value}</p>
            </div>
          );
        })}
      </div>
      <Link href="/leaderboard">
        <div className="mt-3 flex items-center justify-center gap-2 py-2.5 bg-primary/10 border border-primary/20 rounded-xl hover:bg-primary/15 transition-colors cursor-pointer">
          <Trophy size={14} className="text-primary" />
          <span className="text-xs font-bold text-primary">View Leaderboard</span>
          <ChevronRight size={12} className="text-primary" />
        </div>
      </Link>
    </div>
  );
}

// ── NEW: Earnings Breakdown ───────────────────────────────────────────────────
function EarningsBreakdown({ dash, country }: { dash: any; country: string }) {
  if (!dash) return null;
  const staking = dash.totalProfit ?? 0;
  const deposited = (dash as any).totalDeposited ?? 0;
  const total = staking + deposited;
  if (total === 0) return null;

  const bars = [
    { label: "Staking Profit", value: staking, color: "bg-primary", pct: total > 0 ? (staking / total) * 100 : 0 },
    { label: "Total Deposited", value: deposited, color: "bg-blue-400", pct: total > 0 ? (deposited / total) * 100 : 0 },
  ].filter(b => b.value > 0);

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
          <BarChart3 size={16} className="text-primary" />
        </div>
        <div>
          <h2 className="font-bold text-base">Earnings Breakdown</h2>
          <p className="text-xs text-muted-foreground">Where your money comes from</p>
        </div>
      </div>
      <div className="space-y-4">
        {bars.map(bar => (
          <div key={bar.label}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${bar.color}`} />
                <span className="text-sm text-muted-foreground">{bar.label}</span>
              </div>
              <span className="text-sm font-bold">{currencyFmt(bar.value, country)}</span>
            </div>
            <div className="h-2 bg-border rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${bar.color} transition-all duration-700`} style={{ width: `${bar.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between pt-3 border-t border-border">
        <span className="text-sm text-muted-foreground font-medium">Total Activity</span>
        <span className="text-base font-black text-foreground">{currencyFmt(total, country)}</span>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();
  const cfg = getConfig(user?.country);

  const fmt = (n: number) => currencyFmt(n, user?.country);

  const { data: dash, isLoading: dashLoading } = useGetDashboard();
  const { data: stakes, isLoading: stakesLoading } = useGetStakes();

  const isNG = (user?.country ?? "NG") === "NG";
  const kycStatus = (user as any)?.kycStatus ?? "none";
  const isKycLocked = isNG && kycStatus !== "approved";
  const hasActiveStakes = Array.isArray(stakes) && stakes.length > 0;

  const claimMutation = useClaimDailyReward({
    mutation: {
      onSuccess: (data: any) => {
        toast({ title: t("dash.dailyRewardAvailable"), description: `${fmt(data.amount)} added to your balance.` });
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStakesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Cannot claim", description: err?.data?.error || err?.message || "Already claimed today", variant: "destructive" });
      },
    },
  });

  const [withdrawingId, setWithdrawingId] = useState<number | null>(null);
  const handleWithdrawToBalance = async (stakeId: number) => {
    setWithdrawingId(stakeId);
    try {
      const res = await fetch(`/api/stakes/${stakeId}/withdraw-to-balance`, { method: "POST", credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast({ title: "Withdrawn to balance!", description: `${fmt(data.amount)} added to your balance.` });
      queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetStakesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
    } catch (e: any) {
      toast({ title: "Withdrawal failed", description: e.message, variant: "destructive" });
    } finally {
      setWithdrawingId(null);
    }
  };

  const greeting = user?.firstName ? t("dash.welcomeBack", { name: user.firstName }) : "Welcome back";

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pl-0 pt-0">

        {/* KYC Banner */}
        {isNG && <KycBanner kycStatus={kycStatus} />}

        {/* ── Header / Balance ───────────────────────────────────── */}
        <div className="border-b border-border bg-card/30 mt-4">
          <div className="max-w-5xl mx-auto px-4 sm:pl-16 pt-6 pb-6">
            <p className="text-muted-foreground text-sm mb-1">{greeting}</p>
            <div className="flex items-end gap-4 flex-wrap">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t("dash.availableBalance")}</p>
                {dashLoading
                  ? <Skeleton className="h-10 w-44 mt-1" />
                  : <p className="text-4xl font-black text-primary" data-testid="text-balance">{fmt(dash?.balance ?? 0)}</p>
                }
              </div>
              {isNG && kycStatus === "approved" && (
                <div className="mb-1">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold">
                    <BadgeCheck size={13} /> Verified
                  </div>
                </div>
              )}
              {isNG && kycStatus === "none" && (
                <div className="mb-1">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium">
                    <Lock size={12} /> $20.00 bonus (locked — verify to claim)
                  </div>
                </div>
              )}
              {!dashLoading && dash?.dailyRewardAvailable && (
                <div className="mb-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-medium animate-pulse">
                    <Gift size={12} /> {t("dash.dailyRewardAvailable")}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:pl-16 py-8 space-y-8">

          {/* ── Stats grid ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: t("dash.totalStaked"), value: fmt(dash?.totalStaked ?? 0), icon: TrendingUp, color: "text-primary" },
              { label: t("dash.totalProfit"), value: fmt(dash?.totalProfit ?? 0), icon: Wallet, color: "text-green-400" },
              { label: t("dash.activeStakes"), value: String(dash?.activeStakes ?? 0), icon: Clock, color: "text-blue-400" },
              { label: "Completed Stakes", value: String((dash as any)?.completedStakes ?? 0), icon: CheckCircle2, color: "text-emerald-400" },
            ].map(stat => (
              <div key={stat.label} className={`bg-card border border-border rounded-xl p-4 ${isKycLocked ? "opacity-60" : ""}`}>
                <div className={`${stat.color} mb-2`}><stat.icon size={20} /></div>
                {dashLoading ? <Skeleton className="h-7 w-24 mb-1" /> : (
                  <p className="text-xl font-black text-foreground">
                    {isKycLocked ? <Lock size={16} className="text-muted-foreground" /> : stat.value}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* ── Extended analytics ─────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: "Total Deposited", value: fmt((dash as any)?.totalDeposited ?? 0), icon: ArrowUpCircle, color: "text-green-400" },
              { label: "Total Withdrawn", value: fmt((dash as any)?.totalWithdrawn ?? 0), icon: ArrowUpCircle, color: "text-orange-400" },
              { label: t("dash.pendingDeposits"), value: String(dash?.pendingDeposits ?? 0), icon: AlertCircle, color: "text-yellow-400" },
            ].map(stat => (
              <div key={stat.label} className={`bg-card border border-border rounded-xl p-4 ${isKycLocked ? "opacity-60" : ""}`}>
                <div className={`${stat.color} mb-2`}><stat.icon size={18} /></div>
                {dashLoading ? <Skeleton className="h-6 w-20 mb-1" /> : (
                  <p className="text-lg font-black text-foreground">
                    {isKycLocked ? <Lock size={14} className="text-muted-foreground" /> : stat.value}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* ── Quick actions ──────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { href: "/stake", label: t("dash.stakeNow"), bg: "bg-primary text-primary-foreground", locked: isKycLocked },
              { href: "/deposit", label: t("dash.deposit"), bg: "bg-card border border-border text-foreground hover:border-primary/50", locked: isKycLocked },
              { href: "/withdraw", label: t("dash.withdraw"), bg: "bg-card border border-border text-foreground hover:border-primary/50", locked: isKycLocked },
              { href: "/exchange", label: "Exchange", bg: "bg-card border border-border text-foreground hover:border-primary/50", locked: isKycLocked },
            ].map(action => (
              <div key={action.href}>
                {action.locked ? (
                  <Link href="/kyc">
                    <button className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors opacity-60 ${action.bg} flex items-center justify-center gap-2`}>
                      <Lock size={12} /> {action.label}
                    </button>
                  </Link>
                ) : (
                  <Link href={action.href}>
                    <button className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors ${action.bg}`}>
                      {action.label}
                    </button>
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* ── NEW: Account Health + Platform Stats (2-col) ─────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AccountHealth user={user} hasStakes={hasActiveStakes} isNG={isNG} />
            <PlatformStats />
          </div>

          {/* ── NEW: Investment Calculator ──────────────────────────── */}
          {!isKycLocked && (
            <InvestmentCalculator country={user?.country ?? "NG"} />
          )}

          {/* ── NEW: Recent Activity + Earnings Breakdown (2-col) ──── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RecentActivity country={user?.country ?? "NG"} />
            <EarningsBreakdown dash={dash} country={user?.country ?? "NG"} />
          </div>

          {/* KYC Prompt Card */}
          {isKycLocked && kycStatus === "none" && (
            <Link href="/kyc">
              <div className="bg-gradient-to-r from-amber-500/10 to-primary/10 border-2 border-amber-500/40 rounded-2xl p-6 flex items-center gap-4 cursor-pointer hover:from-amber-500/15 hover:to-primary/15 transition-all">
                <div className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                  <ShieldCheck size={28} className="text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="font-black text-lg text-amber-400">Unlock Full Access + $20 Bonus</p>
                  <p className="text-sm text-muted-foreground">Complete KYC verification to unlock staking, deposits, withdrawals, and claim your $20 signup bonus.</p>
                </div>
                <div className="shrink-0">
                  <div className="bg-amber-500 text-black font-bold text-sm px-4 py-2 rounded-xl flex items-center gap-1">
                    Verify <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* ── Active Stakes ────────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">{t("dash.activeStakesTitle")}</h2>
              <div className="flex items-center gap-3">
                {!isKycLocked && (
                  <Link href="/stake">
                    <span className="text-sm text-primary hover:underline cursor-pointer flex items-center gap-1">
                      {t("dash.newStake")} <ChevronRight size={14} />
                    </span>
                  </Link>
                )}
              </div>
            </div>

            {isKycLocked ? (
              <div className="text-center py-16 bg-card border border-border rounded-2xl opacity-60">
                <Lock size={40} className="text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-2">Verify your account to start staking</p>
                <Link href="/kyc">
                  <Button className="bg-amber-500 text-black hover:bg-amber-400 font-bold">
                    <ShieldCheck size={14} className="mr-2" /> Verify Now
                  </Button>
                </Link>
              </div>
            ) : stakesLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => <div key={i} className="h-32 rounded-xl bg-card border border-border animate-pulse" />)}
              </div>
            ) : !stakes || stakes.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-2xl">
                <TrendingUp size={40} className="text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">{t("dash.noActiveStakes")}</p>
                <Link href="/stake">
                  <Button className="bg-primary text-primary-foreground hover:opacity-90" data-testid="button-create-first-stake">
                    {t("dash.createFirstStake")}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {stakes.map((stake: any) => {
                  const isMatured = stake.daysRemaining === 0 && stake.status === "active";
                  return (
                    <div key={stake.id} data-testid={`card-stake-${stake.id}`}
                      className={`bg-card border rounded-xl p-5 flex items-start justify-between gap-4 flex-wrap ${isMatured ? "border-green-500/40 bg-green-500/5" : "border-border"}`}>
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            stake.status === "active" && !isMatured ? "bg-blue-500/15 text-blue-400" :
                            isMatured ? "bg-green-500/15 text-green-400" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {isMatured ? "MATURED" : stake.status.toUpperCase()}
                          </span>
                          {stake.status === "active" && <Countdown endDate={stake.endDate} />}
                        </div>
                        <p className="font-black text-xl text-foreground">{fmt(stake.amount)}</p>
                        <p className="text-sm text-green-400 font-medium">{t("dash.profit")} +{fmt(stake.profit)}</p>
                        <p className="text-xs text-muted-foreground">{t("dash.dailyClaimed")} {fmt(stake.totalDailyClaimed)}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span>Start: {new Date(stake.startDate).toLocaleDateString()}</span>
                          <span>·</span>
                          <span>End: {new Date(stake.endDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {isMatured && (
                          <Button size="sm" onClick={() => handleWithdrawToBalance(stake.id)}
                            disabled={withdrawingId === stake.id}
                            className="bg-green-500 hover:bg-green-400 text-black font-bold text-xs">
                            <ArrowUpCircle size={12} className="mr-1" />
                            {withdrawingId === stake.id ? "Withdrawing..." : `Withdraw ${fmt(stake.amount + stake.profit)}`}
                          </Button>
                        )}
                        {stake.status === "active" && !stake.dailyClaimedToday && !isMatured && (
                          <Button size="sm" onClick={() => claimMutation.mutate({ id: stake.id })}
                            disabled={claimMutation.isPending}
                            data-testid={`button-claim-daily-${stake.id}`}
                            className="bg-primary text-primary-foreground hover:opacity-90 text-xs">
                            <Gift size={12} className="mr-1" /> {t("dash.claim", { amount: fmt(cfg.dailyReward) })}
                          </Button>
                        )}
                        {stake.status === "active" && stake.dailyClaimedToday && !isMatured && (
                          <span className="text-xs text-muted-foreground">{t("dash.claimedToday")}</span>
                        )}
                        {stake.status !== "completed" && (
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">{t("dash.ends")}</p>
                            <p className="text-xs font-medium">{new Date(stake.endDate).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
